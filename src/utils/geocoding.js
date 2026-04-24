// geocoding.js — direct Nominatim reverse geocoding
// - No CORS proxy (corsproxy.io was getting 403'd by Nominatim)
// - In-memory cache to avoid duplicate requests for same coords
// - Sequential queue with 1-second delay between calls (Nominatim ToS: max 1 req/s)

const cache = new Map();

// Round coords to 1 decimal place so nearby quakes reuse cached results
const cacheKey = (lat, lon) =>
  `${Math.round(lat * 10) / 10},${Math.round(lon * 10) / 10}`;

// Simple delay helper
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Queue to serialize requests and respect Nominatim's 1 req/s limit
let queue = Promise.resolve();
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100; // slightly over 1s to be safe

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

/**
 * Reverse geocode a lat/lon to a city name.
 * Returns "Outside Pakistan" or "Unknown Region" for unrecognised locations.
 */
export async function getCityName(lat, lon) {
  const key = cacheKey(lat, lon);
  if (cache.has(key)) return cache.get(key);

  return enqueue(async () => {
    // Check cache again inside the queue (another call may have populated it)
    if (cache.has(key)) return cache.get(key);

    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          // Nominatim requires a valid User-Agent identifying your app
          "User-Agent": "QuakeVisionFYP/1.0 (contact@quakevision.app)",
          "Accept-Language": "en",
        },
      });

      if (!res.ok) {
        const result = "Unknown Region";
        cache.set(key, result);
        return result;
      }

      const data = await res.json();
      const addr = data.address || {};

      // Prefer the most specific → least specific place name
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.county ||
        addr.state_district ||
        addr.state ||
        null;

      const country = addr.country_code?.toLowerCase();

      // Filter out non-Pakistan results
      if (!city || country !== "pk") {
        const result = "Outside Pakistan";
        cache.set(key, result);
        return result;
      }

      cache.set(key, city);
      return city;
    } catch {
      const result = "Unknown Region";
      cache.set(key, result);
      return result;
    }
  });
}
