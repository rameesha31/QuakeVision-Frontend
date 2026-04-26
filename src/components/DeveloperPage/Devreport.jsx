// Devreport.js - Developer Feasibility Report Generator

export async function Devreport(reportData) {
  if (!reportData) {
    alert("No report data available.");
    return;
  }

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const PAGE_WIDTH    = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT   = doc.internal.pageSize.getHeight();
  const LEFT_MARGIN   = 15;
  const RIGHT_MARGIN  = PAGE_WIDTH - 15;
  const CONTENT_WIDTH = RIGHT_MARGIN - LEFT_MARGIN;

  let y = 25;
  let pageNum = 1;

  function checkPage(needed = 15) {
    if (y + needed > PAGE_HEIGHT - 20) {
      doc.addPage(); pageNum++; y = 25; return true;
    }
    return false;
  }

  function cleanMarkdown(text) {
    if (!text) return "";
    let s = String(text);
    s = s.replace(/\*\*/g, ""); s = s.replace(/\*/g, "");
    s = s.replace(/__/g, "");   s = s.replace(/(?<!\w)_(?!\w)/g, "");
    s = s.replace(/`/g, "");    s = s.replace(/\\/g, "");
    s = s.replace(/\s+/g, " "); s = s.replace(/\s+\./g, ".");
    s = s.replace(/\s+,/g, ",");
    return s.trim();
  }

  function isTableRow(line) {
    return line.trim().startsWith("|") && line.trim().endsWith("|");
  }

  function isSeparatorRow(line) {
    return /^\|[\s\-|:]+\|$/.test(line.trim());
  }

  function parseMarkdownTable(tableLines) {
    const dataLines = tableLines.filter(l => !isSeparatorRow(l));
    const parsed = dataLines.map(line =>
      line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cleanMarkdown(cell.trim()))
    );
    if (parsed.length === 0) return null;
    return { headers: parsed[0], rows: parsed.slice(1) };
  }

  function drawCard(title, contentLines, bulletItems) {
    const CORNER      = 3;
    const INNER_WIDTH = CONTENT_WIDTH - 12;
    const HEADER_H    = 9;
    const TEXT_PAD_Y  = 6;
    const LINE_H      = 5;
    const BULLET_GAP  = 3;
    const CARD_PAD_B  = 6;

    const measuredContent = [];
    if (contentLines && contentLines.length > 0) {
      for (const line of contentLines) {
        if (!line || !line.trim()) continue;
        measuredContent.push(doc.splitTextToSize(String(line), INNER_WIDTH));
      }
    }
    const measuredBullets = [];
    if (bulletItems && bulletItems.length > 0) {
      for (const item of bulletItems) {
        if (!item || !item.trim()) continue;
        const clean = cleanMarkdown(item);
        if (clean.length < 3) continue;
        measuredBullets.push(doc.splitTextToSize(clean, INNER_WIDTH - 8));
      }
    }

    let innerH = 0;
    for (const lines of measuredContent) innerH += lines.length * LINE_H + 1;
    if (measuredContent.length > 0) innerH += 2;
    for (const lines of measuredBullets) innerH += lines.length * LINE_H + BULLET_GAP;
    const totalCardH = HEADER_H + TEXT_PAD_Y + innerH + CARD_PAD_B;

    if (totalCardH <= PAGE_HEIGHT - 40) { checkPage(totalCardH); } else { checkPage(HEADER_H + 20); }

    const cardTop = y;
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(220, 220, 230);
    doc.roundedRect(LEFT_MARGIN - 2, cardTop, CONTENT_WIDTH + 4, totalCardH, CORNER, CORNER, "FD");
    doc.setFillColor(107, 70, 193);
    doc.roundedRect(LEFT_MARGIN - 2, cardTop, CONTENT_WIDTH + 4, HEADER_H, CORNER, CORNER, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(title, LEFT_MARGIN + 2, cardTop + 6);
    doc.setDrawColor(220, 220, 230);
    doc.line(LEFT_MARGIN, cardTop + HEADER_H, RIGHT_MARGIN, cardTop + HEADER_H);

    y = cardTop + HEADER_H + TEXT_PAD_Y;
    doc.setTextColor(30, 30, 50); doc.setFont("helvetica", "normal"); doc.setFontSize(9);

    for (const wrappedLines of measuredContent) {
      for (const line of wrappedLines) {
        if (y + LINE_H > PAGE_HEIGHT - 20) {
          doc.addPage(); pageNum++; y = 25;
          doc.setFillColor(107, 70, 193);
          doc.roundedRect(LEFT_MARGIN - 2, y, CONTENT_WIDTH + 4, HEADER_H, CORNER, CORNER, "F");
          doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
          doc.text(title + " (cont.)", LEFT_MARGIN + 2, y + 6);
          doc.setFillColor(250, 250, 252); doc.setDrawColor(220, 220, 230);
          doc.roundedRect(LEFT_MARGIN - 2, y, CONTENT_WIDTH + 4, PAGE_HEIGHT - y - 22, CORNER, CORNER, "FD");
          y += HEADER_H + TEXT_PAD_Y;
          doc.setTextColor(30, 30, 50); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        }
        doc.text(line, LEFT_MARGIN + 4, y); y += LINE_H;
      }
    }
    if (measuredContent.length > 0) y += 2;

    for (const wrappedLines of measuredBullets) {
      const itemH = wrappedLines.length * LINE_H + BULLET_GAP;
      if (y + itemH > PAGE_HEIGHT - 20) {
        doc.addPage(); pageNum++; y = 25;
        doc.setFillColor(107, 70, 193);
        doc.roundedRect(LEFT_MARGIN - 2, y, CONTENT_WIDTH + 4, HEADER_H, CORNER, CORNER, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text(title + " (cont.)", LEFT_MARGIN + 2, y + 6);
        doc.setFillColor(250, 250, 252); doc.setDrawColor(220, 220, 230);
        doc.roundedRect(LEFT_MARGIN - 2, y, CONTENT_WIDTH + 4, PAGE_HEIGHT - y - 22, CORNER, CORNER, "FD");
        y += HEADER_H + TEXT_PAD_Y;
      }
      doc.setFillColor(107, 70, 193);
      doc.circle(LEFT_MARGIN + 5, y - 1, 1.2, "F");
      doc.setTextColor(30, 30, 50); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      wrappedLines.forEach((line, idx) => { doc.text(line, LEFT_MARGIN + 10, y + idx * LINE_H); });
      y += wrappedLines.length * LINE_H + BULLET_GAP;
    }
    y += CARD_PAD_B;
  }

  function sectionTitle(text) {
    checkPage(12);
    doc.setFillColor(107, 70, 193);
    doc.rect(0, y - 4, PAGE_WIDTH, 8, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(text.toUpperCase(), LEFT_MARGIN, y);
    y += 8; doc.setTextColor(30, 30, 50);
  }

  function row(label, value, valueColorHex) {
    checkPage(8);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 120);
    doc.text(label + ":", LEFT_MARGIN, y);
    doc.setTextColor(valueColorHex || "#1e1e32"); doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(String(value || "—"), CONTENT_WIDTH - 55);
    lines.forEach((l) => { checkPage(6); doc.text(l, LEFT_MARGIN + 55, y); y += 5; });
    y += 2;
  }

  function drawTable(headers, rows, columnWidths) {
    if (!rows || rows.length === 0) return;
    const colWidths = columnWidths || Array(headers.length).fill(CONTENT_WIDTH / headers.length);
    checkPage(15 + rows.length * 8);
    let cx = LEFT_MARGIN;
    doc.setFillColor(107, 70, 193);
    doc.rect(LEFT_MARGIN - 2, y - 5, CONTENT_WIDTH + 4, 8, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => { doc.text(h, cx + 2, y); cx += colWidths[i]; });
    y += 6;
    doc.setTextColor(30, 30, 50); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    rows.forEach((rowData, ri) => {
      cx = LEFT_MARGIN;
      const rowLines = rowData.map((cell, i) => doc.splitTextToSize(String(cell || "—"), colWidths[i] - 4));
      const maxH = Math.max(5, ...rowLines.map(l => l.length * 4));
      checkPage(maxH + 5);
      if (ri % 2 === 1) { doc.setFillColor(245, 245, 250); doc.rect(LEFT_MARGIN - 2, y - 4, CONTENT_WIDTH + 4, maxH, "F"); }
      rowData.forEach((cell, i) => {
        doc.setFont("helvetica", i === 0 ? "bold" : "normal");
        rowLines[i].forEach((line, li) => doc.text(line, cx + 2, y + li * 4));
        cx += colWidths[i];
      });
      y += maxH + 2;
    });
    y += 4;
  }

  function paragraph(text, isBold) {
    if (!text) return;
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    checkPage(lines.length * 5);
    doc.setFont("helvetica", isBold ? "bold" : "normal"); doc.setFontSize(9); doc.setTextColor(30, 30, 50);
    lines.forEach(l => { doc.text(l, LEFT_MARGIN, y); y += 5; });
    y += 3;
  }

  function divider() {
    checkPage(5);
    doc.setDrawColor(220, 220, 230);
    doc.line(LEFT_MARGIN, y, RIGHT_MARGIN, y);
    y += 6;
  }

  // ── Render full_detailed_report — ALL sections, with markdown table support ──
  // Mirrors Govreport.js renderDetailedReport exactly
  function renderDetailedReport(reportText) {
    if (!reportText) return;

    const rawLines = reportText.split("\n");
    let curSection = null;
    let curContent = [];
    let curBullets = [];
    let tableBuffer = [];
    let inTable = false;

    function flushTable() {
      if (tableBuffer.length === 0) return;
      const parsed = parseMarkdownTable(tableBuffer);
      if (parsed && parsed.headers.length > 0 && parsed.rows.length > 0) {
        const colW = Array(parsed.headers.length).fill(CONTENT_WIDTH / parsed.headers.length);
        drawTable(parsed.headers, parsed.rows, colW);
      }
      tableBuffer = [];
      inTable = false;
    }

    function flushSection() {
      flushTable();
      if (!curSection) { curContent = []; curBullets = []; return; }
      if (curContent.length > 0 || curBullets.length > 0) {
        drawCard(curSection, curContent.length ? curContent : null, curBullets.length ? curBullets : null);
      }
      curContent = []; curBullets = [];
    }

    for (const line of rawLines) {
      const trimmed = line.trim();

      if (!trimmed) {
        if (inTable) flushTable();
        continue;
      }

      if (trimmed.match(/^#{1,3}\s/)) {
        flushSection();
        curSection = cleanMarkdown(trimmed.replace(/^#+\s*/, ""));
        continue;
      }

      // If no section heading seen yet, treat entire content as one section
      if (!curSection) {
        curSection = "Detailed Report";
      }

      if (isTableRow(trimmed)) {
        if ((curContent.length > 0 || curBullets.length > 0) && !inTable) {
          drawCard(curSection, curContent.length ? curContent : null, curBullets.length ? curBullets : null);
          curContent = []; curBullets = [];
        }
        inTable = true;
        if (!isSeparatorRow(trimmed)) {
          tableBuffer.push(trimmed);
        }
        continue;
      }

      if (inTable) flushTable();

      const clean = cleanMarkdown(trimmed);
      if (!clean) continue;

      if (trimmed.match(/^[\-\*•]\s/) || trimmed.match(/^\d+\.\s/)) {
        const bt = cleanMarkdown(trimmed.replace(/^[\-\*•\d+\.\s]+/, ""));
        if (bt.length > 3) curBullets.push(bt);
      } else {
        const sentences = clean.split(/(?<=\.)\s+/);
        for (let s of sentences) {
          s = s.trim();
          if (s.length > 5) {
            if (!s.endsWith(".") && !s.endsWith(":")) s += ".";
            curContent.push(s);
          }
        }
      }
    }

    flushSection();
  }

  // ── Data extraction ──────────────────────────────────────────────────────
  const viz   = reportData.visualization_data || {};
  const proj  = viz.project_info  || {};
  const risk  = viz.risk_metrics  || {};
  const dec   = viz.decision      || {};
  const costs = viz.costs         || {};
  const tl    = viz.timeline      || {};
  const roi   = viz.roi           || {};
  const meta  = reportData.metadata || {};

  const formatPKR = n => {
    if (!n && n !== 0) return "—";
    if (n >= 1e9) return `PKR ${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `PKR ${(n / 1e6).toFixed(0)}M`;
    if (n >= 1e3) return `PKR ${(n / 1e3).toFixed(0)}K`;
    return `PKR ${n.toLocaleString()}`;
  };

  // ── COVER PAGE ───────────────────────────────────────────────────────────
  doc.setFillColor(107, 70, 193);
  doc.rect(0, 0, PAGE_WIDTH, 45, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("Developer Feasibility Report", LEFT_MARGIN, 17);
  doc.setFontSize(12); doc.setFont("helvetica", "normal");
  doc.text(`${proj.site || "Site"} • ${proj.project_type || "Project"} • ${meta.building_class || ""}`, LEFT_MARGIN, 27);
  doc.setFontSize(10);
  doc.text(`${(proj.total_sqft || 0).toLocaleString()} sq ft • ${proj.floors || "—"} floors • Mw ${meta.target_magnitude || "—"} design`, LEFT_MARGIN, 35);
  const verdictColor = (dec.verdict === "GO") ? [16, 185, 129] : [220, 53, 69];
  doc.setFillColor(...verdictColor);
  doc.roundedRect(PAGE_WIDTH - 45, 10, 35, 8, 2, 2, "F");
  doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
  doc.text(dec.verdict || "—", PAGE_WIDTH - 32, 16);
  doc.setFontSize(7); doc.setTextColor(200, 190, 230); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE_WIDTH - 60, 40);
  y = 55;

  // ── 1. DECISION OVERVIEW ─────────────────────────────────────────────────
  sectionTitle("1. Decision Overview");
  const overviewCards = [
    { label: "Verdict",              value: dec.verdict || "—",                                   color: dec.verdict === "GO" ? "#10b981" : "#dc3545" },
    { label: "Survival Probability", value: `${risk.survival_probability || 0}%`,                 color: "#6b46c1" },
    { label: "Damage Risk",          value: `${risk.damage_risk_percent  || 0}%`,                 color: "#f59e0b" },
    { label: "Risk Level",           value: risk.risk_level || "—",                               color: "#1e1e32" },
    { label: "Total Project Cost",   value: formatPKR(costs.total_project_cost),                  color: "#1e1e32" },
    { label: "Payback Period",       value: roi.payback_years ? `${roi.payback_years} yrs` : "—", color: "#10b981" },
  ];
  let cardX = LEFT_MARGIN;
  overviewCards.forEach((card, idx) => {
    if (idx % 2 === 0 && idx > 0) { y += 15; cardX = LEFT_MARGIN; }
    checkPage(15);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(cardX, y - 5, (CONTENT_WIDTH / 2) - 5, 12, 2, 2, "F");
    doc.setFontSize(8); doc.setTextColor(100, 100, 120); doc.setFont("helvetica", "normal");
    doc.text(card.label, cardX + 3, y);
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(card.color);
    doc.text(String(card.value), cardX + 3, y + 5);
    cardX += (CONTENT_WIDTH / 2);
  });
  y += 18;
  if (dec.conditions && dec.conditions.length > 0) {
    drawCard("GO Conditions", null, dec.conditions.map(c => cleanMarkdown(c)));
  }
  divider();

  // ── 2. PROJECT PARAMETERS ────────────────────────────────────────────────
  sectionTitle("2. Project Parameters");
  row("Site",                proj.site);
  row("Project Type",        proj.project_type);
  row("Building Type",       proj.building_type);
  row("Building Class",      meta.building_class);
  row("Project Name",        meta.project_name);
  row("Total Area",          `${(proj.total_sqft || 0).toLocaleString()} sq ft`);
  row("Floors",              String(proj.floors || "—"));
  row("Budget Level",        proj.budget_level);
  row("Timeline",            `${proj.timeline_months || "—"} months`);
  row("Target Magnitude",    `Mw ${meta.target_magnitude || "—"}`);
  row("Structural Material", meta.normalized_material);
  divider();

  // ── 3. SEISMIC RISK METRICS ──────────────────────────────────────────────
  sectionTitle("3. Seismic Risk Metrics");
  row("Survival Probability", `${risk.survival_probability || 0}%`, "#10b981");
  row("Damage Risk",          `${risk.damage_risk_percent  || 0}%`, "#dc3545");
  row("Risk Level",           risk.risk_level || "—");
  y += 3;
  if (meta.risk_scores && Object.keys(meta.risk_scores).length > 0) {
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(107, 70, 193);
    doc.text("Risk Scores by Material Type:", LEFT_MARGIN, y); y += 6;
    drawTable(
      ["Material", "Risk Score (%)"],
      Object.entries(meta.risk_scores).map(([k, v]) => [k, `${v}%`]),
      [CONTENT_WIDTH * 0.7, CONTENT_WIDTH * 0.3]
    );
  }
  divider();

  // ── 4. COST BREAKDOWN ────────────────────────────────────────────────────
  sectionTitle("4. Cost Breakdown");
  const baseTotal      = (costs.base_construction_psf || 0) * (proj.total_sqft || 0);
  const contingencyAmt = Math.round((costs.total_project_cost || 0) * ((costs.contingency_percent || 0) / 100));
  drawTable(
    ["Line Item", "Amount"],
    [
      ["Base Construction",                              formatPKR(baseTotal)],
      ["Seismic Upgrade",                                formatPKR(costs.seismic_upgrade_total)],
      [`Contingency (${costs.contingency_percent || 0}%)`, formatPKR(contingencyAmt)],
      ["Total Project Cost",                             formatPKR(costs.total_project_cost)],
    ],
    [CONTENT_WIDTH * 0.7, CONTENT_WIDTH * 0.3]
  );
  row("Base Cost per sq ft",       `PKR ${(costs.base_construction_psf || 0).toLocaleString()}`);
  row("Seismic Premium per sq ft", `PKR ${(costs.seismic_premium_psf   || 0).toLocaleString()}`);
  divider();

  // ── 5. ROI ANALYSIS ──────────────────────────────────────────────────────
  sectionTitle("5. ROI Analysis");
  row("Payback Period",             roi.payback_years            ? `${roi.payback_years} years`            : "—", "#10b981");
  row("Insurance Savings",          roi.insurance_savings_percent ? `${roi.insurance_savings_percent}%`    : "—");
  row("Resale Premium",             roi.resale_premium_percent    ? `${roi.resale_premium_percent}%`       : "—");
  row("Seismic Upgrade Investment", formatPKR(costs.seismic_upgrade_total));
  divider();

  // ── 6. IMPLEMENTATION TIMELINE ───────────────────────────────────────────
  sectionTitle("6. Implementation Timeline");
  if (tl.phases && Object.keys(tl.phases).length > 0) {
    drawTable(
      ["Phase", "Duration"],
      Object.entries(tl.phases).map(([phase, months]) => [
        phase.charAt(0).toUpperCase() + phase.slice(1), `${months} months`
      ]),
      [CONTENT_WIDTH * 0.7, CONTENT_WIDTH * 0.3]
    );
    row("Total Duration", `${tl.total_months || "—"} months`);
  } else {
    paragraph("No timeline phase data available.");
  }
  divider();

  // ── 7. RISK ASSESSMENT SUMMARY ───────────────────────────────────────────
  sectionTitle("7. Risk Assessment Summary");
  if (reportData.risk_assessment_summary && reportData.risk_assessment_summary.length > 0) {
    drawCard("Risk Assessment Summary", null,
      reportData.risk_assessment_summary.map(i => cleanMarkdown(i)).filter(i => i.length > 3));
  } else {
    drawCard("Risk Assessment Summary", ["No risk assessment summary available."]);
  }
  y += 5;

  // ── 8. ACTION RECOMMENDATIONS ────────────────────────────────────────────
  sectionTitle("8. Action Recommendations");
  if (reportData.action_recommendations && reportData.action_recommendations.length > 0) {
    drawCard("Action Recommendations", null,
      reportData.action_recommendations.map(i => cleanMarkdown(i)).filter(i => i.length > 3));
  } else {
    drawCard("Action Recommendations", ["No action recommendations available."]);
  }
  y += 5;

  // ── 9. DETAILED REPORT — mirrors Gov section 10 exactly ──────────────────
  // Pull from top-level field first, then fallback to nested locations
  const detailedReportText =
    reportData.full_detailed_report ||
    reportData.detailed_report ||
    viz.full_detailed_report ||
    "";

  sectionTitle("9. Detailed Report");
  if (detailedReportText && detailedReportText.trim().length > 0) {
    renderDetailedReport(detailedReportText);
  } else {
    drawCard("Detailed Report", ["No detailed report content available."]);
  }
  divider();

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, PAGE_HEIGHT - 15, PAGE_WIDTH, 12, "F");
    doc.setTextColor(120, 120, 140);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("QuakeVision AI  •  Developer Feasibility Report  •  Confidential", LEFT_MARGIN, PAGE_HEIGHT - 8);
    doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - 25, PAGE_HEIGHT - 8);
  }

  const siteName = (proj.site || meta.project_name || "Report").replace(/\s+/g, "_");
  const filename = `DevReport_${siteName}_Mw${meta.target_magnitude || ""}.pdf`;
  doc.save(filename);
}