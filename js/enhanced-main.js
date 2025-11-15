// Enhanced TutorNest JavaScript - Professional Features

// Import base functionality
// Note: In production, use proper module system

// Initialize all features on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeEnhancedFeatures();
});

function initializeEnhancedFeatures() {
    // Core Features
    initializeAdvancedSearch();
    initializeTutorFilters();
    initializeDashboard();
    initializeHomeworkHelp();
    initializeVideoIntros();
    initializeRealTimeFeatures();
    initializeProgressTracking();
    initializeMessaging();
    initializeScheduling();
    initializePaymentSystem();
    initializeSecurityFeatures();
    initializeAccessibility();
    initializeMultiLanguage();
    initializeAnalytics();
}

// Advanced Search Functionality
function initializeAdvancedSearch() {
    const searchTabs = document.querySelectorAll('.search-tab');
    
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            searchTabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const tabType = this.dataset.tab;
            showSearchContent(tabType);
        });
    });
    
    // Subject typing animation
    const typedSubject = document.getElementById('typed-subject');
    if (typedSubject) {
        const subjects = ['Mathematics', 'Science', 'English', 'Computer Science', 'Languages'];
        let currentIndex = 0;
        
        setInterval(() => {
            typedSubject.style.opacity = '0';
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % subjects.length;
                typedSubject.textContent = subjects[currentIndex];
                typedSubject.style.opacity = '1';
            }, 500);
        }, 3000);
    }
}

function showSearchContent(type) {
    // Implementation for showing different search types
    console.log('Switching to search type:', type);
}

// Tutor Filters System
function initializeTutorFilters() {
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    
    if (priceRange && priceValue) {
        priceRange.addEventListener('input', function() {
            priceValue.textContent = this.value;
            applyFilters();
        });
    }
    
    // Apply filters button
    const applyBtn = document.querySelector('.btn-apply-filters');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }
    
    // Clear filters button
    const clearBtn = document.querySelector('.btn-clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
    
    // Checkbox filters
    document.querySelectorAll('.checkbox-label input').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    // Collect all filter values
    const filters = {
        subject: document.querySelector('.filter-select')?.value,
        priceMax: document.getElementById('priceRange')?.value,
        availability: getCheckedValues('.availability-options input:checked'),
        language: document.querySelector('.filter-group select[multiple]')?.value,
        teachingStyle: getCheckedValues('.style-options input:checked'),
        specialNeeds: getCheckedValues('.special-options input:checked')
    };
    
    console.log('Applying filters:', filters);
    // In production, this would make an API call to filter tutors
    filterTutorCards(filters);
}

function getCheckedValues(selector) {
    return Array.from(document.querySelectorAll(selector))
        .map(input => input.value);
}

function clearFilters() {
    // Reset all filter inputs
    document.querySelectorAll('.filter-select').forEach(select => {
        select.selectedIndex = 0;
    });
    
    document.querySelectorAll('.checkbox-label input').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.value = 50;
        document.getElementById('priceValue').textContent = '50';
    }
    
    applyFilters();
}

function filterTutorCards(filters) {
    // Simulated filtering - in production, this would be server-side
    const cards = document.querySelectorAll('.enhanced-tutor-card');
    cards.forEach(card => {
        // Show all cards when filters are cleared
        card.style.display = 'block';
    });
}

// Dashboard Functionality
function initializeDashboard() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Load dashboard content based on selection
            const section = this.textContent.trim();
            loadDashboardSection(section);
        });
    });
    
    // Initialize progress animations
    animateProgressBars();
    updateLearningStreak();
}

function loadDashboardSection(section) {
    console.log('Loading dashboard section:', section);
    // In production, this would load different dashboard views
}

function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => {
            bar.style.transition = 'width 2s ease';
            bar.style.width = width;
        }, 500);
    });
}

function updateLearningStreak() {
    const streakNumber = document.querySelector('.streak-number');
    if (streakNumber) {
        // Check local storage for streak data
        const lastSession = localStorage.getItem('lastSession');
        const today = new Date().toDateString();
        
        if (lastSession !== today) {
            // Increment streak if user has session today
            let currentStreak = parseInt(localStorage.getItem('learningStreak') || 0);
            currentStreak++;
            localStorage.setItem('learningStreak', currentStreak);
            localStorage.setItem('lastSession', today);
            streakNumber.textContent = currentStreak + ' days';
        }
    }
}

// Homework Help System
function initializeHomeworkHelp() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-upload');
    const homeworkForm = document.getElementById('homework-form');
    
    if (uploadArea && fileInput) {
        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }
    
    if (homeworkForm) {
        homeworkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitHomeworkQuestion();
        });
    }
}

function handleFiles(files) {
    console.log('Files uploaded:', files);
    // Display uploaded files
    const uploadArea = document.getElementById('upload-area');
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    uploadArea.innerHTML = `
        <i class="fas fa-check-circle" style="color: var(--success-green);"></i>
        <p>Files uploaded: ${fileNames}</p>
        <span class="upload-info">Click to add more files</span>
    `;
}

function submitHomeworkQuestion() {
    // Show loading state
    const submitBtn = document.querySelector('.btn-submit-question');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate submission
    setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Question Submitted!';
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            // Reset form
            document.getElementById('homework-form').reset();
        }, 2000);
    }, 1500);
}

// Video Introduction Players
function initializeVideoIntros() {
    const playButtons = document.querySelectorAll('.btn-play-intro, .play-button');
    
    playButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tutorCard = this.closest('.enhanced-tutor-card, .story-card');
            const tutorName = tutorCard.querySelector('h3').textContent;
            playVideoIntro(tutorName);
        });
    });
}

function playVideoIntro(tutorName) {
    // Create video modal
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-modal-content">
            <button class="close-video">&times;</button>
            <h3>${tutorName}'s Introduction</h3>
            <div class="video-container">
                <video controls autoplay>
                    <source src="intro-videos/${tutorName.replace(/\s+/g, '-').toLowerCase()}.mp4" type="video/mp4">
                    <p>Your browser doesn't support video playback.</p>
                </video>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector('.close-video').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Real-time Features
function initializeRealTimeFeatures() {
    // Tutor availability status
    updateTutorStatuses();
    setInterval(updateTutorStatuses, 30000); // Update every 30 seconds
    
    // Live session counter
    updateLiveSessionCount();
}

function updateTutorStatuses() {
    const statusElements = document.querySelectorAll('.tutor-status');
    
    statusElements.forEach(status => {
        // In production, this would check real availability
        const random = Math.random();
        if (random > 0.7) {
            status.className = 'tutor-status online';
            status.innerHTML = '<span class="status-dot"></span> Available Now';
        } else if (random > 0.3) {
            status.className = 'tutor-status busy';
            status.innerHTML = '<span class="status-dot"></span> In Session';
        } else {
            status.className = 'tutor-status offline';
            status.innerHTML = '<span class="status-dot"></span> Offline';
        }
    });
}

function updateLiveSessionCount() {
    const sessionCount = document.querySelector('.live-session-count');
    if (sessionCount) {
        // Simulate live session count
        const count = Math.floor(Math.random() * 500) + 1000;
        sessionCount.textContent = count.toLocaleString() + ' live sessions';
    }
}

// Progress Tracking
function initializeProgressTracking() {
    // Track time spent on platform
    let timeSpent = 0;
    setInterval(() => {
        timeSpent++;
        localStorage.setItem('timeSpent', timeSpent);
    }, 1000);
    
    // Track completed lessons
    trackLessonCompletion();
}

function trackLessonCompletion() {
    const completeButtons = document.querySelectorAll('.btn-complete-lesson');
    
    completeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const lessonId = this.dataset.lessonId;
            markLessonComplete(lessonId);
        });
    });
}

function markLessonComplete(lessonId) {
    const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
        localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
        
        // Update UI
        updateProgressDisplay();
    }
}

function updateProgressDisplay() {
    const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    const progressElement = document.querySelector('.overall-progress');
    
    if (progressElement) {
        const percentage = (completedLessons.length / 100) * 100; // Assume 100 total lessons
        progressElement.style.width = percentage + '%';
    }
}

// Messaging System
function initializeMessaging() {
    const messageButtons = document.querySelectorAll('.btn-message');
    
    messageButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tutorCard = this.closest('.enhanced-tutor-card');
            const tutorName = tutorCard.querySelector('h3').textContent;
            openMessageDialog(tutorName);
        });
    });
}

function openMessageDialog(tutorName) {
    // Create messaging interface
    const messageDialog = document.createElement('div');
    messageDialog.className = 'message-dialog';
    messageDialog.innerHTML = `
        <div class="message-dialog-content">
            <div class="message-header">
                <h3>Message ${tutorName}</h3>
                <button class="close-message">&times;</button>
            </div>
            <div class="message-body">
                <div class="message-history">
                    <p class="message-placeholder">Start a conversation with ${tutorName}</p>
                </div>
                <div class="message-input-area">
                    <textarea placeholder="Type your message..." rows="3"></textarea>
                    <button class="btn-send-message">Send</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(messageDialog);
    
    // Close dialog
    messageDialog.querySelector('.close-message').addEventListener('click', () => {
        document.body.removeChild(messageDialog);
    });
    
    // Send message
    messageDialog.querySelector('.btn-send-message').addEventListener('click', () => {
        const message = messageDialog.querySelector('textarea').value;
        if (message.trim()) {
            sendMessage(tutorName, message);
            messageDialog.querySelector('textarea').value = '';
        }
    });
}

function sendMessage(recipient, message) {
    console.log(`Sending message to ${recipient}: ${message}`);
    // In production, this would send via WebSocket or API
    
    // Show confirmation
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = 'Message sent successfully!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Scheduling System
function initializeScheduling() {
    const scheduleButtons = document.querySelectorAll('.btn-schedule, .btn-book-trial');
    
    scheduleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tutorCard = this.closest('.enhanced-tutor-card');
            const tutorName = tutorCard?.querySelector('h3')?.textContent || 'Tutor';
            openSchedulingCalendar(tutorName);
        });
    });
}

function openSchedulingCalendar(tutorName) {
    // Create calendar interface
    console.log(`Opening calendar for ${tutorName}`);
    // In production, integrate with calendaring service like Calendly
}

// Payment System
function initializePaymentSystem() {
    // Initialize secure payment handling
    console.log('Payment system initialized');
    // In production, integrate with Stripe or PayPal
}

// Security Features
function initializeSecurityFeatures() {
    // CSRF token management
    const csrfToken = generateCSRFToken();
    document.querySelectorAll('form').forEach(form => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'csrf_token';
        input.value = csrfToken;
        form.appendChild(input);
    });
    
    // Session timeout warning
    let sessionTimeout;
    resetSessionTimeout();
    
    document.addEventListener('click', resetSessionTimeout);
    document.addEventListener('keypress', resetSessionTimeout);
}

function generateCSRFToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        showSessionWarning();
    }, 25 * 60 * 1000); // 25 minutes
}

function showSessionWarning() {
    if (confirm('Your session is about to expire. Do you want to continue?')) {
        resetSessionTimeout();
    } else {
        // Logout user
        window.location.href = '/logout';
    }
}

// Accessibility Features
function initializeAccessibility() {
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-nav');
    });
    
    // Screen reader announcements
    createAriaLiveRegion();
}

function createAriaLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'aria-live-region';
    document.body.appendChild(liveRegion);
}

function announceToScreenReader(message) {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
        liveRegion.textContent = message;
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

// Multi-language Support
function initializeMultiLanguage() {
    const languageSelector = document.getElementById('language');
    
    if (languageSelector) {
        languageSelector.addEventListener('change', function() {
            changeLanguage(this.value);
        });
        
        // Load saved language preference
        const savedLanguage = localStorage.getItem('language') || 'en';
        languageSelector.value = savedLanguage;
    }
}

function changeLanguage(langCode) {
    localStorage.setItem('language', langCode);
    console.log(`Changing language to ${langCode}`);
    // In production, this would load language files and update all text
}

// Analytics
function initializeAnalytics() {
    // Track page views
    trackPageView();
    
    // Track interactions
    document.addEventListener('click', function(e) {
        if (e.target.matches('button, .btn-primary, .btn-secondary, a')) {
            trackEvent('click', e.target.textContent, e.target.className);
        }
    });
}

function trackPageView() {
    // In production, integrate with Google Analytics or similar
    console.log('Page view tracked:', window.location.pathname);
}

function trackEvent(action, label, category) {
    // In production, send to analytics service
    console.log('Event tracked:', { action, label, category });
}

// Add CSS for new features
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    .video-modal,
    .message-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .video-modal-content,
    .message-dialog-content {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        max-width: 800px;
        width: 90%;
        position: relative;
    }
    
    .close-video,
    .close-message {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: var(--text-light);
    }
    
    .video-container {
        width: 100%;
        padding-top: 56.25%; /* 16:9 aspect ratio */
        position: relative;
    }
    
    .video-container video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 8px;
    }
    
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        animation: slideIn 0.3s ease;
        z-index: 10000;
    }
    
    .notification.success {
        background: var(--success-green);
    }
    
    .notification.error {
        background: var(--error-red);
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
    
    .keyboard-nav *:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
    }
    
    .dragover {
        background: rgba(79, 70, 229, 0.05);
        border-color: var(--primary-color) !important;
    }
`;

document.head.appendChild(enhancedStyles);
