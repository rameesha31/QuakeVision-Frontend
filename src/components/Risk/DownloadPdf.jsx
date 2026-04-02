/**
 * generatePDF({ results, formData, report })
 * Builds and downloads a structured Intelligence Report PDF.
 */
export async function generatePDF({ results, formData, report }) {
  if (!results) {
    alert("Run simulation first!");
    return;
  }

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Colour palette ──────────────────────────────────────────────────────────
  const PURPLE = [107, 70, 193];
  const DARK   = [30, 30, 50];
  const GRAY   = [120, 120, 140];
  const LIGHT  = [245, 245, 250];
  const WHITE  = [255, 255, 255];
  const RED    = [220, 53, 69];
  const AMBER  = [245, 158, 11];

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const checkPage = (needed = 12) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  const sectionTitle = (title) => {
    checkPage(16);
    doc.setFillColor(...PURPLE);
    doc.rect(0, y, W, 8, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 14, y + 5.5);
    y += 13;
    doc.setTextColor(...DARK);
  };

  const row = (label, value, labelColor = GRAY, valueColor = DARK) => {
    checkPage(10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...labelColor);
    doc.text(label, 14, y);
    doc.setTextColor(...valueColor);
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

  const wrappedText = (text, x, maxWidth, lineH = 6) => {
    const lines = doc.splitTextToSize(String(text ?? ""), maxWidth);
    lines.forEach((line) => {
      checkPage(lineH + 2);
      doc.text(line, x, y);
      y += lineH;
    });
  };

  const getShaking = (pga) => {
    if (pga < 0.05) return "Weak";
    if (pga < 0.15) return "Light";
    if (pga < 0.3)  return "Moderate";
    if (pga < 0.5)  return "Strong";
    return "Severe";
  };

  const getImpact = (level = "") => {
    switch (level.toLowerCase()) {
      case "low":      return "Minimal structural damage expected";
      case "moderate": return "Noticeable damage to weak structures";
      case "high":     return "Serious structural damage likely";
      case "severe":   return "Widespread structural damage expected";
      default:         return "Impact level undetermined";
    }
  };

  const parseActions = (text = "") => {
    let items = [];
    if (/\d+\.\s/.test(text))      items = text.split(/\d+\.\s/).filter(Boolean);
    else if (text.includes("\n"))   items = text.split("\n").filter(Boolean);
    else if (text.includes(";"))    items = text.split(";").filter(Boolean);
    else if (text.includes(","))    items = text.split(",").filter(Boolean);
    else                            items = [text];
    return items.map((s) => s.trim()).filter((s) => s.length > 2);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const hazardLevel = (results.damage_level ?? "").toUpperCase();
  const badgeColor  = ["SEVERE", "HIGH"].includes(hazardLevel) ? RED : AMBER;
  const pga         = results.pga ?? 0;

  // ── COVER HEADER ─────────────────────────────────────────────────────────────
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, W, 42, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Intelligence Report", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${results.city ?? "—"}, Pakistan`, 14, 27);
  doc.text(
    `Mw ${formData.magnitude}  •  Depth ${formData.depth} km  •  Epicenter: ${formData.epicenter || "N/A"}`,
    14, 34
  );

  // Risk badge (top-right)
  doc.setFillColor(...badgeColor);
  doc.roundedRect(W - 52, 6, 38, 10, 2, 2, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(hazardLevel || "UNKNOWN", W - 46, 12.5);

  // Generated timestamp
  doc.setTextColor(200, 190, 230);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 66, 38);

  y = 50;

  // ── SECTION 1: SIMULATION INPUT ──────────────────────────────────────────────
  sectionTitle("1. Simulation Input");
  row("Target City",    results.city ?? formData.location);
  row("Epicenter City", formData.epicenter || "N/A");
  row("Magnitude",      `${formData.magnitude} Mw`);
  row("Depth",          `${formData.depth} km`);
  divider();

  // ── SECTION 2: DAMAGE PREDICTION RESULTS ─────────────────────────────────────
  sectionTitle("2. Damage Prediction Results");
  row("Overall Hazard Level",          hazardLevel || "—",           GRAY, badgeColor);
  row("PGA (Peak Ground Acceleration)", `${pga.toFixed(4)} g`);
  row("Shaking Intensity",             getShaking(pga));
  row("Expected Impact",               getImpact(results.damage_level));
  divider();

  // Explanation block
  checkPage(14);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PURPLE);
  doc.text("Explanation:", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  wrappedText(results.explanation, 14, W - 28, 6);
  y += 2;
  divider();

  // ── SECTION 3: STRUCTURAL HAZARD ESTIMATES ────────────────────────────────────
  sectionTitle("3. Structural Hazard Estimates");
  [
    { label: "Foundation Vulnerability", val: (pga * 18).toFixed(3) },
    { label: "Shear Wall Weakness",      val: (pga * 14).toFixed(3) },
    { label: "Soft Story Risk",          val: (pga * 10).toFixed(3) },
    { label: "Roof Tie Failure Risk",    val: (pga *  7).toFixed(3) },
  ].forEach(({ label, val }) => row(label, val));
  divider();

  // ── SECTION 4: RECOMMENDED ACTIONS ───────────────────────────────────────────
  sectionTitle("4. Recommended Actions");
  const actions = parseActions(results.recommended_actions);

  actions.forEach((action, i) => {
    checkPage(12);
    // Numbered bullet circle
    doc.setFillColor(...PURPLE);
    doc.circle(19, y - 2, 2.5, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(String(i + 1), i < 9 ? 18 : 17, y - 0.5);
    // Action text
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(action, W - 42);
    lines.forEach((line) => {
      checkPage(7);
      doc.text(line, 26, y);
      y += 6;
    });
    y += 1;
  });
  divider();

  // ── SECTION 5: CITY RISK PROFILE (if available) ───────────────────────────────
  if (report && typeof report === "object") {
    sectionTitle("5. City Risk Profile");
    const flatPrint = (obj, depth = 0) => {
      Object.entries(obj).forEach(([k, v]) => {
        if (k === "city") return;
        if (typeof v === "object" && v !== null) {
          checkPage(10);
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...PURPLE);
          doc.text(k.replace(/_/g, " ").toUpperCase(), 14 + depth * 4, y);
          y += 6;
          flatPrint(v, depth + 1);
        } else {
          row(k.replace(/_/g, " "), v);
        }
      });
    };
    flatPrint(report);
    divider();
  }

  // ── FOOTER on every page ──────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT);
    doc.rect(0, 285, W, 12, "F");
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Risk Simulation Platform  •  Confidential", 14, 291);
    doc.text(`Page ${i} of ${totalPages}`, W - 28, 291);
  }

  doc.save(`${results.city || formData.location || "report"}_Intelligence_Report.pdf`);
}