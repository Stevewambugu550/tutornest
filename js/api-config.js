// TutorNest API Configuration
// This file handles all backend API connections

const API_CONFIG = {
    // Update these URLs when you deploy your backend
    development: {
        baseURL: 'http://localhost:3000/api',
        websocketURL: 'ws://localhost:3000',
        cdnURL: 'http://localhost:3000/uploads'
    },
    production: {
        // Replace with your actual backend URL after deployment
        baseURL: 'http://localhost:4000/api', // REAL Local Backend
        websocketURL: 'ws://localhost:4000', // REAL Local WebSocket
        cdnURL: 'https://tutornest-cdn.netlify.app'
    }
};

// Automatically detect environment
const environment = window.location.hostname === 'localhost' ? 'development' : 'production';
const config = API_CONFIG[environment];

// API Service Class
class TutorNestAPI {
    constructor() {
        this.baseURL = config.baseURL;
        this.token = localStorage.getItem('authToken');
    }

    // Set authorization token
    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear authorization token
    clearAuthToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add auth token if available
        if (this.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // AUTH ENDPOINTS
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        const result = await this.request('/auth/logout', { method: 'POST' });
        this.clearAuthToken();
        return result;
    }

    async resetPassword(email) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    // USER ENDPOINTS
    async getProfile() {
        return this.request('/users/profile');
    }

    async updateProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        return this.request('/users/avatar', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    }

    // TUTOR ENDPOINTS
    async searchTutors(filters) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.request(`/tutors/search?${queryParams}`);
    }

    async getTutorById(tutorId) {
        return this.request(`/tutors/${tutorId}`);
    }

    async getTutorReviews(tutorId) {
        return this.request(`/tutors/${tutorId}/reviews`);
    }

    async getTutorAvailability(tutorId, date) {
        return this.request(`/tutors/${tutorId}/availability?date=${date}`);
    }

    async becomeTutor(tutorData) {
        return this.request('/tutors/apply', {
            method: 'POST',
            body: JSON.stringify(tutorData)
        });
    }

    // SESSION ENDPOINTS
    async bookSession(sessionData) {
        return this.request('/sessions/book', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    }

    async getMySessions() {
        return this.request('/sessions/my-sessions');
    }

    async getUpcomingSessions() {
        return this.request('/sessions/upcoming');
    }

    async getSessionById(sessionId) {
        return this.request(`/sessions/${sessionId}`);
    }

    async cancelSession(sessionId, reason) {
        return this.request(`/sessions/${sessionId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async rescheduleSession(sessionId, newDateTime) {
        return this.request(`/sessions/${sessionId}/reschedule`, {
            method: 'PUT',
            body: JSON.stringify({ newDateTime })
        });
    }

    async joinSession(sessionId) {
        return this.request(`/sessions/${sessionId}/join`);
    }

    async endSession(sessionId) {
        return this.request(`/sessions/${sessionId}/end`, {
            method: 'POST'
        });
    }

    // PAYMENT ENDPOINTS
    async getPaymentMethods() {
        return this.request('/payments/methods');
    }

    async addPaymentMethod(paymentData) {
        return this.request('/payments/methods', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async processPayment(paymentData) {
        return this.request('/payments/process', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async getPaymentHistory() {
        return this.request('/payments/history');
    }

    async getInvoice(invoiceId) {
        return this.request(`/payments/invoices/${invoiceId}`);
    }

    // HOMEWORK HELP ENDPOINTS
    async submitHomeworkQuestion(questionData) {
        return this.request('/homework/submit', {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
    }

    async getHomeworkQuestions() {
        return this.request('/homework/my-questions');
    }

    async getHomeworkAnswer(questionId) {
        return this.request(`/homework/answers/${questionId}`);
    }

    // MESSAGING ENDPOINTS
    async getMessages(conversationId) {
        return this.request(`/messages/conversation/${conversationId}`);
    }

    async sendMessage(recipientId, message) {
        return this.request('/messages/send', {
            method: 'POST',
            body: JSON.stringify({ recipientId, message })
        });
    }

    async getConversations() {
        return this.request('/messages/conversations');
    }

    async markMessageAsRead(messageId) {
        return this.request(`/messages/${messageId}/read`, {
            method: 'PUT'
        });
    }

    // REVIEW ENDPOINTS
    async submitReview(sessionId, reviewData) {
        return this.request(`/reviews/session/${sessionId}`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }

    async updateReview(reviewId, reviewData) {
        return this.request(`/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify(reviewData)
        });
    }

    // SUBJECT ENDPOINTS
    async getSubjects() {
        return this.request('/subjects');
    }

    async getSubjectById(subjectId) {
        return this.request(`/subjects/${subjectId}`);
    }

    // RESOURCE ENDPOINTS
    async getResources(filters) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.request(`/resources?${queryParams}`);
    }

    async downloadResource(resourceId) {
        return this.request(`/resources/${resourceId}/download`);
    }

    // ANALYTICS ENDPOINTS
    async getStudentProgress() {
        return this.request('/analytics/student-progress');
    }

    async getLearningStreak() {
        return this.request('/analytics/learning-streak');
    }

    async getSessionStats() {
        return this.request('/analytics/session-stats');
    }

    // NOTIFICATION ENDPOINTS
    async getNotifications() {
        return this.request('/notifications');
    }

    async markNotificationAsRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    async updateNotificationSettings(settings) {
        return this.request('/notifications/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // SUBSCRIPTION ENDPOINTS
    async getSubscriptionPlans() {
        return this.request('/subscriptions/plans');
    }

    async subscribeToPlan(planId, paymentMethodId) {
        return this.request('/subscriptions/subscribe', {
            method: 'POST',
            body: JSON.stringify({ planId, paymentMethodId })
        });
    }

    async cancelSubscription(reason) {
        return this.request('/subscriptions/cancel', {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async getSubscriptionStatus() {
        return this.request('/subscriptions/status');
    }
}

// Create global API instance
window.TutorNestAPI = new TutorNestAPI();

// WebSocket Connection for Real-time Features
class TutorNestWebSocket {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.messageHandlers = {};
    }

    connect() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No auth token, skipping WebSocket connection');
            return;
        }

        this.ws = new WebSocket(`${config.websocketURL}?token=${token}`);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.reconnect();
        };
    }

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }

    handleMessage(data) {
        const { type, payload } = data;
        
        if (this.messageHandlers[type]) {
            this.messageHandlers[type](payload);
        }

        // Handle specific message types
        switch (type) {
            case 'new_message':
                this.onNewMessage(payload);
                break;
            case 'tutor_status_update':
                this.onTutorStatusUpdate(payload);
                break;
            case 'session_reminder':
                this.onSessionReminder(payload);
                break;
            case 'notification':
                this.onNotification(payload);
                break;
            default:
                console.log('Unknown message type:', type);
        }
    }

    on(type, handler) {
        this.messageHandlers[type] = handler;
    }

    send(type, payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        }
    }

    onNewMessage(message) {
        // Update UI with new message
        console.log('New message received:', message);
        // Show notification
        if (Notification.permission === 'granted') {
            new Notification('New Message', {
                body: message.content,
                icon: '/favicon.ico'
            });
        }
    }

    onTutorStatusUpdate(update) {
        // Update tutor status in UI
        const statusElement = document.querySelector(`[data-tutor-id="${update.tutorId}"] .tutor-status`);
        if (statusElement) {
            statusElement.className = `tutor-status ${update.status}`;
            statusElement.innerHTML = `<span class="status-dot"></span> ${update.statusText}`;
        }
    }

    onSessionReminder(reminder) {
        // Show session reminder
        console.log('Session reminder:', reminder);
        alert(`Reminder: Your session with ${reminder.tutorName} starts in ${reminder.minutesUntil} minutes!`);
    }

    onNotification(notification) {
        // Show general notification
        console.log('Notification:', notification);
        // Update notification badge
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const count = parseInt(badge.textContent || 0) + 1;
            badge.textContent = count;
            badge.style.display = 'block';
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Create global WebSocket instance
window.TutorNestWS = new TutorNestWebSocket();

// Initialize WebSocket connection when user is logged in
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('authToken')) {
        window.TutorNestWS.connect();
    }
});

console.log('TutorNest API configured and ready!');
