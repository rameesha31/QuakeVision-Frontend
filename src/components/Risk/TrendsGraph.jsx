import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-500 mb-1">Magnitude: {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-bold">
            {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function TrendsGraph({ trends, singleResult }) {
  const rangeData = trends?.results?.map((r) => ({
    magnitude: r.magnitude,
    PGA: r.pga_g,
  })) ?? [];

  const singleData = singleResult
    ? [{ magnitude: singleResult.magnitude ?? "Input", PGA: singleResult.pga ?? 0 }]
    : [];

  if (!rangeData.length && !singleData.length) return null;

  return (
    <div className="space-y-4">

      {/* Section label */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
          Seismic Trend Analysis
        </p>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Charts: stack on mobile, side-by-side on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Chart 1: Single point — Magnitude vs PGA */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <p className="text-sm font-bold text-gray-800">Magnitude vs PGA</p>
          </div>
          <p className="text-[10px] text-gray-400 mb-4 ml-4">Single event result</p>
          {singleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={singleData} barSize={48}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="magnitude"
                  tick={{ fontSize: 9, fill: "#9CA3AF" }}
                  label={{ value: "Magnitude (Mw)", position: "insideBottom", offset: -2, fontSize: 9, fill: "#9CA3AF" }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#9CA3AF" }}
                  label={{ value: "PGA (g)", angle: -90, position: "insideLeft", fontSize: 9, fill: "#9CA3AF" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="PGA" name="PGA" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[170px] flex items-center justify-center text-xs text-gray-400">
              No single point data
            </div>
          )}
        </div>

        {/* Chart 2: PGA vs Magnitude range */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#6B46C1]" />
            <p className="text-sm font-bold text-gray-800">PGA vs Magnitude</p>
          </div>
          <p className="text-[10px] text-gray-400 mb-4 ml-4">Range simulation</p>
          {rangeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={rangeData}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="4 4" />
                <XAxis
                  dataKey="magnitude"
                  tick={{ fontSize: 9, fill: "#9CA3AF" }}
                  label={{ value: "Magnitude (Mw)", position: "insideBottom", offset: -2, fontSize: 9, fill: "#9CA3AF" }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#9CA3AF" }}
                  label={{ value: "PGA (g)", angle: -90, position: "insideLeft", fontSize: 9, fill: "#9CA3AF" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="PGA" name="PGA"
                  stroke="#6B46C1" strokeWidth={2.5}
                  dot={{ r: 3, fill: "#6B46C1" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[170px] flex items-center justify-center text-xs text-gray-400">
              No range data available
            </div>
          )}
        </div>

      </div>
    </div>
  );
}