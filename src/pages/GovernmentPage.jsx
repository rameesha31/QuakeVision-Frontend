import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar, { useIsDesktop, SidebarToggleButton } from "../components/Dashboard/Sidebar";
import GovInput from "../components/GovtPage/GovInput";
import GovDashboard from "../components/GovtPage/GovtDashboard";
import GovChatbot from "../components/GovtPage/GovChatbot";
import LoadingOverlay from "../components/HomeSafetyPage/LoadingOverlay";

const API_BASE = "https://kashafimaan-quakevisionfyp-backend.hf.space/api/v1";

export default function GovernmentPage() {
  const navigate  = useNavigate();
  const isDesktop = useIsDesktop();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page,        setPage]        = useState("input");
  const [loading,     setLoading]     = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportData,  setReportData]  = useState(null);
  const [sessionId,   setSessionId]   = useState(null);

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

      {/* Sidebar: controlled on mobile, self-managed on desktop */}
      <Sidebar/>

      <div className="flex-1 flex overflow-hidden min-w-0">
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">

          {/* ── Top bar ── */}
          <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 shrink-0">
            {/* Hamburger button — mobile only, inline in top-bar */}
            {!isDesktop && (
              <SidebarToggleButton onClick={() => window.__sidebarOpen?.()} />
            )}
            <span className="text-gray-300 text-xs hidden sm:block">|</span>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#6B46C1] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </button>
          </div>

          {loading && (
            <LoadingOverlay step={loadingStep} messages={PIPELINE_MSGS} title="Running urban policy simulation..." />
          )}
          {page === "input" && (
            <GovInput onGenerate={generateReport} loading={loading} />
          )}
          {page === "dashboard" && reportData && (
            <GovDashboard reportData={reportData} sessionId={sessionId} onBack={() => setPage("input")} />
          )}
        </div>

        {/* Desktop chatbot — static right panel */}
        <div className="hidden lg:block">
          <GovChatbot
            sessionId={sessionId}
            reportData={reportData}
            onReportUpdate={(newData) => setReportData(newData)}
          />
        </div>
      </div>

      {/* Mobile chatbot — outside flex row so it can overlay content */}
      <div className="lg:hidden">
        <GovChatbot
          sessionId={sessionId}
          reportData={reportData}
          onReportUpdate={(newData) => setReportData(newData)}
          mobileMode={true}
        />
      </div>
    </div>
  );
}