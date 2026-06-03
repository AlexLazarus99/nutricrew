import { useEffect, useRef } from "react";
import { api } from "../api/client";
import type { MeResponse } from "../api/client";

export function useAutoJoinTeam(me: MeResponse, onJoined: () => void): void {
  const triedRef = useRef(false);

  useEffect(() => {
    if (triedRef.current || me.teamId || !me.profileComplete) return;
    const code = me.startInviteCode;
    if (!code) return;
    triedRef.current = true;
    void api
      .joinTeam(code)
      .then(() => onJoined())
      .catch(() => {
        triedRef.current = false;
      });
  }, [me, onJoined]);
}
