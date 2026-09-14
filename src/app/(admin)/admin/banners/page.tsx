'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Smartphone,
  Monitor,
  Loader2,
  Link as LinkIcon,
  ArrowLeft,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { SettingsService, StoreSettings } from '@/lib/services/settings.service';

export default function AdminBannersPage() {
  const { settings, refreshSettings } = useStoreSettings();

  const [heroBannerEnabled, setHeroBannerEnabled] = useState<boolean>(true);
  const [bannerImageUrl, setBannerImageUrl] = useState<string>('/hero-banner.webp');
  const [bannerLinkUrl, setBannerLinkUrl] = useState<string>('#catalog');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('mobile');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when settings load
  useEffect(() => {
    if (settings) {
      setHeroBannerEnabled(settings.hero_banner_enabled !== false);
      setBannerImageUrl(settings.hero_banner_image_url || '/hero-banner.webp');
      setBannerLinkUrl(settings.hero_banner_link_url || '#catalog');
    }
  }, [settings]);

  // Handle local image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setBannerImageUrl(objectUrl);
      setSuccessMsg('');
    }
  };

  // Restore pre-built festive Diwali fireworks artwork
  const handleRestoreDefault = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setBannerImageUrl('/hero-banner.webp');
    setSuccessMsg('Restored Diwali 2026 festive fireworks artwork. Click Save to apply.');
  };

  // Save changes to database
  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let finalImageUrl = bannerImageUrl;

      // If a new local file was selected, upload and compress it first
      if (selectedFile) {
        setUploading(true);
        try {
          finalImageUrl = await SettingsService.uploadHeroBannerImage(selectedFile);
        } catch (uploadErr: any) {
          console.error('Banner upload error:', uploadErr);
          setErrorMsg(`Image upload error: ${uploadErr.message || uploadErr}`);
          setSaving(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const updatedSettings: StoreSettings = {
        ...settings,
        hero_banner_enabled: heroBannerEnabled,
        hero_banner_image_url: finalImageUrl || '/hero-banner.webp',
        hero_banner_link_url: bannerLinkUrl.trim() || '#catalog',
      };

      await SettingsService.saveAllSettings(updatedSettings);
      await refreshSettings(true);

      setSelectedFile(null);
      setPreviewUrl('');
      setBannerImageUrl(finalImageUrl);
      setSuccessMsg('Hero banner updated and live on storefront!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Failed to save banner settings:', err);
      setErrorMsg(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20 font-sans antialiased text-slate-900 px-0.5 sm:px-0">
      {/* Sleek Mobile & Desktop Header Card */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/admin"
            className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base text-slate-950 tracking-tight truncate">
                Hero Promotion Banner
              </span>
              <span className="hidden xs:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                <Flame className="w-2.5 h-2.5 text-amber-600" />
                Diwali 2026
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block truncate">
              Upload custom banner or toggle off to show products directly
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200/90 transition-colors flex items-center gap-1.5"
            title="View Live Storefront"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">View Store</span>
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-3.5 sm:px-5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving || uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. VISIBILITY TOGGLE CARD (Attractive Mobile Card with Switch) */}
      <div
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-2xs ${
          heroBannerEnabled
            ? 'bg-gradient-to-r from-emerald-500/10 via-amber-50/40 to-white border-emerald-300/90'
            : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                heroBannerEnabled
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              {heroBannerEnabled ? (
                <Eye className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 block">
                  Storefront Hero Banner
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    heroBannerEnabled
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {heroBannerEnabled ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                {heroBannerEnabled
                  ? 'Turned ON — Visible at top of customer storefront'
                  : 'Turned OFF — Hidden, customers see products list immediately'}
              </p>
            </div>
          </div>

          {/* Large Tactile Switch */}
          <button
            type="button"
            onClick={() => setHeroBannerEnabled(!heroBannerEnabled)}
            className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-2xs ${
              heroBannerEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 sm:h-7 sm:w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                heroBannerEnabled
                  ? 'translate-x-5 sm:translate-x-6'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. BANNER IMAGE CARD (Preview + Compact Mobile Actions) */}
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4 transition-opacity duration-200 ${
          heroBannerEnabled ? 'opacity-100' : 'opacity-50'
        }`}
      >
        {/* Card Header & Mobile / Desktop Preview Toggle */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
              Banner Artwork Preview
            </h2>
          </div>

          {/* Compact Viewport Segment Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </button>
          </div>
        </div>

        {/* Edge-to-Edge Responsive Image Canvas */}
        <div className="w-full flex items-center justify-center">
          <div
            className={`relative overflow-hidden rounded-2xl border border-amber-300/90 shadow-md bg-slate-950 transition-all duration-300 ${
              previewDevice === 'mobile'
                ? 'w-full max-w-sm aspect-[16/9]'
                : 'w-full aspect-[2.1/1] sm:aspect-[2.8/1]'
            }`}
          >
            {bannerImageUrl ? (
              <img
                src={bannerImageUrl}
                alt="Storefront Hero Banner Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                <ImageIcon className="w-8 h-8 text-slate-500" />
                <span className="text-xs font-bold">No banner image uploaded</span>
              </div>
            )}

            {/* Simulated overlay button badge */}
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 pointer-events-none">
              <span className="px-2 py-1 sm:px-3 sm:py-1.5 bg-amber-500 text-slate-950 font-black text-[9px] sm:text-xs rounded-lg shadow-md flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950" />
                <span>Browse Price List</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3 Thumb-Friendly Mobile Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* 1. Upload File */}
          <label className="p-2.5 sm:p-3 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs hover:border-amber-400 group">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-900 truncate max-w-full">
              Upload
            </span>
            <span className="text-[9px] text-slate-400 hidden sm:block">Gallery/File</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleFileChange}
            />
          </label>

          {/* 2. Open Camera */}
          <label className="p-2.5 sm:p-3 bg-amber-50/70 hover:bg-amber-100/70 active:scale-95 border border-amber-200/80 rounded-2xl text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs group">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-amber-950 truncate max-w-full">
              Camera
            </span>
            <span className="text-[9px] text-amber-800/80 hidden sm:block">Snap Photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleFileChange}
            />
          </label>

          {/* 3. Restore Festive Default */}
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="p-2.5 sm:p-3 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-900 truncate max-w-full">
              Default
            </span>
            <span className="text-[9px] text-slate-400 hidden sm:block">Diwali Artwork</span>
          </button>
        </div>

        {/* Compression Badge */}
        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            Client-side image compression active: Photos are automatically scaled &amp; optimized to fast ~80KB WebP before upload.
          </span>
        </div>
      </div>

      {/* 3. BANNER ACTION DESTINATION */}
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3 transition-opacity duration-200 ${
          heroBannerEnabled ? 'opacity-100' : 'opacity-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
            <LinkIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
              When Tapped by Customer
            </h2>
            <p className="text-[11px] text-slate-400">
              Choose the action when a user clicks the banner
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <label
            className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
              bannerLinkUrl === '#catalog'
                ? 'bg-amber-50/70 border-amber-500 ring-1 ring-amber-500/30'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="bannerLinkType"
              checked={bannerLinkUrl === '#catalog'}
              onChange={() => setBannerLinkUrl('#catalog')}
              className="text-amber-500 focus:ring-amber-500"
            />
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900">
                Scroll to Price List (#catalog)
              </span>
              <span className="block text-[10px] text-slate-500">
                Smoothly scrolls down to fireworks rate card
              </span>
            </div>
          </label>

          <label
            className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
              bannerLinkUrl.startsWith('https://wa.me')
                ? 'bg-amber-50/70 border-amber-500 ring-1 ring-amber-500/30'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="bannerLinkType"
              checked={bannerLinkUrl.startsWith('https://wa.me')}
              onChange={() =>
                setBannerLinkUrl(
                  `https://wa.me/${settings.whatsapp_number}?text=Hello%20Vaili%20Pyro%20Park,%20I%20want%20to%20place%20an%20order!`
                )
              }
              className="text-amber-500 focus:ring-amber-500"
            />
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900">
                Open WhatsApp Support
              </span>
              <span className="block text-[10px] text-slate-500">
                Opens direct chat with your helpline
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
