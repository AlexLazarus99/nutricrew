type Props = {
  lines?: number;
  variant?: "card" | "text" | "title";
};

export function Skeleton({ lines = 3, variant = "text" }: Props) {
  if (variant === "card") {
    return <div className="nc-skeleton nc-skeleton--card" aria-hidden />;
  }

  return (
    <div className="stack" aria-hidden>
      {variant === "title" ? <div className="nc-skeleton nc-skeleton--title" /> : null}
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="nc-skeleton nc-skeleton--text"
          style={{ width: i === lines - 1 ? "72%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton variant="title" lines={0} />
      <Skeleton lines={2} />
    </div>
  );
}
