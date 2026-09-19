'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, CheckCircle2, QrCode } from 'lucide-react';
import { Order } from '@/types';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface PackingSlipModalProps {
  order: Order | null;
  onClose: () => void;
}

export function PackingSlipModal({ order, onClose }: PackingSlipModalProps) {
  const [mounted, setMounted] = useState(false);
  const { settings } = useStoreSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!order || !mounted) return null;

  const totalItemsCount = order.items?.length || 0;
  const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return createPortal(
    <div className="packing-slip-portal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:static print:inset-auto print:z-auto print:bg-transparent print:p-0 print:m-0 print:block print:overflow-visible font-sans">
      {/* World-Class React Portal Multi-Page Print CSS Rules */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
          }

          /* Hide all non-portal elements in document body */
          body > *:not(.packing-slip-portal) {
            display: none !important;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .packing-slip-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          #printable-packing-slip {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-keep-together {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .no-print, .no-print * {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Printable Card Container */}
      <div
        id="printable-packing-slip"
        className="bg-white rounded-3xl p-5 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-98 duration-150 print:animate-none print:max-w-none print:w-full print:max-h-none print:p-0 print:m-0 print:rounded-none print:border-none print:shadow-none print:overflow-visible print:space-y-4 print:static"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-3 print:pb-2.5">
          {/* Screen Actions Header Bar */}
          <div className="flex items-center justify-between no-print mb-3 pb-3 border-b border-slate-100">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Packing Slip Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
            <div>
              <span className="text-[10px] sm:text-xs print:text-[9.5pt] font-black text-amber-700 uppercase tracking-widest block">
                {(settings?.store_name || 'VAILY PYRO PARK').toUpperCase()} • SIVAKASI DIRECT WAREHOUSE
              </span>
              <h1 className="text-lg sm:text-2xl print:text-[15pt] font-black text-slate-950 tracking-tight mt-0.5">
                {settings?.gstin?.trim() ? 'PACKING SLIP & TAX INVOICE' : 'PACKING SLIP & BILL'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs print:text-[10pt] text-slate-700 font-mono font-bold pt-0.5 sm:pt-0 sm:text-right">
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900 font-black">
                Invoice #{order.order_number}
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                Date: {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Address Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3.5 print:gap-3 text-xs print:text-[10pt]">
          {/* Dispatch From */}
          <div className="bg-slate-50 p-3.5 print:p-3 rounded-2xl print:rounded-xl border border-slate-300 space-y-1 print:bg-white print:border-slate-300">
            <span className="text-[10px] print:text-[8.5pt] font-black text-slate-500 uppercase tracking-wider block">
              Dispatched From Warehouse
            </span>
            <span className="font-black text-slate-950 text-sm print:text-[11pt] block">
              {settings?.store_name || 'Vaily Pyro Park'}
            </span>
            <span className="text-slate-700 text-xs print:text-[9.5pt] block leading-relaxed">
              {settings?.store_address || '3/421 Anjaneyar Nagar, Sattur Main Road, Anuppankulam, Sivakasi.'}
            </span>
            <div className="flex items-center gap-3 pt-1 text-xs print:text-[9pt] text-slate-700 font-mono font-bold border-t border-slate-200/80 mt-1">
              {settings?.gstin && settings.gstin.trim() ? (
                <span>GSTIN: {settings.gstin.trim()}</span>
              ) : null}
              <span>Ph: {settings?.helpline_mobile || '+91 99521 08746'}</span>
            </div>
          </div>

          {/* Delivery To Customer */}
          <div className="bg-slate-50 p-3.5 print:p-3 rounded-2xl print:rounded-xl border border-slate-300 space-y-1 print:bg-white print:border-slate-300">
            <span className="text-[10px] print:text-[8.5pt] font-black text-slate-500 uppercase tracking-wider block">
              Ship & Bill To Customer
            </span>
            <span className="font-black text-slate-950 text-sm print:text-[11pt] block">
              {order.customer_name}
            </span>
            <span className="text-slate-700 text-xs print:text-[9.5pt] block leading-relaxed">
              {order.shipping_address}, {order.city}, {order.state} - {order.pincode}
            </span>
            <div className="pt-1 text-xs print:text-[9.5pt] text-slate-900 font-mono font-extrabold border-t border-slate-200/80 mt-1">
              Mobile: +91 {order.customer_mobile.slice(-10)}
            </div>
          </div>
        </div>

        {/* Courier Info Banner */}
        {order.courier_partner && (
          <div className="bg-slate-100 text-slate-950 border border-slate-300 p-2.5 print:p-2 rounded-xl flex items-center justify-between gap-2 text-xs print:text-[10pt] print:bg-white print:border-slate-300 font-mono">
            <span className="text-slate-600 font-bold">Courier & Logistics:</span>
            <span className="font-black text-slate-950 truncate">
              {order.courier_partner} ({order.tracking_number || 'Pending'}) • Est: {order.estimated_delivery || '2-3 Days'}
            </span>
          </div>
        )}

        {/* Itemized Table */}
        <div className="border border-slate-300 rounded-2xl overflow-x-auto scrollbar-none print:overflow-visible print:rounded-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[520px] sm:min-w-0 print:min-w-0">
            <thead className="bg-slate-900 text-white print:text-slate-950 font-black uppercase text-[10px] print:text-[9pt] tracking-wider border-b border-slate-300 print:bg-slate-200">
              <tr>
                <th className="p-2.5 print:p-2 border-r border-slate-300 w-10 text-center">#</th>
                <th className="p-2.5 print:p-2 border-r border-slate-300">Item Description</th>
                <th className="p-2.5 print:p-2 text-center border-r border-slate-300 w-16 print:w-14">Qty</th>
                <th className="p-2.5 print:p-2 text-right border-r border-slate-300 w-28 print:w-24">Unit Price</th>
                <th className="p-2.5 print:p-2 text-right w-28 print:w-24">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-medium">
              {order.items?.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/80 print:bg-slate-50' : 'bg-white'}>
                  <td className="p-2 print:p-1.5 text-center text-slate-500 font-mono text-xs print:text-[9.5pt] border-r border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="p-2 print:p-1.5 font-extrabold text-slate-950 border-r border-slate-200 text-xs print:text-[10pt]">
                    {item.product_name}
                  </td>
                  <td className="p-2 print:p-1.5 text-center font-black text-slate-950 border-r border-slate-200 bg-amber-50/40 print:bg-transparent text-xs print:text-[10pt]">
                    {item.quantity}
                  </td>
                  <td className="p-2 print:p-1.5 text-right text-slate-700 font-mono border-r border-slate-200 text-xs print:text-[10pt]">
                    ₹{item.unit_price.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2 print:p-1.5 text-right font-black text-slate-950 font-mono text-xs print:text-[10pt]">
                    ₹{item.total_price.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Item Summary Bar */}
          <div className="bg-slate-100 px-4 py-2 border-t border-slate-300 flex items-center justify-between text-xs print:text-[9.5pt] font-extrabold text-slate-800 font-mono">
            <span>TOTAL PRODUCTS: {totalItemsCount} Items</span>
            <span>TOTAL PACKED QUANTITY: {totalQuantity} Pcs</span>
          </div>
        </div>

        {/* Bottom Section: Financial Totals + Inspection & Signature */}
        <div className="space-y-4 pt-2 print-keep-together">
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 items-end pt-2 border-t-2 border-slate-900">
            {/* Quality Inspection & QR Code */}
            <div className="bg-slate-50 p-3 print:p-2.5 rounded-2xl print:rounded-xl border border-slate-300 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] print:text-[8.5pt] font-black text-slate-500 uppercase tracking-wider block">
                  Warehouse Quality & Safety Inspection
                </span>
                <div className="flex items-center gap-2.5 text-xs print:text-[9pt] font-black text-slate-800 flex-wrap">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 print:w-3.5 print:h-3.5 text-emerald-600 print:text-black shrink-0" /> Count Verified
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 print:w-3.5 print:h-3.5 text-emerald-600 print:text-black shrink-0" /> Waterproof
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 print:w-3.5 print:h-3.5 text-emerald-600 print:text-black shrink-0" /> Caution Labeled
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-300 pl-3 shrink-0">
                <QrCode className="w-8 h-8 print:w-7 print:h-7 text-slate-950" />
                <div className="text-[9px] print:text-[8pt] font-mono text-slate-600">
                  <div className="font-bold text-slate-500">VERIFY</div>
                  <div className="font-black text-slate-950 text-xs print:text-[10pt]">{order.order_number}</div>
                </div>
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="space-y-1 text-xs print:text-[10pt] text-slate-700 font-bold bg-slate-50 p-3 print:p-2.5 rounded-2xl print:rounded-xl border border-slate-300">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono text-slate-950 font-extrabold">₹{order.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {order.discount_amount && order.discount_amount > 0 ? (
                <div className="flex justify-between text-emerald-700 print:text-black font-black">
                  <span>Festival Discount:</span>
                  <span className="font-mono">-₹{order.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Delivery Freight:</span>
                <span className="font-mono text-slate-950 font-extrabold">
                  ₹{(order.delivery_fee ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-sm sm:text-base print:text-[11.5pt] font-black text-slate-950 pt-1.5 border-t-2 border-slate-950">
                <span>Grand Total Payable:</span>
                <span className="font-mono text-amber-700 print:text-black text-base print:text-[12pt] font-black">
                  ₹{order.grand_total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Dispatch Signature Line */}
          <div className="flex items-center justify-between text-xs print:text-[9pt] text-slate-500 font-mono pt-1">
            <span>Thank you for buying from {settings?.store_name || 'Vaily Pyro Park'} - Sivakasi Direct Warehouse!</span>
            <span className="font-bold text-slate-900">Auth. Dispatch Signature: ________________</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
