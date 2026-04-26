// ── Govreport.js ──────────────────────────────────────────────────────────
// Import: import { Govreport } from "./Govreport";

export async function Govreport(reportData) {
  if (!reportData) { alert("No report data available."); return; }

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
    s = s.replace(/\*\*/g, "");
    s = s.replace(/\*/g, "");
    s = s.replace(/__/g, "");
    s = s.replace(/(?<!\w)_(?!\w)/g, "");
    s = s.replace(/`/g, "");
    s = s.replace(/\\/g, "");
    s = s.replace(/\s+/g, " ");
    s = s.replace(/\s+\./g, ".");
    s = s.replace(/\s+,/g, ",");
    return s.trim();
  }

  // ── Detect if a line is a markdown table row ─────────────────────────────
  function isTableRow(line) {
    return line.trim().startsWith("|") && line.trim().endsWith("|");
  }

  // ── Detect separator row like |---|---|--- ────────────────────────────────
  function isSeparatorRow(line) {
    return /^\|[\s\-|:]+\|$/.test(line.trim());
  }

  // ── Parse a markdown table block into headers + rows ─────────────────────
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
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(9); doc.setTextColor(30, 30, 50);
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
        // Auto-distribute column widths evenly
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

      // Blank line — flush any open table
      if (!trimmed) {
        if (inTable) flushTable();
        continue;
      }

      // Markdown heading → flush current section, start new one
      if (trimmed.match(/^#{1,3}\s/)) {
        flushSection();
        curSection = cleanMarkdown(trimmed.replace(/^#+\s*/, ""));
        continue;
      }

      // If no section heading seen yet, skip
      if (!curSection) continue;

      // Markdown table row
      if (isTableRow(trimmed)) {
        // Flush accumulated prose/bullets before starting table
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

      // Non-table line — flush any open table first
      if (inTable) flushTable();

      const clean = cleanMarkdown(trimmed);
      if (!clean) continue;

      // Bullet / numbered list
      if (trimmed.match(/^[\-\*•]\s/) || trimmed.match(/^\d+\.\s/)) {
        const bt = cleanMarkdown(trimmed.replace(/^[\-\*•\d+\.\s]+/, ""));
        if (bt.length > 3) curBullets.push(bt);
      } else {
        // Prose — split into sentences for readability
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

    flushSection(); // flush last section
  }

  // ── Data extraction ──────────────────────────────────────────────────────
  const viz    = reportData.visualization_data || {};
  const proj   = viz.project_info   || {};
  const stock  = viz.building_stock || {};
  const alloc  = viz.allocation     || {};
  const budget = viz.budget_pkr     || {};
  const impact = viz.impact         || {};
  const tl     = viz.timeline       || {};

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
  doc.setFontSize(24); doc.setFont("helvetica", "bold");
  doc.text("Urban Action Plan", LEFT_MARGIN, 18);
  doc.setFontSize(12); doc.setFont("helvetica", "normal");
  doc.text(`${proj.sector_name || "Sector"} • ${proj.city || "City"} • Mw ${proj.magnitude || "—"}`, LEFT_MARGIN, 28);
  doc.setFontSize(10);
  doc.text(`${(proj.retrofit_capacity || 0).toLocaleString()} of ${(proj.total_buildings || 0).toLocaleString()} buildings • ${(proj.population || 0).toLocaleString()} residents`, LEFT_MARGIN, 36);
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(PAGE_WIDTH - 45, 10, 35, 8, 2, 2, "F");
  doc.setFontSize(8); doc.setTextColor(255, 255, 255);
  doc.text("GOV REPORT", PAGE_WIDTH - 42, 16);
  doc.setFontSize(7); doc.setTextColor(200, 190, 230);
  doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE_WIDTH - 60, 40);
  y = 55;

  // ── 1. IMPACT SUMMARY ────────────────────────────────────────────────────
  sectionTitle("1. Impact Summary");
  const cards = [
    { label: "Lives Saved",           value: (impact.total_lives_saved || 0).toLocaleString(),                                  color: "#10b981" },
    { label: "Buildings Retrofitted", value: `${(proj.retrofit_capacity || 0).toLocaleString()} of ${(proj.total_buildings || 0).toLocaleString()}`, color: "#1e1e32" },
    { label: "Total Budget",          value: formatPKR(budget.grand_total),                                                     color: "#f59e0b" },
    { label: "Benefit-Cost Ratio",    value: impact.benefit_cost_ratio ? `${impact.benefit_cost_ratio}x` : "—",                 color: "#6b46c1" },
    { label: "Economic Benefit",      value: impact.economic_benefit_millions ? `PKR ${impact.economic_benefit_millions}M` : "—", color: "#1e1e32" },
  ];
  let cardX = LEFT_MARGIN;
  cards.forEach((card, idx) => {
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
  if (impact.summary) paragraph(impact.summary);
  divider();

  // ── 2. PROJECT PARAMETERS ────────────────────────────────────────────────
  sectionTitle("2. Project Parameters");
  row("Sector",            proj.sector_name);
  row("City",              proj.city);
  row("Magnitude",         `Mw ${proj.magnitude}`);
  row("Budget Level",      proj.budget_level);
  row("Timeline",          `${proj.timeline_months || "—"} months`);
  row("Priority Metric",   proj.priority_metric);
  row("Retrofit Style",    proj.retrofit_style);
  row("Avg Building Area", `${(proj.avg_building_sqft || 0).toLocaleString()} sq ft`);
  row("Population",        (proj.population || 0).toLocaleString());
  divider();

  // ── 3. BUILDING STOCK ────────────────────────────────────────────────────
  sectionTitle("3. Building Stock");
  drawTable(
    ["Typology", "Percentage"],
    [
      ["Kacha (Adobe & Rubble Stone)",      `${stock.kacha_percent || 0}%`],
      ["Semi-Pacca (Unreinforced Masonry)", `${stock.semi_pacca_percent || 0}%`],
      ["Pacca (Reinforced Concrete)",       `${stock.pacca_percent || 0}%`],
    ],
    [CONTENT_WIDTH * 0.7, CONTENT_WIDTH * 0.3]
  );
  if (stock.notes) paragraph(`Notes: ${stock.notes}`);
  divider();

  // ── 4. RETROFIT ALLOCATION ───────────────────────────────────────────────
  sectionTitle("4. Retrofit Allocation");
  drawTable(
    ["Building Type", "Count"],
    [
      ["Kacha Buildings",      (alloc.kacha      || 0).toLocaleString()],
      ["Semi-Pacca Buildings", (alloc.semi_pacca  || 0).toLocaleString()],
      ["Pacca Buildings",      (alloc.pacca      || 0).toLocaleString()],
      ["Total Retrofitted",    (alloc.total      || 0).toLocaleString()],
    ],
    [CONTENT_WIDTH * 0.7, CONTENT_WIDTH * 0.3]
  );
  divider();

  // ── 5. BUDGET BREAKDOWN ──────────────────────────────────────────────────
  sectionTitle("5. Budget Breakdown");
  drawTable(
    ["Line Item", "Amount"],
    [
      ["Kacha Retrofit",       formatPKR(budget.kacha)],
      ["Semi-Pacca Retrofit",  formatPKR(budget.semi_pacca)],
      ["Pacca Retrofit",       formatPKR(budget.pacca)],
      ["Engineering & Design", formatPKR(budget.engineering)],
      ["Quality Control",      formatPKR(budget.quality_control)],
      ["Community Awareness",  formatPKR(budget.awareness)],
      ["Grand Total",          formatPKR(budget.grand_total)],
    ],
    [CONTENT_WIDTH * 0.7, CONTENT_WIDTH * 0.3]
  );
  divider();

  // ── 6. RISK REDUCTION ────────────────────────────────────────────────────
  sectionTitle("6. Risk Reduction");
  row("Current Risk",   `${impact.current_risk_percent  || 0}%`, "#dc3545");
  row("Target Risk",    `${impact.target_risk_percent   || 0}%`, "#10b981");
  row("Risk Reduction", `${impact.risk_reduction_points || 0} points`, "#10b981");
  y += 3;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(107, 70, 193);
  doc.text("Lives Saved by Building Type:", LEFT_MARGIN, y); y += 6;
  drawTable(
    ["Building Type", "Lives Saved"],
    [
      ["Kacha",      (impact.lives_saved_kacha || 0).toLocaleString()],
      ["Semi-Pacca", (impact.lives_saved_semi  || 0).toLocaleString()],
      ["Pacca",      (impact.lives_saved_pacca || 0).toLocaleString()],
    ],
    [CONTENT_WIDTH * 0.7, CONTENT_WIDTH * 0.3]
  );
  if (impact.risk_explanation) paragraph(impact.risk_explanation);
  divider();

  // ── 7. IMPLEMENTATION PHASES ─────────────────────────────────────────────
  sectionTitle("7. Implementation Phases");
  if (tl.phases) {
    drawTable(
      ["Phase", "Duration", "Description", "Buildings"],
      [
        ["Phase 1", `${tl.phases.phase1_months || "?"} mo`, tl.phases.phase1_label || "—", (tl.phases.phase1_buildings || 0).toLocaleString()],
        ["Phase 2", `${tl.phases.phase2_months || "?"} mo`, tl.phases.phase2_label || "—", (tl.phases.phase2_buildings || 0).toLocaleString()],
        ["Phase 3", `${tl.phases.phase3_months || "?"} mo`, tl.phases.phase3_label || "—", (tl.phases.phase3_buildings || 0).toLocaleString()],
      ],
      [25, 25, CONTENT_WIDTH * 0.5, 30]
    );
    row("Total Duration", `${tl.total_months || "—"} months`);
  } else {
    paragraph("No phase data available.");
  }
  divider();

  // ── 8. RISK ASSESSMENT SUMMARY ───────────────────────────────────────────
  sectionTitle("8. Risk Assessment Summary");
  if (reportData.risk_assessment_summary && reportData.risk_assessment_summary.length > 0) {
    drawCard("Risk Assessment Summary", null,
      reportData.risk_assessment_summary.map(i => cleanMarkdown(i)).filter(i => i.length > 3));
  } else {
    drawCard("Risk Assessment Summary", ["No risk assessment summary available."]);
  }
  y += 5;

  // ── 9. POLICY RECOMMENDATIONS ────────────────────────────────────────────
  sectionTitle("9. Policy Recommendations");
  if (reportData.action_recommendations && reportData.action_recommendations.length > 0) {
    drawCard("Policy Recommendations", null,
      reportData.action_recommendations.map(i => cleanMarkdown(i)).filter(i => i.length > 3));
  } else {
    drawCard("Policy Recommendations", ["No policy recommendations available."]);
  }
  y += 5;

  // ── 10. DETAILED REPORT — renders ALL sections with table support ─────────
  if (reportData.full_detailed_report) {
    sectionTitle("10. Detailed Report");
    renderDetailedReport(reportData.full_detailed_report);
    divider();
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, PAGE_HEIGHT - 15, PAGE_WIDTH, 12, "F");
    doc.setTextColor(120, 120, 140);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("QuakeVision AI  •  Urban Action Plan  •  Confidential — Government Use", LEFT_MARGIN, PAGE_HEIGHT - 8);
    doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - 25, PAGE_HEIGHT - 8);
  }

  const filename = `UrbanPlan_${(proj.sector_name || "Report").replace(/\s+/g, "_")}_Mw${proj.magnitude || ""}.pdf`;
  doc.save(filename);
}