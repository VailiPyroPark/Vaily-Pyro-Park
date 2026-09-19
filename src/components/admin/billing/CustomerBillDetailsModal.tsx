'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileText,
  User,
  Phone,
  MapPin,
  CreditCard,
  Building2,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { BillingItem, CreateBillDTO, DraftBill } from '@/lib/services/billing.service';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface CustomerBillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BillingItem[];
  subtotal: number;
  initialData?: {
    id?: string;
    customer_name?: string;
    customer_mobile?: string;
    shipping_address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    discount_amount?: number;
    delivery_fee?: number;
    payment_method?: string;
    is_paid?: boolean;
    admin_notes?: string;
  };
  onSaveBill: (billData: CreateBillDTO) => Promise<void>;
  onSaveDraft: (draftData: Omit<DraftBill, 'id' | 'draft_number' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  isSaving?: boolean;
}

export function CustomerBillDetailsModal({
  isOpen,
  onClose,
  items,
  subtotal,
  initialData,
  onSaveBill,
  onSaveDraft,
  isSaving = false,
}: CustomerBillDetailsModalProps) {
  const { settings } = useStoreSettings();

  const [customerName, setCustomerName] = useState(initialData?.customer_name || '');
  const [customerMobile, setCustomerMobile] = useState(initialData?.customer_mobile || '');
  const [shippingAddress, setShippingAddress] = useState(
    initialData?.shipping_address || 'Direct Warehouse Pickup'
  );
  const [city, setCity] = useState(initialData?.city || 'Sivakasi');
  const [state, setState] = useState(initialData?.state || 'Tamil Nadu');
  const [pincode, setPincode] = useState(initialData?.pincode || '626123');
  const [discountAmount, setDiscountAmount] = useState<number>(initialData?.discount_amount || 0);
  const [deliveryFee, setDeliveryFee] = useState<number>(initialData?.delivery_fee || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>(initialData?.payment_method || 'CASH');
  const [isPaid, setIsPaid] = useState<boolean>(initialData?.is_paid !== undefined ? initialData.is_paid : true);
  const [adminNotes, setAdminNotes] = useState(initialData?.admin_notes || '');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customer_name || '');
      setCustomerMobile(initialData.customer_mobile || '');
      setShippingAddress(initialData.shipping_address || 'Direct Warehouse Pickup');
      setCity(initialData.city || 'Sivakasi');
      setState(initialData.state || 'Tamil Nadu');
      setPincode(initialData.pincode || '626123');
      setDiscountAmount(initialData.discount_amount || 0);
      setDeliveryFee(initialData.delivery_fee || 0);
      setPaymentMethod(initialData.payment_method || 'CASH');
      setIsPaid(initialData.is_paid !== undefined ? initialData.is_paid : true);
      setAdminNotes(initialData.admin_notes || '');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleAutofillCounter = () => {
    setShippingAddress(settings?.store_address || '3/421 Anjaneyar Nagar, Sattur Main Road, Anuppankulam, Sivakasi.');
    setCity('Sivakasi');
    setState('Tamil Nadu');
    setPincode('626123');
    setDeliveryFee(0);
  };

  const handleSaveAndPrint = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please enter Customer Name.');
      return;
    }
    if (!customerMobile.trim() || customerMobile.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit Customer Mobile Number.');
      return;
    }

    try {
      await onSaveBill({
        customer_name: customerName.trim(),
        customer_mobile: customerMobile.trim(),
        shipping_address: shippingAddress.trim() || 'Direct Warehouse Pickup',
        city: city.trim() || 'Sivakasi',
        state: state.trim() || 'Tamil Nadu',
        pincode: pincode.trim() || '626123',
        items,
        subtotal,
        discount_amount: Number(discountAmount) || 0,
        delivery_fee: Number(deliveryFee) || 0,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        is_paid: isPaid,
        admin_notes: adminNotes.trim(),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save bill. Please try again.');
    }
  };

  const handleDraftClick = () => {
    onSaveDraft({
      id: initialData?.id,
      customer_name: customerName.trim() || 'Counter Walk-in',
      customer_mobile: customerMobile.trim() || '',
      shipping_address: shippingAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      items,
      subtotal,
      discount_amount: Number(discountAmount) || 0,
      delivery_fee: Number(deliveryFee) || 0,
      grand_total: grandTotal,
      payment_method: paymentMethod,
      is_paid: isPaid,
      admin_notes: adminNotes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-98 duration-150">
        {/* Sticky Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 truncate">
                Customer &amp; Bill Details
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                Finalize details before saving &amp; printing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form with Scrollable Content & Sticky Footer */}
        <form onSubmit={handleSaveAndPrint} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 text-xs">
            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selected Items Summary Strip */}
            <div className="bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  Selected Items ({items.length} • {totalQuantity} Pcs)
                </span>
                <span className="font-mono font-black text-slate-950 text-xs sm:text-sm">
                  Subtotal: ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="max-h-20 overflow-y-auto space-y-1 pr-1 text-[11px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {items.map((it) => (
                  <div key={it.product_id} className="flex items-center justify-between text-slate-700 py-0.5 border-b border-slate-100/70 last:border-0">
                    <span className="truncate pr-2 font-medium">
                      {it.quantity}× {it.product_name}
                    </span>
                    <span className="font-mono font-bold shrink-0 text-slate-900">
                      ₹{it.total_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-8.5 pr-3 py-1.5 sm:py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-slate-900 font-semibold outline-none transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-8.5 pr-3 py-1.5 sm:py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-slate-900 font-mono font-semibold outline-none transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Address & Sivakasi Auto-fill */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-bold text-[11px]">
                  Delivery / Billing Address
                </label>
                <button
                  type="button"
                  onClick={handleAutofillCounter}
                  className="text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors cursor-pointer"
                >
                  Auto-fill Sivakasi Pickup
                </button>
              </div>
              <textarea
                rows={1}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Address / Landmark..."
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl p-2 text-slate-900 font-medium outline-none transition-all text-xs leading-normal resize-none"
              />
            </div>

            {/* City, State, Pincode Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-600 font-bold mb-0.5 text-[10px]">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-lg px-2.5 py-1 text-slate-900 font-semibold text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-0.5 text-[10px]">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-lg px-2.5 py-1 text-slate-900 font-semibold text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-0.5 text-[10px]">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-lg px-2.5 py-1 text-slate-900 font-mono font-semibold text-xs outline-none"
                />
              </div>
            </div>

            {/* Commercial Adjustments & Payment Mode */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 font-bold mb-0.5 text-[10px] sm:text-[11px]">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount === 0 ? '' : discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-0.5 text-[10px] sm:text-[11px]">
                  Delivery / Freight (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee === 0 ? '' : deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold outline-none text-xs"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-700 font-bold mb-0.5 text-[10px] sm:text-[11px]">
                  Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold outline-none text-xs cursor-pointer"
                >
                  <option value="CASH">Cash Counter</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CREDIT">Pay Later / Credit</option>
                </select>
              </div>
            </div>

            {/* Payment Status & Admin Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                isPaid ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900' : 'bg-amber-50/90 border-amber-300 text-amber-900'
              }`}>
                <input
                  type="checkbox"
                  id="isPaidToggle"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="select-none">Mark as Paid in Full ({isPaid ? 'PAID' : 'PENDING'})</span>
              </label>

              <div>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Remarks / Note on bill (optional)"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* STICKY FOOTER - ALWAYS IN VIEW, ZERO CLIPPING */}
          <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-950 text-white border-t border-slate-800 shrink-0 space-y-2.5">
            {/* Total Payable Summary Strip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Total Payable:
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {items.length} Items ({totalQuantity} Pcs)
                </span>
              </div>

              <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Action Buttons: 2 Columns Side-by-Side */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDraftClick}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/15 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Draft</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/30 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>Save &amp; Print</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
