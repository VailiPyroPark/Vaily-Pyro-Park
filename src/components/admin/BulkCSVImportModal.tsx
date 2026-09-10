'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { X, Upload, CheckCircle2, AlertTriangle, Download, FileSpreadsheet, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { ProductService } from '@/lib/services/product.service';
import { SettingsService } from '@/lib/services/settings.service';

interface BulkCSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const BulkCSVImportModal: React.FC<BulkCSVImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [discountPercent, setDiscountPercent] = useState<number>(75);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<string>('');
  const [parsedData, setParsedData] = useState<(Partial<Product> & { category?: string; stock?: number })[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dbError, setDbError] = useState('');

  useEffect(() => {
    if (isOpen) {
      SettingsService.getDiscountPercentage().then(setDiscountPercent);
      setSelectedFileName('');
      setSelectedFileSize('');
      setParsedData([]);
      setValidationErrors([]);
      setIsValidated(false);
      setDbError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sampleCsvTemplate = `name,sku,pack_size,mrp,selling_price,sound_level,stock,category,description
"10cm Silver Sparklers",SPK-10S,"1 Box (10 Pcs)",200,,Silent,150,"Sparklers","Bright electric silver sparklers"
"20cm Golden Fountain",FPT-20G,"1 Box (5 Pcs)",450,,Low,150,"Flower Pots","Golden fountains showering sparks"
"25 Shot Sky Rocket Cake",ARS-25R,"1 Piece",1800,,High,150,"Fancy Shots","25 multi-color aerial sky burst cake"`;

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([sampleCsvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_product_import_layout.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setSelectedFileSize((file.size / 1024).toFixed(1) + ' KB');
    setValidationErrors([]);
    setDbError('');
    setIsValidated(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const errors: string[] = [];
        const validRows: (Partial<Product> & { category?: string; stock?: number })[] = [];

        if (rows.length === 0) {
          errors.push('The uploaded CSV file contains no data rows.');
        }

        rows.forEach((row, idx) => {
          const rowNum = idx + 1;
          if (!row.name || !row.name.trim()) {
            errors.push(`Row ${rowNum}: Missing mandatory 'name' column.`);
          }
          if (!row.sku || !row.sku.trim()) {
            errors.push(`Row ${rowNum}: Missing mandatory 'sku' column.`);
          }

          const mrp = parseFloat(row.mrp);
          let selling = parseFloat(row.selling_price);

          if (isNaN(mrp) || mrp < 0) {
            errors.push(`Row ${rowNum}: Invalid MRP value '${row.mrp}'.`);
          }

          // Auto-calculate selling_price if omitted
          if (isNaN(selling) || selling <= 0) {
            const factor = Math.max(0, (100 - discountPercent) / 100);
            selling = Math.round((isNaN(mrp) ? 0 : mrp) * factor);
          }

          if (!isNaN(mrp) && selling > mrp) {
            errors.push(`Row ${rowNum}: Selling Price (₹${selling}) exceeds MRP (₹${mrp}).`);
          }

          if (errors.length === 0) {
            validRows.push({
              name: row.name?.trim(),
              sku: row.sku?.trim().toUpperCase(),
              pack_size: row.pack_size?.trim() || '1 Box',
              mrp: isNaN(mrp) ? 0 : mrp,
              selling_price: selling,
              sound_level: row.sound_level || 'Medium',
              stock: parseInt(row.stock) || 100,
              description: row.description?.trim() || '',
              category: row.category?.trim() || '',
              is_active: true,
            });
          }
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
        } else {
          setParsedData(validRows);
          setIsValidated(true);
        }
      },
      error: (err: Error) => {
        setValidationErrors([`CSV Parsing Error: ${err.message}`]);
      },
    });
  };

  const handleResetFile = () => {
    setSelectedFileName('');
    setSelectedFileSize('');
    setParsedData([]);
    setValidationErrors([]);
    setIsValidated(false);
    setDbError('');
  };

  const handleCommitImport = async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    setDbError('');

    try {
      await ProductService.bulkCreateProducts(parsedData);
      onImportSuccess();
      onClose();
    } catch (err: any) {
      console.error('Bulk CSV import database error:', err);
      setDbError(err.message || 'Failed to save imported products into database.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-98 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-sm border border-amber-200/60 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Bulk CSV Product Importer</h2>
              <span className="text-xs text-slate-500 font-medium block">
                Batch import products into catalogue
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Sample Layout Download Section */}
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-amber-950 block">Sample CSV Layout</span>
            <span className="text-[11px] text-amber-800 font-medium block">
              Download the blank template with formatted headers
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 active:scale-98"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Layout</span>
          </button>
        </div>

        {/* 2. Product CSV File Upload Section */}
        <div className="space-y-2">
          <label className="block font-bold text-slate-700 text-xs">Upload Product CSV</label>

          {!selectedFileName ? (
            <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-6 text-center bg-slate-50 hover:bg-amber-50/30 transition-all cursor-pointer group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center gap-2 text-xs text-slate-600 font-bold"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-900 block text-xs sm:text-sm font-bold">
                    Click to upload `.csv` file
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Supports comma-separated UTF-8 CSV
                  </span>
                </div>
              </label>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {selectedFileName}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {selectedFileSize} {isValidated ? `• ${parsedData.length} SKUs ready` : ''}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetFile}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Remove & upload different file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-1 text-xs text-red-700 font-semibold max-h-40 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-red-800 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Validation Errors:</span>
            </div>
            {validationErrors.map((err, idx) => (
              <p key={idx} className="text-[11px] font-mono pl-5">• {err}</p>
            ))}
          </div>
        )}

        {/* Database Error */}
        {dbError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{dbError}</span>
          </div>
        )}

        {/* Ready to Import Status & Action */}
        {isValidated && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ready to Import: {parsedData.length} valid product items verified.</span>
            </div>

            <button
              onClick={handleCommitImport}
              disabled={importing}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Importing Products...</span>
                </>
              ) : (
                <span>Import {parsedData.length} Products to Catalogue</span>
              )}
            </button>
          </div>
        )}

        {/* Footer Cancel */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
