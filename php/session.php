<?php
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
}
