export type AppSection =
  | "home"
  | "log"
  | "guide"
  | "team"
  | "chat"
  | "leaderboard"
  | "prizes"
  | "game"
  | "quiz"
  | "coach"
  | "features"
  | "auth";

export function sectionFromPath(pathname: string): AppSection {
  if (pathname.startsWith("/log") || pathname.startsWith("/diary") || pathname.startsWith("/steps")) {
    return "log";
  }
  if (pathname.startsWith("/guide")) return "guide";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/team")) return "team";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/prizes")) return "prizes";
  if (pathname.startsWith("/game")) return "game";
  if (pathname.startsWith("/quiz")) return "quiz";
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/features")) return "features";
  return "home";
}
