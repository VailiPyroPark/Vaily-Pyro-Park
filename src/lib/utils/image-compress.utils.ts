/**
 * High-performance client-side image compression utility.
 * Downscales oversized photos (e.g. 4000x3000 mobile camera shots)
 * and compresses them to modern WebP (or JPEG fallback) at 82% quality.
 * Reduces 5MB-10MB uploads down to 40KB-80KB before hitting Supabase Storage.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/webp' | 'image/jpeg';
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1000,
  maxHeight: 1000,
  quality: 0.82,
  mimeType: 'image/webp',
};

/**
 * Compresses an image File or Blob in the browser.
 * If running in SSR or if compression fails, falls back gracefully to the original file.
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // If not in browser environment or file is SVG/GIF, return original
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const { maxWidth, maxHeight, quality, mimeType } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // Calculate scaled dimensions while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Draw onto HTML5 canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output mime type (check if browser supports WebP canvas export)
        let outputMime = mimeType;
        if (!canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
          outputMime = 'image/jpeg';
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Only use compressed blob if it's actually smaller than the original
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }

            const ext = outputMime === 'image/webp' ? 'webp' : 'jpg';
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}.${ext}`, {
              type: outputMime,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch (e) {
      console.warn('Image compression exception, using original file:', e);
      resolve(file);
    }
  });
}
