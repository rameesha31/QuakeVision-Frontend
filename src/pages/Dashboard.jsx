import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, RefreshCw } from "lucide-react";
import StatCard from "../components/Dashboard/StatCard";
import Sidebar, { useIsDesktop, SidebarToggleButton } from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import EarthquakeMap from "../components/Dashboard/EarthquakeMap";
import EventsTable from "../components/Dashboard/EventsTable";
import { getCityName } from "../utils/geocoding";

export default function Dashboard() {
  const navigate  = useNavigate();
  const isDesktop = useIsDesktop();

  const [rows, setRows]                         = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [lastUpdated, setLastUpdated]           = useState(null);
  const [windowWidth, setWindowWidth]           = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const sm = windowWidth >= 640;
  const lg = windowWidth >= 1024;

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

  const highCount  = rows.filter(r => r.mag >= 5).length;
  const mapHeight  = lg ? 430 : sm ? 350 : 280;
  const contentPad = sm ? 24 : 16;

  return (
    <div style={{
      display: "flex", minHeight: "100vh", width: "100%",
      background: "#F7F8FC", color: "#111827", overflow: "hidden",
    }}>
      <Sidebar />

      <main style={{
        flex: 1, minWidth: 0, height: "100vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* ── TOP BAR ── */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #E5E7EB",
          padding: sm ? "10px 24px" : "10px 16px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {/* Hamburger — only on mobile */}
            {!isDesktop && (
              <SidebarToggleButton onClick={() => window.__sidebarOpen?.()} />
            )}
            <span style={{ color: "#D1D5DB", fontSize: 12 }}>|</span>
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 600, color: "#6B7280",
                background: "none", border: "none", cursor: "pointer",
                padding: 0, transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#6B46C1"}
              onMouseLeave={e => e.currentTarget.style.color = "#6B7280"}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
          </div>
          <Header />
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: contentPad,
          display: "flex", flexDirection: "column", gap: sm ? 20 : 16,
        }}>

          {/* Stats row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: sm ? "repeat(3, 1fr)" : "1fr",
            gap: sm ? 16 : 12,
            maxWidth: 768,
          }}>
            <StatCard icon={<Activity size={16} />}      color="purple" title="Seismic Monitoring" value="Live"                        sub="Pakistan Region"         />
            <StatCard icon={<AlertTriangle size={16} />} color="red"    title="Recent Events"      value={loading ? "—" : rows.length} sub="Last 2 years · Pakistan" />
            <StatCard icon={<AlertTriangle size={16} />} color="blue"   title="High Risk Events"   value={loading ? "—" : highCount}   sub="Magnitude ≥ 5.0"         />
          </div>

          {/* Map + Events grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: lg ? "3fr 1fr" : "1fr",
            gap: sm ? 20 : 16,
            alignItems: "start",
          }}>

            {/* Map card */}
            <div style={{
              background: "#fff", border: "1px solid #E5E7EB",
              borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              overflow: "hidden", display: "flex", flexDirection: "column",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: sm ? "14px 20px" : "12px 16px",
                borderBottom: "1px solid #F3F4F6", flexShrink: 0,
              }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B46C1", marginBottom: 2 }}>
                    USGS Data
                  </p>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: "#111827", margin: 0 }}>Live Seismic Map</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Show lastUpdated always (from file 2), not gated on sm */}
                  {lastUpdated && (
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>Updated {lastUpdated}</span>
                  )}
                  <button
                    onClick={fetchQuakes}
                    disabled={loading}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: loading ? "#F3F4F6" : "#6B46C110",
                      color: loading ? "#D1D5DB" : "#6B46C1",
                      border: "none", cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div style={{
                display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                padding: "8px 20px", background: "#F9FAFB",
                borderBottom: "1px solid #F3F4F6", flexShrink: 0,
              }}>
                {[
                  { color: "#EF4444", label: "High (≥5.0)" },
                  { color: "#F59E0B", label: "Moderate (3–5)" },
                  { color: "#10B981", label: "Low (<3.0)" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                    <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 500 }}>{l.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: mapHeight }}>
                <EarthquakeMap rows={rows} selectedLocation={selectedLocation} />
              </div>
            </div>

            {/* Events panel */}
            <EventsTableFull rows={rows} onSelect={setSelectedLocation} isSm={sm} />
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Inline events list ─────────────────────────────────────────────────────
function EventsTableFull({ rows, onSelect, isSm }) {
  const magMeta = (mag) => {
    if (mag >= 5) return { color: "#EF4444", bg: "#FEF2F2", label: "High",     border: "#FECACA" };
    if (mag >= 3) return { color: "#F59E0B", bg: "#FFFBEB", label: "Moderate", border: "#FDE68A" };
    return          { color: "#10B981", bg: "#ECFDF5", label: "Low",      border: "#A7F3D0" };
  };

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB",
      borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      display: "flex", flexDirection: "column", height: 520,
    }}>
      <div style={{
        padding: isSm ? "14px 20px" : "12px 16px",
        borderBottom: "1px solid #F3F4F6", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B46C1", marginBottom: 2 }}>
            Live Feed
          </p>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: "#111827", margin: 0 }}>Recent Events</h3>
        </div>
        <span style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 600, color: "#16A34A",
          background: "#F0FDF4", border: "1px solid #BBF7D0",
          padding: "4px 10px", borderRadius: 999,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
          Updating
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isSm ? "12px" : "8px", display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌍</div>
            <p style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 500 }}>Fetching seismic data...</p>
          </div>
        ) : (
          rows.map((r, i) => {
            const m = magMeta(r.mag);
            return (
              <div
                key={i}
                onClick={() => onSelect(r)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px", borderRadius: 12,
                  border: "1px solid #F3F4F6", background: "#FAFAFA",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#6B46C108"; e.currentTarget.style.borderColor = "#6B46C130"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#FAFAFA";   e.currentTarget.style.borderColor = "#F3F4F6"; }}
              >
                <div style={{
                  flexShrink: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  width: 42, height: 42, borderRadius: 10,
                  background: m.bg, border: `1px solid ${m.border}`,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, color: m.color }}>{r.mag}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", marginTop: 2, color: m.color }}>Mw</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", wordBreak: "break-word", lineHeight: 1.3, margin: 0 }}>
                      {r.location}
                    </p>
                    <span style={{
                      flexShrink: 0, fontSize: 10, fontWeight: 600,
                      padding: "2px 6px", borderRadius: 999, whiteSpace: "nowrap",
                      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
                    }}>
                      {m.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0 }}>{r.date} · {r.time}</p>
                  <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0 }}>Depth: {r.depth}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}