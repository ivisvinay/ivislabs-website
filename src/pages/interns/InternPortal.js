import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { api, internToken } from "../../services/internApi";
import { Login, Register } from "./AuthPages";
import Dashboard from "./Dashboard";
import { Button, StatusBadge } from "./ui";
import { fmtDate } from "../../utils/internDates";

/**
 * /interns — intern portal.
 * Not signed in → login / register. Signed in but not approved → status page.
 * Approved → dashboard (daily reports, batch chat, profile & ID card).
 */
export default function InternPortal() {
  const [token, setToken] = useState(internToken.get());
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "IVIS LABS · Intern Portal";
  }, []);

  const logout = useCallback(() => {
    internToken.clear();
    setToken("");
    setMe(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setMe(await api("/api/interns/me", { token }));
      setError("");
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [token, logout]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onLogin = (t) => {
    internToken.set(t);
    setToken(t);
  };
  const onTokenChange = (t) => {
    internToken.set(t);
    setToken(t);
  };

  if (!token) {
    return (
      <Routes>
        <Route path="register" element={<Register onLogin={onLogin} />} />
        <Route path="*" element={<Login onLogin={onLogin} />} />
      </Routes>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100 text-slate-500 text-sm">
        {error ? (
          <>
            <div className="text-red-600">{error}</div>
            <Button variant="light" onClick={refresh}>
              Retry
            </Button>
          </>
        ) : (
          "Loading your portal…"
        )}
      </div>
    );
  }

  if (me.intern.status !== "approved") return <StatusPage me={me} onLogout={logout} onRefresh={refresh} />;

  return (
    <Routes>
      <Route
        path="*"
        element={
          <Dashboard me={me} token={token} onLogout={logout} onRefresh={refresh} onTokenChange={onTokenChange} />
        }
      />
      <Route path="register" element={<Navigate to="/interns" replace />} />
    </Routes>
  );
}

function StatusPage({ me, onLogout, onRefresh }) {
  const i = me.intern;
  const copy = {
    pending: {
      title: "Registration received",
      text: "Thanks for registering! The IVIS LABS team is reviewing your application. Once approved, you'll get access to your calendar, daily reports, batch chat and ID card here.",
    },
    rejected: {
      title: "Application not approved",
      text: "Unfortunately your internship application was not approved. Contact the IVIS LABS team if you think this is a mistake.",
    },
    suspended: {
      title: "Account suspended",
      text: "Your intern account is currently suspended. Please contact the IVIS LABS team.",
    },
  }[i.status] || { title: "Account inactive", text: "" };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xl font-bold text-slate-900">IVIS LABS</div>
            <div className="text-xs text-slate-500">Intern Portal</div>
          </div>
          <StatusBadge status={i.status} />
        </div>
        <h1 className="text-lg font-semibold text-slate-900 mb-2">{copy.title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{copy.text}</p>
        {i.admin_note && (
          <div className="mt-4 text-sm bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-slate-500 mb-1">NOTE FROM IVIS LABS</div>
            {i.admin_note}
          </div>
        )}
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Name</dt>
            <dd className="font-medium">{i.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Email</dt>
            <dd className="font-medium break-all">{i.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Duration</dt>
            <dd className="font-medium">{i.duration_label}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Registered on</dt>
            <dd className="font-medium">{fmtDate(i.created_at.slice(0, 10))}</dd>
          </div>
        </dl>
        <div className="mt-8 flex gap-3">
          <Button variant="light" onClick={onRefresh}>
            Check status
          </Button>
          <Button variant="ghost" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
