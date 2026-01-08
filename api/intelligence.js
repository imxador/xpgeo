export default async function handler(req, res) {
  const query = req.query.q || "geopolitics OR military OR protest OR conflict";

  const params = new URLSearchParams({
    query,
    format: "json",
    maxrecords: 150,
    sort: "HybridRel",
    timespan: "24h"
  });

  const url = `https://api.gdeltproject.org/api/v2/events/search?${params}`;

  try {
    const r = await fetch(url);
    const d = await r.json();

    if (!d.events) return res.json([]);

    const intel = d.events.map(e => buildIntel(e))
      .filter(e => e.score >= 7)
      .sort((a, b) => b.score - a.score);

    res.status(200).json(intel);
  } catch {
    res.status(500).json({ error: "OSINT source unavailable" });
  }
}

function buildIntel(e) {
  const score = intelligenceScore(e);

  return {
    title: `${e.Actor1Name || "Unknown"} → ${e.Actor2Name || "Unknown"}`,
    location: e.ActionGeo_FullName || "Unspecified",
    date: e.Day,
    sources: e.NumSources,
    score,
    level: threatLevel(score),
    summary: summarize(e)
  };
}

function intelligenceScore(e) {
  let s = 0;

  if (e.Actor1CountryCode && e.Actor2CountryCode &&
      e.Actor1CountryCode !== e.Actor2CountryCode) s += 3;

  if (["18", "19", "20"].includes(e.EventRootCode)) s += 5;

  if (e.GoldsteinScale < -7) s += 4;

  if (e.NumSources < 4) s += 3;

  if (e.ActionGeo_Type === "1") s += 2; // capital city

  return s;
}

function threatLevel(score) {
  if (score >= 14) return "CRITICAL";
  if (score >= 11) return "HIGH";
  if (score >= 8) return "ELEVATED";
  return "MODERATE";
}

function summarize(e) {
  return `Event involving ${e.Actor1Name || "actor"} and ${
    e.Actor2Name || "actor"
  } with limited coverage (${e.NumSources} sources).`;
}
  
