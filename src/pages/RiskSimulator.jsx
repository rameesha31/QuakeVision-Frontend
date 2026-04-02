import { useState } from "react";
import Sidebar from "../components/Dashboard/Sidebar";
import TopBar from "../components/Risk/TopBar";
import InputSideBar from "../components/Risk/InputSideBar";
import ReportCards from "../components/Risk/ReportCards";
import TrendGraphs from "../components/Risk/TrendsGraph";
import { generatePDF } from "../components/Risk/DownloadPdf";

export default function RiskSimulator() {
  const [formData, setFormData] = useState({
    location: "", epicenter: "", magnitude: "", depth: "",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [report,  setReport]  = useState(null);
  const [trends,  setTrends]  = useState(null);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!formData.location) return alert("Enter target city");
    setLoading(true);
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
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        <TopBar
          results={results}
          loading={loading}
          onRun={handleSubmit}
          onDownload={handleDownload}
        />

        <div className="flex flex-1 overflow-hidden">

          <InputSideBar
            formData={formData}
            onChange={handleChange}
            results={results}
          />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">

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
                  Fill in the parameters on the left and click{" "}
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

                {/* Report header */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600">
                      ⚠ HIGH RISK PROFILE
                    </span>
                    <span className="text-xs text-gray-400">Analysis v2.4.1</span>
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 leading-none">
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