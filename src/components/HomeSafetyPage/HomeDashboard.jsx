import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Downloadreport } from "./Downloadreport";

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
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^[-•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

function safeNum(v, def = 0) {
  const n = Number(v);
  return isNaN(n) ? def : n;
}

function RiskBar({ label, value, max, color }) {
  const val = safeNum(value, 0);
  const mx  = safeNum(max, 1);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold text-gray-600">{val.toFixed(2)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full transition-all"
          style={{ width: `${Math.min((val / mx) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function ResourceCard({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">{label}</p>
      <p className="text-lg sm:text-xl font-black" style={{ color }}>{value}</p>
      <div className="h-0.5 rounded-full mt-2" style={{ background: color, opacity: 0.35 }} />
    </div>
  );
}

const PURPLE     = "#6B46C1";
const PIE_COLORS = [PURPLE, "#60A5FA", "#34D399"];

const BAR_COLORS = {
  URM:         "#EF4444",
  RCF:         "#F59E0B",
  RCI:         "#F59E0B",
  RubbleStone: "#10B981",
  Adobe:       "#3B82F6",
};

const PHASE_COLORS = {
  assessment:               PURPLE,
  roof_and_walls:           "#8B5CF6",
  corners_and_openings:     "#F59E0B",
  foundation:               "#10B981",
  inspection_certification: "#3B82F6",
};

const BUDGET_LEVEL_MAP = {
  low:      "basic",
  moderate: "standard",
  high:     "comprehensive",
};

const BUDGET_LEVEL_COLOR = {
  low:      "#10B981",
  moderate: "#F59E0B",
  high:     "#EF4444",
};

export default function HomeDashboard({ reportData, sessionId, onBack }) {

  const viz      = reportData?.visualization_data || {};
  const risk     = viz.risk_assessment || {};
  const proj     = viz.project_info || {};
  const steps    = viz.retrofit_steps || {};
  const costs    = viz.cost_options || {};
  const timeline = viz.timeline || {};
  const scores   = viz.risk_scores_by_material || {};

  const surv    = safeNum(risk.survival_probability, 0);
  const coll    = safeNum(risk.collapse_probability, 0);
  const occ     = risk.occupancy_status || "";
  const riskLvl = risk.risk_level || "";

  const budgetLevelKey  = proj.budget_level?.toLowerCase() || "moderate";
  const budgetKey       = BUDGET_LEVEL_MAP[budgetLevelKey] || costs.recommended || "standard";
  const selectedCost    = costs[budgetKey] || {};
  const budgetColor     = BUDGET_LEVEL_COLOR[budgetLevelKey] || "#6B46C1";

  const gaugeColor = surv >= 80 ? "#10B981" : surv >= 60 ? "#F59E0B" : "#EF4444";

  const scoreEntries = Object.entries(scores);
  const maxScore = Math.max(...scoreEntries.map(([, v]) => safeNum(v, 0)), 1) * 1.2;

  const pieData = [
    { name: "Basic",         value: safeNum(costs.basic?.total_pkr, 0) },
    { name: "Standard",      value: safeNum(costs.standard?.total_pkr, 0) },
    { name: "Comprehensive", value: safeNum(costs.comprehensive?.total_pkr, 0) },
  ].filter(d => d.value > 0);

  const phases      = timeline.phases || {};
  const totalMonths = safeNum(timeline.total_months, 1);

  const totalWeeks = Object.values(steps).reduce((a, s) => a + safeNum(s.weeks, 0), 0);
  const resources = [
    { label: "Steel Rebar", value: `${(safeNum(proj.total_sqft, 0) * 0.0025).toFixed(1)} Tons`, color: "#3B82F6" },
    { label: "Cement",      value: `${Math.round(safeNum(proj.total_sqft, 0) * 0.15)} Bags`,    color: "#F59E0B" },
    { label: "Eng. Hours",  value: `${Math.round(totalWeeks * 12)} Hrs`,                        color: PURPLE },
    { label: "Labor Team",  value: `${Math.ceil(safeNum(proj.floors, 1) * 1.5)} Pers`,          color: "#10B981" },
  ];

  const riskFactors = (reportData?.risk_assessment_summary || []).map(r => stripMd(r));
  const actionRecs  = (reportData?.action_recommendations  || []).map(a => stripMd(a));

  const riskClass = {
    Low:      "bg-green-50 border-green-200 text-green-600",
    Moderate: "bg-amber-50 border-amber-200 text-amber-600",
    High:     "bg-red-50 border-red-200 text-red-600",
    Severe:   "bg-red-50 border-red-200 text-red-600",
    Extreme:  "bg-red-50 border-red-200 text-red-600",
  }[riskLvl] || "bg-gray-50 border-gray-200 text-gray-600";

  const occClass = occ.toLowerCase().includes("safe") && !occ.toLowerCase().includes("caution")
    ? "bg-green-50 border-green-200 text-green-700"
    : occ.toLowerCase().includes("caution")
    ? "bg-amber-50 border-amber-200 text-amber-700"
    : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskClass}`}>
                ◉ {riskLvl.toUpperCase() || "UNKNOWN"} RISK
              </span>
              <span className="text-xs text-gray-400">Analysis v2.4.1</span>
              {reportData?.is_validated && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-green-50 border-green-200 text-green-600">
                  ✓ Validated {reportData.validation_score}/100
                </span>
              )}
              {reportData?.is_fallback && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-600">
                  ⚠ Fallback Mode
                </span>
              )}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-none">Intelligence Report</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
              {proj.material || "—"} Structure &nbsp;•&nbsp; {capFirst(proj.building_type)} &nbsp;•&nbsp;
              Magnitude Mw {proj.magnitude || "—"} &nbsp;•&nbsp; {safeNum(proj.total_sqft, 0).toLocaleString()} sq ft
            </p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs font-semibold hover:border-gray-300 transition-all"
            >
              ✏ Modify
            </button>
            <button
              onClick={() => Downloadreport(reportData)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-[#6B46C1] text-white text-xs font-semibold hover:bg-[#5a38a8] transition-all shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* ── KPI ROW — 2 cols on mobile, 4 on desktop ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Safety Index</p>
            <p className="text-2xl sm:text-3xl font-black leading-none" style={{ color: gaugeColor }}>{Math.round(surv)}%</p>
            <p className="text-[10px] text-gray-400 mt-1.5">Survival probability at Mw {proj.magnitude || "—"}</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 rounded-full" style={{ width: `${Math.min(surv, 100)}%`, background: gaugeColor }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>DEFICIT</span><span>RESILIENCE</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Collapse Risk</p>
            <p className="text-2xl sm:text-3xl font-black leading-none text-[#6B46C1]">{Number(coll).toFixed(1)}%</p>
            <p className="text-[10px] text-gray-400 mt-1.5">Damage risk probability</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Budget Level</p>
            <span
              className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold text-white mt-0.5"
              style={{ background: budgetColor }}
            >
              {capFirst(proj.budget_level || "Moderate")}
            </span>
            <p className="text-[10px] text-gray-400 mt-2">
              {selectedCost.label || capFirst(budgetKey)} · {selectedCost.weeks || "?"} weeks
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Occupancy Status</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border mt-1 ${occClass}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {occ || "—"}
            </span>
            <p className="text-[10px] text-gray-400 mt-2">Risk Level: {riskLvl || "—"}</p>
          </div>
        </div>

        {/* ── Structural Hazards + Cost Allocation — stack on mobile ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Structural Hazards</p>
            <p className="text-[10px] text-gray-400 mb-4">Risk score by material type (0–10 scale)</p>
            {scoreEntries.length > 0 ? (
              scoreEntries.map(([mat, score]) => (
                <RiskBar key={mat}
                  label={mat === "RubbleStone" ? "Rubble Stone" : mat}
                  value={score} max={maxScore}
                  color={BAR_COLORS[mat] || "#8B92A8"} />
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No material risk data in response</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Cost Allocation</p>
            <p className="text-[10px] text-gray-400 mb-3">Retrofit package breakdown</p>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={110} height={110}>
                  <Pie data={pieData} cx={50} cy={50} innerRadius={28} outerRadius={48}
                    dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                </PieChart>
                <div className="space-y-2 flex-1 min-w-0">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-[11px] text-gray-500 truncate">{d.name}</span>
                      <span className="text-[11px] font-semibold text-gray-700 ml-auto shrink-0">
                        {safeNum(d.value, 0) > 0 ? `PKR ${formatPKR(d.value)}` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No cost data in response</p>
            )}
          </div>
        </div>

        {/* ── COST OPTIONS ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <p className="text-sm font-bold text-gray-800 mb-1">Cost Options</p>
          <p className="text-[10px] text-gray-400 mb-3">
            Budget level <span className="font-semibold" style={{ color: budgetColor }}>{capFirst(proj.budget_level || "Moderate")}</span> ke mutabiq package auto-selected
          </p>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
            {["basic", "standard", "comprehensive"].map(k => {
              const t = costs[k]; if (!t) return null;
              const isSelected = budgetKey === k;
              return (
                <div key={k} className={`relative pt-4 pb-3 px-3 rounded-xl border text-center ${
                  isSelected ? "border-[#6B46C1] bg-[#6B46C1]/5 shadow-sm" : "border-gray-200 bg-gray-50"
                }`}>
                  {isSelected && (
                    <span
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: budgetColor }}
                    >
                      {capFirst(proj.budget_level || "SELECTED")}
                    </span>
                  )}
                  <p className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider">{t.label || capFirst(k)}</p>
                  <p className={`text-sm font-black mt-1.5 ${isSelected ? "text-[#6B46C1]" : "text-gray-800"}`}>
                    {safeNum(t.total_pkr, 0) > 0 ? `PKR ${formatPKR(safeNum(t.total_pkr, 0))}` : "—"}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{t.range_str || "—"}</p>
                  <p className="text-[10px] text-gray-500 mt-1.5">⏱ {t.weeks || "?"} weeks</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── GANTT ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <p className="text-sm font-bold text-gray-800 mb-0.5">Implementation Lifecycle</p>
          <p className="text-[10px] text-gray-400 mb-4">
            Estimated {totalMonths}-month execution pipeline
          </p>
          {Object.keys(phases).length > 0 ? (
            <div className="space-y-2.5 overflow-x-auto">
              <div className="flex items-center gap-3 min-w-[400px]">
                <span className="w-32 sm:w-40 shrink-0" />
                <div className="flex-1 flex justify-between">
                  {Array.from({ length: Math.min(totalMonths, 20) }, (_, i) => (
                    <span key={i} className="text-[9px] text-gray-400">M{i + 1}</span>
                  ))}
                </div>
              </div>
              {(() => {
                let offset = 0;
                return Object.entries(phases)
                  .filter(([, v]) => safeNum(v, 0) > 0)
                  .map(([key, months]) => {
                    const mo    = safeNum(months, 0);
                    const left  = ((offset / totalMonths) * 100).toFixed(1);
                    const width = ((mo / totalMonths) * 100).toFixed(1);
                    offset += mo;
                    return (
                      <div key={key} className="flex items-center gap-3 min-w-[400px]">
                        <span className="text-xs text-gray-500 w-32 sm:w-40 text-right shrink-0">
                          {capFirst(key.replace(/_/g, " "))}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full relative overflow-hidden">
                          <div className="absolute h-6 rounded-full flex items-center px-2.5"
                            style={{ left: `${left}%`, width: `${width}%`, background: PHASE_COLORS[key] || PURPLE }}>
                            <span className="text-[10px] text-white font-semibold">{mo}mo</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No timeline/phase data in response</p>
          )}
        </div>

        {/* ── RETROFIT STEPS + RESOURCES — stack on mobile ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Retrofit Steps</p>
            <p className="text-[10px] text-gray-400 mb-3">Execution sequence · weeks · cost estimate</p>
            {Object.keys(steps).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(steps).map(([key, s], i) => (
                  <div key={key}
                    className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-[#6B46C1] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <span className="flex-1 text-xs text-gray-600 min-w-0 truncate">{capFirst(key)}</span>
                    <span className="text-[11px] text-gray-400 shrink-0">{s.weeks}w</span>
                    <span className="text-[11px] font-semibold text-amber-600 shrink-0 text-right">
                      {safeNum(s.cost_pkr, 0) > 0 ? `PKR ${formatPKR(s.cost_pkr)}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No retrofit step data in response</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Implementation Resources</p>
            <p className="text-[10px] text-gray-400 mb-3">Logistical requirements for retrofit</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {resources.map(r => <ResourceCard key={r.label} {...r} />)}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Key Risk Factors</p>
            <div className="space-y-0">
              {riskFactors.length > 0 ? riskFactors.slice(0, 4).map((r, i) => (
                <div key={i} className="flex gap-2 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-[#6B46C1] shrink-0 mt-0.5 text-xs">◈</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{r}</p>
                </div>
              )) : (
                <p className="text-xs text-gray-400 italic">No risk summary data in response</p>
              )}
            </div>
          </div>
        </div>

        {/* ── ACTION RECOMMENDATIONS ── */}
        {actionRecs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 pb-5 sm:pb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm font-bold text-gray-800">Action Recommendations</p>
            </div>
            <div className="space-y-2">
              {actionRecs.map((a, i) => (
                <div key={i}
                  className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-[#6B46C1]/20 hover:bg-[#6B46C1]/5 transition-all">
                  <div className="w-6 h-6 rounded-full bg-[#6B46C1] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}