-- CURA - NORSU Mabinay Campus Clinic Database Schema
-- Azure Blue & Lily White University Clinic Management System

CREATE DATABASE IF NOT EXISTS medigraph_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medigraph_clinic;

-- 1. Users Table (Patients, Staff, Doctors, Admins)
-- Rule: Permanent Retention (Accounts are never auto-deleted, pending approval gate)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    id_number VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    role ENUM('student', 'staff', 'doctor', 'admin') NOT NULL DEFAULT 'student',
    course_dept VARCHAR(120) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    approved_by VARCHAR(150) DEFAULT NULL,
    approved_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    specialties VARCHAR(150) NOT NULL DEFAULT 'General Medicine',
    available_days VARCHAR(100) NOT NULL DEFAULT 'Monday - Friday',
    tele VARCHAR(50) NOT NULL DEFAULT '09123456789',
    user_id INT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Scheduled Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    doctor_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    max_patients INT NOT NULL DEFAULT 20,
    booked_count INT NOT NULL DEFAULT 0,
    status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- 4. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_number INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    session_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 5. Clinic Medical Supplies Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(120) NOT NULL,
    category ENUM('Medicine', 'PPE', 'First Aid', 'Equipment') NOT NULL DEFAULT 'Medicine',
    quantity INT NOT NULL DEFAULT 0,
    min_stock_threshold INT NOT NULL DEFAULT 10,
    unit VARCHAR(30) NOT NULL DEFAULT 'pieces',
    last_restocked DATE DEFAULT NULL
);

-- Seed Initial System Data matching screenshots
-- Default Admin
INSERT INTO users (full_name, id_number, email, role, course_dept, password_hash, status, created_at)
VALUES ('Administrator', 'ADMIN-001', 'admin@edoc.com', 'admin', 'Campus Clinic Administration', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'approved', NOW())
ON DUPLICATE KEY UPDATE id=id;

-- Default Doctor
INSERT INTO users (full_name, id_number, email, role, course_dept, password_hash, status, created_at)
VALUES ('Test Doctor.', 'DOC-001', 'doctor@edoc.com', 'doctor', 'Medical Health Services', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'approved', NOW())
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO doctors (id, name, email, specialties, available_days, tele)
VALUES (1, 'Test Doctor', 'doctor@edoc.com', 'General Medicine', 'Monday - Friday (8:00 AM - 5:00 PM)', '09123456789')
ON DUPLICATE KEY UPDATE id=id;

-- Default Approved Patient
INSERT INTO users (full_name, id_number, email, role, course_dept, password_hash, status, created_at)
VALUES ('Test Patient.', '202300000', 'patient@edoc.com', 'student', 'BS Information Technology', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'approved', NOW())
ON DUPLICATE KEY UPDATE id=id;

-- Pending Patient (Demonstrating Permanent Retention rule)
INSERT INTO users (full_name, id_number, email, role, course_dept, password_hash, status, created_at)
VALUES ('Maria Santos', '202300220', 'maria@edoc.com', 'student', 'BS Information Technology', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pending', NOW())
ON DUPLICATE KEY UPDATE id=id;

-- Initial Sessions & Appointments
INSERT INTO sessions (id, title, doctor_id, scheduled_date, scheduled_time, max_patients, booked_count, status)
VALUES (1, 'Test Session', 1, '2026-11-05', '18:00:00', 10, 1, 'active')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO appointments (id, appointment_number, patient_id, doctor_id, session_id, scheduled_date, scheduled_time, status)
VALUES (1, 1, 3, 1, 1, '2026-11-05', '18:00:00', 'confirmed')
ON DUPLICATE KEY UPDATE id=id;

-- Initial Medical Inventory
INSERT INTO inventory (item_name, category, quantity, min_stock_threshold, unit, last_restocked) VALUES
('Paracetamol 500mg', 'Medicine', 8, 20, 'boxes', '2026-10-15'),
('Surgical Face Masks 3-Ply', 'PPE', 150, 50, 'boxes', '2026-10-20'),
('70% Isopropyl Alcohol', 'First Aid', 5, 10, 'bottles', '2026-09-10'),
('Sterile Gauze Bandage', 'First Aid', 45, 15, 'packs', '2026-10-18'),
('Povidone Iodine 10%', 'First Aid', 12, 5, 'bottles', '2026-10-22'),
('Mefenamic Acid 500mg', 'Medicine', 0, 15, 'boxes', '2026-08-30');
