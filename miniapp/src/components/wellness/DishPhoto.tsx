import { useState } from "react";
import { dishPhotoCandidates } from "../../data/wellness/dishPhotos";

type Props = {
  dishId: string;
  alt: string;
  className?: string;
};

export function DishPhoto({ dishId, alt, className = "" }: Props) {
  const candidates = dishPhotoCandidates(dishId);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || index >= candidates.length) {
    return (
      <div className={`dish-photo dish-photo-fallback ${className}`.trim()} aria-hidden="true">
        <span>🍽</span>
      </div>
    );
  }

  return (
    <img
      className={`dish-photo ${className}`.trim()}
      src={candidates[index]}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={400}
      height={280}
      onError={() => {
        if (index + 1 < candidates.length) setIndex((i) => i + 1);
        else setFailed(true);
      }}
    />
  );
}
