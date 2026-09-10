'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  Clock,
  Sparkles,
  IndianRupee,
  FileText,
  User,
  Copy,
  Check,
  Send,
  History,
  ShieldCheck,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon';
import { OrderService } from '@/lib/services/order.service';
import { ProductService } from '@/lib/services/product.service';
import { Order, OrderStatus, OrderItem, Product } from '@/types';
import { WhatsAppModal } from '@/components/admin/orders/WhatsAppModal';
import { PackingSlipModal } from '@/components/admin/orders/PackingSlipModal';
import { StatusConfirmationModal, PendingStatusChange } from '@/components/admin/orders/StatusConfirmationModal';
import { ToastNotification, ToastMessage } from '@/components/admin/orders/ToastNotification';
import { WhatsAppTemplateType, WhatsAppService } from '@/lib/services/whatsapp.service';
import { OrderTimeline } from '@/components/common/OrderTimeline';
import { AdminProductModal } from '@/components/admin/orders/AdminProductModal';

interface PageProps {
  params: Promise<{ id: string }>;
}

const CARRIER_OPTIONS = [
  'ST Courier',
  'Professional Courier',
  'VRL Logistics',
  'BlueDart Express',
  'DTDC Express',
  'Direct Lorry Freight',
  'Local Warehouse Pickup',
];

export default function SingleOrderDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const orderIdParam = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'timeline' | 'customer' | 'logistics' | 'audit'>('items');

  // Logistics form state
  const [courierPartner, setCourierPartner] = useState<string>('ST Courier');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [estDeliveryDays, setEstDeliveryDays] = useState<string>('2-3 Days');
  const [adminNotesInput, setAdminNotesInput] = useState<string>('');

  // Modals state
  const [isPackingSlipOpen, setIsPackingSlipOpen] = useState(false);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<WhatsAppTemplateType>('ORDER_RECEIPT');
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const [selectedProductItem, setSelectedProductItem] = useState<OrderItem | null>(null);
  const [selectedProductMetadata, setSelectedProductMetadata] = useState<Product | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const allOrders = await OrderService.getAllOrders();
      // Match by id or order_number (case-insensitive)
      const found = allOrders.find(
        (o) =>
          o.id === orderIdParam ||
          o.order_number.toLowerCase() === orderIdParam.toLowerCase() ||
          o.order_number.toLowerCase().replace(/[^a-z0-9]/g, '') === orderIdParam.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (found) {
        setOrder(found);
        setCourierPartner(found.courier_partner || 'ST Courier');
        setTrackingNumber(found.tracking_number || '');
        setEstDeliveryDays(found.estimated_delivery || '2-3 Days');
        setAdminNotesInput(found.admin_notes || '');
      } else {
        setOrder(null);
      }
    } catch (e) {
      console.error('Error loading order details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderIdParam]);

  const handleConfirmStatusChange = async (trackingNo?: string, partner?: string) => {
    if (!pendingStatusChange || !order) return;

    try {
      let updated: Order;
      if (trackingNo || partner) {
        updated = await OrderService.updateOrderLogistics(order.id, {
          status: pendingStatusChange.newStatus,
          tracking_number: trackingNo,
          courier_partner: partner,
        });
      } else {
        updated = await OrderService.updateOrderStatus(
          order.id,
          pendingStatusChange.newStatus
        );
      }

      addToast(
        `Order #${order.order_number} status updated to ${pendingStatusChange.newStatus}`,
        'success'
      );

      setOrder(updated);
      setPendingStatusChange(null);
    } catch (e) {
      console.error('Failed to update order status:', e);
      addToast('Failed to update order status', 'error');
    }
  };

  const handleTogglePaymentSettlement = async () => {
    if (!order) return;
    const newPaidState = !order.is_paid;
    try {
      const updated = await OrderService.markOrderPaid(order.id, newPaidState);
      setOrder(updated);
      addToast(
        `Payment marked as ${newPaidState ? 'PAID ✓' : 'UNPAID (COD)'} for ${order.order_number}`,
        'info'
      );
    } catch (err: any) {
      addToast(`Failed to update payment: ${err.message}`, 'error');
    }
  };

  const handleSaveLogisticsSubmit = async () => {
    if (!order) return;
    const newStatus: OrderStatus =
      order.status === 'PENDING' ||
      order.status === 'CONFIRMED' ||
      order.status === 'PACKING' ||
      order.status === 'PACKED'
        ? 'DISPATCHED'
        : order.status;

    try {
      const updated = await OrderService.updateOrderLogistics(order.id, {
        courier_partner: courierPartner,
        tracking_number: trackingNumber,
        estimated_delivery: estDeliveryDays,
        admin_notes: adminNotesInput,
        status: newStatus,
      });
      setOrder(updated);
      addToast(`Logistics saved & order marked as ${newStatus}`, 'success');
      setWhatsAppTemplate('DISPATCH_TRACKING');
      setIsWhatsAppOpen(true);
    } catch (err: any) {
      addToast(`Failed to save logistics: ${err.message}`, 'error');
    }
  };

  const handleSaveNotesOnly = async () => {
    if (!order) return;
    try {
      const updated = await OrderService.updateOrderLogistics(order.id, {
        courier_partner: courierPartner,
        tracking_number: trackingNumber,
        estimated_delivery: estDeliveryDays,
        admin_notes: adminNotesInput,
        status: order.status,
      });
      setOrder(updated);
      addToast('Internal admin notes updated!', 'success');
    } catch (err: any) {
      addToast(`Failed to save notes: ${err.message}`, 'error');
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`Copied ${label} to clipboard!`, 'success');
  };

  const handleItemClick = async (item: OrderItem) => {
    setSelectedProductItem(item);
    try {
      const products = await ProductService.getAllProducts();
      const match = products.find(
        (p) => p.id === item.product_id || p.name.toLowerCase() === item.product_name.toLowerCase()
      );
      setSelectedProductMetadata(match || null);
    } catch {
      setSelectedProductMetadata(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">PENDING</span>;
      case 'CONFIRMED':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">CONFIRMED</span>;
      case 'PACKING':
      case 'PACKED':
        return <span className="bg-amber-200 text-amber-950 border border-amber-400 font-extrabold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">PACKING</span>;
      case 'DISPATCHED':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 font-extrabold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">DISPATCHED</span>;
      case 'DELIVERED':
        return <span className="bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">DELIVERED</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-900 border border-red-300 font-extrabold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">CANCELLED</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 font-extrabold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">{status}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'PENDING':
        return 'CONFIRMED';
      case 'CONFIRMED':
        return 'PACKING';
      case 'PACKING':
      case 'PACKED':
        return 'DISPATCHED';
      case 'DISPATCHED':
        return 'DELIVERED';
      default:
        return null;
    }
  };

  const getNextStatusBtnConfig = (next: OrderStatus) => {
    switch (next) {
      case 'CONFIRMED':
        return { label: '✓ Confirm Order', style: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' };
      case 'PACKING':
        return { label: '📦 Start Packing', style: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' };
      case 'DISPATCHED':
        return { label: '🚚 Dispatch Order', style: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20' };
      case 'DELIVERED':
        return { label: '🎉 Mark Delivered', style: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' };
      default:
        return { label: 'Advance Status', style: 'bg-amber-500 text-slate-950' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-800">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Order #{orderIdParam}...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4 font-sans max-w-3xl mx-auto p-4 sm:p-6 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-10 shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-red-50 text-red-600 mx-auto flex items-center justify-center text-2xl font-bold border border-red-200">
            🔍
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 font-normal">
              No order matches requested identifier: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">{orderIdParam}</code>
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Orders List</span>
          </Link>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.status);
  const nextBtnConfig = nextStatus ? getNextStatusBtnConfig(nextStatus) : null;

  return (
    <div className="space-y-4 sm:space-y-5 font-sans max-w-4xl mx-auto pb-24 px-1 sm:px-0">
      <ToastNotification toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      {/* Navigation Top Header Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Top Action Row */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Back to Orders</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsPackingSlipOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 border border-slate-200"
              title="Print Packing Slip / Tax Invoice"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => {
                setWhatsAppTemplate('ORDER_RECEIPT');
                setIsWhatsAppOpen(true);
              }}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
              title="Compose WhatsApp Message"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline text-white">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Order Details & Grand Total Row */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight font-mono truncate">
                {order.order_number}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              Placed on {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <div className="text-right shrink-0 bg-amber-500/10 px-3 py-1.5 rounded-2xl border border-amber-500/30">
            <span className="text-[9px] text-amber-900 uppercase font-black tracking-wider block">Grand Total</span>
            <span className="text-base sm:text-xl font-black text-slate-950 font-mono">
              ₹{order.grand_total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Ergonomic Mobile & Desktop Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1 text-xs">
        {[
          { id: 'items', label: `Items (${order.items?.length || 0})`, icon: Package },
          { id: 'customer', label: 'Customer', icon: User },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'logistics', label: 'Logistics', icon: Truck },
          { id: 'audit', label: 'Audit', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-black px-3 flex-1 sm:flex-none'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2.5 sm:px-3'
              }`}
              title={tab.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-600'}`} />
              <span className={isActive ? 'inline-block animate-in fade-in zoom-in-95 duration-150' : 'hidden sm:inline-block'}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ITEMS & FINANCIAL BREAKDOWN */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-950 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <span>Order Items ({order.items?.length || 0})</span>
              </h3>
              <span className="text-[10px] font-black text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/90">
                Direct Depot
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleItemClick(item)}
                  className="p-3 bg-slate-50/90 hover:bg-amber-50/90 rounded-2xl border border-slate-200/80 hover:border-amber-300 flex items-center justify-between gap-3 text-xs cursor-pointer transition-all group shadow-2xs"
                  title="Click to view full product specifications"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-white text-amber-700 border border-slate-200 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden group-hover:border-amber-400 group-hover:scale-105 transition-all shadow-2xs">
                      <img
                        src={item.image_url || '/logo.png'}
                        alt={item.product_name}
                        className={`w-full h-full ${item.image_url ? 'object-cover' : 'object-contain p-1'}`}
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-black text-slate-950 truncate text-xs sm:text-sm group-hover:text-amber-700 transition-colors">
                        {item.product_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="text-slate-500 font-bold text-[11px] font-mono">
                          × ₹{item.unit_price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-slate-950 text-sm sm:text-base block">
                      ₹{(item.total_price || item.quantity * item.unit_price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-amber-700 font-extrabold flex items-center justify-end gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Details</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3 text-xs">
            <h3 className="font-black text-sm text-slate-950 border-b border-slate-100 pb-3">
              Payment Breakdown
            </h3>
            <div className="space-y-2 text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-900 font-mono">₹{order.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {order.discount_amount && order.discount_amount > 0 ? (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Saved:</span>
                  <span className="font-mono">-₹{order.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Delivery Fee ({order.state}):</span>
                <span className="font-bold text-slate-900">
                  {order.delivery_fee === 0 ? (
                    <span className="text-emerald-600 font-black">FREE</span>
                  ) : (
                    `₹${order.delivery_fee.toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-950 pt-3 border-t border-slate-200">
                <span>Grand Total Payable:</span>
                <span className="text-amber-600 font-black text-lg font-mono">
                  ₹{order.grand_total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ORDER TIMELINE */}
      {activeTab === 'timeline' && (
        <OrderTimeline
          status={order.status}
          createdAt={order.created_at}
          courierPartner={order.courier_partner}
          trackingNumber={order.tracking_number}
          adminNotes={order.admin_notes}
        />
      )}

      {/* TAB 3: CUSTOMER & DELIVERY */}
      {activeTab === 'customer' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-950 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                <span>Customer Profile</span>
              </h3>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                Verified
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-950 font-black flex items-center justify-center text-base border border-amber-500/30 shrink-0">
                {getInitials(order.customer_name)}
              </div>
              <div className="space-y-1 min-w-0">
                <span className="font-black text-base text-slate-950 block truncate">
                  {order.customer_name}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                  <span>Phone: {order.customer_mobile}</span>
                  <button
                    onClick={() => handleCopyText(order.customer_mobile, 'Phone Number')}
                    className="text-amber-600 hover:text-amber-700 p-0.5 rounded cursor-pointer"
                    title="Copy Phone Number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={`tel:${order.customer_mobile}`}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-slate-700" />
                <span>Call Phone</span>
              </a>
              <button
                onClick={() => {
                  setWhatsAppTemplate('ORDER_RECEIPT');
                  setIsWhatsAppOpen(true);
                }}
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span className="text-white">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-950 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                <span>Shipping Address</span>
              </h3>
              <button
                onClick={() =>
                  handleCopyText(
                    `${order.shipping_address}, ${order.city}, ${order.state} - ${order.pincode}`,
                    'Full Address'
                  )
                }
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Address</span>
              </button>
            </div>

            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              {order.shipping_address}, {order.city}, {order.state} -{' '}
              <strong className="text-slate-950 font-black">{order.pincode}</strong>
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: LOGISTICS MANAGEMENT */}
      {activeTab === 'logistics' && (
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-base text-slate-950 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Courier & Logistics Details</span>
            </h3>
            <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
              Courier Dispatch
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">Courier Partner</label>
              <select
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
              >
                {CARRIER_OPTIONS.map((carrier) => (
                  <option key={carrier} value={carrier}>
                    {carrier}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">Tracking LR / AWB Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. ST12345678IN / LR-9921"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">Estimated Delivery Days</label>
              <input
                type="text"
                value={estDeliveryDays}
                onChange={(e) => setEstDeliveryDays(e.target.value)}
                placeholder="e.g. 2-3 Days"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <button
              onClick={handleSaveLogisticsSubmit}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-4 h-4" />
              <span>Save Logistics & Send WhatsApp Update</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL & NOTES */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3 text-xs">
            <h3 className="font-black text-sm text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Internal Warehouse Notes</span>
            </h3>

            <textarea
              rows={3}
              value={adminNotesInput}
              onChange={(e) => setAdminNotesInput(e.target.value)}
              placeholder="Add internal dispatch notes, fragile warnings, or special requests..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />

            <button
              onClick={handleSaveNotesOnly}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
            >
              Save Internal Notes
            </button>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
            <h3 className="font-black text-sm text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-slate-700" />
              <span>Status Audit Trail</span>
            </h3>

            <div className="space-y-3">
              {(order.history || [
                {
                  status: order.status,
                  timestamp: order.created_at,
                  note: 'Order created',
                  actor: 'System / Customer',
                },
              ]).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 border-l-2 border-amber-500 pl-3 py-1">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-950 uppercase">{item.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{item.note}</p>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                      By: {item.actor || 'Admin'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Ergonomic Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-2 max-w-4xl mx-auto">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">Status:</span>
          {getStatusBadge(order.status)}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {nextStatus && nextBtnConfig && (
            <button
              onClick={() =>
                setPendingStatusChange({
                  orderId: order.id,
                  orderNumber: order.order_number,
                  currentStatus: order.status,
                  newStatus: nextStatus,
                })
              }
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${nextBtnConfig.style}`}
            >
              {nextBtnConfig.label}
            </button>
          )}

          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <button
              onClick={() =>
                setPendingStatusChange({
                  orderId: order.id,
                  orderNumber: order.order_number,
                  currentStatus: order.status,
                  newStatus: 'CANCELLED',
                })
              }
              className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Status Transition Confirmation Modal */}
      {pendingStatusChange && (
        <StatusConfirmationModal
          pendingStatusChange={pendingStatusChange}
          onCancel={() => setPendingStatusChange(null)}
          onConfirm={handleConfirmStatusChange}
        />
      )}

      {/* WhatsApp Modal */}
      {isWhatsAppOpen && (
        <WhatsAppModal
          order={order}
          initialTemplate={whatsAppTemplate}
          onClose={() => setIsWhatsAppOpen(false)}
          onShowToast={addToast}
        />
      )}

      {/* Packing Slip Modal */}
      {isPackingSlipOpen && (
        <PackingSlipModal
          order={order}
          onClose={() => setIsPackingSlipOpen(false)}
        />
      )}

      {/* Product Details Quick View Modal */}
      {selectedProductItem && (
        <AdminProductModal
          item={selectedProductItem}
          product={selectedProductMetadata}
          onClose={() => {
            setSelectedProductItem(null);
            setSelectedProductMetadata(null);
          }}
        />
      )}
    </div>
  );
}
