const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('caretrack.db');
const SECRET = 'caretrack_secret_2026';

app.use(cors());
app.use(express.json());

// ============================================
// MA'LUMOTLAR BAZASINI SOZLASH (SQLite)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'clinician', 'receptionist')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    phone TEXT,
    email TEXT,
    address TEXT,
    doctor_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS diagnoses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    icd_code TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('Mild', 'Moderate', 'Severe', 'Critical')),
    diagnosis_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
`);

// Demo foydalanuvchilar
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  const clinicHash = bcrypt.hashSync('clinic123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('doctor1', clinicHash, 'clinician');
  
  // Demo shifokorlar
  db.prepare('INSERT INTO doctors (first_name, last_name, specialty, department, phone, email) VALUES (?, ?, ?, ?, ?, ?)').run('Alisher', 'Karimov', 'Cardiology', 'Kardiologiya', '+998901234567', 'a.karimov@caretrack.uz');
  db.prepare('INSERT INTO doctors (first_name, last_name, specialty, department, phone, email) VALUES (?, ?, ?, ?, ?, ?)').run('Zulfiya', 'Rahimova', 'Neurology', 'Nevrologiya', '+998907654321', 'z.rahimova@caretrack.uz');
  
  // Demo bemorlar
  db.prepare('INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, doctor_id) VALUES (?, ?, ?, ?, ?, ?)').run('Bobur', 'Yusupov', '1990-05-15', 'Male', '+998901111111', 1);
  db.prepare('INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, doctor_id) VALUES (?, ?, ?, ?, ?, ?)').run('Malika', 'Toshmatova', '1985-08-22', 'Female', '+998902222222', 2);
  
  // Demo tashxislar
  db.prepare('INSERT INTO diagnoses (patient_id, icd_code, description, severity, diagnosis_date) VALUES (?, ?, ?, ?, ?)').run(1, 'I10', 'Arterial hypertension', 'Moderate', '2024-01-15');
  db.prepare('INSERT INTO diagnoses (patient_id, icd_code, description, severity, diagnosis_date) VALUES (?, ?, ?, ?, ?)').run(2, 'G43.9', 'Migraine', 'Mild', '2024-02-10');
}

// ============================================
// MIDDLEWARE - Token tekshirish
// ============================================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token yo\'q' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token noto\'g\'ri' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Faqat administrator uchun' });
  next();
};

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Noto\'g\'ri foydalanuvchi yoki parol' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// ============================================
// DOCTORS CRUD - Shifokorlar
// ============================================
app.get('/api/doctors', authMiddleware, (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM doctors';
  let params = [];
  if (search) {
    query += ' WHERE first_name LIKE ? OR last_name LIKE ? OR specialty LIKE ? OR department LIKE ?';
    const s = `%${search}%`;
    params = [s, s, s, s];
  }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/doctors/:id', authMiddleware, (req, res) => {
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Shifokor topilmadi' });
  const patients = db.prepare('SELECT * FROM patients WHERE doctor_id = ?').all(req.params.id);
  res.json({ ...doctor, patients });
});

app.post('/api/doctors', authMiddleware, adminOnly, (req, res) => {
  const { first_name, last_name, specialty, department, phone, email } = req.body;
  if (!first_name || !last_name || !specialty || !department) {
    return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
  }
  const result = db.prepare('INSERT INTO doctors (first_name, last_name, specialty, department, phone, email) VALUES (?, ?, ?, ?, ?, ?)').run(first_name, last_name, specialty, department, phone, email);
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(doctor);
});

app.put('/api/doctors/:id', authMiddleware, adminOnly, (req, res) => {
  const { first_name, last_name, specialty, department, phone, email } = req.body;
  const existing = db.prepare('SELECT id FROM doctors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Shifokor topilmadi' });
  db.prepare('UPDATE doctors SET first_name=?, last_name=?, specialty=?, department=?, phone=?, email=? WHERE id=?').run(first_name, last_name, specialty, department, phone, email, req.params.id);
  res.json(db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id));
});

app.delete('/api/doctors/:id', authMiddleware, adminOnly, (req, res) => {
  const existing = db.prepare('SELECT id FROM doctors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Shifokor topilmadi' });
  db.prepare('DELETE FROM doctors WHERE id = ?').run(req.params.id);
  res.json({ message: 'Shifokor o\'chirildi' });
});

// ============================================
// PATIENTS CRUD - Bemorlar
// ============================================
app.get('/api/patients', authMiddleware, (req, res) => {
  const { search, doctor_id } = req.query;
  let query = `SELECT p.*, d.first_name || ' ' || d.last_name AS doctor_name, d.specialty 
               FROM patients p LEFT JOIN doctors d ON p.doctor_id = d.id WHERE 1=1`;
  let params = [];
  if (search) {
    query += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (doctor_id) {
    query += ' AND p.doctor_id = ?';
    params.push(doctor_id);
  }
  query += ' ORDER BY p.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/patients/:id', authMiddleware, (req, res) => {
  const patient = db.prepare(`SELECT p.*, d.first_name || ' ' || d.last_name AS doctor_name, d.specialty 
                               FROM patients p LEFT JOIN doctors d ON p.doctor_id = d.id 
                               WHERE p.id = ?`).get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Bemor topilmadi' });
  const diagnoses = db.prepare('SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY diagnosis_date DESC').all(req.params.id);
  res.json({ ...patient, diagnoses });
});

app.post('/api/patients', authMiddleware, (req, res) => {
  const { first_name, last_name, date_of_birth, gender, phone, email, address, doctor_id } = req.body;
  if (!first_name || !last_name || !date_of_birth) {
    return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
  }
  const result = db.prepare('INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address, doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(first_name, last_name, date_of_birth, gender, phone, email, address, doctor_id || null);
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(patient);
});

app.put('/api/patients/:id', authMiddleware, (req, res) => {
  const { first_name, last_name, date_of_birth, gender, phone, email, address, doctor_id } = req.body;
  const existing = db.prepare('SELECT id FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bemor topilmadi' });
  db.prepare('UPDATE patients SET first_name=?, last_name=?, date_of_birth=?, gender=?, phone=?, email=?, address=?, doctor_id=? WHERE id=?').run(first_name, last_name, date_of_birth, gender, phone, email, address, doctor_id || null, req.params.id);
  res.json(db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id));
});

app.delete('/api/patients/:id', authMiddleware, (req, res) => {
  if (req.user.role === 'clinician') return res.status(403).json({ error: 'Bemor o\'chirish huquqi yo\'q' });
  const existing = db.prepare('SELECT id FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bemor topilmadi' });
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  res.json({ message: 'Bemor o\'chirildi' });
});

// ============================================
// DIAGNOSES CRUD - Tashxislar
// ============================================
app.get('/api/diagnoses', authMiddleware, (req, res) => {
  const { patient_id, search } = req.query;
  let query = `SELECT d.*, p.first_name || ' ' || p.last_name AS patient_name 
               FROM diagnoses d JOIN patients p ON d.patient_id = p.id WHERE 1=1`;
  let params = [];
  if (patient_id) { query += ' AND d.patient_id = ?'; params.push(patient_id); }
  if (search) {
    query += ' AND (d.icd_code LIKE ? OR d.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY d.diagnosis_date DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/diagnoses', authMiddleware, (req, res) => {
  const { patient_id, icd_code, description, severity, diagnosis_date, notes } = req.body;
  if (!patient_id || !icd_code || !description || !diagnosis_date) {
    return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
  }
  const result = db.prepare('INSERT INTO diagnoses (patient_id, icd_code, description, severity, diagnosis_date, notes) VALUES (?, ?, ?, ?, ?, ?)').run(patient_id, icd_code, description, severity, diagnosis_date, notes);
  res.status(201).json(db.prepare('SELECT * FROM diagnoses WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/diagnoses/:id', authMiddleware, (req, res) => {
  const { icd_code, description, severity, diagnosis_date, notes } = req.body;
  const existing = db.prepare('SELECT id FROM diagnoses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tashxis topilmadi' });
  db.prepare('UPDATE diagnoses SET icd_code=?, description=?, severity=?, diagnosis_date=?, notes=? WHERE id=?').run(icd_code, description, severity, diagnosis_date, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM diagnoses WHERE id = ?').get(req.params.id));
});

app.delete('/api/diagnoses/:id', authMiddleware, (req, res) => {
  if (req.user.role === 'clinician') return res.status(403).json({ error: 'Tashxis o\'chirish huquqi yo\'q' });
  const existing = db.prepare('SELECT id FROM diagnoses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tashxis topilmadi' });
  db.prepare('DELETE FROM diagnoses WHERE id = ?').run(req.params.id);
  res.json({ message: 'Tashxis o\'chirildi' });
});

// ============================================
// DASHBOARD STATS
// ============================================
app.get('/api/stats', authMiddleware, (req, res) => {
  res.json({
    doctors: db.prepare('SELECT COUNT(*) as count FROM doctors').get().count,
    patients: db.prepare('SELECT COUNT(*) as count FROM patients').get().count,
    diagnoses: db.prepare('SELECT COUNT(*) as count FROM diagnoses').get().count,
    recent_patients: db.prepare('SELECT p.*, d.first_name || " " || d.last_name as doctor_name FROM patients p LEFT JOIN doctors d ON p.doctor_id = d.id ORDER BY p.created_at DESC LIMIT 5').all()
  });
});
const path = require('path');

// Frontend yig'ilgan build papkasini static fayl sifatida ulash
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Har qanday boshqa so'rov kelganda React-ning index.html faylini qaytarish (Express 5 versiya uchun to'g'ri variant)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Serverni faqat BITTA joyda ishga tushirish
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CareTrack server ${PORT}-portda ishlamoqda`));