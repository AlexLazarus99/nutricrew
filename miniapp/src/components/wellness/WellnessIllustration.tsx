import type { BodyTypeId, DietId } from "../../data/wellness/catalog";
import { DIETS } from "../../data/wellness/catalog";
import { BodyTypePhoto } from "./BodyTypePhoto";
import { DietPhoto } from "./DietPhoto";

type IllustrationProps = {
  id: BodyTypeId | DietId;
  className?: string;
};

const BODY_TYPES = new Set<string>(["ectomorph", "mesomorph", "endomorph"]);
const DIET_IDS = new Set<string>(DIETS);

export function WellnessIllustration({ id, className = "" }: IllustrationProps) {
  if (BODY_TYPES.has(id)) {
    return <BodyTypePhoto id={id as BodyTypeId} className={className} />;
  }

  if (DIET_IDS.has(id)) {
    return <DietPhoto id={id as DietId} className={className} />;
  }

  return null;
}
