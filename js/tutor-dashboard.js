// Tutor Dashboard JavaScript - Makes the dashboard functional

document.addEventListener('DOMContentLoaded', function() {
    // 1. Check Login Status
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'tutor') {
        alert('Access Denied. Please log in as a tutor.');
        window.location.href = 'auth/login.html';
        return;
    }

    // 2. Load Tutor Data
    loadTutorData(user);

    // 3. Initialize Interactive Components
    initializeDashboard();
});

function loadTutorData(user) {
    // --- Mock Data for Demo ---
    const tutorData = {
        name: user.firstName || 'Dr. Sarah',
        welcomeName: user.firstName || 'Dr. Sarah',
        sessionCount: 5,
        monthlyEarnings: 8542,
        totalSessions: 2847,
        activeStudents: 234,
        avgRating: 5.0,
        schedule: [
            {
                time: '10:00 AM',
                duration: '60 min',
                title: 'Calculus II - Integrals',
                student: 'Jennifer Martinez',
                status: 'upcoming'
            },
            {
                time: '11:30 AM',
                duration: '45 min',
                title: 'Linear Algebra - Matrices',
                student: 'David Kim',
                status: 'upcoming'
            },
            {
                time: '2:00 PM',
                duration: '60 min',
                title: 'AP Physics - Kinematics',
                student: 'Emily Chen',
                status: 'upcoming'
            }
        ],
        reviews: [
            {
                student: 'Jennifer Martinez',
                rating: 5,
                comment: 'Dr. Sarah is amazing! She helped me understand calculus concepts that I struggled with for months. Highly recommend!',
                date: '2 days ago'
            },
            {
                student: 'Michael Chen',
                rating: 5,
                comment: 'Best tutor on the platform! Got an A on my linear algebra exam thanks to her help.',
                date: '1 week ago'
            }
        ]
    };

    // --- Populate the UI with Data ---
    document.getElementById('tutorName').textContent = tutorData.name;
    document.getElementById('tutorWelcomeName').textContent = tutorData.welcomeName;
    document.getElementById('sessionCount').textContent = `${tutorData.sessionCount} sessions`;
    document.getElementById('monthlyEarnings').textContent = `$${tutorData.monthlyEarnings.toLocaleString()}`;
    document.getElementById('totalSessions').textContent = tutorData.totalSessions.toLocaleString();
    document.getElementById('activeStudents').textContent = tutorData.activeStudents;
    document.getElementById('avgRating').textContent = tutorData.avgRating.toFixed(1);

    // Populate Sessions List
    const sessionsList = document.getElementById('sessions-list');
    sessionsList.innerHTML = tutorData.schedule.map(session => `
        <div class="session-item">
            <div class="session-date">
                <span class="day">Today</span>
                <span class="time">${session.time}</span>
            </div>
            <div class="session-details">
                <h4>${session.title}</h4>
                <p>with ${session.student}</p>
                <span class="duration">${session.duration}</span>
            </div>
            <button class="btn-join" onclick="joinSession('${session.title}')">Join</button>
        </div>
    `).join('');

    // Populate Reviews List
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = tutorData.reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <h4>${review.student}</h4>
                <div class="rating">${'⭐'.repeat(review.rating)}</div>
            </div>
            <p>"${review.comment}"</p>
            <span class="date">${review.date}</span>
        </div>
    `).join('');
}

function initializeDashboard() {
    // --- Earnings Chart ---
    const ctx = document.getElementById('earningsChart').getContext('2d');
    const earningsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Monthly Earnings',
                data: [6500, 5900, 8000, 8100, 7600, 7500, 8500, 9200, 8800, 9500, 8542, 10200],
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderColor: '#4F46E5',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value / 1000 + 'k';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // --- Interactivity ---
    // Availability Toggle
    document.getElementById('availability-toggle').addEventListener('change', function() {
        alert(`Availability set to: ${this.checked ? 'Available' : 'Unavailable'}`);
    });

    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            alert(`Navigating to ${item.textContent.trim()} section...`);
        });
    });

    // Quick actions
    document.querySelector('.action-btn.secondary').addEventListener('click', () => {
        alert('Opening availability calendar...');
    });

    // View details buttons
    document.querySelector('.btn-view-details').addEventListener('click', () => {
        alert('Displaying your verified credentials...');
    });
}

// --- Global Functions ---

function joinSession(sessionTitle) {
    alert(`Joining session: ${sessionTitle}... This would open a video call.`);
    window.location.href = 'chat-learn.html';
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    alert('You have been logged out.');
    window.location.href = 'index.html';
}
