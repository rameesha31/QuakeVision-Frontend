import { useState } from "react";

const SECTORS = [
  "SECTOR C-16","SECTOR D-11","SECTOR D-12","SECTOR D-13","SECTOR D-15","SECTOR D-16",
  "SECTOR E-07","SECTOR E-08","SECTOR E-09","SECTOR E-11","SECTOR E-12","SECTOR E-14","SECTOR E-16",
  "SECTOR F-05","SECTOR F-06","SECTOR F-07","SECTOR F-08","SECTOR F-10","SECTOR F-11","SECTOR F-12","SECTOR F-15","SECTOR F-16",
  "SECTOR G-05","SECTOR G-06","SECTOR G-07","SECTOR G-08","SECTOR G-09","SECTOR G-10","SECTOR G-11","SECTOR G-12","SECTOR G-14","SECTOR G-16",
  "SECTOR H-08","SECTOR H-09","SECTOR H-10","SECTOR H-14","SECTOR H-15",
  "SECTOR I-08","SECTOR I-09","SECTOR I-10","SECTOR I-11","SECTOR I-15","SECTOR I-16",
];

// building_type valid values from backend Literal check:
// 'residential', 'commercial', 'mixed-use', 'industrial'
const BUILDING_TYPES = [
  { key: "residential", abbr: "RES", label: "Residential" },
  { key: "commercial",  abbr: "COM", label: "Commercial"  },
  { key: "mixed-use",   abbr: "MIX", label: "Mixed-Use"   },
  { key: "industrial",  abbr: "IND", label: "Industrial"  },
];

const MAG_ZONES = [[5,"MINOR"],[6,"MODERATE"],[7,"STRONG"],[8,"SEVERE"],[9.5,"EXTREME"]];
const ZONE_COLORS = {
  MINOR:    "text-emerald-500",
  MODERATE: "text-yellow-500",
  STRONG:   "text-orange-400",
  SEVERE:   "text-orange-600",
  EXTREME:  "text-red-500",
};

function getMagZone(v) {
  return MAG_ZONES.find(([max]) => v <= max)?.[1] || "EXTREME";
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#6B46C1] focus:ring-1 focus:ring-[#6B46C1]/20 transition";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      {children}
    </div>
  );
}

export default function DeveloperInput({ onGenerate, loading }) {
  const [formData, setFormData] = useState({
    magnitude:         7.8,
    city_name:         "Islamabad",
    site_sector:       "",
    project_name:      "",
    project_type:      "Commercial Plaza",   // free-text description sent to LLM
    building_type:     "commercial",         // Literal — must be one of the 4 valid values
    floors:            8,
    project_size_sqft: 15000,
    budget_level:      "moderate",
    timeline_value:    18,
    timeline_unit:     "months",
    allow_web:         false,
  });

  const set = (key, val) => setFormData(p => ({ ...p, [key]: val }));
  const zone = getMagZone(formData.magnitude);
  const pct  = ((formData.magnitude - 4) / 5.5) * 100;

  const handleSubmit = () => {
    if (!formData.site_sector)         return alert("Please select a sector");
    if (!formData.project_name.trim()) return alert("Please enter a project name");
    onGenerate(formData);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 uppercase tracking-wider">
              🏗 Developer Module
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-widest">Feasibility Engine</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 leading-none">
            Developer <span className="text-[#6B46C1] italic">Plan</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Configure site parameters to run seismic feasibility analysis.
          </p>
        </div>

        <div className="space-y-5">

          {/* City + Sector */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="City">
              <select value={formData.city_name}
                onChange={e => set("city_name", e.target.value)}
                className={inputCls}>
                <option value="Islamabad">Islamabad</option>
              </select>
            </Field>
            <Field label="Site / Sector">
              <select value={formData.site_sector}
                onChange={e => set("site_sector", e.target.value)}
                className={inputCls}>
                <option value="">— Select Sector —</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* Project Name + Project Type */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project Name">
              <input
                type="text"
                placeholder="e.g. F-7 Business Tower"
                value={formData.project_name}
                onChange={e => set("project_name", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Project Type">
              <input
                type="text"
                placeholder="e.g. Commercial Plaza"
                value={formData.project_type}
                onChange={e => set("project_type", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Magnitude Slider */}
          <Field label="Simulated Magnitude">
            <div className="flex items-center gap-5">
              <div className="shrink-0">
                <div className="text-3xl font-black text-[#6B46C1]">{formData.magnitude.toFixed(1)}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Richter (Mw)</div>
              </div>
              <div className="flex-1">
                <div className="relative h-2 rounded-full mb-2"
                  style={{ background: "linear-gradient(90deg,#86efac 0%,#fde68a 40%,#fdba74 70%,#fca5a5 100%)" }}>
                  <input type="range" min={4} max={9.5} step={0.1}
                    value={formData.magnitude}
                    onChange={e => set("magnitude", parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-2 z-10" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#6B46C1] shadow-md pointer-events-none"
                    style={{ left: `calc(${pct}% - 10px)` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>4.0</span><span>5.0</span><span>6.0</span><span>7.0</span><span>8.0</span><span>9.5</span>
                </div>
              </div>
              <div className="shrink-0 text-right min-w-[60px]">
                <div className="text-[10px] text-gray-400">Zone</div>
                <div className={`text-sm font-bold mt-0.5 ${ZONE_COLORS[zone]}`}>{zone}</div>
              </div>
            </div>
          </Field>

          {/* Building Type — Literal values only */}
          <Field label="Building Type">
            <div className="grid grid-cols-4 gap-2">
              {BUILDING_TYPES.map(bt => (
                <button key={bt.key}
                  onClick={() => set("building_type", bt.key)}
                  className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    formData.building_type === bt.key
                      ? "border-[#6B46C1] bg-[#6B46C1]/10 text-[#6B46C1]"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}>
                  <span className="block text-sm font-black mb-0.5">{bt.abbr}</span>
                  {bt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Floors + Floor Plate */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Floors">
              <input type="number" min={1} max={100}
                value={formData.floors}
                onChange={e => set("floors", parseInt(e.target.value))}
                className={inputCls} />
            </Field>
            <Field label="Floor Plate (sq ft)">
              <input type="number" min={100}
                value={formData.project_size_sqft}
                onChange={e => set("project_size_sqft", parseInt(e.target.value))}
                className={inputCls} />
            </Field>
          </div>

          {/* Budget + Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget Level">
              <select value={formData.budget_level}
                onChange={e => set("budget_level", e.target.value)}
                className={inputCls}>
                <option value="low">Low — Essential</option>
                <option value="moderate">Moderate — Balanced</option>
                <option value="high">High — Comprehensive</option>
              </select>
            </Field>
            <Field label="Timeline">
              <div className="flex gap-2">
                <input type="number" min={1}
                  value={formData.timeline_value}
                  onChange={e => set("timeline_value", parseInt(e.target.value))}
                  className={inputCls + " flex-1"} />
                <select value={formData.timeline_unit}
                  onChange={e => set("timeline_unit", e.target.value)}
                  className={inputCls + " flex-1"}>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </Field>
          </div>

          {/* Web Search */}
          <Field label="Web Search">
            <select value={formData.allow_web}
              onChange={e => set("allow_web", e.target.value === "true")}
              className={inputCls}>
              <option value="false">Vector DB Only</option>
              <option value="true">Include Web Search</option>
            </select>
          </Field>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className={`w-full py-4 rounded-xl text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
              loading ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#6B46C1] hover:bg-[#5a38a8] text-white hover:shadow-lg"
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            GENERATE FEASIBILITY REPORT →
          </button>

        </div>
      </div>
    </div>
  );
}