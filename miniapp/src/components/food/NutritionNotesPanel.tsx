type Props = {
  remarks?: string[];
  encyclopedia?: string;
  className?: string;
};

export function NutritionNotesPanel({ remarks, encyclopedia, className = "" }: Props) {
  if (!remarks?.length && !encyclopedia) return null;

  return (
    <div className={`nutrition-notes ${className}`.trim()}>
      {remarks && remarks.length > 0 && (
        <ul className="nutrition-notes__list">
          {remarks.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {encyclopedia && <p className="nutrition-notes__encyclopedia">{encyclopedia}</p>}
    </div>
  );
}
