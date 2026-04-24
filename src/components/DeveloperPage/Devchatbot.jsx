import { useState, useEffect, useRef } from "react";

const WS_BASE = "wss://kashafimaan-quakevisionfyp-backend.hf.space/api/v1";

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatPKR(n) {
  n = Math.round(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
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
    .replace(/\|/g, " · ")
    .replace(/^[-•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s{2,}/g, " ")
    .replace(/·\s*·/g, "·")
    .trim();
}

const miniBtnCls =
  "flex-1 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] text-gray-500 font-medium text-center cursor-pointer hover:bg-gray-50 transition-all";

export default function Devchatbot({ sessionId, reportData }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [ws,       setWs]       = useState(null);
  const [wsReady,  setWsReady]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    if (!sessionId) {
      addBot("👋 Configure your development project parameters and run the feasibility analysis.", "message");
    } else {
      addBot(
        `✅ Feasibility report ready! Validation score: ${reportData?.validation_score || "—"}/100. What would you like to explore?`,
        "options"
      );
      try {
        const socket = new WebSocket(`${WS_BASE}/chat/ws/${sessionId}`);
        socket.onopen    = () => setWsReady(true);
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBot  = (text, uiType = "message", data = {}) =>
    setMessages(p => [...p, { role: "bot", text, uiType, data, time: now() }]);
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
        const items = (reportData?.risk_assessment_summary || [])
          .map((r, i) => `${i + 1}. ${stripMd(r)}`)
          .join("\n\n");
        addBot("Here is your feasibility summary:", "summary", { summary: items });
      }
    } else if (action === "qa") {
      addUser("❓ Ask a Question");
      addBot("Ask me anything — ROI, costs, timeline, risk scores, or structural analysis.", "message");
    } else if (action === "regenerate") {
      addUser("🔄 Regenerate");
      if (!sendWs("regenerate")) {
        addBot("Select parameters to change:", "regen_params", {});
      }
    } else if (action === "update_dashboard") {
      addUser("✅ Update Dashboard");
      addBot("Dashboard updated with the latest report.", "message");
    } else if (action === "keep_dashboard") {
      addUser("❌ Keep Current");
      addBot("Kept the current dashboard.", "message");
    }
  };

  const applyRegen = async () => {
    const timeline = document.getElementById("regen-timeline-dev")?.value;
    const budget   = document.getElementById("regen-budget-dev")?.value;
    const ptype    = document.getElementById("regen-ptype-dev")?.value;
    addUser(`Regenerate: ${timeline}mo · ${budget} budget · ${ptype}`);
    if (!sendWs(JSON.stringify({
      regen_params: { timeline_months: parseInt(timeline), budget_level: budget, project_type: ptype },
    }))) {
      addBot("Regenerating feasibility report...", "message");
      await new Promise(r => setTimeout(r, 1400));
      addBot("Report regenerated.", "regen_result", {
        changes_applied: [
          `Timeline: ${timeline}mo`,
          `Budget: ${budget}`,
          `Project Type: ${ptype}`,
        ],
      });
    }
  };

  const sendChat = async () => {
    const text = input.trim(); if (!text) return;
    setInput(""); addUser(text);
    if (sendWs(text)) return;

    await new Promise(r => setTimeout(r, 600));
    const lower = text.toLowerCase();
    const viz   = reportData?.visualization_data || {};
    const risk  = viz.risk_assessment || {};
    const costs = viz.cost_options || {};
    let response = "";

    if (!sessionId) {
      response = "Please run a feasibility analysis first. Configure the parameters on the left and click Generate Feasibility Report.";
    } else if (lower.includes("roi") || lower.includes("payback") || lower.includes("return")) {
      response = `ROI payback period: ${costs.roi_payback_years || "—"} years with ${costs.insurance_savings_pct || 20}% insurance savings and +${costs.resale_premium_pct || 5}% resale premium.`;
    } else if (lower.includes("cost") || lower.includes("budget") || lower.includes("pkr")) {
      response = `Total Project Cost: PKR ${formatPKR(costs.total_project_pkr || 0)}\n\nSeismic Upgrade: PKR ${formatPKR(costs.seismic_upgrade_pkr || 0)}\nContingency (5%): PKR ${formatPKR(costs.contingency_pkr || 0)}`;
    } else if (lower.includes("surviv") || lower.includes("safe") || lower.includes("risk")) {
      response = `Survival probability: ${Math.round(risk.survival_probability || 0)}% at Mw ${viz.project_info?.magnitude || "—"} — classified as ${risk.risk_level || "—"} risk.`;
    } else if (lower.includes("timeline") || lower.includes("month") || lower.includes("schedule")) {
      const phases = viz.timeline?.phases || {};
      response = Object.entries(phases).slice(0, 5)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}mo`)
        .join("\n") || "No timeline data.";
    } else if (lower.includes("action") || lower.includes("recommend")) {
      const recs = (reportData?.action_recommendations || [])
        .map(a => stripMd(a))
        .filter(a => a && !/^[A-Z0-9\s\-–—:()/]+$/.test(a))
        .slice(0, 3);
      response = recs.map((a, i) => `${i + 1}. ${a}`).join("\n\n") || "No recommendations available.";
    } else {
      response = `Feasibility summary: ${Math.round(risk.survival_probability || 0)}% survival probability at Mw ${viz.project_info?.magnitude || "—"}. Total project cost: PKR ${formatPKR(costs.total_project_pkr || 0)}. Risk level: ${risk.risk_level || "—"}.`;
    }
    addBot(response, "message");
  };

  const renderBubble = (msg, i) => {
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
            { key: "summary",    icon: "📋", label: "Summary",       desc: "Quick feasibility overview" },
            { key: "qa",         icon: "❓", label: "Ask a Question", desc: "ROI, costs, timeline analysis" },
            { key: "regenerate", icon: "🔄", label: "Regenerate",     desc: "Modify parameters & re-run" },
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
            <button onClick={() => chatAction("qa")} className={miniBtnCls}>Ask follow-up</button>
            <button onClick={() => chatAction("regenerate")} className={miniBtnCls + " !border-[#6B46C1]/30 !text-[#6B46C1] !bg-[#6B46C1]/5"}>Regenerate</button>
          </div>
        </>
      );

    } else if (uiType === "regen_params") {
      const p = reportData?.visualization_data?.project_info || {};
      extra = (
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Timeline (months)</p>
            <input id="regen-timeline-dev" type="number" defaultValue={p.timeline_months || 18}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-[#6B46C1]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Budget</p>
            <select id="regen-budget-dev" defaultValue={p.budget_level || "moderate"}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-[#6B46C1]">
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Project Type</p>
            <select id="regen-ptype-dev" defaultValue={p.project_type || "commercial"}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-[#6B46C1]">
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed_use">Mixed Use</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
          <button onClick={applyRegen}
            className="w-full py-2 rounded-lg bg-[#6B46C1] text-white text-xs font-bold hover:bg-[#5a38a8] transition-all">
            Apply & Regenerate
          </button>
        </div>
      );

    } else if (uiType === "regen_result") {
      extra = (
        <>
          <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-3 text-[11px] text-green-700 space-y-1">
            <p className="font-semibold mb-1">Changes applied:</p>
            {(data.changes_applied || []).map((c, i) => (
              <p key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {c}
              </p>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => chatAction("keep_dashboard")} className={miniBtnCls}>Keep Current</button>
            <button onClick={() => chatAction("update_dashboard")} className={miniBtnCls + " !border-[#6B46C1]/30 !text-[#6B46C1] !bg-[#6B46C1]/5"}>Update Dashboard</button>
          </div>
        </>
      );
    }

    return (
      <div key={i} className="flex flex-col items-start">
        <div className="bg-white border border-gray-200 text-gray-700 text-xs rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[95%] leading-relaxed shadow-sm whitespace-pre-line">
          {text}
          {extra}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">{time}</span>
      </div>
    );
  };

  return (
    <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
          <span className="text-sm font-bold text-gray-800">QuakeVision AI</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
            Dev Analyst
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">Feasibility intelligence</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((m, i) => renderBubble(m, i))}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2.5 border-t border-gray-100 flex gap-2 items-end shrink-0">
        <textarea
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
          }}
          placeholder="Ask about ROI, costs, timeline..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#6B46C1] resize-none max-h-20 leading-relaxed"
        />
        <button onClick={sendChat}
          className="w-8 h-8 rounded-xl bg-[#6B46C1] flex items-center justify-center shrink-0 hover:bg-[#5a38a8] transition-all">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
