import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";

const LogMealPage = lazy(() =>
  import("./pages/LogMeal").then((m) => ({ default: m.LogMealPage })),
);
const FoodDiaryPage = lazy(() =>
  import("./pages/FoodDiary").then((m) => ({ default: m.FoodDiaryPage })),
);
const TeamPage = lazy(() =>
  import("./pages/Team").then((m) => ({ default: m.TeamPage })),
);
const LeaderboardPage = lazy(() =>
  import("./pages/Leaderboard").then((m) => ({ default: m.LeaderboardPage })),
);
const PrizesPage = lazy(() =>
  import("./pages/Prizes").then((m) => ({ default: m.PrizesPage })),
);
const WellnessGuidePage = lazy(() =>
  import("./pages/WellnessGuide").then((m) => ({ default: m.WellnessGuidePage })),
);
const WellnessDetailPage = lazy(() =>
  import("./pages/WellnessDetail").then((m) => ({ default: m.WellnessDetailPage })),
);
const BirdGamePage = lazy(() =>
  import("./pages/BirdGamePage").then((m) => ({ default: m.BirdGamePage })),
);
const CalorieQuizPage = lazy(() =>
  import("./pages/CalorieQuizPage").then((m) => ({ default: m.CalorieQuizPage })),
);
const ChatPage = lazy(() =>
  import("./pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const FeaturesPage = lazy(() =>
  import("./pages/FeaturesPage").then((m) => ({ default: m.FeaturesPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const PrivacyPolicyPage = lazy(() =>
  import("./pages/PrivacyPolicyPage").then((m) => ({ default: m.PrivacyPolicyPage })),
);
const TermsPage = lazy(() =>
  import("./pages/TermsPage").then((m) => ({ default: m.TermsPage })),
);
const WeeklyReportPage = lazy(() =>
  import("./pages/WeeklyReportPage").then((m) => ({ default: m.WeeklyReportPage })),
);
const TeamAdminPage = lazy(() =>
  import("./pages/TeamAdminPage").then((m) => ({ default: m.TeamAdminPage })),
);
const TrendsPage = lazy(() =>
  import("./pages/TrendsPage").then((m) => ({ default: m.TrendsPage })),
);
const ProHubPage = lazy(() =>
  import("./pages/ProHubPage").then((m) => ({ default: m.ProHubPage })),
);
const OrgAdminPage = lazy(() =>
  import("./pages/OrgAdminPage").then((m) => ({ default: m.OrgAdminPage })),
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="log" element={<LogMealPage />} />
        <Route path="diary" element={<FoodDiaryPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="prizes" element={<PrizesPage />} />
        <Route path="guide" element={<WellnessGuidePage />} />
        <Route path="guide/:category/:id" element={<WellnessDetailPage />} />
        <Route path="game" element={<BirdGamePage />} />
        <Route path="quiz" element={<CalorieQuizPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="report" element={<WeeklyReportPage />} />
        <Route path="trends" element={<TrendsPage />} />
        <Route path="pro" element={<ProHubPage />} />
        <Route path="team/admin" element={<TeamAdminPage />} />
        <Route path="org/admin" element={<OrgAdminPage />} />
      </Route>
    </Routes>
  );
}
