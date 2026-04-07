// ── downloadGovReport.js ──────────────────────────────────────────────────
// Import: import { Govreport } from "./downloadGovReport";

function formatPKR(n) {
  n = Math.round(n);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + "M";
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

export async function Govreport(reportData) {
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
  const viz    = safeGet(reportData, "visualization_data", {}) || {};
  const proj   = safeGet(viz, "project_info",   {}) || {};
  const stock  = safeGet(viz, "building_stock", {}) || {};
  const alloc  = safeGet(viz, "allocation",     {}) || {};
  const budget = safeGet(viz, "budget_pkr",     {}) || {};
  const impact = safeGet(viz, "impact",         {}) || {};
  const tl     = safeGet(viz, "timeline",       {}) || {};

  const sectorName = safeGet(proj, "sector_name", "—") || "—";
  const city       = safeGet(proj, "city", "Islamabad") || "Islamabad";
  const mag        = safeGet(proj, "magnitude", "—") || "—";

  // ── Cover ─────────────────────────────────────────────────────────────
  doc.setFillColor(...PURPLE); doc.rect(0, 0, W, 44, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("Urban Action Plan", 14, 18);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`${sectorName}  •  ${city}  •  Mw ${mag}`, 14, 28);
  doc.text(
    `${safeNum(safeGet(proj, "retrofit_capacity", 0)).toLocaleString()} of ${safeNum(safeGet(proj, "total_buildings", 0)).toLocaleString()} buildings  •  ${safeNum(safeGet(proj, "population", 0)).toLocaleString()} residents`,
    14, 36
  );
  doc.setFillColor(...AMBER); doc.roundedRect(W - 52, 8, 38, 10, 2, 2, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  doc.text("GOV REPORT", W - 46, 14);
  doc.setTextColor(200, 190, 230); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 68, 40);
  y = 52;

  // ── 1. Impact Summary ─────────────────────────────────────────────────
  sectionTitle("1. Impact Summary");
  const livesSaved   = safeGet(impact, "total_lives_saved",  null);
  const bcr          = safeGet(impact, "benefit_cost_ratio", null);
  const econBenefit  = safeGet(impact, "economic_benefit_millions", null);
  const grandTotal   = safeGet(budget, "grand_total", 0);

  row("Lives Saved",          livesSaved != null ? String(livesSaved) : "—", GRAY, GREEN);
  row("Buildings Retrofitted",`${safeGet(proj, "retrofit_capacity", "—")} of ${safeGet(proj, "total_buildings", "—")}`);
  row("Total Budget",         grandTotal ? `PKR ${formatPKR(safeNum(grandTotal))}` : "—", GRAY, AMBER);
  row("Benefit-Cost Ratio",   bcr != null ? `${bcr}x` : "—",                              GRAY, PURPLE);
  row("Economic Benefit",     econBenefit != null ? `PKR ${econBenefit}M` : "—");

  if (safeGet(impact, "summary")) {
    y += 2;
    prose("Context:", impact.summary);
  }
  divider();

  // ── 2. Project Parameters ─────────────────────────────────────────────
  sectionTitle("2. Project Parameters");
  row("Sector",            sectorName);
  row("City",              city);
  row("Magnitude",         `Mw ${mag}`);
  row("Budget Level",      capFirst(safeGet(proj, "budget_level",    "") || ""));
  row("Timeline",          `${safeGet(proj, "timeline_months", "—")} months`);
  row("Priority Metric",   safeGet(proj, "priority_metric",  "—") || "—");
  row("Retrofit Style",    safeGet(proj, "retrofit_style",   "—") || "—");
  row("Avg Building Area", `${safeNum(safeGet(proj, "avg_building_sqft", 0)).toLocaleString()} sq ft`);
  row("Population",        safeNum(safeGet(proj, "population", 0)).toLocaleString());
  divider();

  // ── 3. Building Stock ─────────────────────────────────────────────────
  sectionTitle("3. Building Stock");
  const kachaPct  = safeGet(stock, "kacha_percent",     null);
  const semiPct   = safeGet(stock, "semi_pacca_percent",null);
  const paccaPct  = safeGet(stock, "pacca_percent",     null);

  if (kachaPct == null && semiPct == null && paccaPct == null) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No building stock data available.", 14, y); y += 8;
  } else {
    row("Kacha  (Adobe & Rubble Stone)",`${kachaPct || 0}%`);
    row("Semi-Pacca  (Unreinforced Masonry)", `${semiPct || 0}%`);
    row("Pacca  (Reinforced Concrete)",  `${paccaPct || 0}%`);
  }
  if (safeGet(stock, "notes")) prose("Notes:", stock.notes);
  divider();

  // ── 4. Retrofit Allocation ────────────────────────────────────────────
  sectionTitle("4. Retrofit Allocation");
  if (!safeGet(alloc, "total")) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No allocation data available.", 14, y); y += 8;
  } else {
    row("Kacha Buildings",      safeGet(alloc, "kacha",      "—") ?? "—");
    row("Semi-Pacca Buildings", safeGet(alloc, "semi_pacca", "—") ?? "—");
    row("Pacca Buildings",      safeGet(alloc, "pacca",      "—") ?? "—");
    row("Total Retrofitted",    safeGet(alloc, "total",      "—") ?? "—", GRAY, BLUE);
  }
  divider();

  // ── 5. Budget Breakdown ───────────────────────────────────────────────
  sectionTitle("5. Budget Breakdown");
  if (!safeGet(budget, "grand_total")) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No budget data available.", 14, y); y += 8;
  } else {
    const bItems = [
      ["Kacha Retrofit",      "kacha"],
      ["Semi-Pacca Retrofit", "semi_pacca"],
      ["Pacca Retrofit",      "pacca"],
      ["Engineering",         "engineering"],
      ["Quality Control",     "quality_control"],
      ["Community Awareness", "awareness"],
    ];
    bItems.forEach(([label, key]) => {
      const v = safeGet(budget, key, 0);
      if (safeNum(v) > 0) row(label, `PKR ${formatPKR(safeNum(v))}`);
    });
    row("Grand Total", `PKR ${formatPKR(safeNum(safeGet(budget, "grand_total", 0)))}`, GRAY, GREEN);
  }
  divider();

  // ── 6. Risk Reduction ─────────────────────────────────────────────────
  sectionTitle("6. Risk Reduction");
  row("Current Risk",        `${safeGet(impact, "current_risk_percent",  0) || 0}%`,       GRAY, RED);
  row("Target Risk",         `${safeGet(impact, "target_risk_percent",   0) || 0}%`,       GRAY, GREEN);
  row("Risk Reduction",      `${safeGet(impact, "risk_reduction_points", 0) || 0} points`, GRAY, GREEN);
  y += 2;
  subLabel("Lives Saved by Building Type");
  row("  Kacha",     safeGet(impact, "lives_saved_kacha", "—") ?? "—");
  row("  Semi-Pacca",safeGet(impact, "lives_saved_semi",  "—") ?? "—");
  row("  Pacca",     safeGet(impact, "lives_saved_pacca", "—") ?? "—");
  row("  Total",     safeGet(impact, "total_lives_saved", "—") ?? "—", GRAY, GREEN);

  if (safeGet(impact, "risk_explanation")) {
    y += 2;
    prose("Analysis:", impact.risk_explanation);
  }
  divider();

  // ── 7. Implementation Phases ──────────────────────────────────────────
  sectionTitle("7. Implementation Phases");
  const phases = safeGet(tl, "phases", null);
  if (!phases) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No phase data available.", 14, y); y += 8;
  } else {
    [
      [safeGet(phases, "phase1_months"), safeGet(phases, "phase1_label"), safeGet(phases, "phase1_buildings"), "Phase 1"],
      [safeGet(phases, "phase2_months"), safeGet(phases, "phase2_label"), safeGet(phases, "phase2_buildings"), "Phase 2"],
      [safeGet(phases, "phase3_months"), safeGet(phases, "phase3_label"), safeGet(phases, "phase3_buildings"), "Phase 3"],
    ].forEach(([months, label, buildings, name]) => {
      if (!months && !label) return;
      row(`${name}  (${months || "?"}mo)`, label || "—");
      if (buildings != null) {
        doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
        doc.text(`  ${buildings} buildings`, 20, y); y += 6;
        doc.setTextColor(...DARK);
      }
      y += 1;
    });
    const totalMo = safeGet(tl, "total_months", 0);
    if (safeNum(totalMo) > 0) row("Total Duration", `${totalMo} months`, GRAY, BLUE);
  }
  divider();

  // ── 8. Risk Assessment Summary ────────────────────────────────────────
  sectionTitle("8. Risk Assessment Summary");
  const riskSummary = reportData?.risk_assessment_summary || [];
  if (riskSummary.length === 0) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No summary data available.", 14, y); y += 8;
  } else {
    riskSummary.forEach((r, i) => listItem(i + 1, r, PURPLE));
  }
  divider();

  // ── 9. Policy Recommendations ─────────────────────────────────────────
  sectionTitle("9. Policy Recommendations");
  const actions = reportData?.action_recommendations || [];
  if (actions.length === 0) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("No recommendations available.", 14, y); y += 8;
  } else {
    let recNum = 0;
    actions.forEach(a => {
      const clean = stripMd(String(a));
      if (!clean) return;
      const isHeading = /^[A-Z0-9][A-Z0-9\s\-–—:()/]*$/.test(clean) && clean.length < 80;
      if (isHeading) {
        checkPage(10);
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...PURPLE);
        doc.text(clean, 14, y); y += 8; doc.setTextColor(...DARK);
      } else {
        recNum++;
        listItem(recNum, a, GREEN);
      }
    });
  }
  divider();

  // ── 10. Full Detailed Report ──────────────────────────────────────────
  if (reportData?.full_detailed_report) {
    sectionTitle("10. Full Detailed Report");
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
    doc.text("QuakeVision AI  •  Urban Action Plan  •  Confidential — Government Use", 14, 291);
    doc.text(`Page ${i} of ${total}`, W - 28, 291);
  }

  doc.save(`UrbanPlan_${(sectorName || "Report").replace(/\s+/g, "_")}_Mw${mag}.pdf`);
}