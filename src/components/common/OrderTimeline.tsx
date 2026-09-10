'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCheck,
  AlertCircle,
  XCircle,
  ChevronRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { OrderStatus } from '@/types';

export interface TimelineStep {
  status: OrderStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TIMELINE_STEPS: TimelineStep[] = [
  {
    status: 'PENDING',
    title: 'Order Placed',
    description: 'We received your order and details.',
    icon: Clock,
  },
  {
    status: 'CONFIRMED',
    title: 'Order Confirmed',
    description: 'Order confirmed & sent to warehouse.',
    icon: CheckCircle2,
  },
  {
    status: 'PACKING',
    title: 'Packing',
    description: 'Items being safely packed.',
    icon: Package,
  },
  {
    status: 'DISPATCHED',
    title: 'Dispatched',
    description: 'Order handed to logistics partner.',
    icon: Truck,
  },
  {
    status: 'DELIVERED',
    title: 'Delivered',
    description: 'Successfully delivered to your location.',
    icon: CheckCheck,
  },
];

const STATUS_ORDER_MAP: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PACKING: 2,
  PACKED: 2,
  DISPATCHED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  adminNotes?: string;
  courierPartner?: string;
  trackingNumber?: string;
  interactive?: boolean;
  onUpdateStatus?: (newStatus: OrderStatus) => void;
  embedded?: boolean;
  hideHeader?: boolean;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  status,
  createdAt,
  updatedAt,
  adminNotes,
  courierPartner,
  trackingNumber,
  interactive = false,
  onUpdateStatus,
  embedded = false,
  hideHeader = false,
}) => {
  const currentStepIndex = STATUS_ORDER_MAP[status] ?? 0;
  const isCancelled = status === 'CANCELLED';

  const containerClasses = embedded
    ? 'space-y-4 font-sans'
    : 'bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 font-sans';

  return (
    <div className={containerClasses}>
      {/* Header (hidden if hideHeader is true) */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-black text-sm sm:text-base text-slate-950">
              Live Order Timeline
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isCancelled ? (
              <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-900 text-xs font-black px-3 py-1 rounded-full border border-red-200">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>ORDER CANCELLED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 text-xs font-black px-3 py-1 rounded-full border border-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>STATUS: {status}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-bold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-sm text-red-950">This order has been cancelled.</p>
            <p className="text-xs text-red-700 font-medium mt-0.5">
              If you have any questions or wish to place a new order, please contact customer support.
            </p>
          </div>
        </div>
      )}

      {/* Desktop & Tablet Horizontal Timeline */}
      {!isCancelled && (
        <div className="hidden sm:block py-2">
          <div className="flex items-start justify-between w-full">
            {TIMELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPassed = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <React.Fragment key={step.status}>
                  {/* Step Node */}
                  <div className="flex flex-col items-center text-center shrink-0 w-24">
                    <button
                      type="button"
                      disabled={!interactive || !onUpdateStatus}
                      onClick={() => interactive && onUpdateStatus && onUpdateStatus(step.status)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                      } ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-300/70 shadow-lg shadow-amber-500/25 scale-110'
                          : isPassed
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-white border-2 border-slate-200 text-slate-300'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-5 h-5 stroke-[2.8]" />
                      ) : (
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </button>

                    <div className="mt-3 space-y-0.5">
                      <span
                        className={`text-xs font-extrabold block tracking-tight ${
                          isCurrent
                            ? 'text-amber-950 font-black'
                            : isPassed
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full mt-1 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Connecting Bar Between Steps */}
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className="flex-1 mt-5 px-2">
                      <div
                        className={`h-1 w-full rounded-full transition-all duration-500 ${
                          idx < currentStepIndex
                            ? 'bg-emerald-500'
                            : idx === currentStepIndex
                            ? 'bg-gradient-to-r from-amber-500 to-slate-200'
                            : 'bg-slate-200'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Vertical Stepper - Mathematically Centered */}
      {!isCancelled && (
        <div className="sm:hidden space-y-0 py-1">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isPassed = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isFirst = idx === 0;
            const isLast = idx === TIMELINE_STEPS.length - 1;

            return (
              <div
                key={step.status}
                onClick={() => interactive && onUpdateStatus && onUpdateStatus(step.status)}
                className={`flex items-stretch gap-3.5 transition-all ${
                  interactive ? 'cursor-pointer hover:bg-slate-50 rounded-xl p-1 -m-1' : ''
                }`}
              >
                {/* Fixed-width Icon + Connecting Lines Column */}
                <div className="w-8 flex flex-col items-center shrink-0">
                  {/* Top Line Segment */}
                  <div
                    className={`w-0.5 grow min-h-[10px] ${
                      isFirst
                        ? 'invisible'
                        : isPassed || isCurrent
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />

                  {/* Node Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 my-0.5 relative z-10 transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 font-black ring-4 ring-amber-200 shadow-md scale-105'
                        : isPassed
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    )}
                  </div>

                  {/* Bottom Line Segment */}
                  <div
                    className={`w-0.5 grow min-h-[14px] ${
                      isLast
                        ? 'invisible'
                        : isPassed
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-gradient-to-b from-amber-500 to-slate-200'
                        : 'bg-slate-200'
                    }`}
                  />
                </div>

                {/* Right Content Area */}
                <div className="flex-1 pt-1 pb-4 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-amber-50/80 border border-amber-200/90 shadow-2xs'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          isCurrent
                            ? 'text-amber-950 font-black'
                            : isPassed
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                    {isCurrent && (
                      <p className="text-[11px] text-amber-900/80 font-medium mt-1 leading-snug">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Interactive Quick Step Controls */}
      {interactive && onUpdateStatus && (
        <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Admin Workflow Action: Step Order Status Forward
          </span>
          <div className="flex flex-wrap gap-2">
            {TIMELINE_STEPS.map((step) => {
              const isActive = status === step.status;
              return (
                <button
                  key={step.status}
                  type="button"
                  onClick={() => onUpdateStatus(step.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-400'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <span>{step.title}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-950" />}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onUpdateStatus('CANCELLED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                status === 'CANCELLED'
                  ? 'bg-red-600 text-white font-black shadow-xs'
                  : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
              }`}
            >
              Cancel Order
            </button>
          </div>
        </div>
      )}

      {/* Logistics & Admin Notes Box */}
      {(courierPartner || trackingNumber || adminNotes) && (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
          {courierPartner && (
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-bold text-slate-500">Courier Partner:</span>
              <span className="font-black text-slate-950">{courierPartner}</span>
            </div>
          )}
          {trackingNumber && (
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-bold text-slate-500">Tracking AWB #:</span>
              <span className="font-mono font-black text-amber-700">{trackingNumber}</span>
            </div>
          )}
          {adminNotes && (
            <div className="pt-2 border-t border-slate-200/60">
              <span className="font-bold text-slate-500 block mb-0.5">Status Note:</span>
              <p className="text-slate-800 font-medium italic bg-white p-2 rounded-xl border border-slate-200">
                "{adminNotes}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

