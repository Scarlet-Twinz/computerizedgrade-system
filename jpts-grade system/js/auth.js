// ============================================
// AUTHENTICATION SYSTEM
// ============================================

function showMessage(message, type) {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} toast-notification`;
    toast.innerHTML = `${message}<button type="button" class="btn-close float-end" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// LOGIN
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let loginInput = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing in...';
    
    try {
        let email = loginInput;
        if (!loginInput.includes('@')) {
            const studentQuery = await db.collection('students').where('matricNumber', '==', loginInput).get();
            if (!studentQuery.empty) {
                email = studentQuery.docs[0].data().email;
            } else {
                throw new Error('Matric number not found');
            }
        }
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
        const role = userDoc.data().role;
        
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', userDoc.data().name);
        localStorage.setItem('userId', userCredential.user.uid);
        
        showMessage(`Welcome back, ${userDoc.data().name}!`, 'success');
        
        setTimeout(() => {
            if (role === 'admin') window.location.href = 'admin-dashboard.html';
            else if (role === 'lecturer') window.location.href = 'lecturer-dashboard.html';
            else if (role === 'hod') window.location.href = 'hod-dashboard.html';
            else if (role === 'exam_officer') window.location.href = 'exam-officer-dashboard.html';
            else window.location.href = 'student-dashboard.html';
        }, 1500);
        
    } catch (error) {
        let errorMsg = error.message;
        if (error.code === 'auth/user-not-found') errorMsg = 'No account found. Please sign up first.';
        if (error.code === 'auth/wrong-password') errorMsg = 'Incorrect password. Please try again.';
        showMessage(errorMsg, 'danger');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// SIGNUP
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const regNumber = document.getElementById('signupNumber').value;
    const role = document.getElementById('signupRole').value;
    const department = document.getElementById('signupDept').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    
    if (password !== confirm) {
        showMessage('Passwords do not match!', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'danger');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating account...';
    
    try {
        const existingUser = await db.collection('users').where('email', '==', email).get();
        if (!existingUser.empty) {
            throw new Error('Email already registered. Please use a different email.');
        }
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await db.collection('users').doc(user.uid).set({
            name, email, regNumber, role, department, createdAt: new Date()
        });
        
        if (role === 'student') {
            await db.collection('students').doc(user.uid).set({
                name, matricNumber: regNumber, email, department, level: '100', createdAt: new Date()
            });
        } else if (role === 'lecturer') {
            await db.collection('lecturers').doc(user.uid).set({
                name, staffId: regNumber, email, department, courses: [], createdAt: new Date()
            });
        } else if (role === 'hod') {
            await db.collection('hod').doc(user.uid).set({
                name, staffId: regNumber, email, department, createdAt: new Date()
            });
        } else if (role === 'exam_officer') {
            await db.collection('exam_officers').doc(user.uid).set({
                name, staffId: regNumber, email, department, createdAt: new Date()
            });
        } else if (role === 'admin') {
            await db.collection('admins').doc(user.uid).set({
                name, staffId: regNumber, email, createdAt: new Date()
            });
        }
        
        showMessage('Account created successfully! Please login.', 'success');
        document.getElementById('signupForm').reset();
        document.querySelector('#authTab button[data-bs-target="#loginTab"]').click();
        
    } catch (error) {
        showMessage(error.message, 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// FORGOT PASSWORD
document.getElementById('forgotPasswordBtn')?.addEventListener('click', () => {
    $('#forgotModal').modal('show');
});

document.getElementById('sendResetBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('resetEmail').value;
    if (!email) {
        showMessage('Please enter your email address', 'danger');
        return;
    }
    
    const btn = document.getElementById('sendResetBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Password reset email sent! Check your inbox.', 'success');
        $('#forgotModal').modal('hide');
        document.getElementById('resetEmail').value = '';
    } catch (error) {
        let errorMsg = error.message;
        if (error.code === 'auth/user-not-found') errorMsg = 'No account found with this email.';
        showMessage(errorMsg, 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Check if already logged in
auth.onAuthStateChanged(async (user) => {
    if (user && window.location.pathname.includes('login.html')) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists()) {
            const role = userDoc.data().role;
            if (role === 'admin') window.location.href = 'admin-dashboard.html';
            else if (role === 'lecturer') window.location.href = 'lecturer-dashboard.html';
            else if (role === 'hod') window.location.href = 'hod-dashboard.html';
            else if (role === 'exam_officer') window.location.href = 'exam-officer-dashboard.html';
            else window.location.href = 'student-dashboard.html';
        }
    }
});