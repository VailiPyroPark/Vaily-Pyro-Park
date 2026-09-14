import { createClient } from '@/lib/supabase/client';
import { Product, Category, DeliveryZone, Combo } from '@/types';
import { localCache } from '@/lib/utils/cache.utils';
import { compressImageFile } from '@/lib/utils/image-compress.utils';

export class ProductService {
  private static getSupabase() {
    return createClient();
  }

  /**
   * Manually invalidate local cache (e.g. after admin updates).
   */
  static clearCache(key?: string): void {
    localCache.clear(key);
    localCache.broadcastCatalogUpdate(key || 'all');
  }

  /**
   * Synchronous getter: Returns cached products immediately without any network latency.
   */
  static getCachedProducts(): Product[] | null {
    return localCache.getSync<Product[]>('products_all');
  }

  /**
   * Synchronous getter: Returns cached categories immediately.
   */
  static getCachedCategories(): Category[] | null {
    return localCache.getSync<Category[]>('categories');
  }

  /**
   * Synchronous getter: Returns cached delivery zones immediately.
   */
  static getCachedDeliveryZones(): DeliveryZone[] | null {
    return localCache.getSync<DeliveryZone[]>('delivery_zones');
  }

  /**
   * Synchronous getter: Returns cached combos immediately.
   */
  static getCachedCombos(): Combo[] | null {
    return localCache.getSync<Combo[]>('combos');
  }

  /**
   * Upload product image file to Supabase Storage ('product-images' bucket).
   * Automatically downscales & compresses oversized photos (e.g. 5-10MB mobile camera photos)
   * to 40KB-80KB WebP before upload, drastically slashing Supabase storage egress & upload time.
   * Sets 1-year immutable cache header on Supabase Storage.
   */
  static async uploadProductImage(file: File): Promise<string> {
    // 1. Client-side compression
    const compressedFile = await compressImageFile(file, {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.82,
    });

    const supabase = this.getSupabase();
    const fileExt = compressedFile.name.split('.').pop() || 'webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedFile, {
          cacheControl: '31536000', // 1-year immutable cache header
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else {
        console.warn('Supabase storage bucket upload failed, using Data URL fallback:', error?.message);
      }
    } catch (err: any) {
      console.warn('Supabase storage upload exception, using Data URL fallback:', err?.message || err);
    }

    // Fallback: Convert compressed file to Base64 Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve('/logo.png');
        }
      };
      reader.onerror = () => {
        resolve('/logo.png');
      };
      reader.readAsDataURL(compressedFile);
    });
  }

  /**
   * Delete product image file from Supabase Storage ('product-images' bucket)
   * to avoid unwanted storage consumption when an image is replaced or removed.
   */
  static async deleteProductImage(imageUrl: string): Promise<boolean> {
    if (!imageUrl || imageUrl.startsWith('data:') || imageUrl === '/logo.png' || imageUrl.includes('logo.png')) {
      return false;
    }

    try {
      const supabase = this.getSupabase();
      let filePath = '';

      if (imageUrl.includes('product-images/')) {
        filePath = imageUrl.split('product-images/')[1];
      } else if (imageUrl.includes('products/')) {
        filePath = 'products/' + imageUrl.split('products/')[1];
      }

      if (filePath) {
        filePath = filePath.split('?')[0];
        const { error } = await supabase.storage.from('product-images').remove([filePath]);
        if (error) {
          console.warn('Supabase storage delete error:', error.message);
          return false;
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Supabase storage delete exception:', err.message || err);
      return false;
    }
  }

  /**
   * Fetch all active categories from Supabase DB (Cached 30 min with Stale-While-Revalidate).
   */
  static async getCategories(options?: { forceFresh?: boolean }): Promise<Category[]> {
    const cacheKey = 'categories';
    const status = localCache.getWithStatus<Category[]>(cacheKey);

    if (!options?.forceFresh) {
      if (status.isFresh && status.data) {
        return status.data;
      }
      if (status.isStale && status.data) {
        // Return stale data immediately, revalidate silently in background
        this.revalidateCategories();
        return status.data;
      }
    }

    return this.fetchCategoriesFromDb();
  }

  private static async fetchCategoriesFromDb(): Promise<Category[]> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data) return [];
      const categories = data as Category[];
      localCache.set('categories', categories, 30 * 60 * 1000); // 30 min TTL
      return categories;
    } catch (e) {
      console.warn('Failed to fetch categories from Supabase:', e);
      return [];
    }
  }

  private static async revalidateCategories(): Promise<void> {
    try {
      const fresh = await this.fetchCategoriesFromDb();
      if (fresh.length > 0) {
        localCache.broadcastCatalogUpdate('categories_revalidated');
      }
    } catch {}
  }

  /**
   * Create new category in Supabase DB.
   */
  static async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const supabase = this.getSupabase();
    const slug = categoryData.slug || (categoryData.name || 'category').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const payload = {
      name: categoryData.name,
      slug,
      description: categoryData.description || '',
      icon_name: categoryData.icon_name || 'Sparkles',
      display_order: categoryData.display_order || 1,
      is_active: categoryData.is_active !== undefined ? categoryData.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase createCategory error:', error);
      throw error || new Error('Failed to create category.');
    }

    localCache.clear('categories');
    localCache.broadcastCatalogUpdate('category_created');
    return data as Category;
  }

  /**
   * Update category in Supabase DB.
   */
  static async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
    const supabase = this.getSupabase();
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (categoryData.name) {
      payload.name = categoryData.name;
      payload.slug = categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (categoryData.description !== undefined) payload.description = categoryData.description;
    if (categoryData.icon_name !== undefined) payload.icon_name = categoryData.icon_name;
    if (categoryData.display_order !== undefined) payload.display_order = categoryData.display_order;
    if (categoryData.is_active !== undefined) payload.is_active = categoryData.is_active;

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase updateCategory error:', error);
      throw error || new Error('Failed to update category.');
    }

    localCache.clear('categories');
    localCache.broadcastCatalogUpdate('category_updated');
    return data as Category;
  }

  /**
   * Delete category from Supabase DB.
   */
  static async deleteCategory(id: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteCategory error:', error);
      throw error;
    }
    localCache.clear('categories');
    localCache.broadcastCatalogUpdate('category_deleted');
    return true;
  }

  /**
   * Update delivery zone threshold and fees in Supabase DB.
   */
  static async updateDeliveryZone(id: string, zoneData: Partial<DeliveryZone>): Promise<DeliveryZone> {
    const supabase = this.getSupabase();
    const payload: any = {};

    if (zoneData.zone_name) payload.zone_name = zoneData.zone_name;
    if (zoneData.min_order_amount !== undefined) payload.min_order_amount = zoneData.min_order_amount;
    if (zoneData.delivery_fee !== undefined) payload.delivery_fee = zoneData.delivery_fee;
    if (zoneData.estimated_days !== undefined) payload.estimated_days = zoneData.estimated_days;
    if (zoneData.is_active !== undefined) payload.is_active = zoneData.is_active;

    const { data, error } = await supabase
      .from('delivery_zones')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase updateDeliveryZone error:', error);
      throw error || new Error('Failed to update delivery zone.');
    }

    localCache.clear('delivery_zones');
    localCache.broadcastCatalogUpdate('zone_updated');
    return data as DeliveryZone;
  }

  /**
   * Fetch all products from Supabase DB (Cached 10 min with Stale-While-Revalidate).
   * Delivers 0ms instant load from local cache, saving >95% Supabase database egress.
   */
  static async getAllProducts(options?: { forceFresh?: boolean }): Promise<Product[]> {
    const cacheKey = 'products_all';
    const status = localCache.getWithStatus<Product[]>(cacheKey);

    if (!options?.forceFresh) {
      if (status.isFresh && status.data) {
        return status.data;
      }
      if (status.isStale && status.data) {
        // Return stale data immediately for instant render, revalidate in background
        this.revalidateProducts();
        return status.data;
      }
    }

    return this.fetchProductsFromDb();
  }

  private static async fetchProductsFromDb(): Promise<Product[]> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('sku', { ascending: true });

      if (error || !data) return [];

      const mapped: Product[] = data.map((item: any) => ({
        id: item.id,
        category_id: item.category_id,
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        description: item.description,
        pack_size: item.pack_size,
        mrp: Number(item.mrp),
        selling_price: Number(item.selling_price),
        image_url: item.image_url,
        is_active: item.is_active,
        is_featured: item.is_featured,
        is_best_seller: item.is_best_seller,
        sound_level: item.sound_level,
        stock: item.stock ?? 100,
        category: item.category,
      }));

      localCache.set('products_all', mapped, 10 * 60 * 1000); // 10 min TTL
      return mapped;
    } catch (e) {
      console.warn('Failed to fetch products from Supabase:', e);
      return [];
    }
  }

  private static async revalidateProducts(): Promise<void> {
    try {
      const fresh = await this.fetchProductsFromDb();
      if (fresh.length > 0) {
        localCache.broadcastCatalogUpdate('products_revalidated');
      }
    } catch {}
  }

  /**
   * Create new product in Supabase DB.
   */
  static async createProduct(productData: Partial<Product>, initialStock: number = 100): Promise<Product> {
    const supabase = this.getSupabase();
    const slug = productData.slug || (productData.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const payload = {
      name: productData.name,
      slug,
      sku: productData.sku,
      category_id: productData.category_id || null,
      description: productData.description || '',
      pack_size: productData.pack_size || '1 Box',
      mrp: productData.mrp || 0,
      selling_price: productData.selling_price || 0,
      image_url: productData.image_url || null,
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      is_featured: productData.is_featured || false,
      is_best_seller: productData.is_best_seller || false,
      sound_level: productData.sound_level || 'Medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select('*, category:categories(*)')
      .single();

    if (error || !data) {
      console.error('Supabase createProduct error:', error);
      throw error || new Error('Failed to create product in database.');
    }

    localCache.clear('products_all');
    localCache.broadcastCatalogUpdate('product_created');
    return {
      id: data.id,
      category_id: data.category_id,
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      description: data.description,
      pack_size: data.pack_size,
      mrp: Number(data.mrp),
      selling_price: Number(data.selling_price),
      image_url: data.image_url,
      is_active: data.is_active,
      is_featured: data.is_featured,
      is_best_seller: data.is_best_seller,
      sound_level: data.sound_level,
      stock: initialStock,
      category: data.category,
    };
  }

  /**
   * Update existing product in Supabase DB.
   */
  static async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const supabase = this.getSupabase();

    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (productData.name) {
      payload.name = productData.name;
      payload.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (productData.sku) payload.sku = productData.sku;
    if (productData.category_id !== undefined) payload.category_id = productData.category_id;
    if (productData.description !== undefined) payload.description = productData.description;
    if (productData.pack_size !== undefined) payload.pack_size = productData.pack_size;
    if (productData.mrp !== undefined) payload.mrp = productData.mrp;
    if (productData.selling_price !== undefined) payload.selling_price = productData.selling_price;
    if (productData.image_url !== undefined) payload.image_url = productData.image_url;
    if (productData.is_active !== undefined) payload.is_active = productData.is_active;
    if (productData.is_featured !== undefined) payload.is_featured = productData.is_featured;
    if (productData.is_best_seller !== undefined) payload.is_best_seller = productData.is_best_seller;
    if (productData.sound_level !== undefined) payload.sound_level = productData.sound_level;

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error || !data) {
      console.error('Supabase updateProduct error:', error);
      throw error || new Error('Failed to update product in database.');
    }

    localCache.clear('products_all');
    localCache.broadcastCatalogUpdate('product_updated');
    return {
      id: data.id,
      category_id: data.category_id,
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      description: data.description,
      pack_size: data.pack_size,
      mrp: Number(data.mrp),
      selling_price: Number(data.selling_price),
      image_url: data.image_url,
      is_active: data.is_active,
      is_featured: data.is_featured,
      is_best_seller: data.is_best_seller,
      sound_level: data.sound_level,
      stock: data.stock ?? 100,
      category: data.category,
    };
  }

  /**
   * Delete product from Supabase DB.
   */
  static async deleteProduct(id: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteProduct error:', error);
      throw error;
    }
    localCache.clear('products_all');
    localCache.broadcastCatalogUpdate('product_deleted');
    return true;
  }

  /**
   * Recalculate and update selling_price for all products in DB based on global discount %.
   * Formula: selling_price = Math.round(mrp * (1 - discountPercentage / 100))
   */
  static async applyGlobalDiscount(discountPercentage: number): Promise<{ updatedCount: number }> {
    const supabase = this.getSupabase();
    const { data: products, error } = await supabase
      .from('products')
      .select('id, mrp');

    if (error || !products) {
      console.error('Failed to fetch products for global discount:', error);
      throw error || new Error('Failed to fetch products from database.');
    }

    const factor = Math.max(0, (100 - discountPercentage) / 100);

    // Process in chunks of 25 parallel updates for speed & stability
    const chunkSize = 25;
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((p) => {
          const mrp = Number(p.mrp) || 0;
          const selling_price = Math.max(0, Math.round(mrp * factor));
          return supabase
            .from('products')
            .update({ selling_price, updated_at: new Date().toISOString() })
            .eq('id', p.id);
        })
      );
    }

    localCache.clear('products_all');
    localCache.broadcastCatalogUpdate('discount_applied');
    return { updatedCount: products.length };
  }

  /**
   * Bulk insert/upsert products from CSV import into Supabase DB.
   */
  static async bulkCreateProducts(productsList: (Partial<Product> & { category?: string; stock?: number })[]): Promise<boolean> {
    const supabase = this.getSupabase();

    const { data: categories } = await supabase.from('categories').select('id, name');
    const categoryMap = new Map<string, string>();
    if (categories) {
      categories.forEach((c) => categoryMap.set(c.name.toLowerCase().trim(), c.id));
    }
    const defaultCategoryId = categories?.[0]?.id || null;

    const payloads = productsList.map((p, idx) => {
      const catName = p.category ? p.category.toLowerCase().trim() : '';
      const catId = categoryMap.get(catName) || defaultCategoryId;

      return {
        category_id: catId,
        name: p.name,
        slug: (p.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now()}-${idx}`,
        sku: p.sku || `SKU-${Date.now()}-${idx}`,
        description: p.description || `${p.name} - Authentic Sivakasi Fireworks.`,
        pack_size: p.pack_size || '1 Box',
        mrp: p.mrp || 0,
        selling_price: p.selling_price || 0,
        image_url: p.image_url || null,
        is_active: p.is_active !== undefined ? p.is_active : true,
        is_featured: p.is_featured || false,
        is_best_seller: p.is_best_seller || false,
        sound_level: p.sound_level || 'Medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { data: inserted, error } = await supabase
      .from('products')
      .upsert(payloads, { onConflict: 'sku' })
      .select();

    if (error) {
      console.error('Supabase bulkCreateProducts error:', error);
      throw error;
    }

    localCache.clear('products_all');
    localCache.broadcastCatalogUpdate('bulk_products_imported');
    return true;
  }

  /**
   * Fetch active combos for the storefront (Cached 15 min with SWR).
   */
  static async getCombos(options?: { forceFresh?: boolean }): Promise<Combo[]> {
    const cacheKey = 'combos';
    const status = localCache.getWithStatus<Combo[]>(cacheKey);

    if (!options?.forceFresh) {
      if (status.isFresh && status.data) {
        return status.data;
      }
      if (status.isStale && status.data) {
        this.revalidateCombos();
        return status.data;
      }
    }

    return this.fetchCombosFromDb();
  }

  private static async fetchCombosFromDb(): Promise<Combo[]> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('combos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      const combos: Combo[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        price: Number(c.price),
        mrp: Number(c.mrp),
        image_url: c.image_url,
        is_active: c.is_active,
      }));

      localCache.set('combos', combos, 15 * 60 * 1000); // 15 min TTL
      return combos;
    } catch (e) {
      console.warn('Failed to fetch combos:', e);
      return [];
    }
  }

  private static async revalidateCombos(): Promise<void> {
    try {
      const fresh = await this.fetchCombosFromDb();
      if (fresh.length > 0) {
        localCache.broadcastCatalogUpdate('combos_revalidated');
      }
    } catch {}
  }

  /**
   * Fetch ALL combos (including inactive) for the admin panel.
   */
  static async getAllCombos(): Promise<Combo[]> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('combos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug ?? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: c.description,
        price: Number(c.price),
        mrp: Number(c.mrp),
        image_url: c.image_url,
        is_active: c.is_active,
      }));
    } catch (e) {
      console.warn('Failed to fetch all combos:', e);
      return [];
    }
  }

  /**
   * Create a new combo in Supabase DB.
   */
  static async createCombo(comboData: Partial<Combo>): Promise<Combo> {
    const supabase = this.getSupabase();
    const slug = (comboData.name ?? 'combo')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .concat(`-${Date.now()}`);

    const payload = {
      name: comboData.name,
      slug,
      description: comboData.description ?? '',
      price: comboData.price ?? 0,
      mrp: comboData.mrp ?? 0,
      image_url: comboData.image_url ?? null,
      is_active: comboData.is_active !== undefined ? comboData.is_active : true,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('combos').insert(payload).select().single();
    if (error || !data) {
      console.error('createCombo error:', error);
      throw error ?? new Error('Failed to create combo.');
    }

    localCache.clear('combos');
    localCache.broadcastCatalogUpdate('combo_created');
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: Number(data.price),
      mrp: Number(data.mrp),
      image_url: data.image_url,
      is_active: data.is_active,
    };
  }

  /**
   * Update an existing combo in Supabase DB.
   */
  static async updateCombo(id: string, comboData: Partial<Combo>): Promise<Combo> {
    const supabase = this.getSupabase();
    const payload: any = {};
    if (comboData.name !== undefined) {
      payload.name = comboData.name;
      payload.slug = comboData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (comboData.description !== undefined) payload.description = comboData.description;
    if (comboData.price !== undefined) payload.price = comboData.price;
    if (comboData.mrp !== undefined) payload.mrp = comboData.mrp;
    if (comboData.image_url !== undefined) payload.image_url = comboData.image_url;
    if (comboData.is_active !== undefined) payload.is_active = comboData.is_active;

    const { data, error } = await supabase.from('combos').update(payload).eq('id', id).select().single();
    if (error || !data) {
      console.error('updateCombo error:', error);
      throw error ?? new Error('Failed to update combo.');
    }

    localCache.clear('combos');
    localCache.broadcastCatalogUpdate('combo_updated');
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: Number(data.price),
      mrp: Number(data.mrp),
      image_url: data.image_url,
      is_active: data.is_active,
    };
  }

  /**
   * Delete a combo from Supabase DB.
   */
  static async deleteCombo(id: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const { error } = await supabase.from('combos').delete().eq('id', id);
    if (error) {
      console.error('deleteCombo error:', error);
      throw error;
    }
    localCache.clear('combos');
    localCache.broadcastCatalogUpdate('combo_deleted');
    return true;
  }

  /**
   * Fetch ALL delivery zones from Supabase DB (Cached 60 min with SWR).
   */
  static async getDeliveryZones(options?: { forceFresh?: boolean }): Promise<DeliveryZone[]> {
    const cacheKey = 'delivery_zones';
    const status = localCache.getWithStatus<DeliveryZone[]>(cacheKey);

    if (!options?.forceFresh) {
      if (status.isFresh && status.data) {
        return status.data;
      }
      if (status.isStale && status.data) {
        this.revalidateDeliveryZones();
        return status.data;
      }
    }

    return this.fetchDeliveryZonesFromDb();
  }

  private static async fetchDeliveryZonesFromDb(): Promise<DeliveryZone[]> {
    const FALLBACK: DeliveryZone[] = [
      {
        id: 'zone-tn',
        zone_name: 'Tamil Nadu (Home Zone)',
        state_codes: ['TN', 'Tamil Nadu'],
        min_order_amount: 3000,
        delivery_fee: 0,
        estimated_days: '2-3 Days',
        is_active: true,
      },
      {
        id: 'zone-south',
        zone_name: 'South India',
        state_codes: ['PY', 'KL', 'KA', 'AP', 'TS', 'Puducherry', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
        min_order_amount: 4000,
        delivery_fee: 150,
        estimated_days: '3-4 Days',
        is_active: true,
      },
      {
        id: 'zone-rest',
        zone_name: 'Rest of India',
        state_codes: ['ALL'],
        min_order_amount: 5000,
        delivery_fee: 250,
        estimated_days: '5-7 Days',
        is_active: true,
      },
    ];

    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true);

      if (error || !data || data.length === 0) return FALLBACK;
      const zones = data as DeliveryZone[];
      localCache.set('delivery_zones', zones, 60 * 60 * 1000); // 60 min TTL
      return zones;
    } catch (e) {
      return FALLBACK;
    }
  }

  private static async revalidateDeliveryZones(): Promise<void> {
    try {
      await this.fetchDeliveryZonesFromDb();
    } catch {}
  }

  /**
   * Toggle product active status in Supabase.
   */
  static async toggleProductActive(id: string, currentStatus: boolean): Promise<boolean> {
    try {
      const supabase = this.getSupabase();
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      localCache.clear('products_all');
      localCache.broadcastCatalogUpdate('product_toggled');
      return !currentStatus;
    } catch (e) {
      console.error('Failed to update product active state in Supabase:', e);
      return !currentStatus;
    }
  }

  static async toggleProductStatus(id: string, currentStatus: boolean): Promise<boolean> {
    return this.toggleProductActive(id, currentStatus);
  }
}
