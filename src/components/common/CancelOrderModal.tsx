'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, X, Loader2, Ban, ChevronDown, Check } from 'lucide-react';
import { Order } from '@/types';

interface CancelOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string) => Promise<void>;
}

const CANCELLATION_REASONS = [
  'Ordered by mistake',
  'Need to change delivery address or phone',
  'Want to change cracker items in my order',
  'Found alternative or better price',
  'Estimated delivery time is too late',
  'Changed mind / no longer needed',
  'Other reason',
];

export function CancelOrderModal({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const fullReason =
        selectedReason === 'Other reason' && customNotes.trim()
          ? `Other: ${customNotes.trim()}`
          : customNotes.trim()
          ? `${selectedReason} - ${customNotes.trim()}`
          : selectedReason;

      await onConfirmCancel(fullReason);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to cancel order. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-150 font-sans my-auto">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-b from-rose-50/80 to-white border-b border-slate-100 rounded-t-3xl flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
              <Ban className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                Order Cancellation
              </span>
              <h3 className="font-black text-base sm:text-lg text-slate-950 truncate">
                Cancel #{order.order_number}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {order.customer_name} • <span className="font-bold text-slate-700">₹{order.grand_total.toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Custom Reason Selector Dropdown */}
          <div className="space-y-1.5 relative z-30" ref={dropdownRef}>
            <label className="font-extrabold text-slate-800 block text-xs">
              Reason for Cancellation:
            </label>
            <div className="relative">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between pl-3.5 pr-3 py-2.5 bg-white border-2 rounded-xl text-xs font-bold text-slate-900 transition-all shadow-2xs cursor-pointer text-left ${
                  isDropdownOpen
                    ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="truncate pr-2">{selectedReason}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-rose-600' : ''
                  }`}
                />
              </button>

              {/* Floating Custom Menu on TOP in z-index */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xl py-1.5 z-[60] max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150 [scrollbar-width:thin]">
                  {CANCELLATION_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setSelectedReason(reason);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs text-left transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50 text-rose-950 font-black'
                            : 'text-slate-700 font-semibold hover:bg-slate-50 hover:text-slate-950'
                        }`}
                      >
                        <span className="truncate pr-2">{reason}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-rose-600 shrink-0 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Show Additional Notes ONLY if 'Other reason' is selected */}
          {selectedReason === 'Other reason' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="font-bold text-slate-700 block text-xs">
                Please specify your reason:
              </label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                disabled={isSubmitting}
                placeholder="Provide additional details..."
                className="w-full p-3 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-colors resize-none shadow-2xs"
              />
            </div>
          )}


          {/* Action Buttons: Balanced & Symmetrical */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer active:scale-98 text-center"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancel</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

