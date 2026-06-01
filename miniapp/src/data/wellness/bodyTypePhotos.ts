import type { BodyTypeId } from "./catalog";

const BODY_TYPE_PHOTO_DIR = "/body-types";
const BODY_TYPE_PHOTO_EXT = ".jpg";

export function bodyTypePhotoUrl(id: BodyTypeId): string {
  return `${BODY_TYPE_PHOTO_DIR}/${id}${BODY_TYPE_PHOTO_EXT}`;
}
