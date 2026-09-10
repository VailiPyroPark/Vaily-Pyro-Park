'use client';

import React from 'react';
import { X, Package, Volume2, Layers, Tag, Sparkles } from 'lucide-react';
import { OrderItem, Product } from '@/types';

interface AdminProductModalProps {
  item: OrderItem | null;
  product?: Product | null;
  onClose: () => void;
}

export function AdminProductModal({ item, product, onClose }: AdminProductModalProps) {
  if (!item) return null;

  const unitPrice = item.unit_price || product?.selling_price || 0;
  const mrp = product?.mrp || unitPrice;
  const discountPercent = mrp > unitPrice ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-98 duration-150 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">
                PRODUCT DETAILS
              </span>
              <h3 className="text-xs font-bold text-slate-500">
                Item Info & Specifications
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Product Name & Image Container */}
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/90 text-center space-y-4">
          {/* Main Full Product Name - Displayed in full without truncation */}
          <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-snug break-words">
            {item.product_name}
          </h2>

          {/* Large Center Product Image */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-2xl bg-white text-amber-700 border border-slate-200/90 flex items-center justify-center font-bold text-4xl shadow-sm overflow-hidden">
            <img
              src={item.image_url || product?.image_url || '/logo.png'}
              alt={item.product_name}
              className={`w-full h-full ${(item.image_url || product?.image_url) ? 'object-cover' : 'object-contain p-3'}`}
            />
          </div>

          {/* Product Specification Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold">
            {product?.sku && (
              <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-lg font-mono">
                SKU: {product.sku}
              </span>
            )}
            {product?.category?.name && (
              <span className="bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                {product.category.name}
              </span>
            )}
            {product?.sound_level && (
              <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{product.sound_level} Sound</span>
              </span>
            )}
          </div>

          {/* Pricing Row */}
          <div className="pt-1 space-y-0.5 border-t border-slate-200/70">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-2xl font-black text-amber-700 font-mono">
                ₹{unitPrice.toLocaleString('en-IN')}
              </span>
              {mrp > unitPrice && (
                <span className="text-sm text-slate-400 line-through font-mono">
                  ₹{mrp.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded-md">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 font-semibold block">
              Pack Size: {product?.pack_size || '1 Box'}
            </span>
          </div>
        </div>

        {/* Order Quantity & Line Total Summary */}
        <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold">Ordered Qty:</span>
            <span className="bg-amber-500 text-slate-950 font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg shadow-2xs">
              {item.quantity} Units
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-500 text-[10px] block font-bold">Line Total</span>
            <span className="text-sm sm:text-base font-black text-slate-950 font-mono">
              ₹{(item.total_price || item.quantity * unitPrice).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Stock & Optional Description */}
        <div className="space-y-2 text-xs">
          {product?.stock !== undefined && (
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
              <span className="font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Current Warehouse Stock:</span>
              </span>
              <span className="font-mono font-black text-slate-950">
                {product.stock} units available
              </span>
            </div>
          )}

          {product?.description && (
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Product Description
              </span>
              <p className="text-slate-700 text-xs font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
        >
          Close Product Info
        </button>
      </div>
    </div>
  );
}
