// Dashboard Fix - Removes all alert() popups and adds proper functionality

// Remove all alert popups
window.alert = function(msg) {
    console.log('Alert suppressed:', msg);
    // Show toast notification instead
    showToast(msg);
};

// Toast notification system (better than alerts)
function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 350px;
    `;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS for animations
if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Fix navigation functions
function showMessages() {
    window.location.href = 'chat-learn.html';
}

function showStudents() {
    window.location.href = 'student-dashboard.html';
}

function showSchedule() {
    document.querySelector('#schedule')?.scrollIntoView({ behavior: 'smooth' });
}

function showEarnings() {
    document.querySelector('#earnings')?.scrollIntoView({ behavior: 'smooth' });
}

// Improved logout function
function logout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        showToast('Logging out...', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Fix "My Bookings" back navigation
function fixBookingsModal() {
    // Add event listener for ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.querySelector('[style*="position: fixed"]');
            if (modal) {
                modal.remove();
            }
        }
    });
}

// Initialize chat functionality properly
function initializeChat() {
    const newChatBtn = document.querySelector('#newChatBtn');
    if (newChatBtn) {
        newChatBtn.onclick = function() {
            // Create new chat interface
            const chatModal = document.createElement('div');
            chatModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            chatModal.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0;">Start New Chat</h2>
                        <button onclick="this.closest('[style*=\\"position: fixed\\"]').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; float: right;">×</button>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Select a Tutor:</label>
                        <select id="tutorSelect" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
                            <option value="">Choose a tutor...</option>
                            <option value="sarah">Dr. Sarah Johnson - Mathematics</option>
                            <option value="michael">Michael Chen - Computer Science</option>
                            <option value="emily">Dr. Emily Rodriguez - Biology</option>
                            <option value="james">Prof. James Wilson - Literature</option>
                            <option value="maria">Maria Garcia - Spanish</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Message:</label>
                        <textarea id="chatMessage" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; min-height: 100px; resize: vertical;" placeholder="Type your message here..."></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="startNewChat()" style="flex: 1; padding: 1rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Start Chat
                        </button>
                        <button onclick="this.closest('[style*=\\"position: fixed\\"]').remove()" style="flex: 1; padding: 1rem; background: #f1f5f9; color: #64748b; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(chatModal);
        };
    }
}

// Start new chat function
function startNewChat() {
    const tutorSelect = document.getElementById('tutorSelect');
    const message = document.getElementById('chatMessage');
    
    if (!tutorSelect.value) {
        showToast('Please select a tutor', 'error');
        return;
    }
    
    if (!message.value.trim()) {
        showToast('Please enter a message', 'error');
        return;
    }
    
    // Store chat data
    const chatData = {
        tutor: tutorSelect.value,
        message: message.value,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('currentChat', JSON.stringify(chatData));
    
    // Redirect to chat page
    showToast('Opening chat...', 'success');
    setTimeout(() => {
        window.location.href = 'chat-learn.html';
    }, 1000);
}

// Create demo students in localStorage
function createDemoStudents() {
    const students = [
        { id: 1, name: 'John Smith', email: 'john@tutornest.com', password: 'demo123', role: 'student' },
        { id: 2, name: 'Emma Wilson', email: 'emma@tutornest.com', password: 'demo123', role: 'student' },
        { id: 3, name: 'Michael Brown', email: 'michael@tutornest.com', password: 'demo123', role: 'student' },
        { id: 4, name: 'Sarah Davis', email: 'sarah@tutornest.com', password: 'demo123', role: 'student' },
        { id: 5, name: 'James Miller', email: 'james@tutornest.com', password: 'demo123', role: 'student' },
        { id: 6, name: 'Olivia Taylor', email: 'olivia@tutornest.com', password: 'demo123', role: 'student' },
        { id: 7, name: 'William Anderson', email: 'william@tutornest.com', password: 'demo123', role: 'student' },
        { id: 8, name: 'Sophia Martinez', email: 'sophia@tutornest.com', password: 'demo123', role: 'student' },
        { id: 9, name: 'Robert Johnson', email: 'robert@tutornest.com', password: 'demo123', role: 'student' },
        { id: 10, name: 'Isabella Garcia', email: 'isabella@tutornest.com', password: 'demo123', role: 'student' }
    ];
    
    localStorage.setItem('demoStudents', JSON.stringify(students));
    console.log('10 demo students created');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Create demo students if not exists
    if (!localStorage.getItem('demoStudents')) {
        createDemoStudents();
    }
    
    // Fix bookings modal
    fixBookingsModal();
    
    // Initialize chat
    initializeChat();
    
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    console.log('Dashboard fixes applied successfully');
});
