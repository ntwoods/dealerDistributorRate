import { useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import {
  ALLOWED_EMAILS,
  clearSession,
  getStoredSession,
  isEmailAllowed,
  saveSession,
} from "./lib/googleAuth";

function AccessDenied({ email, onLogout }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.35),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-2xl items-center px-6 py-20">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-10 shadow-soft backdrop-blur">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">
            Access Denied
          </p>
          <h1 className="font-display text-3xl font-bold text-white">
            This account is not authorized.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Signed in as <span className="font-semibold text-white">{email || "Unknown"}</span>.
            Only allowlisted emails can access Dealer Distributor Rate List.
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Allowed Emails
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-200">
              {ALLOWED_EMAILS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={onLogout}
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => getStoredSession());

  const canAccess = useMemo(() => {
    if (!session?.email) {
      return false;
    }
    return isEmailAllowed(session.email);
  }, [session]);

  const handleLogin = (nextSession) => {
    saveSession(nextSession);
    setSession(nextSession);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            border: "1px solid #d1fae5",
            background: "#ecfeff",
            color: "#0f172a",
          },
        }}
      />
      {!session ? (
        <Login onLogin={handleLogin} />
      ) : canAccess ? (
        <Dashboard session={session} onLogout={handleLogout} onSessionInvalid={handleLogout} />
      ) : (
        <AccessDenied email={session?.email} onLogout={handleLogout} />
      )}
    </>
  );
}

