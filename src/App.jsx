import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import RiskSimulator from "./pages/RiskSimulator";
import DeveloperPage from "./pages/DeveloperPage";
import HomeSafetyPage from "./pages/HomeSafetyPage";
import GovernmentPage from "./pages/GovernmentPage";

function App() {
  // 1. Initialize state to hold your earthquake data
  const [quakeData, setQuakeData] = useState([]);

  // 2. Define your Backend URL (Vercel will look for this in Environment Variables)
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // 3. Fetch the data when the app loads
  useEffect(() => {
    if (API_URL) {
      fetch(`${API_URL}/api/quakes`)
        .then((res) => res.json())
        .then((data) => {
          // Assuming your FastAPI returns { "data": [...] }
          setQuakeData(data.data);
        })
        .catch((err) => console.error("Error fetching quakes:", err));
    }
  }, [API_URL]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* 4. Pass the data to the Dashboard so it can display the map/list */}
        <Route 
          path="/dashboard" 
          element={<Dashboard data={quakeData} />} 
        />
        
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
