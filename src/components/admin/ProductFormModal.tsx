'use client';

import React, { useState, useEffect } from 'react';
import { X, Package, AlertCircle, Camera, Upload, Loader2, Lock, Unlock, Trash2, Image as ImageIcon } from 'lucide-react';
import { Product, Category, SoundLevel } from '@/types';
import { ProductService } from '@/lib/services/product.service';
import { SettingsService } from '@/lib/services/settings.service';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Partial<Product> | null;
  onSuccess: (savedProduct: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const isEditing = Boolean(productToEdit?.id);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [packSize, setPackSize] = useState('1 Box');
  const [mrp, setMrp] = useState<number>(200);
  const [sellingPrice, setSellingPrice] = useState<number>(50);
  const [stock, setStock] = useState<number>(100);
  const [soundLevel, setSoundLevel] = useState<SoundLevel>('Medium');
  const [imageUrl, setImageUrl] = useState('');
  const [initialImageUrl, setInitialImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(80);
  const [isManualPriceOverride, setIsManualPriceOverride] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadMetadata() {
      const [cats, disc] = await Promise.all([
        ProductService.getCategories(),
        SettingsService.getDiscountPercentage(),
      ]);
      setCategories(cats);
      setDiscountPercent(disc);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    }
    if (isOpen) {
      loadMetadata();
    }
  }, [isOpen]);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setCategoryId(productToEdit.category_id || '');
      setPackSize(productToEdit.pack_size || '1 Box');
      setMrp(productToEdit.mrp || 0);
      setSellingPrice(productToEdit.selling_price || 0);
      setStock(productToEdit.stock || 100);
      setSoundLevel(productToEdit.sound_level || 'Medium');
      setImageUrl(productToEdit.image_url || '');
      setInitialImageUrl(productToEdit.image_url || '');
      setDescription(productToEdit.description || '');
      setIsBestSeller(Boolean(productToEdit.is_best_seller));
      setIsActive(productToEdit.is_active !== undefined ? Boolean(productToEdit.is_active) : true);
      setSelectedFile(null);
      setPreviewUrl('');
    } else {
      setName('');
      setSku('');
      setPackSize('1 Box');
      const initialMrp = 200;
      const initialPrice = Math.round(initialMrp * ((100 - discountPercent) / 100));
      setMrp(initialMrp);
      setSellingPrice(initialPrice);
      setStock(100);
      setSoundLevel('Medium');
      setImageUrl('');
      setInitialImageUrl('');
      setDescription('');
      setIsBestSeller(false);
      setIsActive(true);
      setSelectedFile(null);
      setPreviewUrl('');
      setIsManualPriceOverride(false);
    }
    setErrorMsg('');
  }, [productToEdit, isOpen, discountPercent]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !sku) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      let autoSku = 'SKU';
      if (words.length >= 2) {
        autoSku = `${words[0].substring(0, 3)}-${words[1]}`.toUpperCase();
      } else if (words.length === 1) {
        autoSku = `SKU-${words[0]}`.toUpperCase();
      }
      setSku(autoSku.replace(/[^A-Z0-9-]/g, ''));
    }
  };

  const handleMrpChange = (val: number) => {
    setMrp(val);
    if (!isManualPriceOverride) {
      if (val > 0) {
        const factor = Math.max(0, (100 - discountPercent) / 100);
        setSellingPrice(Math.round(val * factor));
      } else {
        setSellingPrice(0);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setImageUrl(localUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a Product Name.');
      return;
    }

    const finalSku = sku.trim() || `SKU-${Date.now().toString().slice(-4)}`;

    if (sellingPrice > mrp) {
      setErrorMsg('Selling Price cannot be greater than MRP.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let finalImageUrl = imageUrl;

      // Upload selected/captured file to Supabase Storage
      if (selectedFile) {
        try {
          finalImageUrl = await ProductService.uploadProductImage(selectedFile);
          // Delete previous image from Supabase storage if it was replaced, preventing storage waste
          if (initialImageUrl && initialImageUrl !== finalImageUrl) {
            await ProductService.deleteProductImage(initialImageUrl);
          }
        } catch (uploadErr: any) {
          console.error('Supabase Storage image upload error:', uploadErr);
          setErrorMsg(`Image upload error: ${uploadErr.message}`);
          setSaving(false);
          return;
        }
      } else if (!imageUrl && initialImageUrl) {
        // Image was cleared/removed by the user
        await ProductService.deleteProductImage(initialImageUrl);
        finalImageUrl = '';
      }

      const payload: Partial<Product> = {
        name: name.trim(),
        sku: finalSku.toUpperCase(),
        category_id: categoryId || undefined,
        pack_size: packSize.trim() || '1 Box',
        mrp: Number(mrp),
        selling_price: Number(sellingPrice),
        sound_level: soundLevel,
        image_url: finalImageUrl || undefined,
        description: description.trim() || `Direct Sivakasi ${name} crackers with factory guarantee.`,
        is_active: isActive,
        is_featured: false,
        is_best_seller: isBestSeller,
      };

      let result: Product;
      if (isEditing && productToEdit?.id) {
        result = await ProductService.updateProduct(productToEdit.id, payload);
      } else {
        result = await ProductService.createProduct(payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Failed to save product SKU:', err);
      setErrorMsg(err.message || 'Failed to save product in database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-98 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm border border-amber-200/60 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isEditing ? 'Update product details below' : 'Fill in the details to add a new SKU'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Product Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Flower Pots Deluxe (5 Pcs)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm"
            />
          </div>

          {/* SKU Code & Pack Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. FLO-015"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 outline-none focus:bg-white focus:border-amber-500 uppercase transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pack Size</label>
              <input
                type="text"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder="e.g. 5 Pcs"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Category & Sound Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition-all cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sound Level</label>
              <select
                value={soundLevel}
                onChange={(e) => setSoundLevel(e.target.value as SoundLevel)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="Silent">Silent</option>
                <option value="Low">Low Sound</option>
                <option value="Medium">Medium Sound</option>
                <option value="High">High Sound</option>
              </select>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">Pricing</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isManualPriceOverride;
                    setIsManualPriceOverride(nextState);
                    if (!nextState && mrp > 0) {
                      const factor = Math.max(0, (100 - discountPercent) / 100);
                      setSellingPrice(Math.round(mrp * factor));
                    }
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Override price"
                >
                  {isManualPriceOverride ? (
                    <Unlock className="w-3 h-3 text-amber-600" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  <span>{isManualPriceOverride ? 'Custom' : 'Auto'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 text-xs mb-1">
                  MRP (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={mrp}
                  onChange={(e) => handleMrpChange(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl font-bold font-mono text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 text-xs mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  readOnly={!isManualPriceOverride}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl font-black font-mono text-sm outline-none transition-all ${
                    isManualPriceOverride
                      ? 'bg-white border-2 border-amber-500 text-amber-700'
                      : 'bg-slate-100/90 border border-slate-200 text-slate-900 select-all'
                  }`}
                />
              </div>
            </div>

            {mrp > 0 && (
              <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-between pt-0.5">
                <span>Customer saves</span>
                <span className="font-mono">₹{Math.max(0, mrp - sellingPrice).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Product Image Section: Square Thumbnail with Upload & Mobile Camera */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Product Image</label>

            <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
              {/* Small Square Thumbnail with floating remove badge */}
              <div className="relative w-14 h-14 shrink-0">
                <div className="w-full h-full rounded-xl bg-white border border-slate-200/90 overflow-hidden flex items-center justify-center shadow-2xs">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Product preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-xs cursor-pointer transition-transform"
                    title="Remove Image"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Choose Media & Open Camera */}
              <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                <label className="py-2.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs">Choose Media</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={handleFileSelect}
                  />
                </label>

                <label className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-xs font-bold text-amber-950 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs">Open Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Product Visibility Toggle (Turn On / Off) */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900 block">
                  Product Visibility (User Side)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {isActive ? 'ACTIVE / VISIBLE' : 'OFF / HIDDEN'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                {isActive
                  ? 'Turned ON — Visible to customers in catalog & shop'
                  : 'Turned OFF — Completely hidden from customers on storefront'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
