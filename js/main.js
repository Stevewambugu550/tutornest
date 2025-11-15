// TutorNest - Main JavaScript File

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeSearch();
    initializePricingToggle();
    initializeSmoothScroll();
    initializeAnimations();
    initializeTutorCards();
    initializeFormValidation();
});

// Navigation Menu Toggle
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Hamburger menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    // Close menu when clicking nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Change navbar on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Search Functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }
}

function performSearch(query) {
    console.log('Searching for:', query);
    // Show loading state
    const searchBtn = document.querySelector('.search-btn');
    const originalText = searchBtn.textContent;
    searchBtn.textContent = 'Searching...';
    searchBtn.disabled = true;
    
    // Simulate search (replace with actual API call)
    setTimeout(() => {
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
        // Redirect to search results or show modal
        alert(`Searching for tutors in: ${query}\n\nThis would normally show search results.`);
    }, 1000);
}

// Pricing Toggle
function initializePricingToggle() {
    const toggle = document.getElementById('pricing-toggle');
    const amounts = document.querySelectorAll('.amount');
    const periods = document.querySelectorAll('.period');
    
    if (toggle) {
        toggle.addEventListener('change', function() {
            if (this.checked) {
                // Monthly pricing
                amounts[0].textContent = '99';
                amounts[1].textContent = '179';
                amounts[2].textContent = '299';
                periods.forEach(period => period.textContent = '/month');
            } else {
                // Hourly pricing
                amounts[0].textContent = '29';
                amounts[1].textContent = '49';
                amounts[2].textContent = '79';
                periods.forEach(period => period.textContent = '/hour');
            }
        });
    }
}

// Smooth Scrolling
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Add animation classes to elements
    const animateElements = document.querySelectorAll(
        '.subject-card, .step, .tutor-card, .pricing-card, .testimonial-card'
    );
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Add animate-in class styles
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// Tutor Card Interactions
function initializeTutorCards() {
    const bookButtons = document.querySelectorAll('.btn-book');
    
    bookButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tutorCard = this.closest('.tutor-card');
            const tutorName = tutorCard.querySelector('h3').textContent;
            const price = tutorCard.querySelector('.price').textContent;
            
            showBookingModal(tutorName, price);
        });
    });
}

// Show Booking Modal (Simplified version)
function showBookingModal(tutorName, price) {
    const modal = document.createElement('div');
    modal.className = 'booking-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Book a Session with ${tutorName}</h2>
            <p>Price: ${price}</p>
            <form id="booking-form">
                <input type="text" placeholder="Your Name" required>
                <input type="email" placeholder="Your Email" required>
                <input type="tel" placeholder="Phone Number" required>
                <select required>
                    <option value="">Select Subject</option>
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>English</option>
                    <option>Computer Science</option>
                </select>
                <textarea placeholder="Additional Notes" rows="3"></textarea>
                <button type="submit" class="btn-submit">Book Now</button>
                <button type="button" class="btn-cancel">Cancel</button>
            </form>
        </div>
    `;
    
    // Add modal styles
    const modalStyles = `
        .booking-modal {
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
            animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            max-width: 500px;
            width: 90%;
            animation: slideUp 0.3s ease;
        }
        
        .modal-content h2 {
            margin-bottom: 1rem;
            color: var(--text-dark);
        }
        
        .modal-content p {
            margin-bottom: 1.5rem;
            color: var(--text-light);
        }
        
        #booking-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        #booking-form input,
        #booking-form select,
        #booking-form textarea {
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-family: inherit;
        }
        
        .btn-submit,
        .btn-cancel {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-submit {
            background: var(--primary-color);
            color: white;
        }
        
        .btn-submit:hover {
            background: #4338CA;
        }
        
        .btn-cancel {
            background: var(--border-color);
            color: var(--text-dark);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); }
            to { transform: translateY(0); }
        }
    `;
    
    // Add styles if not already added
    if (!document.getElementById('modal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'modal-styles';
        styleTag.textContent = modalStyles;
        document.head.appendChild(styleTag);
    }
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = document.getElementById('booking-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Booking submitted! We\'ll contact you shortly.');
        document.body.removeChild(modal);
    });
    
    // Handle cancel
    modal.querySelector('.btn-cancel').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Form Validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'var(--error-color)';
                } else {
                    input.style.borderColor = 'var(--border-color)';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
}

// Initialize counters animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.innerText;
        const isNumber = /^\d+$/.test(target.replace(/,/g, '').replace('+', ''));
        
        if (isNumber) {
            const finalValue = parseInt(target.replace(/,/g, '').replace('+', ''));
            let current = 0;
            const increment = finalValue / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= finalValue) {
                    current = finalValue;
                    clearInterval(timer);
                    counter.innerText = target; // Restore original format
                } else {
                    counter.innerText = Math.floor(current).toLocaleString();
                    if (target.includes('+')) counter.innerText += '+';
                }
            }, 20);
        }
    });
}

// Call counter animation when stats section is visible
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Handle "Get Started" and other CTA buttons
document.querySelectorAll('.btn-primary, .btn-plan, .btn-cta-primary').forEach(button => {
    button.addEventListener('click', function(e) {
        if (!this.closest('form')) {
            e.preventDefault();
            // Scroll to pricing or show sign-up modal
            const pricingSection = document.getElementById('pricing');
            if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Subject cards interaction
document.querySelectorAll('.subject-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const subject = this.closest('.subject-card').querySelector('h3').textContent;
        performSearch(subject);
    });
});

// Add loading state for buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function() {
        if (this.type === 'submit' || this.classList.contains('search-btn')) {
            const originalContent = this.innerHTML;
            // Store original content for restoration
            this.setAttribute('data-original', originalContent);
        }
    });
});

// Console message for developers
console.log('%c🎓 TutorNest', 'font-size: 24px; font-weight: bold; color: #4F46E5;');
console.log('%cWelcome to TutorNest! Connect with expert tutors for personalized learning.', 'font-size: 14px; color: #6B7280;');
console.log('%cBuilt with ❤️ using modern web technologies', 'font-size: 12px; color: #EC4899;');
