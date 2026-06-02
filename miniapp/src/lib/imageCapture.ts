const DEFAULT_MAX_WIDTH = 1280;
const DEFAULT_JPEG_QUALITY = 0.82;

function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function scaledSize(
  width: number,
  height: number,
  maxWidth: number,
): { width: number; height: number } {
  if (width <= maxWidth) return { width, height };
  const scale = maxWidth / width;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/** Compress a File (gallery/camera picker) for vision API. */
export async function fileToDataUrl(
  file: File,
  maxWidth = DEFAULT_MAX_WIDTH,
  quality = DEFAULT_JPEG_QUALITY,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = scaledSize(bitmap.width, bitmap.height, maxWidth);
    const canvas = drawToCanvas(bitmap, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}

/** Capture a frame from a live video element. */
export function videoFrameToDataUrl(
  video: HTMLVideoElement,
  maxWidth = DEFAULT_MAX_WIDTH,
  quality = DEFAULT_JPEG_QUALITY,
): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const { width, height } = scaledSize(video.videoWidth, video.videoHeight, maxWidth);
  const canvas = drawToCanvas(video, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
