const STEPS = ["Inputs", "Knowledge", "Report", "Validate", "Visualize"];

export default function LoadingOverlay({ step, messages, title }) {
  return (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 sm:gap-5 px-4">

      {/* Spinner */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-gray-200 border-t-[#6B46C1] animate-spin" />

      {/* Title */}
      <p className="text-sm sm:text-base font-semibold text-gray-700 text-center">{title}</p>

      {/* Pipeline steps
          — on mobile: 2 rows of badges (flex-wrap)
          — on desktop: single horizontal row */}
      <div className="bg-white border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 shadow-sm w-full max-w-sm sm:max-w-none sm:w-auto">
        <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                  i < step
                    ? "bg-green-50 border-green-200 text-green-600"
                    : i === step
                    ? "bg-[#6B46C1]/10 border-[#6B46C1]/30 text-[#6B46C1]"
                    : "bg-gray-50 border-gray-200 text-gray-400"
                }`}
              >
                {i < step ? "✓ " : ""}{s}
              </span>
              {/* Arrow — hide after last step and on very small screens between rows */}
              {i < STEPS.length - 1 && (
                <span className="text-gray-300 text-xs hidden sm:inline">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current step message */}
      <p className="text-xs sm:text-sm text-gray-400 text-center">
        {messages[Math.min(step, messages.length - 1)]}
      </p>
    </div>
  );
}