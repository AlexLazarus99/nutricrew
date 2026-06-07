import { api, type BarcodeLookupResponse } from "../api/client";

export type { BarcodeLookupResponse };

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResponse | null> {
  try {
    return await api.lookupBarcode(barcode);
  } catch (err) {
    if ((err as Error).message === "BARCODE_NOT_FOUND") return null;
    throw err;
  }
}
