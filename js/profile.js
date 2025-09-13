// Import all required Firebase modules from ONE source
import { auth, db, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from './firebase.js';
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Initialize AOS animations
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100
});

// DOM Elements
const profileNameElement = document.getElementById('profile-name');
const profileEmailElement = document.getElementById('profile-email');
const profileAvatarElement = document.getElementById('profile-avatar');
const userNameElement = document.querySelector('.user-name');
const userAvatarElement = document.querySelector('.user-avatar');
const purchaseCountElement = document.getElementById('purchase-count');
const memberSinceElement = document.getElementById('member-since');
const totalSavedElement = document.getElementById('total-saved');
const changePasswordButton = document.getElementById('change-password');
const editProfileButton = document.getElementById('edit-profile');
const downloadDataButton = document.getElementById('download-data');
const signOutButton = document.getElementById('sign-out');
const purchasesListElement = document.getElementById('purchases-list');
const noPurchasesElement = document.getElementById('no-purchases');
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('Global error:', event.message, event.filename, event.lineno);
    showNotification(`Unexpected error: ${event.message}`, 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification(`Error: ${event.reason?.message || 'Unexpected error'}`, 'error');
});

// Initialize particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        const startX = Math.random() * window.innerWidth;
        const endX = startX + (Math.random() - 0.5) * 200;
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${startX}px;
            --duration: ${duration}s;
            --x-end: ${endX - startX}px;
            animation-delay: ${delay}s;
        `;
        particlesContainer.appendChild(particle);
    }
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile navigation toggle
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close mobile nav when clicking on links
navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
    }
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Animate counter numbers
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Check authentication state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            await user.getIdToken(); // Verify token
            await loadProfileData(user);
            await loadPurchaseHistory(user.uid);
            initializeProfileAnimations();
        } catch (error) {
            console.error('Auth state error:', error.code, error.message);
            showNotification(`Error: ${error.message || 'Failed to load profile'}`, 'error');
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-disabled') {
                signOut(auth).then(() => window.location.href = 'login.html');
            }
        }
    } else {
        showNotification('Please login to access your profile', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
});

// Load profile data with enhanced safety
async function loadProfileData(user) {
    try {
        profileNameElement.innerHTML = '<div class="loading-shimmer" style="height: 2rem; border-radius: 4px;"></div>';
        if (!db) {
            throw new Error('Firestore not initialized. Check firebase.js');
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        let userData = {};
        if (userDoc.exists()) {
            userData = userDoc.data();
        } else {
            userData = {
                name: user.email.split('@')[0],
                email: user.email,
                createdAt: new Date()
            };
            await setDoc(doc(db, "users", user.uid), userData);
        }

        setTimeout(() => {
            const displayName = userData.name || user.email.split('@')[0];
            profileNameElement.textContent = displayName;
            profileEmailElement.innerHTML = `<i class="fas fa-envelope"></i> ${user.email}`;
            if (userNameElement) {
                userNameElement.textContent = displayName;
            }

            // SAFELY handle createdAt — works with Timestamp, Date, or string
            let memberSinceDate = new Date();
            if (userData.createdAt) {
                if (typeof userData.createdAt.toDate === 'function') {
                    // Firestore Timestamp
                    memberSinceDate = userData.createdAt.toDate();
                } else if (userData.createdAt instanceof Date) {
                    // JavaScript Date object
                    memberSinceDate = userData.createdAt;
                } else if (typeof userData.createdAt === 'string') {
                    // ISO string format
                    memberSinceDate = new Date(userData.createdAt);
                }
            }

            memberSinceElement.textContent = memberSinceDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            });

            const emailHash = btoa(user.email).replace(/[^a-zA-Z0-9]/g, '');
            const avatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=180`;
            profileAvatarElement.src = avatarUrl;
            if (userAvatarElement) {
                userAvatarElement.src = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=32`;
            }

            const totalSaved = Math.floor(Math.random() * 500) + 100;
            animateCounter(totalSavedElement, totalSaved, 1500);
        }, 500);

    } catch (error) {
        console.error("Error loading profile ", {
            message: error.message,
            code: error.code,
            userId: user?.uid
        });
        let errorMessage = 'Error loading profile data';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Check Firestore rules.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Firestore unavailable. Check connection.';
        }
        showNotification(errorMessage, 'error');
        profileNameElement.textContent = user.email.split('@')[0];
        profileEmailElement.innerHTML = `<i class="fas fa-envelope"></i> ${user.email}`;
    }
}

// Load purchase history with safe date parsing
async function loadPurchaseHistory(userId) {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const purchasesRef = collection(db, "purchases");
        const q = query(purchasesRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        purchasesListElement.innerHTML = '';
        if (querySnapshot.empty) {
            noPurchasesElement.style.display = 'flex';
            animateCounter(purchaseCountElement, 0, 1000);
            return;
        }

        noPurchasesElement.style.display = 'none';
        animateCounter(purchaseCountElement, querySnapshot.size, 1500);

        querySnapshot.forEach((doc, index) => {
            const purchase = doc.data();
            const purchaseCard = createEnhancedPurchaseCard(purchase, index);
            purchasesListElement.appendChild(purchaseCard);
        });

    } catch (error) {
        console.error("🔥 FIRESTORE ERROR DETAILS:", {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        showNotification('Error loading purchase history: ' + (error.message || 'Unknown error'), 'error');
    }
}

// Create enhanced purchase card with safe date handling
function createEnhancedPurchaseCard(purchase, index) {
    const card = document.createElement('div');
    card.className = 'purchase-card';
    card.style.setProperty('--delay', `${index * 0.1}s`);
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', index * 100);

    // SAFELY parse purchaseDate — supports Timestamp, Date, or string
    let purchaseDate = new Date();
    if (purchase.purchaseDate) {
        if (typeof purchase.purchaseDate.toDate === 'function') {
            purchaseDate = purchase.purchaseDate.toDate();
        } else if (purchase.purchaseDate instanceof Date) {
            purchaseDate = purchase.purchaseDate;
        } else if (typeof purchase.purchaseDate === 'string') {
            purchaseDate = new Date(purchase.purchaseDate);
        }
    }

    const formattedDate = purchaseDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const productDetails = getEnhancedProductDetails(purchase.productId || 'default');

    card.innerHTML = `
        <div class="purchase-header">
            <div class="purchase-product">
                <img src="${productDetails.image}" alt="${productDetails.name}">
                <div>
                    <h3>${productDetails.name}</h3>
                    <p class="purchase-date"><i class="fas fa-clock"></i> ${formattedDate}</p>
                </div>
            </div>
            <div class="purchase-status">
                <span class="status-badge ${purchase.status === 'completed' ? 'success' : 'pending'}">
                    <i class="fas fa-${purchase.status === 'completed' ? 'check-circle' : 'clock'}"></i>
                    ${purchase.status === 'completed' ? 'Delivered' : 'Processing'}
                </span>
            </div>
        </div>
        <div class="purchase-details">
            <p><strong>Order ID:</strong> <span>${purchase.orderId || 'N/A'}</span></p>
            <p><strong>Price:</strong> <span style="color: var(--success);">${purchase.price || '0.00'}</span></p>
            <p><strong>Savings:</strong> <span style="color: var(--accent);">${(purchase.savings || (Math.random() * 50 + 10)).toFixed(2)}</span></p>
            ${purchase.accountDetails ? `
            <div class="account-info">
                <h4><i class="fas fa-user-shield"></i> Account Details</h4>
                <div class="account-details">
                    <p>
                        <strong>Email:</strong> 
                        <span>${purchase.accountDetails.email || 'N/A'}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${purchase.accountDetails.email || ''}')" title="Copy email">
                            <i class="fas fa-copy"></i>
                        </button>
                    </p>
                    <p>
                        <strong>Password:</strong> 
                        <span>${purchase.accountDetails.password || 'N/A'}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${purchase.accountDetails.password || ''}')" title="Copy password">
                            <i class="fas fa-copy"></i>
                        </button>
                    </p>
                </div>
            </div>` : ''}
        </div>
        <div class="purchase-actions">
            ${purchase.status === 'completed' ? `
            <button class="btn-action view-btn" onclick="viewPurchaseDetails('${purchase.orderId || 'N/A'}')">
                <i class="fas fa-eye"></i> View Details
            </button>
            <button class="btn-action download-btn" onclick="downloadPurchase('${purchase.orderId || 'N/A'}')">
                <i class="fas fa-download"></i> Download
            </button>
            <button class="btn-action view-btn" onclick="sharePurchase('${purchase.orderId || 'N/A'}')" style="background: var(--gradient-secondary);">
                <i class="fas fa-share-alt"></i> Share
            </button>` : `
            <button class="btn-action processing-btn" disabled>
                <i class="fas fa-spinner"></i> Processing...
            </button>`}
        </div>
    `;
    return card;
}

// Enhanced product details
function getEnhancedProductDetails(productId) {
    const products = {
        'netflix': {
            name: 'Netflix Premium',
            image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
            description: 'Stream on 4 screens at once in Ultra HD.',
            category: 'Entertainment',
            features: ['4K Ultra HD', '4 Screens', 'Downloads', 'No Ads']
        },
        'spotify': {
            name: 'Spotify Premium',
            image: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
            description: 'Ad-free music and offline listening.',
            category: 'Music',
            features: ['Ad-free', 'Offline Mode', 'High Quality', 'Unlimited Skips']
        },
        'prime': {
            name: 'Amazon Prime Video',
            image: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Prime_Video_logo.png',
            description: 'Movies, TV shows, and Amazon Originals.',
            category: 'Entertainment',
            features: ['HD Streaming', 'Original Content', 'Multiple Devices', 'Fast Shipping']
        },
        'youtube': {
            name: 'YouTube Premium',
            image: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg',
            description: 'Ad-free YouTube and YouTube Music.',
            category: 'Entertainment',
            features: ['No Ads', 'Background Play', 'YouTube Music', 'Offline Videos']
        },
        'disney': {
            name: 'Disney Plus',
            image: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
            description: 'Disney, Pixar, Marvel, and more.',
            category: 'Entertainment',
            features: ['4K Ultra HD', 'Multiple Profiles', 'Downloads', 'Family Friendly']
        }
    };
    return products[productId] || {
        name: 'Digital Product',
        image: 'https://via.placeholder.com/60x60/6366f1/ffffff?text=DP',
        description: 'Premium digital subscription service.',
        category: 'Digital',
        features: ['Premium Access', 'Full Features', 'Multi-Device', '24/7 Support']
    };
}

// Copy to clipboard
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard!', 'success');
    });
};

// View purchase details
window.viewPurchaseDetails = function(orderId) {
    showNotification('Opening purchase details...', 'info');
    console.log('Viewing details for order:', orderId);
};

// Download purchase
window.downloadPurchase = function(orderId) {
    showNotification('Preparing download...', 'info');
    setTimeout(() => {
        showNotification('Download started!', 'success');
        console.log('Downloading order:', orderId);
    }, 1000);
};

// Share purchase
window.sharePurchase = function(orderId) {
    if (navigator.share) {
        navigator.share({
            title: 'My DigitalHub Purchase',
            text: 'Check out this amazing deal I got from DigitalHub!',
            url: window.location.href
        });
    } else {
        copyToClipboard(window.location.href);
        showNotification('Link copied to share!', 'success');
    }
};

// Initialize profile animations
function initializeProfileAnimations() {
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('fade-in');
        }, index * 200);
    });
    const interactiveElements = document.querySelectorAll('.interactive-hover');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'translateY(-2px) scale(1.02)';
        });
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translateY(0) scale(1)';
        });
    });
    const buttons = document.querySelectorAll('.action-btn, .btn-action');
    buttons.forEach(button => {
        button.addEventListener('click', createRippleEffect);
    });
}

// Create ripple effect
function createRippleEffect(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        animation: ripple 0.6s ease-out;
    `;
    button.style.position = 'relative';
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// Button event handlers
if (changePasswordButton) {
    changePasswordButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            showNotification('You must be logged in to change password', 'error');
            return;
        }
        changePasswordButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Sending...</span>';
        changePasswordButton.disabled = true;
        try {
            await sendPasswordResetEmail(auth, user.email);
            showNotification('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            console.error("Error sending password reset email:", error);
            let errorMessage = 'Failed to send reset email. Please try again.';
            if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'User not found.';
            }
            showNotification(errorMessage, 'error');
        } finally {
            setTimeout(() => {
                changePasswordButton.innerHTML = '<i class="fas fa-key"></i> <span>Change Password</span> <div class="action-description">Reset your account password</div>';
                changePasswordButton.disabled = false;
            }, 1000);
        }
    });
}

if (editProfileButton) {
    editProfileButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Please login to edit profile', 'error');
            return;
        }
        const newName = prompt('Enter your new name:', profileNameElement.textContent);
        if (newName && newName.trim()) {
            try {
                await setDoc(doc(db, "users", user.uid), { name: newName.trim() }, { merge: true });
                showNotification('Profile updated successfully!', 'success');
                await loadProfileData(user);
            } catch (error) {
                console.error("Error updating profile:", error);
                showNotification('Error updating profile', 'error');
            }
        }
    });
}

if (downloadDataButton) {
    downloadDataButton.addEventListener('click', () => {
        downloadDataButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Preparing...</span>';
        downloadDataButton.disabled = true;
        setTimeout(() => {
            showNotification('Data export prepared! Download started.', 'success');
            setTimeout(() => {
                downloadDataButton.innerHTML = '<i class="fas fa-download"></i> <span>Download Data</span> <div class="action-description">Export your account data</div>';
                downloadDataButton.disabled = false;
            }, 2000);
        }, 2000);
    });
}

if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
        signOutButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Signing Out...</span>';
        signOutButton.disabled = true;
        try {
            await signOut(auth);
            showNotification('Signed out successfully', 'success');
            document.body.style.transition = 'opacity 0.5s ease-out';
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } catch (error) {
            console.error("Error signing out:", error);
            showNotification('Error signing out. Please try again.', 'error');
            signOutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span>Sign Out</span> <div class="action-description">Logout from your account</div>';
            signOutButton.disabled = false;
        }
    });
}

// Add smooth scrolling to anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add intersection observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            if (entry.target.classList.contains('stat-item')) {
                const counter = entry.target.querySelector('h3');
                const target = parseInt(counter.textContent) || 0;
                if (target > 0) {
                    animateCounter(counter, target, 1500);
                }
            }
        }
    });
}, observerOptions);
document.querySelectorAll('.stat-item, .purchase-card, .action-btn').forEach(el => {
    observer.observe(el);
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
    }
});

// Lazy load images
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('fade-in');
                imageObserver.unobserve(img);
            }
        }
    });
});
document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

// Resize handler
window.lastWidth = window.innerWidth;
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (Math.abs(window.innerWidth - window.lastWidth) > 100) {
            const particles = document.getElementById('particles');
            particles.innerHTML = '';
            createParticles();
            window.lastWidth = window.innerWidth;
        }
    }, 250);
});

// Network status
window.addEventListener('online', () => {
    showNotification('Connection restored', 'success');
});
window.addEventListener('offline', () => {
    showNotification('You are offline. Some features may not work.', 'warning');
});

// Page load animation
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    const main = document.querySelector('main') || document.body;
    main.style.animation = 'fadeInUp 0.8s ease-out';
});

// Additional styles
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes ripple {
        0% { transform: scale(0); opacity: 0.6; }
        100% { transform: scale(1); opacity: 0; }
    }
    body { opacity: 0; transition: opacity 0.3s ease-in-out; }
    .fade-in { animation: fadeInUp 0.6s ease-out forwards; }
    .loading-shimmer {
        background: linear-gradient(90deg, 
            rgba(255,255,255,0.1) 0%, 
            rgba(255,255,255,0.2) 50%, 
            rgba(255,255,255,0.1) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .action-btn .action-description {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
        opacity: 0.8;
    }
    .cta-buttons { margin-top: var(--space-lg); }
    .purchase-card:nth-child(even) { animation-delay: 0.1s; }
    .purchase-card:nth-child(odd) { animation-delay: 0.2s; }
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
        .particle { display: none; }
    }
    .action-btn:focus-visible, .btn-action:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
    }
    @media (prefers-contrast: high) {
        :root { --bg-glass: rgba(255, 255, 255, 0.2); --text-secondary: #ffffff; }
        .purchase-card, .action-btn { border: 2px solid; }
    }
`;
document.head.appendChild(additionalStyles);

console.log('Enhanced Profile Page Initialized Successfully!');