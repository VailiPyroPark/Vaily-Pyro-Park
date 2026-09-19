'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  Sparkles,
  Check,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Product, Category } from '@/types';
import { CategoryIcon } from '@/components/storefront/PriceListTable';

interface BillingProductListProps {
  products: Product[];
  categories: Category[];
  quantities: Map<string, number>;
  onQuantityChange: (productId: string, qty: number) => void;
  onClearAll?: () => void;
}

function formatPiecesCount(packSize?: string): string {
  if (!packSize) return '';
  const trimmed = packSize.trim();
  if (!trimmed) return '';
  if (/^\d+$/.test(trimmed)) {
    return `${trimmed}\u00A0Pcs`;
  }
  return trimmed.replace(/\s+/g, '\u00A0');
}

export function BillingProductList({
  products,
  categories,
  quantities,
  onQuantityChange,
  onClearAll,
}: BillingProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Count products per category
  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const catId = p.category_id || 'uncategorized';
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || p.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: { category: { id: string; name: string }; items: Product[] }[] = [];
    const catMap = new Map<string, Product[]>();

    filteredProducts.forEach((p) => {
      const catId = p.category_id || 'uncategorized';
      if (!catMap.has(catId)) catMap.set(catId, []);
      catMap.get(catId)!.push(p);
    });

    categories.forEach((cat) => {
      const items = catMap.get(cat.id);
      if (items && items.length > 0) {
        groups.push({ category: cat, items });
      }
    });

    const uncat = catMap.get('uncategorized');
    if (uncat && uncat.length > 0) {
      groups.push({ category: { id: 'uncategorized', name: 'Other Fireworks' }, items: uncat });
    }

    return groups;
  }, [filteredProducts, categories]);

  const activeSelectionsCount = useMemo(() => {
    let count = 0;
    quantities.forEach((qty) => {
      if (qty > 0) count++;
    });
    return count;
  }, [quantities]);

  return (
    <div className="w-full space-y-3 sm:space-y-4 font-sans">
      {/* Search & Category Filter Controls */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search product name or SKU..."
              className="w-full pl-8.5 pr-7 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown + Reset */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none pl-8.5 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition-all cursor-pointer truncate"
              >
                <option value="all">All Categories ({products.length} Products)</option>
                {categories.map((cat) => {
                  const count = categoryProductCounts[cat.id] || 0;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {activeSelectionsCount > 0 && onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <span className="hidden sm:inline">Reset Quantities ({activeSelectionsCount})</span>
                <span className="sm:hidden">Reset ({activeSelectionsCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product List Grouped by Category */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-lg font-bold border border-amber-200">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-black text-slate-900 text-sm">No products found</h3>
          <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto">
            Try adjusting your search keyword or selected category filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedProducts.map((group) => {
            let catTotalPcs = 0;
            let catTotalAmount = 0;
            group.items.forEach((item) => {
              const qty = quantities.get(item.id) || 0;
              if (qty > 0) {
                catTotalPcs += qty;
                catTotalAmount += item.selling_price * qty;
              }
            });

            return (
              <div
                key={group.category.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
              >
                {/* Unified Category Header Banner (matching Storefront theme) */}
                <div className="bg-red-700 text-white px-3 sm:px-5 py-2.5 flex items-center justify-between shadow-2xs border-b border-red-800 select-none">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 border border-white/20 shadow-2xs">
                      <CategoryIcon name={group.category.name} className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white font-heading truncate">
                      {group.category.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {catTotalPcs > 0 && (
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>{catTotalPcs} Pcs (₹{catTotalAmount.toLocaleString('en-IN')})</span>
                      </span>
                    )}

                    <span className="bg-red-900/60 text-white font-semibold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-red-500/60 shadow-2xs">
                      {group.items.length} {group.items.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>
                </div>

                {/* Table Content - Responsive table-fixed with zero horizontal scroll */}
                <div className="w-full overflow-hidden">
                  <table className="w-full table-fixed text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[9px] sm:text-xs border-b border-slate-200 select-none">
                        <th className="w-[32px] sm:w-[48px] py-1.5 sm:py-2 px-0.5 sm:px-1 text-center border-r border-slate-200 text-slate-500">
                          IMG
                        </th>
                        <th className="py-1.5 sm:py-2 px-1 sm:px-3 border-r border-slate-200 text-left text-slate-800">
                          PRODUCT
                        </th>
                        <th className="w-[40px] sm:w-[70px] py-1.5 sm:py-2 px-0.5 sm:px-1 text-right border-r border-slate-200 text-slate-700">
                          MRP
                        </th>
                        <th className="w-[42px] sm:w-[72px] py-1.5 sm:py-2 px-0.5 sm:px-1 text-right border-r border-slate-200 text-slate-900">
                          RATE
                        </th>
                        <th className="w-[38px] sm:w-[70px] py-1.5 sm:py-2 px-0.5 sm:px-1 text-center border-r border-slate-200 text-slate-700">
                          QTY
                        </th>
                        <th className="w-[46px] sm:w-[80px] py-1.5 sm:py-2 px-0.5 sm:px-2 text-right text-slate-900">
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((product) => {
                        const qty = quantities.get(product.id) || 0;
                        const itemTotal = product.selling_price * qty;
                        const pieces = formatPiecesCount(product.pack_size);
                        const isSelected = qty > 0;

                        return (
                          <tr
                            key={product.id}
                            className={`border-b border-slate-200/80 transition-colors hover:bg-slate-50 ${
                              isSelected ? 'bg-amber-50/70' : 'bg-white'
                            }`}
                          >
                            {/* 1. IMG */}
                            <td className="w-[32px] sm:w-[48px] py-1 sm:py-2 px-0.5 sm:px-1 text-center border-r border-slate-200/80 align-middle">
                              <div className="relative w-7 h-7 sm:w-10 sm:h-10 bg-slate-50 rounded-lg overflow-hidden border border-slate-200/80 shrink-0 mx-auto shadow-2xs">
                                <img
                                  src={product.image_url || '/logo.png'}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            </td>

                            {/* 2. PRODUCT */}
                            <td className="py-1 sm:py-2 px-1 sm:px-3 border-r border-slate-200/80 align-middle">
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-900 text-[11px] sm:text-sm block leading-tight line-clamp-2 break-words">
                                  {product.name}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                  {pieces && (
                                    <span className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200 font-bold whitespace-nowrap">
                                      {pieces}
                                    </span>
                                  )}
                                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono hidden sm:inline">
                                    {product.sku}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 3. MRP */}
                            <td className="w-[40px] sm:w-[70px] py-1 sm:py-2 px-0.5 sm:px-1 text-right border-r border-slate-200/80 font-mono text-[11px] sm:text-sm text-red-600 line-through decoration-red-400 font-bold align-middle whitespace-nowrap">
                              ₹{product.mrp.toLocaleString('en-IN')}
                            </td>

                            {/* 4. RATE */}
                            <td className="w-[42px] sm:w-[72px] py-1 sm:py-2 px-0.5 sm:px-1 text-right border-r border-slate-200/80 font-mono text-xs sm:text-sm font-black text-slate-950 align-middle whitespace-nowrap">
                              ₹{product.selling_price.toLocaleString('en-IN')}
                            </td>

                            {/* 5. QTY (Strictly numeric text box, NO + or - icons) */}
                            <td className="w-[38px] sm:w-[70px] py-1 sm:py-2 px-0.5 sm:px-1 text-center border-r border-slate-200/80 align-middle">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={qty === 0 ? '' : qty.toString()}
                                placeholder="0"
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                  if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/\D/g, '');
                                  if (clean === '') {
                                    onQuantityChange(product.id, 0);
                                  } else {
                                    const num = parseInt(clean, 10);
                                    onQuantityChange(product.id, isNaN(num) ? 0 : Math.min(Math.max(0, num), 9999));
                                  }
                                }}
                                className={`w-7 sm:w-11 h-6 sm:h-7.5 text-center text-xs sm:text-sm font-black font-mono rounded outline-none transition-all mx-auto block p-0 ${
                                  isSelected
                                    ? 'bg-amber-50 border-2 border-amber-500 text-slate-950 shadow-2xs'
                                    : 'bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-900'
                                }`}
                              />
                            </td>

                            {/* 6. TOTAL */}
                            <td className="w-[46px] sm:w-[80px] py-1 sm:py-2 px-0.5 sm:px-2 text-right font-mono font-black text-xs sm:text-sm align-middle whitespace-nowrap">
                              {isSelected ? (
                                <span className="text-amber-700 font-bold">₹{itemTotal.toLocaleString('en-IN')}</span>
                              ) : (
                                <span className="text-slate-300 font-normal">₹0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
