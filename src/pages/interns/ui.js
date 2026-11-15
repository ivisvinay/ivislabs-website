import React, { useEffect, useState } from "react";
import { authImageUrl } from "../../services/internApi";

export const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, required, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, placeholder = "Select…", ...rest }) {
  return (
    <select className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)} {...rest}>
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  const cls =
    kind === "error"
      ? "text-red-700 bg-red-50 border-red-100"
      : kind === "success"
      ? "text-green-800 bg-green-50 border-green-200"
      : "text-amber-800 bg-amber-50 border-amber-200";
  return <div className={`text-sm border rounded-lg px-3 py-2 ${cls}`}>{children}</div>;
}

export function Button({ variant = "primary", className = "", ...rest }) {
  const v = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    dark: "bg-slate-900 hover:bg-slate-800 text-white",
    light: "bg-white border border-slate-300 hover:border-blue-400 text-slate-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "text-slate-600 hover:bg-slate-100",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-semibold text-sm px-4 py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed ${v} ${className}`}
      {...rest}
    />
  );
}

export function Card({ title, actions, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#4f46e5", "#b45309"];

/** Round avatar: the intern's photo when available (fetched with auth), else initials. */
export function Avatar({ id, name, hasPhoto, photoPath, token, version, size = 36, online }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let live = true;
    setSrc(null);
    if (hasPhoto && photoPath && token) authImageUrl(photoPath, token, version).then((u) => live && setSrc(u));
    return () => {
      live = false;
    };
  }, [hasPhoto, photoPath, token, version]);
  const initials = String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt="" className="rounded-full object-cover w-full h-full" />
      ) : (
        <span
          className="rounded-full w-full h-full flex items-center justify-center text-white font-semibold"
          style={{ background: AVATAR_COLORS[(Number(id) || 0) % AVATAR_COLORS.length], fontSize: size * 0.38 }}
        >
          {initials}
        </span>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-slate-300"}`}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </span>
  );
}

export const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[status] || ""}`}>
      {status}
    </span>
  );
}
