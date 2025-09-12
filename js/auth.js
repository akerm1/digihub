// auth.js
import { auth, db } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* -----------------------
   DOM Elements
------------------------*/
const toggleSigninBtn = document.getElementById('toggle-signin');
const toggleSignupBtn = document.getElementById('toggle-signup');
const toggleSlider = document.querySelector('.toggle-slider');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');
const forgotPasswordLink = document.getElementById('forgot-password');
const backToSigninLink = document.getElementById('back-to-signin');
const loadingOverlay = document.getElementById('loading-overlay');

/* -----------------------
   Form switching
------------------------*/
if (toggleSigninBtn && toggleSignupBtn) {
    toggleSigninBtn.addEventListener('click', () => toggleActiveForm('signin'));
    toggleSignupBtn.addEventListener('click', () => toggleActiveForm('signup'));
}
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); toggleActiveForm('forgot'); });
}
if (backToSigninLink) {
    backToSigninLink.addEventListener('click', (e) => { e.preventDefault(); toggleActiveForm('signin'); });
}

function toggleActiveForm(formType) {
    signinForm?.classList.remove('active');
    signupForm?.classList.remove('active');
    forgotForm?.classList.remove('active');

    toggleSigninBtn?.classList.remove('active');
    toggleSignupBtn?.classList.remove('active');

    if (formType === 'signin') {
        signinForm?.classList.add('active');
        toggleSigninBtn?.classList.add('active');
        if (toggleSlider) toggleSlider.style.transform = 'translateX(0)';
        if (toggleSlider) toggleSlider.style.opacity = '1';
    } else if (formType === 'signup') {
        signupForm?.classList.add('active');
        toggleSignupBtn?.classList.add('active');
        if (toggleSlider) toggleSlider.style.transform = 'translateX(100%)';
        if (toggleSlider) toggleSlider.style.opacity = '1';
    } else if (formType === 'forgot') {
        forgotForm?.classList.add('active');
        if (toggleSlider) toggleSlider.style.opacity = '0';
    } else {
        if (toggleSlider) toggleSlider.style.opacity = '1';
    }
}

/* -----------------------
   Password toggles
------------------------*/
function initPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.toggle-password');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const input = e.target.closest('.input-group')?.querySelector('input');
            const icon = toggle.querySelector('i');
            if (!input || !icon) return;
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

/* -----------------------
   Password strength
------------------------*/
function initPasswordStrength() {
    const signupPassword = document.getElementById('signup-password');
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    if (signupPassword && strengthBar && strengthText) {
        signupPassword.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = calculatePasswordStrength(password);
            updatePasswordStrength(strength, strengthBar, strengthText);
        });
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    return Math.min(score, 100);
}

function updatePasswordStrength(strength, strengthBar, strengthText) {
    strengthBar.style.width = `${strength}%`;
    if (strength < 25) {
        strengthBar.style.background = '#ef4444';
        strengthText.textContent = 'Very Weak';
        strengthText.style.color = '#ef4444';
    } else if (strength < 50) {
        strengthBar.style.background = '#f59e0b';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#f59e0b';
    } else if (strength < 75) {
        strengthBar.style.background = '#eab308';
        strengthText.textContent = 'Fair';
        strengthText.style.color = '#eab308';
    } else {
        strengthBar.style.background = '#10b981';
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#10b981';
    }
}

/* -----------------------
   Loading / Buttons
------------------------*/
function setFormLoading(form, loading = true) {
    if (!form) return;
    const submitBtn = form.querySelector('.btn-submit, button[type="submit"]');
    if (!submitBtn) return;
    if (loading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function showLoadingOverlay(show = true) {
    if (!loadingOverlay) return;
    if (show) loadingOverlay.classList.add('show');
    else loadingOverlay.classList.remove('show');
}

/* -----------------------
   Helper: email validation
------------------------*/
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/* -----------------------
   Notification system (top-right stack)
------------------------*/
(function injectNotificationStyles(){
    const style = document.createElement('style');
    style.textContent = `
    .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 99999;
        pointer-events: none;
    }
    .notification {
        pointer-events: auto;
        min-width: 220px;
        max-width: 420px;
        padding: 12px 16px;
        border-radius: 10px;
        color: #fff;
        font-weight: 500;
        box-shadow: 0 8px 30px rgba(0,0,0,0.18);
        transform: translateX(120%);
        opacity: 0;
        display: flex;
        gap: 10px;
        align-items: center;
        transition: transform 0.35s cubic-bezier(.22,1,.36,1), opacity 0.35s ease;
    }
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    .notification .notification-content { display:flex; align-items:center; gap:12px; }
    .notification.success { background: linear-gradient(135deg,#10b981,#059669); }
    .notification.error { background: linear-gradient(135deg,#ef4444,#dc2626); }
    .notification.warning { background: linear-gradient(135deg,#f59e0b,#d97706); }
    .notification.info { background: linear-gradient(135deg,#3b82f6,#2563eb); }
    .notification i { font-size: 1.1rem; opacity: 0.95; }
    `;
    document.head.appendChild(style);
})();

function showNotification(message, type = 'info') {
    // Ensure container
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // icon + text
    const content = document.createElement('div');
    content.className = 'notification-content';
    const icon = document.createElement('i');
    icon.className = getNotificationIcon(type);
    const span = document.createElement('span');
    span.textContent = message;
    content.appendChild(icon);
    content.appendChild(span);
    notification.appendChild(content);
    container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => notification.classList.add('show'));

    // Auto remove after 4.5s
    const autoRemove = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            try { notification.remove(); } catch(e) {}
        }, 350);
    }, 4500);

    // Manual dismiss
    notification.addEventListener('click', () => {
        clearTimeout(autoRemove);
        notification.classList.remove('show');
        setTimeout(() => {
            try { notification.remove(); } catch(e) {}
        }, 300);
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-info-circle';
    }
}

/* -----------------------
   Sign Up Handler
------------------------*/
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('signup-name')?.value.trim() || '';
        const email = document.getElementById('signup-email')?.value.trim() || '';
        const password = document.getElementById('signup-password')?.value || '';
        const termsCheckbox = document.getElementById('terms-checkbox');

        if (!termsCheckbox?.checked) {
            showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
            return;
        }

        const strength = calculatePasswordStrength(password);
        if (strength < 50) {
            showNotification('Password is too weak. Please choose a stronger password.', 'error');
            return;
        }

        try {
            // prepare UI
            setFormLoading(signupForm, true);
            showLoadingOverlay(true);

            // clear previous auth state to avoid false redirects
            try { await signOut(auth); } catch (e) { /* ignore signOut errors */ }

            // remove previous error flag
            sessionStorage.removeItem('authError');

            // create account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // write to Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                createdAt: new Date(),
                uid: user.uid,
                lastLogin: new Date()
            });

            showNotification('Account created successfully! Welcome to DigitalHub! 🎉', 'success');

            // keep overlay shown until redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (error) {
            console.error("Error signing up:", error);
            // set error flag so onAuthStateChanged won't redirect
            sessionStorage.setItem('authError', 'true');

            let errorMessage = 'An error occurred. Please try again.';
            if (error?.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Try signing in instead.';
            } else if (error?.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters long.';
            } else if (error?.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error?.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection and try again.';
            }

            showNotification(errorMessage, 'error');

            // hide overlay on error
            showLoadingOverlay(false);
        } finally {
            setFormLoading(signupForm, false);
        }
    });
}

/* -----------------------
   Sign In Handler
------------------------*/
if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('signin-email')?.value.trim() || '';
        const password = document.getElementById('signin-password')?.value || '';
        const rememberMe = document.getElementById('remember-signin')?.checked || false;

        try {
            setFormLoading(signinForm, true);
            showLoadingOverlay(true);

            // clear previous auth state to avoid false redirects
            try { await signOut(auth); } catch (e) { /* ignore signOut errors */ }

            // remove previous error flag
            sessionStorage.removeItem('authError');

            // attempt sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ensure user doc exists / update lastLogin
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (!userDoc.exists()) {
                    await setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        createdAt: new Date(),
                        uid: user.uid,
                        lastLogin: new Date()
                    });
                } else {
                    await setDoc(doc(db, "users", user.uid), { lastLogin: new Date() }, { merge: true });
                }
            } catch (e) {
                console.warn('Firestore user doc write failed:', e);
            }

            if (rememberMe) localStorage.setItem('rememberUser', 'true');

            showNotification(`Welcome back! 👋`, 'success');
            // keep overlay visible until redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            console.error("Error signing in:", error);
            // set error flag so onAuthStateChanged won't interpret this as success
            sessionStorage.setItem('authError', 'true');

            let errorMessage = 'Invalid email or password.';
            if (error?.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Try signing up instead.';
            } else if (error?.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error?.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error?.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error?.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection and try again.';
            }

            showNotification(errorMessage, 'error');

            // hide overlay because login failed
            showLoadingOverlay(false);
        } finally {
            setFormLoading(signinForm, false);
        }
    });
}

/* -----------------------
   Forgot Password
------------------------*/
if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('reset-email')?.value.trim() || '';
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }

        try {
            setFormLoading(forgotForm, true);
            await sendPasswordResetEmail(auth, email);
            showNotification('Password reset email sent! Check your inbox and spam folder. 📧', 'success');
            forgotForm.reset();
            setTimeout(() => toggleActiveForm('signin'), 3000);
        } catch (error) {
            console.error("Error sending password reset email:", error);
            let errorMessage = 'Failed to send reset email. Please try again.';
            if (error?.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (error?.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error?.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            showNotification(errorMessage, 'error');
        } finally {
            setFormLoading(forgotForm, false);
        }
    });
}

/* -----------------------
   Auth State Listener
   Only redirect if there is NO authError flag
------------------------*/
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.endsWith('login.html')) {
        // If an auth error flag exists it means last attempt failed; skip redirect
        if (!sessionStorage.getItem('authError')) {
            showLoadingOverlay(true);
            showNotification('Already signed in! Redirecting...', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            // Clear flag after a short time so future valid sign-ins will redirect normally
            setTimeout(() => sessionStorage.removeItem('authError'), 1500);
        }
    }
});

/* -----------------------
   Init UI features on DOM load
------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    initPasswordStrength();

    // Add input focus effects
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', (e) => e.target.parentElement.classList.add('focused'));
        input.addEventListener('blur', (e) => e.target.parentElement.classList.remove('focused'));
    });

    // Preload remember me
    const rememberUser = localStorage.getItem('rememberUser');
    if (rememberUser === 'true') {
        const rememberCheckbox = document.getElementById('remember-signin');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
});

/* -----------------------
   Export helpers (if other modules use them)
------------------------*/
export { showNotification, showLoadingOverlay };
