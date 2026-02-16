import { motion } from "framer-motion";
import { LogOut, UserCircle2 } from "lucide-react";

export default function TopBar({ userEmail, onLogout }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-soft backdrop-blur sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-brand-700">Portal</p>
          <h1 className="font-display text-2xl font-bold text-slate-900">Dealer Distributor Rate List</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <UserCircle2 className="h-4 w-4" />
            <span className="max-w-[220px] truncate font-medium">{userEmail}</span>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </motion.header>
  );
}

