import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import TopBar from "../components/Risk/TopBar";
import InputSideBar from "../components/Risk/InputSideBar";
import ReportCards from "../components/Risk/ReportCards";
import TrendGraphs from "../components/Risk/TrendsGraph";
import { generatePDF } from "../components/Risk/DownloadPdf";

export default function RiskSimulator() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    location: "", epicenter: "", magnitude: "", depth: "",
  });
  const [loading, setLoading]         = useState(false);
  const [results, setResults]         = useState(null);
  const [report, setReport]           = useState(null);
  const [trends, setTrends]           = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputOpen, setInputOpen]     = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!formData.location) return alert("Enter target city");
    setLoading(true);
    // Close mobile input panel when running
    setInputOpen(false);
    try {
      const payload = {
        epicenter_city: formData.epicenter,
        target_city:    formData.location,
        magnitude:      parseFloat(formData.magnitude),
        depth:          parseFloat(formData.depth),
      };

      const res = await fetch("http://127.0.0.1:8000/predict-damage", {
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
        fetch("http://127.0.0.1:8000/predict-damage-range", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`http://127.0.0.1:8000/cityRisk/${formData.location}`),
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

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Back buttons bar */}
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

          {/* Mobile: toggle input panel */}
          <button
            className="ml-auto md:hidden flex items-center gap-1.5 text-xs font-semibold text-[#6B46C1] bg-[#6B46C1]/10 px-3 py-1.5 rounded-lg"
            onClick={() => setInputOpen(v => !v)}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {inputOpen ? "Hide Inputs" : "Set Parameters"}
          </button>
        </div>

        <TopBar
          results={results}
          loading={loading}
          onRun={handleSubmit}
          onDownload={handleDownload}
        />

        <div className="flex flex-1 overflow-hidden">

          {/* Input sidebar — drawer on mobile, permanent on md+ */}
          <div className={`
            ${inputOpen ? "flex" : "hidden"} md:flex
            fixed inset-y-0 left-0 right-0 z-50 md:relative md:inset-auto md:z-auto
            md:w-64 lg:w-72 flex-col bg-white md:bg-transparent
          `}>
            {/* Mobile close button inside the panel */}
            <div className="md:hidden flex justify-end p-3 border-b border-gray-100">
              <button
                onClick={() => setInputOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <InputSideBar
              formData={formData}
              onChange={handleChange}
              results={results}
            />
          </div>

          {/* Mobile input backdrop */}
          {inputOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setInputOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">

            {/* Empty state */}
            {!results && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#6B46C1]/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#6B46C1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-gray-700">No Simulation Run Yet</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Fill in the parameters{" "}
                  <span className="md:hidden font-bold text-[#6B46C1]" onClick={() => setInputOpen(true)}>
                    (tap here to open)
                  </span>
                  <span className="hidden md:inline">on the left</span>
                  {" "}and click{" "}
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
              <div className="space-y-4 sm:space-y-5 max-w-5xl">
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600">
                      ⚠ HIGH RISK PROFILE
                    </span>
                    <span className="text-xs text-gray-400">Analysis v2.4.1</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-gray-900 leading-none">
                    Intelligence Report
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {results.city}, Pakistan &nbsp;•&nbsp; Mw {formData.magnitude} &nbsp;•&nbsp; Depth {formData.depth} km
                  </p>
                </div>

                <ReportCards results={results} formData={formData} />
                <TrendGraphs trends={trends} singleResult={results} />
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
