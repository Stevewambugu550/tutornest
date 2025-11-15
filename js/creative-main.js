// ====================================================================
//  TutorNest - Creative & Functional JavaScript
//  This single file powers all the interactivity for the new design.
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Initializations ---
    handleNavbarScroll();
    handleUserSession();

    // --- Page-Specific Initializations ---
    const page = document.body.dataset.page;
    switch (page) {
        case 'homepage':
            initHomepage();
            break;
        case 'find-tutors':
            initFindTutors();
            break;
        // Add cases for other pages as they are created
    }
});

// ===========================================
//  GLOBAL FUNCTIONS
// ===========================================

// Change navbar style on scroll
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar-creative');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Check user login status and update UI
function handleUserSession() {
    const user = JSON.parse(localStorage.getItem('user'));
    const navButtons = document.querySelector('.nav-buttons-creative');

    if (user && navButtons) {
        navButtons.innerHTML = `
            <a href="student-dashboard.html" class="btn btn-secondary">Dashboard</a>
            <button onclick="logout()" class="btn btn-primary">Logout</button>
        `;
    } else if (navButtons) {
        navButtons.innerHTML = `
            <a href="auth/login.html" class="btn btn-secondary">Log In</a>
            <a href="auth/register.html" class="btn btn-primary">Get Started</a>
        `;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    window.location.reload();
}

// ===========================================
//  PAGE-SPECIFIC INITIALIZATIONS
// ===========================================

function initHomepage() {
    // Add any specific animations or logic for the homepage here
    console.log('Creative homepage initialized.');
}

function initFindTutors() {
    // Add logic for filtering and searching tutors here
    console.log('Find Tutors page initialized.');
}

// Add CSS for the scrolled navbar state
const style = document.createElement('style');
style.innerHTML = `
.navbar-creative.scrolled {
    padding: 1rem 0;
    box-shadow: var(--shadow-md);
}
`;
document.head.appendChild(style);
