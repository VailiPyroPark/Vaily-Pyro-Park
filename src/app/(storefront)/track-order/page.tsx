'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Package,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Ban,
  Clock,
  MapPin,
  Calendar,
  Truck,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Phone,
  ShieldCheck,
  Building2,
  Printer,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon';
import { OrderService } from '@/lib/services/order.service';
import { WhatsAppService } from '@/lib/services/whatsapp.service';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { OrderTimeline } from '@/components/common/OrderTimeline';
import { CancelOrderModal } from '@/components/common/CancelOrderModal';
import { PackingSlipModal } from '@/components/admin/orders/PackingSlipModal';
import { Order, OrderStatus } from '@/types';

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return {
        bg: 'bg-amber-100 text-amber-950 border-amber-300',
        label: 'Order Placed',
      };
    case 'CONFIRMED':
      return {
        bg: 'bg-blue-100 text-blue-950 border-blue-300',
        label: 'Confirmed',
      };
    case 'PACKING':
    case 'PACKED':
      return {
        bg: 'bg-purple-100 text-purple-950 border-purple-300',
        label: status === 'PACKED' ? 'Packed' : 'Packing in Progress',
      };
    case 'DISPATCHED':
      return {
        bg: 'bg-indigo-100 text-indigo-950 border-indigo-300',
        label: 'Dispatched & On The Way',
      };
    case 'DELIVERED':
      return {
        bg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        label: 'Delivered',
      };
    case 'CANCELLED':
      return {
        bg: 'bg-red-100 text-red-950 border-red-300',
        label: 'Cancelled',
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-800 border-slate-300',
        label: status,
      };
  }
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('id') || searchParams.get('order') || searchParams.get('phone') || '';
  const { settings } = useStoreSettings();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPackingSlipOpen, setIsPackingSlipOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Auto-search if URL contains query parameter
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;

    setErrorMsg('');
    setSuccessMsg('');
    setSearchedOrder(null);
    setHasSearched(true);
    setIsSearching(true);

    try {
      const allOrders = await OrderService.getAllOrders();
      const sanitizedTerm = cleanTerm.replace(/\D/g, '');

      const found = allOrders.find((o) => {
        const orderNumMatch = o.order_number.toLowerCase() === cleanTerm.toLowerCase();
        const idMatch = o.id.toLowerCase() === cleanTerm.toLowerCase();
        const mobileMatch = o.customer_mobile === cleanTerm;
        const sanitizedMobileMatch =
          sanitizedTerm.length >= 10 && o.customer_mobile.replace(/\D/g, '') === sanitizedTerm;

        return orderNumMatch || idMatch || mobileMatch || sanitizedMobileMatch;
      });

      if (found) {
        setSearchedOrder(found);
      } else {
        setErrorMsg(
          `No order found matching "${cleanTerm}". Please verify your Order Number or 10-digit registered mobile number.`
        );
      }
    } catch (e: any) {
      setErrorMsg('Unable to retrieve orders. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchInput);
  };

  const handleCopyOrderNumber = () => {
    if (!searchedOrder) return;
    navigator.clipboard.writeText(searchedOrder.order_number);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!searchedOrder) return;
    const cancelled = await OrderService.cancelOrder(searchedOrder.id, reason, 'CUSTOMER');
    setSearchedOrder(cancelled);
    setSuccessMsg(`Order #${cancelled.order_number} has been cancelled successfully.`);
  };

  const isCancellable =
    searchedOrder &&
    ['PENDING', 'CONFIRMED', 'PACKING', 'PACKED'].includes(searchedOrder.status);

  const isDispatched = searchedOrder && searchedOrder.status === 'DISPATCHED';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-4 sm:py-8 px-3 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Navigation & Live Badge Header */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to Shop</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-950 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span>Live Sivakasi Tracking</span>
          </div>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight font-heading">
            Track Your Order
          </h1>
        </div>

        {/* Search Card */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter 10-digit Mobile or Order Number"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm shrink-0 shadow-lg shadow-amber-500/25 cursor-pointer transition-all active:scale-98 glow-gold flex items-center justify-center gap-1.5"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 leading-relaxed">
              <p>{errorMsg}</p>
              <div className="mt-2">
                <a
                  href={WhatsAppService.generateSupportWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-extrabold hover:underline"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-600" />
                  <span>Need help? Chat with Sivakasi support on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Results: Order Details Card */}
        {searchedOrder && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Top Order Summary Card */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              {/* Header with Order Number & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-950 text-lg sm:text-xl tracking-tight">
                      #{searchedOrder.order_number}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOrderNumber}
                      className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Copy Order Number"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                    Placed for <strong className="text-slate-800 font-bold">{searchedOrder.customer_name}</strong> (+91 {searchedOrder.customer_mobile})
                  </span>
                </div>

                <div className="self-start sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${
                      getStatusBadge(searchedOrder.status).bg
                    }`}
                  >
                    <span>{getStatusBadge(searchedOrder.status).label}</span>
                  </span>
                </div>
              </div>

              {/* Order Timeline Component */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Order Status Progress
                  </span>
                </div>
                <OrderTimeline
                  status={searchedOrder.status}
                  adminNotes={searchedOrder.admin_notes}
                  courierPartner={searchedOrder.courier_partner}
                  trackingNumber={searchedOrder.tracking_number}
                  createdAt={searchedOrder.created_at}
                  updatedAt={searchedOrder.updated_at}
                  embedded={true}
                  hideHeader={true}
                />
              </div>

              {/* Order Key Details Grid - Compact 3-Column Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 divide-x divide-slate-200/80">
                <div className="space-y-0.5 pr-1 sm:pr-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                    Destination
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{searchedOrder.city || searchedOrder.state}</span>
                  </div>
                </div>

                <div className="space-y-0.5 px-1 sm:px-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                    Order Date
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      {new Date(searchedOrder.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 pl-1 sm:pl-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                    Total Amount
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-700 font-mono block truncate">
                    ₹{searchedOrder.grand_total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items Preview if available */}
              {searchedOrder.items && searchedOrder.items.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-extrabold text-slate-800 block">
                    Ordered Fireworks ({searchedOrder.items.length} items)
                  </span>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {searchedOrder.items.map((item, idx) => (
                      <div key={item.id || idx} className="py-1.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-black text-[10px] flex items-center justify-center shrink-0">
                            {item.quantity}×
                          </span>
                          <span className="font-bold text-slate-800 truncate">{item.product_name}</span>
                        </div>
                        <span className="font-bold text-slate-950 font-mono shrink-0">
                          ₹{item.total_price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dispatched Special Notice */}
              {isDispatched && (
                <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
                  <div>
                    <span className="font-black block text-blue-950">Parcel Dispatched &amp; In Transit</span>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Your parcel is handed over to {searchedOrder.courier_partner || 'our delivery partner'}.
                    </p>
                  </div>
                  <a
                    href={WhatsAppService.generateSupportWhatsAppLink(searchedOrder, undefined, settings?.whatsapp_number, settings?.store_name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                    <span>Contact Support</span>
                  </a>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPackingSlipOpen(true)}
                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl text-center transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-98 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Bill</span>
                </button>

                <Link
                  href={`/order-confirmation/${searchedOrder.id}`}
                  className="flex-1 py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl text-center transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-98 cursor-pointer"
                >
                  <span>View Full Order Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <a
                  href={WhatsAppService.generateOrderWhatsAppLink(searchedOrder, settings?.whatsapp_number, settings?.store_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  <span>WhatsApp Copy</span>
                </a>

                {isCancellable && (
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                  >
                    <Ban className="w-3.5 h-3.5 text-red-600" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cancel Modal */}
            {isCancelModalOpen && (
              <CancelOrderModal
                order={searchedOrder}
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirmCancel={handleConfirmCancel}
              />
            )}

            {/* Packing Slip & Bill Modal */}
            {isPackingSlipOpen && (
              <PackingSlipModal
                order={searchedOrder}
                onClose={() => setIsPackingSlipOpen(false)}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading Order Tracking...</p>
          </div>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
