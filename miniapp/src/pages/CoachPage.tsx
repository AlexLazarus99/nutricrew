import { AiCoachPanel } from "../components/coach/AiCoachPanel";
import { ProGate } from "../components/pro/ProGate";

export function CoachPage() {
  return (
    <ProGate titleKey="coach.title" descKey="coach.proRequiredHint" source="gate-coach">
      <AiCoachPanel />
    </ProGate>
  );
}
