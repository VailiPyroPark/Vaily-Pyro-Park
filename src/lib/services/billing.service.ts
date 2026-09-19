import { createClient } from '@/lib/supabase/client';
import { Order, OrderItem } from '@/types';

export interface BillingItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image_url?: string;
  pack_size?: string;
}

export interface DraftBill {
  id: string;
  draft_number: string;
  customer_name?: string;
  customer_mobile?: string;
  shipping_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  items: BillingItem[];
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  grand_total: number;
  payment_method?: string;
  is_paid?: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBillDTO {
  customer_name: string;
  customer_mobile: string;
  shipping_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  items: BillingItem[];
  subtotal: number;
  discount_amount?: number;
  delivery_fee?: number;
  grand_total: number;
  payment_method?: string;
  is_paid?: boolean;
  admin_notes?: string;
}

const DRAFT_BILLS_KEY = 'vpp_admin_draft_bills_v1';
const SAVED_BILLS_BACKUP_KEY = 'vpp_admin_saved_bills_v1';

export class BillingService {
  private static getSupabase() {
    return createClient();
  }

  /**
   * Generate sequential bill number
   */
  public static async generateBillNumber(): Promise<string> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase.rpc('next_bill_number');
      if (!error && data && typeof data === 'string') {
        return data;
      }
    } catch {
      // Fallback if RPC function is not installed yet
    }

    const year = new Date().getFullYear();
    const seq = Date.now().toString().slice(-5);
    return `BILL-${year}-${seq}`;
  }

  /**
   * Save and finalize a bill into Supabase (bills table) & local backup
   */
  public static async createSavedBill(dto: CreateBillDTO): Promise<Order> {
    if (!dto.customer_name?.trim()) {
      throw new Error('Customer Name is required.');
    }
    if (!dto.customer_mobile?.trim()) {
      throw new Error('Customer Mobile Number is required.');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Please select at least one product.');
    }

    const billNumber = await this.generateBillNumber();
    const now = new Date().toISOString();
    const subtotal = dto.subtotal || dto.items.reduce((sum, i) => sum + i.total_price, 0);
    const discountAmount = dto.discount_amount || 0;
    const deliveryFee = dto.delivery_fee || 0;
    const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

    const notesPrefix = '[ADMIN_BILL]';
    const combinedNotes = dto.admin_notes
      ? `${notesPrefix} ${dto.admin_notes.trim()}`
      : notesPrefix;

    let savedOrder: Order | null = null;

    // 1. Attempt insert into dedicated 'bills' table first
    try {
      const supabase = this.getSupabase();
      const billPayload = {
        bill_number: billNumber,
        customer_name: dto.customer_name.trim(),
        customer_mobile: dto.customer_mobile.trim(),
        customer_email: null,
        shipping_address: (dto.shipping_address || 'Direct Warehouse Pickup').trim(),
        city: (dto.city || 'Sivakasi').trim(),
        state: (dto.state || 'Tamil Nadu').trim(),
        pincode: (dto.pincode || '626123').trim(),
        subtotal,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        grand_total: grandTotal,
        payment_method: dto.payment_method || 'CASH',
        is_paid: dto.is_paid ?? true,
        admin_notes: dto.admin_notes?.trim() || null,
        created_at: now,
        updated_at: now,
      };

      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert(billPayload)
        .select()
        .single();

      if (!billError && billData) {
        const billItemsPayload = dto.items.map((item) => ({
          bill_id: billData.id,
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price,
          pack_size: item.pack_size || null,
        }));

        const { data: itemsData } = await supabase
          .from('bill_items')
          .insert(billItemsPayload)
          .select();

        savedOrder = {
          id: billData.id,
          order_number: billData.bill_number,
          customer_name: billData.customer_name,
          customer_mobile: billData.customer_mobile,
          customer_email: billData.customer_email || undefined,
          shipping_address: billData.shipping_address,
          city: billData.city,
          state: billData.state,
          pincode: billData.pincode,
          subtotal: Number(billData.subtotal),
          discount_amount: Number(billData.discount_amount || 0),
          delivery_fee: Number(billData.delivery_fee || 0),
          grand_total: Number(billData.grand_total),
          status: 'CONFIRMED',
          is_paid: billData.is_paid,
          payment_method: billData.payment_method,
          admin_notes: billData.admin_notes,
          created_at: billData.created_at,
          updated_at: billData.updated_at,
          items: (itemsData as any[]) || dto.items.map((i, idx) => ({
            id: `item-${idx}`,
            product_id: i.product_id,
            product_name: i.product_name,
            unit_price: i.unit_price,
            quantity: i.quantity,
            total_price: i.total_price,
          })),
        };
      }
    } catch (err) {
      console.warn('Dedicated bills table insert failed, falling back to orders:', err);
    }

    // 2. Fallback to orders table if bills table is not set up
    if (!savedOrder) {
      try {
        const supabase = this.getSupabase();
        const orderPayload = {
          order_number: billNumber,
          customer_name: dto.customer_name.trim(),
          customer_mobile: dto.customer_mobile.trim(),
          customer_email: null,
          shipping_address: (dto.shipping_address || 'Direct Warehouse Pickup').trim(),
          city: (dto.city || 'Sivakasi').trim(),
          state: (dto.state || 'Tamil Nadu').trim(),
          pincode: (dto.pincode || '626123').trim(),
          subtotal,
          discount_amount: discountAmount,
          delivery_fee: deliveryFee,
          grand_total: grandTotal,
          status: 'CONFIRMED' as const,
          is_paid: dto.is_paid ?? true,
          payment_method: dto.payment_method || 'CASH',
          admin_notes: combinedNotes,
          created_at: now,
          updated_at: now,
        };

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();

        if (!orderError && orderData) {
          const orderItemsPayload = dto.items.map((item) => ({
            order_id: orderData.id,
            product_id: item.product_id,
            product_name: item.product_name,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total_price: item.total_price,
          }));

          const { data: itemsData } = await supabase
            .from('order_items')
            .insert(orderItemsPayload)
            .select();

          savedOrder = {
            ...orderData,
            grand_total: Number(orderData.grand_total),
            subtotal: Number(orderData.subtotal),
            delivery_fee: Number(orderData.delivery_fee || 0),
            discount_amount: Number(orderData.discount_amount || 0),
            items: (itemsData as OrderItem[]) || dto.items.map((i, idx) => ({
              id: `item-${idx}`,
              product_id: i.product_id,
              product_name: i.product_name,
              unit_price: i.unit_price,
              quantity: i.quantity,
              total_price: i.total_price,
            })),
          };
        }
      } catch (err) {
        console.warn('Orders table fallback insert exception:', err);
      }
    }

    // 3. Client-side local fallback if database is unavailable
    if (!savedOrder) {
      const mockId = `bill-${Date.now()}`;
      savedOrder = {
        id: mockId,
        order_number: billNumber,
        customer_name: dto.customer_name.trim(),
        customer_mobile: dto.customer_mobile.trim(),
        shipping_address: (dto.shipping_address || 'Direct Warehouse Pickup').trim(),
        city: (dto.city || 'Sivakasi').trim(),
        state: (dto.state || 'Tamil Nadu').trim(),
        pincode: (dto.pincode || '626123').trim(),
        subtotal,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        grand_total: grandTotal,
        status: 'CONFIRMED',
        is_paid: dto.is_paid ?? true,
        payment_method: dto.payment_method || 'CASH',
        admin_notes: combinedNotes,
        created_at: now,
        updated_at: now,
        items: dto.items.map((i, idx) => ({
          id: `item-${idx}`,
          product_id: i.product_id,
          product_name: i.product_name,
          unit_price: i.unit_price,
          quantity: i.quantity,
          total_price: i.total_price,
        })),
      };
    }

    // Persist into local saved bills backup cache
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SAVED_BILLS_BACKUP_KEY);
        const existing: Order[] = raw ? JSON.parse(raw) : [];
        const updated = [savedOrder, ...existing.filter((b) => b.id !== savedOrder?.id)];
        localStorage.setItem(SAVED_BILLS_BACKUP_KEY, JSON.stringify(updated.slice(0, 300)));
      } catch (err) {
        console.warn('Failed to cache saved bill:', err);
      }
    }

    return savedOrder;
  }

  /**
   * Retrieve all saved bills (checking Supabase bills, orders with [ADMIN_BILL], and local cache)
   */
  public static async getSavedBills(): Promise<Order[]> {
    const billsMap = new Map<string, Order>();

    // 1. Load from localStorage backup first for instant display
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SAVED_BILLS_BACKUP_KEY);
        if (raw) {
          const localBills: Order[] = JSON.parse(raw);
          localBills.forEach((b) => billsMap.set(b.id || b.order_number, b));
        }
      } catch (err) {
        console.warn('Failed to read local saved bills:', err);
      }
    }

    // 2. Fetch from Supabase dedicated 'bills' table
    try {
      const supabase = this.getSupabase();
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*, items:bill_items(*)')
        .order('created_at', { ascending: false });

      if (!billsError && billsData && billsData.length > 0) {
        billsData.forEach((item: any) => {
          const billOrder: Order = {
            id: item.id,
            order_number: item.bill_number || item.order_number,
            customer_name: item.customer_name,
            customer_mobile: item.customer_mobile,
            customer_email: item.customer_email || undefined,
            shipping_address: item.shipping_address,
            city: item.city,
            state: item.state,
            pincode: item.pincode,
            subtotal: Number(item.subtotal),
            discount_amount: Number(item.discount_amount || 0),
            delivery_fee: Number(item.delivery_fee || 0),
            grand_total: Number(item.grand_total),
            status: 'CONFIRMED',
            admin_notes: item.admin_notes,
            courier_partner: item.courier_partner,
            tracking_number: item.tracking_number,
            is_paid: item.is_paid ?? true,
            payment_method: item.payment_method ?? 'CASH',
            created_at: item.created_at,
            updated_at: item.updated_at,
            items: item.items
              ? item.items.map((i: any) => ({
                  id: i.id,
                  product_id: i.product_id,
                  product_name: i.product_name,
                  unit_price: Number(i.unit_price),
                  quantity: i.quantity,
                  total_price: Number(i.total_price),
                }))
              : [],
          };
          billsMap.set(billOrder.id, billOrder);
        });
      }
    } catch (err) {
      console.warn('Could not query dedicated bills table, trying orders:', err);
    }

    // 3. Also fetch from Supabase orders with [ADMIN_BILL] tag for backwards compatibility
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .ilike('admin_notes', '%[ADMIN_BILL]%')
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((item: any) => {
          const order: Order = {
            id: item.id,
            order_number: item.order_number,
            customer_name: item.customer_name,
            customer_mobile: item.customer_mobile,
            customer_email: item.customer_email,
            shipping_address: item.shipping_address,
            city: item.city,
            state: item.state,
            pincode: item.pincode,
            subtotal: Number(item.subtotal),
            discount_amount: Number(item.discount_amount || 0),
            delivery_fee: Number(item.delivery_fee || 0),
            grand_total: Number(item.grand_total),
            status: item.status,
            admin_notes: item.admin_notes,
            courier_partner: item.courier_partner,
            tracking_number: item.tracking_number,
            is_paid: item.is_paid ?? true,
            payment_method: item.payment_method ?? 'CASH',
            created_at: item.created_at,
            updated_at: item.updated_at,
            items: item.items
              ? item.items.map((i: any) => ({
                  id: i.id,
                  product_id: i.product_id,
                  product_name: i.product_name,
                  unit_price: Number(i.unit_price),
                  quantity: i.quantity,
                  total_price: Number(i.total_price),
                }))
              : [],
          };
          billsMap.set(order.id, order);
        });
      }
    } catch (err) {
      console.warn('Failed to fetch saved bills from Supabase orders:', err);
    }

    const result = Array.from(billsMap.values());
    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Draft Bills Management (stored locally in browser for quick access and resume)
   */
  public static getDraftBills(): DraftBill[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(DRAFT_BILLS_KEY);
      if (!raw) return [];
      const drafts: DraftBill[] = JSON.parse(raw);
      return drafts.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } catch (err) {
      console.warn('Failed to load draft bills:', err);
      return [];
    }
  }

  public static saveDraftBill(draft: Omit<DraftBill, 'id' | 'draft_number' | 'created_at' | 'updated_at'> & { id?: string }): DraftBill {
    if (typeof window === 'undefined') {
      throw new Error('Draft bills can only be saved in the browser.');
    }
    const drafts = this.getDraftBills();
    const now = new Date().toISOString();
    const existingIndex = draft.id ? drafts.findIndex((d) => d.id === draft.id) : -1;

    let savedDraft: DraftBill;

    if (existingIndex >= 0) {
      savedDraft = {
        ...drafts[existingIndex],
        ...draft,
        updated_at: now,
      };
      drafts[existingIndex] = savedDraft;
    } else {
      const draftId = `draft-${Date.now()}`;
      const draftNum = `DRAFT-${Date.now().toString().slice(-4)}`;
      savedDraft = {
        ...draft,
        id: draftId,
        draft_number: draftNum,
        created_at: now,
        updated_at: now,
      };
      drafts.unshift(savedDraft);
    }

    try {
      localStorage.setItem(DRAFT_BILLS_KEY, JSON.stringify(drafts));
    } catch (err) {
      console.error('Failed to save draft bills to localStorage:', err);
    }

    return savedDraft;
  }

  public static deleteDraftBill(draftId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const drafts = this.getDraftBills();
      const updated = drafts.filter((d) => d.id !== draftId);
      localStorage.setItem(DRAFT_BILLS_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Failed to delete draft bill:', err);
      return false;
    }
  }

  public static async deleteSavedBill(billId: string): Promise<boolean> {
    // 1. Remove from local backup
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SAVED_BILLS_BACKUP_KEY);
        if (raw) {
          const existing: Order[] = JSON.parse(raw);
          const updated = existing.filter((b) => b.id !== billId && b.order_number !== billId);
          localStorage.setItem(SAVED_BILLS_BACKUP_KEY, JSON.stringify(updated));
        }
      } catch {}
    }

    // 2. Remove from Supabase (both bills and orders)
    try {
      const supabase = this.getSupabase();
      await Promise.allSettled([
        supabase.from('bills').delete().eq('id', billId),
        supabase.from('orders').delete().eq('id', billId),
      ]);
      return true;
    } catch (err) {
      console.warn('Failed to delete bill from Supabase:', err);
      return true;
    }
  }
}
