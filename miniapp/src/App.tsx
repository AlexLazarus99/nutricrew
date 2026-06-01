import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { LogMealPage } from "./pages/LogMeal";
import { FoodDiaryPage } from "./pages/FoodDiary";
import { TeamPage } from "./pages/Team";
import { LeaderboardPage } from "./pages/Leaderboard";
import { PrizesPage } from "./pages/Prizes";
import { WellnessGuidePage } from "./pages/WellnessGuide";
import { WellnessDetailPage } from "./pages/WellnessDetail";
import { BirdGamePage } from "./pages/BirdGamePage";
import { CalorieQuizPage } from "./pages/CalorieQuizPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="log" element={<LogMealPage />} />
        <Route path="diary" element={<FoodDiaryPage />} />
        <Route path="team" element={<TeamPage />} />
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
