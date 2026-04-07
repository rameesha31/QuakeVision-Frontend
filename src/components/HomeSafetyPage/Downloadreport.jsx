// ── downloadReport.js ─────────────────────────────────────────────────────
// Import: import { Downloadreport } from "./downloadReport";

function formatPKR(n) {
  n = Math.round(n);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

function capFirst(s) {
  return String(s || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function stripMd(text) {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g,   "$1")
    .replace(/`(.+?)`/g,     "$1")
    .replace(/\|/g, " · ")
    .replace(/^[-•]\s+/gm,  "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function safeNum(v, def = 0) {
  const n = Number(v);
  return isNaN(n) ? def : n;
}

function safeGet(obj, key, def = null) {
  if (!obj || typeof obj !== "object") return def;
  const v = obj[key];
  return (v === undefined || v === null || v === "") ? def : v;
}

const BUDGET_LEVEL_MAP = {
  low:      "basic",
  moderate: "standard",
  high:     "comprehensive",
};

export async function Downloadreport(reportData) {
  if (!reportData) return alert("No report data available.");

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Colour palette ────────────────────────────────────────────────────
  const PURPLE = [107, 70, 193];
  const DARK   = [30, 30, 50];
  const GRAY   = [120, 120, 140];
  const LIGHT  = [245, 245, 250];
  const WHITE  = [255, 255, 255];
  const GREEN  = [16, 185, 129];
  const RED    = [220, 53, 69];
  const AMBER  = [245, 158, 11];
  const BLUE   = [59, 130, 246];

  // ── Helpers ───────────────────────────────────────────────────────────
  const checkPage = (n = 12) => { if (y + n > 275) { doc.addPage(); y = 20; } };

  const sectionTitle = (t) => {
    checkPage(16);
    doc.setFillColor(...PURPLE);
    doc.rect(0, y, W, 8, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(t.toUpperCase(), 14, y + 5.5);
    y += 13;
    doc.setTextColor(...DARK);
  };

  const row = (label, value, lc = GRAY, vc = DARK) => {
    checkPage(10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lc);
    doc.text(String(label), 14, y);
    doc.setTextColor(...vc);
    doc.setFont("helvetica", "bold");
    doc.text(String(value ?? "—"), 85, y);
    y += 7;
  };

  const divider = () => {
    checkPage(6);
    doc.setDrawColor(220, 220, 230);
    doc.line(14, y, W - 14, y);
    y += 5;
  };

  // Prose block with a bold purple label above it
  const prose = (heading, text) => {
    const clean = stripMd(text);
    if (!clean) return;
    checkPage(14);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PURPLE);
    doc.text(heading, 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.splitTextToSize(clean, W - 28).forEach(line => {
      checkPage(7);
      doc.text(line, 14, y);
      y += 6;
    });
    y += 2;
  };

  const listItem = (num, text, color = PURPLE) => {
    const clean = stripMd(text);
    if (!clean) return;
    checkPage(14);
    doc.setFillColor(...color);
    doc.circle(18, y - 2, 2.5, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(String(num), num < 10 ? 17 : 16, y - 0.5);
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.splitTextToSize(clean, W - 40).forEach(line => { checkPage(7); doc.text(line, 26, y); y += 6; });
    y += 1;
  };

  const subLabel = (text) => {
    checkPage(8);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PURPLE);
    doc.text(text, 14, y);
    y += 7;
    doc.setTextColor(...DARK);
  };

  // ── Pull data ─────────────────────────────────────────────────────────
  const viz  = safeGet(reportData, "visualization_data", {}) || {};
  const risk = safeGet(viz, "risk_assessment", {}) || {};
  const proj = safeGet(viz, "project_info",   {}) || {};
  const costs= safeGet(viz, "cost_options",   {}) || {};
  const steps= safeGet(viz, "retrofit_steps", {}) || {};

  const rl        = (safeGet(risk, "risk_level", "") || "").toUpperCase();
  const bc        = ["SEVERE","HIGH","EXTREME"].includes(rl) ? RED : rl === "LOW" ? GREEN : AMBER;
  const budgetKey = BUDGET_LEVEL_MAP[safeGet(proj, "budget_level", "")?.toLowerCase()] || safeGet(costs, "recommended", "standard");

  // ── Cover ─────────────────────────────────────────────────────────────
  doc.setFillColor(...PURPLE); doc.rect(0, 0, W, 44, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("Home Safety Intelligence Report", 14, 18);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(
    `${safeGet(proj, "material", "—")}  •  ${capFirst(safeGet(proj, "building_type", ""))}  •  Mw ${safeGet(proj, "magnitude", "—")}`,
    14, 28
  );
  doc.text(
    `${safeNum(safeGet(proj, "total_sqft", 0)).toLocaleString()} sq ft  •  ${safeGet(proj, "floors", "?")} floors`,
    14, 36
  );
  doc.setFillColor(...bc); doc.roundedRect(W - 52, 8, 38, 10, 2, 2, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  doc.text(rl || "UNKNOWN", W - 46, 14);
  doc.setTextColor(200, 190, 230); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 68, 40);
  y = 52;

  // ── 1. Risk Assessment ────────────────────────────────────────────────
  sectionTitle("1. Risk Assessment");
  row("Risk Level",           rl || "—",                                          GRAY, bc);
  row("Survival Probability", `${safeNum(safeGet(risk, "survival_probability", 0))}%`, GRAY, GREEN);
  row("Collapse Probability", `${safeNum(safeGet(risk, "collapse_probability", 0))}%`, GRAY, RED);
  row("Occupancy Status",     safeGet(risk, "occupancy_status", "—") || "—");
  if (safeGet(risk, "explanation")) {
    y += 2;
    prose("Risk Summary:", risk.explanation);
  }
  divider();

  // ── 2. Property Information ───────────────────────────────────────────
  sectionTitle("2. Property Information");
  row("Material",      safeGet(proj, "material", "—") || "—");
  row("Building Type", capFirst(safeGet(proj, "building_type", "") || ""));
  row("Magnitude",     `Mw ${safeGet(proj, "magnitude", "—")}`);
  row("Budget Level",  capFirst(safeGet(proj, "budget_level",  "") || ""));
  row("Timeline",      `${safeGet(proj, "timeline_months", "—")} months`);
  row("Total Area",    `${safeNum(safeGet(proj, "total_sqft", 0)).toLocaleString()} sq ft`);
  row("Floors",        String(safeGet(proj, "floors", "—") || "—"));
  divider();

  // ── 3. Retrofit Cost Options ──────────────────────────────────────────
  sectionTitle("3. Retrofit Cost Options");
  ["basic", "standard", "comprehensive"].forEach(k => {
    const t = safeGet(costs, k, null);
    if (!t) return;
    const isSelected = budgetKey === k;
    const totalPkr   = safeNum(safeGet(t, "total_pkr", 0));
    y += 1;
    subLabel(`${t.label || capFirst(k)}${isSelected ? "  ✦ SELECTED" : ""}`);
    row("  Total Cost", totalPkr > 0 ? `PKR ${formatPKR(totalPkr)}` : "—", GRAY, isSelected ? BLUE : DARK);
    row("  Range",      safeGet(t, "range_str", "—") || "—",      [150, 150, 165], GRAY);
    row("  Duration",   `${safeGet(t, "weeks", "?")} weeks`,      [150, 150, 165], GRAY);
    if (safeGet(t, "description")) prose("  About:", t.description);
    y += 2;
  });
  divider();

  // ── 4. Retrofit Steps ─────────────────────────────────────────────────
  sectionTitle("4. Retrofit Steps");
  const stepEntries = Object.entries(steps);
  if (stepEntries.length === 0) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No step data available.", 14, y); y += 8;
  } else {
    stepEntries.forEach(([key, s], i) => {
      const costPkr = safeNum(safeGet(s, "cost_pkr", 0));
      row(
        `${i + 1}. ${capFirst(key)}`,
        `${safeGet(s, "weeks", "?")}w  •  ${costPkr > 0 ? "PKR " + formatPKR(costPkr) : "—"}`
      );
      if (safeGet(s, "description")) {
        doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
        doc.splitTextToSize(stripMd(s.description), W - 32).forEach(line => {
          checkPage(6); doc.text(line, 20, y); y += 5.5;
        });
        y += 1;
        doc.setTextColor(...DARK);
      }
    });
  }
  divider();

  // ── 5. Risk Assessment Summary ────────────────────────────────────────
  sectionTitle("5. Risk Assessment Summary");
  const riskSummary = reportData?.risk_assessment_summary || [];
  if (riskSummary.length === 0) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No summary data available.", 14, y); y += 8;
  } else {
    riskSummary.forEach((r, i) => listItem(i + 1, r, PURPLE));
  }
  divider();

  // ── 6. Action Recommendations ─────────────────────────────────────────
  sectionTitle("6. Action Recommendations");
  const actions = reportData?.action_recommendations || [];
  if (actions.length === 0) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No recommendations available.", 14, y); y += 8;
  } else {
    let actionNum = 0;
    actions.forEach(a => {
      const clean = stripMd(String(a));
      if (!clean) return;
      const isHeading = /^[A-Z0-9][A-Z0-9\s\-–—:()/]*$/.test(clean) && clean.length < 80;
      if (isHeading) {
        checkPage(10);
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...PURPLE);
        doc.text(clean, 14, y); y += 8; doc.setTextColor(...DARK);
      } else {
        actionNum++;
        listItem(actionNum, a, GREEN);
      }
    });
  }
  divider();

  // ── 7. Full Detailed Report ───────────────────────────────────────────
  if (reportData?.full_detailed_report) {
    sectionTitle("7. Full Detailed Report");
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
    doc.splitTextToSize(stripMd(reportData.full_detailed_report), W - 28).forEach(line => {
      checkPage(8); doc.text(line, 14, y); y += 6;
    });
    divider();
  }

  // ── Footer ────────────────────────────────────────────────────────────
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT); doc.rect(0, 285, W, 12, "F");
    doc.setTextColor(...GRAY); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("QuakeVision AI  •  Home Safety Report  •  Confidential", 14, 291);
    doc.text(`Page ${i} of ${total}`, W - 28, 291);
  }

  const mat = safeGet(proj, "material", "Report");
  const mag = safeGet(proj, "magnitude", "");
  doc.save(`HomeSafety_${(mat || "Report").replace(/\s+/g, "_")}_Mw${mag}.pdf`);
}