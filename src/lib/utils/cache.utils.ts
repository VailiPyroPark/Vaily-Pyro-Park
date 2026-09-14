/**
 * High-performance local data caching & Stale-While-Revalidate (SWR) utility.
 * Supports localStorage persistence with in-memory fallback, TTL expiration,
 * background revalidation, and instant cross-tab cache invalidation on mutations.
 */

export interface CacheItem<T> {
  timestamp: number;
  ttlMs: number;
  data: T;
}

export interface CacheStatus<T> {
  data: T | null;
  isFresh: boolean;
  isStale: boolean;
}

class LocalCache {
  private memoryCache = new Map<string, CacheItem<any>>();
  private PREFIX = 'vaily_pyro_cache_';
  // Allow stale data to be served up to 24 hours while revalidating in background
  private STALE_WINDOW_MS = 24 * 60 * 60 * 1000;

  /**
   * Get cached data if valid and within TTL limit.
   */
  get<T>(key: string): T | null {
    const status = this.getWithStatus<T>(key);
    return status.isFresh ? status.data : null;
  }

  /**
   * Synchronous getter that returns cached data whether fresh or stale.
   * Perfect for instant 0ms first-render without waiting for network.
   */
  getSync<T>(key: string): T | null {
    const status = this.getWithStatus<T>(key);
    return status.data;
  }

  /**
   * Evaluates cache status:
   * - isFresh: Within TTL limit.
   * - isStale: Expired past TTL, but within 24hr stale window (serve immediately, refresh in background).
   * - null: Not found or older than 24 hours.
   */
  getWithStatus<T>(key: string): CacheStatus<T> {
    const fullKey = this.PREFIX + key;
    const now = Date.now();

    // 1. Check in-memory Map
    if (this.memoryCache.has(fullKey)) {
      const item = this.memoryCache.get(fullKey)!;
      const age = now - item.timestamp;
      if (age < item.ttlMs) {
        return { data: item.data as T, isFresh: true, isStale: false };
      }
      if (age < item.ttlMs + this.STALE_WINDOW_MS) {
        return { data: item.data as T, isFresh: false, isStale: true };
      }
      this.memoryCache.delete(fullKey);
    }

    // 2. Check localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(fullKey);
        if (raw) {
          const item: CacheItem<T> = JSON.parse(raw);
          const age = now - item.timestamp;

          // Restore to memory cache
          this.memoryCache.set(fullKey, item);

          if (age < item.ttlMs) {
            return { data: item.data, isFresh: true, isStale: false };
          }
          if (age < item.ttlMs + this.STALE_WINDOW_MS) {
            return { data: item.data, isFresh: false, isStale: true };
          }

          // Expired beyond stale window - purge
          window.localStorage.removeItem(fullKey);
        }
      } catch (err) {
        console.warn('LocalCache read error:', err);
      }
    }

    return { data: null, isFresh: false, isStale: false };
  }

  /**
   * Save data into cache with a specified TTL in milliseconds.
   * Default TTL: 10 minutes (600,000ms).
   */
  set<T>(key: string, data: T, ttlMs: number = 10 * 60 * 1000): void {
    const fullKey = this.PREFIX + key;
    const item: CacheItem<T> = {
      timestamp: Date.now(),
      ttlMs,
      data,
    };

    this.memoryCache.set(fullKey, item);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(fullKey, JSON.stringify(item));
      } catch (err) {
        console.warn('LocalCache write error (storage limit reached?):', err);
      }
    }
  }

  /**
   * Invalidate a specific cache key or all cache keys.
   */
  clear(key?: string): void {
    if (key) {
      const fullKey = this.PREFIX + key;
      this.memoryCache.delete(fullKey);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(fullKey);
        } catch (e) {}
      }
    } else {
      this.memoryCache.clear();
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          Object.keys(window.localStorage).forEach((k) => {
            if (k.startsWith(this.PREFIX)) {
              window.localStorage.removeItem(k);
            }
          });
        } catch (e) {}
      }
    }
  }

  /**
   * Broadcasts a catalog invalidation event across the current tab
   * and all other browser tabs/windows.
   */
  broadcastCatalogUpdate(reason: string = 'catalog_updated'): void {
    if (typeof window === 'undefined') return;

    try {
      const detail = { timestamp: Date.now(), reason };
      window.dispatchEvent(new CustomEvent('vpp_catalog_updated', { detail }));

      // Cross-tab sync via BroadcastChannel
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('vpp_catalog_channel');
        bc.postMessage(detail);
        bc.close();
      }

      // Storage event fallback for older browsers
      localStorage.setItem('vpp_catalog_last_updated', Date.now().toString());
    } catch (e) {
      console.warn('Failed to broadcast catalog update:', e);
    }
  }
}

export const localCache = new LocalCache();
