import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/internApi";
import { DEGREES, SPECIALIZATIONS, DURATIONS, YEARS_OF_STUDY, GENDERS } from "../../config/internOptions";
import { Field, Select, Alert, Button, inputCls } from "./ui";
import { todayIST } from "../../utils/internDates";

function Brand({ subtitle }) {
  return (
    <div className="text-center mb-6">
      <Link to="/" className="text-2xl font-bold text-slate-900">
        IVIS LABS
      </Link>
      <div className="text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

export function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await api("/api/interns/login", { method: "POST", body: { email, password } });
      onLogin(r.token);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-slate-100 space-y-4">
        <Brand subtitle="Intern Portal" />
        <Field label="Email">
          <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        </Field>
        <Field label="Password">
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Alert>{err}</Alert>
        <Button className="w-full py-2.5" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <div className="text-sm text-center text-slate-500">
          New intern?{" "}
          <Link to="/interns/register" className="text-blue-600 font-medium hover:underline">
            Register here
          </Link>
        </div>
        <div className="text-xs text-center text-slate-400">Forgot your password? Ask the IVIS LABS team to reset it.</div>
      </form>
    </div>
  );
}

const EMPTY = {
  full_name: "",
  email: "",
  phone: "",
  whatsapp: "",
  dob: "",
  gender: "",
  college: "",
  university: "",
  degree: "",
  specialization: "",
  specialization_other: "",
  year_of_study: "",
  graduation_year: "",
  city: "",
  state: "",
  address: "",
  duration: "",
  preferred_start: "",
  domain: "",
  skills: "",
  linkedin: "",
  github: "",
  referral: "",
  emergency_name: "",
  emergency_phone: "",
  password: "",
  confirm: "",
  consent: false,
};

function Section({ title, children }) {
  return (
    <fieldset className="border-t border-slate-100 pt-5">
      <legend className="text-sm font-semibold text-slate-900 pr-2">{title}</legend>
      <div className="grid sm:grid-cols-2 gap-4 mt-3">{children}</div>
    </fieldset>
  );
}

export function Register({ onLogin }) {
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v && v.target ? (v.target.type === "checkbox" ? v.target.checked : v.target.value) : v }));
  const text = (k, props = {}) => <input className={inputCls} value={f[k]} onChange={set(k)} {...props} />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (f.password !== f.confirm) return setErr("Passwords do not match.");
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    setBusy(true);
    try {
      const { confirm, ...body } = f;
      await api("/api/interns/register", { method: "POST", body });
      const r = await api("/api/interns/login", { method: "POST", body: { email: f.email, password: f.password } });
      onLogin(r.token);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <form onSubmit={submit} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100 space-y-6">
        <Brand subtitle="Internship Registration" />
        <p className="text-sm text-slate-600 -mt-2 text-center">
          Fill in your details below. Once the IVIS LABS team approves your application, you can sign in to access your
          internship calendar, daily reports, batch chat and ID card.
        </p>

        <Section title="Personal details">
          <Field label="Full name (as on college ID)" required>{text("full_name", { required: true, maxLength: 120 })}</Field>
          <Field label="Date of birth" required>{text("dob", { type: "date", required: true, max: todayIST() })}</Field>
          <Field label="Gender">
            <Select value={f.gender} onChange={set("gender")} options={GENDERS} />
          </Field>
          <Field label="Email" required>{text("email", { type: "email", required: true })}</Field>
          <Field label="Contact number" required hint="10-digit mobile, with country code if outside India">
            {text("phone", { type: "tel", required: true, placeholder: "+91 98765 43210" })}
          </Field>
          <Field label="WhatsApp number" hint="Leave blank if same as contact number">
            {text("whatsapp", { type: "tel" })}
          </Field>
        </Section>

        <Section title="Academic details">
          <Field label="College name" required className="sm:col-span-2">{text("college", { required: true })}</Field>
          <Field label="University">{text("university")}</Field>
          <Field label="Degree" required>
            <Select value={f.degree} onChange={set("degree")} options={DEGREES} required />
          </Field>
          <Field label="Specialization" required>
            <Select value={f.specialization} onChange={set("specialization")} options={SPECIALIZATIONS} required />
          </Field>
          {f.specialization === "Others" ? (
            <Field label="Specify specialization" required>{text("specialization_other", { required: true, placeholder: "e.g. Electronics & Communication" })}</Field>
          ) : (
            <div className="hidden sm:block" />
          )}
          <Field label="Current year of study" required>
            <Select value={f.year_of_study} onChange={set("year_of_study")} options={YEARS_OF_STUDY} required />
          </Field>
          <Field label="Year of graduation">{text("graduation_year", { inputMode: "numeric", pattern: "\\d{4}", placeholder: "2027" })}</Field>
        </Section>

        <Section title="Internship preferences">
          <Field label="Internship duration" required>
            <Select value={f.duration} onChange={set("duration")} options={DURATIONS} required />
          </Field>
          <Field label="Preferred start date" required hint="Final start date is confirmed by IVIS LABS">
            {text("preferred_start", { type: "date", required: true })}
          </Field>
          <Field label="Area of interest / domain">{text("domain", { placeholder: "e.g. AI/ML, Web development, HR" })}</Field>
          <Field label="How did you hear about us?">{text("referral")}</Field>
          <Field label="Skills" className="sm:col-span-2">
            <textarea rows={2} className={inputCls} value={f.skills} onChange={set("skills")} placeholder="Python, React, Excel, Communication…" />
          </Field>
          <Field label="LinkedIn profile">{text("linkedin", { type: "url", placeholder: "https://linkedin.com/in/…" })}</Field>
          <Field label="GitHub / portfolio">{text("github", { type: "url", placeholder: "https://github.com/…" })}</Field>
        </Section>

        <Section title="Address & emergency contact">
          <Field label="City" required>{text("city", { required: true })}</Field>
          <Field label="State">{text("state")}</Field>
          <Field label="Address" className="sm:col-span-2">
            <textarea rows={2} className={inputCls} value={f.address} onChange={set("address")} />
          </Field>
          <Field label="Emergency contact name" required>{text("emergency_name", { required: true, placeholder: "Parent / guardian" })}</Field>
          <Field label="Emergency contact number" required>{text("emergency_phone", { type: "tel", required: true })}</Field>
        </Section>

        <Section title="Create your login">
          <Field label="Password" required hint="At least 8 characters">{text("password", { type: "password", required: true, minLength: 8, autoComplete: "new-password" })}</Field>
          <Field label="Confirm password" required>{text("confirm", { type: "password", required: true, autoComplete: "new-password" })}</Field>
        </Section>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" className="mt-1" checked={f.consent} onChange={set("consent")} required />
          I declare that the information above is true, and I agree to IVIS LABS storing these details to manage my
          internship.
        </label>

        <Alert>{err}</Alert>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/interns" className="text-sm text-slate-500 hover:underline">
            Already registered? Sign in
          </Link>
          <Button className="px-6 py-2.5" disabled={busy}>
            {busy ? "Submitting…" : "Submit registration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
