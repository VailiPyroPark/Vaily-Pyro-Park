'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Plus, Upload, Edit, Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Product, Category } from '@/types';
import { ProductService } from '@/lib/services/product.service';
import { BulkCSVImportModal } from '@/components/admin/BulkCSVImportModal';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { DeleteProductModal } from '@/components/admin/DeleteProductModal';

type SortOption =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'mrp-desc'
  | 'mrp-asc'
  | 'sku-asc';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Partial<Product> | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const loadData = async () => {
    const [prodData, catData] = await Promise.all([
      ProductService.getAllProducts(),
      ProductService.getCategories(),
    ]);
    setProducts(prodData);
    setCategories(catData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportProductsCsv = () => {
    if (products.length === 0) return;

    const exportRows = products.map((p) => ({
      name: p.name,
      sku: p.sku,
      pack_size: p.pack_size || '1 Box',
      mrp: p.mrp,
      selling_price: p.selling_price,
      sound_level: p.sound_level || 'Medium',
      stock: p.stock ?? 100,
      category: p.category?.name || '',
      description: p.description || '',
    }));

    const csvContent = Papa.unparse(exportRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `vaily_pyro_products_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered and sorted products computation
  const filteredProducts = useMemo(() => {
    const result = products.filter((p) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.pack_size && p.pack_size.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory =
        selectedCategory === 'ALL' ||
        p.category_id === selectedCategory ||
        p.category?.id === selectedCategory ||
        p.category?.name === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.selling_price - b.selling_price;
        case 'price-desc':
          return b.selling_price - a.selling_price;
        case 'mrp-desc':
          return b.mrp - a.mrp;
        case 'mrp-asc':
          return a.mrp - b.mrp;
        case 'sku-asc':
          return a.sku.localeCompare(b.sku);
        default:
          return 0;
      }
    });
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = (savedProduct: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === savedProduct.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProduct.id ? savedProduct : p));
      }
      return [savedProduct, ...prev];
    });
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handleBulkImportSuccess = async () => {
    await loadData();
  };

  return (
    <div className="space-y-3 font-sans">
      {/* COMPACT TOOLBAR WITH CATEGORY DROPDOWN */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              Catalogue Manager
            </h1>
            <span className="text-[11px] text-slate-500 font-medium block truncate">
              {filteredProducts.length} of {products.length} SKUs listed
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add SKU</span>
            </button>
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-98"
              title="Bulk Import CSV"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Bulk CSV</span>
            </button>
            <button
              onClick={handleExportProductsCsv}
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-98"
              title="Download Product Data as CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* SEARCH BAR, CATEGORY & SORT ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU name, code..."
              className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-800 font-bold bg-slate-200/70 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex-1 sm:flex-initial sm:w-44">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition-all cursor-pointer truncate"
              >
                <option value="ALL">All Categories ({products.length})</option>
                {categories.map((cat) => {
                  const count = products.filter(
                    (p) => p.category_id === cat.id || p.category?.id === cat.id
                  ).length;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex-1 sm:flex-initial sm:w-40">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition-all cursor-pointer truncate"
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="mrp-desc">MRP: High to Low</option>
                <option value="mrp-asc">MRP: Low to High</option>
                <option value="sku-asc">SKU: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* UNIFIED HIGH-DENSITY RESPONSIVE PRODUCT TABLE (Works on all viewports) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center font-bold text-base border border-amber-200">
              📦
            </div>
            <h3 className="font-bold text-xs text-slate-900">No SKUs Match Filters</h3>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSortBy('default');
              }}
              className="mt-1 px-3 py-1 bg-slate-950 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => setSortBy((prev) => (prev === 'name-asc' ? 'name-desc' : 'name-asc'))}
                    className="p-3 sm:p-4 cursor-pointer hover:text-slate-950 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product Name</span>
                      {sortBy === 'name-asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                      ) : sortBy === 'name-desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy((prev) => (prev === 'sku-asc' ? 'default' : 'sku-asc'))}
                    className="p-3 sm:p-4 hidden sm:table-cell cursor-pointer hover:text-slate-950 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SKU</span>
                      {sortBy === 'sku-asc' && <ArrowUp className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                  </th>
                  <th className="p-3 sm:p-4 hidden sm:table-cell">Pack Size</th>
                  <th
                    onClick={() => setSortBy((prev) => (prev === 'mrp-desc' ? 'mrp-asc' : 'mrp-desc'))}
                    className="p-3 sm:p-4 hidden sm:table-cell cursor-pointer hover:text-slate-950 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>MRP</span>
                      {sortBy === 'mrp-desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                      ) : sortBy === 'mrp-asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy((prev) => (prev === 'price-asc' ? 'price-desc' : 'price-asc'))}
                    className="p-3 sm:p-4 cursor-pointer hover:text-slate-950 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Price</span>
                      {sortBy === 'price-asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                      ) : sortBy === 'price-desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="p-3 sm:p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((product) => {
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 sm:p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden font-bold">
                            <img
                              src={product.image_url || '/logo.png'}
                              alt={product.name}
                              className={`w-full h-full ${product.image_url ? 'object-cover' : 'object-contain p-1'}`}
                            />
                          </div>
                          <div className="min-w-0 flex flex-col items-start gap-0.5">
                            <span className="font-semibold text-slate-800 block text-xs sm:text-sm">
                              {product.name}
                            </span>
                            <span className="inline-flex sm:hidden items-center px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/20 font-mono text-[10px] font-bold tracking-wider">
                              {product.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 font-medium text-slate-600 hidden sm:table-cell">
                        {product.sku}
                      </td>
                      <td className="p-3 sm:p-4 text-slate-600 hidden sm:table-cell font-medium">
                        {product.pack_size}
                      </td>
                      <td className="p-3 sm:p-4 text-slate-400 line-through hidden sm:table-cell font-medium">
                        ₹{product.mrp.toLocaleString()}
                      </td>
                      <td className="p-2.5 sm:p-4">
                        <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                          ₹{product.selling_price.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-2.5 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit Product Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        productToEdit={productToEdit}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        product={productToDelete}
        onSuccess={handleDeleteSuccess}
      />

      {/* CSV Importer Modal */}
      <BulkCSVImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={handleBulkImportSuccess}
      />
    </div>
  );
}
