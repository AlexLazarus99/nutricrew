import { useTranslation } from "react-i18next";
import type { MuscleGroupId } from "../../data/wellness/catalog";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

type Props = {
  prefix: string;
  groupOrder: MuscleGroupId[];
};

export function MuscleGroupSections({ prefix, groupOrder }: Props) {
  const { t } = useTranslation();

  return (
    <div className="muscle-groups stack">
      {groupOrder.map((groupId) => {
        const items = asStringArray(
          t(`${prefix}.groups.${groupId}.items`, { returnObjects: true, defaultValue: [] }),
        );
        if (!items.length) return null;

        const note = t(`${prefix}.groups.${groupId}.note`, { defaultValue: "" });
        const detail = t(`${prefix}.groups.${groupId}.detail`, { defaultValue: "" });
        const guide = t(`wellness.muscleGroupGuide.${groupId}`, { defaultValue: "" });

        return (
          <article key={groupId} className="card muscle-group-card">
            <div className="muscle-group-header">
              <span className={`muscle-tag muscle-tag-${groupId}`} aria-hidden="true" />
              <h3>{t(`wellness.muscleGroups.${groupId}`)}</h3>
            </div>
            {guide && <p className="muscle-group-guide">{guide}</p>}
            {note && <p className="muscle-group-note">{note}</p>}
            {detail && <p className="muted small muscle-group-detail">{detail}</p>}
            <ol className="muscle-exercise-list">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        );
      })}
    </div>
  );
}

export function WeeklySplit({ prefix }: { prefix: string }) {
  const { t } = useTranslation();
  const days = asStringArray(t(`${prefix}.weeklySplit`, { returnObjects: true, defaultValue: [] }));
  if (!days.length) return null;

  return (
    <div className="card">
      <h3>{t("wellness.sections.weeklySplit")}</h3>
      <ul className="weekly-split-list">
        {days.map((day) => (
          <li key={day}>{day}</li>
        ))}
      </ul>
    </div>
  );
}

export function WarmupBlock({ prefix }: { prefix: string }) {
  const { t } = useTranslation();
  const items = asStringArray(t(`${prefix}.warmup`, { returnObjects: true, defaultValue: [] }));
  if (!items.length) return null;

  return (
    <div className="card">
      <h3>{t("wellness.sections.warmup")}</h3>
      <ul className="wellness-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
