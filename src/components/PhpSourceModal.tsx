import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Database, Shield, Download } from 'lucide-react';

interface PhpSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhpSourceModal: React.FC<PhpSourceModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<'login' | 'session' | 'db' | 'database_sql'>('login');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files = {
    login: {
      name: 'login.php',
      desc: 'Split-screen authentication, registration with pending approval & login verification',
      code: `<?php
/**
 * CURA - NORSU Mabinay Campus Clinic
 * Login & Sign-Up Interface (Clean Pure Basic PHP + Tailwind CSS)
 * Implements the split-screen authentication view matching log on.JPG & log in 2.JPG
 */

require_once 'session.php';
require_once 'db.php';

// If already logged in, redirect to respective portal
if (isAuthenticated() && isset($_SESSION['account_status']) && $_SESSION['account_status'] === 'approved') {
    if ($_SESSION['user_role'] === 'admin') header('Location: admin_dashboard.php');
    elseif ($_SESSION['user_role'] === 'doctor') header('Location: doctor_dashboard.php');
    else header('Location: patient_dashboard.php');
    exit;
}

$active_tab = isset($_GET['tab']) && $_GET['tab'] === 'login' ? 'login' : 'signup';
$error = '';
$success = '';

if (isset($_GET['error']) && $_GET['error'] === 'unapproved') {
    $error = 'Your account is pending Administrator review and approval. Permanent retention is active: your account will not be deleted, but clinic access remains locked until approved.';
    $active_tab = 'login';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'login') {
        $identifier = trim($_POST['identifier'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($identifier) || empty($password)) {
            $error = 'Please fill in both email/ID number and password.';
            $active_tab = 'login';
        } else {
            // Find user by email or ID number
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :id1 OR id_number = :id2 LIMIT 1");
            $stmt->execute(['id1' => $identifier, 'id2' => $identifier]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                // Core Rule: Permanent Retention & Admin Control
                if ($user['status'] === 'pending') {
                    $error = 'Your account is pending Administrator review and approval. Permanent retention is active: your account will not be deleted, but clinic access remains locked until approved by the Clinic Administrator.';
                    $active_tab = 'login';
                } elseif ($user['status'] === 'rejected') {
                    $error = 'This account registration was declined by the clinic administration.';
                    $active_tab = 'login';
                } else {
                    // Standard PHP $_SESSION management
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['user_name'] = $user['full_name'];
                    $_SESSION['user_email'] = $user['email'];
                    $_SESSION['user_role'] = $user['role'];
                    $_SESSION['id_number'] = $user['id_number'];
                    $_SESSION['account_status'] = $user['status'];

                    if ($user['role'] === 'admin') header('Location: admin_dashboard.php');
                    elseif ($user['role'] === 'doctor') header('Location: doctor_dashboard.php');
                    else header('Location: patient_dashboard.php');
                    exit;
                }
            } else {
                $error = 'Invalid credentials. Please verify your Email/ID number and Password.';
                $active_tab = 'login';
            }
        }
    } elseif ($action === 'signup') {
        $full_name = trim($_POST['full_name'] ?? '');
        $id_number = trim($_POST['id_number'] ?? '');
        $role = trim($_POST['role'] ?? 'Student');
        $course_dept = trim($_POST['course_dept'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($full_name) || empty($id_number) || empty($email) || empty($password)) {
            $error = 'Please fill in all required fields marked with an asterisk (*).';
            $active_tab = 'signup';
        } elseif (strlen($password) < 6) {
            $error = 'Password must be at least 6 characters.';
            $active_tab = 'signup';
        } else {
            // Check if email or ID already registered
            $check = $pdo->prepare("SELECT id FROM users WHERE email = :email OR id_number = :id_num");
            $check->execute(['email' => $email, 'id_num' => $id_number]);
            if ($check->rowCount() > 0) {
                $error = 'An account with this Email or ID number already exists. Please log in instead.';
                $active_tab = 'login';
            } else {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                // Permanent Retention: Stored as 'pending' until Admin approves
                $insert = $pdo->prepare("INSERT INTO users (full_name, id_number, role, course_dept, email, password_hash, status, created_at) 
                                        VALUES (:name, :id_num, :role, :dept, :email, :hash, 'pending', NOW())");
                $insert->execute([
                    'name' => $full_name,
                    'id_num' => $id_number,
                    'role' => strtolower($role),
                    'dept' => $course_dept,
                    'email' => $email,
                    'hash' => $hash,
                ]);

                $success = 'Account created successfully! Your profile is permanently registered and is now pending Administrator review and approval. Once approved, you can log in.';
                $active_tab = 'login';
            }
        }
    }
}`,
    },
    session: {
      name: 'session.php',
      desc: 'Standard $_SESSION middleware, authentication verification & role gatekeeping',
      code: `<?php
/**
 * CURA - NORSU Mabinay Campus Clinic
 * Session Management & Access Control
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if a user is currently authenticated
 */
function isAuthenticated() {
    return isset($_SESSION['user_id']) && isset($_SESSION['user_role']);
}

/**
 * Require active session or redirect to login
 */
function requireLogin() {
    if (!isAuthenticated()) {
        header('Location: login.php?msg=Please log in to continue');
        exit;
    }

    // Core Security Rule: Unapproved accounts cannot access the system
    if (isset($_SESSION['account_status']) && $_SESSION['account_status'] !== 'approved') {
        session_destroy();
        header('Location: login.php?error=unapproved');
        exit;
    }
}

/**
 * Enforce role-based access for specific portals
 */
function requireRole($allowedRoles) {
    requireLogin();
    
    if (is_string($allowedRoles)) {
        $allowedRoles = [$allowedRoles];
    }
    
    if (!in_array($_SESSION['user_role'], $allowedRoles)) {
        // Redirect to appropriate portal based on their actual role
        if ($_SESSION['user_role'] === 'admin') {
            header('Location: admin_dashboard.php');
        } elseif ($_SESSION['user_role'] === 'doctor') {
            header('Location: doctor_dashboard.php');
        } else {
            header('Location: patient_dashboard.php');
        }
        exit;
    }
}

/**
 * Log out and destroy session cleanly
 */
function logoutUser() {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    header('Location: login.php?msg=You have logged out successfully.');
    exit;
}`,
    },
    db: {
      name: 'db.php',
      desc: 'Secure PDO database connection with prepared statements',
      code: `<?php
/**
 * CURA - NORSU Mabinay Campus Clinic
 * Database Configuration & PDO Initialization
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'medigraph_clinic');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}`,
    },
    database_sql: {
      name: 'database.sql',
      desc: 'Complete relational MySQL schema with users, sessions, appointments & inventory',
      code: `-- CURA - NORSU Mabinay Campus Clinic Database Schema
-- Azure Blue (#007FFF) & Lily White (#FAFAFA) University Health System

CREATE DATABASE IF NOT EXISTS medigraph_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medigraph_clinic;

-- 1. Users Table (Permanent Retention active)
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
);`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#007FFF] text-white flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                CURA Pure PHP Architecture &amp; Source Code
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Clean basic PHP implementation with standard $_SESSION management, PDO MySQL, &amp; permanent retention rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2 gap-1 overflow-x-auto">
          {(Object.keys(files) as Array<keyof typeof files>).map(key => (
            <button
              key={key}
              onClick={() => setActiveFile(key)}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                activeFile === key
                  ? 'bg-white text-[#007FFF] border-t-2 border-[#007FFF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {key === 'database_sql' ? <Database className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
              {files[key].name}
            </button>
          ))}
        </div>

        {/* Active File Description & Actions */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium truncate pr-2">
            <strong>{files[activeFile].name}:</strong> {files[activeFile].desc}
          </span>
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-slate-100 hover:bg-[#007FFF] hover:text-white text-slate-700 font-bold rounded text-xs transition flex items-center gap-1.5 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed">
          <pre>{files[activeFile].code}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
          <span>All pure PHP files are also saved in the project repository at <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/php/</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#007FFF] text-white font-bold rounded text-xs hover:bg-[#006bd6] transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
