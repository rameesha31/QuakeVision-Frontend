import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar, { useIsDesktop, SidebarToggleButton } from "../components/Dashboard/Sidebar";
import TopBar from "../components/Risk/TopBar";
import InputSideBar from "../components/Risk/InputSideBar";
import ReportCards from "../components/Risk/ReportCards";
import TrendGraphs from "../components/Risk/TrendsGraph";
import { generatePDF } from "../components/Risk/DownloadPdf";

const API_BASE = "https://kashafimaan-quakevisionfyp-backend.hf.space";

export default function RiskSimulator() {
  const navigate  = useNavigate();
  const isDesktop = useIsDesktop();

  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [formData,       setFormData]       = useState({
    location: "", epicenter: "", magnitude: "", depth: "",
  });
  const [loading,        setLoading]        = useState(false);
  const [results,        setResults]        = useState(null);
  const [report,         setReport]         = useState(null);
  const [trends,         setTrends]         = useState(null);
  const [inputPanelOpen, setInputPanelOpen] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!formData.location) return alert("Enter target city");
    setLoading(true);
    setInputPanelOpen(false);
    try {
      const payload = {
        epicenter_city: formData.epicenter,
        target_city:    formData.location,
        magnitude:      parseFloat(formData.magnitude),
        depth:          parseFloat(formData.depth),
      };

      const res = await fetch(`${API_BASE}/predict-damage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Prediction API failed");
      const data = await res.json();

      const geoRes  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${formData.location},Pakistan&limit=1`
      );
      const geoData = await geoRes.json();
      if (!geoData.length) { alert("City not found"); setLoading(false); return; }

      setResults({
        ...data,
        city:      formData.location,
        lat:       parseFloat(geoData[0].lat),
        lon:       parseFloat(geoData[0].lon),
        magnitude: parseFloat(formData.magnitude),
      });

      const [trendRes, reportRes] = await Promise.allSettled([
        fetch(`${API_BASE}/predict-damage-range`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${API_BASE}/cityRisk/${formData.location}`),
      ]);

      if (trendRes.status  === "fulfilled" && trendRes.value.ok)
        setTrends(await trendRes.value.json());
      if (reportRes.status === "fulfilled" && reportRes.value.ok)
        setReport(await reportRes.value.json());

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => generatePDF({ results, formData, report });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F7F8FC] text-gray-800">

      {/* Sidebar: controlled on mobile, self-managed on desktop */}
      <Sidebar/>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Top bar: hamburger (mobile only) + back button ── */}
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 shrink-0">
          {/* Hamburger — mobile only, inline in top-bar */}
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

        {/* Run / download controls */}
        <TopBar
          results={results}
          loading={loading}
          onRun={handleSubmit}
          onDownload={handleDownload}
          onOpenInputs={() => setInputPanelOpen(true)}
        />

        <div className="flex flex-1 overflow-hidden relative">

          {/* Mobile backdrop for input panel */}
          {inputPanelOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setInputPanelOpen(false)}
            />
          )}

          {/* InputSideBar: static on lg, slide-in drawer on mobile */}
          <div className={`
            lg:relative lg:translate-x-0 lg:z-auto lg:flex
            fixed top-0 left-0 h-full z-50 transition-transform duration-300
            ${inputPanelOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}>
            <InputSideBar
              formData={formData}
              onChange={handleChange}
              results={results}
              onClose={() => setInputPanelOpen(false)}
              showClose={inputPanelOpen}
            />
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">

            {/* Empty state */}
            {!results && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-[#6B46C1]/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#6B46C1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-gray-700">No Simulation Run Yet</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  Fill in the parameters{" "}
                  <span className="lg:inline hidden">on the left</span>
                  <button
                    className="lg:hidden font-bold text-[#6B46C1] underline"
                    onClick={() => setInputPanelOpen(true)}
                  >
                    in the input panel
                  </button>{" "}
                  and click{" "}
                  <span className="font-bold text-[#6B46C1]">Run Simulation</span>
                </p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#6B46C1] animate-spin mb-4" />
                <p className="text-base font-semibold text-gray-700">Analyzing seismic data...</p>
                <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
              </div>
            )}

            {/* Results */}
            {results && !loading && (
              <div className="space-y-5 max-w-5xl">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600">
                      ⚠ HIGH RISK PROFILE
                    </span>
                    <span className="text-xs text-gray-400">Analysis v2.4.1</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-gray-900 leading-none">
                    Intelligence Report
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {results.city}, Pakistan &nbsp;•&nbsp; Mw {formData.magnitude} &nbsp;•&nbsp; Depth {formData.depth} km
                  </p>
                </div>

                <ReportCards results={results} formData={formData} />
                <TrendGraphs trends={trends} singleResult={results} />
              </div>
            )}

          </main>

          {/* Floating Inputs button — mobile only, bottom-right corner */}
          {!inputPanelOpen && (
            <button
              onClick={() => setInputPanelOpen(true)}
              className="lg:hidden fixed bottom-5 right-5 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#6B46C1] text-white text-sm font-bold shadow-lg hover:bg-[#5a38a8] active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 4a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Inputs
            </button>
          )}

        </div>
      </div>
    </div>
  );
}