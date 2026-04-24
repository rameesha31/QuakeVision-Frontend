import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, RefreshCw } from "lucide-react";
import StatCard from "../components/Dashboard/StatCard";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import EarthquakeMap from "../components/Dashboard/EarthquakeMap";
import EventsTable from "../components/Dashboard/EventsTable";
import { getCityName } from "../utils/geocoding";

export default function Dashboard() {
  const navigate = useNavigate();

  const [rows, setRows]                         = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [lastUpdated, setLastUpdated]           = useState(null);

  const fetchQuakes = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);
      const startDate = twoYearsAgo.toISOString().split("T")[0];

      let results = [];
      let offset  = 1;

      while (results.length < 10) {
        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&orderby=time&minlatitude=23.5&maxlatitude=37.1&minlongitude=60.5&maxlongitude=77.8&limit=50&offset=${offset}`;
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.features.length) break;

        const batch = await Promise.all(
          data.features.map(async (ev) => {
            try {
              const lat   = ev.geometry.coordinates[1];
              const lon   = ev.geometry.coordinates[0];
              const depth = ev.geometry.coordinates[2];
              const d     = new Date(ev.properties.time);
              const mag   = ev.properties.mag;
              if (!lat || !lon) return null;
              const city = await getCityName(lat, lon);
              if (city === "Outside Pakistan" || city === "Unknown Region") return null;
              return {
                date:     d.toLocaleDateString(),
                time:     d.toLocaleTimeString(),
                location: city,
                mag,
                depth:    depth + " km",
                lat, lon,
                status:   mag >= 5 ? "High" : mag >= 3 ? "Moderate" : "Low",
              };
            } catch { return null; }
          })
        );

        results.push(...batch.filter(Boolean));
        offset += 50;
      }

      setRows(results.slice(0, 10));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuakes();
    const interval = setInterval(fetchQuakes, 300000);
    return () => clearInterval(interval);
  }, []);

  const highCount = rows.filter(r => r.mag >= 5).length;

  return (
    <div className="min-h-screen w-full flex bg-[#F7F8FC] text-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
          {/* Back buttons */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#6B46C1] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
          </div>
          <Header />
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <StatCard
              icon={<Activity size={16} />}
              color="purple"
              title="Seismic Monitoring"
              value="Live"
              sub="Pakistan Region"
            />
            <StatCard
              icon={<AlertTriangle size={16} />}
              color="red"
              title="Recent Events"
              value={loading ? "—" : rows.length}
              sub="Last 2 years · Pakistan"
            />
            <StatCard
              icon={<AlertTriangle size={16} />}
              color="blue"
              title="High Risk Events"
              value={loading ? "—" : highCount}
              sub="Magnitude ≥ 5.0"
            />
          </div>

          {/* Map + Events — side by side, same height */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">

            {/* Map card */}
            <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {/* Map header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B46C1] mb-0.5">
                    USGS Data
                  </p>
                  <h3 className="text-sm font-black text-gray-900">Live Seismic Map</h3>
                </div>
                <div className="flex items-center gap-3">
                  {lastUpdated && (
                    <span className="text-[10px] text-gray-400">
                      Updated {lastUpdated}
                    </span>
                  )}
                  <button
                    onClick={fetchQuakes}
                    disabled={loading}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      loading
                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                        : "bg-[#6B46C1]/10 text-[#6B46C1] hover:bg-[#6B46C1]/20"
                    }`}
                  >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Map legend */}
              <div className="flex items-center gap-4 px-5 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
                {[
                  { color: "#EF4444", label: "High (≥5.0)" },
                  { color: "#F59E0B", label: "Moderate (3–5)" },
                  { color: "#10B981", label: "Low (<3.0)" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                    <span className="text-[10px] text-gray-500 font-medium">{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Map — height synced with events panel (≈500px) */}
              <div className="h-[430px]">
                <EarthquakeMap rows={rows} selectedLocation={selectedLocation} />
              </div>
            </div>

            {/* Events panel — same total visual height */}
            <div className="lg:col-span-1">
              <EventsTableFull rows={rows} onSelect={setSelectedLocation} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Inline EventsTable with full location names ───────────────────────────
function EventsTableFull({ rows, onSelect }) {
  const magMeta = (mag) => {
    if (mag >= 5) return { color: "#EF4444", bg: "#FEF2F2", label: "High",     border: "#FECACA" };
    if (mag >= 3) return { color: "#F59E0B", bg: "#FFFBEB", label: "Moderate", border: "#FDE68A" };
    return          { color: "#10B981", bg: "#ECFDF5", label: "Low",      border: "#A7F3D0" };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col" style={{ height: "520px" }}>

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B46C1] mb-0.5">
              Live Feed
            </p>
            <h3 className="font-black text-gray-900 text-sm">Recent Events</h3>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Updating
          </span>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl">🌍</div>
            <p className="text-sm text-gray-400 font-medium">Fetching seismic data...</p>
          </div>
        ) : (
          rows.map((r, i) => {
            const m = magMeta(r.mag);
            return (
              <div
                key={i}
                onClick={() => onSelect(r)}
                className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-[#6B46C1]/5 hover:border-[#6B46C1]/20 cursor-pointer transition-all"
              >
                {/* Mag badge */}
                <div className="shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl border"
                  style={{ background: m.bg, borderColor: m.border }}>
                  <span className="text-sm font-black leading-none" style={{ color: m.color }}>
                    {r.mag}
                  </span>
                  <span className="text-[8px] font-bold uppercase mt-0.5" style={{ color: m.color }}>
                    Mw
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-xs font-bold text-gray-800 break-words leading-snug">
                      {r.location}
                    </p>
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
                      {m.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">{r.date} · {r.time}</p>
                  <p className="text-[10px] text-gray-400">Depth: {r.depth}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
