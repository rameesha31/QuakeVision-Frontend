const STEPS = ["Inputs", "Knowledge", "Report", "Validate", "Visualize"];

export default function LoadingOverlay({ step, messages, title }) {
  return (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
      {/* Spinner */}
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#6B46C1] animate-spin" />

      <p className="text-base font-semibold text-gray-700">{title}</p>

      {/* Pipeline steps */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                i < step
                  ? "bg-green-50 border-green-200 text-green-600"
                  : i === step
                  ? "bg-[#6B46C1]/10 border-[#6B46C1]/30 text-[#6B46C1]"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}
            >
              {i < step ? "✓ " : ""}{s}
            </span>
            {i < STEPS.length - 1 && (
              <span className="text-gray-300 text-xs">→</span>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400">{messages[Math.min(step, messages.length - 1)]}</p>
    </div>
  );
}