'use client';

import React, { useMemo } from 'react';
import { ShoppingBag, Clock, Truck, IndianRupee, ArrowRight, Sparkles } from 'lucide-react';
import { Order } from '@/types';

interface OrderMetricsProps {
  orders: Order[];
  activeStatusTab?: string;
  onSelectStatusTab?: (status: string) => void;
}

export function OrderMetrics({
  orders,
  activeStatusTab = 'ALL',
  onSelectStatusTab,
}: OrderMetricsProps) {
  const totalOrdersCount = orders.length;

  const validOrders = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELLED'),
    [orders]
  );

  const totalBookedRevenue = useMemo(
    () => validOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0),
    [validOrders]
  );

  const totalPaidRevenue = useMemo(
    () => orders.filter((o) => o.is_paid).reduce((sum, o) => sum + (o.grand_total || 0), 0),
    [orders]
  );

  const pendingCount = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PACKING'
      ).length,
    [orders]
  );

  const dispatchedCount = useMemo(
    () => orders.filter((o) => o.status === 'DISPATCHED').length,
    [orders]
  );

  const totalItemsCount = useMemo(() => {
    return orders.reduce((sum, o) => {
      const items = o.items || [];
      return sum + items.reduce((iSum, item) => iSum + (item.quantity || 1), 0);
    }, 0);
  }, [orders]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 font-sans">
      {/* Metric 1: Total Bookings */}
      <button
        type="button"
        onClick={() => onSelectStatusTab?.('ALL')}
        className={`bg-white rounded-xl border p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between text-left group cursor-pointer ${
          activeStatusTab === 'ALL'
            ? 'ring-1.5 ring-blue-500/30 border-blue-300/80 bg-blue-50/10'
            : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-500">
            Total Bookings
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-300/40 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            {totalOrdersCount}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium truncate">
              {totalItemsCount > 0 ? `${totalItemsCount} items` : `${validOrders.length} active`}
            </span>
            <span className="text-[11px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
              All <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </button>

      {/* Metric 2: Pending Orders */}
      <button
        type="button"
        onClick={() => onSelectStatusTab?.('PENDING')}
        className={`bg-white rounded-xl border p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between text-left group cursor-pointer ${
          activeStatusTab === 'PENDING'
            ? 'ring-1.5 ring-amber-500/30 border-amber-300/80 bg-amber-50/15'
            : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-500">
            Pending Review
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-300/40 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-1.5">
            <span>{pendingCount}</span>
            {pendingCount > 0 ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Action
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Clear
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              {pendingCount > 0 ? 'To confirm' : 'Zero backlog'}
            </span>
            <span className="text-[11px] text-amber-800 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
              Filter <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </button>

      {/* Metric 3: Dispatched Orders */}
      <button
        type="button"
        onClick={() => onSelectStatusTab?.('DISPATCHED')}
        className={`bg-white rounded-xl border p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between text-left group cursor-pointer ${
          activeStatusTab === 'DISPATCHED'
            ? 'ring-1.5 ring-indigo-500/30 border-indigo-300/80 bg-indigo-50/15'
            : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-500">
            Dispatched
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-300/40 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
            <Truck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-1.5">
            <span>{dispatchedCount}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              Transit
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              {dispatchedCount > 0 ? `${dispatchedCount} on road` : '0 in transit'}
            </span>
            <span className="text-[11px] text-indigo-700 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
              Filter <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </button>

      {/* Metric 4: Net Revenue (Fixed ₹0 calculation!) */}
      <button
        type="button"
        onClick={() => onSelectStatusTab?.('ALL')}
        className={`bg-white rounded-xl border p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between text-left group cursor-pointer ${
          activeStatusTab === 'ALL'
            ? 'ring-1.5 ring-emerald-500/20 border-emerald-300/70'
            : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-500">
            Net Revenue
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-300/40 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            ₹{totalBookedRevenue.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded">
              Excl. Cancelled
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {totalPaidRevenue > 0
                ? `₹${totalPaidRevenue.toLocaleString('en-IN')} paid`
                : `${validOrders.length} ord.`}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
