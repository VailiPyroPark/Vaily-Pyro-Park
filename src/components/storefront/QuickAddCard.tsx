'use client';

import React from 'react';
import { Plus, Minus, Volume2, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface QuickAddCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const QuickAddCard: React.FC<QuickAddCardProps> = ({ product, onQuickView }) => {
  const { cart, addToCart, updateQuantity } = useCart();

  const cartItem = cart.find((item) => item.product.id === product.id);
  const currentQty = cartItem ? cartItem.quantity : 0;

  const discountPercent = product.mrp > 0 
    ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
    : 0;

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentQty > 0) {
      updateQuantity(product.id, currentQty - 1);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group shadow-2xs hover:shadow-md ${
      currentQty > 0 ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400/30' : 'border-slate-200/90 hover:border-slate-300'
    }`}>
      {/* Product Image */}
      <div 
        onClick={() => onQuickView && onQuickView(product)}
        className="relative w-full aspect-[4/3] bg-slate-100 cursor-pointer overflow-hidden"
      >
        <img
          src={product.image_url || '/logo.png'}
          alt={product.name}
          className={`w-full h-full ${product.image_url ? 'object-cover' : 'object-contain p-2.5'} group-hover:scale-105 transition-transform duration-300`}
          loading="lazy"
        />

        {/* Discount & Bestseller Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start z-10">
          {discountPercent > 0 && (
            <span className="bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase shadow-2xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.is_best_seller && (
            <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
              <Sparkles className="w-2.5 h-2.5" /> BEST
            </span>
          )}
        </div>
      </div>

      {/* Details & Actions */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Pack size & sound tag */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
            <span className="truncate max-w-[90px] font-bold bg-slate-100 px-1.5 py-0.2 rounded">{product.pack_size || '1 Box'}</span>
            {product.sound_level && (
              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.2 rounded text-[9px] flex items-center gap-0.5 font-bold">
                <Volume2 className="w-2.5 h-2.5 text-amber-600" />
                {product.sound_level}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 
            onClick={() => onQuickView && onQuickView(product)}
            className="font-extrabold text-slate-950 text-xs sm:text-sm leading-snug line-clamp-1 cursor-pointer hover:text-amber-600 transition-colors mb-1.5 font-heading"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Price & Stepper Row */}
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 mt-1">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-slate-950 text-sm sm:text-base font-mono">
                ₹{product.selling_price.toLocaleString()}
              </span>
              {product.mrp > product.selling_price && (
                <span className="text-[10px] text-slate-400 line-through font-mono">
                  ₹{product.mrp}
                </span>
              )}
            </div>
          </div>

          {/* Stepper Direct Control */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            {currentQty > 0 ? (
              <>
                <button
                  onClick={handleDecrement}
                  className="w-6 h-6 rounded-lg bg-white text-slate-900 font-black flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer"
                  aria-label="Decrease Quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-black text-xs text-slate-950 font-mono">
                  {currentQty}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer"
                  aria-label="Increase Quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button
                onClick={handleIncrement}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" /> ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
