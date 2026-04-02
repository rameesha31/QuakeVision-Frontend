import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import earthImage from "../assets/earth.png";

// ── Feature cards data ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Damage Prediction",
    desc: "Real-time seismic impact analysis using ML models trained on Pakistan's geological data.",
    color: "#6B46C1",
    bg: "bg-[#6B46C1]/8",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: "Home Safety",
    desc: "Building-level retrofit assessment with cost options, ROI forecasts, and step-by-step plans.",
    color: "#10B981",
    bg: "bg-emerald-50",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Urban Planning",
    desc: "Sector-level risk mapping to guide government retrofit programs and resource allocation.",
    color: "#3B82F6",
    bg: "bg-blue-50",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "AI-Powered Reports",
    desc: "LangGraph-based multi-agent pipeline producing validated, structured intelligence reports.",
    color: "#F59E0B",
    bg: "bg-amber-50",
  },
];

const STATS = [
  { value: "99.2%",  label: "Model Accuracy" },
  { value: "42+",    label: "Islamabad Sectors" },
  { value: "<5s",    label: "Report Generation" },
  { value: "FEMA P-58", label: "Compliance Standard" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-800 font-sans overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-0 min-h-screen flex flex-col overflow-hidden">

        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(107,70,193,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(107,70,193,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Purple glow blob top-right */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle at 70% 20%, rgba(107,70,193,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Hero text content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-10 pb-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#6B46C1]/20 rounded-full px-4 py-1.5 text-[11px] font-semibold text-[#6B46C1] shadow-sm mb-8 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B46C1] animate-pulse" />
            AI-Powered Seismic Intelligence Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.02] tracking-tight max-w-4xl">
            From tremors to{" "}
            <span className="relative inline-block">
              <span className="text-[#6B46C1]">trust</span>
              {/* Underline decoration */}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 6 Q50 0 100 5 Q150 10 200 4" stroke="#6B46C1" strokeWidth="2.5"
                  fill="none" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
          </h1>

          <h2 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.02] tracking-tight max-w-4xl mt-1">
            plan, predict,{" "}
            <span className="text-[#6B46C1]">protect.</span>
          </h2>

          <p className="mt-7 max-w-lg text-gray-500 text-base leading-relaxed">
            An AI-powered platform for real-time seismic risk analysis, building
            vulnerability assessment, and structured disaster response planning —
            built for Pakistan's seismic landscape.
          </p>

          {/* CTA buttons */}
          <div className="mt-9 flex items-center gap-4 flex-wrap justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#6B46C1] text-white font-bold text-sm hover:bg-[#5a38a8] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-14 flex items-center gap-8 flex-wrap justify-center">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-[#6B46C1]">{s.value}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Earth image — bottom, large, atmospheric */}
        {/* <div className="relative mt-4 flex justify-center"> */}
          {/* Gradient fade over earth */}
          {/* <div className="absolute inset-x-0 top-0 h-32 z-10"
            style={{ background: "linear-gradient(to bottom, #F7F8FC, transparent)" }} /> */}
          {/* <img
            src={earthImage}
            alt="Earth"
            className="w-full max-w-4xl object-contain opacity-80 select-none"
            style={{ filter: "saturate(0.7) brightness(0.95)" }}
          /> */}
          {/* Bottom fade */}
          {/* <div className="absolute inset-x-0 bottom-0 h-40 z-10"
            style={{ background: "linear-gradient(to top, #F7F8FC, transparent)" }} />
        </div> */}
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#6B46C1]/8 border border-[#6B46C1]/20 rounded-full px-4 py-1.5 text-[11px] font-bold text-[#6B46C1] uppercase tracking-widest mb-4">
            Platform Modules
          </div>
          <h2 className="text-4xl font-black text-gray-900">
            Everything you need for
            <span className="text-[#6B46C1]"> seismic resilience</span>
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Four integrated intelligence modules, each powered by a specialized
            AI agent with retrieval-augmented generation and real-time validation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <div key={i}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#6B46C1]/30 hover:shadow-md transition-all cursor-pointer">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}
                style={{ color: f.color }}>
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              {/* <div className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all"
                style={{ color: f.color }}>
                Learn more
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div> */}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="about" className="bg-white border-y border-gray-200 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#6B46C1]/8 border border-[#6B46C1]/20 rounded-full px-4 py-1.5 text-[11px] font-bold text-[#6B46C1] uppercase tracking-widest mb-4">
              How It Works
            </div>
            <h2 className="text-4xl font-black text-gray-900">
              From input to intelligence
              <br />
              <span className="text-[#6B46C1]">in under 5 seconds</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Configure",    desc: "Select city, sector, magnitude, and building parameters.",       icon: "⚙️" },
              { step: "02", title: "Analyze",      desc: "Multi-agent AI pipeline retrieves seismic knowledge and models.", icon: "🧠" },
              { step: "03", title: "Validate",     desc: "Outputs are cross-validated against FEMA P-58 standards.",       icon: "✅" },
              { step: "04", title: "Act",          desc: "Receive a structured report with cost plans and timelines.",      icon: "📋" },
            ].map((s, i) => (
              <div key={i} className="relative">
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[#6B46C1]/30 to-transparent z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#6B46C1]/8 border border-[#6B46C1]/20 flex items-center justify-center text-xl mb-3">
                    {s.icon}
                  </div>
                  <div className="text-[10px] font-black text-[#6B46C1] uppercase tracking-widest mb-1">{s.step}</div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{s.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="py-20 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(107,70,193,0.12) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="text-4xl mb-4">🛡️</div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                Ready to assess your
                <span className="text-[#6B46C1]"> seismic risk?</span>
              </h2>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                Join planners, homeowners, and developers using QuakeVision to make
                data-driven decisions about structural safety.
              </p>
              <div className="flex items-center gap-4 justify-center flex-wrap">
                <button
                  onClick={() => navigate("/risk-simulator")}
                  className="px-8 py-3.5 rounded-xl bg-[#6B46C1] text-white font-bold text-sm hover:bg-[#5a38a8] transition-all shadow-lg hover:shadow-xl">
                   Assess Damage and Risk
                </button>
                <button
                  onClick={() => navigate("/home-safety")}
                  className="px-8 py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-[#6B46C1]/40 hover:text-[#6B46C1] transition-all">
                  Home Safety Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-8 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6B46C1] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-black text-gray-900">Quake<span className="text-[#6B46C1]">Vision</span></span>
          </div>
          <p className="text-xs text-gray-400">
            FEMA P-58 · BCP-2021 Compliant &nbsp;·&nbsp; AI-powered seismic intelligence for Pakistan
          </p>
          <p className="text-xs text-gray-400">© 2025 QuakeVision. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}