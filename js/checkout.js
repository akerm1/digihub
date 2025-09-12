// enhanced-checkout.js
import { auth, db } from './firebase.js';
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    setDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements (with null checks)
const productNameElement = document.getElementById('product-name');
const productDescriptionElement = document.getElementById('product-description');
const productPriceElement = document.getElementById('product-price');
const originalPriceElement = document.getElementById('original-price');
const productImageElement = document.getElementById('product-image');
const confirmPaymentButton = document.getElementById('confirm-payment');
const processingElement = document.getElementById('processing');
const timerElement = document.getElementById('timer');
const timerProgressElement = document.getElementById('timer-progress');
const successModal = document.getElementById('success-modal');
const accountEmailElement = document.getElementById('account-email');
const accountPasswordElement = document.getElementById('account-password');

// Product data with enhanced information
const products = {
    'netflix': {
        name: 'Netflix Premium',
        description: 'Stream unlimited movies and TV shows in Ultra HD on up to 4 screens simultaneously. Access exclusive Netflix Originals and content from around the world.',
        price: 12.99,
        originalPrice: 15.99,
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
        features: ['4K Ultra HD streaming', 'Watch on 4 screens at once', 'Download content for offline viewing', 'No ads or interruptions']
    },
    'spotify': {
        name: 'Spotify Premium',
        description: 'Enjoy ad-free music streaming with high-quality audio, offline downloads, and unlimited skips. Access over 70 million songs and exclusive podcasts.',
        price: 9.99,
        originalPrice: 12.99,
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
        features: ['320kbps high-quality audio', 'Unlimited skips and replays', 'Download music for offline', 'No ads between songs']
    },
    'prime': {
        name: 'Prime Video',
        description: 'Watch thousands of movies and TV shows including award-winning Amazon Originals. Plus enjoy free shipping and other Prime benefits.',
        price: 8.99,
        originalPrice: 11.99,
        image: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Prime_Video_logo.png',
        features: ['Thousands of movies & shows', 'Amazon Original series', 'Watch on any device', 'Free fast shipping included']
    }
};

// Timer variables
let timeLeft = 15 * 60; // 15 minutes in seconds
let timerInterval;
const totalTime = 15 * 60;

// Payment addresses (in real app, these would be generated dynamically)
const paymentAddresses = {
    usdt: 'TQn9Y2khEsLMWD4y2bCCquCLa8k9sH6w32',
    bitcoin: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    binance: 'digitalhub_pay_2024'
};

// Animation and interaction handlers
let selectedPaymentMethod = null;
let currentUser = null; // Track authenticated user

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Add loading animation
    document.body.classList.add('loading');
    
    // Await auth state to prevent race conditions
    await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (!user) {
                showNotification('Please login to complete purchase', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                updateUserNavigation(user);
                unsubscribe(); // Clean up listener
                resolve();
            }
        });
    });
    
    // Initialize components
    await initializeCheckout();
    
    // Remove loading state
    setTimeout(() => {
        document.body.classList.remove('loading');
        animatePageElements();
    }, 1000);
});

// Initialize checkout functionality
async function initializeCheckout() {
    try {
        await loadProductData();
        setupPaymentAddresses();
        setupPaymentSelection();
        setupCopyButtons();
        setupPaymentConfirmation();
        startTimer();
        setupModalHandlers();
        setupMobileNavigation();
        initializeEnhancements(); // From your code
    } catch (error) {
        console.error('Error initializing checkout:', error);
        showNotification('Error initializing checkout', 'error');
    }
}

// Load and display product data
async function loadProductData() {
    try {
        const selectedProduct = localStorage.getItem('selectedProduct');
        if (!selectedProduct || !products[selectedProduct]) {
            throw new Error('Invalid product selection');
        }
        
        const product = products[selectedProduct];
        
        // Update product information with animation
        setTimeout(() => {
            if (productNameElement) productNameElement.textContent = product.name;
            if (productNameElement) productNameElement.classList.add('fade-in');
        }, 200);
        
        setTimeout(() => {
            if (productDescriptionElement) productDescriptionElement.textContent = product.description;
            if (productDescriptionElement) productDescriptionElement.classList.add('slide-up');
        }, 400);
        
        setTimeout(() => {
            if (productPriceElement) productPriceElement.textContent = `$${product.price.toFixed(2)}`;
            if (originalPriceElement) originalPriceElement.textContent = `$${product.originalPrice.toFixed(2)}`;
            if (productImageElement) {
                productImageElement.src = product.image;
                productImageElement.alt = product.name;
            }
        }, 600);
        
        // Calculate savings
        const savings = ((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(0);
        const savingsBadge = document.querySelector('.savings-badge');
        if (savingsBadge) {
            savingsBadge.innerHTML = `<i class="fas fa-piggy-bank"></i>Save ${savings}%`;
        }
        
    } catch (error) {
        console.error("Error loading product data:", error);
        showNotification('Error loading product data', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Setup payment addresses
function setupPaymentAddresses() {
    // Update USDT address
    const usdtAddress = document.getElementById('usdt-address');
    if (usdtAddress) {
        usdtAddress.value = paymentAddresses.usdt;
    }
    
    // Update Bitcoin address
    const bitcoinAddress = document.getElementById('bitcoin-address');
    if (bitcoinAddress) {
        bitcoinAddress.value = paymentAddresses.bitcoin;
    }
    
    // Update Binance Pay ID
    const binanceId = document.getElementById('binance-id');
    if (binanceId) {
        binanceId.value = paymentAddresses.binance;
    }
    
    // Update QR codes
    updateQRCodes();
}

// Update QR codes for payment methods
function updateQRCodes() {
    const qrImages = document.querySelectorAll('.qr-container img');
    qrImages.forEach((img, index) => {
        const methods = ['usdt', 'bitcoin', 'binance'];
        const method = methods[index];
        if (method && paymentAddresses[method] && img) {
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentAddresses[method])}`;
            img.alt = `${method.toUpperCase()} QR Code`;
        }
    });
}

// Setup payment method selection
function setupPaymentSelection() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Store selected method
            selectedPaymentMethod = option.getAttribute('data-method');
            
            // Add selection animation
            const card = option.querySelector('.payment-card');
            if (card) {
                card.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            }
            
            // Enable confirm button if not already enabled
            if (confirmPaymentButton) {
                confirmPaymentButton.disabled = false;
                confirmPaymentButton.style.opacity = '1';
            }
            
            // Scroll to confirmation section on mobile
            if (window.innerWidth <= 768) {
                const confirmationSection = document.querySelector('.confirmation-section');
                if (confirmationSection) {
                    confirmationSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        });
        
        // Add hover effects
        option.addEventListener('mouseenter', () => {
            if (!option.classList.contains('selected')) {
                option.style.transform = 'translateY(-5px)';
            }
        });
        
        option.addEventListener('mouseleave', () => {
            if (!option.classList.contains('selected')) {
                option.style.transform = '';
            }
        });
    });
}

// Setup copy button functionality
function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const targetId = button.getAttribute('data-clipboard-target');
            const targetElement = document.querySelector(targetId);
            
            if (!targetElement) return;
            
            const textToCopy = targetElement.value || targetElement.textContent;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Success feedback with animation
                const originalHTML = button.innerHTML;
                const originalColor = button.style.background;
                
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                button.style.background = '#10b981';
                button.style.transform = 'scale(1.1)';
                
                // Haptic feedback on mobile
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.style.background = originalColor;
                    button.style.transform = '';
                }, 2000);
                
                showNotification('Address copied to clipboard!', 'success');
                
            } catch (error) {
                console.error('Failed to copy:', error);
                showNotification('Failed to copy to clipboard', 'error');
                
                // Fallback: select text
                if (targetElement.select) {
                    targetElement.select();
                }
            }
        });
    });
}

// Setup payment confirmation (ENHANCED ERROR HANDLING)
function setupPaymentConfirmation() {
    if (!confirmPaymentButton) return;
    
    confirmPaymentButton.addEventListener('click', async () => {
        // Validate selection
        if (!selectedPaymentMethod) {
            showNotification('Please select a payment method first', 'warning');
            return;
        }
        
        if (!currentUser) {
            showNotification('Please login to complete purchase', 'error');
            return;
        }
        
        try {
            console.log('Starting payment processing for user:', currentUser.uid); // Debug log
            
            // Start processing animation
            startProcessingAnimation();
            
            // Get selected product
            const selectedProduct = localStorage.getItem('selectedProduct');
            const product = products[selectedProduct];
            
            if (!product) {
                throw new Error('Invalid product');
            }
            
            // Generate order and account details
            const orderId = generateOrderId();
            const accountDetails = generateAccountDetails(selectedProduct);
            
            // Create purchase record
            const purchaseData = {
                userId: currentUser.uid,
                productId: selectedProduct,
                productName: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                purchaseDate: serverTimestamp(),
                orderId: orderId,
                status: 'completed',
                paymentMethod: selectedPaymentMethod,
                paymentAddress: paymentAddresses[selectedPaymentMethod],
                accountDetails: accountDetails
            };
            
            // Save to Firestore (with merge fallback)
            const purchaseRef = doc(collection(db, "purchases"));
            await setDoc(purchaseRef, purchaseData, { merge: true });
            console.log('Purchase saved successfully:', purchaseRef.id); // Debug log
            
            // Simulate processing steps
            await simulateProcessingSteps();
            
            // Show success
            showSuccessModal(accountDetails);
            
            // Clear timer
            clearInterval(timerInterval);
            
        } catch (error) {
            console.error("Payment error details:", {
                code: error.code,
                message: error.message,
                userId: currentUser?.uid,
                product: localStorage.getItem('selectedProduct')
            });
            
            // Specific error messages
            let userMessage = 'Error processing payment. Please try again.';
            if (error.code === 'permission-denied') {
                userMessage = 'Payment access denied. Check your account permissions.';
            } else if (error.code === 'unavailable' || error.message.includes('network')) {
                userMessage = 'Network error. Check your connection and try again.';
            } else if (error.message.includes('Invalid product')) {
                userMessage = 'Invalid product selected. Redirecting to store.';
                setTimeout(() => { window.location.href = 'index.html'; }, 2000);
            }
            
            showNotification(userMessage, 'error');
            resetConfirmationState();
        }
    });
}

// ... (Rest of your functions remain unchanged: startProcessingAnimation, simulateProcessingSteps, startTimer, etc.)
// [Include all other functions from your original code here, as they are solid—no changes needed]

function startProcessingAnimation() {
    if (confirmPaymentButton) confirmPaymentButton.style.display = 'none';
    if (processingElement) processingElement.style.display = 'flex';
    if (processingElement) processingElement.classList.add('fade-in');
}

async function simulateProcessingSteps() {
    const steps = document.querySelectorAll('.processing-step');
    
    for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (i > 0 && steps[i - 1]) steps[i - 1].classList.remove('active');
        if (steps[i]) {
            steps[i].classList.add('active');
            steps[i].style.transform = 'scale(1.05)';
            setTimeout(() => { if (steps[i]) steps[i].style.transform = ''; }, 300);
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
}

function startTimer() {
    if (!timerProgressElement) return;
    const circumference = 2 * Math.PI * 45;
    timerProgressElement.style.strokeDasharray = circumference;
    timerProgressElement.style.strokeDashoffset = 0;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerElement) updateTimerDisplay();
        if (timerProgressElement) updateProgressCircle();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimerExpiration();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (!timerElement) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 60) {
        const parent = timerElement.parentElement;
        if (parent) parent.classList.add('warning');
    }
}

function updateProgressCircle() {
    if (!timerProgressElement) return;
    const circumference = 2 * Math.PI * 45;
    const progress = (totalTime - timeLeft) / totalTime;
    timerProgressElement.style.strokeDashoffset = circumference * progress;
    
    if (timeLeft <= 300) timerProgressElement.style.stroke = '#f59e0b';
    if (timeLeft <= 60) timerProgressElement.style.stroke = '#ef4444';
}

function handleTimerExpiration() {
    showNotification('Payment time expired. Redirecting to home page...', 'error');
    const timerSection = document.querySelector('.timer-section');
    if (timerSection) timerSection.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => { window.location.href = 'index.html'; }, 3000);
}

function showSuccessModal(accountDetails) {
    if (accountEmailElement) accountEmailElement.textContent = accountDetails.email;
    if (accountPasswordElement) accountPasswordElement.textContent = accountDetails.password;
    if (successModal) {
        successModal.style.display = 'block';
        successModal.classList.add('fade-in');
    }
    createConfettiEffect();
}

function createConfettiEffect() {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const confettiContainer = document.createElement('div');
    Object.assign(confettiContainer.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '10001'
    });
    document.body.appendChild(confettiContainer);
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            Object.assign(confetti.style, {
                position: 'absolute', width: '10px', height: '10px',
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                left: Math.random() * 100 + '%', top: '-10px', borderRadius: '50%',
                animation: `fall ${2 + Math.random() * 3}s linear forwards`
            });
            confettiContainer.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }, i * 50);
    }
    
    setTimeout(() => confettiContainer.remove(), 8000);
}

function resetConfirmationState() {
    if (processingElement) processingElement.style.display = 'none';
    if (confirmPaymentButton) confirmPaymentButton.style.display = 'block';
    
    const steps = document.querySelectorAll('.processing-step');
    steps.forEach(step => step.classList.remove('active'));
}

function generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `DH${timestamp}${random}`;
}

function generateAccountDetails(productId) {
    const domains = {
        'netflix': ['@netflix.com', '@gmail.com', '@outlook.com'],
        'spotify': ['@spotify.com', '@gmail.com', '@yahoo.com'],
        'prime': ['@amazon.com', '@gmail.com', '@hotmail.com']
    };
    
    const adjectives = ['cool', 'smart', 'happy', 'swift', 'bright', 'calm', 'bold'];
    const nouns = ['user', 'star', 'wave', 'rock', 'moon', 'fire', 'wind'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    const username = `${adjective}${noun}${number}`;
    const domainOptions = domains[productId] || domains.netflix;
    const domain = domainOptions[Math.floor(Math.random() * domainOptions.length)];
    const email = username + domain;
    
    // Generate secure password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return { email, password };
}

function setupModalHandlers() {
    if (!successModal) return;
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && successModal.style.display === 'block') {
            closeSuccessModal();
        }
    });
}

function closeSuccessModal() {
    if (successModal) successModal.style.display = 'none';
    window.location.href = 'profile.html';
}

function setupMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
}

function updateUserNavigation(user) {
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement && user.displayName) {
        userNameElement.textContent = user.displayName;
    }
}

function animatePageElements() {
    const productShowcase = document.querySelector('.product-showcase');
    if (productShowcase) {
        productShowcase.style.animation = 'slideInLeft 0.8s ease-out';
    }
    
    const productInfo = document.querySelector('.product-info');
    if (productInfo) {
        productInfo.style.animation = 'slideInRight 0.8s ease-out';
    }
    
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach((option, index) => {
        option.style.animationDelay = `${0.2 + index * 0.1}s`;
    });
    
    const trustItems = document.querySelectorAll('.trust-item');
    trustItems.forEach((item, index) => {
        item.style.animation = `fadeInUp 0.6s ease-out ${0.1 + index * 0.1}s forwards`;
        item.style.opacity = '0';
    });
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed', top: '100px', right: '20px',
        background: getNotificationColor(type), color: 'white',
        padding: '15px 20px', borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', zIndex: '10000',
        display: 'flex', alignItems: 'center', gap: '10px',
        minWidth: '300px', transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-out', backdropFilter: 'blur(10px)'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
    
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };
    return colors[type] || '#6366f1';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ... (Include all your other utility functions: setupIntersectionObserver, setupPageVisibility, etc.—they're unchanged and excellent!)

// Add intersection observer for animations
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    const elementsToObserve = document.querySelectorAll(
        '.payment-option, .trust-item, .step-item'
    );
    
    elementsToObserve.forEach(element => {
        observer.observe(element);
    });
}

// Handle page visibility changes
function setupPageVisibility() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause timer when page is hidden
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        } else {
            // Resume timer when page is visible
            if (timeLeft > 0) {
                startTimer();
            }
        }
    });
}

// Add keyboard navigation support
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Navigate payment options with arrow keys
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            navigatePaymentOptions(e.key === 'ArrowDown' ? 1 : -1);
        }
        
        // Select payment option with Enter or Space
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedOption = document.querySelector('.payment-option:focus');
            if (focusedOption) {
                e.preventDefault();
                focusedOption.click();
            }
        }
        
        // Trigger payment confirmation with Ctrl+Enter
        if (e.ctrlKey && e.key === 'Enter') {
            if (confirmPaymentButton && !confirmPaymentButton.disabled) {
                confirmPaymentButton.click();
            }
        }
    });
}

function navigatePaymentOptions(direction) {
    const options = Array.from(document.querySelectorAll('.payment-option'));
    const currentIndex = options.findIndex(option => 
        option === document.activeElement || 
        option.contains(document.activeElement)
    );
    
    let nextIndex;
    if (currentIndex === -1) {
        nextIndex = direction > 0 ? 0 : options.length - 1;
    } else {
        nextIndex = (currentIndex + direction + options.length) % options.length;
    }
    
    if (options[nextIndex]) {
        options[nextIndex].focus();
        options[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Performance monitoring
function setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Page loaded in ${Math.round(loadTime)}ms`);
        
        // Send analytics if needed (in production)
        // sendAnalytics('page_load_time', loadTime);
    });
    
    // Monitor user interactions
    let interactionCount = 0;
    document.addEventListener('click', () => {
        interactionCount++;
        if (interactionCount === 1) {
            console.log('First user interaction detected');
        }
    });
}

// Add smooth scrolling behavior
function setupSmoothScrolling() {
    // Smooth scroll for anchor links
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
}

// Error boundary for JavaScript errors
function setupErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('JavaScript error:', e.error);
        showNotification('An unexpected error occurred. Please refresh the page.', 'error');
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        showNotification('A network error occurred. Please check your connection.', 'error');
    });
}

// Add custom CSS animations
function addCustomAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInLeft {
            from {
                transform: translateX(-50px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(50px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeInUp {
            from {
                transform: translateY(30px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        @keyframes fall {
            0% {
                transform: translateY(-10px) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
        
        .animate-in {
            animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .payment-option {
            tabindex: 0;
        }
        
        .payment-option:focus {
            outline: 2px solid var(--primary);
            outline-offset: 2px;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .timer-section.warning {
            animation: pulse 1s infinite;
        }
        
        .nav-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .nav-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .nav-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
        
        @media (max-width: 768px) {
            .nav-links {
                position: fixed;
                top: 70px;
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                padding: 20px;
                flex-direction: column;
                gap: 20px;
                transform: translateY(-100%);
                opacity: 0;
                transition: all 0.3s ease-out;
                border-bottom: 1px solid rgba(99, 102, 241, 0.1);
            }
            
            .nav-links.active {
                transform: translateY(0);
                opacity: 1;
            }
            
            .notification {
                right: 10px;
                left: 10px;
                minWidth: auto;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize all enhancements
function initializeEnhancements() {
    setupIntersectionObserver();
    setupPageVisibility();
    setupKeyboardNavigation();
    setupPerformanceMonitoring();
    setupSmoothScrolling();
    setupErrorHandling();
    addCustomAnimations();
}

// Call initialization after DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEnhancements);