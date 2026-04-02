// ─── Pure helper functions ────────────────────────────────────────────────────
 
export const getShakingIntensity = (pga) => {
  if (pga < 0.05) return "Weak";
  if (pga < 0.15) return "Light";
  if (pga < 0.3)  return "Moderate";
  if (pga < 0.5)  return "Strong";
  return "Severe";
};
 
export const getImpact = (level = "") => {
  switch (level.toLowerCase()) {
    case "low":      return "Minimal structural damage expected";
    case "moderate": return "Noticeable damage to weak structures";
    case "high":     return "Serious structural damage likely";
    case "severe":   return "Widespread structural damage expected";
    default:         return "Impact level undetermined";
  }
};
 
export const hazardMeta = (level = "") => {
  switch (level.toLowerCase()) {
    case "low":      return { color: "#10B981", gauge: 25 };
    case "moderate": return { color: "#F59E0B", gauge: 50 };
    case "high":     return { color: "#EF4444", gauge: 75 };
    case "severe":   return { color: "#7C3AED", gauge: 95 };
    default:         return { color: "#6B7280", gauge: 0 };
  }
};