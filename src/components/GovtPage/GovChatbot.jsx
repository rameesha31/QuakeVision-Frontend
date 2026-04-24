import { useState, useEffect, useRef } from "react";

const WS_BASE = "wss://kashafimaan-quakevisionfyp-backend.hf.space/api/v1";

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatPKR(n) {
  n = Math.round(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(0) + "M";
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

export default function GovChatbot({ sessionId, reportData }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [ws,       setWs]       = useState(null);
  const [wsReady,  setWsReady]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    if (!sessionId) {
      addBot("👋 Configure sector parameters and run the urban resilience simulation.", "message");
    } else {
      addBot(
        `✅ Action plan ready! Validation score: ${reportData?.validation_score || "—"}/100. What would you like to explore?`,
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
        addBot("Here is the urban policy summary:", "summary", { summary: items });
      }
    } else if (action === "qa") {
      addUser("❓ Ask a Question");
      addBot("Ask me about lives saved, budget breakdown, retrofit priorities, timeline, or benefit-cost ratio.", "message");
    } else if (action === "regenerate") {
      addUser("🔄 Regenerate");
      if (!sendWs("regenerate")) {
        addBot("Select parameters to modify:", "regen_params", {});
      }
    } else if (action === "update_dashboard") {
      addUser("✅ Update Dashboard");
      addBot("Dashboard updated with the new action plan.", "message");
    } else if (action === "keep_dashboard") {
      addUser("❌ Keep Current");
      addBot("Kept the current dashboard.", "message");
    }
  };

  const applyRegen = async () => {
    const timeline = document.getElementById("regen-timeline-gov")?.value;
    const budget   = document.getElementById("regen-budget-gov")?.value;
    const capacity = document.getElementById("regen-capacity-gov")?.value;
    const priority = document.getElementById("regen-priority-gov")?.value;
    const style    = document.getElementById("regen-style-gov")?.value;
    addUser(`Regenerate: ${timeline}mo · ${budget} budget · ${capacity} buildings`);
    if (!sendWs(JSON.stringify({
      regen_params: { timeline_months: parseInt(timeline), budget_level: budget, retrofit_capacity: parseInt(capacity), priority_metric: priority, retrofit_style: style },
    }))) {
      addBot("Regenerating urban action plan...", "message");
      await new Promise(r => setTimeout(r, 1600));
      addBot("Action plan regenerated.", "regen_result", {
        changes_applied: [
          `Timeline: ${timeline} months`,
          `Budget: ${budget}`,
          `Retrofit capacity: ${capacity} buildings`,
          `Priority: ${priority}`,
          `Style: ${style}`,
        ],
      });
    }
  };

  const sendChat = async () => {
    const text = input.trim(); if (!text) return;
    setInput(""); addUser(text);
    if (sendWs(text)) return;

    await new Promise(r => setTimeout(r, 700));
    const lower  = text.toLowerCase();
    const viz    = reportData?.visualization_data || {};
    const impact = viz.impact       || {};
    const budget = viz.budget_pkr   || {};
    const alloc  = viz.allocation   || {};
    const proj   = viz.project_info || {};
    let response = "";

    if (!sessionId) {
      response = "Please run a simulation first. Configure the parameters on the left and click Generate Urban Action Plan.";
    } else if (lower.includes("live") || lower.includes("death") || lower.includes("casualt") || lower.includes("save")) {
      response = `Lives saved: ${impact.total_lives_saved} total.\n\nKacha structures: ${impact.lives_saved_kacha} lives — highest impact with 70% of allocation.\nSemi-Pacca: ${impact.lives_saved_semi} lives.\nPacca: ${impact.lives_saved_pacca} lives.\n\nPrioritizing Kacha first maximizes life-saving outcome.`;
    } else if (lower.includes("budget") || lower.includes("cost") || lower.includes("pkr") || lower.includes("money")) {
      response = `Total Budget: PKR ${formatPKR(budget.grand_total)}\n\nKacha retrofit: PKR ${formatPKR(budget.kacha)}\nSemi-Pacca: PKR ${formatPKR(budget.semi_pacca)}\nPacca: PKR ${formatPKR(budget.pacca)}\nEngineering: PKR ${formatPKR(budget.engineering)}\nQC + Awareness: PKR ${formatPKR((budget.quality_control || 0) + (budget.awareness || 0))}`;
    } else if (lower.includes("bcr") || lower.includes("benefit") || lower.includes("roi") || lower.includes("return")) {
      response = `Benefit-Cost Ratio: ${impact.benefit_cost_ratio}x — every PKR 1 spent returns PKR ${impact.benefit_cost_ratio} in economic benefit.\n\nTotal economic benefit: PKR ${impact.economic_benefit_millions}M`;
    } else if (lower.includes("kacha") || lower.includes("semi") || lower.includes("pacca") || lower.includes("stock")) {
      response = `Building stock in ${proj.sector_name}:\n\nKacha (${viz.building_stock?.kacha_percent}%): Adobe & Rubble Stone — highest risk, ${alloc.kacha} buildings allocated.\nSemi-Pacca (${viz.building_stock?.semi_pacca_percent}%): URM — ${alloc.semi_pacca} buildings.\nPacca (${viz.building_stock?.pacca_percent}%): RCF/RCI — ${alloc.pacca} buildings.`;
    } else if (lower.includes("time") || lower.includes("phase") || lower.includes("month") || lower.includes("schedule")) {
      const tl = viz.timeline || {};
      response = `Total timeline: ${tl.total_months} months across 3 phases.\n\nPhase 1 (${tl.phases?.phase1_months}mo): ${tl.phases?.phase1_label}\nPhase 2 (${tl.phases?.phase2_months}mo): ${tl.phases?.phase2_label}\nPhase 3 (${tl.phases?.phase3_months}mo): ${tl.phases?.phase3_label}`;
    } else if (lower.includes("risk") || lower.includes("reduc") || lower.includes("vuln")) {
      response = `Risk reduction: ${impact.current_risk_percent}% down to ${impact.target_risk_percent}% — a ${impact.risk_reduction_points}-point reduction in sector-level seismic risk.`;
    } else {
      response = `Urban action plan for ${proj.sector_name}: ${impact.total_lives_saved} lives saved, ${alloc.total} buildings retrofitted, PKR ${formatPKR(budget.grand_total)} total budget, ${impact.benefit_cost_ratio}x benefit-cost ratio over ${proj.timeline_months} months.`;
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
            { key: "summary",    icon: "📋", label: "Summary",       desc: "Quick policy overview" },
            { key: "qa",         icon: "❓", label: "Ask a Question", desc: "Lives, budget, timeline analysis" },
            { key: "regenerate", icon: "🔄", label: "Regenerate",     desc: "Modify policy parameters" },
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
            <input id="regen-timeline-gov" type="number" defaultValue={p.timeline_months || 12}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-[#6B46C1]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Budget</p>
            <select id="regen-budget-gov" defaultValue={p.budget_level || "moderate"}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-[#6B46C1]">
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Retrofit Capacity</p>
            <input id="regen-capacity-gov" type="number" defaultValue={p.retrofit_capacity || 200}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-[#6B46C1]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Priority Metric</p>
            <select id="regen-priority-gov" defaultValue={p.priority_metric || "Save Maximum Lives"}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-[#6B46C1]">
              <option value="Save Maximum Lives">Save Maximum Lives</option>
              <option value="Reduce Sector Vulnerability">Reduce Vulnerability</option>
              <option value="Optimize Resource Allocation">Optimize Resources</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Retrofit Style</p>
            <select id="regen-style-gov" defaultValue={p.retrofit_style || "Hybrid"}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-[#6B46C1]">
              <option value="Low-cost">Low-cost</option>
              <option value="Structural">Structural</option>
              <option value="Hybrid">Hybrid</option>
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
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            Policy Analyst
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">Urban resilience planning</p>
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
          placeholder="Ask about budget, lives saved, timeline..."
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
