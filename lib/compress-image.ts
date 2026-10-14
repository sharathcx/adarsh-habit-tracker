// Client-only image compression. Resizes + re-encodes to JPEG to fit
// under Vercel's 4.5MB function body limit.

const MAX_DIM = 1800; // longest edge in px
const TRY_QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];

export async function compressImage(file: File, maxBytes: number): Promise<File> {
  if (typeof window === "undefined") return file;

  const objUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode image"));
      el.src = objUrl;
    });
  } finally {
    URL.revokeObjectURL(objUrl);
  }

  let { width, height } = img;
  const longest = Math.max(width, height);
  if (longest > MAX_DIM) {
    const scale = MAX_DIM / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");
  ctx.drawImage(img, 0, 0, width, height);

  const baseName = file.name.replace(/\.[^.]+$/, "") || "note";
  let best: Blob | null = null;
  for (const q of TRY_QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", q),
    );
    if (!blob) continue;
    best = blob;
    if (blob.size <= maxBytes) break;
  }

  if (!best) throw new Error("Image encoding failed");
  return new File([best], `${baseName}.jpg`, { type: "image/jpeg" });
}
