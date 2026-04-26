import { useState, useEffect, useRef } from "react";

const WS_BASE = "wss://kashafimaan-quakevisionfyp-backend.hf.space/api/v1";

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatPKR(n) {
  n = Math.round(n);
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return n.toString();
}

function stripMd(text) {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\|/g, " - ")
    .replace(/^[-•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildSummary(reportData) {
  const viz   = reportData?.visualization_data || {};
  const risk  = viz.risk_assessment || {};
  const proj  = viz.project_info || {};
  const costs = viz.cost_options || {};
  const rec   = costs[costs.recommended || "standard"] || {};

  const lines = [];

  if (proj.building_type || proj.material) {
    lines.push(
      `This report covers a ${proj.material || ""} ${proj.building_type?.replace(/_/g, " ") || ""} structure located in ${proj.site || "your area"}.`
        .replace(/\s+/g, " ").trim()
    );
  }

  const surv = Math.round(risk.survival_probability || 0);
  if (surv > 0) {
    lines.push(
      `The structure has a ${surv}% survival probability at magnitude Mw ${proj.magnitude || "—"}, classified as ${risk.risk_level || "—"} risk.`
    );
  }

  if (rec.total_pkr > 0) {
    lines.push(
      `The recommended retrofit package costs PKR ${formatPKR(rec.total_pkr)} and takes approximately ${rec.weeks || "?"} weeks to complete.`
    );
  }

  const recs = (reportData?.risk_assessment_summary || [])
    .map(r => stripMd(r))
    .filter(r => r && r.length > 10)
    .slice(0, 3);
  if (recs.length > 0) {
    lines.push("Key risk factors identified:");
    recs.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
  }

  return lines.join("\n\n") || "No summary data available.";
}

const miniBtnCls =
  "flex-1 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] text-gray-500 font-medium text-center cursor-pointer hover:bg-gray-50 transition-all";

// Shared bubble renderer (plain function, not a component, so no hook rules)
function renderBubble(msg, i, chatAction) {
  const { role, text, uiType, data, time } = msg;

  if (role === "user") {
    return (
      <div key={i} className="flex flex-col items-end">
        <div className="bg-[#6B46C1] text-white text-xs rounded-xl rounded-br-sm px-3 py-2.5 max-w-[90%] leading-relaxed">
          {text}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">{time}</span>
      </div>
    );
  }

  let extra = null;

  if (uiType === "options") {
    extra = (
      <div className="flex flex-col gap-1.5 mt-2">
        {[
          { key: "summary", icon: "📋", label: "Summary", desc: "Quick report overview" },
          { key: "qa",      icon: "❓", label: "Ask a Question", desc: "Free-form analysis" },
        ].map(o => (
          <button key={o.key} onClick={() => chatAction(o.key)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-left hover:border-[#6B46C1]/40 transition-all w-full">
            <span className="text-base w-5 text-center">{o.icon}</span>
            <div>
              <span className="text-xs font-semibold text-gray-700">{o.label}</span>
              <span className="block text-[10px] text-gray-400">{o.desc}</span>
            </div>
          </button>
        ))}
      </div>
    );
  } else if (uiType === "summary") {
    extra = (
      <>
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">
          {data.summary || ""}
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => chatAction("qa")} className={miniBtnCls}>
            Ask follow-up
          </button>
        </div>
      </>
    );
  }

  return (
    <div key={i} className="flex flex-col items-start">
      <div className="bg-white border border-gray-200 text-gray-700 text-xs rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[95%] leading-relaxed shadow-sm whitespace-pre-line break-words">
        {text}
        {extra}
      </div>
      <span className="text-[10px] text-gray-400 mt-1 px-1">{time}</span>
    </div>
  );
}

export default function HomeChatbot({ sessionId, reportData, onReportUpdate, mobileMode = false }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [ws,        setWs]        = useState(null);
  const [wsReady,   setWsReady]   = useState(false);
  const [floatOpen, setFloatOpen] = useState(false);
  const [unread,    setUnread]    = useState(0);
  const bottomRef = useRef(null);

  // ── Init / session change ──────────────────────────────────────────────────
  useEffect(() => {
    setMessages([]);
    setUnread(0);

    if (!sessionId) {
      addBot(
        "👋 Hello! Configure the parameters on the left and run a simulation to generate your seismic intelligence report.",
        "message"
      );
    } else {
      addBot(
        `✅ Report ready! Validation score: ${reportData?.validation_score || "—"}/100. What would you like to do?`,
        "options"
      );
      try {
        const socket = new WebSocket(`${WS_BASE}/chat/ws/${sessionId}`);
        socket.onopen = () => setWsReady(true);
        socket.onmessage = (e) => {
          try { handleServerMsg(JSON.parse(e.data)); } catch (_) {}
        };
        socket.onerror = () => setWsReady(false);
        setWs(socket);
        return () => socket.close();
      } catch (_) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mobileMode || floatOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, floatOpen, mobileMode]);

  // ── Clear unread when panel opens ─────────────────────────────────────────
  useEffect(() => {
    if (floatOpen) setUnread(0);
  }, [floatOpen]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addBot = (text, uiType = "message", data = {}) => {
    setMessages(p => [...p, { role: "bot", text, uiType, data, time: now() }]);
    if (mobileMode && !floatOpen) setUnread(n => n + 1);
  };
  const addUser = (text) =>
    setMessages(p => [...p, { role: "user", text, time: now() }]);

  const handleServerMsg = ({ ui_type, message, data }) =>
    addBot(stripMd(message), ui_type || "message", data || {});

  const sendWs = (payload) => {
    if (ws && wsReady && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message: payload }));
      return true;
    }
    return false;
  };

  const chatAction = async (action) => {
    if (action === "summary") {
      addUser("📋 Summary");
      if (!sendWs("summary")) {
        const summaryText = buildSummary(reportData);
        addBot("Here is your report summary:", "summary", { summary: summaryText });
      }
    } else if (action === "qa") {
      addUser("❓ Ask a Question");
      addBot(
        "Ask me anything about the report — risk scores, costs, retrofit steps, or action recommendations.",
        "message"
      );
    }
  };

  const sendChat = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    addUser(text);
    if (sendWs(text)) return;

    await new Promise(r => setTimeout(r, 600));
    const lower = text.toLowerCase();
    const viz   = reportData?.visualization_data || {};
    const risk  = viz.risk_assessment || {};
    const costs = viz.cost_options || {};
    const rec   = costs[costs.recommended || "standard"] || {};
    let response = "";

    if (!sessionId) {
      response = "Please run a simulation first to generate a report. Configure the parameters on the left and click Generate Intelligence Report.";
    } else if (lower.includes("surviv") || lower.includes("safe") || lower.includes("probabilit")) {
      response = `Your structure has a ${Math.round(risk.survival_probability || 0)}% survival probability at Mw ${viz.project_info?.magnitude || "?"}, classified as ${risk.risk_level || "—"} risk.`;
    } else if (lower.includes("cost") || lower.includes("budget") || lower.includes("pkr")) {
      response = `Recommended (${rec.label || "Standard"}): PKR ${formatPKR(rec.total_pkr || 0)} over ${rec.weeks || "?"}w.\n\nBasic: PKR ${formatPKR(costs.basic?.total_pkr || 0)}\nComprehensive: PKR ${formatPKR(costs.comprehensive?.total_pkr || 0)}`;
    } else if (lower.includes("action") || lower.includes("recommend") || lower.includes("fix")) {
      const recs = (reportData?.action_recommendations || [])
        .map(a => stripMd(a))
        .filter(a => a && !/^[A-Z0-9\s\-–—:()/]+$/.test(a))
        .slice(0, 3);
      response = recs.map((a, i) => `${i + 1}. ${a}`).join("\n\n") || "No recommendations available.";
    } else if (lower.includes("step") || lower.includes("retrofit") || lower.includes("repair")) {
      const steps = viz.retrofit_steps || {};
      response =
        Object.entries(steps)
          .slice(0, 4)
          .map(([k, s], i) => `${i + 1}. ${k.replace(/_/g, " ")}: ${s.weeks}w — PKR ${formatPKR(s.cost_pkr || 0)}`)
          .join("\n") || "No step data available.";
    } else {
      response = `Based on the analysis: ${Math.round(risk.survival_probability || 0)}% survival probability at Mw ${viz.project_info?.magnitude || "?"}. Recommended retrofit: PKR ${formatPKR(rec.total_pkr || 0)} over ${rec.weeks || "?"}w. What would you like to explore?`;
    }
    addBot(response, "message");
  };

  // Shared input bar JSX
  const InputBar = (
    <div className="px-3 py-2.5 border-t border-gray-100 flex gap-2 items-end shrink-0 bg-white">
      <textarea
        rows={1}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
        }}
        placeholder="Ask about structural integrity..."
        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#6B46C1] resize-none max-h-20 leading-relaxed"
      />
      <button onClick={sendChat}
        className="w-8 h-8 rounded-xl bg-[#6B46C1] flex items-center justify-center shrink-0 hover:bg-[#5a38a8] transition-all">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
        </svg>
      </button>
    </div>
  );

  // Shared message list JSX
  const MessageList = (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      {messages.map((m, i) => renderBubble(m, i, chatAction))}
      <div ref={bottomRef} />
    </div>
  );

  // Desktop sidebar
  if (!mobileMode) {
    return (
      <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
            <span className="text-sm font-bold text-gray-800">QuakeVision AI</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              Structural Specialist
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">AI-powered report analysis</p>
        </div>
        {MessageList}
        {InputBar}
      </div>
    );
  }

  // Mobile: floating panel + FAB
  return (
    <>
      {floatOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            width:  "min(360px, calc(100vw - 32px))",
            height: "min(520px, calc(100vh - 120px))",
          }}
        >
          <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between bg-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
                <span className="text-sm font-bold text-gray-800">QuakeVision AI</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  Structural Specialist
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">AI-powered report analysis</p>
            </div>
            <button
              onClick={() => setFloatOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {MessageList}
          {InputBar}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setFloatOpen(o => !o)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-[#6B46C1] hover:bg-[#5a38a8] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Toggle AI Chat"
      >
        {floatOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!floatOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}