import crypto from "node:crypto";

export function hashImageBase64(imageBase64: string): string {
  const raw = imageBase64.includes(",")
    ? imageBase64.split(",")[1]!
    : imageBase64;
  return crypto.createHash("sha256").update(raw).digest("hex");
}
