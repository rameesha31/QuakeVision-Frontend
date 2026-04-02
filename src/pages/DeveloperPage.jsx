import { useState } from "react";
import Sidebar from "../components/Dashboard/Sidebar";
import DevInput from "../components/DeveloperPage/DeveloperInput";
import DevDashboard from "../components/DeveloperPage/DeveloperDashboard";
import DevChatbot from "../components/DeveloperPage/Devchatbot";
import LoadingOverlay from "../components/HomeSafetyPage/LoadingOverlay";

const API_BASE = "http://localhost:8000/api/v1";

export default function DeveloperPage() {
  const [page, setPage]               = useState("input");
  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportData, setReportData]   = useState(null);
  const [sessionId, setSessionId]     = useState(null);

  const PIPELINE_MSGS = [
    "Processing site parameters...",
    "Retrieving knowledge base...",
    "Generating feasibility report...",
    "Validating output...",
    "Extracting visualization data...",
  ];

  const generateReport = async (formData) => {
    setLoading(true);
    setLoadingStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLoadingStep(step);
      if (step >= PIPELINE_MSGS.length - 1) clearInterval(interval);
    }, 1100);

    try {
      // Payload matches DevReportRequest schema exactly:
      // magnitude, site_sector, project_type, project_name,
      // building_type, budget_level, timeline_value, timeline_unit,
      // project_size_sqft, floors, allow_web
      // risk_map is built server-side — do NOT send it from frontend
      const payload = {
        magnitude:         formData.magnitude,
        site_sector:       formData.site_sector,   // string e.g. "SECTOR F-07"
        project_name:      formData.project_name,
        project_type:      formData.project_type,
        building_type:     formData.building_type,
        budget_level:      formData.budget_level,
        timeline_value:    formData.timeline_value,
        timeline_unit:     formData.timeline_unit,
        project_size_sqft: formData.project_size_sqft,
        floors:            formData.floors,
        allow_web:         formData.allow_web,
        city_name:         formData.city_name,
      };

      const res = await fetch(`${API_BASE}/report/dev`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`API ${res.status}: ${JSON.stringify(errBody?.detail || errBody)}`);
      }

      const data = await res.json();
      clearInterval(interval);
      setLoadingStep(PIPELINE_MSGS.length - 1);
      setReportData(data);
      setSessionId(data.session_id);
      setPage("dashboard");
    } catch (err) {
      clearInterval(interval);
      alert("Error generating report: " + err.message);
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F7F8FC] text-gray-800">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {loading && (
            <LoadingOverlay
              step={loadingStep}
              messages={PIPELINE_MSGS}
              title="Running feasibility analysis..."
            />
          )}
          {page === "input" && (
            <DevInput onGenerate={generateReport} loading={loading} />
          )}
          {page === "dashboard" && reportData && (
            <DevDashboard
              reportData={reportData}
              sessionId={sessionId}
              onBack={() => setPage("input")}
            />
          )}
        </div>
        <DevChatbot sessionId={sessionId} reportData={reportData} />
      </div>
    </div>
  );
}