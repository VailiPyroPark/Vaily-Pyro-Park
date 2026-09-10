'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Volume2, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const [qtyInput, setQtyInput] = useState(1);

  if (!product) return null;

  const cartItem = cart.find((item) => item.product.id === product.id);
  const currentInCart = cartItem ? cartItem.quantity : 0;

  const discountPercent = product.mrp > 0 
    ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, qtyInput);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Column */}
          <div className="relative bg-slate-100 min-h-[260px] md:min-h-full flex items-center justify-center">
            <img
              src={product.image_url || '/logo.png'}
              alt={product.name}
              className={`w-full h-full ${product.image_url ? 'object-cover' : 'object-contain p-6'}`}
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-md">
                {discountPercent}% OFF FACTORY RATE
              </span>
            )}
          </div>

          {/* Details Column */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md">
                  {product.pack_size || 'Factory Pack'}
                </span>
                {product.sound_level && (
                  <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-amber-600" /> Sound: {product.sound_level}
                  </span>
                )}
              </div>

              <h2 className="font-extrabold text-slate-900 text-xl leading-tight mb-2">
                {product.name}
              </h2>

              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                {product.description || 'Authentic certified Sivakasi fireworks crafted for maximum visual beauty, stability, and festive joy.'}
              </p>

              {/* Price Row */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-2xl text-slate-950">
                    ₹{product.selling_price.toLocaleString()}
                  </span>
                  {product.mrp > product.selling_price && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{product.mrp.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                  Save ₹{(product.mrp - product.selling_price).toLocaleString()} per box
                </span>
              </div>
            </div>

            {/* Stepper & Add Action */}
            <div className="space-y-3">
              {currentInCart > 0 && (
                <div className="text-xs font-bold text-amber-700 bg-amber-50 p-2 rounded-xl flex items-center justify-between border border-amber-200">
                  <span>Currently in Cart:</span>
                  <span>{currentInCart} units (₹{(currentInCart * product.selling_price).toLocaleString()})</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                  <button
                    onClick={() => setQtyInput((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg bg-white text-slate-900 font-bold flex items-center justify-center shadow-xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-black text-sm">{qtyInput}</span>
                  <button
                    onClick={() => setQtyInput((q) => q + 1)}
                    className="w-9 h-9 rounded-lg bg-white text-slate-900 font-bold flex items-center justify-center shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart();
                    onClose();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ADD TO CART</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
