import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const links = [
    { label: "Home",      href: "/" },
    { label: "Platform Modules",  href: "#features" },
    { label: "How it works",     href: "#about" },
    { label: "Get in touch",   href: "#contact" },
  ];

  return (
    <nav className="absolute top-0 left-0 w-full z-30 px-8 py-5 flex items-center justify-between">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-gray-200/60" />

      {/* Logo */}
      <div
        className="relative flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        {/* Icon mark */}
        <div className="w-8 h-8 rounded-lg bg-[#6B46C1] flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-lg font-black text-gray-900 tracking-tight">
          Quake<span className="text-[#6B46C1]">Vision</span>
        </span>
      </div>

      {/* Center links */}
      <ul className="relative hidden md:flex items-center gap-1">
        {links.map(l => (
          <li key={l.label}>
            <a
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === l.href
                  ? "text-[#6B46C1] bg-[#6B46C1]/8"
                  : "text-gray-600 hover:text-[#6B46C1] hover:bg-[#6B46C1]/5"
              }`}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <div className="relative flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-all"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg py-4 px-6 flex flex-col gap-2 md:hidden">
          {links.map(l => (
            <a key={l.label} href={l.href}
              className="text-sm text-gray-600 hover:text-[#6B46C1] py-2 border-b border-gray-100 last:border-0">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}