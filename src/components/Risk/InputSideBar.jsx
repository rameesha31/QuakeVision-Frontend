const FIELDS = [
  {
    name: "location",
    label: "Target City",
    placeholder: "e.g. Islamabad",
    type: "text",
    icon: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    name: "epicenter",
    label: "Epicenter City",
    placeholder: "e.g. Muzaffarabad",
    type: "text",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  {
    name: "magnitude",
    label: "Simulated Magnitude",
    placeholder: "e.g. 7.2",
    type: "number",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    name: "depth",
    label: "Depth (km)",
    placeholder: "e.g. 10",
    type: "number",
    icon: "M19 14l-7 7m0 0l-7-7m7 7V3",
  },
];

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#6B46C1] focus:ring-1 focus:ring-[#6B46C1]/20 transition";

export default function InputSideBar({ formData, onChange, results }) {
  const blockInvalidChars = (e) =>
    ["e", "E", "+", "-"].includes(e.key) && e.preventDefault();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-5 gap-5 overflow-y-auto shrink-0">

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Parameters
        </p>
        <h2 className="text-base font-black text-gray-900 leading-tight">
          Simulation <span className="text-[#6B46C1] italic">Inputs</span>
        </h2>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
          Configure earthquake parameters to run impact analysis.
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Fields */}
      <div className="flex flex-col gap-4">
        {FIELDS.map((f) => (
          <div key={f.name} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-[#6B46C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
              </svg>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {f.label}
              </label>
            </div>
            <input
              name={f.name}
              type={f.type}
              step={f.type === "number" ? "0.1" : undefined}
              onKeyDown={f.type === "number" ? blockInvalidChars : undefined}
              onChange={onChange}
              placeholder={f.placeholder}
              className={inputCls}
            />
            {f.name === "magnitude" && formData.magnitude && (
              <div className="flex justify-between text-[9px] text-gray-400 px-0.5">
                <span>MODERATE (4.0)</span>
                <span>SEVERE (9.0)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info box at bottom */}
      <div className="mt-auto bg-[#6B46C1]/5 border border-[#6B46C1]/15 rounded-xl p-3">
        <p className="text-[10px] font-bold text-[#6B46C1] mb-1 uppercase tracking-wider">How it works</p>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Enter city names and seismic parameters. The model predicts PGA, damage level, and recommended actions.
        </p>
      </div>

    </aside>
  );
}