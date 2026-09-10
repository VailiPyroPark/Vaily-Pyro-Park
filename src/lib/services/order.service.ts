import { createClient } from '@/lib/supabase/client';
import { Order, OrderStatus, OrderItem } from '@/types';
import { PricingService, CheckoutPayloadItem } from './pricing.service';
import { ProductService } from './product.service';

export interface CreateOrderDTO {
  customer_name: string;
  customer_mobile: string;
  customer_email?: string;
  shipping_address: string;
  city: string;
  state: string;
  pincode: string;
  items: CheckoutPayloadItem[];
}

export class OrderService {
  private static getSupabase() {
    return createClient();
  }

  /**
   * Generate a sequential order number using the DB sequence.
   * Falls back to timestamp-based suffix if sequence function unavailable.
   */
  private static async generateOrderNumber(): Promise<string> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase.rpc('next_order_number');
      if (!error && data) return data as string;
    } catch {
      // Sequence function not yet available — use timestamp fallback
    }
    const year = new Date().getFullYear();
    const seq = Date.now().toString().slice(-5);
    return `VPP-${year}-${seq}`;
  }

  static async createOrder(dto: CreateOrderDTO): Promise<Order> {
    if (
      !dto.customer_name ||
      !dto.customer_mobile ||
      !dto.shipping_address ||
      !dto.city ||
      !dto.state ||
      !dto.pincode
    ) {
      throw new Error('Please fill in all mandatory delivery address fields.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('Your cart is empty.');
    }

    // Fetch live products and delivery zones from DB for authoritative pricing
    const [products, zones] = await Promise.all([
      ProductService.getAllProducts(),
      PricingService.fetchDeliveryZones(),
    ]);

    const pricing = PricingService.calculateOrderPricing(dto.items, dto.state, products, zones);

    if (!pricing.isMinOrderMet) {
      throw new Error(
        `Minimum order required for ${pricing.zoneName} is ₹${pricing.minOrderThreshold.toLocaleString()}. Your subtotal is ₹${pricing.subtotal.toLocaleString()}.`
      );
    }

    const orderNumber = await this.generateOrderNumber();
    const now = new Date().toISOString();

    const newOrderPayload = {
      order_number: orderNumber,
      customer_name: dto.customer_name.trim(),
      customer_mobile: dto.customer_mobile.trim(),
      customer_email: dto.customer_email?.trim() || null,
      shipping_address: dto.shipping_address.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
      pincode: dto.pincode.trim(),
      subtotal: pricing.subtotal,
      discount_amount: pricing.discountAmount,
      delivery_fee: pricing.deliveryFee,
      grand_total: pricing.grandTotal,
      status: 'PENDING' as OrderStatus,
      is_paid: false,
      payment_method: 'COD',
      created_at: now,
      updated_at: now,
    };

    const supabase = this.getSupabase();
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(newOrderPayload)
      .select()
      .single();

    if (orderError || !orderData) {
      throw orderError || new Error('Failed to create order. Please try again.');
    }

    // Insert order items
    const orderItemsPayload = pricing.items.map((item) => ({
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

    const createdOrder: Order = {
      ...orderData,
      grand_total: Number(orderData.grand_total),
      subtotal: Number(orderData.subtotal),
      delivery_fee: Number(orderData.delivery_fee),
      discount_amount: Number(orderData.discount_amount),
      items: itemsData || pricing.items,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vpp_last_created_order', JSON.stringify(createdOrder));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('vpp_orders_channel');
          bc.postMessage({ type: 'NEW_ORDER', order: createdOrder });
          bc.close();
        }
      } catch (e) {
        console.error('Failed to broadcast order creation:', e);
      }
    }

    return createdOrder;
  }

  static async getOrderById(id: string): Promise<Order | null> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .or(`id.eq.${id},order_number.eq.${id}`)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      grand_total: Number(data.grand_total),
      subtotal: Number(data.subtotal),
      delivery_fee: Number(data.delivery_fee),
      discount_amount: Number(data.discount_amount),
    };
  }

  static async getAllOrders(): Promise<Order[]> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('OrderService.getAllOrders error:', error?.message);
      return [];
    }

    return data.map((item: any) => ({
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
      estimated_delivery: item.estimated_delivery,
      is_paid: item.is_paid ?? false,
      payment_method: item.payment_method ?? 'COD',
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
    }));
  }

  static async updateOrderStatus(
    id: string,
    status: OrderStatus,
    adminNotes?: string
  ): Promise<Order> {
    const supabase = this.getSupabase();
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*, items:order_items(*)')
      .single();

    if (error || !data) {
      console.error('OrderService.updateOrderStatus error:', error?.message);
      throw new Error(error?.message || `Failed to update order ${id}.`);
    }

    const updatedOrder: Order = {
      ...data,
      grand_total: Number(data.grand_total),
      subtotal: Number(data.subtotal),
      delivery_fee: Number(data.delivery_fee),
      discount_amount: Number(data.discount_amount),
    };

    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('vpp_orders_channel');
          bc.postMessage({
            type: 'ORDER_STATUS_CHANGED',
            orderId: id,
            orderNumber: updatedOrder.order_number,
            status,
            order: updatedOrder,
          });
          bc.close();
        }
      } catch (e) {
        console.error('Failed to broadcast order status update:', e);
      }
    }

    return updatedOrder;
  }

  static async cancelOrder(
    id: string,
    reason?: string,
    cancelledBy: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER'
  ): Promise<Order> {
    const supabase = this.getSupabase();

    // First retrieve current order to verify status and preserve notes
    const current = await this.getOrderById(id);
    if (!current) {
      throw new Error(`Order ${id} not found.`);
    }

    if (current.status === 'CANCELLED') {
      return current;
    }

    if (current.status === 'DELIVERED') {
      throw new Error('Delivered orders cannot be cancelled.');
    }

    if (cancelledBy === 'CUSTOMER' && current.status === 'DISPATCHED') {
      throw new Error(
        'Your order has already been dispatched with the courier and cannot be cancelled online. Please contact support on WhatsApp to request an interception.'
      );
    }

    const timestamp = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const notePrefix = cancelledBy === 'CUSTOMER' ? '[Customer Cancellation]' : '[Admin Cancellation]';
    const reasonText = reason ? `${notePrefix} (${timestamp}): ${reason}` : `${notePrefix} (${timestamp}): Order cancelled.`;
    const updatedNotes = current.admin_notes
      ? `${current.admin_notes}\n${reasonText}`
      : reasonText;

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'CANCELLED',
        admin_notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select('*, items:order_items(*)')
      .single();

    if (error || !data) {
      console.error('OrderService.cancelOrder error:', error?.message);
      throw new Error(error?.message || `Failed to cancel order ${id}.`);
    }

    const cancelledOrder: Order = {
      ...data,
      grand_total: Number(data.grand_total),
      subtotal: Number(data.subtotal),
      delivery_fee: Number(data.delivery_fee),
      discount_amount: Number(data.discount_amount),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vpp_last_cancelled_order', JSON.stringify(cancelledOrder));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('vpp_orders_channel');
          bc.postMessage({
            type: 'ORDER_CANCELLED',
            orderId: current.id,
            orderNumber: cancelledOrder.order_number,
            order: cancelledOrder,
            cancelledBy,
            reason: reason || 'No reason specified',
          });
          bc.close();
        }
      } catch (e) {
        console.error('Failed to broadcast cancellation:', e);
      }
    }

    return cancelledOrder;
  }

  static async updateOrderLogistics(
    id: string,
    logistics: {
      courier_partner?: string;
      tracking_number?: string;
      estimated_delivery?: string;
      admin_notes?: string;
      status?: OrderStatus;
    }
  ): Promise<Order> {
    const supabase = this.getSupabase();
    const payload: any = { updated_at: new Date().toISOString() };
    if (logistics.courier_partner !== undefined) payload.courier_partner = logistics.courier_partner;
    if (logistics.tracking_number !== undefined) payload.tracking_number = logistics.tracking_number;
    if (logistics.estimated_delivery !== undefined) payload.estimated_delivery = logistics.estimated_delivery;
    if (logistics.admin_notes !== undefined) payload.admin_notes = logistics.admin_notes;
    if (logistics.status !== undefined) payload.status = logistics.status;

    const { data, error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', id)
      .select('*, items:order_items(*)')
      .single();

    if (error || !data) {
      throw new Error(error?.message || `Failed to update logistics for order ${id}.`);
    }

    return {
      ...data,
      grand_total: Number(data.grand_total),
      subtotal: Number(data.subtotal),
      delivery_fee: Number(data.delivery_fee),
      discount_amount: Number(data.discount_amount),
    };
  }

  static async markOrderPaid(id: string, isPaid: boolean): Promise<Order> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .update({ is_paid: isPaid, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, items:order_items(*)')
      .single();

    if (error || !data) {
      throw new Error(error?.message || `Failed to update payment for order ${id}.`);
    }

    return {
      ...data,
      grand_total: Number(data.grand_total),
      subtotal: Number(data.subtotal),
      delivery_fee: Number(data.delivery_fee),
      discount_amount: Number(data.discount_amount),
    };
  }

  /**
   * Fetch summary stats for the dashboard KPIs.
   */
  static async getOrderStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    todayRevenue: number;
    todayOrders: number;
    pendingCount: number;
  }> {
    const supabase = this.getSupabase();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('orders')
      .select('grand_total, status, created_at');

    if (error || !data) return { totalRevenue: 0, totalOrders: 0, todayRevenue: 0, todayOrders: 0, pendingCount: 0 };

    const todayStartISO = todayStart.toISOString();
    let totalRevenue = 0, todayRevenue = 0, todayOrders = 0, pendingCount = 0;

    for (const o of data) {
      const total = Number(o.grand_total);
      totalRevenue += total;
      if (o.created_at >= todayStartISO) {
        todayRevenue += total;
        todayOrders++;
      }
      if (['PENDING', 'CONFIRMED', 'PACKING'].includes(o.status)) pendingCount++;
    }

    return {
      totalRevenue,
      totalOrders: data.length,
      todayRevenue,
      todayOrders,
      pendingCount,
    };
  }
}
