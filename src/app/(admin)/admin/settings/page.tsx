'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Truck,
  IndianRupee,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { SettingsService, StoreSettings } from '@/lib/services/settings.service';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { ProductService } from '@/lib/services/product.service';
import { DeliveryZone } from '@/types';

const ALL_INDIAN_STATES = [
  'Tamil Nadu',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export default function AdminSettingsPage() {
  const { updateSettingsState } = useStoreSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Vaily Pyro Park',
    tagline: 'Sivakasi Direct Fireworks Outlet',
    helpline_mobile: '+91 99521 08746',
    whatsapp_number: '919952108746',
    gstin: '',
    announcement_banner: '⚡ DIWALI PRE-BOOKING OPEN: Get up to 80% OFF Factory Direct Rates!',
    discount_percentage: 80,
    store_address: '3/421 Anjaneyar Nagar, Sattur Main Road, Anuppankulam, Sivakasi.',
    max_order_limit_enabled: false,
    max_order_limit_amount: 50000,
    min_order_tamil_nadu: 3000,
    min_order_other_states: 5000,
    state_min_order_overrides: {},
    hero_banner_enabled: true,
    hero_banner_image_url: '/hero-banner.webp',
    hero_banner_link_url: '#catalog',
  });

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isCustomStatesOpen, setIsCustomStatesOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedSettings, fetchedZones] = await Promise.all([
        SettingsService.getAllSettings(),
        ProductService.getDeliveryZones(),
      ]);
      setSettings(fetchedSettings);
      setZones(fetchedZones);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      showToast('error', err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStateOverrideChange = (stateName: string, value: string) => {
    const numValue = value ? Number(value) : undefined;
    setSettings((prev) => {
      const updatedOverrides = { ...(prev.state_min_order_overrides || {}) };
      if (numValue && numValue > 0) {
        updatedOverrides[stateName] = numValue;
      } else {
        delete updatedOverrides[stateName];
      }
      return { ...prev, state_min_order_overrides: updatedOverrides };
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await SettingsService.saveAllSettings(settings);
      updateSettingsState(settings);

      // Sync delivery_zones in DB
      const updatePromises = zones.map((zone) => {
        let minAmount = zone.min_order_amount;
        if (zone.id === 'zone-tn' || zone.zone_name.toLowerCase().includes('tamil')) {
          minAmount = settings.min_order_tamil_nadu;
        } else if (zone.id === 'zone-rest' || zone.zone_name.toLowerCase().includes('rest')) {
          minAmount = settings.min_order_other_states;
        }
        return ProductService.updateDeliveryZone(zone.id, {
          min_order_amount: minAmount,
          delivery_fee: zone.delivery_fee,
        });
      });

      await Promise.all(updatePromises);
      showToast('success', 'Settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      showToast('error', err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="flex items-center gap-2.5 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-800">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Settings...</span>
        </div>
      </div>
    );
  }

  const customOverrideCount = Object.keys(settings.state_min_order_overrides || {}).length;
  const filteredStates = ALL_INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  return (
    <div className="space-y-3 sm:space-y-4 font-sans max-w-2xl mx-auto pb-24 sm:pb-12 px-1 sm:px-0">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 left-4 sm:left-auto z-50 p-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border border-emerald-800'
              : 'bg-rose-950 text-rose-100 border border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/admin"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-950 tracking-tight truncate">
              Store Settings
            </h1>
            <span className="text-[11px] text-slate-400 font-medium block">
              Bill address &amp; order limits
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {/* Quick Link Card to Hero Banner Management */}
      <Link
        href="/admin/banners"
        className="bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-white border border-amber-300/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-amber-400 transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-900 block truncate">
              Hero Promotion Banner
            </span>
            <span className="text-[11px] text-slate-500 block truncate">
              Upload custom storefront banner image or toggle visibility on / off
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-700 shrink-0">
          <span>Manage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </Link>

      <form onSubmit={handleSave} className="space-y-3 sm:space-y-4">
        {/* CARD 1: ADDRESS IN BILL & STORE INFO */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900">
              Address &amp; Bill Details
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Store Name */}
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Store Name
              </label>
              <input
                type="text"
                required
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-amber-500 transition-all text-xs"
                placeholder="Vaili Pyro Park"
              />
            </div>

            {/* Address in Bill */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold text-[11px]">
                  Address in Bill (Printed on Bill &amp; Site)
                </label>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/70">
                  Bill Address
                </span>
              </div>
              <textarea
                rows={2}
                required
                value={settings.store_address}
                onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                placeholder="142/A Bypass Road, Sivakasi Industrial Estate, Tamil Nadu - 626123"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all leading-relaxed"
              />
            </div>

            {/* Helpline & WhatsApp in 2 cols */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  Helpline Mobile
                </label>
                <input
                  type="text"
                  value={settings.helpline_mobile}
                  onChange={(e) => setSettings({ ...settings, helpline_mobile: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white focus:border-amber-500"
                  placeholder="+91 99521 08746"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white focus:border-amber-500"
                  placeholder="919952108746"
                />
              </div>
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                GSTIN Number
              </label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase text-xs focus:outline-none focus:bg-white focus:border-amber-500"
                placeholder="Optional (e.g. 33AAAFF9012K1Z5)"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: MINIMUM ORDER AMOUNTS */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">
                Minimum Order Amount
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Tamil Nadu Home State */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
              <span className="font-black text-amber-950 text-xs block leading-tight">
                Tamil Nadu
              </span>
              <span className="text-[10px] text-amber-800 font-medium block">
                Home State
              </span>
              <div className="relative pt-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-800 font-black text-xs">₹</span>
                <input
                  type="number"
                  min={500}
                  step={100}
                  required
                  value={settings.min_order_tamil_nadu}
                  onChange={(e) =>
                    setSettings({ ...settings, min_order_tamil_nadu: Number(e.target.value) })
                  }
                  className="w-full pl-6 pr-2 py-1.5 bg-white border border-amber-300 rounded-lg font-black text-slate-950 font-mono text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Other States Default */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-black text-slate-900 text-xs block leading-tight">
                Other States
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                All Other States
              </span>
              <div className="relative pt-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">₹</span>
                <input
                  type="number"
                  min={500}
                  step={100}
                  required
                  value={settings.min_order_other_states}
                  onChange={(e) =>
                    setSettings({ ...settings, min_order_other_states: Number(e.target.value) })
                  }
                  className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-black text-slate-950 font-mono text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Collapsible: Custom States Override */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsCustomStatesOpen(!isCustomStatesOpen)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Specific State Overrides</span>
                {customOverrideCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                    {customOverrideCount} set
                  </span>
                )}
              </div>
              {isCustomStatesOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {isCustomStatesOpen && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search state..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredStates.map((stateName) => {
                    const isTn = stateName === 'Tamil Nadu';
                    const customVal = settings.state_min_order_overrides?.[stateName];
                    return (
                      <div
                        key={stateName}
                        className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                          isTn
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950 font-bold'
                            : customVal
                            ? 'bg-white border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <span className="font-semibold text-slate-800 truncate pr-2">
                          {stateName}
                        </span>

                        {isTn ? (
                          <span className="text-[11px] font-bold text-amber-800 font-mono">
                            ₹{settings.min_order_tamil_nadu}
                          </span>
                        ) : (
                          <div className="relative w-24 shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₹</span>
                            <input
                              type="number"
                              min={500}
                              step={100}
                              placeholder={String(settings.min_order_other_states)}
                              value={customVal ?? ''}
                              onChange={(e) => handleStateOverrideChange(stateName, e.target.value)}
                              className="w-full pl-5 pr-1.5 py-1 text-right text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-amber-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: MAXIMUM ORDER LIMIT (ON / OFF) */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h2 className="font-extrabold text-sm text-slate-900">
                Maximum Order Limit
              </h2>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold ${settings.max_order_limit_enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                {settings.max_order_limit_enabled ? 'ON' : 'OFF'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, max_order_limit_enabled: !settings.max_order_limit_enabled })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.max_order_limit_enabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.max_order_limit_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Amount input shown if enabled */}
          {settings.max_order_limit_enabled ? (
            <div className="pt-1">
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Maximum Order Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">₹</span>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={settings.max_order_limit_amount}
                  onChange={(e) =>
                    setSettings({ ...settings, max_order_limit_amount: Number(e.target.value) })
                  }
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-950 font-mono text-sm focus:bg-white focus:border-amber-500 transition-all"
                  placeholder="50000"
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 font-medium">
              No maximum limit currently active. Turn ON to set an upper cap.
            </p>
          )}
        </div>

        {/* BOTTOM SAVE BUTTON (DESKTOP / INLINE) */}
        <div className="pt-1 hidden sm:flex justify-end gap-2">
          <Link
            href="/admin"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-98 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {/* STICKY BOTTOM SAVE BAR FOR MOBILE */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center gap-2 shadow-lg">
          <Link
            href="/admin"
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-2 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
