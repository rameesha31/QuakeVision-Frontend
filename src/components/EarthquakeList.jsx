import { useEffect, useState } from "react";
import EventsTable from "./EventsTable";

export default function EarthquakeList() {
  const [rows, setRows] = useState([]);

  const statusColor = {
    High: "bg-red-500 text-white",
    Moderate: "bg-yellow-500 text-black",
    Low: "bg-green-500 text-white",
  };

  const fetchQuakes = async () => {
    try {
      const res = await fetch(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
      );
      const data = await res.json();

      const pakistanQuakes = data.features.filter((ev) => {
        const place = ev.properties.place?.toLowerCase() || "";
        return place.includes("pakistan");
      });

      const formatted = pakistanQuakes.map((ev) => {
        const d = new Date(ev.properties.time);
        const mag = ev.properties.mag;
        let status = "Low";
        if (mag >= 5) status = "High";
        else if (mag >= 3) status = "Moderate";

        return {
          date: d.toLocaleDateString(),
          time: d.toLocaleTimeString(),
          location: ev.properties.place,
          mag: mag,
          depth: ev.geometry.coordinates[2],
          area: ev.properties.place.split(",").pop(),
          status: status,
        };
      });

      setRows(formatted);
    } catch (err) {
      console.error("Error fetching quakes:", err);
    }
  };

  useEffect(() => {
    fetchQuakes();
    const interval = setInterval(fetchQuakes, 300000); // every 5 min
    return () => clearInterval(interval);
  }, []);

  return <EventsTable rows={rows} statusColor={statusColor} />;
}
