export default function EventsTable({ rows, onSelect }) {
  const magMeta = (mag) => {
    if (mag >= 5) return { color: "#EF4444", bg: "#FEF2F2", label: "High",     border: "#FECACA" };
    if (mag >= 3) return { color: "#F59E0B", bg: "#FFFBEB", label: "Moderate", border: "#FDE68A" };
    return          { color: "#10B981", bg: "#ECFDF5", label: "Low",      border: "#A7F3D0" };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col h-[500px]">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B46C1] mb-0.5">
              Live Feed
            </p>
            <h3 className="font-black text-gray-900 text-sm">Recent Events</h3>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Updating
          </span>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl">🌍</div>
            <p className="text-sm text-gray-400 font-medium">Fetching seismic data...</p>
          </div>
        ) : (
          rows.map((r, i) => {
            const m = magMeta(r.mag);
            return (
              <div
                key={i}
                onClick={() => onSelect(r)}
                className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-[#6B46C1]/5 hover:border-[#6B46C1]/20 cursor-pointer transition-all"
              >
                {/* Mag badge */}
                <div className="shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl border"
                  style={{ background: m.bg, borderColor: m.border }}>
                  <span className="text-sm font-black leading-none" style={{ color: m.color }}>
                    {r.mag}
                  </span>
                  <span className="text-[8px] font-bold uppercase mt-0.5" style={{ color: m.color }}>
                    Mw
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-gray-800 truncate">{r.location}</p>
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
                      {m.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{r.date} · {r.time}</p>
                  <p className="text-[10px] text-gray-400">Depth: {r.depth}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}