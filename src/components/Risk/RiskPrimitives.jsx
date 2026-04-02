// ─── GaugeChart ──────────────────────────────────────────────────────────────
export function GaugeChart({ percent, color }) {
  const r = 60, cx = 80, cy = 75;
  const angle = Math.PI + (percent / 100) * Math.PI;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  return (
    <svg viewBox="0 0 160 90" className="w-full max-w-[160px]">
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#F3F4F6" strokeWidth="14" strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${percent > 50 ? 1 : 0} 1 ${x} ${y}`}
        fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
      />
      {/* Thumb */}
      <circle cx={x} cy={y} r="6" fill="white" stroke={color} strokeWidth="2.5" />
      {/* Value */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>
        {percent}%
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize="8" fill="#9CA3AF" fontWeight="600" letterSpacing="1">
        RISK LEVEL
      </text>
    </svg>
  );
}

// ─── HazardBar ────────────────────────────────────────────────────────────────
export function HazardBar({ label, value, max, color }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold text-gray-600">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── StatChip ─────────────────────────────────────────────────────────────────
export function StatChip({ label, value, unit, color }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
      <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-black" style={{ color }}>{value}</span>
        {unit && <span className="text-[10px] text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}