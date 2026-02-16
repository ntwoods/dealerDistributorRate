const SESSION_KEY = "dealer_docs_session";

export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const ALLOWED_EMAILS = [
  "mis01@ntwoods.com",
  "parakhagrawalntw@gmail.com",
  "info@ntwoods.com",
  "pawanagarwalntw@gmail.com",
  "nitishagarwalntw@gmail.com",
  "ea01@ntwoods.com",
];

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

export function isEmailAllowed(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return ALLOWED_EMAILS.includes(normalized);
}

export function decodeJwt(idToken) {
  try {
    const payload = idToken.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function ensureClientId() {
  if (!CLIENT_ID) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is missing.");
  }
}

async function waitForGoogleScript() {
  ensureClientId();
  if (window.google?.accounts) {
    return window.google;
  }

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Google Identity Services failed to load."));
    }, 10000);

    const check = () => {
      if (window.google?.accounts) {
        clearTimeout(timeout);
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };

    check();
  });

  return window.google;
}

export async function initGoogleLoginButton(container, onCredential) {
  if (!container) {
    throw new Error("Google login container is missing.");
  }

  const google = await waitForGoogleScript();

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: ({ credential }) => onCredential(credential),
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  google.accounts.id.renderButton(container, {
    theme: "outline",
    shape: "pill",
    size: "large",
    text: "continue_with",
    width: "290",
  });

  return () => {
    google.accounts.id.cancel();
  };
}

export async function requestGoogleAccessToken({ hint, prompt = "consent" } = {}) {
  const google = await waitForGoogleScript();

  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response?.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        resolve(response);
      },
    });

    tokenClient.requestAccessToken({
      prompt,
      hint,
    });
  });
}

export async function verifyIdTokenWithServer({ idToken, clientId }) {
  const endpoint = import.meta.env.VITE_APPS_SCRIPT_WEBAPP_URL;
  if (!endpoint) {
    throw new Error("VITE_APPS_SCRIPT_WEBAPP_URL is missing.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify({ idToken, clientId }),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = { ok: false, reason: "Invalid server response" };
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: payload?.reason || `Server verification failed (${response.status})`,
      email: payload?.email || "",
    };
  }

  return {
    ok: Boolean(payload?.ok),
    email: payload?.email || "",
    reason: payload?.reason || "",
  };
}

export function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getStoredSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() >= Number(parsed.expiresAt)) {
      clearSession();
      return null;
    }
    if (!parsed?.email || !parsed?.accessToken || !parsed?.idToken) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

