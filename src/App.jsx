import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import RiskSimulator from "./pages/RiskSimulator";

import DeveloperPage from "./pages/DeveloperPage";
import HomeSafetyPage from "./pages/HomeSafetyPage";
import GovernmentPage from "./pages/GovernmentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/risk-simulator" element={<RiskSimulator />} />

        {/* Urban Shield individual pages */}
        <Route path="/site-planner" element={<DeveloperPage />} />
        <Route path="/home-safety" element={<HomeSafetyPage />} />
        <Route path="/retrofit" element={<GovernmentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;