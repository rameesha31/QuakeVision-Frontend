// api/geocode.js  — Vercel serverless function
// Proxies Nominatim requests server-side, avoiding all CORS + rate-limit issues

export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    const nominatimRes = await fetch(url, {
      headers: {
        "User-Agent": "QuakeVisionFYP/1.0 (contact@quakevision.app)",
        "Accept-Language": "en",
      },
    });

    if (!nominatimRes.ok) {
      return res.status(nominatimRes.status).json({ error: "Nominatim error" });
    }

    const data = await nominatimRes.json();

    // Cache response at the CDN edge for 24 hours — earthquake locations don't change
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Geocoding failed", detail: err.message });
  }
}
