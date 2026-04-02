import { useEffect, useState } from "react";
import { Activity, AlertTriangle, RefreshCw } from "lucide-react";
import StatCard from "../components/Dashboard/StatCard";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import EarthquakeMap from "../components/Dashboard/EarthquakeMap";
import EventsTable from "../components/Dashboard/EventsTable";
import { getCityName } from "../utils/geocoding";

export default function Dashboard() {
  const [rows, setRows]                   = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [lastUpdated, setLastUpdated]     = useState(null);

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

          {/* Map + Events */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* Map card */}
            <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Map header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
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
              <div className="flex items-center gap-4 px-5 py-2 bg-gray-50 border-b border-gray-100">
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

              {/* Map */}
              <div className="h-[430px]">
                <EarthquakeMap rows={rows} selectedLocation={selectedLocation} />
              </div>
            </div>

            {/* Events panel */}
            <div className="lg:col-span-1">
              <EventsTable rows={rows} onSelect={setSelectedLocation} />
            </div>
          </div>

          {/* Summary table */}
          {/* {rows.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B46C1] mb-0.5">
                  Data Table
                </p>
                <h3 className="text-sm font-black text-gray-900">Historic Seismic Events</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["Date", "Time", "Location", "Magnitude", "Depth", "Status"].map(h => (
                        <th key={h}
                          className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r, i) => {
                      const statusCls =
                        r.mag >= 5  ? "bg-red-50 text-red-600 border-red-200"    :
                        r.mag >= 3  ? "bg-amber-50 text-amber-600 border-amber-200" :
                        "bg-green-50 text-green-600 border-green-200";
                      return (
                        <tr key={i}
                          onClick={() => setSelectedLocation(r)}
                          className="hover:bg-[#6B46C1]/5 cursor-pointer transition-all">
                          <td className="px-4 py-3 text-gray-600">{r.date}</td>
                          <td className="px-4 py-3 text-gray-400">{r.time}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{r.location}</td>
                          <td className="px-4 py-3">
                            <span className="font-black text-[#6B46C1]">{r.mag}</span>
                            <span className="text-gray-400 ml-1">Mw</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{r.depth}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCls}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )} */}

        </div>
      </main>
    </div>
  );
}