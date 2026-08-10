// Client-side: turn any uploaded File (jpg/png/webp/HEIC) into a drawable bitmap,
// with iPhone EXIF orientation already applied. Runs in the browser only.

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

function isHeic(file: File): boolean {
  const t = file.type.toLowerCase();
  const n = file.name.toLowerCase();
  return (
    t === "image/heic" ||
    t === "image/heif" ||
    n.endsWith(".heic") ||
    n.endsWith(".heif")
  );
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  let blob: Blob = file;

  if (isHeic(file)) {
    // Dynamic import keeps heic2any out of the main bundle.
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    blob = Array.isArray(out) ? out[0] : (out as Blob);
  }

  // `from-image` bakes EXIF rotation into the pixels so portrait iPhone shots
  // aren't sideways.
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    return { bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    // Fallback for browsers without the option: decode via <img>.
    const url = URL.createObjectURL(blob);
    try {
      const el = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = url;
      });
      const bitmap = await createImageBitmap(el);
      return { bitmap, width: bitmap.width, height: bitmap.height };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
