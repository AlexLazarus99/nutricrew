import type { MeResponse } from "../api/client";

export function hasAppAccess(me: MeResponse): boolean {
  return me.access?.hasAccess ?? true;
}

export function isInTrial(me: MeResponse): boolean {
  return me.access?.inTrial ?? false;
}
