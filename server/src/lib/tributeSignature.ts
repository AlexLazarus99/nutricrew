import crypto from "node:crypto";

export function verifyTributeSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  apiKey: string,
): boolean {
  if (!signatureHeader || !apiKey) return false;

  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected = crypto.createHmac("sha256", apiKey).update(body).digest("hex");

  const provided = signatureHeader.trim().toLowerCase();
  if (provided.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}
