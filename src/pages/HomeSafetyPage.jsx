import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import HomeInput from "../components/HomeSafetyPage/HomeInput";
import HomeDashboard from "../components/HomeSafetyPage/HomeDashboard";
import LoadingOverlay from "../components/HomeSafetyPage/LoadingOverlay";
import HomeChatbot from "../components/HomeSafetyPage/HomeChatbot";

const API_BASE = "https://kashafimaan-quakevisionfyp-backend.hf.space/api/v1";

export default function HomeSafetyPage() {
  const navigate = useNavigate();
  const [page, setPage]               = useState("input");       // "input" | "dashboard"
  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportData, setReportData]   = useState(null);
  const [sessionId, setSessionId]     = useState(null);

  const PIPELINE_MSGS = [
    "Processing inputs...",
    "Retrieving knowledge base...",
    "Generating LLM report...",
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
      const payload = {
        magnitude:         formData.magnitude,
        material:          formData.material,
        risk_map:          { RCF: 5.95, RCI: 5.95, URM: 7.94, Adobe: 0.28, RubbleStone: 0.28 },
        building_type:     formData.building_type,
        floors:            formData.floors,
        budget_level:      formData.budget_level,
        timeline_value:    formData.timeline_value,
        timeline_unit:     formData.timeline_unit,
        project_size_sqft: formData.project_size_sqft,
        allow_web:         formData.allow_web,
        city_name:         formData.city_name,
        sector_name:       formData.sector_name,
      };

      const res = await fetch(`${API_BASE}/report/home`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
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

          {/* ── Back to Dashboard bar ── */}
          <div className="bg-white border-b border-gray-100 px-5 py-2 flex items-center gap-3 shrink-0">
            <span className="text-gray-300 text-xs">|</span>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#6B46C1] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Dashboard
            </button>
          </div>

          {loading && (
            <LoadingOverlay step={loadingStep} messages={PIPELINE_MSGS} title="Analyzing seismic data..." />
          )}
          {page === "input" && (
            <HomeInput onGenerate={generateReport} loading={loading} />
          )}
          {page === "dashboard" && reportData && (
            <HomeDashboard reportData={reportData} sessionId={sessionId} onBack={() => setPage("input")} />
          )}
        </div>
        <HomeChatbot sessionId={sessionId} reportData={reportData} onReportUpdate={(newData) => setReportData(newData)} />
      </div>
    </div>
  );
}
