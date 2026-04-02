import { useState } from "react";
import Sidebar from "../components/Dashboard/Sidebar";
import GovInput from "../components/GovtPage/GovInput";
import GovDashboard from "../components/GovtPage/GovtDashboard";
import GovChatbot from "../components/GovtPage/GovChatbot";
import LoadingOverlay from "../components/HomeSafetyPage/LoadingOverlay";

const API_BASE = "http://localhost:8000/api/v1";

export default function GovernmentPage() {
  const [page, setPage]               = useState("input");
  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportData, setReportData]   = useState(null);
  const [sessionId, setSessionId]     = useState(null);

  const PIPELINE_MSGS = [
    "Processing sector inputs...",
    "Retrieving urban policy knowledge...",
    "Generating action plan...",
    "Validating recommendations...",
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
      // Exact flat schema — no sector_data nesting
      const payload = {
        city_name:         formData.city_name,
        sector_name:       formData.sector_name,
        magnitude:         formData.magnitude,
        retrofit_capacity: formData.retrofit_capacity,
        priority_metric:   formData.priority_metric,
        retrofit_style:    formData.retrofit_style,
        budget_level:      formData.budget_level,
        timeline_value:    formData.timeline_value,
        timeline_unit:     formData.timeline_unit,
        project_size_sqft: formData.project_size_sqft,
        floors:            formData.floors,
        allow_web:         formData.allow_web,
      };

      const res = await fetch(`${API_BASE}/report/gov`, {
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
              title="Running urban policy simulation..."
            />
          )}
          {page === "input" && (
            <GovInput onGenerate={generateReport} loading={loading} />
          )}
          {page === "dashboard" && reportData && (
            <GovDashboard
              reportData={reportData}
              sessionId={sessionId}
              onBack={() => setPage("input")}
            />
          )}
        </div>
        <GovChatbot sessionId={sessionId} reportData={reportData} />
      </div>
    </div>
  );
}