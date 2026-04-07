import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import DevInput from "../components/DeveloperPage/DeveloperInput";
import DevDashboard from "../components/DeveloperPage/DeveloperDashboard";
import DevChatbot from "../components/DeveloperPage/Devchatbot";
import LoadingOverlay from "../components/HomeSafetyPage/LoadingOverlay";

const API_BASE = "http://localhost:8000/api/v1";

export default function DeveloperPage() {
  const navigate = useNavigate();
  const [page, setPage]               = useState("input");
  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportData, setReportData]   = useState(null);
  const [sessionId, setSessionId]     = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);

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
      const payload = {
        magnitude:         formData.magnitude,
        site_sector:       formData.site_sector,
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

      {/* Sidebar — slide in on mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transition-transform duration-300
        md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex overflow-hidden min-w-0">
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">

          {/* ── Top bar ── */}
          <div className="bg-white border-b border-gray-100 px-4 sm:px-5 py-2 flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger */}
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-gray-300 text-xs hidden sm:inline">|</span>
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

            {/* Mobile: chat toggle */}
            {page === "dashboard" && reportData && (
              <button
                className="ml-auto md:hidden flex items-center gap-1.5 text-xs font-semibold text-[#6B46C1] bg-[#6B46C1]/10 px-3 py-1.5 rounded-lg"
                onClick={() => setChatOpen(v => !v)}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {chatOpen ? "Hide Chat" : "AI Chat"}
              </button>
            )}
          </div>

          {loading && (
            <LoadingOverlay step={loadingStep} messages={PIPELINE_MSGS} title="Running feasibility analysis..." />
          )}
          {page === "input" && (
            <DevInput onGenerate={generateReport} loading={loading} />
          )}
          {page === "dashboard" && reportData && (
            <DevDashboard reportData={reportData} sessionId={sessionId} onBack={() => setPage("input")} />
          )}
        </div>

        {/* Chatbot — full screen on mobile, sidebar on md+ */}
        <div className={`
          ${chatOpen ? "flex" : "hidden"} md:flex
          fixed inset-0 z-50 md:relative md:inset-auto md:z-auto
          md:w-80 lg:w-96 flex-col
        `}>
          <DevChatbot
            sessionId={sessionId}
            reportData={reportData}
            onReportUpdate={(newData) => setReportData(newData)}
            onClose={() => setChatOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
