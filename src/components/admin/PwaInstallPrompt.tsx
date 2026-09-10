'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Admin PWA SW Registered:', reg.scope))
        .catch((err) => console.error('Admin PWA SW Register Error:', err));
    }

    // Check standalone state
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
      }

      // Detect iOS device
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(iosDevice);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Chrome/Desktop fallback instructions
      alert('To install VPP Admin as an app:\n1. Click your browser menu (3 dots or address bar icon).\n2. Select "Install Vaili Pyro Park Admin" or "Add to Home Screen".');
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-2xs transition-all cursor-pointer border border-amber-400/70 active:scale-98 shrink-0"
        title="Install Admin App on Desktop or Mobile"
      >
        <Download className="w-3.5 h-3.5 text-slate-950" />
        <span className="text-[11px] sm:text-xs font-bold">Install</span>
      </button>

      {/* iOS Installation Instructions Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-950 text-sm">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Install <strong>Vaili Pyro Park Admin</strong> directly to your home screen for 1-tap offline app access:
            </p>

            <ol className="space-y-3 text-xs font-semibold text-slate-800">
              <li className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <span>Tap the <Share className="w-4 h-4 inline text-blue-500 mx-1" /> <strong>Share</strong> button in Safari toolbar.</span>
              </li>
              <li className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <span>Scroll down & tap <PlusSquare className="w-4 h-4 inline text-slate-700 mx-1" /> <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <span>Tap <strong>Add</strong> in top-right corner to complete.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
