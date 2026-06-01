export type AppSection =
  | "home"
  | "log"
  | "guide"
  | "team"
  | "leaderboard"
  | "prizes"
  | "game"
  | "quiz"
  | "auth";

export function sectionFromPath(pathname: string): AppSection {
  if (pathname.startsWith("/log") || pathname.startsWith("/diary")) return "log";
  if (pathname.startsWith("/guide")) return "guide";
  if (pathname.startsWith("/team")) return "team";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/prizes")) return "prizes";
  if (pathname.startsWith("/game")) return "game";
  if (pathname.startsWith("/quiz")) return "quiz";
  return "home";
}
