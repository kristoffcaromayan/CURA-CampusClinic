<?php
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
                // Rule: Permanent Retention & Admin Control
                if ($user['status'] === 'pending') {
                    $error = 'Your account is pending Administrator review and approval. Permanent retention is active: your account will not be deleted, but clinic access remains locked until approved by the Clinic Administrator.';
                    $active_tab = 'login';
                } elseif ($user['status'] === 'rejected') {
                    $error = 'This account registration was declined by the clinic administration.';
                    $active_tab = 'login';
                } else {
                    // Set session variables
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
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CURA - NORSU Mabinay Campus Clinic</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #FAFAFA; }
        .bg-azure { background-color: #007FFF; }
        .text-azure { color: #007FFF; }
        .border-azure { border-color: #007FFF; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        <!-- Header Banner matching screenshots -->
        <div class="relative bg-gradient-to-r from-blue-900 to-sky-700 px-6 py-6 text-white text-center">
            <h1 class="text-2xl font-black tracking-wider">CURA</h1>
            <p class="text-xs font-semibold uppercase tracking-widest text-sky-200 mt-1">NORSU MABINAY CAMPUS CLINIC</p>
        </div>

        <div class="p-6">
            <!-- Tab Switcher -->
            <div class="flex bg-slate-100 p-1 rounded-full mb-6">
                <button onclick="switchTab('signup')" id="btn-tab-signup" class="flex-1 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 <?php echo $active_tab === 'signup' ? 'bg-[#007FFF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'; ?>">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                    Sign Up
                </button>
                <button onclick="switchTab('login')" id="btn-tab-login" class="flex-1 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 <?php echo $active_tab === 'login' ? 'bg-[#007FFF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'; ?>">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                    Log In
                </button>
            </div>

            <?php if (!empty($error)): ?>
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs leading-relaxed">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($success)): ?>
                <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs leading-relaxed">
                    <?php echo htmlspecialchars($success); ?>
                </div>
            <?php endif; ?>

            <!-- SIGN UP FORM -->
            <form id="form-signup" method="POST" action="login.php" class="<?php echo $active_tab === 'signup' ? '' : 'hidden'; ?> space-y-4">
                <input type="hidden" name="action" value="signup">

                <button type="button" class="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                    <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                    Sign Up with Google
                </button>

                <div class="relative flex py-1 items-center">
                    <div class="flex-grow border-t border-slate-200"></div>
                    <span class="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or use school id / email</span>
                    <div class="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                    <input type="text" name="full_name" required placeholder="Full Name" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">ID Number *</label>
                        <input type="text" name="id_number" required placeholder="202300220" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                        <select name="role" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] bg-white">
                            <option value="Student">Student</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Course or Department</label>
                    <input type="text" name="course_dept" placeholder="BS Information Technology" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input type="email" name="email" required placeholder="yourname@gmail.com" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                    <input type="password" name="password" required placeholder="At least 6 characters" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]">
                    <span class="text-[10px] text-slate-400 mt-1 block">Must be at least 6 characters.</span>
                </div>

                <button type="submit" class="w-full py-2.5 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                    Create Account & Sign In
                </button>
            </form>

            <!-- LOG IN FORM -->
            <form id="form-login" method="POST" action="login.php" class="<?php echo $active_tab === 'login' ? '' : 'hidden'; ?> space-y-4">
                <input type="hidden" name="action" value="login">

                <button type="button" class="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                    <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                    Log In with Google
                </button>

                <div class="relative flex py-1 items-center">
                    <div class="flex-grow border-t border-slate-200"></div>
                    <span class="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or use school id / email</span>
                    <div class="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Email or Student/Staff ID *</label>
                    <input type="text" name="identifier" required placeholder="yourname@gmail.com" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]">
                </div>

                <div>
                    <div class="flex justify-between items-center mb-1">
                        <label class="block text-xs font-semibold text-slate-700">Password *</label>
                        <a href="#" class="text-[11px] text-[#007FFF] hover:underline font-medium">Forgot?</a>
                    </div>
                    <input type="password" name="password" required placeholder="Enter your password" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]">
                </div>

                <button type="submit" class="w-full py-2.5 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                    Log In
                </button>
            </form>
        </div>
    </div>

    <script>
        function switchTab(tab) {
            const signupForm = document.getElementById('form-signup');
            const loginForm = document.getElementById('form-login');
            const btnSignup = document.getElementById('btn-tab-signup');
            const btnLogin = document.getElementById('btn-tab-login');

            if (tab === 'signup') {
                signupForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
                btnSignup.className = "flex-1 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 bg-[#007FFF] text-white shadow-sm";
                btnLogin.className = "flex-1 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900";
            } else {
                loginForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
                btnLogin.className = "flex-1 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 bg-[#007FFF] text-white shadow-sm";
                btnSignup.className = "flex-1 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900";
            }
        }
    </script>
</body>
</html>
