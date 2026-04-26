import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

// ── Custom SVG circle markers ──────────────────────────────────────────────
function makeCircleIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="10" fill="${color}" fill-opacity="0.25" />
      <circle cx="14" cy="14" r="6"  fill="${color}" />
      <circle cx="14" cy="14" r="3"  fill="white" />
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
    popupAnchor:[0, -14],
  });
}

const icons = {
  high:     makeCircleIcon("#EF4444"),
  moderate: makeCircleIcon("#F59E0B"),
  low:      makeCircleIcon("#10B981"),
};

function getIcon(mag) {
  if (mag >= 5) return icons.high;
  if (mag >= 3) return icons.moderate;
  return icons.low;
}

// ── Fit bounds on data load ────────────────────────────────────────────────
function FitBounds({ rows }) {
  const map = useMap();
  useEffect(() => {
    if (!rows.length) return;
    const bounds = rows.map(r => [r.lat, r.lon]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [rows, map]);
  return null;
}

// ── Fly to selected alert ──────────────────────────────────────────────────
function FlyToLocation({ selectedLocation }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedLocation) return;
    map.flyTo([selectedLocation.lat, selectedLocation.lon], 7, { duration: 1.5 });
  }, [selectedLocation, map]);
  return null;
}

// ── Map component ──────────────────────────────────────────────────────────
export default function EarthquakeMap({ rows, selectedLocation }) {
  return (
    <MapContainer
      center={[30.3753, 69.3451]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      <FitBounds rows={rows} />
      <FlyToLocation selectedLocation={selectedLocation} />

      {rows.map((q, i) => (
        <Marker key={i} position={[q.lat, q.lon]} icon={getIcon(q.mag)}>
          <Popup>
            <div style={{ fontFamily: "sans-serif", fontSize: 12, minWidth: 160 }}>
              <p style={{ fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>{q.location}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, color: "#555" }}>
                <span>🌊 Magnitude: <strong style={{ color: "#6B46C1" }}>{q.mag}</strong></span>
                <span>📏 Depth: {q.depth}</span>
                <span>📅 {q.date} · {q.time}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}