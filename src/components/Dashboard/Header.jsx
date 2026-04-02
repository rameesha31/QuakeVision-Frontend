import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";

export default function Header() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => d.data()));
    });
    return () => unsub();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between w-full">
        {/* Left: title + live pulse */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B46C1] mb-0.5">
              QuakeVision AI
            </p>
            <h2 className="text-xl font-black text-gray-900 leading-none">
              Intelligence Dashboard
            </h2>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Right: Bell icon */}
        <div className="relative cursor-pointer" onClick={() => setShowNotifications(p => !p)}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            showNotifications ? "bg-[#6B46C1] text-white" : "bg-gray-100 hover:bg-[#6B46C1]/10 text-gray-500 hover:text-[#6B46C1]"
          }`}>
            <Bell size={16} />
          </div>
          {notifications.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
              {notifications.length}
            </span>
          )}
        </div>
      </div>

      {/* Notification panel */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-[998]"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-2xl z-[999] flex flex-col">
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <p className="font-black text-gray-900 text-sm">Notifications</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {notifications.length} alert{notifications.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Bell size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No notifications</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={i}
                    className="px-5 py-4 border-b border-gray-100 hover:bg-[#6B46C1]/4 transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#6B46C1] shrink-0 mt-1.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}