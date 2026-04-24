// geocoding.js
// Calls our own Vercel serverless function (/api/geocode) which proxies
// Nominatim server-side — no CORS issues, no browser blocks.

const cache = new Map();

const cacheKey = (lat, lon) =>
  `${Math.round(lat * 10) / 10},${Math.round(lon * 10) / 10}`;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Serialize requests with a small gap to avoid hammering even our own endpoint
let queue = Promise.resolve();
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 300; // our serverless fn + Vercel CDN cache handles rate limiting

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
      // Call our Vercel serverless proxy — no CORS, no browser blocks
      const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);

      if (!res.ok) {
        const result = "Unknown Region";
        cache.set(key, result);
        return result;
      }

      const data = await res.json();
      const addr = data.address || {};
      const country = addr.country_code?.toLowerCase();

      if (country !== "pk") {
        cache.set(key, "Outside Pakistan");
        return "Outside Pakistan";
      }

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.state_district ||
        addr.county ||
        addr.state ||
        "Pakistan";

      cache.set(key, city);
      return city;
    } catch (err) {
      console.error("Geocoding failed:", err);
      const result = "Unknown Region";
      cache.set(key, result);
      return result;
    }
  });
}
