// home.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const profileLink = document.querySelector('.profile-link');
const userNameElement = document.querySelector('.user-name');
const buyButtons = document.querySelectorAll('.btn-buy');
const faqItems = document.querySelectorAll('.faq-item');
const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

// Handle scroll event for navbar
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Toggle FAQ items
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        item.classList.toggle('active');
    });
});

// Mobile navigation toggle
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Handle product purchase
buyButtons.forEach(button => {
    button.addEventListener('click', () => {
        const product = button.getAttribute('data-product');
        
        // Check if user is logged in
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Store selected product in localStorage
                localStorage.setItem('selectedProduct', product);
                // Redirect to checkout
                window.location.href = 'checkout.html';
            } else {
                // Redirect to login
                showNotification('Please login to purchase products', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        });
    });
});

// Check authentication state and update UI
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        try {
            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Update profile link text
                if (userNameElement) {
                    const displayName = userData.name || user.email.split('@')[0];
                    userNameElement.textContent = displayName;
                }
            }
        } catch (error) {
            console.error("Error getting user data:", error);
        }
    } else {
        // User is signed out
        if (userNameElement) {
            userNameElement.textContent = 'Login';
        }
    }
});

// Utility function to show notifications
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '10px';
    notification.style.color = 'white';
    notification.style.fontWeight = '500';
    notification.style.zIndex = '1000';
    notification.style.transform = 'translateY(-100px)';
    notification.style.opacity = '0';
    notification.style.transition = 'all 0.3s ease';
    
    if (type === 'success') {
        notification.style.background = '#10b981';
        notification.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
    } else {
        notification.style.background = '#ef4444';
        notification.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
    }
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(-100px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}





// Export for use in other modules
export { showNotification };