import { createClient } from '@/lib/supabase/client';
import { localCache } from '@/lib/utils/cache.utils';
import { compressImageFile } from '@/lib/utils/image-compress.utils';

export interface StoreSettings {
  store_name: string;
  tagline: string;
  helpline_mobile: string;
  whatsapp_number: string;
  gstin: string;
  announcement_banner: string;
  discount_percentage: number;
  store_address: string;
  max_order_limit_enabled: boolean;
  max_order_limit_amount: number;
  min_order_tamil_nadu: number;
  min_order_other_states: number;
  state_min_order_overrides: Record<string, number>;
  hero_banner_enabled: boolean;
  hero_banner_image_url: string;
  hero_banner_link_url: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
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

export class SettingsService {
  private static getSupabase() {
    return createClient();
  }

  /**
   * Synchronous getter for instant 0ms setting retrieval.
   */
  static getCachedSettings(): StoreSettings | null {
    return localCache.getSync<StoreSettings>('store_settings');
  }

  /**
   * Fetch all store settings with 10-minute caching & SWR.
   * Prevents repeated Supabase DB queries on every navigation.
   */
  static async getAllSettings(options?: { forceFresh?: boolean }): Promise<StoreSettings> {
    const status = localCache.getWithStatus<StoreSettings>('store_settings');

    if (!options?.forceFresh) {
      if (status.isFresh && status.data) {
        return status.data;
      }
      if (status.isStale && status.data) {
        this.revalidateSettings();
        return status.data;
      }
    }

    return this.fetchSettingsFromDb();
  }

  private static async fetchSettingsFromDb(): Promise<StoreSettings> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value');

      if (error || !data || data.length === 0) {
        console.warn('Settings fetch failed, using defaults:', error?.message);
        return { ...DEFAULT_SETTINGS };
      }

      const settingsMap: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => {
        settingsMap[row.key] = row.value;
      });

      const parsedDiscount = settingsMap['discount_percentage']
        ? Number(settingsMap['discount_percentage'])
        : DEFAULT_SETTINGS.discount_percentage;

      const parsedMaxLimit = settingsMap['max_order_limit_amount']
        ? Number(settingsMap['max_order_limit_amount'])
        : DEFAULT_SETTINGS.max_order_limit_amount;

      const parsedMinTn = settingsMap['min_order_tamil_nadu']
        ? Number(settingsMap['min_order_tamil_nadu'])
        : DEFAULT_SETTINGS.min_order_tamil_nadu;

      const parsedMinOther = settingsMap['min_order_other_states']
        ? Number(settingsMap['min_order_other_states'])
        : DEFAULT_SETTINGS.min_order_other_states;

      let parsedStateOverrides: Record<string, number> = {};
      if (settingsMap['state_min_order_overrides']) {
        try {
          parsedStateOverrides = JSON.parse(settingsMap['state_min_order_overrides']);
        } catch {
          parsedStateOverrides = {};
        }
      }

      const heroBannerEnabled = settingsMap['hero_banner_enabled'] !== undefined
        ? settingsMap['hero_banner_enabled'] === 'true'
        : DEFAULT_SETTINGS.hero_banner_enabled;

      const settings: StoreSettings = {
        store_name: settingsMap['store_name'] ?? DEFAULT_SETTINGS.store_name,
        tagline: settingsMap['tagline'] ?? DEFAULT_SETTINGS.tagline,
        helpline_mobile: settingsMap['helpline_mobile'] ?? DEFAULT_SETTINGS.helpline_mobile,
        whatsapp_number: settingsMap['whatsapp_number'] ?? DEFAULT_SETTINGS.whatsapp_number,
        gstin: settingsMap['gstin'] !== undefined ? settingsMap['gstin'] : DEFAULT_SETTINGS.gstin,
        announcement_banner: settingsMap['announcement_banner'] ?? DEFAULT_SETTINGS.announcement_banner,
        discount_percentage: !isNaN(parsedDiscount) && parsedDiscount >= 0 ? parsedDiscount : DEFAULT_SETTINGS.discount_percentage,
        store_address: settingsMap['store_address'] ?? DEFAULT_SETTINGS.store_address,
        max_order_limit_enabled: settingsMap['max_order_limit_enabled'] === 'true',
        max_order_limit_amount: !isNaN(parsedMaxLimit) && parsedMaxLimit > 0 ? parsedMaxLimit : DEFAULT_SETTINGS.max_order_limit_amount,
        min_order_tamil_nadu: !isNaN(parsedMinTn) && parsedMinTn > 0 ? parsedMinTn : DEFAULT_SETTINGS.min_order_tamil_nadu,
        min_order_other_states: !isNaN(parsedMinOther) && parsedMinOther > 0 ? parsedMinOther : DEFAULT_SETTINGS.min_order_other_states,
        state_min_order_overrides: parsedStateOverrides,
        hero_banner_enabled: heroBannerEnabled,
        hero_banner_image_url: settingsMap['hero_banner_image_url'] || DEFAULT_SETTINGS.hero_banner_image_url,
        hero_banner_link_url: settingsMap['hero_banner_link_url'] || DEFAULT_SETTINGS.hero_banner_link_url,
      };

      localCache.set('store_settings', settings, 10 * 60 * 1000); // 10 min TTL
      return settings;
    } catch (e) {
      console.warn('Settings fetch exception, using defaults:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  private static async revalidateSettings(): Promise<void> {
    try {
      const fresh = await this.fetchSettingsFromDb();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vpp_store_settings_updated', { detail: fresh }));
      }
    } catch {}
  }

  /**
   * Upload hero banner image to Supabase Storage with client-side compression & 1-year cache.
   */
  static async uploadHeroBannerImage(file: File): Promise<string> {
    const compressedFile = await compressImageFile(file, {
      maxWidth: 1600,
      maxHeight: 900,
      quality: 0.85,
    });

    const supabase = this.getSupabase();
    const fileExt = compressedFile.name.split('.').pop() || 'webp';
    const fileName = `hero-banner-${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedFile, {
          cacheControl: '31536000',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err: any) {
      console.warn('Supabase banner upload failed, using Data URL fallback:', err?.message || err);
    }

    // Fallback to Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '/hero-banner.webp');
      };
      reader.onerror = () => resolve('/hero-banner.webp');
      reader.readAsDataURL(compressedFile);
    });
  }

  /**
   * Get active global discount percentage directly.
   */
  static async getDiscountPercentage(): Promise<number> {
    const settings = await this.getAllSettings();
    return settings.discount_percentage ?? 80;
  }

  /**
   * Save active global discount percentage directly.
   */
  static async updateDiscountPercentage(percent: number): Promise<boolean> {
    return this.saveSetting('discount_percentage', String(percent));
  }

  /**
   * Save all store settings to the database using upsert.
   * Each key-value pair is upserted atomically.
   */
  static async saveAllSettings(settings: StoreSettings): Promise<boolean> {
    const supabase = this.getSupabase();
    const rows = [
      { key: 'store_name', value: settings.store_name },
      { key: 'tagline', value: settings.tagline },
      { key: 'helpline_mobile', value: settings.helpline_mobile },
      { key: 'whatsapp_number', value: settings.whatsapp_number },
      { key: 'gstin', value: settings.gstin },
      { key: 'announcement_banner', value: settings.announcement_banner },
      { key: 'discount_percentage', value: String(settings.discount_percentage) },
      { key: 'store_address', value: settings.store_address },
      { key: 'max_order_limit_enabled', value: String(settings.max_order_limit_enabled) },
      { key: 'max_order_limit_amount', value: String(settings.max_order_limit_amount) },
      { key: 'min_order_tamil_nadu', value: String(settings.min_order_tamil_nadu) },
      { key: 'min_order_other_states', value: String(settings.min_order_other_states) },
      { key: 'state_min_order_overrides', value: JSON.stringify(settings.state_min_order_overrides || {}) },
      { key: 'hero_banner_enabled', value: String(settings.hero_banner_enabled) },
      { key: 'hero_banner_image_url', value: settings.hero_banner_image_url || '/hero-banner.webp' },
      { key: 'hero_banner_link_url', value: settings.hero_banner_link_url || '#catalog' },
    ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));

    const { error } = await supabase
      .from('store_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      console.error('Failed to save settings:', error);
      throw new Error(error.message || 'Failed to save store settings.');
    }

    localCache.clear('store_settings');
    localCache.set('store_settings', settings, 10 * 60 * 1000);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vpp_store_settings_cache_v1', JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('vpp_store_settings_updated', { detail: settings }));
      } catch (err) {
        console.warn('Failed to dispatch settings update event:', err);
      }
    }

    return true;
  }

  /**
   * Update a single setting value.
   */
  static async saveSetting(key: keyof StoreSettings, value: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const { error } = await supabase
      .from('store_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.error(`Failed to save setting [${key}]:`, error);
      throw new Error(error.message);
    }

    localCache.clear('store_settings');

    if (typeof window !== 'undefined') {
      try {
        const fresh = await this.getAllSettings({ forceFresh: true });
        localStorage.setItem('vpp_store_settings_cache_v1', JSON.stringify(fresh));
        window.dispatchEvent(new CustomEvent('vpp_store_settings_updated', { detail: fresh }));
      } catch (err) {
        console.warn('Failed to broadcast single setting update:', err);
      }
    }

    return true;
  }
}
