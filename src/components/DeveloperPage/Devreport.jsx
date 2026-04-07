// ── downloadDevReport.js ──────────────────────────────────────────────────
// Import: import { Devreport } from "./downloadDevReport";

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

// Tries multiple keys in order, returns first non-null/undefined/empty hit
function pick(obj, ...keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

export async function Devreport(reportData) {
  if (!reportData) return alert("No report data available.");

  // ── DEEP DEBUG: log entire structure ─────────────────────────────────
  console.group("[DevPDF] Full reportData inspection");
  console.log("Top-level keys:", Object.keys(reportData));
  const viz = reportData?.visualization_data || {};
  console.log("visualization_data keys:", Object.keys(viz));
  Object.entries(viz).forEach(([k, v]) => {
    if (v && typeof v === "object") {
      console.log(`  viz.${k} keys:`, Object.keys(v));
      console.log(`  viz.${k} values:`, JSON.stringify(v, null, 2));
    } else {
      console.log(`  viz.${k} =`, v);
    }
  });
  console.groupEnd();

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

  // ── Pull data with FLEXIBLE KEY FALLBACKS ─────────────────────────────
  // project_info
  const proj         = pick(viz, "project_info") || {};
  const projName     = pick(proj, "project_name", "name", "site", "sector") || pick(viz, "project_name") || "—";
  const projSite     = pick(proj, "site", "sector", "site_sector", "location") || pick(viz, "site", "sector") || "—";
  const projType     = capFirst(pick(proj, "project_type", "type") || pick(viz, "project_type") || "—");
  const projBldgType = capFirst(pick(proj, "building_type", "structure_type") || "—");
  const projSqft     = safeNum(pick(proj, "total_sqft", "sqft", "floor_area") || pick(viz, "total_sqft") || 0);
  const projFloors   = pick(proj, "floors", "num_floors", "stories") || pick(viz, "floors") || "—";
  const projBudget   = capFirst(pick(proj, "budget_level", "budget") || "—");
  const projTimeline = safeNum(pick(proj, "timeline_months", "duration_months", "timeline") || 0);
  const projCity     = pick(proj, "city", "location") || pick(viz, "city") || "Islamabad";

  // risk — tries "risk_metrics", "risk_assessment", "risk"
  const riskObj  = pick(viz, "risk_metrics", "risk_assessment", "risk") || {};
  const surv     = safeNum(pick(riskObj, "survival_probability", "survival_pct", "survival") || 0);
  const dmgRisk  = safeNum(pick(riskObj, "damage_risk_percent", "damage_risk", "damage_pct") || 0);
  const collProb = safeNum(pick(riskObj, "collapse_probability", "collapse_pct", "collapse") || 0);
  const riskLvl  = String(pick(riskObj, "risk_level", "level", "hazard_level") || pick(viz, "risk_level") || "Moderate").toUpperCase();
  const occupancy= pick(riskObj, "occupancy_status", "occupancy") || null;

  // decision — tries "decision", "investment_decision"
  const decisionObj  = pick(viz, "decision", "investment_decision") || {};
  const decisionText = stripMd(pick(decisionObj, "verdict", "decision", "recommendation", "text") || "CONDITIONAL GO");
  const conditions   = Array.isArray(decisionObj.conditions)
    ? decisionObj.conditions
    : (reportData?.action_recommendations || []).slice(0, 3);
  const decisionNote = pick(decisionObj, "rationale", "note", "explanation", "summary") || null;

  // costs — tries "costs", "cost_options", "cost_analysis"
  const costsObj       = pick(viz, "costs", "cost_options", "cost_analysis", "cost_breakdown") || {};
  const totalCost      = safeNum(pick(costsObj, "total_project_cost", "total_project_pkr", "total_cost", "total") || 0);
  const seismicUpgrade = safeNum(pick(costsObj, "seismic_upgrade_total", "seismic_upgrade_pkr", "seismic_cost", "seismic_upgrade") || 0);
  const contingencyPct = safeNum(pick(costsObj, "contingency_percent", "contingency_pct") || 5);
  const contingency    = totalCost > 0 ? Math.round(totalCost * (contingencyPct / 100)) : 0;
  const baseCost       = totalCost > 0 ? Math.max(0, totalCost - seismicUpgrade - contingency) : 0;
  const baseCostPsf    = safeNum(pick(costsObj, "base_construction_psf", "base_psf", "cost_per_sqft") || 0);
  const seismicPsf     = safeNum(pick(costsObj, "seismic_premium_psf", "seismic_psf") || 0);

  // roi — tries "roi", "roi_analysis", fallback to costsObj
  const roiObj          = pick(viz, "roi", "roi_analysis", "returns") || {};
  const roiPayback      = safeNum(pick(roiObj, "payback_years", "roi_payback_years", "payback") || pick(costsObj, "roi_payback_years") || 0);
  const insuranceSavPct = safeNum(pick(roiObj, "insurance_savings_percent", "insurance_savings_pct") || pick(costsObj, "insurance_savings_pct") || 0);
  const resalePremPct   = safeNum(pick(roiObj, "resale_premium_percent", "resale_premium_pct") || pick(costsObj, "resale_premium_pct") || 0);
  const roiNote         = pick(roiObj, "summary", "note", "explanation") || null;

  // timeline — tries "timeline", "retrofit_steps", "construction_phases"
  const tlObj   = pick(viz, "timeline", "construction_timeline") || {};
  const phases  = pick(tlObj, "phases") || pick(viz, "retrofit_steps", "construction_phases") || {};
  const totalMo = safeNum(pick(tlObj, "total_months", "duration_months") || projTimeline || 0);

  // risk_scores_by_material — optional
  const scoresRaw    = pick(viz, "risk_scores_by_material", "material_risk_scores") || null;
  const scoreEntries = scoresRaw && typeof scoresRaw === "object"
    ? Object.entries(scoresRaw).filter(([, v]) => !isNaN(Number(v))).map(([k, v]) => [k, safeNum(v)])
    : [];

  // Badge color
  const rl = riskLvl;
  const bc = ["SEVERE", "HIGH", "EXTREME"].includes(rl) ? RED : rl === "LOW" ? GREEN : AMBER;

  // ── Cover ─────────────────────────────────────────────────────────────
  doc.setFillColor(...PURPLE); doc.rect(0, 0, W, 44, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("Feasibility Report", 14, 18);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`${projName}  •  ${projSite},  ${projCity}`, 14, 28);
  doc.setFillColor(...bc); doc.roundedRect(W - 54, 8, 40, 10, 2, 2, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  doc.text(rl || "UNKNOWN", W - 48, 14);
  doc.setTextColor(200, 190, 230); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 70, 40);
  y = 52;

  // ── 1. Investment Decision ────────────────────────────────────────────
  sectionTitle("1. Investment Decision");
  row("Verdict",    decisionText || "—", GRAY, AMBER);
  row("Risk Level", rl || "—",           GRAY, bc);
  if (occupancy) row("Occupancy", occupancy);
  if (conditions.length > 0) {
    y += 2;
    subLabel("Key Conditions");
    conditions.slice(0, 4).forEach((c, i) => listItem(i + 1, c, AMBER));
  }
  if (decisionNote) { y += 1; prose("Rationale:", decisionNote); }
  divider();

  // ── 2. Project Information ────────────────────────────────────────────
  sectionTitle("2. Project Information");
  row("Project Name",   projName);
  row("Site / Sector",  projSite);
  row("City",           projCity);
  row("Project Type",   projType);
  row("Building Type",  projBldgType);
  row("Budget Level",   projBudget);
  if (projTimeline > 0) row("Timeline",   `${projTimeline} months`);
  if (projSqft > 0)     row("Floor Area", `${projSqft.toLocaleString()} sq ft`);
  if (projFloors)       row("Floors",     String(projFloors));
  divider();

  // ── 3. Risk Metrics ───────────────────────────────────────────────────
  sectionTitle("3. Risk Metrics");
  if (surv > 0)     row("Survival Probability", `${surv.toFixed(1)}%`,     GRAY, GREEN);
  if (collProb > 0) row("Collapse Probability", `${collProb.toFixed(1)}%`, GRAY, RED);
  if (dmgRisk > 0)  row("Damage Risk",          `${dmgRisk.toFixed(1)}%`,  GRAY, RED);
  if (surv === 0 && collProb === 0 && dmgRisk === 0) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("Risk probability data not returned by backend.", 14, y); y += 8;
    doc.setTextColor(...DARK);
  }
  if (scoreEntries.length > 0) {
    y += 2; subLabel("Risk Scores by Material");
    scoreEntries.forEach(([k, v]) => row(`  ${capFirst(k)}`, `${v.toFixed(1)}%`));
  }
  if (pick(riskObj, "explanation", "summary", "note")) {
    y += 1;
    prose("Analysis:", pick(riskObj, "explanation", "summary", "note"));
  }
  divider();

  // ── 4. Cost Analysis ──────────────────────────────────────────────────
  sectionTitle("4. Cost Analysis");
  if (baseCost > 0) {
    row("Base Construction", `PKR ${formatPKR(baseCost)}`);
    if (baseCostPsf > 0) {
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
      doc.text(`  PKR ${baseCostPsf.toLocaleString()} per sq ft`, 20, y); y += 6;
      doc.setTextColor(...DARK);
    }
  }
  if (seismicUpgrade > 0) {
    row("Seismic Upgrade", `PKR ${formatPKR(seismicUpgrade)}`, GRAY, AMBER);
    if (seismicPsf > 0) {
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
      doc.text(`  PKR ${seismicPsf.toLocaleString()} per sq ft premium`, 20, y); y += 6;
      doc.setTextColor(...DARK);
    }
  }
  if (contingency > 0) row(`Contingency (${contingencyPct}%)`, `PKR ${formatPKR(contingency)}`);
  if (totalCost > 0)   row("Total Project Cost", `PKR ${formatPKR(totalCost)}`, GRAY, BLUE);
  if (!baseCost && !totalCost) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("Cost data not returned by backend.", 14, y); y += 8;
    doc.setTextColor(...DARK);
  }
  if (pick(costsObj, "notes", "note")) { y += 1; prose("Notes:", pick(costsObj, "notes", "note")); }
  divider();

  // ── 5. ROI Metrics ────────────────────────────────────────────────────
  sectionTitle("5. ROI Metrics");
  if (roiPayback > 0)      row("Payback Period",    `${roiPayback} years`);
  if (insuranceSavPct > 0) row("Insurance Savings", `${insuranceSavPct}%`);
  if (resalePremPct > 0)   row("Resale Premium",    `+${resalePremPct}%`);
  if (!roiPayback && !insuranceSavPct && !resalePremPct) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("ROI data not returned by backend.", 14, y); y += 8;
    doc.setTextColor(...DARK);
  }
  if (roiNote) { y += 1; prose("Summary:", roiNote); }
  divider();

  // ── 6. Implementation Timeline ────────────────────────────────────────
  sectionTitle("6. Implementation Timeline");
  const phaseEntries = typeof phases === "object"
    ? Object.entries(phases).filter(([, v]) => safeNum(v) > 0)
    : [];
  if (phaseEntries.length === 0) {
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("Timeline data not returned by backend.", 14, y); y += 8;
    doc.setTextColor(...DARK);
  } else {
    phaseEntries.forEach(([key, months], i) => {
      row(`${i + 1}.  ${capFirst(key)}`, `${safeNum(months)} months`);
    });
    if (totalMo > 0) { y += 1; row("Total Duration", `${totalMo} months`, GRAY, BLUE); }
  }
  divider();

  // ── 7. Risk Assessment Summary ────────────────────────────────────────
  const riskSummary = reportData?.risk_assessment_summary || [];
  if (riskSummary.length > 0) {
    sectionTitle("7. Risk Assessment Summary");
    riskSummary.forEach((r, i) => listItem(i + 1, r, PURPLE));
    divider();
  }

  // ── 8. Action Recommendations ─────────────────────────────────────────
  const actions = reportData?.action_recommendations || [];
  if (actions.length > 0) {
    sectionTitle("8. Action Recommendations");
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
    divider();
  }

  // ── 9. Full Detailed Report ───────────────────────────────────────────
  if (reportData?.full_detailed_report) {
    sectionTitle("9. Full Detailed Report");
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
    doc.text("QuakeVision AI  •  Real Estate Feasibility Report  •  Confidential", 14, 291);
    doc.text(`Page ${i} of ${total}`, W - 28, 291);
  }

  doc.save(`Feasibility_${(projName || "Report").replace(/\s+/g, "_")}|| ""}.pdf`);
}