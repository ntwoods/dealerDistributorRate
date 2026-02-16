import { motion } from "framer-motion";
import { ShieldCheck, LoaderCircle, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CLIENT_ID,
  decodeJwt,
  initGoogleLoginButton,
  isEmailAllowed,
  requestGoogleAccessToken,
  verifyIdTokenWithServer,
} from "../lib/googleAuth";

export default function Login({ onLogin }) {
  const buttonRef = useRef(null);
  const [initializing, setInitializing] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState("");
  const [deniedReason, setDeniedReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    let cleanup;

    const setup = async () => {
      try {
        cleanup = await initGoogleLoginButton(buttonRef.current, async (credential) => {
          if (cancelled) {
            return;
          }
          setProcessing(true);
          setDeniedEmail("");
          setDeniedReason("");

          try {
            const decoded = decodeJwt(credential);
            const email = (decoded?.email || "").toLowerCase().trim();

            if (!decoded || !email) {
              throw new Error("Google did not return a valid email.");
            }

            if (!isEmailAllowed(email)) {
              setDeniedEmail(email);
              setDeniedReason("Your email is not in the allowlist.");
              toast.error("Access denied for this account.");
              return;
            }

            const verifyResult = await verifyIdTokenWithServer({
              idToken: credential,
              clientId: CLIENT_ID,
            });

            if (!verifyResult.ok) {
              setDeniedEmail(email);
              setDeniedReason(verifyResult.reason || "Server-side verification failed.");
              toast.error(verifyResult.reason || "Verification failed");
              return;
            }

            const tokenResponse = await requestGoogleAccessToken({ hint: email, prompt: "consent" });
            const expiresIn = Number(tokenResponse?.expires_in || 3600);
            const session = {
              email,
              idToken: credential,
              accessToken: tokenResponse.access_token,
              expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
            };

            toast.success("Login successful");
            onLogin(session);
          } catch (error) {
            toast.error(error?.message || "Login failed. Try again.");
          } finally {
            if (!cancelled) {
              setProcessing(false);
            }
          }
        });
      } catch (error) {
        toast.error(error?.message || "Failed to initialize Google login");
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (cleanup) {
        cleanup();
      }
    };
  }, [onLogin]);

  if (deniedEmail) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(190,24,93,0.28),transparent_55%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-xl items-center px-6 py-20">
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-10 shadow-soft backdrop-blur">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white">Access Denied</h1>
            <p className="mt-4 text-sm text-slate-300">
              {deniedReason || "Only approved accounts can use this portal."}
            </p>
            <p className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-rose-200">
              {deniedEmail}
            </p>
            <button
              onClick={() => {
                setDeniedEmail("");
                setDeniedReason("");
              }}
              className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Try another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.2),transparent_35%),radial-gradient(circle_at_75%_10%,rgba(59,130,246,0.2),transparent_28%),radial-gradient(circle_at_80%_78%,rgba(245,158,11,0.18),transparent_30%)]" />
      <div className="soft-grid absolute inset-0 opacity-50" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="grid w-full gap-8 rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-soft backdrop-blur-xl md:grid-cols-[1.1fr_1fr] md:p-8"
        >
          <section className="rounded-3xl bg-slate-950/95 p-8 text-white md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Secure Portal
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight md:text-5xl">
              Dealer Distributor Rate List
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-300 md:text-base">
              Upload dealer documents, track rate files, and manage records in one protected workspace.
              Access is restricted to approved team accounts.
            </p>
          </section>

          <section className="flex flex-col justify-center rounded-3xl border border-brand-100 bg-white p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-brand-700">Sign in</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-3 text-sm text-slate-600">
              Continue with your Google account to access the dashboard.
            </p>

            <div className="mt-8 min-h-[48px]" ref={buttonRef} />

            {(initializing || processing) && (
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-slate-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {initializing ? "Preparing sign-in..." : "Verifying access..."}
              </div>
            )}
          </section>
        </motion.div>
      </div>
    </div>
  );
}

