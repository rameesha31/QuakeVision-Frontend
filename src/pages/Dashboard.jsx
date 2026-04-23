import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, RefreshCw } from "lucide-react";
import StatCard from "../components/Dashboard/StatCard";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import EarthquakeMap from "../components/Dashboard/EarthquakeMap";
import { getCityName } from "../utils/geocoding";

export default function Dashboard() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchQuakes = async () => {
    setLoading(true);

    try {
      const now = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);
      const startDate = twoYearsAgo.toISOString().split("T")[0];

      let results = [];
      let offset = 1;

      while (results.length < 10) {
        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&orderby=time&minlatitude=23.5&maxlatitude=37.1&minlongitude=60.5&maxlongitude=77.8&limit=50&offset=${offset}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch earthquakes");

        const data = await res.json();
        if (!data.features.length) break;

        // 🔥 SEQUENTIAL processing (NO Promise.all)
        for (const ev of data.features) {
          try {
            const lat = ev.geometry.coordinates[1];
            const lon = ev.geometry.coordinates[0];
            const depth = ev.geometry.coordinates[2];
            const d = new Date(ev.properties.time);
            const mag = ev.properties.mag;

            if (!lat || !lon) continue;

            const city = await getCityName(lat, lon);

            if (city === "Outside Pakistan" || city === "Unknown Region") continue;

            results.push({
              date: d.toLocaleDateString(),
              time: d.toLocaleTimeString(),
              location: city,
              mag,
              depth: depth + " km",
              lat,
              lon,
              status: mag >= 5 ? "High" : mag >= 3 ? "Moderate" : "Low",
            });

            // ⚡ Stop early once we have enough
            if (results.length >= 10) break;

          } catch (err) {
            console.error("Error processing earthquake:", err);
          }
        }

        offset += 50;
      }

      setRows(results.slice(0, 10));
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuakes();
    const interval = setInterval(fetchQuakes, 300000);
    return () => clearInterval(interval);
  }, []);

  const highCount = rows.filter((r) => r.mag >= 5).length;

  return (
    <div className="min-h-screen w-full flex bg-[#F7F8FC] text-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* TOP BAR */}
        <div className="bg-white border-b px-6 py-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs font-semibold text-gray-500 hover:text-[#6B46C1]"
          >
            ← Back to Home
          </button>
          <Header />
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <StatCard icon={<Activity size={16} />} color="purple" title="Seismic Monitoring" value="Live" sub="Pakistan Region" />
            <StatCard icon={<AlertTriangle size={16} />} color="red" title="Recent Events" value={loading ? "—" : rows.length} sub="Last 2 years · Pakistan" />
            <StatCard icon={<AlertTriangle size={16} />} color="blue" title="High Risk Events" value={loading ? "—" : highCount} sub="Magnitude ≥ 5.0" />
          </div>

          {/* Map + Events */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm">

              <div className="flex justify-between px-5 py-3 border-b">
                <h3 className="font-bold">Live Seismic Map</h3>
                <button onClick={fetchQuakes} disabled={loading}>
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="h-[430px]">
                <EarthquakeMap rows={rows} selectedLocation={selectedLocation} />
              </div>
            </div>

            <EventsTableFull rows={rows} onSelect={setSelectedLocation} />
          </div>
        </div>
      </main>
    </div>
  );
}

function EventsTableFull({ rows, onSelect }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm h-[520px] overflow-y-auto p-3">
      {rows.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">Fetching data...</p>
      ) : (
        rows.map((r, i) => (
          <div
            key={i}
            onClick={() => onSelect(r)}
            className="p-3 border rounded-xl mb-2 cursor-pointer hover:bg-gray-50"
          >
            <p className="font-bold text-sm">{r.location}</p>
            <p className="text-xs text-gray-500">{r.date} · {r.time}</p>
            <p className="text-xs text-gray-500">Depth: {r.depth}</p>
          </div>
        ))
      )}
    </div>
  );
}
