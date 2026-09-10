'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  RefreshCw,
  IndianRupee,
  CalendarDays,
  Package,
  SlidersHorizontal,
  Download,
  Search,
  Copy,
  Check,
  Eye,
  Sparkles,
  Layers,
  MapPin,
  Bell,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Truck,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { OrderService } from '@/lib/services/order.service';
import { ProductService } from '@/lib/services/product.service';
import { Order } from '@/types';

type TimeRange = 'all' | 'week' | 'today';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeCls: string; dotCls: string; barCls: string; chipCls: string }
> = {
  PENDING: {
    label: 'Pending',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dotCls: 'bg-amber-500',
    barCls: 'bg-amber-400',
    chipCls: 'bg-amber-50/70 border-amber-200/70 text-amber-900 hover:bg-amber-100/70',
  },
  CONFIRMED: {
    label: 'Confirmed',
    badgeCls: 'bg-blue-50 text-blue-800 border-blue-200/80',
    dotCls: 'bg-blue-500',
    barCls: 'bg-blue-400',
    chipCls: 'bg-blue-50/70 border-blue-200/70 text-blue-900 hover:bg-blue-100/70',
  },
  PACKING: {
    label: 'Packing',
    badgeCls: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    dotCls: 'bg-indigo-500',
    barCls: 'bg-indigo-400',
    chipCls: 'bg-indigo-50/70 border-indigo-200/70 text-indigo-900 hover:bg-indigo-100/70',
  },
  PACKED: {
    label: 'Packed',
    badgeCls: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    dotCls: 'bg-indigo-500',
    barCls: 'bg-indigo-400',
    chipCls: 'bg-indigo-50/70 border-indigo-200/70 text-indigo-900 hover:bg-indigo-100/70',
  },
  DISPATCHED: {
    label: 'Dispatched',
    badgeCls: 'bg-purple-50 text-purple-800 border-purple-200/80',
    dotCls: 'bg-purple-500',
    barCls: 'bg-purple-400',
    chipCls: 'bg-purple-50/70 border-purple-200/70 text-purple-900 hover:bg-purple-100/70',
  },
  DELIVERED: {
    label: 'Delivered',
    badgeCls: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    dotCls: 'bg-emerald-500',
    barCls: 'bg-emerald-400',
    chipCls: 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900 hover:bg-emerald-100/70',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotCls: 'bg-rose-400',
    barCls: 'bg-rose-300',
    chipCls: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200',
  },
};

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.allSettled([
        OrderService.getAllOrders(),
        ProductService.getAllProducts(),
      ]);

      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value);
      }
      if (productsRes.status === 'fulfilled') {
        setProductCount(productsRes.value.length);
      }
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered dataset according to active time range
  const scopedOrders = useMemo(() => {
    if (timeRange === 'all') return orders;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (timeRange === 'today') {
      return orders.filter((o) => o.created_at && o.created_at.split('T')[0] === todayStr);
    }

    if (timeRange === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orders.filter((o) => new Date(o.created_at) >= sevenDaysAgo);
    }

    return orders;
  }, [orders, timeRange]);

  // Derived KPI metrics
  const totalRevenue = useMemo(() => {
    return scopedOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);
  }, [scopedOrders]);

  const totalOrdersCount = scopedOrders.length;

  const pendingOrdersCount = useMemo(() => {
    return scopedOrders.filter((o) => o.status === 'PENDING').length;
  }, [scopedOrders]);

  const validOrders = useMemo(() => {
    return scopedOrders.filter((o) => o.status !== 'CANCELLED');
  }, [scopedOrders]);

  const avgOrderValue = useMemo(() => {
    return validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  }, [totalRevenue, validOrders]);

  const totalItemsCount = useMemo(() => {
    return scopedOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
  }, [scopedOrders]);

  // Today specific metrics (always calculated for context)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = useMemo(() => {
    return orders.filter((o) => o.created_at && o.created_at.split('T')[0] === todayStr);
  }, [orders, todayStr]);

  const todayRevenue = useMemo(() => {
    return todayOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);
  }, [todayOrders]);

  // Status breakdown counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PACKING: 0,
      DISPATCHED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      const st = o.status === 'PACKED' ? 'PACKING' : o.status;
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [orders]);

  // Filtered recent orders list for the search & status filter
  const filteredRecentOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'PACKING' && (o.status === 'PACKING' || o.status === 'PACKED')) {
            // match
          } else if (o.status !== statusFilter) {
            return false;
          }
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          o.order_number?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.city?.toLowerCase().includes(q) ||
          o.customer_mobile?.includes(q)
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [orders, searchQuery, statusFilter]);

  // 1-Click CSV Order Export
  const handleExportCSV = () => {
    if (orders.length === 0) return;

    const exportRows = orders.map((o) => ({
      'Order Number': o.order_number,
      'Order Status': o.status,
      'Date': new Date(o.created_at).toLocaleDateString('en-IN'),
      'Customer Name': o.customer_name,
      'Mobile Number': o.customer_mobile,
      'Email': o.customer_email || '',
      'Delivery Address': o.shipping_address,
      'City': o.city,
      'State': o.state,
      'Pincode': o.pincode,
      'Grand Total (INR)': o.grand_total || 0,
      'Items Count': o.items?.length || 0,
      'Courier Partner': o.courier_partner || '',
      'Tracking Number': o.tracking_number || '',
    }));

    const csvString = Papa.unparse(exportRows);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VPP_Orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyOrderNumber = (e: React.MouseEvent, orderNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderId(orderNumber);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  return (
    <div className="space-y-4 font-sans text-slate-900 pb-10">
      {/* 1. SEAMLESS EXECUTIVE TOOLBAR */}
      <div className="bg-white p-3.5 sm:px-5 sm:py-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Row 1 on Mobile / Left on Desktop */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Store Performance
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          <span className="text-xs text-slate-400 font-normal hidden md:inline">
            • Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>

          {/* Action buttons on Mobile (Top Right) */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              onClick={handleExportCSV}
              disabled={orders.length === 0}
              title="Download Orders CSV"
              className="p-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-lg border border-slate-200/80 shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh Live Data"
              className="p-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-lg border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 2 on Mobile (Full Width) / Right on Desktop */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Segmented Filter: full width grid on mobile, inline-flex on desktop */}
          <div className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-xs">
            <button
              onClick={() => setTimeRange('all')}
              className={`py-1.5 sm:py-1 sm:px-3 text-center rounded-md text-xs transition-all cursor-pointer ${
                timeRange === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`py-1.5 sm:py-1 sm:px-3 text-center rounded-md text-xs transition-all cursor-pointer ${
                timeRange === 'week'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('today')}
              className={`py-1.5 sm:py-1 sm:px-3 text-center rounded-md text-xs transition-all cursor-pointer ${
                timeRange === 'today'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Today
            </button>
          </div>

          {/* Action buttons on Desktop (with text labels) */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={orders.length === 0}
              title="Download Orders CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-slate-200/80 shadow-2xs disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh Live Data"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-amber-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. REFINED, UNIFIED KPI METRIC CARDS (4 DISTINCT VALUE PILLARS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Net Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-500">
              Net Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-300/40 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded">
                Excl. Cancelled
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {validOrders.length} ord.
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <Link
          href="/admin/orders"
          className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
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
                {totalItemsCount > 0 ? `${totalItemsCount} items` : 'All bookings'}
              </span>
              <span className="text-[11px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                View all <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 3: Pending Review */}
        <Link
          href="/admin/orders?status=PENDING"
          className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
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
              <span>{pendingOrdersCount}</span>
              {pendingOrdersCount > 0 ? (
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
                {pendingOrdersCount > 0 ? 'To confirm' : 'Zero backlog'}
              </span>
              <span className="text-[11px] text-amber-800 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                Review <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 4: Average Order Value (AOV) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-500">
              Avg Order Value
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-300/40 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
              ₹{avgOrderValue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Per basket
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Healthy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SLEEK REFINED FULFILLMENT STATUS PIPELINE */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-bold text-slate-900 tracking-tight">
              Order Pipeline
            </span>
            <span className="text-slate-300 font-normal">•</span>
            <span className="text-[11px] text-slate-500 font-medium">
              {orders.length} orders
            </span>
          </div>

          {statusFilter !== 'ALL' ? (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
            >
              Clear filter ({statusFilter}) ✕
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Filter by stage
            </span>
          )}
        </div>

        {/* Proportional Segmented Progress Strip */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
          {orders.length > 0 ? (
            Object.keys(statusCounts).map((statusKey) => {
              const count = statusCounts[statusKey] || 0;
              if (count === 0) return null;
              const widthPct = (count / orders.length) * 100;
              const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING;
              return (
                <div
                  key={statusKey}
                  style={{ width: `${widthPct}%` }}
                  title={`${cfg.label}: ${count} (${Math.round(widthPct)}%)`}
                  className={`${cfg.barCls} h-full transition-all`}
                />
              );
            })
          ) : (
            <div className="w-full h-full bg-slate-200" />
          )}
        </div>

        {/* Clean, Compact 3-col on Mobile, 6-col on Desktop */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
          {Object.keys(statusCounts).map((statusKey) => {
            const count = statusCounts[statusKey] || 0;
            const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING;
            const isSelected = statusFilter === statusKey;

            return (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(isSelected ? 'ALL' : statusKey)}
                className={`py-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : cfg.chipCls
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotCls}`} />
                  <span className="text-[11px] font-bold truncate">{cfg.label}</span>
                </div>
                <span
                  className={`text-[11px] font-extrabold font-mono px-1 rounded shrink-0 ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-white/80 text-slate-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: RECENT ORDERS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Orders List (Left Column) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3">
          {/* Header & Instant Search Filter */}
          <div className="space-y-2.5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
                    Recent Orders
                  </h3>
                  {statusFilter !== 'ALL' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {statusFilter}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-normal">
                  Latest customer bookings & fulfillment status
                </p>
              </div>

              {/* View All Link */}
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 shrink-0 py-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Search Bar (Spans full width for ease of typing) */}
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order #, customer name, mobile, city..."
                className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 text-xs rounded-lg pl-9 pr-7 py-2 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Orders List */}
          <div className="divide-y divide-slate-100">
            {filteredRecentOrders.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'No orders match your search criteria.'
                    : 'No orders received yet.'}
                </p>
                {(searchQuery || statusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              filteredRecentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const isCopied = copiedOrderId === order.order_number;

                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="py-2.5 sm:py-3 px-2 rounded-xl hover:bg-slate-50 active:bg-slate-100/80 transition-all flex items-center justify-between gap-2.5 group cursor-pointer block -mx-1"
                  >
                    {/* Left: Number, Status & Customer */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {/* Order Number + Copy Button */}
                        <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors">
                          {order.order_number}
                        </span>
                        <button
                          onClick={(e) => handleCopyOrderNumber(e, order.order_number)}
                          title="Copy Order Number"
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeCls}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                          {cfg.label}
                        </span>

                        {/* Items Count */}
                        {order.items && order.items.length > 0 && (
                          <span className="hidden sm:inline-flex items-center text-[10px] text-slate-400 font-medium">
                            • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </span>
                        )}
                      </div>

                      {/* Customer info & Location (Now has full breathing room!) */}
                      <p className="text-xs text-slate-600 font-medium truncate mt-1">
                        <span className="font-bold text-slate-800">{order.customer_name}</span>
                        <span className="text-slate-400 mx-1">•</span>
                        <span className="text-slate-500">{order.city}, {order.state}</span>
                      </p>
                    </div>

                    {/* Right: Amount, Date & Subtle Arrow */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                      <div>
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 block group-hover:text-amber-700 transition-colors">
                          ₹{(order.grand_total || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Store Info */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Shortcuts Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 fill-amber-500/30" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                  Quick Shortcuts
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/60">
                Fast Access
              </span>
            </div>

            <div className="space-y-1">
              {/* Review Pending Orders */}
              <Link
                href="/admin/orders?status=PENDING"
                className="p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100/80 flex items-center justify-between text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block leading-tight truncate">
                      Review Pending
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {pendingOrdersCount} awaiting confirmation
                    </span>
                  </div>
                </div>
                {pendingOrdersCount > 0 ? (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full border border-amber-300/80 shadow-2xs shrink-0">
                    {pendingOrdersCount}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                )}
              </Link>

              {/* Manage Products */}
              <Link
                href="/admin/products"
                className="p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100/80 flex items-center justify-between text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block leading-tight truncate">
                      Product Catalog
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {productCount > 0 ? `${productCount} active crackers` : 'Manage rates & stocks'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>

              {/* Categories */}
              <Link
                href="/admin/categories"
                className="p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100/80 flex items-center justify-between text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block leading-tight truncate">
                      Categories
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      Organize sparklers & pots
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>

              {/* Notifications */}
              <Link
                href="/admin/notifications"
                className="p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100/80 flex items-center justify-between text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-700 ring-1 ring-purple-500/20 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block leading-tight truncate">
                      Notifications
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      Order alerts & system logs
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </div>

          {/* Sivakasi Direct Logistics & Delivery Network Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight leading-none">
                    Sivakasi Dispatch Hub
                  </h3>
                  <span className="text-[10px] text-slate-500 font-normal">Direct Lorry Logistics</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active
              </span>
            </div>

            {/* Delivery Zone Minimum Order Rules */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100/90 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block leading-tight text-[11px] truncate">
                      Tamil Nadu (Home)
                    </span>
                    <span className="text-[10px] text-slate-500">2-3 Days • Local Hub</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono font-bold text-slate-900 text-xs">Min ₹3,000</span>
                  <span className="text-[10px] text-emerald-600 block leading-none font-medium">Free Lorry</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100/90 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block leading-tight text-[11px] truncate">
                      South India (KL/KA/AP/TS)
                    </span>
                    <span className="text-[10px] text-slate-500">3-4 Days • Direct Freight</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono font-bold text-slate-900 text-xs">Min ₹4,000</span>
                  <span className="text-[10px] text-slate-500 block leading-none font-medium">₹150 Freight</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100/90 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block leading-tight text-[11px] truncate">
                      Rest of India
                    </span>
                    <span className="text-[10px] text-slate-500">5-7 Days • Safe Transport</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono font-bold text-slate-900 text-xs">Min ₹5,000</span>
                  <span className="text-[10px] text-slate-500 block leading-none font-medium">₹250 Freight</span>
                </div>
              </div>
            </div>

            {/* Bottom operational verification */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Licensed Sivakasi Depot Pickup</span>
              </div>
              <Link
                href="/admin/profile"
                className="font-semibold text-amber-700 hover:text-amber-800 hover:underline shrink-0 flex items-center gap-0.5 ml-2"
              >
                Settings <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
