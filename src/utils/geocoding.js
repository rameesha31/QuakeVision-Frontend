const cache = new Map();

const fetchNominatim = async (lat, lon) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
    { headers: { "User-Agent": "PakistanEarthquakeApp/1.0", "Accept-Language": "en" } }
  );
  if (!res.ok) throw new Error("Nominatim failed");
  return res.json();
};

const fetchBigDataCloud = async (lat, lon) => {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
  );
  if (!res.ok) throw new Error("BigDataCloud failed");
  return res.json();
};

export const getCityName = async (lat, lon) => {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (cache.has(key)) return cache.get(key);

  let city = "Unknown Region";

  try {
    const data = await fetchNominatim(lat, lon);
    if (data?.address?.country_code !== "pk") {
      cache.set(key, "Outside Pakistan");
      return "Outside Pakistan";
    }
    const a = data.address;
    city = a.city || a.town || a.village || a.municipality ||
           a.state_district || a.county || a.state || "Pakistan";

  } catch (err) {
    console.warn("Nominatim failed, trying fallback...");
    try {
      const data = await fetchBigDataCloud(lat, lon);
      if (data?.countryCode !== "PK") {
        cache.set(key, "Outside Pakistan");
        return "Outside Pakistan";
      }
      city = data.city || data.locality || data.principalSubdivision || "Pakistan";
    } catch (err2) {
      console.error("Both geocoding APIs failed:", err2);
      city = "Unknown Region";
    }
  }

  cache.set(key, city);
  return city;
};
