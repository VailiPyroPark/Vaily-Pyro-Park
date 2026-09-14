'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string; imageUrl?: string } | null>(null);
  const { settings } = useStoreSettings();

  const {
    cart,
    updateQuantity,
    removeFromCart,
    subtotal,
    savings,
    itemCount,
    selectedZone,
    minOrderThreshold,
    remainingForMinOrder,
    isMinOrderReached,
    deliveryFee,
    grandTotal,
  } = useCart();

  if (!isOpen) return null;

  const isMaxLimitExceeded = Boolean(
    settings?.max_order_limit_enabled &&
    settings?.max_order_limit_amount &&
    subtotal > settings.max_order_limit_amount
  );

  const progressPercent = Math.min(100, Math.round((subtotal / minOrderThreshold) * 100));

  // Clean zone name string (removes trailing "(Home Zone)")
  const cleanZoneName = (selectedZone?.zone_name || 'Home Zone').replace(/\s*\([^)]*\)/g, '');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white text-slate-900 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-950 leading-tight">Your Shopping Cart</h2>
                <span className="text-[11px] text-slate-500 font-medium block -mt-0.5">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} added
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Minimum Order Progress Card */}
          <div className={`border-b px-5 py-3.5 transition-colors ${
            isMinOrderReached ? 'bg-emerald-50/70 border-emerald-200/80' : 'bg-amber-50/70 border-amber-200/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-800 flex items-center gap-1.5">
                {isMinOrderReached ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>Min Order ({cleanZoneName}): ₹{minOrderThreshold.toLocaleString()}</span>
              </span>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                isMinOrderReached
                  ? 'bg-emerald-200/80 text-emerald-950'
                  : 'bg-amber-200/80 text-amber-950'
              }`}>
                {progressPercent}%
              </span>
            </div>

            {/* Progress bar line */}
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden my-1.5">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isMinOrderReached
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold mt-1">
              <span className={isMinOrderReached ? 'text-emerald-800' : 'text-amber-900'}>
                {isMinOrderReached
                  ? '✓ Minimum order requirement met!'
                  : `Add ₹${remainingForMinOrder.toLocaleString()} more to order`}
              </span>
              <span className="text-slate-600 font-bold">
                ₹{subtotal.toLocaleString()} / ₹{minOrderThreshold.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Your Cart is Empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Browse our fireworks list and tap + to quickly add items.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer mt-1"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={product.image_url || '/logo.png'}
                      alt={product.name}
                      className={`w-full h-full ${product.image_url ? 'object-cover' : 'object-contain p-1'}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug break-words">
                      {product.name}
                      {product.pack_size && !product.name.toLowerCase().includes(product.pack_size.toLowerCase()) && (
                        <span className="font-semibold text-slate-500 text-[10px] ml-1">
                          ({product.pack_size})
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">₹{product.selling_price.toLocaleString()} / unit</span>
                      <span className="font-extrabold text-xs text-slate-950">
                        ₹{(product.selling_price * quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Stepper & Trash */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          if (quantity === 1) {
                            setItemToRemove({ id: product.id, name: product.name, imageUrl: product.image_url });
                          } else {
                            updateQuantity(product.id, quantity - 1);
                          }
                        }}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-center shadow-2xs transition-colors cursor-pointer active:scale-95 border border-slate-200/60"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-900">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-2xs transition-colors cursor-pointer active:scale-95"
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setItemToRemove({ id: product.id, name: product.name, imageUrl: product.image_url })}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-5 bg-slate-50/90 border-t border-slate-200/90 space-y-3.5">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Savings:</span>
                    <span>- ₹{savings.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery ({cleanZoneName}):</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ₹{deliveryFee}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-950 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-amber-600 font-mono">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Maximum Order Limit Warning */}
              {isMaxLimitExceeded && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 font-bold flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    Cart total exceeds maximum online limit of ₹{settings?.max_order_limit_amount.toLocaleString('en-IN')}. For bulk purchases, please contact us directly on WhatsApp.
                  </div>
                </div>
              )}

              {isMaxLimitExceeded ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 bg-slate-200 text-slate-500 font-extrabold rounded-2xl flex items-center justify-center gap-2 text-xs cursor-not-allowed border border-slate-300"
                >
                  <span>MAXIMUM LIMIT EXCEEDED</span>
                </button>
              ) : isMinOrderReached ? (
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 text-xs transition-all active:scale-98"
                >
                  <span>PROCEED TO ORDER</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-amber-100 hover:bg-amber-200/80 text-amber-950 font-bold rounded-2xl flex items-center justify-center gap-1.5 text-xs border border-amber-300 transition-colors cursor-pointer"
                >
                  <span>ADD ₹{remainingForMinOrder.toLocaleString()} MORE TO ORDER</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Custom Remove Confirmation Modal */}
      {itemToRemove && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 text-center space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-sm">Remove from Cart?</h3>
              <p className="text-xs text-slate-500 leading-snug">
                Are you sure you want to remove <strong className="text-slate-800 font-bold">{itemToRemove.name}</strong> from your cart?
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setItemToRemove(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeFromCart(itemToRemove.id);
                  setItemToRemove(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
