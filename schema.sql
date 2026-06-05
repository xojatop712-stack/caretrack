-- ============================================================
-- CareTrack Clinic - Tibbiy Yozuvlar Tizimi (TYBT)
-- Ma'lumotlar bazasi sxemasi - SQLite
-- ============================================================

-- Foydalanuvchilar jadvali (Rol asosidagi kirish)
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,                          -- bcrypt hash
    role       TEXT NOT NULL CHECK(role IN ('admin', 'clinician', 'receptionist')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shifokorlar jadvali
CREATE TABLE IF NOT EXISTS doctors (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    specialty   TEXT NOT NULL,                         -- Mutaxassislik
    department  TEXT NOT NULL,                         -- Bo'lim
    phone       TEXT,
    email       TEXT UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bemorlar jadvali (Shifokorga bog'langan)
CREATE TABLE IF NOT EXISTS patients (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT NOT NULL,
    last_name     TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender        TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    phone         TEXT,
    email         TEXT,
    address       TEXT,
    doctor_id     INTEGER,                             -- Biriktirilgan shifokor
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- Kasallik/Tashxis jadvali (Bemorga bog'langan)
CREATE TABLE IF NOT EXISTS diagnoses (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id     INTEGER NOT NULL,
    icd_code       TEXT NOT NULL,                      -- Xalqaro kasalliklar kodi
    description    TEXT NOT NULL,
    severity       TEXT CHECK(severity IN ('Mild', 'Moderate', 'Severe', 'Critical')),
    diagnosis_date DATE NOT NULL,
    notes          TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ============================================================
-- MUNOSABATLAR (Relationships):
-- 1 Doctor -> Ko'p Patients  (bir shifokorga ko'p bemor)
-- 1 Patient -> Ko'p Diagnoses (bir bemorga ko'p tashxis)
-- ============================================================

-- Demo ma'lumotlar
INSERT INTO users (username, password, role) VALUES 
    ('admin', '$2a$10$...hashAdmin...', 'admin'),
    ('dr_karimov', '$2a$10$...hashDoctor...', 'clinician'),
    ('reception1', '$2a$10$...hashReception...', 'receptionist');

INSERT INTO doctors (first_name, last_name, specialty, department, phone, email) VALUES
    ('Alisher', 'Karimov', 'Cardiology', 'Kardiologiya', '+998901234567', 'a.karimov@caretrack.uz'),
    ('Zulfiya', 'Rahimova', 'Neurology', 'Nevrologiya', '+998907654321', 'z.rahimova@caretrack.uz'),
    ('Sardor', 'Mirzayev', 'Dermatology', 'Dermatologiya', '+998905555555', 's.mirzayev@caretrack.uz');

INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, doctor_id) VALUES
    ('Bobur', 'Yusupov', '1990-05-15', 'Male', '+998901111111', 1),
    ('Malika', 'Toshmatova', '1985-08-22', 'Female', '+998902222222', 2),
    ('Jasur', 'Hasanov', '2001-12-01', 'Male', '+998903333333', 1);

INSERT INTO diagnoses (patient_id, icd_code, description, severity, diagnosis_date) VALUES
    (1, 'I10', 'Arterial hypertension', 'Moderate', '2024-01-15'),
    (2, 'G43.9', 'Migraine without aura', 'Mild', '2024-02-10'),
    (1, 'E11.9', 'Type 2 diabetes mellitus', 'Moderate', '2024-03-20'),
    (3, 'J06.9', 'Acute upper respiratory infection', 'Mild', '2024-04-05');
