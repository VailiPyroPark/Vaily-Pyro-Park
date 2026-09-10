'use client';

import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Calendar,
  Filter,
  Download,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Order } from '@/types';

interface OrderFilterToolbarProps {
  orders: Order[];
  filteredOrders: Order[];
  activeStatusTab: string;
  setActiveStatusTab: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'cards' | 'table';
  setViewMode: (mode: 'cards' | 'table') => void;
  selectedOrderIds: string[];
  onSelectAll: () => void;
  onResetFilters: () => void;
  onExportCSV?: () => void;
}

const STATUS_OPTIONS: { key: string; label: string; dotCls: string }[] = [
  { key: 'ALL', label: 'All Orders', dotCls: 'bg-slate-400' },
  { key: 'PENDING', label: 'Pending', dotCls: 'bg-amber-500' },
  { key: 'CONFIRMED', label: 'Confirmed', dotCls: 'bg-blue-500' },
  { key: 'PACKING', label: 'Packing', dotCls: 'bg-indigo-500' },
  { key: 'DISPATCHED', label: 'Dispatched', dotCls: 'bg-purple-500' },
  { key: 'DELIVERED', label: 'Delivered', dotCls: 'bg-emerald-500' },
  { key: 'CANCELLED', label: 'Cancelled', dotCls: 'bg-rose-500' },
];

const DATE_OPTIONS = [
  { key: 'ALL', label: 'All Dates' },
  { key: 'Today', label: 'Today' },
  { key: 'Last 7 Days', label: 'Last 7 Days' },
  { key: 'This Month', label: 'This Month' },
];

export function OrderFilterToolbar({
  orders,
  filteredOrders,
  activeStatusTab,
  setActiveStatusTab,
  dateFilter,
  setDateFilter,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  selectedOrderIds,
  onSelectAll,
  onResetFilters,
  onExportCSV,
}: OrderFilterToolbarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  const getStatusCount = (status: string) => {
    if (status === 'ALL') return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  const getStatusLabel = (key: string) => {
    if (key === 'ALL') return 'Status: All';
    const found = STATUS_OPTIONS.find((s) => s.key === key);
    return found ? `Status: ${found.label}` : `Status: ${key}`;
  };

  const hasActiveFilters =
    activeStatusTab !== 'ALL' || dateFilter !== 'ALL' || searchQuery.trim() !== '';

  return (
    <div className="font-sans">
      {/* 2-Row Compact Control Actions Box */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 sm:space-y-2.5">
        {/* ROW 1: Full Width Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search order #, customer name, mobile, city..."
            className={`w-full text-slate-900 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none transition-all placeholder:text-slate-400 font-medium ${
              isSearchFocused || searchQuery
                ? 'bg-white border border-amber-500 ring-2 ring-amber-500/15 shadow-2xs'
                : 'bg-slate-50/90 border border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 bg-slate-200/60 hover:bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* ROW 2: Filter Dropdowns, Reset Pill, Export, and View Switcher */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
            {/* Order Status Dropdown Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                  setIsDateDropdownOpen(false);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                  activeStatusTab !== 'ALL'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold ring-1 ring-amber-400/30'
                    : 'bg-slate-50/90 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate max-w-[85px] sm:max-w-none">
                  {getStatusLabel(activeStatusTab)}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isStatusDropdownOpen ? 'rotate-180 text-slate-700' : ''
                  }`}
                />
              </button>

              {isStatusDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsStatusDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-1.5 w-52 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      Filter by Order Status
                    </div>
                    {STATUS_OPTIONS.map((st) => {
                      const isSelected = activeStatusTab === st.key;
                      return (
                        <button
                          key={st.key}
                          onClick={() => {
                            setActiveStatusTab(st.key);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-50 text-amber-950 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${st.dotCls}`} />
                            <span className="truncate">{st.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 font-mono text-slate-600 font-bold">
                              {getStatusCount(st.key)}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-700" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsDateDropdownOpen(!isDateDropdownOpen);
                  setIsStatusDropdownOpen(false);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                  dateFilter !== 'ALL'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold ring-1 ring-amber-400/30'
                    : 'bg-slate-50/90 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate max-w-[75px] sm:max-w-none">
                  {dateFilter === 'ALL' ? 'Date: All' : dateFilter}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isDateDropdownOpen ? 'rotate-180 text-slate-700' : ''
                  }`}
                />
              </button>

              {isDateDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDateDropdownOpen(false)}
                  />
                  <div className="absolute left-0 sm:left-auto mt-1.5 w-44 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      Time Range
                    </div>
                    {DATE_OPTIONS.map((d) => {
                      const isSelected = dateFilter === d.key;
                      return (
                        <button
                          key={d.key}
                          onClick={() => {
                            setDateFilter(d.key);
                            setIsDateDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-50 text-amber-950 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{d.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-700" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* 1-Click Reset Filters Pill */}
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 border border-transparent hover:border-rose-200/70 transition-all cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Export CSV Button */}
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200/80 hover:border-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline text-[11px]">Export</span>
              </button>
            )}

            {/* Segmented View Mode Toggle */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
