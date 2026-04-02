import { GaugeChart, HazardBar, StatChip } from "./RiskPrimitives";
import { getShakingIntensity, getImpact, hazardMeta } from "./Riskhelper";

function parseActions(text = "") {
  let items = [];
  if (/\d+\.\s/.test(text))      items = text.split(/\d+\.\s/).filter(Boolean);
  else if (text.includes("\n"))   items = text.split("\n").filter(Boolean);
  else if (text.includes(";"))    items = text.split(";").filter(Boolean);
  else if (text.includes(","))    items = text.split(",").filter(Boolean);
  else                            items = text.split(/(?<=[.?!])\s+/).filter(Boolean);
  return items.map((s) => s.trim()).filter((s) => s.length > 2);
}

const ACTION_ICONS = ["🏗", "🔩", "🧱", "🚨", "📋", "🛠", "🔍", "📢"];

export default function ReportCards({ results, formData }) {
  const pga  = results?.pga ?? 0;
  const meta = hazardMeta(results.damage_level);

  const hazardBars = [
    { label: "Foundation",  value: +(pga * 18).toFixed(2), color: "#EF4444" },
    { label: "Shear Walls", value: +(pga * 14).toFixed(2), color: "#F97316" },
    { label: "Soft Story",  value: +(pga * 10).toFixed(2), color: "#F59E0B" },
    { label: "Roof Ties",   value: +(pga *  7).toFixed(2), color: "#84CC16" },
  ];
  const hMax = Math.max(...hazardBars.map((h) => h.value), 1) * 1.2;

  const actions = parseActions(results.recommended_actions);

  return (
    <div className="space-y-4">

      {/* ── Row 1: 3 cards ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Aggregate Safety Index */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-0.5">
            Safety Index
          </p>
          <p className="text-[10px] text-gray-400 mb-4">
            Survival probability at Mw {formData.magnitude}
          </p>
          <div className="flex justify-center">
            <GaugeChart percent={meta.gauge} color={meta.color} />
          </div>
          <div className="mt-3 text-center">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border"
              style={{
                background: meta.color + "15",
                borderColor: meta.color + "40",
                color: meta.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
              {results.damage_level?.toUpperCase()}
            </span>
            <p className="text-[10px] text-gray-400 mt-1.5">{getImpact(results.damage_level)}</p>
          </div>
        </div>

        {/* Structural Hazards */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-0.5">
            Structural Hazards
          </p>
          <p className="text-[10px] text-gray-400 mb-4">
            Weakness mapping by component
          </p>
          {hazardBars.map((h) => <HazardBar key={h.label} {...h} max={hMax} />)}
        </div>

        {/* Seismic Profile */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-0.5">
            Seismic Profile
          </p>
          <p className="text-[10px] text-gray-400 mb-4">Recorded parameters</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatChip label="PGA"       value={pga.toFixed(3)}          unit="g"  color="#6B46C1" />
            <StatChip label="Shaking"   value={getShakingIntensity(pga)}           color="#EF4444" />
            <StatChip label="Magnitude" value={formData.magnitude}      unit="Mw" color="#F59E0B" />
            <StatChip label="Depth"     value={formData.depth}          unit="km" color="#10B981" />
          </div>
          <div className="bg-[#6B46C1]/5 border border-[#6B46C1]/15 rounded-xl p-3">
            <p className="text-[10px] font-bold text-[#6B46C1] mb-1 uppercase tracking-wider">Explanation</p>
            <p className="text-[10px] text-gray-600 leading-relaxed">{results.explanation}</p>
          </div>
        </div>

      </div>

      {/* ── Recommended Actions ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#6B46C1]/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[#6B46C1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Recommended Actions</p>
            <p className="text-[10px] text-gray-400">Step-by-step mitigation plan</p>
          </div>
        </div>

        {actions.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:border-[#6B46C1]/20 hover:bg-[#6B46C1]/5 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[#6B46C1] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-base shrink-0 mt-0.5">
                  {ACTION_ICONS[i % ACTION_ICONS.length]}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">{results.recommended_actions}</p>
        )}
      </div>

    </div>
  );
}