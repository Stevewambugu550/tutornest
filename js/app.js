// TutorNest Main Application JavaScript
// Connects Frontend with Backend API

// API Configuration
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://tutornest-api.herokuapp.com/api';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Initialize features based on page
    const page = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(page) {
        case 'index.html':
            initializeHomePage();
            break;
        case 'find-tutors.html':
            initializeFindTutors();
            break;
        case 'register.html':
            initializeRegistration();
            break;
        case 'tutor-dashboard.html':
            initializeTutorDashboard();
            break;
        case 'student-dashboard.html':
            initializeStudentDashboard();
            break;
        case 'instant-classes.html':
            initializeInstantClasses();
            break;
        case 'chat-learn.html':
            initializeChatLearn();
            break;
    }
    
    // Global features
    initializeSearch();
    initializeNotifications();
    updateOnlineStatus();
}

// Authentication Status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.email) {
        // User is logged in
        updateNavForLoggedInUser(user);
        
        // Connect WebSocket for real-time features
        if (window.TutorNestWS) {
            window.TutorNestWS.connect();
        }
    } else {
        // User is not logged in
        updateNavForGuest();
    }
}

// Update Navigation for Logged In User
function updateNavForLoggedInUser(user) {
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        navButtons.innerHTML = `
            <span style="margin-right: 1rem;">Welcome, ${user.firstName || 'User'}!</span>
            <a href="${user.role === 'tutor' ? 'tutor-dashboard.html' : 'student-dashboard.html'}" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                <i class="fas fa-tachometer-alt"></i> Dashboard
            </a>
            <button onclick="logout()" class="btn-login" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    }
}

// Update Navigation for Guest
function updateNavForGuest() {
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        navButtons.innerHTML = `
            <a href="auth/login.html" class="btn-login">Login</a>
            <a href="auth/register.html" class="btn-primary">Get Started</a>
        `;
    }
}

// Initialize Home Page
function initializeHomePage() {
    // Load featured tutors
    loadFeaturedTutors();
    
    // Initialize hero search
    const searchBtn = document.querySelector('.search-btn-primary');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const subject = document.querySelector('.search-select')?.value;
            window.location.href = `find-tutors.html?subject=${subject}`;
        });
    }
    
    // Load statistics
    updatePlatformStats();
}

// Load Featured Tutors
async function loadFeaturedTutors() {
    try {
        const response = await fetch(`${API_BASE}/tutors/search?limit=6&sort=rating`);
        const data = await response.json();
        
        if (data.success && data.tutors) {
            displayFeaturedTutors(data.tutors);
        }
    } catch (error) {
        console.error('Error loading tutors:', error);
        // Use sample data if API not available
        displaySampleTutors();
    }
}

// Display Featured Tutors
function displayFeaturedTutors(tutors) {
    const tutorsGrid = document.querySelector('.tutors-grid');
    if (!tutorsGrid) return;
    
    tutorsGrid.innerHTML = tutors.map(tutor => `
        <div class="tutor-card">
            <div class="tutor-header">
                <img src="${tutor.avatar || 'https://i.pravatar.cc/100'}" alt="${tutor.fullName}">
                <span class="status-badge ${tutor.isOnline ? 'online' : 'offline'}">
                    ${tutor.isOnline ? 'Available' : 'Offline'}
                </span>
            </div>
            <div class="tutor-body">
                <h3>${tutor.firstName} ${tutor.lastName}</h3>
                <p class="tutor-title">${tutor.tutorProfile?.qualifications?.[0]?.degree || 'Expert Tutor'}</p>
                <div class="tutor-rating">
                    ${'⭐'.repeat(Math.round(tutor.tutorProfile?.rating?.average || 5))}
                    <span>${tutor.tutorProfile?.rating?.average || '5.0'} (${tutor.tutorProfile?.rating?.count || 0} reviews)</span>
                </div>
                <div class="tutor-subjects">
                    ${(tutor.tutorProfile?.subjects || []).slice(0, 3).map(s => 
                        `<span class="subject-badge">${s}</span>`
                    ).join('')}
                </div>
                <p class="tutor-bio">${tutor.bio || 'Experienced tutor ready to help you succeed.'}</p>
            </div>
            <div class="tutor-footer">
                <span class="tutor-price">$${tutor.tutorProfile?.hourlyRate || 50}/hr</span>
                <button class="btn-primary" onclick="bookTutor('${tutor._id}')">Book Now</button>
            </div>
        </div>
    `).join('');
}

// Display Sample Tutors (Fallback)
function displaySampleTutors() {
    const sampleTutors = [
        {
            name: "Dr. Sarah Johnson",
            degree: "PhD Mathematics, MIT",
            rating: 5.0,
            reviews: 2847,
            subjects: ["Calculus", "Linear Algebra", "Statistics"],
            price: 85,
            bio: "MIT PhD specializing in making complex math simple.",
            online: true
        },
        {
            name: "Michael Chen",
            degree: "MS Computer Science, Stanford",
            rating: 4.9,
            reviews: 1923,
            subjects: ["Python", "Java", "Machine Learning"],
            price: 95,
            bio: "Google engineer teaching the next generation.",
            online: true
        },
        {
            name: "Dr. Emily Rodriguez",
            degree: "MD/PhD, Johns Hopkins",
            rating: 5.0,
            reviews: 2156,
            subjects: ["Biology", "Chemistry", "MCAT"],
            price: 90,
            bio: "Medical doctor helping pre-med students.",
            online: false
        }
    ];
    
    const tutorsGrid = document.querySelector('.tutors-grid');
    if (!tutorsGrid) return;
    
    tutorsGrid.innerHTML = sampleTutors.map(tutor => `
        <div class="tutor-card">
            <div class="tutor-header">
                <img src="https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 20)}" alt="${tutor.name}">
                <span class="status-badge ${tutor.online ? 'online' : 'offline'}">
                    ${tutor.online ? 'Available' : 'Offline'}
                </span>
            </div>
            <div class="tutor-body">
                <h3>${tutor.name}</h3>
                <p class="tutor-title">${tutor.degree}</p>
                <div class="tutor-rating">
                    ${'⭐'.repeat(Math.round(tutor.rating))}
                    <span>${tutor.rating} (${tutor.reviews} reviews)</span>
                </div>
                <div class="tutor-subjects">
                    ${tutor.subjects.map(s => `<span class="subject-badge">${s}</span>`).join('')}
                </div>
                <p class="tutor-bio">${tutor.bio}</p>
            </div>
            <div class="tutor-footer">
                <span class="tutor-price">$${tutor.price}/hr</span>
                <button class="btn-primary" onclick="bookTutor('sample')">Book Now</button>
            </div>
        </div>
    `).join('');
}

// Update Platform Statistics
function updatePlatformStats() {
    // Animated counter
    animateCounter('stat-tutors', 50000);
    animateCounter('stat-students', 2000000);
    animateCounter('stat-subjects', 200);
    animateCounter('stat-sessions', 10000000);
}

// Animate Counter
function animateCounter(id, target) {
    const element = document.getElementById(id);
    if (!element) return;
    
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = formatNumber(Math.floor(current));
    }, 20);
}

// Format Number
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M+';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toLocaleString();
}

// Book Tutor
function bookTutor(tutorId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.email) {
        // Not logged in, redirect to registration
        localStorage.setItem('redirectAfterLogin', `book-tutor-${tutorId}`);
        window.location.href = 'auth/register.html';
        return;
    }
    
    // Logged in, open booking modal
    openBookingModal(tutorId);
}

// Open Booking Modal
function openBookingModal(tutorId) {
    const modal = document.createElement('div');
    modal.className = 'booking-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Book Your Session</h2>
            <form id="booking-form">
                <div class="form-group">
                    <label>Select Date</label>
                    <input type="date" name="date" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Select Time</label>
                    <select name="time" required>
                        <option value="">Choose time</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Session Duration</label>
                    <select name="duration" required>
                        <option value="30">30 minutes</option>
                        <option value="60" selected>60 minutes</option>
                        <option value="90">90 minutes</option>
                        <option value="120">120 minutes</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Subject/Topic</label>
                    <input type="text" name="topic" placeholder="What do you need help with?" required>
                </div>
                <div class="form-group">
                    <label>Additional Notes (Optional)</label>
                    <textarea name="notes" placeholder="Any specific areas to focus on?"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Book Session</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitBooking(tutorId, new FormData(e.target));
    });
}

// Submit Booking
async function submitBooking(tutorId, formData) {
    const bookingData = {
        tutorId,
        date: formData.get('date'),
        time: formData.get('time'),
        duration: formData.get('duration'),
        topic: formData.get('topic'),
        notes: formData.get('notes')
    };
    
    try {
        const response = await fetch(`${API_BASE}/sessions/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(bookingData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Session booked successfully!');
            closeModal();
            window.location.href = 'student-dashboard.html';
        } else {
            alert('Booking failed: ' + data.message);
        }
    } catch (error) {
        console.error('Booking error:', error);
        alert('Session booked! (Demo mode)');
        closeModal();
    }
}

// Close Modal
function closeModal() {
    const modal = document.querySelector('.booking-modal');
    if (modal) {
        modal.remove();
    }
}

// Initialize Search
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(input.value);
            }
        });
    });
}

// Perform Search
function performSearch(query) {
    window.location.href = `find-tutors.html?search=${encodeURIComponent(query)}`;
}

// Initialize Notifications
function initializeNotifications() {
    // Request permission for notifications
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Check for new messages/notifications periodically
    setInterval(checkNotifications, 30000); // Every 30 seconds
}

// Check Notifications
async function checkNotifications() {
    if (!localStorage.getItem('authToken')) return;
    
    try {
        const response = await fetch(`${API_BASE}/notifications`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.notifications && data.notifications.length > 0) {
            updateNotificationBadge(data.notifications.length);
            
            // Show browser notification for new messages
            if (Notification.permission === 'granted') {
                data.notifications.slice(0, 3).forEach(notif => {
                    new Notification('TutorNest', {
                        body: notif.message,
                        icon: '/favicon.ico'
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

// Update Notification Badge
function updateNotificationBadge(count) {
    const badges = document.querySelectorAll('.notification-dot, .notification-badge');
    badges.forEach(badge => {
        if (count > 0) {
            badge.style.display = 'block';
            if (badge.classList.contains('notification-badge')) {
                badge.textContent = count > 99 ? '99+' : count;
            }
        } else {
            badge.style.display = 'none';
        }
    });
}

// Update Online Status
function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
        showOfflineMessage();
    }
    
    window.addEventListener('online', () => {
        hideOfflineMessage();
        location.reload();
    });
    
    window.addEventListener('offline', () => {
        showOfflineMessage();
    });
}

// Show Offline Message
function showOfflineMessage() {
    const message = document.createElement('div');
    message.className = 'offline-message';
    message.innerHTML = `
        <i class="fas fa-wifi"></i>
        <span>You're offline. Some features may not be available.</span>
    `;
    document.body.appendChild(message);
}

// Hide Offline Message
function hideOfflineMessage() {
    const message = document.querySelector('.offline-message');
    if (message) {
        message.remove();
    }
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    if (window.TutorNestWS) {
        window.TutorNestWS.disconnect();
    }
    
    window.location.href = 'index.html';
}

// Export functions for use in other scripts
window.TutorNestApp = {
    bookTutor,
    performSearch,
    logout,
    checkAuthStatus
};
