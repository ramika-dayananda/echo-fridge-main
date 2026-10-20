/**
 * Client-side image compression before sending to Gemini.
 * Uses the browser Canvas API — no external dependencies required.
 *
 * Target: ~1024px longest edge, ~200-400 KB JPEG.
 * This keeps the hackathon demo fast on mobile networks and avoids
 * hitting server function body size limits.
 */

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.82;

export type CompressedImage = {
  base64: string;        // pure base64, no data: prefix
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  originalSize: number;  // bytes
  compressedSize: number;
};

/** Compress a File or Blob to a base64 JPEG suitable for Gemini inlineData */
export async function compressImageForUpload(
  file: File | Blob,
): Promise<CompressedImage> {
  const originalSize = file.size;

  // If file is tiny (<150 KB), skip compression to preserve quality
  if (originalSize < 150_000) {
    const base64 = await fileToBase64(file);
    const mimeType = (file.type || "image/jpeg") as CompressedImage["mimeType"];
    return {
      base64,
      mimeType: isSupportedMime(mimeType) ? mimeType : "image/jpeg",
      originalSize,
      compressedSize: originalSize,
    };
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = scaleDown(img.naturalWidth, img.naturalHeight);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          fileToBase64(blob)
            .then((base64) => {
              resolve({
                base64,
                mimeType: "image/jpeg",
                originalSize,
                compressedSize: blob.size,
              });
            })
            .catch(reject);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image failed to load for compression"));
    };

    img.src = url;
  });
}

function scaleDown(w: number, h: number): { width: number; height: number } {
  if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) return { width: w, height: h };
  const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function fileToBase64(blob: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/jpeg;base64," prefix — Gemini wants raw base64
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("FileReader produced empty result"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function isSupportedMime(mime: string): mime is CompressedImage["mimeType"] {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}
