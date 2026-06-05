import { useState, useEffect, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

// ============================================
// MA'LUMOTLAR BAZASI (Simulyatsiya)
// ============================================
const initialData = {
  users: [
    { id: 1, username: "admin", password: "admin123", role: "admin" },
    { id: 2, username: "dr_karimov", password: "clinic123", role: "clinician" },
    { id: 3, username: "reception1", password: "recept123", role: "receptionist" },
  ],
  doctors: [
    { id: 1, first_name: "Alisher", last_name: "Karimov", specialty: "Cardiology", department: "Kardiologiya", phone: "+998901234567", email: "a.karimov@caretrack.uz", created_at: "2024-01-10" },
    { id: 2, first_name: "Zulfiya", last_name: "Rahimova", specialty: "Neurology", department: "Nevrologiya", phone: "+998907654321", email: "z.rahimova@caretrack.uz", created_at: "2024-01-12" },
    { id: 3, first_name: "Sardor", last_name: "Mirzayev", specialty: "Dermatology", department: "Dermatologiya", phone: "+998905555555", email: "s.mirzayev@caretrack.uz", created_at: "2024-02-01" },
  ],
  patients: [
    { id: 1, first_name: "Bobur", last_name: "Yusupov", date_of_birth: "1990-05-15", gender: "Male", phone: "+998901111111", email: "bobur@mail.uz", address: "Toshkent, Yunusobod", doctor_id: 1, created_at: "2024-01-20" },
    { id: 2, first_name: "Malika", last_name: "Toshmatova", date_of_birth: "1985-08-22", gender: "Female", phone: "+998902222222", email: "malika@mail.uz", address: "Toshkent, Chilonzor", doctor_id: 2, created_at: "2024-02-05" },
    { id: 3, first_name: "Jasur", last_name: "Hasanov", date_of_birth: "2001-12-01", gender: "Male", phone: "+998903333333", email: "jasur@mail.uz", address: "Samarqand", doctor_id: 1, created_at: "2024-03-10" },
    { id: 4, first_name: "Nilufar", last_name: "Ergasheva", date_of_birth: "1995-03-18", gender: "Female", phone: "+998904444444", email: "nilufar@mail.uz", address: "Toshkent, Sergeli", doctor_id: 3, created_at: "2024-04-01" },
    { id: 5, first_name: "Sherzod", last_name: "Nazarov", date_of_birth: "1978-11-25", gender: "Male", phone: "+998905555555", email: "sherzod@mail.uz", address: "Toshkent, Mirzo Ulugbek", doctor_id: 2, created_at: "2024-05-12" },
  ],
  diagnoses: [
    { id: 1, patient_id: 1, icd_code: "I10", description: "Arterial hypertension", severity: "Moderate", diagnosis_date: "2024-01-25", notes: "Dori buyurildi" },
    { id: 2, patient_id: 2, icd_code: "G43.9", description: "Migraine without aura", severity: "Mild", diagnosis_date: "2024-02-10", notes: "Dam olish tavsiya etiladi" },
    { id: 3, patient_id: 1, icd_code: "E11.9", description: "Type 2 diabetes mellitus", severity: "Moderate", diagnosis_date: "2024-03-20", notes: "Parhezga rioya qilish" },
    { id: 4, patient_id: 3, icd_code: "J06.9", description: "Acute upper respiratory infection", severity: "Mild", diagnosis_date: "2024-04-05", notes: "" },
    { id: 5, patient_id: 4, icd_code: "L30.9", description: "Dermatitis", severity: "Mild", diagnosis_date: "2024-04-12", notes: "Krem yozildi" },
    { id: 6, patient_id: 5, icd_code: "G35", description: "Multiple sclerosis", severity: "Severe", diagnosis_date: "2024-05-15", notes: "Nazorat zarur" },
  ],
  schedules: [
    { id: 1, doctor_id: 1, date: "2026-06-02", time: "09:00", patient_name: "Bobur Yusupov", type: "Qabul", notes: "" },
    { id: 2, doctor_id: 2, date: "2026-06-02", time: "10:30", patient_name: "Malika Toshmatova", type: "Nazorat", notes: "" },
    { id: 3, doctor_id: 1, date: "2026-06-03", time: "14:00", patient_name: "Jasur Hasanov", type: "Qabul", notes: "" },
    { id: 4, doctor_id: 3, date: "2026-06-04", time: "11:00", patient_name: "Nilufar Ergasheva", type: "Yo'llanma", notes: "Dori tavsiyasi" },
  ],
};

let db = JSON.parse(JSON.stringify(initialData));
let nextId = { doctors: 4, patients: 6, diagnoses: 7, users: 4, schedules: 5 };

// ============================================
// NOTIFICATION TIZIMI
// ============================================
let globalNotifications = [
  { id: 1, message: "Yangi bemor qo'shildi: Bobur Yusupov", time: "2 daqiqa oldin", read: false, type: "info" },
  { id: 2, message: "Tashxis yangilandi: I10 - Arterial hypertension", time: "15 daqiqa oldin", read: false, type: "success" },
  { id: 3, message: "Shifokor Dr. Rahimova jadvalida o'zgarish", time: "1 soat oldin", read: true, type: "warning" },
];
let nextNotifId = 4;
let notifListeners = [];

const notifStore = {
  get: () => globalNotifications,
  add: (msg, type = "info") => {
    const n = { id: nextNotifId++, message: msg, time: "Hozir", read: false, type };
    globalNotifications = [n, ...globalNotifications];
    notifListeners.forEach(fn => fn());
  },
  markRead: (id) => {
    globalNotifications = globalNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    notifListeners.forEach(fn => fn());
  },
  markAll: () => {
    globalNotifications = globalNotifications.map(n => ({ ...n, read: true }));
    notifListeners.forEach(fn => fn());
  },
  subscribe: (fn) => { notifListeners.push(fn); return () => { notifListeners = notifListeners.filter(f => f !== fn); }; },
};

// ============================================
// API SIMULYATSIYA
// ============================================
const api = {
  login: (username, password) => {
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error("Noto'g'ri foydalanuvchi yoki parol");
    return { token: btoa(JSON.stringify({ id: user.id, role: user.role, username })), user: { id: user.id, username, role: user.role } };
  },
  stats: () => ({
    doctors: db.doctors.length,
    patients: db.patients.length,
    diagnoses: db.diagnoses.length,
    recent_patients: db.patients.slice(-5).reverse().map(p => {
      const doc = db.doctors.find(d => d.id === p.doctor_id);
      return { ...p, doctor_name: doc ? `${doc.first_name} ${doc.last_name}` : "—" };
    }),
    by_specialty: db.doctors.map(doc => ({
      name: doc.specialty,
      patients: db.patients.filter(p => p.doctor_id === doc.id).length,
    })),
    by_severity: ["Mild", "Moderate", "Severe", "Critical"].map(s => ({
      name: s, value: db.diagnoses.filter(d => d.severity === s).length,
    })).filter(x => x.value > 0),
    monthly_patients: ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"].map((m, i) => ({
      month: m,
      bemorlar: db.patients.filter(p => new Date(p.created_at).getMonth() === i).length,
    })),
    gender_stats: [
      { name: "Erkak", value: db.patients.filter(p => p.gender === "Male").length },
      { name: "Ayol", value: db.patients.filter(p => p.gender === "Female").length },
      { name: "Boshqa", value: db.patients.filter(p => p.gender === "Other").length },
    ].filter(x => x.value > 0),
  }),
  getUsers: () => db.users,
  addUser: (data) => {
    const exists = db.users.find(u => u.username === data.username);
    if (exists) throw new Error("Bu foydalanuvchi nomi band");
    const u = { ...data, id: nextId.users++ };
    db.users.push(u);
    notifStore.add(`Yangi foydalanuvchi qo'shildi: ${data.username}`, "success");
    return u;
  },
  updateUserPassword: (id, newPassword) => {
    const i = db.users.findIndex(u => u.id === id);
    if (i < 0) throw new Error("Foydalanuvchi topilmadi");
    db.users[i].password = newPassword;
    notifStore.add(`Parol yangilandi: ${db.users[i].username}`, "info");
  },
  deleteUser: (id) => { db.users = db.users.filter(u => u.id !== id); },
  getDoctors: (search = "") => db.doctors.filter(d =>
    !search || `${d.first_name} ${d.last_name} ${d.specialty} ${d.department}`.toLowerCase().includes(search.toLowerCase())
  ),
  getDoctor: (id) => {
    const doc = db.doctors.find(d => d.id === id);
    if (!doc) throw new Error("Shifokor topilmadi");
    return { ...doc, patients: db.patients.filter(p => p.doctor_id === id) };
  },
  addDoctor: (data) => {
    const d = { ...data, id: nextId.doctors++, created_at: new Date().toISOString().split("T")[0] };
    db.doctors.push(d);
    notifStore.add(`Yangi shifokor qo'shildi: ${data.first_name} ${data.last_name}`, "success");
    return d;
  },
  updateDoctor: (id, data) => { const i = db.doctors.findIndex(d => d.id === id); if (i < 0) throw new Error("Topilmadi"); db.doctors[i] = { ...db.doctors[i], ...data }; return db.doctors[i]; },
  deleteDoctor: (id) => { db.doctors = db.doctors.filter(d => d.id !== id); },
  getPatients: (search = "", doctor_id = null) => db.patients.filter(p => {
    const matchSearch = !search || `${p.first_name} ${p.last_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchDoc = !doctor_id || p.doctor_id === doctor_id;
    return matchSearch && matchDoc;
  }).map(p => {
    const doc = db.doctors.find(d => d.id === p.doctor_id);
    return { ...p, doctor_name: doc ? `${doc.first_name} ${doc.last_name}` : "—", specialty: doc?.specialty || "" };
  }),
  getPatient: (id) => {
    const p = db.patients.find(p => p.id === id);
    if (!p) throw new Error("Bemor topilmadi");
    const doc = db.doctors.find(d => d.id === p.doctor_id);
    return { ...p, doctor_name: doc ? `${doc.first_name} ${doc.last_name}` : "—", specialty: doc?.specialty || "", diagnoses: db.diagnoses.filter(d => d.patient_id === id) };
  },
  addPatient: (data) => {
    const p = { ...data, id: nextId.patients++, created_at: new Date().toISOString().split("T")[0] };
    db.patients.push(p);
    notifStore.add(`Yangi bemor qo'shildi: ${data.first_name} ${data.last_name}`, "success");
    return p;
  },
  updatePatient: (id, data) => { const i = db.patients.findIndex(p => p.id === id); if (i < 0) throw new Error("Topilmadi"); db.patients[i] = { ...db.patients[i], ...data }; return db.patients[i]; },
  deletePatient: (id, role) => { if (role === "clinician") throw new Error("Huquq yo'q"); db.patients = db.patients.filter(p => p.id !== id); db.diagnoses = db.diagnoses.filter(d => d.patient_id !== id); },
  getDiagnoses: (patient_id = null, search = "") => db.diagnoses.filter(d =>
    (!patient_id || d.patient_id === patient_id) && (!search || `${d.icd_code} ${d.description}`.toLowerCase().includes(search.toLowerCase()))
  ).map(d => { const p = db.patients.find(p => p.id === d.patient_id); return { ...d, patient_name: p ? `${p.first_name} ${p.last_name}` : "—" }; }),
  addDiagnosis: (data) => {
    const d = { ...data, id: nextId.diagnoses++, created_at: new Date().toISOString().split("T")[0] };
    db.diagnoses.push(d);
    notifStore.add(`Yangi tashxis qo'shildi: ${data.icd_code}`, "info");
    return d;
  },
  updateDiagnosis: (id, data) => { const i = db.diagnoses.findIndex(d => d.id === id); if (i < 0) throw new Error("Topilmadi"); db.diagnoses[i] = { ...db.diagnoses[i], ...data }; return db.diagnoses[i]; },
  deleteDiagnosis: (id, role) => { if (role === "clinician") throw new Error("Huquq yo'q"); db.diagnoses = db.diagnoses.filter(d => d.id !== id); },
  getSchedules: (doctor_id = null, date = null) => db.schedules.filter(s =>
    (!doctor_id || s.doctor_id === doctor_id) && (!date || s.date === date)
  ).map(s => { const doc = db.doctors.find(d => d.id === s.doctor_id); return { ...s, doctor_name: doc ? `${doc.first_name} ${doc.last_name}` : "—" }; }),
  addSchedule: (data) => { const s = { ...data, id: nextId.schedules++ }; db.schedules.push(s); notifStore.add(`Jadval qo'shildi: ${data.time} - ${data.patient_name}`, "info"); return s; },
  deleteSchedule: (id) => { db.schedules = db.schedules.filter(s => s.id !== id); },
};

// ============================================
// THEME
// ============================================
const DARK = {
  bg: "#0f172a", surface: "#1e293b", border: "#334155", text: "#f1f5f9",
  subtext: "#94a3b8", inputBg: "#1e293b", inputBorder: "#475569",
  sidebar: "#0f172a", sidebarBorder: "#1e3a5f", sidebarText: "#94a3b8",
  tableBg: "#1e293b", tableHead: "#0f172a", tableRow: "#253047",
  btnSecBg: "#334155", btnSecColor: "#cbd5e1", btnSecBorder: "#475569",
};
const LIGHT = {
  bg: "#f3f4f6", surface: "#ffffff", border: "#e5e7eb", text: "#111827",
  subtext: "#6b7280", inputBg: "#ffffff", inputBorder: "#d1d5db",
  sidebar: "#1e3a8a", sidebarBorder: "#1e40af", sidebarText: "#93c5fd",
  tableBg: "#ffffff", tableHead: "#f9fafb", tableRow: "#fafafa",
  btnSecBg: "#f3f4f6", btnSecColor: "#374151", btnSecBorder: "#d1d5db",
};

// ============================================
// UTILITY
// ============================================
const severityColor = { Mild: "#059669", Moderate: "#d97706", Severe: "#dc2626", Critical: "#7c3aed" };
const roleLabel = { admin: "Administrator", clinician: "Klinitsist", receptionist: "Qabulxona" };
const roleColor = { admin: "#1e40af", clinician: "#065f46", receptionist: "#92400e" };
const PIE_COLORS = ["#059669", "#d97706", "#dc2626", "#7c3aed", "#1e40af", "#be185d"];

function Badge({ text, color }) {
  return <span style={{ background: color + "22", color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>{text}</span>;
}

function Modal({ title, onClose, children, theme, wide }) {
  const T = theme;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 14, padding: 28, width: "100%", maxWidth: wide ? 700 : 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: T.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: T.subtext, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</label>
      {children}
    </div>
  );
}

// ============================================
// PDF CHIQARISH FUNKSIYASI (100% ISHLAYDIGAN)
// ============================================
function generatePatientPDF(p) {
  const diagnoses = api.getDiagnoses(p.id);
  const printDate = new Date().toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });
  const printTime = new Date().toLocaleTimeString("uz-UZ");

  const diagnosesHTML = diagnoses.length === 0
    ? `<div class="empty-box">Tashxis qo'yilmagan</div>`
    : diagnoses.map((d, i) => `
      <div class="diag-row">
        <div class="diag-num">${i + 1}</div>
        <div class="diag-content">
          <div class="diag-header">
            <span class="icd-badge">${d.icd_code}</span>
            <strong>${d.description}</strong>
            <span class="sev sev-${d.severity.toLowerCase()}">${d.severity}</span>
          </div>
          <div class="diag-meta">
            <span>📅 ${d.diagnosis_date}</span>
            ${d.notes ? `<span>💬 ${d.notes}</span>` : ""}
          </div>
        </div>
      </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bemor Kartasi — ${p.first_name} ${p.last_name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; }
  .page { max-width: 800px; margin: 0 auto; background: white; min-height: 100vh; }
  
  /* HEADER */
  .header { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #7c3aed 100%); padding: 32px 40px; color: white; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .clinic-logo { display: flex; align-items: center; gap: 12px; }
  .clinic-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .clinic-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .clinic-sub { font-size: 12px; opacity: 0.8; margin-top: 2px; }
  .doc-info { text-align: right; font-size: 13px; opacity: 0.85; }
  .doc-id { font-size: 11px; opacity: 0.7; margin-top: 4px; }
  .patient-name-big { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
  .patient-subtitle { font-size: 14px; opacity: 0.75; margin-top: 4px; }

  /* BODY */
  .body { padding: 32px 40px; }

  /* INFO GRID */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 28px; }
  .info-cell { background: #f8fafc; padding: 16px 18px; }
  .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 700; margin-bottom: 4px; }
  .info-value { font-size: 14px; font-weight: 600; color: #1e293b; }

  /* DOCTOR CARD */
  .doctor-card { background: linear-gradient(135deg, #eff6ff, #f0fdf4); border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; display: flex; align-items: center; gap: 16px; }
  .doctor-avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #1e40af, #7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .doctor-name { font-weight: 700; font-size: 15px; color: #1e3a8a; }
  .doctor-spec { font-size: 12px; color: #3b82f6; margin-top: 2px; }

  /* DIAGNOSES */
  .section-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .diag-row { display: flex; gap: 14px; margin-bottom: 12px; }
  .diag-num { width: 28px; height: 28px; background: #1e40af; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
  .diag-content { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
  .diag-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
  .icd-badge { background: #7c3aed22; color: #7c3aed; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .diag-meta { font-size: 12px; color: #64748b; display: flex; gap: 16px; }
  .sev { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
  .sev-mild { background: #d1fae5; color: #059669; }
  .sev-moderate { background: #fef3c7; color: #d97706; }
  .sev-severe { background: #fee2e2; color: #dc2626; }
  .sev-critical { background: #ede9fe; color: #7c3aed; }
  .empty-box { background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 10px; padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; }

  /* STATS */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; text-align: center; }
  .stat-num { font-size: 24px; font-weight: 800; color: #1e40af; }
  .stat-lbl { font-size: 11px; color: #64748b; margin-top: 2px; }

  /* FOOTER */
  .footer { margin-top: 36px; padding: 20px 0 0; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 11px; color: #94a3b8; }
  .footer-right { font-size: 11px; color: #94a3b8; text-align: right; }
  .signature-box { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; color: #94a3b8; text-align: center; margin-top: 32px; }

  /* PRINT BUTTON */
  .print-bar { position: sticky; top: 0; background: white; border-bottom: 1px solid #e2e8f0; padding: 12px 40px; display: flex; gap: 12px; align-items: center; z-index: 100; }
  .btn-print { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .btn-close { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
  .btn-print:hover { opacity: 0.9; }
  
  @media print {
    .print-bar { display: none !important; }
    body { background: white; }
    .page { box-shadow: none; }
  }

  .watermark { position: fixed; bottom: 40px; right: 40px; font-size: 11px; color: #cbd5e1; pointer-events: none; }
</style>
</head>
<body>
<div class="print-bar">
  <button class="btn-print" onclick="window.print()">🖨️ Chop etish / PDF saqlash</button>
  <button class="btn-close" onclick="window.close()">✕ Yopish</button>
  <span style="font-size:12px;color:#64748b;margin-left:8px;">PDF saqlamoqchi bo'lsangiz: Chop etish → "PDF sifatida saqlash" tanlang</span>
</div>

<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="clinic-logo">
        <div class="clinic-icon">🏥</div>
        <div>
          <div class="clinic-name">CareTrack Clinic</div>
          <div class="clinic-sub">Tibbiy Yozuvlar Tizimi</div>
        </div>
      </div>
      <div class="doc-info">
        <div><strong>Bemor kartasi</strong></div>
        <div>${printDate}, ${printTime}</div>
        <div class="doc-id">ID: #${p.id} | Ref: CT-${String(p.id).padStart(4, "0")}</div>
      </div>
    </div>
    <div class="patient-name-big">${p.first_name} ${p.last_name}</div>
    <div class="patient-subtitle">Ro'yxatga olingan: ${p.created_at || "—"}</div>
  </div>

  <!-- BODY -->
  <div class="body">

    <!-- STATS -->
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-num">${diagnoses.length}</div>
        <div class="stat-lbl">Jami tashxis</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${diagnoses.filter(d => d.severity === "Severe" || d.severity === "Critical").length}</div>
        <div class="stat-lbl">Og'ir holat</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${diagnoses.length > 0 ? diagnoses[diagnoses.length - 1].diagnosis_date : "—"}</div>
        <div class="stat-lbl">Oxirgi tashxis</div>
      </div>
    </div>

    <!-- INFO GRID -->
    <div class="info-grid">
      <div class="info-cell">
        <div class="info-label">Tug'ilgan sana</div>
        <div class="info-value">${p.date_of_birth || "—"}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Jinsi</div>
        <div class="info-value">${p.gender === "Male" ? "👨 Erkak" : p.gender === "Female" ? "👩 Ayol" : p.gender || "—"}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Telefon</div>
        <div class="info-value">${p.phone || "—"}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Email</div>
        <div class="info-value">${p.email || "—"}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Manzil</div>
        <div class="info-value">${p.address || "—"}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Mutaxassislik</div>
        <div class="info-value">${p.specialty || "—"}</div>
      </div>
    </div>

    <!-- DOCTOR CARD -->
    <div class="doctor-card">
      <div class="doctor-avatar">👨‍⚕️</div>
      <div>
        <div class="doctor-name">Dr. ${p.doctor_name || "Biriktirilmagan"}</div>
        <div class="doctor-spec">${p.specialty || ""}</div>
      </div>
    </div>

    <!-- DIAGNOSES -->
    <div class="section-title">📋 Tashxislar tarixi (${diagnoses.length} ta)</div>
    ${diagnosesHTML}

    <!-- SIGNATURE -->
    <div class="signature-box">
      <div>
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">Davolayotgan shifokor</div>
        <div style="font-size:13px;color:#64748b;">Dr. ${p.doctor_name || "—"}</div>
        <div class="sig-line">Imzo</div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">Administrator</div>
        <div style="font-size:13px;color:#64748b;">CareTrack Clinic</div>
        <div class="sig-line">Muhri</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-left">
        <div>🏥 CareTrack Tibbiy Yozuvlar Tizimi</div>
        <div style="margin-top:2px;">Bu hujjat rasmiy tibbiy ko'rsatma hisoblanadi</div>
      </div>
      <div class="footer-right">
        <div>Chop etildi: ${printDate}</div>
        <div style="margin-top:2px;">Vaqt: ${printTime}</div>
      </div>
    </div>
  </div>
</div>

<div class="watermark">CareTrack © 2026</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ============================================
// LOGIN SAHIFASI
// ============================================
function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = () => {
    setLoading(true); setError("");
    setTimeout(() => {
      try { onLogin(api.login(form.username, form.password)); }
      catch (e) { setError(e.message); }
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 44, width: "100%", maxWidth: 400, boxShadow: "0 30px 90px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#1e40af,#7c3aed)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 32 }}>🏥</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>CareTrack</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Tibbiy Yozuvlar Tizimi v2.0</p>
        </div>
        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Foydalanuvchi nomi</label>
          <input style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} placeholder="admin / dr_karimov / reception1" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Parol</label>
          <div style={{ position: "relative" }}>
            <input style={{ width: "100%", padding: "10px 40px 10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</button>
          </div>
        </div>
        <button style={{ background: "linear-gradient(135deg,#1e40af,#7c3aed)", color: "#fff", border: "none", padding: "13px", width: "100%", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }} onClick={handleSubmit} disabled={loading}>
          {loading ? "⏳ Kirish..." : "→ Kirish"}
        </button>
        <div style={{ marginTop: 20, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
          <strong style={{ color: "#374151" }}>Demo loginlar:</strong><br />
          admin / admin123 · dr_karimov / clinic123 · reception1 / recept123
        </div>
      </div>
    </div>
  );
}

// ============================================
// NOTIFICATION BELL
// ============================================
function NotificationBell({ theme: T }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(notifStore.get());
  const ref = useRef(null);

  useEffect(() => {
    const unsub = notifStore.subscribe(() => setNotifs([...notifStore.get()]));
    return unsub;
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;
  const typeColor = { info: "#1e40af", success: "#059669", warning: "#d97706" };
  const typeIcon = { info: "ℹ️", success: "✅", warning: "⚠️" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ position: "relative", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
        🔔
        {unread > 0 && <span style={{ position: "absolute", top: 4, right: 4, background: "#dc2626", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 46, width: 340, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>🔔 Bildirishnomalar {unread > 0 && <span style={{ background: "#dc2626", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, marginLeft: 6 }}>{unread}</span>}</span>
            {unread > 0 && <button onClick={() => notifStore.markAll()} style={{ background: "none", border: "none", color: "#1e40af", fontSize: 12, cursor: "pointer" }}>Barchasini o'qi</button>}
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {notifs.length === 0 && <div style={{ padding: 24, textAlign: "center", color: T.subtext, fontSize: 13 }}>Bildirishnoma yo'q</div>}
            {notifs.map(n => (
              <div key={n.id} onClick={() => notifStore.markRead(n.id)} style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: n.read ? "transparent" : typeColor[n.type] + "11", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>{typeIcon[n.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: T.subtext, marginTop: 2 }}>{n.time}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor[n.type], marginTop: 5, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================
function Dashboard({ user, theme: T }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { setStats(api.stats()); }, []);
  if (!stats) return <div style={{ padding: 40, color: T.subtext }}>Yuklanmoqda...</div>;

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, color: T.text }}>Boshqaruv paneli</h2>
      <p style={{ margin: "0 0 22px", color: T.subtext, fontSize: 14 }}>Xush kelibsiz, <strong style={{ color: T.text }}>{user.username}</strong> — <Badge text={roleLabel[user.role]} color={roleColor[user.role]} /></p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Shifokorlar", value: stats.doctors, icon: "👨‍⚕️", color: "#1e40af", grad: "linear-gradient(135deg,#1e40af,#3b82f6)" },
          { label: "Bemorlar", value: stats.patients, icon: "🏥", color: "#065f46", grad: "linear-gradient(135deg,#065f46,#10b981)" },
          { label: "Tashxislar", value: stats.diagnoses, icon: "📋", color: "#7c3aed", grad: "linear-gradient(135deg,#7c3aed,#a78bfa)" },
          { label: "Bugungi jadval", value: api.getSchedules().length, icon: "📅", color: "#be185d", grad: "linear-gradient(135deg,#be185d,#f472b6)" },
        ].map(s => (
          <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: s.grad, opacity: 0.15 }} />
            <div style={{ fontSize: 26 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: T.subtext, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, color: T.text }}>📊 Tashxis og'irligi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.by_severity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                {stats.by_severity.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, color: T.text }}>👥 Jins bo'yicha</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.gender_stats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                <Cell fill="#1e40af" />
                <Cell fill="#be185d" />
                <Cell fill="#059669" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, color: T.text }}>📈 Oylik bemorlar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.monthly_patients}>
              <defs>
                <linearGradient id="colorBem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.subtext }} />
              <YAxis tick={{ fontSize: 11, fill: T.subtext }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="bemorlar" stroke="#1e40af" fill="url(#colorBem)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, color: T.text }}>👨‍⚕️ Shifokor bo'yicha bemorlar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.by_specialty} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: T.subtext }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.subtext }} width={90} />
              <Tooltip />
              <Bar dataKey="patients" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent patients */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, color: T.text }}>🕐 Oxirgi qo'shilgan bemorlar</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: T.tableHead }}>
            {["Ism", "Jinsi", "Shifokor", "Sana"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: T.subtext, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {stats.recent_patients.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 500, color: T.text }}>{p.first_name} {p.last_name}</td>
                <td style={{ padding: "10px 12px" }}><Badge text={p.gender} color={p.gender === "Female" ? "#be185d" : "#1e40af"} /></td>
                <td style={{ padding: "10px 12px", color: T.subtext }}>{p.doctor_name}</td>
                <td style={{ padding: "10px 12px", color: T.subtext }}>{p.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// SHIFOKORLAR
// ============================================
function DoctorsPage({ user, theme: T }) {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [detail, setDetail] = useState(null);

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${T.inputBorder}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: T.inputBg, color: T.text };
  const btnP = { background: "linear-gradient(135deg,#1e40af,#7c3aed)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnS = { background: T.btnSecBg, color: T.btnSecColor, border: `1px solid ${T.btnSecBorder}`, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };
  const btnD = { background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };

  const load = useCallback(() => setDoctors(api.getDoctors(search)), [search]);
  useEffect(() => { load(); }, [load]);

  const save = () => {
    if (!form.first_name || !form.last_name || !form.specialty || !form.department) return alert("Majburiy maydonlarni to'ldiring");
    if (modal === "add") api.addDoctor(form); else api.updateDoctor(selected.id, form);
    load(); setModal(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: T.text }}>Shifokorlar</h2>
        {user.role === "admin" && <button style={btnP} onClick={() => { setForm({}); setModal("add"); }}>+ Shifokor qo'shish</button>}
      </div>
      <input style={{ ...inp, maxWidth: 320, marginBottom: 20 }} placeholder="Qidirish: ism, mutaxassislik..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: T.tableHead }}>
            {["Ism", "Mutaxassislik", "Bo'lim", "Telefon", "Email", "Amallar"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: T.subtext, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {doctors.length === 0 && <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: T.subtext }}>Shifokorlar topilmadi</td></tr>}
            {doctors.map(d => (
              <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: T.text }}>{d.first_name} {d.last_name}</td>
                <td style={{ padding: "12px 16px" }}><Badge text={d.specialty} color="#1e40af" /></td>
                <td style={{ padding: "12px 16px", color: T.subtext }}>{d.department}</td>
                <td style={{ padding: "12px 16px", color: T.subtext }}>{d.phone}</td>
                <td style={{ padding: "12px 16px", color: T.subtext }}>{d.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={btnS} onClick={() => { setDetail(api.getDoctor(d.id)); setModal("view"); }}>Ko'rish</button>
                    {user.role === "admin" && <><button style={btnS} onClick={() => { setSelected(d); setForm({ ...d }); setModal("edit"); }}>Tahrir</button><button style={btnD} onClick={() => { if (window.confirm("O'chirasizmi?")) { api.deleteDoctor(d.id); load(); } }}>O'chirish</button></>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Shifokor qo'shish" : "Shifokorni tahrirlash"} onClose={() => setModal(null)} theme={T}>
          <FormField label="Ism" required><input style={inp} value={form.first_name || ""} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></FormField>
          <FormField label="Familiya" required><input style={inp} value={form.last_name || ""} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></FormField>
          <FormField label="Mutaxassislik" required><input style={inp} value={form.specialty || ""} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} /></FormField>
          <FormField label="Bo'lim" required><input style={inp} value={form.department || ""} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></FormField>
          <FormField label="Telefon"><input style={inp} value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></FormField>
          <FormField label="Email"><input style={inp} type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FormField>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btnP} onClick={save}>Saqlash</button>
            <button style={btnS} onClick={() => setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}
      {modal === "view" && detail && (
        <Modal title={`Dr. ${detail.first_name} ${detail.last_name}`} onClose={() => setModal(null)} theme={T}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[["Mutaxassislik", detail.specialty], ["Bo'lim", detail.department], ["Telefon", detail.phone], ["Email", detail.email]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 11, color: T.subtext, fontWeight: 600, textTransform: "uppercase" }}>{k}</div><div style={{ marginTop: 2, fontWeight: 500, color: T.text }}>{v || "—"}</div></div>
            ))}
          </div>
          <h4 style={{ margin: "0 0 10px", color: T.text }}>Bemorlar ({detail.patients.length})</h4>
          {detail.patients.map(p => <div key={p.id} style={{ padding: "8px 12px", background: T.tableHead, borderRadius: 8, marginBottom: 6, fontSize: 14, color: T.text }}>{p.first_name} {p.last_name} — {p.date_of_birth}</div>)}
        </Modal>
      )}
    </div>
  );
}

// ============================================
// BEMORLAR + PDF PRINT
// ============================================
function PatientsPage({ user, theme: T }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [detail, setDetail] = useState(null);
  const doctors = api.getDoctors();

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${T.inputBorder}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: T.inputBg, color: T.text };
  const sel = { ...inp, background: T.inputBg };
  const btnP = { background: "linear-gradient(135deg,#1e40af,#7c3aed)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnS = { background: T.btnSecBg, color: T.btnSecColor, border: `1px solid ${T.btnSecBorder}`, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };
  const btnD = { background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };

  const load = useCallback(() => setPatients(api.getPatients(search)), [search]);
  useEffect(() => { load(); }, [load]);

  const save = () => {
    if (!form.first_name || !form.last_name || !form.date_of_birth) return alert("Majburiy maydonlarni to'ldiring");
    const d = { ...form, doctor_id: form.doctor_id ? Number(form.doctor_id) : null };
    if (modal === "add") api.addPatient(d); else api.updatePatient(selected.id, d);
    load(); setModal(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: T.text }}>Bemorlar</h2>
        <button style={btnP} onClick={() => { setForm({ gender: "Male" }); setModal("add"); }}>+ Bemor qo'shish</button>
      </div>
      <input style={{ ...inp, maxWidth: 320, marginBottom: 20 }} placeholder="Qidirish: ism, telefon..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: T.tableHead }}>
            {["Ism", "Tug'ilgan", "Jinsi", "Shifokor", "Telefon", "Amallar"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: T.subtext, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {patients.length === 0 && <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: T.subtext }}>Bemorlar topilmadi</td></tr>}
            {patients.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: T.text }}>{p.first_name} {p.last_name}</td>
                <td style={{ padding: "12px 16px", color: T.subtext }}>{p.date_of_birth}</td>
                <td style={{ padding: "12px 16px" }}><Badge text={p.gender} color={p.gender === "Female" ? "#be185d" : "#1e40af"} /></td>
                <td style={{ padding: "12px 16px", color: T.subtext }}>{p.doctor_name}</td>
                <td style={{ padding: "12px 16px", color: T.subtext }}>{p.phone}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button style={btnS} onClick={() => { setDetail(api.getPatient(p.id)); setModal("view"); }}>Ko'rish</button>
                    <button style={{ ...btnS, color: "#059669", borderColor: "#059669", fontWeight: 700 }} onClick={() => generatePatientPDF(api.getPatient(p.id))}>🖨️ PDF</button>
                    {user.role !== "receptionist" && <button style={btnS} onClick={() => { setSelected(p); setForm({ ...p, doctor_id: p.doctor_id || "" }); setModal("edit"); }}>Tahrir</button>}
                    {user.role === "admin" && <button style={btnD} onClick={() => { if (window.confirm("O'chirasizmi?")) { api.deletePatient(p.id, user.role); load(); } }}>O'chirish</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Bemor qo'shish" : "Bemorni tahrirlash"} onClose={() => setModal(null)} theme={T}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Ism" required><input style={inp} value={form.first_name || ""} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></FormField>
            <FormField label="Familiya" required><input style={inp} value={form.last_name || ""} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></FormField>
          </div>
          <FormField label="Tug'ilgan sana" required><input style={inp} type="date" value={form.date_of_birth || ""} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} /></FormField>
          <FormField label="Jinsi"><select style={sel} value={form.gender || "Male"} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}><option>Male</option><option>Female</option><option>Other</option></select></FormField>
          <FormField label="Telefon"><input style={inp} value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></FormField>
          <FormField label="Email"><input style={inp} type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FormField>
          <FormField label="Manzil"><input style={inp} value={form.address || ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></FormField>
          <FormField label="Shifokor">
            <select style={sel} value={form.doctor_id || ""} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
              <option value="">— Tanlang —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.specialty})</option>)}
            </select>
          </FormField>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btnP} onClick={save}>Saqlash</button>
            <button style={btnS} onClick={() => setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}

      {modal === "view" && detail && (
        <Modal title={`${detail.first_name} ${detail.last_name}`} onClose={() => setModal(null)} theme={T} wide>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button style={{ ...btnS, color: "#059669", borderColor: "#059669", fontWeight: 700 }} onClick={() => generatePatientPDF(detail)}>🖨️ PDF chiqarish</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[["Tug'ilgan", detail.date_of_birth], ["Jinsi", detail.gender], ["Telefon", detail.phone], ["Email", detail.email], ["Manzil", detail.address], ["Shifokor", detail.doctor_name], ["Mutaxassislik", detail.specialty]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 11, color: T.subtext, fontWeight: 600, textTransform: "uppercase" }}>{k}</div><div style={{ marginTop: 2, fontWeight: 500, color: T.text }}>{v || "—"}</div></div>
            ))}
          </div>
          <h4 style={{ margin: "0 0 10px", color: T.text }}>Tashxislar ({detail.diagnoses.length})</h4>
          {detail.diagnoses.map(d => (
            <div key={d.id} style={{ padding: "10px 14px", background: T.tableHead, borderRadius: 8, marginBottom: 8, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, color: T.text }}>{d.icd_code} — {d.description}</span>
                <Badge text={d.severity} color={severityColor[d.severity]} />
              </div>
              <div style={{ color: T.subtext, fontSize: 12, marginTop: 4 }}>{d.diagnosis_date}</div>
              {d.notes && <div style={{ color: T.subtext, fontSize: 13, marginTop: 4 }}>{d.notes}</div>}
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

// ============================================
// TASHXISLAR
// ============================================
function DiagnosesPage({ user, theme: T }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const patients = api.getPatients();

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${T.inputBorder}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: T.inputBg, color: T.text };
  const sel = { ...inp, background: T.inputBg };
  const btnP = { background: "linear-gradient(135deg,#1e40af,#7c3aed)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnS = { background: T.btnSecBg, color: T.btnSecColor, border: `1px solid ${T.btnSecBorder}`, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };
  const btnD = { background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };

  const load = useCallback(() => setDiagnoses(api.getDiagnoses(null, search)), [search]);
  useEffect(() => { load(); }, [load]);

  const save = () => {
    if (!form.patient_id || !form.icd_code || !form.description || !form.diagnosis_date) return alert("Majburiy maydonlarni to'ldiring");
    const d = { ...form, patient_id: Number(form.patient_id) };
    if (modal === "add") api.addDiagnosis(d); else api.updateDiagnosis(selected.id, d);
    load(); setModal(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: T.text }}>Tashxislar</h2>
        {user.role !== "receptionist" && <button style={btnP} onClick={() => { setForm({ severity: "Mild", diagnosis_date: new Date().toISOString().split("T")[0] }); setModal("add"); }}>+ Tashxis qo'shish</button>}
      </div>
      <input style={{ ...inp, maxWidth: 320, marginBottom: 20 }} placeholder="ICD kod yoki tavsif..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: T.tableHead }}>
            {["Bemor", "ICD Kod", "Tavsif", "Og'irlik", "Sana", "Amallar"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: T.subtext, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {diagnoses.length === 0 && <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: T.subtext }}>Tashxislar topilmadi</td></tr>}
            {diagnoses.map(d => (
              <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "12px 16px", fontWeight: 500, color: T.text }}>{d.patient_name}</td>
                <td style={{ padding: "12px 16px" }}><Badge text={d.icd_code} color="#7c3aed" /></td>
                <td style={{ padding: "12px 16px", color: T.text }}>{d.description}</td>
                <td style={{ padding: "12px 16px" }}><Badge text={d.severity} color={severityColor[d.severity]} /></td>
                <td style={{ padding: "12px 16px", color: T.subtext }}>{d.diagnosis_date}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {user.role !== "receptionist" && <button style={btnS} onClick={() => { setSelected(d); setForm({ ...d, patient_id: String(d.patient_id) }); setModal("edit"); }}>Tahrir</button>}
                    {user.role === "admin" && <button style={btnD} onClick={() => { if (window.confirm("O'chirasizmi?")) { api.deleteDiagnosis(d.id, user.role); load(); } }}>O'chirish</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Tashxis qo'shish" : "Tashxisni tahrirlash"} onClose={() => setModal(null)} theme={T}>
          <FormField label="Bemor" required>
            <select style={sel} value={form.patient_id || ""} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
              <option value="">— Tanlang —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </FormField>
          <FormField label="ICD Kodi" required><input style={inp} value={form.icd_code || ""} onChange={e => setForm(f => ({ ...f, icd_code: e.target.value }))} placeholder="masalan: I10, G43.9" /></FormField>
          <FormField label="Tavsif" required><input style={inp} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField>
          <FormField label="Og'irlik darajasi">
            <select style={sel} value={form.severity || "Mild"} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
              {["Mild", "Moderate", "Severe", "Critical"].map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Tashxis sanasi" required><input style={inp} type="date" value={form.diagnosis_date || ""} onChange={e => setForm(f => ({ ...f, diagnosis_date: e.target.value }))} /></FormField>
          <FormField label="Izohlar"><textarea style={{ ...inp, height: 80, resize: "vertical" }} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></FormField>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btnP} onClick={save}>Saqlash</button>
            <button style={btnS} onClick={() => setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// JADVAL (CALENDAR) SAHIFASI
// ============================================
function SchedulePage({ user, theme: T }) {
  const [schedules, setSchedules] = useState([]);
  const [filterDoc, setFilterDoc] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [view, setView] = useState("list"); // "list" | "calendar"
  const doctors = api.getDoctors();

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${T.inputBorder}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: T.inputBg, color: T.text };
  const sel = { ...inp, background: T.inputBg };
  const btnP = { background: "linear-gradient(135deg,#1e40af,#7c3aed)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnS = { background: T.btnSecBg, color: T.btnSecColor, border: `1px solid ${T.btnSecBorder}`, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };
  const btnD = { background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };

  const load = useCallback(() => setSchedules(api.getSchedules(filterDoc ? Number(filterDoc) : null, filterDate || null)), [filterDoc, filterDate]);
  useEffect(() => { load(); }, [load]);

  const typeColor = { "Qabul": "#1e40af", "Nazorat": "#059669", "Yo'llanma": "#7c3aed", "Shoshilinch": "#dc2626" };

  // Calendar view - get current month's dates
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthName = new Date(calYear, calMonth).toLocaleString("uz-UZ", { month: "long", year: "numeric" });

  const allSchedules = api.getSchedules();
  const getSchedulesForDate = (day) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return allSchedules.filter(s => s.date === dateStr);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: T.text }}>📅 Shifokor Ish Jadvali</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...btnS, background: view === "list" ? "#1e40af22" : T.btnSecBg, color: view === "list" ? "#1e40af" : T.btnSecColor }} onClick={() => setView("list")}>📋 Ro'yxat</button>
          <button style={{ ...btnS, background: view === "calendar" ? "#1e40af22" : T.btnSecBg, color: view === "calendar" ? "#1e40af" : T.btnSecColor }} onClick={() => setView("calendar")}>📅 Kalendar</button>
          <button style={btnP} onClick={() => { setForm({ type: "Qabul", date: new Date().toISOString().split("T")[0] }); setModal(true); }}>+ Qabul qo'shish</button>
        </div>
      </div>

      {view === "list" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <select style={{ ...sel, maxWidth: 220 }} value={filterDoc} onChange={e => setFilterDoc(e.target.value)}>
              <option value="">— Barcha shifokorlar —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
            <input style={{ ...inp, maxWidth: 180 }} type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            {(filterDoc || filterDate) && <button style={btnS} onClick={() => { setFilterDoc(""); setFilterDate(""); }}>✕ Tozalash</button>}
          </div>

          {schedules.length === 0 ? (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 40, textAlign: "center", color: T.subtext }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <div>Jadval topilmadi</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {schedules.map(s => (
                <div key={s.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ textAlign: "center", background: "#1e40af22", borderRadius: 10, padding: "10px 16px", minWidth: 60 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1e40af" }}>{s.time}</div>
                      <div style={{ fontSize: 11, color: T.subtext }}>{s.date}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>{s.patient_name}</div>
                      <div style={{ color: T.subtext, fontSize: 13, marginTop: 2 }}>👨‍⚕️ {s.doctor_name}</div>
                      {s.notes && <div style={{ color: T.subtext, fontSize: 12, marginTop: 2 }}>{s.notes}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Badge text={s.type} color={typeColor[s.type] || "#1e40af"} />
                    {user.role === "admin" && <button style={btnD} onClick={() => { if (window.confirm("O'chirasizmi?")) { api.deleteSchedule(s.id); load(); } }}>O'chirish</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "calendar" && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button style={btnS} onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}>← Oldingi</button>
            <h3 style={{ margin: 0, color: T.text, textTransform: "capitalize" }}>{monthName}</h3>
            <button style={btnS} onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}>Keyingi →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {["Ya", "Du", "Se", "Ch", "Pa", "Sh", "Ya"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: T.subtext, padding: "6px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const daySchedules = getSchedulesForDate(day);
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              return (
                <div key={day} style={{ minHeight: 70, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 6px", background: isToday ? "#1e40af11" : T.tableHead, position: "relative" }}>
                  <div style={{ fontSize: 13, fontWeight: isToday ? 800 : 400, color: isToday ? "#1e40af" : T.subtext, marginBottom: 2 }}>{day}</div>
                  {daySchedules.slice(0, 2).map(s => (
                    <div key={s.id} style={{ fontSize: 10, background: typeColor[s.type] + "22", color: typeColor[s.type], borderRadius: 4, padding: "2px 4px", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.time} {s.patient_name}
                    </div>
                  ))}
                  {daySchedules.length > 2 && <div style={{ fontSize: 10, color: T.subtext }}>+{daySchedules.length - 2} ko'proq</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modal && (
        <Modal title="Yangi qabul qo'shish" onClose={() => setModal(false)} theme={T}>
          <FormField label="Shifokor" required>
            <select style={sel} value={form.doctor_id || ""} onChange={e => setForm(f => ({ ...f, doctor_id: Number(e.target.value) }))}>
              <option value="">— Tanlang —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.specialty})</option>)}
            </select>
          </FormField>
          <FormField label="Bemor ismi" required><input style={inp} value={form.patient_name || ""} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} placeholder="Ism Familiya" /></FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Sana" required><input style={inp} type="date" value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></FormField>
            <FormField label="Vaqt" required><input style={inp} type="time" value={form.time || ""} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></FormField>
          </div>
          <FormField label="Qabul turi">
            <select style={sel} value={form.type || "Qabul"} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {["Qabul", "Nazorat", "Yo'llanma", "Shoshilinch"].map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Izoh"><input style={inp} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></FormField>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btnP} onClick={() => {
              if (!form.doctor_id || !form.patient_name || !form.date || !form.time) return alert("Majburiy maydonlarni to'ldiring");
              api.addSchedule(form); load(); setModal(false);
            }}>Saqlash</button>
            <button style={btnS} onClick={() => setModal(false)}>Bekor qilish</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// ADMIN PANEL — FOYDALANUVCHILAR BOSHQARUVI
// ============================================
function AdminPanel({ theme: T }) {
  const [users, setUsers] = useState(api.getUsers());
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [showPass, setShowPass] = useState(false);

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${T.inputBorder}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: T.inputBg, color: T.text };
  const sel = { ...inp, background: T.inputBg };
  const btnP = { background: "linear-gradient(135deg,#1e40af,#7c3aed)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnS = { background: T.btnSecBg, color: T.btnSecColor, border: `1px solid ${T.btnSecBorder}`, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };
  const btnD = { background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };

  const load = () => setUsers(api.getUsers());
  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: T.text }}>⚙️ Foydalanuvchilar Boshqaruvi</h2>
        <button style={btnP} onClick={() => { setForm({ role: "clinician" }); setModal("add"); }}>+ Yangi foydalanuvchi</button>
      </div>

      {msg && <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", color: "#065f46", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>✅ {msg}</div>}

      {/* Ruxsat jadval */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { role: "admin", icon: "🔴", label: "Administrator", perms: ["Barcha sahifalar", "Qo'shish/O'chirish", "Foydalanuvchi boshqaruvi"] },
          { role: "clinician", icon: "🟢", label: "Klinitsist", perms: ["Bemorlar", "Shifokorlar", "Tashxislar", "Jadval"] },
          { role: "receptionist", icon: "🟡", label: "Qabulxona", perms: ["Bemorlar (faqat ko'rish)", "Jadval"] },
        ].map(r => (
          <div key={r.role} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 8 }}>{r.icon} {r.label}</div>
            {r.perms.map(p => <div key={p} style={{ fontSize: 12, color: T.subtext, marginBottom: 3 }}>✓ {p}</div>)}
          </div>
        ))}
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: T.tableHead }}>
            {["#", "Foydalanuvchi", "Lavozim", "Amallar"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: T.subtext, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "12px 16px", color: T.subtext }}>{i + 1}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: T.text }}>👤 {u.username}</td>
                <td style={{ padding: "12px 16px" }}><Badge text={roleLabel[u.role]} color={roleColor[u.role]} /></td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...btnS, color: "#1e40af", borderColor: "#1e40af" }} onClick={() => { setSelected(u); setForm({ newPassword: "", confirm: "" }); setModal("password"); }}>🔑 Parol o'zgartirish</button>
                    {u.role !== "admin" && <button style={btnD} onClick={() => { if (window.confirm(`${u.username} ni o'chirasizmi?`)) { api.deleteUser(u.id); load(); showMsg(`${u.username} o'chirildi`); } }}>O'chirish</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yangi foydalanuvchi */}
      {modal === "add" && (
        <Modal title="Yangi foydalanuvchi qo'shish" onClose={() => setModal(null)} theme={T}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "#1e40af" }}>
            💡 Yangi shifokor yoki qabulxona xodimi uchun login va parol yarating.
          </div>
          <FormField label="Foydalanuvchi nomi" required>
            <input style={inp} value={form.username || ""} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="masalan: dr_aliyev" />
          </FormField>
          <FormField label="Parol" required>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: 40 }} type={showPass ? "text" : "password"} value={form.password || ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Kamida 6 ta belgi" />
              <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</button>
            </div>
          </FormField>
          <FormField label="Lavozim" required>
            <select style={sel} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="clinician">Klinitsist (Shifokor)</option>
              <option value="receptionist">Qabulxona xodimi</option>
              <option value="admin">Administrator</option>
            </select>
          </FormField>
          <div style={{ background: T.tableHead, borderRadius: 8, padding: 12, marginTop: 8, fontSize: 13, color: T.subtext }}>
            <strong style={{ color: T.text }}>Ruxsatlar:</strong><br />
            {form.role === "admin" && "✅ Barcha ma'lumotlarga to'liq kirish va boshqarish"}
            {form.role === "clinician" && "✅ Bemorlar, shifokorlar, tashxislarni ko'rish va tahrirlash | ❌ O'chirish huquqi yo'q"}
            {form.role === "receptionist" && "✅ Faqat bemorlarni ko'rish va qo'shish | ❌ Boshqa sahifalarga kirish yo'q"}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btnP} onClick={() => {
              if (!form.username || !form.password) return alert("Barcha maydonlarni to'ldiring");
              if (form.password.length < 6) return alert("Parol kamida 6 ta belgi bo'lishi kerak");
              try { api.addUser(form); load(); setModal(null); showMsg(`${form.username} muvaffaqiyatli qo'shildi`); }
              catch (e) { alert(e.message); }
            }}>Qo'shish</button>
            <button style={btnS} onClick={() => setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}

      {/* Parol o'zgartirish */}
      {modal === "password" && selected && (
        <Modal title={`Parol o'zgartirish: ${selected.username}`} onClose={() => setModal(null)} theme={T}>
          <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "#92400e" }}>
            ⚠️ Yangi parolni foydalanuvchiga bildiring. Tizim avtomatik xabar yubormaydi.
          </div>
          <div style={{ background: T.tableHead, borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: T.subtext }}>Foydalanuvchi: </span>
            <strong style={{ color: T.text }}>{selected.username}</strong>
            <Badge text={roleLabel[selected.role]} color={roleColor[selected.role]} />
          </div>
          <FormField label="Yangi parol" required>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: 40 }} type={showPass ? "text" : "password"} value={form.newPassword || ""} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Kamida 6 ta belgi" />
              <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</button>
            </div>
          </FormField>
          <FormField label="Parolni tasdiqlash" required>
            <input style={inp} type="password" value={form.confirm || ""} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Parolni qayta kiriting" />
          </FormField>
          {form.newPassword && form.confirm && form.newPassword !== form.confirm && (
            <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>⚠️ Parollar mos kelmadi</div>
          )}
          {form.newPassword && form.confirm && form.newPassword === form.confirm && (
            <div style={{ color: "#059669", fontSize: 13, marginBottom: 8 }}>✅ Parollar mos keldi</div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btnP} onClick={() => {
              if (!form.newPassword || form.newPassword.length < 6) return alert("Parol kamida 6 ta belgi");
              if (form.newPassword !== form.confirm) return alert("Parollar mos kelmadi");
              api.updateUserPassword(selected.id, form.newPassword);
              setModal(null);
              showMsg(`${selected.username} paroli muvaffaqiyatli yangilandi`);
            }}>Saqlash</button>
            <button style={btnS} onClick={() => setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// ASOSIY ILOVA
// ============================================
const navItems = [
  { id: "dashboard", label: "Boshqaruv paneli", icon: "🏠" },
  { id: "doctors", label: "Shifokorlar", icon: "👨‍⚕️", roles: ["admin", "clinician"] },
  { id: "patients", label: "Bemorlar", icon: "🏥" },
  { id: "diagnoses", label: "Tashxislar", icon: "📋", roles: ["admin", "clinician"] },
  { id: "schedule", label: "Ish Jadvali", icon: "📅" },
  { id: "admin", label: "Foydalanuvchilar", icon: "⚙️", roles: ["admin"] },
];

export default function App() {
  const [auth, setAuth] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const T = dark ? DARK : LIGHT;

  if (!auth) return <LoginPage onLogin={({ token, user }) => setAuth({ token, user })} />;

  const { user } = auth;
  const visibleNav = navItems.filter(n => !n.roles || n.roles.includes(user.role));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "system-ui, -apple-system, sans-serif", color: T.text }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 228 : 60, background: T.sidebar, display: "flex", flexDirection: "column", padding: "0 0 16px", flexShrink: 0, transition: "width 0.2s", overflow: "hidden" }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${T.sidebarBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {sidebarOpen && <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>🏥 CareTrack</div>
            <div style={{ fontSize: 11, color: T.sidebarText, marginTop: 2 }}>Tibbiy Yozuvlar v2</div>
          </div>}
          {!sidebarOpen && <div style={{ fontSize: 22 }}>🏥</div>}
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>{sidebarOpen ? "◀" : "▶"}</button>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {visibleNav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} title={n.label} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", background: page === n.id ? "rgba(255,255,255,0.18)" : "none", color: page === n.id ? "#fff" : T.sidebarText, cursor: "pointer", fontSize: 14, textAlign: "left", marginBottom: 3, fontWeight: page === n.id ? 700 : 400, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
              {sidebarOpen && n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 10px", borderTop: `1px solid ${T.sidebarBorder}` }}>
          {sidebarOpen && <>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 2 }}>{user.username}</div>
            <div style={{ marginBottom: 10 }}><Badge text={roleLabel[user.role]} color="#93c5fd" /></div>
          </>}
          <button onClick={() => setDark(d => !d)} title={dark ? "Light mode" : "Dark mode"} style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "7px", cursor: "pointer", fontSize: sidebarOpen ? 13 : 18, marginBottom: 6 }}>
            {dark ? (sidebarOpen ? "☀️ Light mode" : "☀️") : (sidebarOpen ? "🌙 Dark mode" : "🌙")}
          </button>
          <button onClick={() => { setAuth(null); setPage("dashboard"); }} title="Chiqish" style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: T.sidebarText, borderRadius: 8, padding: "7px", cursor: "pointer", fontSize: sidebarOpen ? 13 : 18 }}>
            {sidebarOpen ? "Chiqish" : "🚪"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ height: 56, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: T.subtext }}>
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, color: T.subtext, background: T.tableHead, padding: "4px 12px", borderRadius: 20 }}>
              👤 {user.username} · <Badge text={roleLabel[user.role]} color={roleColor[user.role]} />
            </div>
            <NotificationBell theme={T} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {page === "dashboard" && <Dashboard user={user} theme={T} />}
          {page === "doctors" && <DoctorsPage user={user} theme={T} />}
          {page === "patients" && <PatientsPage user={user} theme={T} />}
          {page === "diagnoses" && <DiagnosesPage user={user} theme={T} />}
          {page === "schedule" && <SchedulePage user={user} theme={T} />}
          {page === "admin" && user.role === "admin" && <AdminPanel theme={T} />}
        </div>
      </div>
    </div>
  );
}
