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
      </Route>
    </Routes>
  );
}
