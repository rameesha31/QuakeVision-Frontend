import { useState } from "react";

const MATERIALS = [
  { key: "Wood",         abbr: "WD" },
  { key: "Rubble Stone", abbr: "RS" },
  { key: "Brick",        abbr: "BR" },
  { key: "Concrete",     abbr: "RC" },
  { key: "Adobe",        abbr: "AD" },
  { key: "Steel",        abbr: "ST" },
  { key: "URM",          abbr: "UR" },
  { key: "Timber",       abbr: "TM" },
];

const SECTORS = [
  "SECTOR C-16","SECTOR D-11","SECTOR D-12","SECTOR D-13","SECTOR D-15","SECTOR D-16",
  "SECTOR E-07","SECTOR E-08","SECTOR E-09","SECTOR E-11","SECTOR E-12","SECTOR E-14","SECTOR E-16",
  "SECTOR F-05","SECTOR F-06","SECTOR F-07","SECTOR F-08","SECTOR F-10","SECTOR F-11","SECTOR F-12","SECTOR F-15","SECTOR F-16",
  "SECTOR G-05","SECTOR G-06","SECTOR G-07","SECTOR G-08","SECTOR G-09","SECTOR G-10","SECTOR G-11","SECTOR G-12","SECTOR G-14","SECTOR G-16",
  "SECTOR H-08","SECTOR H-09","SECTOR H-10","SECTOR H-14","SECTOR H-15",
  "SECTOR I-08","SECTOR I-09","SECTOR I-10","SECTOR I-11","SECTOR I-15","SECTOR I-16",
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

export default function HomeInput({ onGenerate, loading }) {
  const [formData, setFormData] = useState({
    magnitude:         7.8,
    material:          "Rubble Stone",
    building_type:     "multi_story",
    floors:            3,
    project_size_sqft: 2000,
    budget_level:      "moderate",
    timeline_value:    18,
    timeline_unit:     "months",
    allow_web:         false,
    city_name:         "Islamabad",
    sector_name:       "",
  });

  const set = (key, val) => setFormData(p => ({ ...p, [key]: val }));
  const zone = getMagZone(formData.magnitude);
  const pct  = ((formData.magnitude - 4) / 5.5) * 100;

  const handleSubmit = () => {
    if (!formData.sector_name) return alert("Please select a sector");
    onGenerate(formData);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* Max width container — full on mobile, capped on desktop */}
      <div className="w-full max-w-2xl mx-auto lg:mx-0">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 uppercase tracking-wider">
              ⚡ Home Safety Module
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-widest">Simulation Ready</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-none">
            Home <span className="text-[#6B46C1] italic">Safety</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Configure parameters to run the high-fidelity seismic model.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5">

          {/* City + Sector — stack on very small screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="City">
              <select value={formData.city_name}
                onChange={e => set("city_name", e.target.value)}
                className={inputCls}>
                <option value="Islamabad">Islamabad</option>
              </select>
            </Field>
            <Field label="Sector">
              <select value={formData.sector_name}
                onChange={e => set("sector_name", e.target.value)}
                className={inputCls}>
                <option value="">— Select Sector —</option>
                {SECTORS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Magnitude Slider */}
          <Field label="Simulated Magnitude">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="shrink-0">
                <div className="text-2xl sm:text-3xl font-black text-[#6B46C1]">
                  {formData.magnitude.toFixed(1)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Richter (Mw)</div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="relative h-2 rounded-full mb-2"
                  style={{ background: "linear-gradient(90deg, #86efac 0%, #fde68a 40%, #fdba74 70%, #fca5a5 100%)" }}>
                  <input
                    type="range" min={4} max={9.5} step={0.1}
                    value={formData.magnitude}
                    onChange={e => set("magnitude", parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-2 z-10"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#6B46C1] shadow-md pointer-events-none transition-all"
                    style={{ left: `calc(${pct}% - 10px)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>4.0</span><span>5.0</span><span>6.0</span><span>7.0</span><span>8.0</span><span>9.5</span>
                </div>
              </div>

              <div className="shrink-0 text-right min-w-[55px]">
                <div className="text-[10px] text-gray-400">Zone</div>
                <div className={`text-xs sm:text-sm font-bold mt-0.5 ${ZONE_COLORS[zone]}`}>{zone}</div>
              </div>
            </div>
          </Field>

          {/* Material — 4 cols on sm+, 2 cols on xs */}
          <Field label="Structural Taxonomy">
            <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 gap-2">
              {MATERIALS.map(m => (
                <button key={m.key}
                  onClick={() => set("material", m.key)}
                  className={`py-2 sm:py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    formData.material === m.key
                      ? "border-[#6B46C1] bg-[#6B46C1]/10 text-[#6B46C1]"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}>
                  <span className="block text-sm font-black mb-0.5">{m.abbr}</span>
                  {m.key}
                </button>
              ))}
            </div>
          </Field>

          {/* Building type + floors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Building Type">
              <select value={formData.building_type}
                onChange={e => set("building_type", e.target.value)}
                className={inputCls}>
                <option value="single_story">Single Storey</option>
                <option value="multi_story">Multi Storey</option>
                <option value="apartment">Apartment</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </Field>
            <Field label="Vertical Scale (Floors)">
              <input type="number" min={1} max={50}
                value={formData.floors}
                onChange={e => set("floors", parseInt(e.target.value))}
                className={inputCls} />
            </Field>
          </div>

          {/* Floor area + Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Floor Area (sq ft)">
              <input type="number" min={100}
                value={formData.project_size_sqft}
                onChange={e => set("project_size_sqft", parseInt(e.target.value))}
                className={inputCls} />
            </Field>
            <Field label="Budget Level">
              <select value={formData.budget_level}
                onChange={e => set("budget_level", e.target.value)}
                className={inputCls}>
                <option value="low">Low — Essential upgrades</option>
                <option value="moderate">Moderate — Balanced</option>
                <option value="high">High — Comprehensive</option>
              </select>
            </Field>
          </div>

          {/* Timeline + Web */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Implementation Timeline">
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
            <Field label="Knowledge Source">
              <select value={formData.allow_web}
                onChange={e => set("allow_web", e.target.value === "true")}
                className={inputCls}>
                <option value="false">Vector DB Only</option>
                <option value="true">Include Web Search</option>
              </select>
            </Field>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className={`w-full py-3.5 sm:py-4 rounded-xl text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#6B46C1] hover:bg-[#5a38a8] text-white hover:shadow-lg"
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            GENERATE INTELLIGENCE REPORT →
          </button>

        </div>
      </div>
    </div>
  );
}