import type { DietId } from "./catalog";

const DIET_PHOTO_DIR = "/diets";
const DIET_PHOTO_EXT = ".jpg";

export function dietPhotoUrl(id: DietId): string {
  return `${DIET_PHOTO_DIR}/${id}${DIET_PHOTO_EXT}`;
}
