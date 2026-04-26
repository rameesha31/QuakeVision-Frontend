import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PURPLE = "#6B46C1";
const BREAKPOINT = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= BREAKPOINT : true
  );
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= BREAKPOINT);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isDesktop;
}

function IconHome() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconActivity() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconChevron({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  );
}
function IconHamburger() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function IconDot({ active }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: "50%", flexShrink: 0, display: "inline-block",
      background: active ? PURPLE : "#D1D5DB",
      boxShadow: active ? `0 0 6px ${PURPLE}88` : "none",
      transition: "all 0.2s",
    }} />
  );
}

const NAV_ITEMS = [
  { label: "Dashboard",        path: "/dashboard",      icon: <IconHome /> },
  { label: "Damage Predictor", path: "/risk-simulator", icon: <IconActivity /> },
];

const URBAN_SHIELD_ITEMS = [
  { label: "Developer Plan",           path: "/site-planner" },
  { label: "Home Safety Plan",         path: "/home-safety"  },
  { label: "Government Strategy Plan", path: "/retrofit"     },
];

function SidebarInner({ onClose }) {
  const [openUrban, setOpenUrban] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => { navigate(path); onClose?.(); };
  const isActive      = (path) => location.pathname === path;
  const isUrbanActive = URBAN_SHIELD_ITEMS.some(i => location.pathname === i.path);

  return (
    <>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #F3F4F6", position: "relative" }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              width: 28, height: 28, borderRadius: 8,
              background: "#F3F4F6", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#6B7280", fontSize: 14, fontWeight: 700,
            }}
          >✕</button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: PURPLE,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", flexShrink: 0,
          }}>
            <IconGlobe />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>
              QuakeVision
            </div>
            <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "1px", textTransform: "uppercase", marginTop: 1 }}>
              Seismic Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>
          Navigation
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <button onClick={() => go(item.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    width: "100%", padding: "8px 10px",
                    borderRadius: 8, border: "none",
                    background: active ? `${PURPLE}10` : "transparent",
                    color: active ? PURPLE : "#6B7280",
                    cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; } }}
                >
                  <IconDot active={active} />
                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}

          {/* Urban Shield dropdown */}
          <li>
            <button
              onClick={() => setOpenUrban(!openUrban)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "8px 10px",
                borderRadius: 8, border: "none",
                background: (openUrban || isUrbanActive) ? `${PURPLE}10` : "transparent",
                color: (openUrban || isUrbanActive) ? PURPLE : "#6B7280",
                cursor: "pointer", fontSize: 13,
                fontWeight: (openUrban || isUrbanActive) ? 600 : 400,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!openUrban && !isUrbanActive) { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; } }}
              onMouseLeave={e => { if (!openUrban && !isUrbanActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; } }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <IconDot active={openUrban || isUrbanActive} />
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ opacity: (openUrban || isUrbanActive) ? 1 : 0.7 }}><IconShield /></span>
                  Urban Shield
                </span>
              </span>
              <IconChevron open={openUrban} />
            </button>

            <div style={{ overflow: "hidden", maxHeight: openUrban ? 200 : 0, transition: "max-height 0.2s ease" }}>
              <div style={{ paddingLeft: 24, paddingTop: 2, paddingBottom: 4, display: "flex", flexDirection: "column", gap: 1 }}>
                {URBAN_SHIELD_ITEMS.map(sub => {
                  const subActive = isActive(sub.path);
                  return (
                    <button key={sub.path} onClick={() => go(sub.path)}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        width: "100%", padding: "6px 10px",
                        borderRadius: 7, border: "none",
                        background: subActive ? `${PURPLE}10` : "transparent",
                        color: subActive ? PURPLE : "#6B7280",
                        cursor: "pointer", fontSize: 12,
                        fontWeight: subActive ? 600 : 400,
                        textAlign: "left", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (!subActive) { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; } }}
                      onMouseLeave={e => { if (!subActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; } }}
                    >
                      <span style={{ width: 4, height: 4, borderRadius: "50%", flexShrink: 0, background: subActive ? PURPLE : "#D1D5DB" }} />
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "#D1D5DB", textAlign: "center", letterSpacing: "0.5px" }}>
          ASCE/SEI 41-17 · FEMA P-58 Compliant
        </div>
      </div>
    </>
  );
}

// ── Exported hook so pages know whether to show the hamburger in their top bar ──
export { useIsDesktop };

// ── Exported hamburger button — drop this into each page's top bar ────────────
export function SidebarToggleButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open navigation"
      style={{
        width: 32, height: 32,
        borderRadius: 8,
        background: "#F3F4F6",
        border: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "#374151", flexShrink: 0,
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#E9E9F0"}
      onMouseLeave={e => e.currentTarget.style.background = "#F3F4F6"}
    >
      <IconHamburger />
    </button>
  );
}

export default function Sidebar() {
  const isDesktop = useIsDesktop();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  // Expose open handler globally so pages can call it from their top bar button
  useEffect(() => {
    window.__sidebarOpen = () => setMobileOpen(true);
    return () => { delete window.__sidebarOpen; };
  }, []);

  return (
    <>
      {/* ── DESKTOP: static sidebar ── */}
      {isDesktop && (
        <aside style={{
          width: 240, minWidth: 240, flexShrink: 0,
          height: "100vh", position: "sticky", top: 0, alignSelf: "flex-start",
          background: "#fff", borderRight: "1px solid #E5E7EB",
          display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1,
        }}>
          <SidebarInner />
        </aside>
      )}

      {/* ── MOBILE: backdrop ── */}
      {!isDesktop && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.35)",
          }}
        />
      )}

      {/* ── MOBILE: slide-in drawer ── */}
      {!isDesktop && (
        <aside style={{
          position: "fixed", top: 0, left: 0,
          zIndex: mobileOpen ? 1001 : -1,
          width: 240, height: "100vh",
          background: "#fff", borderRight: "1px solid #E5E7EB",
          display: "flex", flexDirection: "column", overflow: "hidden",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: mobileOpen ? "6px 0 32px rgba(0,0,0,0.18)" : "none",
        }}>
          <SidebarInner onClose={() => setMobileOpen(false)} />
        </aside>
      )}
    </>
  );
}