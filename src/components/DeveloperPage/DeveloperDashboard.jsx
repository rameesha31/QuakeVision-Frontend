import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { Devreport as downloadDevReport } from "./Devreport";

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
    .replace(/`(.+?)`/g, "$1")
    .replace(/\|/g, " · ")
    .replace(/^[-•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s{2,}/g, " ")
    .replace(/·\s*·/g, "·")
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

function RiskBar({ label, value, max, color }) {
  const val = safeNum(value);
  const mx  = safeNum(max, 1);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold text-gray-600">{val.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full transition-all"
          style={{ width: `${Math.min((val / mx) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

const PURPLE     = "#6B46C1";
const PIE_COLORS = ["#3B82F6", PURPLE, "#F59E0B"];
const phaseColors = {
  investigation:   "#3B82F6",
  design:          PURPLE,
  design_approval: PURPLE,
  foundation:      "#F59E0B",
  superstructure:  "#F97316",
  certification:   "#10B981",
};

export default function DeveloperDashboard({ reportData, sessionId, onBack }) {

  if (!reportData) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-black text-gray-900 mb-2">No Report Data</h3>
          <p className="text-sm text-gray-600 mb-4">Please go back and try again.</p>
          <button onClick={onBack} className="px-4 py-2 rounded-lg bg-[#6B46C1] text-white text-sm font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const viz = safeGet(reportData, "visualization_data", {}) || {};

  const proj         = safeGet(viz, "project_info",  {}) || {};
  const projSite     = safeGet(proj, "site",          "—");
  const projType     = safeGet(proj, "project_type",  "—");
  const projSqft     = safeNum(safeGet(proj, "total_sqft",      0));
  const projFloors   = safeNum(safeGet(proj, "floors",           1));
  const projBudget   = safeGet(proj, "budget_level",  "—");
  const projTimeline = safeNum(safeGet(proj, "timeline_months", 18));

  const riskMetrics = safeGet(viz, "risk_metrics", {}) || {};
  const surv        = safeNum(safeGet(riskMetrics, "survival_probability", 0));
  const dmgRisk     = safeNum(safeGet(riskMetrics, "damage_risk_percent",  0));
  const riskLvl     = String(safeGet(riskMetrics,  "risk_level",           "Moderate") || "Moderate");

  const decisionObj  = safeGet(viz, "decision", {}) || {};
  const decisionText = String(safeGet(decisionObj, "verdict", "CONDITIONAL GO") || "CONDITIONAL GO");
  const conditions   = Array.isArray(decisionObj.conditions) && decisionObj.conditions.length > 0
    ? decisionObj.conditions
    : (reportData?.action_recommendations || []).slice(0, 3);

  const costsObj       = safeGet(viz, "costs", {}) || {};
  const baseCostPsf    = safeNum(safeGet(costsObj, "base_construction_psf",  0));
  const seismicPsf     = safeNum(safeGet(costsObj, "seismic_premium_psf",    0));
  const totalCost      = safeNum(safeGet(costsObj, "total_project_cost",      0));
  const seismicUpgrade = safeNum(safeGet(costsObj, "seismic_upgrade_total",   0));
  const contingencyPct = safeNum(safeGet(costsObj, "contingency_percent",     5));
  const contingency    = totalCost > 0 ? Math.round(totalCost * (contingencyPct / 100)) : 0;
  const baseCost       = totalCost > 0 ? totalCost - seismicUpgrade - contingency : 0;

  const roiObj          = safeGet(viz, "roi", {}) || {};
  const roiPayback      = safeNum(safeGet(roiObj, "payback_years",             0));
  const insuranceSavPct = safeNum(safeGet(roiObj, "insurance_savings_percent", 20));
  const resalePremPct   = safeNum(safeGet(roiObj, "resale_premium_percent",     5));

  const tl          = safeGet(viz, "timeline", {}) || {};
  const phases      = safeGet(tl, "phases", {}) || {};
  const totalMonths = safeNum(safeGet(tl, "total_months", projTimeline || 18)) || 18;

  const scoresRaw    = safeGet(viz, "risk_scores_by_material", null);
  const scoreEntries = scoresRaw
    ? Object.entries(scoresRaw)
        .filter(([, v]) => v !== null && v !== undefined && !isNaN(Number(v)))
        .map(([k, v]) => [k, safeNum(v)])
    : [];

  const riskBars = scoreEntries.length > 0
    ? scoreEntries
    : [["Survival", surv], ["Damage Risk", dmgRisk]];
  const maxScore = Math.max(...riskBars.map(([, v]) => v), 1) * 1.1;

  const pieData = [
    { name: "Base Construction", value: baseCost       },
    { name: "Seismic Upgrade",   value: seismicUpgrade },
    { name: "Contingency",       value: contingency     },
  ].filter(d => d.value > 0);
  const finalPieData = pieData.length > 0
    ? pieData
    : totalCost > 0 ? [{ name: "Total Project Cost", value: totalCost }] : [];

  const roiData = Array.from({ length: 10 }, (_, i) => ({
    year:  i === 0 ? "Now" : `Yr ${i * 2}`,
    value: seismicUpgrade > 0 ? Math.round(i * seismicUpgrade * 0.22 - seismicUpgrade) : 0,
  }));

  const gaugeColor = surv >= 80 ? "#10B981" : surv >= 60 ? "#F59E0B" : "#EF4444";
  const riskClass  = {
    Low:      "bg-green-50 border-green-200 text-green-600",
    Moderate: "bg-amber-50 border-amber-200 text-amber-600",
    High:     "bg-red-50 border-red-200 text-red-600",
    Severe:   "bg-red-50 border-red-200 text-red-600",
  }[riskLvl] || "bg-gray-50 border-gray-200 text-gray-600";

  const decisionColor =
    decisionText.toLowerCase().includes("no go") ? "text-red-500" : "text-amber-500";

  const actionRecs = (reportData?.action_recommendations || [])
    .map(a => stripMd(String(a))).filter(Boolean);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskClass}`}>
                ◉ {riskLvl.toUpperCase()} RISK
              </span>
              <span className="text-xs text-gray-400">
                SIM-{String(sessionId || "").slice(0, 8).toUpperCase() || "——"}-DEV
              </span>
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
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-none">Feasibility Report</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
              {projType} &nbsp;•&nbsp; {projSite}
              &nbsp;•&nbsp; {projFloors} Floors
              &nbsp;•&nbsp; {projSqft > 0 ? projSqft.toLocaleString() : "—"} sq ft
              &nbsp;•&nbsp; {capFirst(projBudget)} Budget
            </p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <button onClick={onBack}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs font-semibold hover:border-gray-300 transition-all">
              ✏ Modify
            </button>
            <button onClick={() => downloadDevReport(reportData)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-[#6B46C1] text-white text-xs font-semibold hover:bg-[#5a38a8] transition-all shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* ── INVESTMENT DECISION — stacks on mobile ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="sm:min-w-[160px]">
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1">Investment Decision</p>
            <p className={`text-xl sm:text-2xl font-black leading-tight ${decisionColor}`}>{decisionText}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskClass}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />{riskLvl} Risk
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Key Conditions</p>
            <ul className="space-y-1.5">
              {conditions.slice(0, 3).map((c, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-600">
                  <span className="text-amber-500 mt-0.5 shrink-0">▸</span>
                  <span>{stripMd(String(c))}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── KPI ROW — 2 cols mobile, 4 desktop ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Survival Probability</p>
            <p className="text-2xl sm:text-3xl font-black leading-none" style={{ color: gaugeColor }}>
              {surv > 0 ? `${surv.toFixed(1)}%` : "—"}
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5">Damage Risk: {dmgRisk > 0 ? `${dmgRisk.toFixed(1)}%` : "—"}</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 rounded-full" style={{ width: `${Math.min(surv, 100)}%`, background: gaugeColor }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>DEFICIT</span><span>RESILIENCE</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Total Project Cost</p>
            {totalCost > 0
              ? <p className="text-xl sm:text-2xl font-black leading-none text-blue-600">PKR {formatPKR(totalCost)}</p>
              : <p className="text-sm text-gray-400 italic mt-2">Not available</p>}
            <p className="text-[10px] text-gray-400 mt-1.5">
              {baseCostPsf > 0 ? `PKR ${(baseCostPsf + seismicPsf).toLocaleString()}/sqft` : "Full construction budget"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Seismic Upgrade</p>
            {seismicUpgrade > 0
              ? <p className="text-xl sm:text-2xl font-black leading-none text-amber-500">PKR {formatPKR(seismicUpgrade)}</p>
              : <p className="text-sm text-gray-400 italic mt-2">Not available</p>}
            <p className="text-[10px] text-gray-400 mt-1.5">
              {seismicPsf > 0 ? `PKR ${seismicPsf.toLocaleString()}/sqft premium` : "Earthquake resilience premium"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">ROI Payback</p>
            <p className="text-xl sm:text-2xl font-black leading-none text-[#6B46C1]">
              {roiPayback > 0 ? `${roiPayback} yrs` : "—"}
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5">{insuranceSavPct}% insurance savings</p>
          </div>
        </div>

        {/* ── Risk Assessment + Cost Breakdown — stack on mobile ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Risk Assessment</p>
            <p className="text-[10px] text-gray-400 mb-4">Seismic vulnerability metrics</p>
            {riskBars.map(([label, val]) => (
              <RiskBar
                key={label}
                label={capFirst(String(label))}
                value={val}
                max={maxScore}
                color={val > 70 ? "#EF4444" : val > 40 ? "#F59E0B" : "#10B981"}
              />
            ))}
            <div className={`mt-4 px-3 py-2 rounded-lg border text-xs font-semibold ${riskClass}`}>
              Overall Risk Level: {riskLvl}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Cost Breakdown</p>
            <p className="text-[10px] text-gray-400 mb-3">Construction cost allocation (PKR)</p>
            {finalPieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={finalPieData} cx={55} cy={55} innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={0}>
                    {finalPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="space-y-2 flex-1 min-w-0">
                  {finalPieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-gray-500 flex-1 truncate">{d.name}</span>
                      <span className="text-[11px] font-semibold text-gray-700 shrink-0">PKR {formatPKR(d.value)}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-500 flex-1">Total</span>
                    <span className="text-[11px] font-black text-blue-600">PKR {formatPKR(totalCost)}</span>
                  </div>
                </div>
              </div>
            ) : <p className="text-xs text-gray-400 italic">No cost data in response</p>}
          </div>
        </div>

        {/* ── Cost Detail + ROI — stack on mobile ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Cost Detail</p>
            <p className="text-[10px] text-gray-400 mb-4">Full project cost itemisation</p>
            <div className="space-y-3">
              {[
                { label: "Base Construction",                value: baseCost,       sub: baseCostPsf > 0 ? `PKR ${baseCostPsf.toLocaleString()}/sqft` : null,                color: "text-gray-700"  },
                { label: "Seismic Upgrade",                  value: seismicUpgrade, sub: seismicPsf  > 0 ? `PKR ${seismicPsf.toLocaleString()}/sqft premium`  : null,         color: "text-amber-500" },
                { label: `Contingency (${contingencyPct}%)`, value: contingency,    sub: null,                                                                                color: "text-gray-700"  },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${color}`}>
                    {value > 0 ? `PKR ${formatPKR(value)}` : "—"}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Total Project Cost</span>
                <span className="text-sm font-black text-blue-600">
                  {totalCost > 0 ? `PKR ${formatPKR(totalCost)}` : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">ROI Metrics</p>
            <p className="text-[10px] text-gray-400 mb-3">Return on seismic investment</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { val: roiPayback > 0 ? `${roiPayback}yr` : "—", label: "Payback",   color: "text-emerald-500" },
                { val: `${insuranceSavPct}%`,                      label: "Insurance", color: "text-blue-500"   },
                { val: `+${resalePremPct}%`,                       label: "Resale",    color: "text-amber-500"  },
              ].map(({ val, label, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-2 sm:p-2.5 text-center border border-gray-100">
                  <p className={`text-base sm:text-lg font-black ${color}`}>{val}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {seismicUpgrade > 0 ? (
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={roiData}>
                  <CartesianGrid stroke="#F3F4F6" strokeDasharray="4 4" />
                  <XAxis dataKey="year" tick={{ fontSize: 8, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 8, fill: "#9CA3AF" }} tickFormatter={v => formatPKR(v)} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 10 }}
                    formatter={v => ["PKR " + formatPKR(v), "Net Return"]} />
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-gray-400 italic">No seismic cost data for ROI graph</p>}
          </div>
        </div>

        {/* ── Gantt Timeline ── */}
        {Object.keys(phases).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Implementation Timeline</p>
            <p className="text-[10px] text-gray-400 mb-4">Estimated {totalMonths}-month construction pipeline</p>
            <div className="space-y-2.5 overflow-x-auto">
              <div className="flex items-center gap-3 min-w-[400px]">
                <span className="w-32 sm:w-36 shrink-0" />
                <div className="flex-1 flex justify-between">
                  {Array.from({ length: Math.min(totalMonths, 18) }, (_, i) => (
                    <span key={i} className="text-[9px] text-gray-400">M{i + 1}</span>
                  ))}
                </div>
              </div>
              {(() => {
                let offset = 0;
                return Object.entries(phases)
                  .filter(([, v]) => safeNum(v) > 0)
                  .map(([key, months]) => {
                    const mo    = safeNum(months);
                    const left  = ((offset / totalMonths) * 100).toFixed(1);
                    const width = ((mo / totalMonths) * 100).toFixed(1);
                    offset += mo;
                    return (
                      <div key={key} className="flex items-center gap-3 min-w-[400px]">
                        <span className="text-xs text-gray-500 w-32 sm:w-36 text-right shrink-0">
                          {capFirst(key)}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full relative overflow-hidden">
                          <div className="absolute h-6 rounded-full flex items-center px-2.5"
                            style={{ left: `${left}%`, width: `${width}%`, background: phaseColors[key] || PURPLE }}>
                            <span className="text-[10px] text-white font-semibold">{mo}mo</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        )}

        {/* ── Action Recommendations ── */}
        {actionRecs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm font-bold text-gray-800">Action Recommendations</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {actionRecs.map((a, i) => (
                <div key={i} className="flex gap-2 sm:gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#6B46C1]/20 hover:bg-[#6B46C1]/5 transition-all">
                  <div className="w-6 h-6 rounded-full bg-[#6B46C1] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}