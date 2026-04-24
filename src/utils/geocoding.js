// geocoding.js
const cache = new Map();

const cacheKey = (lat, lon) =>
  `${Math.round(lat * 10) / 10},${Math.round(lon * 10) / 10}`;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

let queue = Promise.resolve();
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 300;

const enqueue = (fn) => {
  queue = queue.then(async () => {
    const now = Date.now();
    const wait = MIN_INTERVAL_MS - (now - lastRequestTime);
    if (wait > 0) await delay(wait);
    lastRequestTime = Date.now();
    return fn();
  });
  return queue;
};

export async function getCityName(lat, lon) {
  const key = cacheKey(lat, lon);
  if (cache.has(key)) return cache.get(key);

  return enqueue(async () => {
    if (cache.has(key)) return cache.get(key);

    try {
      // BigDataCloud: free, no API key, CORS-friendly — works from browser
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );

      if (!res.ok) {
        cache.set(key, "Unknown Region");
        return "Unknown Region";
      }

      const data = await res.json();

      if (data.countryCode !== "PK") {
        cache.set(key, "Outside Pakistan");
        return "Outside Pakistan";
      }

      const city =
        data.city ||
        data.locality ||
        data.localityInfo?.administrative?.find(a => a.adminLevel === 6)?.name ||
        data.localityInfo?.administrative?.find(a => a.adminLevel === 4)?.name ||
        data.principalSubdivision ||
        "Pakistan";

      cache.set(key, city);
      return city;
    } catch (err) {
      console.error("Geocoding failed:", err);
      cache.set(key, "Unknown Region");
      return "Unknown Region";
    }
  });
}
