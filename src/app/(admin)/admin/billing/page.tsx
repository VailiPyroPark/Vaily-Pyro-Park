'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Receipt,
  Plus,
  FileText,
  Clock,
  Printer,
  Search,
  Trash2,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Product, Category, Order } from '@/types';
import { ProductService } from '@/lib/services/product.service';
import {
  BillingService,
  BillingItem,
  DraftBill,
  CreateBillDTO,
} from '@/lib/services/billing.service';
import { WhatsAppService } from '@/lib/services/whatsapp.service';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { BillingProductList } from '@/components/admin/billing/BillingProductList';
import { CustomerBillDetailsModal } from '@/components/admin/billing/CustomerBillDetailsModal';
import { PackingSlipModal } from '@/components/admin/orders/PackingSlipModal';
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon';

type BillingTab = 'new' | 'saved' | 'drafts';

export default function AdminBillingPage() {
  const { settings } = useStoreSettings();

  const [activeTab, setActiveTab] = useState<BillingTab>('new');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Bill in progress state
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftInitialData, setDraftInitialData] = useState<any>(null);

  // Saved & Draft Bills state
  const [savedBills, setSavedBills] = useState<Order[]>([]);
  const [draftBills, setDraftBills] = useState<DraftBill[]>([]);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<Order | null>(null);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, cats, saved] = await Promise.all([
        ProductService.getAllProducts(),
        ProductService.getCategories(),
        BillingService.getSavedBills(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSavedBills(saved);
      setDraftBills(BillingService.getDraftBills());
    } catch (err) {
      console.error('Failed to load billing catalog data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle single quantity change
  const handleQuantityChange = (productId: string, qty: number) => {
    setQuantities((prev) => {
      const updated = new Map(prev);
      if (qty <= 0) {
        updated.delete(productId);
      } else {
        updated.set(productId, qty);
      }
      return updated;
    });
  };

  const handleClearAllQuantities = () => {
    setQuantities(new Map());
    setEditingDraftId(null);
    setDraftInitialData(null);
  };

  // Calculate selected items list & financial subtotal
  const selectedItems: BillingItem[] = useMemo(() => {
    const list: BillingItem[] = [];
    const prodMap = new Map(products.map((p) => [p.id, p]));

    quantities.forEach((qty, productId) => {
      if (qty > 0) {
        const prod = prodMap.get(productId);
        if (prod) {
          list.push({
            product_id: prod.id,
            product_name: prod.name,
            unit_price: prod.selling_price,
            quantity: qty,
            total_price: prod.selling_price * qty,
            image_url: prod.image_url,
            pack_size: prod.pack_size,
          });
        }
      }
    });

    return list;
  }, [products, quantities]);

  const selectedTotalPieces = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.total_price, 0);
  }, [selectedItems]);

  // Save as Draft directly from bottom bar
  const handleQuickSaveDraft = () => {
    if (selectedItems.length === 0) {
      alert('Please add at least one product with quantity before saving a draft.');
      return;
    }

    const draft = BillingService.saveDraftBill({
      id: editingDraftId || undefined,
      customer_name: draftInitialData?.customer_name || 'Walk-in Counter Customer',
      customer_mobile: draftInitialData?.customer_mobile || '',
      shipping_address: draftInitialData?.shipping_address || 'Direct Warehouse Pickup',
      city: draftInitialData?.city || 'Sivakasi',
      state: draftInitialData?.state || 'Tamil Nadu',
      pincode: draftInitialData?.pincode || '626123',
      items: selectedItems,
      subtotal: selectedSubtotal,
      discount_amount: 0,
      delivery_fee: 0,
      grand_total: selectedSubtotal,
      payment_method: 'CASH',
      is_paid: true,
    });

    setDraftBills(BillingService.getDraftBills());
    showToast(`Draft #${draft.draft_number} saved successfully!`, 'info');
  };

  // Finalize bill and open Print Slip modal
  const handleSaveAndPrintBill = async (billData: CreateBillDTO) => {
    try {
      setIsSavingBill(true);
      const savedBill = await BillingService.createSavedBill(billData);

      // If we were editing a draft, remove that draft
      if (editingDraftId) {
        BillingService.deleteDraftBill(editingDraftId);
        setEditingDraftId(null);
        setDraftInitialData(null);
        setDraftBills(BillingService.getDraftBills());
      }

      // Refresh saved bills list
      const freshSaved = await BillingService.getSavedBills();
      setSavedBills(freshSaved);

      // Reset selection
      setQuantities(new Map());
      setIsCustomerModalOpen(false);

      // Open print slip immediately
      setSelectedBillForPrint(savedBill);
      showToast(`Bill #${savedBill.order_number} saved & ready for printing!`, 'success');
    } catch (err: any) {
      alert(err.message || 'Failed to save bill.');
    } finally {
      setIsSavingBill(false);
    }
  };

  // Resume draft into New Bill workspace
  const handleResumeDraft = (draft: DraftBill) => {
    const newQtyMap = new Map<string, number>();
    draft.items.forEach((item) => {
      newQtyMap.set(item.product_id, item.quantity);
    });

    setQuantities(newQtyMap);
    setEditingDraftId(draft.id);
    setDraftInitialData({
      id: draft.id,
      customer_name: draft.customer_name,
      customer_mobile: draft.customer_mobile,
      shipping_address: draft.shipping_address,
      city: draft.city,
      state: draft.state,
      pincode: draft.pincode,
      discount_amount: draft.discount_amount,
      delivery_fee: draft.delivery_fee,
      payment_method: draft.payment_method,
      is_paid: draft.is_paid,
      admin_notes: draft.admin_notes,
    });

    setActiveTab('new');
    showToast(`Resumed Draft #${draft.draft_number}. Quantities loaded!`, 'info');
  };

  // Delete draft
  const handleDeleteDraft = (draftId: string) => {
    if (confirm('Are you sure you want to delete this draft bill?')) {
      BillingService.deleteDraftBill(draftId);
      setDraftBills(BillingService.getDraftBills());
      if (editingDraftId === draftId) {
        setEditingDraftId(null);
        setDraftInitialData(null);
      }
      showToast('Draft deleted successfully.', 'info');
    }
  };

  // Delete saved bill
  const handleDeleteSavedBill = async (billId: string) => {
    if (confirm('Are you sure you want to remove this saved bill record?')) {
      await BillingService.deleteSavedBill(billId);
      const fresh = await BillingService.getSavedBills();
      setSavedBills(fresh);
      showToast('Bill removed from records.', 'info');
    }
  };

  // Filtered saved bills
  const filteredSavedBills = useMemo(() => {
    if (!savedSearchQuery.trim()) return savedBills;
    const q = savedSearchQuery.toLowerCase();
    return savedBills.filter(
      (b) =>
        b.order_number.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_mobile.includes(q)
    );
  }, [savedBills, savedSearchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 sm:pb-24 font-sans">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-5">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Top Tab Navigation Buttons (Compact, Buttons Only) */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="grid grid-cols-3 w-full gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`py-2 px-2.5 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'new'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Bill</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-2.5 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Saved ({savedBills.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('drafts')}
              className={`py-2 px-2.5 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'drafts'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Drafts ({draftBills.length})</span>
            </button>
          </div>
        </div>

        {/* Content Area Based on Active Tab */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading Billing Catalog...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: NEW BILL (STOREFRONT-STYLED PRODUCT LIST) */}
            {activeTab === 'new' && (
              <div className="space-y-4">
                <BillingProductList
                  products={products}
                  categories={categories}
                  quantities={quantities}
                  onQuantityChange={handleQuantityChange}
                  onClearAll={handleClearAllQuantities}
                />
              </div>
            )}

            {/* TAB 2: SAVED BILLS */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                {/* Search Bar for Saved Bills */}
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={savedSearchQuery}
                      onChange={(e) => setSavedSearchQuery(e.target.value)}
                      placeholder="Search saved bills by bill number, customer name, or mobile..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                    />
                  </div>
                </div>

                {filteredSavedBills.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-2xs space-y-2">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                    <h3 className="font-extrabold text-sm text-slate-800">No saved bills found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Saved counter bills and finalized print orders will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mobile Card List View (sm:hidden) */}
                    <div className="sm:hidden space-y-2.5">
                      {filteredSavedBills.map((bill) => (
                        <div
                          key={bill.id}
                          className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono font-black text-slate-950 text-xs block">
                                {bill.order_number}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(bill.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <span className="font-mono font-black text-amber-700 text-sm">
                              ₹{bill.grand_total.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-900 block truncate">{bill.customer_name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">+91 {bill.customer_mobile}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {bill.items?.length || 0} Items
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {bill.payment_method || 'CASH'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setSelectedBillForPrint(bill)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>

                            <a
                              href={WhatsAppService.generateOrderWhatsAppLink(
                                bill,
                                settings?.whatsapp_number,
                                settings?.store_name
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <WhatsAppIcon className="w-3 h-3 fill-white" />
                              <span>WhatsApp</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteSavedBill(bill.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop & Tablet Table View (hidden sm:block) */}
                    <div className="hidden sm:block bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sm:text-xs border-b border-slate-200">
                              <th className="py-2.5 px-3">Bill #</th>
                              <th className="py-2.5 px-3">Date &amp; Time</th>
                              <th className="py-2.5 px-3">Customer</th>
                              <th className="py-2.5 px-3 text-center">Items</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3">Payment</th>
                              <th className="py-2.5 px-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {filteredSavedBills.map((bill) => (
                              <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                                {/* Bill Number */}
                                <td className="py-2.5 px-3 font-mono font-black text-slate-950">
                                  {bill.order_number}
                                </td>

                                {/* Date */}
                                <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                  {new Date(bill.created_at).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>

                                {/* Customer */}
                                <td className="py-2.5 px-3">
                                  <span className="font-extrabold text-slate-900 block">
                                    {bill.customer_name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    +91 {bill.customer_mobile}
                                  </span>
                                </td>

                                {/* Items Count */}
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black text-[11px]">
                                    {bill.items?.length || 0} Items
                                  </span>
                                </td>

                                {/* Amount */}
                                <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700 text-sm">
                                  ₹{bill.grand_total.toLocaleString('en-IN')}
                                </td>

                                {/* Payment */}
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[10px] px-2 py-0.5 rounded uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      {bill.payment_method || 'CASH'}
                                    </span>
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBillForPrint(bill)}
                                      className="p-1.5 sm:px-2.5 sm:py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                      title="Print Bill / Invoice"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-slate-950" />
                                      <span className="hidden sm:inline">Print</span>
                                    </button>

                                    <a
                                      href={WhatsAppService.generateOrderWhatsAppLink(
                                        bill,
                                        settings?.whatsapp_number,
                                        settings?.store_name
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 sm:px-2.5 sm:py-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                      title="Send WhatsApp Copy"
                                    >
                                      <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSavedBill(bill.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DRAFT BILLS */}
            {activeTab === 'drafts' && (
              <div className="space-y-4">
                {draftBills.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-2xs space-y-2">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                    <h3 className="font-extrabold text-sm text-slate-800">No active draft bills</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Work-in-progress bills you save as drafts will appear here for easy resumption.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {draftBills.map((draft) => (
                      <div
                        key={draft.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-black text-slate-950 text-sm block">
                              #{draft.draft_number}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Updated: {new Date(draft.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {new Date(draft.updated_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>

                          <span className="font-mono font-black text-amber-700 text-sm">
                            ₹{draft.grand_total.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Customer:</span>
                            <strong className="text-slate-800 font-bold">{draft.customer_name || 'Walk-in'}</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Items Selected:</span>
                            <strong className="text-slate-800 font-bold">
                              {draft.items.length} Items ({draft.items.reduce((sum, i) => sum + i.quantity, 0)} Pcs)
                            </strong>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResumeDraft(draft)}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Resume / Edit Bill</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* STICKY BOTTOM SUMMARY BAR (VISIBLE ON 'NEW' TAB - FLOATING GLASSMORPHIC) */}
        {activeTab === 'new' && (
          <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-lg z-40 animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-slate-950/95 backdrop-blur-xl border border-amber-500/50 p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-between gap-3 text-white font-sans">
              {/* Left Column: Badge & Subtotal */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] sm:text-[11px] font-black border border-amber-500/35 shrink-0">
                    <Receipt className="w-3 h-3 text-amber-400" />
                    <span>{selectedItems.length} {selectedItems.length === 1 ? 'Item' : 'Items'} ({selectedTotalPieces} Pcs)</span>
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Subtotal:</span>
                  <span className="font-mono text-base sm:text-xl font-black text-amber-400 tracking-tight">
                    ₹{selectedSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Right Column: Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleQuickSaveDraft}
                  disabled={selectedItems.length === 0}
                  title="Save as Draft"
                  className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs rounded-xl sm:rounded-2xl transition-all cursor-pointer backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  disabled={selectedItems.length === 0}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next</span>
                  <span className="hidden sm:inline">: Customer Details</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Bill Details Modal */}
        {isCustomerModalOpen && (
          <CustomerBillDetailsModal
            isOpen={isCustomerModalOpen}
            onClose={() => setIsCustomerModalOpen(false)}
            items={selectedItems}
            subtotal={selectedSubtotal}
            initialData={draftInitialData}
            onSaveBill={handleSaveAndPrintBill}
            onSaveDraft={handleQuickSaveDraft}
            isSaving={isSavingBill}
          />
        )}

        {/* Printable Packing Slip & Tax Invoice Modal */}
        {selectedBillForPrint && (
          <PackingSlipModal
            order={selectedBillForPrint}
            onClose={() => setSelectedBillForPrint(null)}
          />
        )}

      </div>
    </div>
  );
}
