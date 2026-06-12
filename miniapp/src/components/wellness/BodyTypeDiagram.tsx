import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { BodyTypeId } from "../../data/wellness/catalog";

type Props = {
  id: BodyTypeId;
  className?: string;
};

type SilhouetteProps = {
  uid: string;
};

function EctomorphSilhouette({ uid }: SilhouetteProps) {
  const g = (n: string) => `${uid}-${n}`;
  return (
    <>
      <ellipse cx="60" cy="18" rx="10" ry="12" fill={`url(#${g("fill")})`} stroke={`url(#${g("stroke")})`} strokeWidth="1.5" />
      <path
        d="M60 30 L60 38 M48 40 Q46 42 45 58 L43 88 M72 40 Q74 42 75 58 L77 88"
        fill="none"
        stroke={`url(#${g("stroke")})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 40 Q60 36 68 40 L66 72 Q60 74 54 72 Z"
        fill={`url(#${g("fill")})`}
        stroke={`url(#${g("stroke")})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M54 72 L52 118 M66 72 L68 118 M52 118 L48 142 M68 118 L72 142"
        fill="none"
        stroke={`url(#${g("stroke")})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="34" y1="42" x2="86" y2="42" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="40" y1="72" x2="80" y2="72" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="38" y1="94" x2="82" y2="94" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="60" y1="8" x2="60" y2="148" stroke={`url(#${g("axis")})`} strokeWidth="0.75" strokeDasharray="2 4" opacity="0.5" />
    </>
  );
}

function MesomorphSilhouette({ uid }: SilhouetteProps) {
  const g = (n: string) => `${uid}-${n}`;
  return (
    <>
      <ellipse cx="60" cy="18" rx="11" ry="12" fill={`url(#${g("fill")})`} stroke={`url(#${g("stroke")})`} strokeWidth="1.5" />
      <path
        d="M38 42 Q60 32 82 42 L78 58 L74 72 Q60 68 46 72 L42 58 Z"
        fill={`url(#${g("fill")})`}
        stroke={`url(#${g("stroke")})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M38 42 L30 70 M82 42 L90 70 M30 70 L26 98 M90 70 L94 98"
        fill="none"
        stroke={`url(#${g("stroke")})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M48 72 L44 118 M72 72 L76 118 M44 118 L40 142 M76 118 L80 142"
        fill="none"
        stroke={`url(#${g("stroke")})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line x1="24" y1="42" x2="96" y2="42" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="38" y1="72" x2="82" y2="72" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="32" y1="94" x2="88" y2="94" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="60" y1="8" x2="60" y2="148" stroke={`url(#${g("axis")})`} strokeWidth="0.75" strokeDasharray="2 4" opacity="0.5" />
    </>
  );
}

function EndomorphSilhouette({ uid }: SilhouetteProps) {
  const g = (n: string) => `${uid}-${n}`;
  return (
    <>
      <ellipse cx="60" cy="19" rx="12" ry="13" fill={`url(#${g("fill")})`} stroke={`url(#${g("stroke")})`} strokeWidth="1.5" />
      <path
        d="M42 44 Q60 38 78 44 Q82 58 80 76 Q78 88 60 90 Q42 88 40 76 Q38 58 42 44 Z"
        fill={`url(#${g("fill")})`}
        stroke={`url(#${g("stroke")})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M42 44 L36 72 M78 44 L84 72 M36 72 L32 96 M84 72 L88 96"
        fill="none"
        stroke={`url(#${g("stroke")})`}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M46 90 L44 116 M74 90 L76 116 M44 116 L42 140 M76 116 L78 140"
        fill="none"
        stroke={`url(#${g("stroke")})`}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <line x1="28" y1="44" x2="92" y2="44" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="30" y1="72" x2="90" y2="72" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="24" y1="94" x2="96" y2="94" stroke={`url(#${g("guide")})`} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="60" y1="8" x2="60" y2="148" stroke={`url(#${g("axis")})`} strokeWidth="0.75" strokeDasharray="2 4" opacity="0.5" />
    </>
  );
}

const SILHOUETTES: Record<BodyTypeId, (props: SilhouetteProps) => JSX.Element> = {
  ectomorph: EctomorphSilhouette,
  mesomorph: MesomorphSilhouette,
  endomorph: EndomorphSilhouette,
};

export function BodyTypeDiagram({ id, className = "" }: Props) {
  const { t } = useTranslation();
  const uid = useId().replace(/:/g, "");
  const g = (n: string) => `${uid}-${n}`;
  const Silhouette = SILHOUETTES[id];

  return (
    <figure
      className={`wellness-illustration body-type-diagram body-type-diagram--${id} ${className}`.trim()}
      aria-label={t(`wellness.bodyTypes.${id}.name`)}
    >
      <svg viewBox="0 0 120 150" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={g("bg")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--body-diagram-bg-a, #f0faf4)" />
            <stop offset="100%" stopColor="var(--body-diagram-bg-b, #e2f0ea)" />
          </linearGradient>
          <linearGradient id={g("fill")} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--body-diagram-fill-a, #d4ebe0)" />
            <stop offset="100%" stopColor="var(--body-diagram-fill-b, #a8d4be)" />
          </linearGradient>
          <linearGradient id={g("stroke")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--body-diagram-stroke-a, #3d7a5c)" />
            <stop offset="100%" stopColor="var(--body-diagram-stroke-b, #2a5c44)" />
          </linearGradient>
          <linearGradient id={g("guide")} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--body-diagram-guide, #22c55e)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--body-diagram-guide, #22c55e)" stopOpacity="0.55" />
            <stop offset="80%" stopColor="var(--body-diagram-guide, #22c55e)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--body-diagram-guide, #22c55e)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={g("axis")} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--body-diagram-axis, #64748b)" />
            <stop offset="100%" stopColor="var(--body-diagram-axis, #64748b)" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="112" height="142" rx="14" fill={`url(#${g("bg")})`} />
        <g className="body-type-diagram__grid">
          {[36, 60, 84, 108, 132].map((y) => (
            <line key={y} x1="12" y1={y} x2="108" y2={y} stroke="var(--body-diagram-grid, rgba(34,197,94,0.08))" strokeWidth="0.5" />
          ))}
          {[36, 60, 84].map((x) => (
            <line key={x} x1={x} y1="12" x2={x} y2="138" stroke="var(--body-diagram-grid, rgba(34,197,94,0.08))" strokeWidth="0.5" />
          ))}
        </g>
        <g className="body-type-diagram__figure">
          <Silhouette uid={uid} />
        </g>
      </svg>
    </figure>
  );
}
