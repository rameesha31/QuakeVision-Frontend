const cache = new Map();

// Optional: limit cache size (prevents memory leaks in long sessions)
const MAX_CACHE_SIZE = 500;

export const getCityName = async (lat, lon) => {
  if (!lat || !lon) return "Unknown Region";

  // Round to reduce duplicate calls (smart move already)
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;

  // ✅ Return from cache if exists
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/v1/reverse-geocode?lat=${lat}&lon=${lon}`
    );

    // ❌ Handle bad responses properly
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();

    if (!data || !data.address) {
      cache.set(key, "Unknown Region");
      return "Unknown Region";
    }

    const a = data.address;

    // ✅ Filter only Pakistan
    if (a.country_code !== "pk") {
      cache.set(key, "Outside Pakistan");
      return "Outside Pakistan";
    }

    // ✅ Smart fallback chain for location naming
    const city =
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.state_district ||
      a.county ||
      a.state ||
      "Pakistan";

    // ✅ Maintain cache size (simple eviction)
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, city);
    return city;

  } catch (err) {
    console.error("Reverse geocoding failed:", err);

    // Cache failures too (prevents repeated failing calls)
    cache.set(key, "Unknown Region");

    return "Unknown Region";
  }
};
