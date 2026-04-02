export default function StatCard({ icon, title, value, sub, color }) {
  const colorMap = {
    blue:   { text: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
    red:    { text: "text-red-500",    bg: "bg-red-50",    border: "border-red-100"  },
    green:  { text: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100" },
    purple: { text: "text-[#6B46C1]",  bg: "bg-[#6B46C1]/8", border: "border-[#6B46C1]/20" },
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#6B46C1]/30 transition-all flex items-start gap-4">
      {/* Icon bubble */}
      <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
        <span className={c.text}>{icon}</span>
      </div>

      {/* Text */}
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{title}</p>
        <h4 className="text-2xl font-black text-gray-900 leading-none">{value}</h4>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}