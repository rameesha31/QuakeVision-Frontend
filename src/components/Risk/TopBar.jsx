export default function TopBar({ results, loading, onRun, onDownload, onOpenInputs }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 gap-3 flex-wrap sm:flex-nowrap">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-[#6B46C1]/10 border border-[#6B46C1]/20 text-[#6B46C1] uppercase tracking-wider mb-1">
          ⚡ Risk Simulation
        </span>
        <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">Damage Predictor</h1>
        <p className="text-xs text-gray-400 hidden sm:block">Earthquake impact and damage prediction</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
        {results && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="hidden sm:inline">HIGH RISK PROFILE</span>
            <span className="sm:hidden">HIGH RISK</span>
          </span>
        )}

        {/* Mobile: open input panel button */}
        <button
          onClick={onOpenInputs}
          className="lg:hidden px-3 py-2.5 rounded-xl text-sm font-bold border border-[#6B46C1]/30 bg-[#6B46C1]/5 text-[#6B46C1] flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 4a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Inputs
        </button>

        <button
          onClick={onRun}
          disabled={loading}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${
            loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#6B46C1] hover:bg-[#5a38a8] text-white hover:shadow-md"
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="hidden sm:inline">Analyzing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden sm:inline">Run Simulation</span>
              <span className="sm:hidden">Run</span>
            </>
          )}
        </button>

        <button
          onClick={onDownload}
          className="px-3 sm:px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Download PDF</span>
        </button>
      </div>
    </header>
  );
}