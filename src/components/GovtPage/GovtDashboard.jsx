import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { Govreport as downloadGovReport } from "./Govreport";

function formatPKR(n) {
  n = Math.round(n);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}
function capFirst(s) { return String(s || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function stripMd(text) {
  if (!text) return "";
  return text.replace(/^#{1,6}\s*/gm,"").replace(/\*\*(.+?)\*\*/g,"$1").replace(/\*(.+?)\*/g,"$1")
    .replace(/^[-•]\s+/gm,"").replace(/^\d+\.\s+/gm,"").trim();
}
function safeNum(v, def = 0) { const n = Number(v); return isNaN(n) ? def : n; }

// Pakistan average household size — used when population data is missing
const AVG_PERSONS_PER_BUILDING = 6;

function AllocBar({ label, value, max, color }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2.5 rounded-full transition-all"
          style={{ width: `${Math.min((safeNum(value,0) / Math.max(safeNum(max,1),1)) * 100, 100)}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right shrink-0">{value}</span>
    </div>
  );
}

const PURPLE       = "#6B46C1";
const STOCK_COLORS = ["#EF4444","#F59E0B","#10B981"];
const BUDGET_COLORS= ["#EF4444","#F59E0B","#10B981","#3B82F6","#8B5CF6"];

export default function GovDashboard({ reportData, sessionId, onBack }) {

  // ── DEBUG LOGGING ──────────────────────────────────────────────────────────
  console.log("🏛️ GovDashboard received reportData:", reportData);
  console.log("🏛️ session_id:", sessionId);
  console.log("🏛️ visualization_data:", reportData?.visualization_data);
  console.log("🏛️ viz keys:", reportData?.visualization_data ? Object.keys(reportData.visualization_data) : "NONE");
  console.log("🏛️ project_info:", reportData?.visualization_data?.project_info);
  console.log("🏛️ building_stock:", reportData?.visualization_data?.building_stock);
  console.log("🏛️ allocation:", reportData?.visualization_data?.allocation);
  console.log("🏛️ budget_pkr:", reportData?.visualization_data?.budget_pkr);
  console.log("🏛️ impact:", reportData?.visualization_data?.impact);
  console.log("🏛️ timeline:", reportData?.visualization_data?.timeline);
  console.log("🏛️ risk_assessment_summary:", reportData?.risk_assessment_summary);
  console.log("🏛️ action_recommendations:", reportData?.action_recommendations);
  console.log("🏛️ validation_score:", reportData?.validation_score);
  console.log("🏛️ is_fallback:", reportData?.is_fallback);

  const viz    = reportData?.visualization_data || {};
  const proj   = viz.project_info   || {};
  const stock  = viz.building_stock || {};
  const alloc  = viz.allocation     || {};
  const budget = viz.budget_pkr     || {};
  const impact = viz.impact         || {};
  const tl     = viz.timeline       || {};

  // ── POPULATION — fallback to avg if 0 or missing ──────────────────────────
  const rawPopulation        = safeNum(proj.population, 0);
  const hasPopulationData    = rawPopulation > 0;
  const estimatedPopulation  = hasPopulationData
    ? rawPopulation
    : safeNum(proj.total_buildings, 0) * AVG_PERSONS_PER_BUILDING;
  const populationSubLabel   = hasPopulationData
    ? "residents in sector"
    : `est. residents (avg ${AVG_PERSONS_PER_BUILDING}/building)`;

  const riskLvl  = viz.risk_assessment?.risk_level || "Moderate";
  const riskClass = {
    Low:"bg-green-50 border-green-200 text-green-600", Moderate:"bg-amber-50 border-amber-200 text-amber-600",
    High:"bg-red-50 border-red-200 text-red-600", Severe:"bg-red-50 border-red-200 text-red-600",
    Extreme:"bg-red-50 border-red-200 text-red-600",
  }[riskLvl] || "bg-amber-50 border-amber-200 text-amber-600";

  const stockData = [
    { name: stock.kacha_label    || "Kacha (Adobe & Rubble Stone)", value: safeNum(stock.kacha_percent,0) },
    { name: stock.semi_label     || "Semi-Pacca (URM)",             value: safeNum(stock.semi_pacca_percent,0) },
    { name: stock.pacca_label    || "Pacca (RCF/RCI)",              value: safeNum(stock.pacca_percent,0) },
  ].filter(d => d.value > 0);

  const budgetData = [
    { name:"Kacha",        value: safeNum(budget.kacha,0) },
    { name:"Semi-Pacca",   value: safeNum(budget.semi_pacca,0) },
    { name:"Pacca",        value: safeNum(budget.pacca,0) },
    { name:"Engineering",  value: safeNum(budget.engineering,0) },
    { name:"QC+Awareness", value: safeNum(budget.quality_control,0) + safeNum(budget.awareness,0) },
  ].filter(d => d.value > 0);

  const maxAlloc = Math.max(safeNum(alloc.kacha,0), safeNum(alloc.semi_pacca,0), safeNum(alloc.pacca,0), 1);

  const totalMonths = safeNum(tl.total_months, 12);
  const phases = [
    { label:"Phase 1 · Pilot",      months:safeNum(tl.phases?.phase1_months,0), buildings:tl.phases?.phase1_buildings||0, desc:tl.phases?.phase1_label||"Pilot",      color:"#EF4444" },
    { label:"Phase 2 · Scale-up",   months:safeNum(tl.phases?.phase2_months,0), buildings:tl.phases?.phase2_buildings||0, desc:tl.phases?.phase2_label||"Scale-up",   color:"#F59E0B" },
    { label:"Phase 3 · Completion", months:safeNum(tl.phases?.phase3_months,0), buildings:tl.phases?.phase3_buildings||0, desc:tl.phases?.phase3_label||"Completion", color:"#10B981" },
  ].filter(p => p.months > 0);

  const actionRecs  = (reportData?.action_recommendations || []).map(a => stripMd(String(a)));
  const riskSummary = (reportData?.risk_assessment_summary || []).map(r => stripMd(String(r)));

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* HEADER */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskClass}`}>
                ◉ {riskLvl.toUpperCase()} RISK
              </span>
              <span className="text-xs text-gray-400">SIM-{sessionId?.slice(0,8)?.toUpperCase()||"——"}-GOV</span>
              {reportData?.is_validated && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-green-50 border-green-200 text-green-600">
                  ✓ Validated {reportData.validation_score}/100
                </span>
              )}
              {reportData?.is_fallback && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-600">
                  ⚠ Fallback Mode
                </span>
              )}
            </div>
            <h2 className="text-4xl font-black text-gray-900 leading-none">Urban Action Plan</h2>
            <p className="text-sm text-gray-500 mt-1">
              {proj.sector_name||"—"}, {proj.city||"Islamabad"} &nbsp;•&nbsp; Mw {proj.magnitude||"—"}
              &nbsp;•&nbsp; {safeNum(proj.retrofit_capacity,0).toLocaleString()} of {safeNum(proj.total_buildings,0).toLocaleString()} buildings
              &nbsp;•&nbsp; {estimatedPopulation.toLocaleString()} {hasPopulationData ? "population" : "est. population"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs font-semibold hover:border-gray-300 transition-all">✏ Modify</button>
            <button onClick={() => downloadGovReport(reportData)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6B46C1] text-white text-xs font-semibold hover:bg-[#5a38a8] transition-all shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* IMPACT HERO */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { val: impact.total_lives_saved??"-",   label:"Lives Saved",          sub:`At Mw ${proj.magnitude||"—"}`,                                    color:"text-emerald-500" },
            { val: safeNum(proj.retrofit_capacity,0).toLocaleString(), label:"Buildings Retrofitted", sub:`of ${safeNum(proj.total_buildings,0).toLocaleString()} total`, color:"text-blue-500" },
            { val:`PKR ${formatPKR(safeNum(budget.grand_total,0))}`,   label:"Total Budget",          sub:capFirst(proj.budget_level||"moderate"),                        color:"text-amber-500" },
            { val:`${impact.benefit_cost_ratio??"-"}x`,                label:"Benefit-Cost Ratio",    sub:`PKR ${impact.economic_benefit_millions??"-"}M economic benefit`,color:"text-[#6B46C1]" },
          ].map((s,i)=>(
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
              <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mt-1">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Risk Reduction",       val:`${impact.risk_reduction_points??"-"} pts`, sub:`${impact.current_risk_percent}% → ${impact.target_risk_percent}% sector risk`, color:"text-emerald-500" },
            { label:"Kacha Buildings",      val:alloc.kacha??"-",                           sub:"Priority allocation (70%)",                                                    color:"text-amber-500" },
            { label:"Total Sqft Covered",   val:proj.total_sqft?`${(safeNum(proj.total_sqft,0)/1000).toFixed(0)}K`:"—", sub:"sq ft across sector",                            color:"text-blue-500" },
            {
              label: "Population Protected",
              val: estimatedPopulation.toLocaleString(),
              sub: populationSubLabel,
              color: "text-emerald-500"
            },
          ].map((k,i)=>(
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">{k.label}</p>
              <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
              <p className="text-[10px] text-gray-400 mt-1">{k.sub}</p>
            </div>
          )
          )}
        </div>

        {/* Building Stock + Alloc */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Building Stock</p>
            <p className="text-[10px] text-gray-400 mb-3">Construction type distribution</p>
            {stockData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={130} height={130}>
                  <Pie data={stockData} cx={60} cy={60} innerRadius={36} outerRadius={56} dataKey="value" strokeWidth={0}>
                    {stockData.map((_,i)=><Cell key={i} fill={STOCK_COLORS[i]}/>)}
                  </Pie>
                </PieChart>
                <div className="flex flex-col gap-2 flex-1">
                  {stockData.map((d,i)=>(
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{background:STOCK_COLORS[i]}}/>
                      <span className="text-[11px] text-gray-500 flex-1">{d.name}</span>
                      <span className="text-[11px] font-bold text-gray-700">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-xs text-gray-400 italic">No building stock data in response</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Retrofit Allocation</p>
            <p className="text-[10px] text-gray-400 mb-4">Buildings by construction type priority</p>
            <AllocBar label="Kacha"      value={alloc.kacha||0}      max={maxAlloc} color="#EF4444"/>
            <AllocBar label="Semi-Pacca" value={alloc.semi_pacca||0} max={maxAlloc} color="#F59E0B"/>
            <AllocBar label="Pacca"      value={alloc.pacca||0}      max={maxAlloc} color="#10B981"/>
            <div className="pt-3 border-t border-gray-100 mt-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Priority Strategy</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-1 rounded-full bg-[#6B46C1]/10 text-[#6B46C1] border border-[#6B46C1]/20 font-semibold">
                  {proj.priority_metric||"Save Maximum Lives"}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-semibold">
                  {proj.retrofit_style||"Hybrid"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget + Risk Reduction + BCR */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Budget Allocation</p>
            <p className="text-[10px] text-gray-400 mb-3">PKR spend by category</p>
            {budgetData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={budgetData} layout="vertical" margin={{left:0,right:8,top:0,bottom:0}}>
                    <CartesianGrid stroke="#F3F4F6" strokeDasharray="4 4" horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:8,fill:"#9CA3AF"}} tickFormatter={v=>formatPKR(v)}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:"#6B7280"}} width={72}/>
                    <Tooltip contentStyle={{borderRadius:8,fontSize:10}} formatter={v=>["PKR "+formatPKR(v),"Budget"]}/>
                    <Bar dataKey="value" radius={[0,4,4,0]}>
                      {budgetData.map((_,i)=><Cell key={i} fill={BUDGET_COLORS[i%BUDGET_COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center mt-2">
                  <span className="text-[10px] text-gray-400">Grand Total</span>
                  <span className="text-sm font-black text-emerald-500">PKR {formatPKR(safeNum(budget.grand_total,0))}</span>
                </div>
              </>
            ) : <p className="text-xs text-gray-400 italic">No budget data in response</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Risk Reduction</p>
            <p className="text-[10px] text-gray-400 mb-4">Sector risk before vs after</p>
            <div className="space-y-3 mb-4">
              {[
                {label:"Before Retrofit", pct:safeNum(impact.current_risk_percent,0), color:"#EF4444"},
                {label:"After Retrofit",  pct:safeNum(impact.target_risk_percent,0),  color:"#10B981"},
              ].map(b=>(
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{b.label}</span>
                    <span className="font-semibold" style={{color:b.color}}>{b.pct}%</span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div className="h-6 rounded-lg flex items-center px-2.5"
                      style={{width:`${Math.min(b.pct,100)}%`,background:b.color}}>
                      <span className="text-[10px] text-white font-semibold">{b.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-xs font-bold text-emerald-600">▼ {impact.risk_reduction_points||"-"} point reduction</span>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Lives Saved Breakdown</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                {label:"Kacha",value:impact.lives_saved_kacha,color:"#EF4444"},
                {label:"Semi", value:impact.lives_saved_semi, color:"#F59E0B"},
                {label:"Pacca",value:impact.lives_saved_pacca,color:"#10B981"},
              ].map(s=>(
                <div key={s.label} className="text-center bg-gray-50 rounded-xl p-2 border border-gray-100">
                  <p className="text-lg font-black" style={{color:s.color}}>{s.value??"-"}</p>
                  <p className="text-[9px] text-gray-400 uppercase mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center">
            <p className="text-sm font-bold text-gray-800 mb-0.5 self-start w-full">Benefit-Cost Ratio</p>
            <p className="text-[10px] text-gray-400 mb-4 self-start">Economic return on retrofit investment</p>
            <p className="text-6xl font-black text-emerald-500 leading-none">{impact.benefit_cost_ratio??"-"}x</p>
            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">PKR benefit per PKR spent</p>
            <div className="mt-4 w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Economic Benefit</p>
              <p className="text-xl font-black text-[#6B46C1]">PKR {impact.economic_benefit_millions??"-"}M</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Damage avoidance + lives saved value</p>
            </div>
          </div>
        </div>

        {/* Implementation Phases + Gantt */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 mb-0.5">Implementation Phases</p>
          <p className="text-[10px] text-gray-400 mb-4">Estimated {totalMonths}-month sector retrofit plan</p>
          {phases.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {phases.map((p,i)=>(
                  <div key={i} className="rounded-xl border p-3" style={{borderColor:p.color+"33",background:p.color+"08"}}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{color:p.color}}>Phase {i+1}</p>
                    <p className="text-xl font-black" style={{color:p.color}}>{p.months} months</p>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{p.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{p.buildings} buildings</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-40 shrink-0"/>
                  <div className="flex-1 flex justify-between">
                    {Array.from({length:Math.min(totalMonths,18)},(_,i)=>(
                      <span key={i} className="text-[9px] text-gray-400">M{i+1}</span>
                    ))}
                  </div>
                </div>
                {(()=>{ let offset=0; return phases.map((p,i)=>{
                  const left=((offset/totalMonths)*100).toFixed(1);
                  const width=((p.months/totalMonths)*100).toFixed(1);
                  offset+=p.months;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-40 text-right shrink-0">{p.label}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full relative overflow-hidden">
                        <div className="absolute h-6 rounded-full flex items-center px-2.5"
                          style={{left:`${left}%`,width:`${width}%`,background:p.color}}>
                          <span className="text-[10px] text-white font-semibold">{p.months}mo</span>
                        </div>
                      </div>
                    </div>
                  );
                }); })()}
              </div>
            </>
          ) : <p className="text-xs text-gray-400 italic">No phase data in response</p>}
        </div>

        {/* Risk Summary */}
        {riskSummary.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800 mb-3">Risk Assessment Summary</p>
            <div className="space-y-2">
              {riskSummary.map((r,i)=>(
                <div key={i} className="flex gap-2 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-[#6B46C1] shrink-0 mt-0.5 text-xs">◈</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Policy Recommendations */}
        {actionRecs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Policy Recommendations</p>
            <p className="text-[10px] text-gray-400 mb-4">Priority actions for sector resilience</p>
            <div className="grid grid-cols-2 gap-3">
              {actionRecs.map((a,i)=>(
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-[#6B46C1] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}