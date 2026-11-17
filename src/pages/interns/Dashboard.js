import React, { useCallback, useEffect, useState } from "react";
import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../services/internApi";
import useChat from "./useChat";
import ReportCalendar from "./ReportCalendar";
import ChatPanel from "./ChatPanel";
import ProfilePanel from "./ProfilePanel";
import { Avatar, Alert } from "./ui";
import { fmtDate } from "../../utils/internDates";

export default function Dashboard({ me, token, onLogout, onRefresh, onTokenChange }) {
  const intern = me.intern;
  // onRefresh re-reads the profile when an admin changes this intern's batch,
  // dates or status (pushed live over the chat socket).
  const chat = useChat(token, intern.id, { onSelfChange: onRefresh });
  const navigate = useNavigate();

  // Unread count in the browser tab title.
  useEffect(() => {
    document.title = `${chat.totalUnread ? `(${chat.totalUnread}) ` : ""}IVIS LABS · Intern Portal`;
  }, [chat.totalUnread]);

  // Auto-dismiss ping banner.
  useEffect(() => {
    if (!chat.pingAlert) return undefined;
    const t = setTimeout(chat.dismissPing, 8000);
    return () => clearTimeout(t);
  }, [chat.pingAlert, chat.dismissPing]);

  const tab = ({ isActive }) =>
    `relative px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
      isActive ? "border-blue-500 text-white" : "border-transparent text-slate-300 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 pt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold leading-tight">IVIS LABS · Intern Portal</div>
            <div className="text-xs text-slate-400 truncate">
              {intern.intern_code} · {me.batch ? me.batch.name : "No batch"} · {fmtDate(intern.start_date)} – {fmtDate(intern.end_date)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 text-sm text-slate-300">
              <Avatar id={intern.id} name={intern.full_name} hasPhoto={intern.has_photo} photoPath={`/api/interns/photo/${intern.id}`} token={token} version={intern.photo_updated_at} size={28} />
              {intern.full_name}
            </span>
            <button onClick={onLogout} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg whitespace-nowrap">
              Sign out
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 sm:px-3 flex overflow-x-auto">
          <NavLink to="/interns/reports" className={tab}>
            Calendar & Reports
          </NavLink>
          <NavLink to="/interns/chat" className={tab}>
            Chat
            {chat.totalUnread > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 align-top">
                {chat.totalUnread > 99 ? "99+" : chat.totalUnread}
              </span>
            )}
          </NavLink>
          <NavLink to="/interns/profile" className={tab}>
            Profile & ID Card
          </NavLink>
        </nav>
      </header>

      {chat.pingAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-md">
          <div className="bg-amber-400 text-slate-900 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-bounce">
            <span className="text-2xl">🔔</span>
            <div className="flex-1 text-sm">
              <b>{chat.pingAlert.sender_name}</b> pinged you{chat.pingAlert.where}
            </div>
            <button
              className="text-sm font-semibold bg-slate-900 text-white rounded-lg px-3 py-1.5"
              onClick={() => {
                chat.dismissPing();
                navigate(`/interns/chat?c=${chat.pingAlert.conversation_id}`);
              }}
            >
              Open
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-5 py-6">
        <Routes>
          <Route path="reports" element={<ReportsTab me={me} token={token} />} />
          <Route path="chat" element={<ChatPanel chat={chat} me={intern} token={token} />} />
          <Route path="profile" element={<ProfilePanel me={me} token={token} onRefresh={onRefresh} onTokenChange={onTokenChange} />} />
          <Route path="*" element={<Navigate to="/interns/reports" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function ReportsTab({ me, token }) {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setReports((await api("/api/interns/reports", { token })).reports);
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (date, data) => {
    const r = await api(`/api/interns/reports/${date}`, { method: "PUT", body: data, token });
    setReports((list) => [...(list || []).filter((x) => x.date !== date), r.report]);
    return r.report;
  };

  if (error) return <Alert>{error}</Alert>;
  if (!reports) return <div className="text-sm text-slate-500">Loading reports…</div>;
  return (
    <ReportCalendar
      startDate={me.intern.start_date}
      endDate={me.intern.end_date}
      today={me.today}
      graceDays={me.graceDays}
      reports={reports}
      mode="intern"
      onSave={save}
    />
  );
}
