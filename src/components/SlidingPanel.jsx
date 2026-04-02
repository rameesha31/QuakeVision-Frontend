// import { X } from "lucide-react";
// import { useState } from "react";

// // ✅ IMPORT EXISTING SCREENS
// import SeismicInput from "../components/SeismicInput";
// import AssessmentResults from "../components/AssessmentResults";
// import SeismicTrends from "../components/SeismicTrends";
// import DownloadReport from "../components/DownloadReport";

// export default function SlidingPanel({ open, onClose }) {
//   const [activeTab, setActiveTab] = useState("input");

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-[9999] flex justify-end">
//       {/* Overlay */}
//       <div
//         className="absolute inset-0 bg-black/40"
//         onClick={onClose}
//       />

//       {/* Panel */}
//       <div className="relative w-[420px] h-full bg-[#0B1220] border-l border-slate-700 flex flex-col animate-slideIn">
//         {/* Header */}
//         <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
//           <h2 className="font-semibold">Risk Simulator</h2>
//           <X
//             size={18}
//             className="cursor-pointer hover:text-red-400"
//             onClick={onClose}
//           />
//         </div>

//         {/* Tabs */}
//         <div className="flex border-b border-slate-700">
//           {["input", "assessment", "trends", "download"].map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`flex-1 py-2 text-sm capitalize transition ${
//                 activeTab === tab
//                   ? "bg-cyan-500/20 text-white"
//                   : "text-slate-400 hover:bg-slate-800"
//               }`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {/* ✅ Render EXISTING SCREENS */}
//         <div className="flex-1 p-4 text-slate-300 text-sm overflow-y-auto">
//           {activeTab === "input" && <SeismicInput />}
//           {activeTab === "assessment" && <AssessmentResults />}
//           {activeTab === "trends" && <SeismicTrends />}
//           {activeTab === "download" && <DownloadReport />}
//         </div>
//       </div>
//     </div>
//   );
// }
import { X } from "lucide-react";
import { useState } from "react";

// ✅ IMPORT EXISTING SCREENS
import SeismicInput from "./Risk/SeismicInput";
import AssessmentResults from "./Risk/AssessmentResults";
import SeismicTrends from "./Risk/SeismicTrends";
import DownloadReport from "./Risk/DownloadReport";

export default function SlidingPanel({ open, onClose, results, setResults }) {
  const [activeTab, setActiveTab] = useState("input");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-[420px] h-full bg-[#0B1220] border-l border-slate-700 flex flex-col animate-slideIn">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="font-semibold">Risk Simulator</h2>
          <X
            size={18}
            className="cursor-pointer hover:text-red-400"
            onClick={onClose}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {["input", "assessment", "trends", "download"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm capitalize transition ${
                activeTab === tab
                  ? "bg-cyan-500/20 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Screens */}
        <div className="flex-1 p-4 text-slate-300 text-sm overflow-y-auto">
          {activeTab === "input" && (
            <SeismicInput
              onResults={(data) => {
                setResults(data);     // store backend response
                setActiveTab("assessment"); // auto-switch to results
              }}
            />
          )}

          {activeTab === "assessment" && (
            <AssessmentResults results={results} />
          )}

          {activeTab === "trends" && <SeismicTrends results={results} />}

          {activeTab === "download" && <DownloadReport results={results} />}
        </div>
      </div>
    </div>
  );
}
