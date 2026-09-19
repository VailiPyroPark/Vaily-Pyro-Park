'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SettingsService, StoreSettings } from '@/lib/services/settings.service';

const SETTINGS_STORAGE_KEY = 'vpp_store_settings_cache_v1';

const DEFAULT_STORE_SETTINGS: StoreSettings = {
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
};

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  refreshSettings: (force?: boolean) => Promise<StoreSettings>;
  updateSettingsState: (newSettings: StoreSettings) => void;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with cached settings if available for instant 0ms first render
  const [settings, setSettings] = useState<StoreSettings>(() => {
    if (typeof window !== 'undefined') {
      const cached = SettingsService.getCachedSettings();
      if (cached) return cached;
      try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(raw) };
      } catch {}
    }
    return DEFAULT_STORE_SETTINGS;
  });

  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async (force = false): Promise<StoreSettings> => {
    try {
      const fresh = await SettingsService.getAllSettings({ forceFresh: force });
      setSettings(fresh);
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(fresh));
      } catch (err) {
        console.warn('Failed to cache settings in localStorage:', err);
      }
      return fresh;
    } catch (e) {
      console.warn('Failed to refresh store settings:', e);
      return DEFAULT_STORE_SETTINGS;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettingsState = useCallback((newSettings: StoreSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.warn('Failed to cache settings in localStorage:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Refresh in background using SWR (no network request if fresh in cache)
    refreshSettings(false);

    // 2. Listen for cross-component update events dispatched when settings are saved
    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<StoreSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        refreshSettings(true);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(parsed);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('vpp_store_settings_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('vpp_store_settings_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshSettings]);

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        updateSettingsState,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_STORE_SETTINGS,
      loading: false,
      refreshSettings: async () => DEFAULT_STORE_SETTINGS,
      updateSettingsState: () => {},
    };
  }
  return context;
};
