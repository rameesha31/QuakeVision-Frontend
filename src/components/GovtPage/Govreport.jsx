// ── downloadGovReport.js ──────────────────────────────────────────────────
// Import: import { downloadGovReport } from "./downloadGovReport";

function formatPKR(n) {
  n = Math.round(n);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

function capFirst(s) {
  return String(s).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function stripMd(text) {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\|/g, " · ")
    .replace(/^[-•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s{2,}/g, " ")
    .replace(/·\s*·/g, "·")
    .trim();
}

export async function Govreport(reportData) {
  if (!reportData) return alert("No report data available.");
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const W   = doc.internal.pageSize.getWidth();
  let y     = 0;

  const PURPLE_C = [107, 70, 193];
  const DARK     = [30, 30, 50];
  const GRAY     = [120, 120, 140];
  const LIGHT    = [245, 245, 250];
  const WHITE    = [255, 255, 255];
  const RED      = [220, 53, 69];
  const AMBER    = [245, 158, 11];
  const GREEN    = [16, 185, 129];

  const checkPage = (n = 12) => {
    if (y + n > 275) { doc.addPage(); y = 20; }
  };

  const sectionTitle = (t) => {
    checkPage(16);
    doc.setFillColor(...PURPLE_C);
    doc.rect(0, y, W, 8, "F");
    doc.setTextColor(...WHITE); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(t.toUpperCase(), 14, y + 5.5);
    y += 13; doc.setTextColor(...DARK);
  };

  const row = (label, value, lc = GRAY, vc = DARK) => {
    checkPage(10);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.setTextColor(...lc); doc.text(label, 14, y);
    doc.setTextColor(...vc); doc.setFont("helvetica", "bold");
    doc.text(String(value ?? "—"), 90, y);
    y += 7;
  };

  const divider = () => {
    checkPage(6);
    doc.setDrawColor(220, 220, 230);
    doc.line(14, y, W - 14, y);
    y += 5;
  };

  const wrappedText = (text, x, maxW, lh = 6) => {
    const clean = stripMd(text);
    if (!clean) return;
    doc.splitTextToSize(clean, maxW).forEach(line => {
      checkPage(lh + 2); doc.text(line, x, y); y += lh;
    });
  };

  const listItem = (num, text, circleColor = PURPLE_C) => {
    const clean = stripMd(text);
    if (!clean) return;
    checkPage(14);
    doc.setFillColor(...circleColor); doc.circle(18, y - 2, 2.5, "F");
    doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text(String(num), num < 10 ? 17 : 16, y - 0.5);
    doc.setTextColor(...DARK); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.splitTextToSize(clean, W - 40).forEach(line => {
      checkPage(7); doc.text(line, 26, y); y += 6;
    });
    y += 1;
  };

  const viz    = reportData?.visualization_data || {};
  const proj   = viz.project_info   || {};
  const stock  = viz.building_stock || {};
  const alloc  = viz.allocation     || {};
  const budget = viz.budget_pkr     || {};
  const impact = viz.impact         || {};
  const tl     = viz.timeline       || {};

  // ── Cover ──────────────────────────────────────────────────────────────
  doc.setFillColor(...PURPLE_C); doc.rect(0, 0, W, 44, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("Urban Action Plan", 14, 18);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(
    `${proj.sector_name || "—"}  •  ${proj.city || "Islamabad"}  •  Mw ${proj.magnitude || "—"}`,
    14, 28
  );
  doc.text(
    `${(proj.retrofit_capacity || 0).toLocaleString()} of ${(proj.total_buildings || 0).toLocaleString()} buildings  •  ${(proj.population || 0).toLocaleString()} population`,
    14, 36
  );
  doc.setFillColor(...AMBER);
  doc.roundedRect(W - 52, 6, 38, 10, 2, 2, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  doc.text("GOV REPORT", W - 50, 12.5);
  doc.setTextColor(200, 190, 230); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 72, 40);
  y = 52;

  // ── 1. Impact Summary ─────────────────────────────────────────────────
  sectionTitle("1. Impact Summary");
  row("Lives Saved",           impact.total_lives_saved ?? "—",              GRAY, [...GREEN]);
  row("Buildings Retrofitted", `${proj.retrofit_capacity || "—"} of ${proj.total_buildings || "—"}`);
  row("Total Budget",          `PKR ${formatPKR(budget.grand_total || 0)}`,  GRAY, [...AMBER]);
  row("Benefit-Cost Ratio",    `${impact.benefit_cost_ratio ?? "—"}x`,       GRAY, [...PURPLE_C]);
  row("Economic Benefit",      `PKR ${impact.economic_benefit_millions ?? "—"}M`);
  divider();

  // ── 2. Project Parameters ─────────────────────────────────────────────
  sectionTitle("2. Project Parameters");
  row("Sector",            proj.sector_name    || "—");
  row("City",              proj.city           || "Islamabad");
  row("Magnitude",         `Mw ${proj.magnitude || "—"}`);
  row("Budget Level",      capFirst(proj.budget_level || ""));
  row("Timeline",          `${proj.timeline_months || "—"} months`);
  row("Priority Metric",   proj.priority_metric  || "—");
  row("Retrofit Style",    proj.retrofit_style   || "—");
  row("Avg Building Sqft", `${(proj.avg_building_sqft || 0).toLocaleString()} sq ft`);
  row("Population",        (proj.population || 0).toLocaleString());
  divider();

  // ── 3. Building Stock ─────────────────────────────────────────────────
  sectionTitle("3. Building Stock");
  row("Kacha (Adobe & Rubble Stone)", `${stock.kacha_percent || 0}%`);
  row("Semi-Pacca (URM)",             `${stock.semi_pacca_percent || 0}%`);
  row("Pacca (RCF/RCI)",              `${stock.pacca_percent || 0}%`);
  divider();

  // ── 4. Retrofit Allocation ────────────────────────────────────────────
  sectionTitle("4. Retrofit Allocation");
  row("Kacha Buildings",      alloc.kacha      ?? "—");
  row("Semi-Pacca Buildings", alloc.semi_pacca ?? "—");
  row("Pacca Buildings",      alloc.pacca      ?? "—");
  row("Total Retrofitted",    alloc.total      ?? "—", GRAY, [...PURPLE_C]);
  divider();

  // ── 5. Budget Breakdown ───────────────────────────────────────────────
  sectionTitle("5. Budget Breakdown");
  row("Kacha Retrofit",      `PKR ${formatPKR(budget.kacha       || 0)}`);
  row("Semi-Pacca Retrofit", `PKR ${formatPKR(budget.semi_pacca  || 0)}`);
  row("Pacca Retrofit",      `PKR ${formatPKR(budget.pacca       || 0)}`);
  row("Engineering",         `PKR ${formatPKR(budget.engineering || 0)}`);
  row("Quality Control",     `PKR ${formatPKR(budget.quality_control || 0)}`);
  row("Community Awareness", `PKR ${formatPKR(budget.awareness   || 0)}`);
  row("Grand Total",         `PKR ${formatPKR(budget.grand_total || 0)}`, GRAY, [...GREEN]);
  divider();

  // ── 6. Risk Reduction ────────────────────────────────────────────────
  sectionTitle("6. Risk Reduction");
  row("Current Risk",        `${impact.current_risk_percent || 0}%`,        GRAY, [...RED]);
  row("Target Risk",         `${impact.target_risk_percent  || 0}%`,        GRAY, [...GREEN]);
  row("Risk Reduction",      `${impact.risk_reduction_points || 0} points`, GRAY, [...GREEN]);
  row("Lives Saved — Kacha", impact.lives_saved_kacha ?? "—");
  row("Lives Saved — Semi",  impact.lives_saved_semi  ?? "—");
  row("Lives Saved — Pacca", impact.lives_saved_pacca ?? "—");
  row("Total Lives Saved",   impact.total_lives_saved ?? "—",               GRAY, [...GREEN]);
  divider();

  // ── 7. Implementation Phases ──────────────────────────────────────────
  sectionTitle("7. Implementation Phases");
  if (tl.phases) {
    row(`Phase 1 (${tl.phases.phase1_months}mo)`, tl.phases.phase1_label || "—");
    row("  Buildings", tl.phases.phase1_buildings ?? "—");
    y += 2;
    row(`Phase 2 (${tl.phases.phase2_months}mo)`, tl.phases.phase2_label || "—");
    row("  Buildings", tl.phases.phase2_buildings ?? "—");
    y += 2;
    row(`Phase 3 (${tl.phases.phase3_months}mo)`, tl.phases.phase3_label || "—");
    row("  Buildings", tl.phases.phase3_buildings ?? "—");
  }
  divider();

  // ── 8. Risk Assessment Summary ────────────────────────────────────────
  sectionTitle("8. Risk Assessment Summary");
  (reportData?.risk_assessment_summary || []).forEach((r, i) => {
    listItem(i + 1, r, PURPLE_C);
  });
  divider();

  // ── 9. Policy Recommendations ─────────────────────────────────────────
  sectionTitle("9. Policy Recommendations");
  let recNum = 0;
  (reportData?.action_recommendations || []).forEach((a) => {
    const clean = stripMd(a);
    if (!clean) return;
    const isHeading = /^[A-Z0-9\s\-–—:()/]+$/.test(clean) && clean.length < 100;
    if (isHeading) {
      checkPage(10);
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...PURPLE_C);
      doc.text(clean, 14, y); y += 8; doc.setTextColor(...DARK);
    } else {
      recNum += 1;
      listItem(recNum, a, GREEN);
    }
  });
  divider();

  // ── 10. Full Detailed Report ──────────────────────────────────────────
  if (reportData?.full_detailed_report) {
    sectionTitle("10. Full Detailed Report");
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
    wrappedText(reportData.full_detailed_report, 14, W - 28, 6);
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

  doc.save(`UrbanPlan_${proj.sector_name || "Report"}_Mw${proj.magnitude || ""}.pdf`);
}