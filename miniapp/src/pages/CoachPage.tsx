import { AiCoachPanel } from "../components/coach/AiCoachPanel";
import { PlateReviewPanel } from "../components/pro/PlateReviewPanel";
import { ProGate } from "../components/pro/ProGate";

export function CoachPage() {
  return (
    <ProGate titleKey="coach.title" descKey="coach.proRequiredHint" source="gate-coach">
      <AiCoachPanel />
      <PlateReviewPanel />
    </ProGate>
  );
}
