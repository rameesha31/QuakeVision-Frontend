// Downloadreport.js - Homeowner Seismic Retrofit Report Generator

export async function Downloadreport(reportData) {
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

  function drawTable(headers, rows, columnWidths = null) {
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
  const viz      = reportData.visualization_data || {};
  const proj     = viz.project_info    || {};
  const risk     = viz.risk_assessment || {};
  const costOpts = viz.cost_options    || {};
  const meta     = reportData.metadata || {};

  const formatPKR = n => {
    if (!n && n !== 0) return "—";
    if (n >= 1e6) return `PKR ${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `PKR ${(n / 1e3).toFixed(0)}K`;
    return `PKR ${n.toLocaleString()}`;
  };

  // ── COVER PAGE ───────────────────────────────────────────────────────────
  doc.setFillColor(107, 70, 193);
  doc.rect(0, 0, PAGE_WIDTH, 45, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont("helvetica", "bold");
  doc.text("Home Seismic Retrofit Report", LEFT_MARGIN, 17);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  const materialName = proj.material === "RubbleStone" ? "Rubble-Stone" : proj.material || "House";
  doc.text(`${materialName} • ${proj.floors || "3"}-Storey • ${(proj.total_sqft || 6000).toLocaleString()} sq ft`, LEFT_MARGIN, 27);
  doc.setFontSize(10);
  doc.text(`Design Magnitude Mw ${proj.magnitude || meta.magnitude || "7.8"} • Budget: ${proj.budget_level || "moderate"}`, LEFT_MARGIN, 35);
  const verdict = risk.occupancy_status || "Occupy with Caution";
  const verdictColor = verdict.includes("Caution") ? [245, 158, 11] : [16, 185, 129];
  doc.setFillColor(...verdictColor);
  doc.roundedRect(PAGE_WIDTH - 55, 10, 45, 8, 2, 2, "F");
  doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
  doc.text(verdict, PAGE_WIDTH - 52, 16);
  doc.setFontSize(7); doc.setTextColor(200, 190, 230); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE_WIDTH - 60, 40);
  y = 55;

  // ── 1. RISK SUMMARY ──────────────────────────────────────────────────────
  sectionTitle("1. Risk Summary");
  const riskCards = [
    { label: "Survival Chance",      value: `${risk.survival_probability || 92}%`,         color: "#10b981" },
    { label: "Collapse Probability", value: `${risk.collapse_probability || 7.9}%`,         color: "#f59e0b" },
    { label: "Risk Level",           value: risk.risk_level || "Low",                       color: "#10b981" },
    { label: "Occupancy Status",     value: risk.occupancy_status || "Occupy with Caution", color: "#f59e0b" },
  ];
  let cardX = LEFT_MARGIN;
  riskCards.forEach((card, idx) => {
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
  drawCard("Risk Overview", [
    `In a magnitude ${proj.magnitude || meta.magnitude || "7.8"} earthquake, ${risk.survival_probability || 92}% of houses like yours would stay standing long enough for people to get out safely.`,
    `There is a ${risk.collapse_probability || 7.9}% chance of complete collapse if nothing is done.`,
    `Verdict: ${verdict} – start the retrofit as soon as possible.`,
  ]);
  divider();

  // ── 2. WHY YOUR STRUCTURE IS AT RISK ─────────────────────────────────────
  sectionTitle("2. Why Your Structure Is At Risk");
  drawCard("Structural Weaknesses", null, [
    "Irregular stone shape & voids – Stones don't bond well, cannot transfer shaking forces evenly",
    "Weak mortar bond – Traditional mortar cracks easily under lateral loads",
    "No built-in reinforcement – No steel bars to hold walls together when bending",
    "Heavy mass, low ductility – Creates high shear stresses causing sudden failure",
    "Poor connection to roof & floor slabs – Joints break apart during strong shaking",
  ]);
  divider();

  // ── 3. PROPERTY INFORMATION ──────────────────────────────────────────────
  sectionTitle("3. Property Information");
  row("Material",      proj.material     || "—");
  row("Building Type", proj.building_type ? proj.building_type.replace(/_/g, " ") : "—");
  row("Magnitude",     `Mw ${proj.magnitude || meta.magnitude || "—"}`);
  row("Budget Level",  proj.budget_level || "—");
  row("Timeline",      `${proj.timeline_months || "—"} months`);
  row("Total Area",    `${(proj.total_sqft || 0).toLocaleString()} sq ft`);
  row("Floors",        String(proj.floors || "—"));
  divider();

  // ── 4. RETROFIT ACTION PLAN ──────────────────────────────────────────────
  sectionTitle("4. Retrofit Action Plan (7 Steps)");
  drawCard("Important Note", ["All steps must be done by qualified professionals (structural engineer, licensed contractor)."]);
  y += 3;
  drawTable(
    ["Step", "What to Do", "Who Does It", "Timeline", "Cost (PKR)"],
    [
      ["1. Assessment",         "Engineer visits, draws plans, records cracks",  "Licensed structural engineer", "1-2 weeks", "15K-35K"],
      ["2. Roof-to-Wall",       "Install anchor bolts and steel plates",         "Steel-work contractor",        "1-2 weeks", "80K-120K"],
      ["3. Wall Strengthening", "Ferro-cement coat with wire mesh",              "Masonry specialist",           "2-4 weeks", "1.0M-1.5M"],
      ["4. Corner Reinf.",      "L-shaped steel angles at corners",              "Steel fabrication",            "1 week",    "80K-120K"],
      ["5. Opening Reinf.",     "RC lintels + steel frames around openings",     "Concrete contractor",          "1 week",    "200K-300K"],
      ["6. Foundation",         "RC grade beam + drainage",                      "Foundation contractor",        "2-3 weeks", "300K-500K"],
      ["7. Inspection",         "Load test + safety certificate",                "Structural engineer",          "1 week",    "10K-25K"],
    ],
    [28, 48, 34, 20, 25]
  );
  divider();

  // ── 5. COST ESTIMATES ────────────────────────────────────────────────────
  sectionTitle("5. Cost Estimates (PKR)");
  drawTable(
    ["Option", "What's Included", "Cost Range", "Duration"],
    [
      ["Basic Retrofit",    "Life-Safety Only",  costOpts.basic?.range_str         || "450K-720K",  `${costOpts.basic?.weeks         || 6}  weeks`],
      ["Standard Retrofit", "Full Protection",   costOpts.standard?.range_str      || "900K-1.8M",  `${costOpts.standard?.weeks      || 10} weeks`],
      ["Comprehensive",     "Maximum Safety",    costOpts.comprehensive?.range_str || "1.8M-2.7M",  `${costOpts.comprehensive?.weeks || 16} weeks`],
    ],
    [35, 55, 35, 25]
  );
  drawCard("Recommendation", [
    "Standard Retrofit for moderate budget gives complete wall strengthening, opening reinforcement, and foundation tie-in.",
    "Add 15% contingency for unexpected stone loss, extra grout, or labor delays.",
  ]);
  divider();

  // ── 6. SAFETY RULES ──────────────────────────────────────────────────────
  sectionTitle("6. Safety Rules");
  drawCard("5 Things to Do Before Starting Work", null, [
    "Move family to temporary safe place while structural work is in progress",
    "Remove heavy furniture and appliances from walls being worked on",
    "Photograph every existing crack and leaning wall – keep a dated record",
    "Obtain at least three written quotes from licensed contractors",
    "Verify each contractor's license with Pakistan Engineering Council (PEC)",
  ]);
  drawCard("5 Things to Never Do", null, [
    "Never pull down or cut any wall without signed engineer's approval",
    "Never add another floor before foundation is checked",
    "Never use cheap, untested steel or low-grade cement",
    "Never skip the concrete curing period (minimum 28 days)",
    "Never ignore a diagonal crack wider than 6mm – it signals shear failure",
  ]);
  drawCard("Call a Structural Engineer If:", null, [
    "You see a new diagonal crack wider than 6mm",
    "Any wall starts to bulge, lean, or make a creaking sound",
    "After any earthquake of magnitude 5.0 or higher, even if the house looks fine",
  ]);
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

  // ── FINAL MESSAGE ────────────────────────────────────────────────────────
  sectionTitle("Final Message");
  drawCard("Summary", [
    `Your ${proj.floors || "3"}-storey structure has a decent chance of staying standing, but the ${risk.collapse_probability || 7.9}% collapse risk is not negligible for a family home.`,
    `By following the Standard Retrofit plan, spreading the work over the next ${proj.timeline_months || 12} months, and keeping a modest 15% contingency, you will bring the building into line with modern seismic standards.`,
    "Start the retrofit as soon as possible to protect your family and your home.",
  ]);

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, PAGE_HEIGHT - 15, PAGE_WIDTH, 12, "F");
    doc.setTextColor(120, 120, 140);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("QuakeVision AI  •  Home Seismic Retrofit Report  •  Homeowner Guide", LEFT_MARGIN, PAGE_HEIGHT - 8);
    doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - 25, PAGE_HEIGHT - 8);
  }

  const filename = `HomeReport_${proj.material || "RubbleStone"}_${proj.floors || "3"}-Storey_Mw${proj.magnitude || meta.magnitude || "7.8"}.pdf`;
  doc.save(filename);
}