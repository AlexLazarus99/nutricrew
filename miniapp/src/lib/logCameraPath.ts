/** Opens /log with live meal scanner ready immediately. */
export const LOG_CAMERA_LIVE_PATH = "/log?camera=live";

export function parseLogCameraMode(
  value: string | null,
): "live" | "capture" | null {
  if (!value) return null;
  if (value === "live" || value === "1") return "live";
  if (value === "capture" || value === "photo") return "capture";
  return null;
}
