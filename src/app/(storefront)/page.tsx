'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Gift, ShoppingBag, ChevronRight, Sparkles, SlidersHorizontal, Flame, Volume2, RotateCw, Zap, Rocket, Package } from 'lucide-react';
import { Header } from '@/components/storefront/Header';
import { QuickAddCard } from '@/components/storefront/QuickAddCard';
import { QuickAddListItem } from '@/components/storefront/QuickAddListItem';
import { PriceListTable } from '@/components/storefront/PriceListTable';
import { QuickViewModal } from '@/components/storefront/QuickViewModal';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { Footer } from '@/components/storefront/Footer';
import { Product, Category, Combo, DeliveryZone } from '@/types';
import { useCart } from '@/context/CartContext';
import { ProductService } from '@/lib/services/product.service';

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadDbData() {
      try {
        const [fetchedProducts, fetchedCategories, fetchedCombos, fetchedZones] = await Promise.all([
          ProductService.getAllProducts(),
          ProductService.getCategories(),
          ProductService.getCombos(),
          ProductService.getDeliveryZones(),
        ]);
        setProducts(fetchedProducts);
        setCategories(fetchedCategories);
        setCombos(fetchedCombos);
        setZones(fetchedZones);
      } catch (e) {
        console.error('Failed to load DB catalog', e);
      } finally {
        setPageLoading(false);
      }
    }
    loadDbData();
  }, []);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('vaily_pyro_storefront_state_v1');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
        if (parsed.viewMode) setViewMode(parsed.viewMode);
      }
    } catch (e) {
      console.error('Failed to load storefront state from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          'vaily_pyro_storefront_state_v1',
          JSON.stringify({ selectedCategory, searchQuery, viewMode })
        );
      } catch (e) {
        console.error('Failed to save storefront state to localStorage', e);
      }
    }
  }, [selectedCategory, searchQuery, viewMode, isLoaded]);

  const { cart, itemCount, subtotal, addToCart, remainingForMinOrder, isMinOrderReached } = useCart();

  const totalSavings = useMemo(() => {
    return cart.reduce((acc, item) => {
      const diff = Math.max(0, item.product.mrp - item.product.selling_price);
      return acc + diff * item.quantity;
    }, 0);
  }, [cart]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || product.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Group filtered products by category when browsing all or searching
  const groupedProducts = useMemo(() => {
    const groups: { category: Category | { id: string; name: string }; items: Product[] }[] = [];
    const catMap = new Map<string, Product[]>();

    filteredProducts.forEach((p) => {
      const catId = p.category_id || 'uncategorized';
      if (!catMap.has(catId)) catMap.set(catId, []);
      catMap.get(catId)!.push(p);
    });

    categories.forEach((cat) => {
      const items = catMap.get(cat.id);
      if (items && items.length > 0) {
        groups.push({ category: cat, items });
      }
    });

    // Catch any uncategorized
    const uncat = catMap.get('uncategorized');
    if (uncat && uncat.length > 0) {
      groups.push({ category: { id: 'uncategorized', name: 'Other Fireworks' }, items: uncat });
    }

    return groups;
  }, [filteredProducts, categories]);

  const handleAddComboToCart = (combo: Combo) => {
    const comboProduct: Product = {
      id: combo.id,
      name: combo.name,
      slug: combo.slug,
      sku: `CMB-${combo.id}`,
      description: combo.description,
      pack_size: 'Assortment Box',
      mrp: combo.mrp,
      selling_price: combo.price,
      image_url: combo.image_url,
      is_active: combo.is_active,
      is_featured: true,
      is_best_seller: true,
      sound_level: 'Medium',
    };
    addToCart(comboProduct, 1);
    setIsCartOpen(true);
  };



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-slate-900">
      <div>
        {/* Sticky App Header */}
        <Header
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCart={() => setIsCartOpen(true)}
          categories={categories}
          zones={zones}
        />

        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-5">


          {/* MAIN PRODUCT CATALOGUE SECTION WITH CATEGORY CLASSIFICATION HEADERS */}
          <section className="space-y-4">
            {/* Active Search / Category Filter Badge (Only shown when filtered) */}
            {(searchQuery || selectedCategory !== 'all') && (
              <div className="flex items-center justify-between bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200/80 text-xs font-semibold text-amber-900">
                <div className="flex items-center gap-2 truncate">
                  <span>Showing results for:</span>
                  <span className="font-bold text-slate-900 truncate">
                    {searchQuery ? `"${searchQuery}"` : categories.find((c) => c.id === selectedCategory)?.name}
                  </span>
                  <span className="text-[11px] text-amber-700">({filteredProducts.length} items)</span>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px] border border-amber-300 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center text-xl font-bold">
                  🔍
                </div>
                <h3 className="font-black text-slate-900 text-sm font-heading">No fireworks found</h3>
                <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto">
                  No products matched your search. Try clearing your filter or searching for another keyword like "Sparklers" or "Flower Pots".
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer inline-block"
                >
                  Show All Fireworks
                </button>
              </div>
            ) : (
              /* PRICE LIST TABLE RATE CARD */
              <PriceListTable
                products={products}
                categories={categories}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            )}
          </section>

          {/* CURATED COMBOS SECTION */}
          {combos.length > 0 && (
            <section className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-100 p-4 sm:p-6 rounded-3xl border border-amber-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-2xs">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950 text-base font-heading">Diwali Gift Boxes &amp; Combos</h2>
                    <span className="text-xs font-bold text-amber-700">Factory Direct Value Packs</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-center gap-4"
                  >
                    <img
                      src={combo.image_url || '/images/combo_box.png'}
                      alt={combo.name}
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase">
                          GIFT BOX
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          SAVE ₹{(combo.mrp - combo.price).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate font-heading">
                        {combo.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {combo.description}
                      </p>
                      <div className="pt-1 flex items-center justify-between">
                        <div>
                          <span className="text-base font-black text-slate-950 font-mono">
                            ₹{combo.price.toLocaleString()}
                          </span>
                          {combo.mrp > combo.price && (
                            <span className="text-xs text-slate-400 line-through ml-2 font-mono">
                              ₹{combo.mrp.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddComboToCart(combo)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all active:scale-98 cursor-pointer"
                        >
                          + Add Combo Box
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Sticky Bottom Order Summary Floating Bar (Glassmorphic Premium Design) */}
      {itemCount > 0 && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md md:max-w-lg z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-950/95 backdrop-blur-xl border border-amber-500/50 p-3 sm:p-3.5 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-between gap-3 text-white font-sans">
            {/* Left Info Column */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-400 text-[10px] sm:text-[11px] font-black border border-amber-500/40 shrink-0">
                  <ShoppingBag className="w-3 h-3 text-amber-400" />
                  <span>{itemCount} {itemCount === 1 ? 'Box' : 'Boxes'}</span>
                </span>
                {totalSavings > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Saved ₹{totalSavings.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs text-slate-400 font-medium">Subtotal:</span>
                <span className="text-base sm:text-xl font-black text-white font-mono tracking-tight">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
                {!isMinOrderReached && remainingForMinOrder > 0 && (
                  <span className="text-[10px] text-amber-300 font-medium truncate ml-1 hidden xs:inline">
                    (Add ₹{remainingForMinOrder.toLocaleString('en-IN')} for min order)
                  </span>
                )}
              </div>
            </div>

            {/* Right Action Buttons Column */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-full transition-all cursor-pointer backdrop-blur-md active:scale-95 border border-white/15"
              >
                Cart
              </button>

              <Link
                href="/checkout"
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer glow-gold"
              >
                <span>Order</span>
                <ChevronRight className="w-4 h-4 text-slate-950 stroke-[3]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
}
