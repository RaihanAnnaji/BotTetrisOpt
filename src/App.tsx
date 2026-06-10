import { Route, Routes } from "react-router";
import HomePage from "./pages/HomePage.tsx";
import HumanPage from "./pages/HumanPage.tsx";
import HeuristicPage from "./pages/HeuristicPage.tsx";
import PsoPage from "./pages/PsoPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/human" element={<HumanPage />} />
      <Route path="/heuristic" element={<HeuristicPage />} />
      <Route path="/pso" element={<PsoPage />} />
    </Routes>
  );
}