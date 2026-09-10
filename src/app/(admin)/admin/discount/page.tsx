'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { SettingsService } from '@/lib/services/settings.service';
import { ProductService } from '@/lib/services/product.service';

export default function AdminDiscountPage() {
  const [loading, setLoading] = useState(true);
  const [discountPercent, setDiscountPercent] = useState<number>(75);
  const [savedPercent, setSavedPercent] = useState<number>(75);
  const [productsCount, setProductsCount] = useState<number>(0);

  // Sample MRP for live preview
  const sampleMrp = 1000;

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settings, products] = await Promise.all([
          SettingsService.getAllSettings(),
          ProductService.getAllProducts(),
        ]);
        const current = settings.discount_percentage ?? 75;
        setDiscountPercent(current);
        setSavedPercent(current);
        setProductsCount(products.length);
      } catch (err) {
        console.error('Failed to load discount settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const sampleSellingPrice = Math.max(0, Math.round(sampleMrp * ((100 - discountPercent) / 100)));
  const sampleSavings = Math.max(0, sampleMrp - sampleSellingPrice);

  const handleSaveOnly = async () => {
    if (discountPercent < 0 || discountPercent > 99) {
      showToast('error', 'Discount must be between 0% and 99%');
      return;
    }

    try {
      setIsSaving(true);
      await SettingsService.updateDiscountPercentage(discountPercent);
      await SettingsService.saveSetting(
        'announcement_banner',
        `⚡ DIWALI PRE-BOOKING OPEN: Get up to ${discountPercent}% OFF Factory Direct Rates!`
      );
      setSavedPercent(discountPercent);
      showToast('success', `Discount saved: ${discountPercent}% OFF`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyAll = async () => {
    setShowConfirmModal(false);
    try {
      setIsApplyingAll(true);
      await SettingsService.updateDiscountPercentage(discountPercent);
      await SettingsService.saveSetting(
        'announcement_banner',
        `⚡ DIWALI PRE-BOOKING OPEN: Get up to ${discountPercent}% OFF Factory Direct Rates!`
      );
      setSavedPercent(discountPercent);

      const res = await ProductService.applyGlobalDiscount(discountPercent);
      showToast('success', `Updated all ${res.updatedCount} products to ${discountPercent}% OFF`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to apply discount');
    } finally {
      setIsApplyingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 font-sans">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 font-sans pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Store Discount
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-calculates product selling price from MRP
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-black text-amber-900">
            {savedPercent}% Active
          </span>
        </div>
      </div>

      {/* Toast Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
        {/* Preset Pills */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Presets
          </span>
          <div className="flex flex-wrap gap-2">
            {[50, 60, 70, 75, 80, 85, 90].map((val) => {
              const isSelected = discountPercent === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDiscountPercent(val)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-xs scale-105 font-black'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {val}% OFF
                </button>
              );
            })}
          </div>
        </div>

        {/* Input + Slider */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Discount Rate</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={99}
                value={discountPercent}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (!isNaN(num)) setDiscountPercent(Math.min(99, Math.max(0, num)));
                }}
                className="w-20 text-2xl font-black text-center text-slate-900 bg-white border border-slate-300 rounded-xl py-1 px-2 outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-sm font-black text-slate-600">%</span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={95}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Live Calculation Preview */}
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Price Preview
            </span>
            <span className="text-[11px] font-bold text-amber-800">
              {discountPercent}% OFF
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm bg-white p-3 rounded-xl border border-amber-200/60 font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">MRP</span>
              <span className="font-bold text-slate-500 line-through">₹{sampleMrp}</span>
            </div>
            <div className="text-center">
              <span className="text-emerald-700 text-[10px] block font-sans font-bold">You Save</span>
              <span className="font-bold text-emerald-600">-₹{sampleSavings}</span>
            </div>
            <div className="text-right">
              <span className="text-amber-800 text-[10px] block font-sans font-bold">Selling Price</span>
              <span className="font-black text-base text-slate-950">₹{sampleSellingPrice}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleSaveOnly}
            disabled={isSaving || isApplyingAll}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save for New SKUs</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSaving || isApplyingAll}
            className="py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isApplyingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Apply to All Products ({productsCount})</span>
          </button>
        </div>
      </div>

      {/* Simple Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-black text-slate-900 text-base">
              Apply {discountPercent}% OFF to all products?
            </h3>
            <p className="text-xs text-slate-600">
              This will update the selling price of all{' '}
              <strong className="text-slate-900">{productsCount} products</strong> in your store.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyAll}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Yes, Update All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
