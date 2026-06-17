/** Routes that require NutriCrew Pro (Tribute or Stars). */
export const PRO_GATED_PATHS = ["/coach", "/report", "/trends"] as const;

export function isProGatedPath(pathname: string): boolean {
  return PRO_GATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
