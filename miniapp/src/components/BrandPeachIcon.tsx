export const BRAND_PEACH_SRC = "/splash/nutricrew-peach.png";
export const BRAND_PEACH_SRC_2X = "/splash/nutricrew-peach@2x.png";

type BrandPeachIconProps = {
  size?: number;
  className?: string;
  animated?: boolean;
};

/** Small brand peach from logo artwork */
export function BrandPeachIcon({
  size = 24,
  className = "",
  animated = false,
}: BrandPeachIconProps) {
  const rootClass = [
    "brand-peach-icon",
    animated ? "brand-peach-icon--animated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      className={rootClass}
      src={BRAND_PEACH_SRC}
      width={410}
      height={481}
      alt=""
      decoding="async"
      draggable={false}
      aria-hidden
      style={{ width: size, height: "auto" }}
    />
  );
}
