// Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Account type selector
    const typeBtns = document.querySelectorAll('.type-btn');
    const forms = {
        student: document.getElementById('student-form'),
        tutor: document.getElementById('tutor-form'),
        parent: document.getElementById('parent-form')
    };
    
    typeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            
            // Update buttons
            typeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update forms
            Object.values(forms).forEach(form => form?.classList.remove('active'));
            if (forms[type]) {
                forms[type].classList.add('active');
            }
        });
    });
    
    // Form submissions
    if (forms.student) {
        forms.student.addEventListener('submit', handleStudentRegistration);
    }
    if (forms.tutor) {
        forms.tutor.addEventListener('submit', handleTutorApplication);
    }
    if (forms.parent) {
        forms.parent.addEventListener('submit', handleParentRegistration);
    }
    
    // Password strength indicator
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', updatePasswordStrength);
    });
    
    // Social auth
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', handleSocialAuth);
    });
}

// Handle Student Registration
async function handleStudentRegistration(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: 'student',
        studentProfile: {
            gradeLevel: formData.get('gradeLevel'),
            primarySubject: formData.get('primarySubject'),
            phone: formData.get('phone')
        }
    };
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save token and user data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Show success message
            showSuccessMessage('Account created successfully!');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '../student-dashboard.html';
            }, 1500);
        } else {
            showErrorMessage(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        // For demo purposes, simulate successful registration
        simulateSuccessfulRegistration(userData);
    }
}

// Handle Tutor Application
async function handleTutorApplication(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const tutorData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: 'tutor',
        tutorProfile: {
            education: formData.get('education'),
            experience: formData.get('experience')
        }
    };
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tutorData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Redirect to full application
            localStorage.setItem('tempTutorData', JSON.stringify(tutorData));
            window.location.href = '../tutor-application.html';
        } else {
            showErrorMessage(data.message || 'Application failed');
        }
    } catch (error) {
        console.error('Application error:', error);
        // For demo purposes, redirect to application
        localStorage.setItem('tempTutorData', JSON.stringify(tutorData));
        window.location.href = '../tutor-application.html';
    }
}

// Handle Parent Registration
async function handleParentRegistration(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const parentData = {
        firstName: formData.get('parentFirstName'),
        lastName: formData.get('parentLastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: 'parent',
        parentProfile: {
            childName: formData.get('childName'),
            childGrade: formData.get('childGrade')
        }
    };
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(parentData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showSuccessMessage('Parent account created successfully!');
            
            setTimeout(() => {
                window.location.href = '../parent-dashboard.html';
            }, 1500);
        } else {
            showErrorMessage(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        simulateSuccessfulRegistration(parentData);
    }
}

// Update Password Strength
function updatePasswordStrength(e) {
    const password = e.target.value;
    const strengthBar = e.target.parentElement.querySelector('.strength-bar');
    
    if (!strengthBar) return;
    
    let strength = 0;
    let color = '#ef4444';
    
    // Check password strength
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 25;
    
    // Set color based on strength
    if (strength <= 25) {
        color = '#ef4444'; // Red
    } else if (strength <= 50) {
        color = '#f59e0b'; // Orange
    } else if (strength <= 75) {
        color = '#fbbf24'; // Yellow
    } else {
        color = '#10b981'; // Green
    }
    
    strengthBar.style.width = strength + '%';
    strengthBar.style.background = color;
}

// Handle Social Authentication
async function handleSocialAuth(e) {
    const provider = e.currentTarget.classList.contains('google') ? 'google' : 'facebook';
    
    try {
        // In production, this would redirect to OAuth provider
        console.log(`Authenticating with ${provider}`);
        
        // Simulate social auth
        showInfoMessage(`${provider} authentication would redirect to OAuth provider`);
    } catch (error) {
        console.error('Social auth error:', error);
    }
}

// Simulate Successful Registration (Demo)
function simulateSuccessfulRegistration(userData) {
    // Create demo user data
    const demoUser = {
        id: 'demo_' + Date.now(),
        ...userData,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('authToken', 'demo_token_' + Date.now());
    localStorage.setItem('user', JSON.stringify(demoUser));
    
    showSuccessMessage('Account created successfully! (Demo Mode)');
    
    // Redirect based on role
    setTimeout(() => {
        if (userData.role === 'student') {
            window.location.href = '../student-dashboard.html';
        } else if (userData.role === 'parent') {
            window.location.href = '../parent-dashboard.html';
        }
    }, 1500);
}

// Show Success Message
function showSuccessMessage(message) {
    showNotification(message, 'success');
}

// Show Error Message
function showErrorMessage(message) {
    showNotification(message, 'error');
}

// Show Info Message
function showInfoMessage(message) {
    showNotification(message, 'info');
}

// Show Notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification-toast');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .notification-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            min-width: 300px;
        }
        
        .notification-toast.success {
            background: #10b981;
            color: white;
        }
        
        .notification-toast.error {
            background: #ef4444;
            color: white;
        }
        
        .notification-toast.info {
            background: #3b82f6;
            color: white;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
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
    `;
    
    if (!document.querySelector('#notification-styles')) {
        styles.id = 'notification-styles';
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Login Function (for login page)
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect based on role
            const redirectUrl = data.user.role === 'tutor' ? 
                '../tutor-dashboard.html' : 
                '../student-dashboard.html';
                
            window.location.href = redirectUrl;
        } else {
            showErrorMessage(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        // Demo login
        handleDemoLogin(loginData.email);
    }
}

// Demo Login
function handleDemoLogin(email) {
    const demoUser = {
        id: 'demo_user',
        email: email,
        firstName: 'Demo',
        lastName: 'User',
        role: email.includes('tutor') ? 'tutor' : 'student',
        avatar: 'https://i.pravatar.cc/150?img=1'
    };
    
    localStorage.setItem('authToken', 'demo_token_' + Date.now());
    localStorage.setItem('user', JSON.stringify(demoUser));
    
    showSuccessMessage('Logged in successfully! (Demo Mode)');
    
    setTimeout(() => {
        window.location.href = demoUser.role === 'tutor' ? 
            '../tutor-dashboard.html' : 
            '../student-dashboard.html';
    }, 1000);
}

// Export functions
window.AuthFunctions = {
    handleLogin,
    handleStudentRegistration,
    handleTutorApplication,
    handleParentRegistration,
    showSuccessMessage,
    showErrorMessage
};
