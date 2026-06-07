import * as analyticsRepo from "../repositories/analytics.js";

const ALLOWED_EVENTS = new Set([
  "app_open",
  "registration_complete",
  "meal_analyze",
  "meal_logged",
  "meal_rejected",
  "premium_view",
  "pro_purchase_start",
  "weekly_report_view",
  "settings_export",
  "settings_delete",
  "team_admin_view",
]);

export async function trackEvents(
  userId: number | null,
  events: Array<{ name: string; props?: Record<string, unknown> }>,
): Promise<void> {
  const filtered = events
    .filter((e) => ALLOWED_EVENTS.has(e.name))
    .map((e) => ({
      userId,
      eventName: e.name,
      props: e.props,
    }));
  await analyticsRepo.insertEvents(filtered);
}
