// ── downloadDevReport.js ──────────────────────────────────────────────────
// Import: import { downloadDevReport } from "./downloadDevReport";

function formatPKR(n) {
  n = Math.round(n);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "M";
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

export async function Devreport(reportData) {
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
  const BLUE     = [59, 130, 246];

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

  // Numbered list item with circle
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
  const risk   = viz.risk_assessment || {};
  const proj   = viz.project_info || {};
  const costs  = viz.cost_options || {};
  const steps  = viz.retrofit_steps || {};
  const invest = viz.investment_decision || {};

  const hazardLevel = (risk.risk_level || "").toUpperCase();
  const badgeColor  = ["SEVERE", "HIGH"].includes(hazardLevel)
    ? RED : hazardLevel === "LOW" ? GREEN : AMBER;

  const totalCost   = costs.total_project_pkr || 0;
  const baseCost    = costs.base_construction_pkr || 0;
  const seismicCost = costs.seismic_upgrade_pkr || 0;
  const contingency = costs.contingency_pkr || 0;
  const roiPayback  = costs.roi_payback_years || 0;

  // ── Cover ──────────────────────────────────────────────────────────────
  doc.setFillColor(...PURPLE_C); doc.rect(0, 0, W, 44, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("Feasibility Report", 14, 18);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(
    `${proj.project_name || "—"}  •  ${proj.site_sector || "—"}, ${proj.city || "Islamabad"}`,
    14, 28
  );
  doc.text(
    `Mw ${proj.magnitude || "—"}  •  ${((proj.total_sqft || 0) * (proj.floors || 1)).toLocaleString()} sq ft  •  ${proj.floors || "?"} floors`,
    14, 36
  );
  doc.setFillColor(...badgeColor);
  doc.roundedRect(W - 62, 6, 48, 10, 2, 2, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  doc.text(`${hazardLevel} RISK` || "UNKNOWN", W - 57, 12.5);
  doc.setTextColor(200, 190, 230); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 72, 40);
  y = 52;

  // ── 1. Investment Decision ─────────────────────────────────────────────
  sectionTitle("1. Investment Decision");
  row("Decision",   stripMd(invest.decision || "CONDITIONAL GO"), GRAY, AMBER);
  row("Risk Level", hazardLevel,                                   GRAY, badgeColor);
  row("Occupancy",  stripMd(risk.occupancy_status || "—"));
  divider();

  // ── 2. Project Information ─────────────────────────────────────────────
  sectionTitle("2. Project Information");
  row("Project Name",  proj.project_name || "—");
  row("Site / Sector", proj.site_sector  || "—");
  row("Project Type",  capFirst(proj.project_type || ""));
  row("Building Type", capFirst(proj.building_type || ""));
  row("Magnitude",     `Mw ${proj.magnitude || "—"}`);
  row("Budget Level",  capFirst(proj.budget_level || ""));
  row("Timeline",      `${proj.timeline_months || "—"} months`);
  row("Floor Plate",   `${(proj.total_sqft || 0).toLocaleString()} sq ft`);
  row("Floors",        proj.floors || "—");
  divider();

  // ── 3. Risk Assessment ─────────────────────────────────────────────────
  sectionTitle("3. Risk Assessment");
  row("Survival Probability", `${risk.survival_probability || 0}%`);
  row("Collapse Probability", `${risk.collapse_probability || 0}%`);
  divider();

  // ── 4. Cost Analysis ───────────────────────────────────────────────────
  sectionTitle("4. Cost Analysis");
  row("Base Construction",  `PKR ${formatPKR(baseCost)}`);
  row("Seismic Upgrade",    `PKR ${formatPKR(seismicCost)}`, GRAY, [...AMBER]);
  row("Contingency (5%)",   `PKR ${formatPKR(contingency)}`);
  row("Total Project Cost", `PKR ${formatPKR(totalCost)}`,   GRAY, [...BLUE]);
  y += 2;
  row("ROI Payback Period", `${roiPayback} years`);
  row("Insurance Savings",  `${costs.insurance_savings_pct || 20}%`);
  row("Resale Premium",     `+${costs.resale_premium_pct || 5}%`);
  divider();

  // ── 5. Construction Steps ─────────────────────────────────────────────
  sectionTitle("5. Construction Steps");
  Object.entries(steps).forEach(([key, s], i) => {
    row(
      `${i + 1}. ${capFirst(key)}`,
      `${s.weeks}w  •  ${s.cost_pkr > 0 ? "PKR " + formatPKR(s.cost_pkr) : "—"}`
    );
  });
  divider();

  // ── 6. Risk Assessment Summary ─────────────────────────────────────────
  sectionTitle("6. Risk Assessment Summary");
  (reportData?.risk_assessment_summary || []).forEach((r, i) => {
    listItem(i + 1, r, PURPLE_C);
  });
  divider();

  // ── 7. Action Recommendations ──────────────────────────────────────────
  sectionTitle("7. Action Recommendations");
  let actionNum = 0;
  (reportData?.action_recommendations || []).forEach((a) => {
    const clean = stripMd(a);
    if (!clean) return;
    const isHeading = /^[A-Z0-9\s\-–—:()/]+$/.test(clean) && clean.length < 100;
    if (isHeading) {
      checkPage(10);
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...PURPLE_C);
      doc.text(clean, 14, y); y += 8; doc.setTextColor(...DARK);
    } else {
      actionNum += 1;
      listItem(actionNum, a, GREEN);
    }
  });
  divider();

  // ── 8. Full Detailed Report ────────────────────────────────────────────
  if (reportData?.full_detailed_report) {
    sectionTitle("8. Full Detailed Report");
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
    doc.text("QuakeVision AI  •  Real Estate Feasibility Report  •  Confidential", 14, 291);
    doc.text(`Page ${i} of ${total}`, W - 28, 291);
  }

  doc.save(`Feasibility_${proj.project_name || "Report"}_Mw${proj.magnitude || ""}.pdf`);
}