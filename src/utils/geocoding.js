const cache = new Map();

export const getCityName = async (lat, lon) => {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;

  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(
  `https://corsproxy.io/?https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
);

    const data = await res.json();
    if (!data?.address) return "Unknown Region";

    const a = data.address;

    // Ensure inside Pakistan
    if (a.country_code !== "pk") {
      cache.set(key, "Outside Pakistan");
      return "Outside Pakistan";
    }

    const city =
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.state_district ||
      a.county ||
      a.state ||
      "Pakistan";

    cache.set(key, city);
    return city;
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return "Unknown Region";
  }
};
