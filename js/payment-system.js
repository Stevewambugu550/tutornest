// Payment System for TutorNest
// Supports: PayPal, Credit Card, CashApp, Zelle

class PaymentSystem {
    constructor() {
        this.paymentMethods = [];
        this.selectedMethod = null;
        this.init();
    }

    init() {
        // Load saved payment methods
        this.loadPaymentMethods();
    }

    loadPaymentMethods() {
        const saved = localStorage.getItem('paymentMethods');
        if (saved) {
            this.paymentMethods = JSON.parse(saved);
        } else {
            // Default demo payment methods
            this.paymentMethods = [
                { id: 1, type: 'card', last4: '4242', brand: 'Visa', default: true },
                { id: 2, type: 'paypal', email: 'user@example.com', default: false }
            ];
            this.savePaymentMethods();
        }
    }

    savePaymentMethods() {
        localStorage.setItem('paymentMethods', JSON.stringify(this.paymentMethods));
    }

    addPaymentMethod(method) {
        method.id = Date.now();
        this.paymentMethods.push(method);
        this.savePaymentMethods();
        return method;
    }

    removePaymentMethod(id) {
        this.paymentMethods = this.paymentMethods.filter(m => m.id !== id);
        this.savePaymentMethods();
    }

    processPayment(amount, tutorName, duration) {
        return new Promise((resolve, reject) => {
            // Simulate payment processing
            setTimeout(() => {
                const payment = {
                    id: 'PAY-' + Date.now(),
                    amount: amount,
                    tutor: tutorName,
                    duration: duration,
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                    method: this.selectedMethod
                };
                
                // Save to payment history
                const history = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
                history.push(payment);
                localStorage.setItem('paymentHistory', JSON.stringify(history));
                
                resolve(payment);
            }, 2000);
        });
    }

    showPaymentModal(booking) {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.style.cssText = `
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

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 16px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;

        const amount = (booking.hourlyRate * booking.duration / 60).toFixed(2);

        content.innerHTML = `
            <h2 style="margin-bottom: 1.5rem; color: #1e293b;">💳 Complete Payment</h2>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Tutor:</span>
                    <strong>${booking.tutorName}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Duration:</span>
                    <strong>${booking.duration} minutes</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.25rem; color: #10b981;">
                    <span>Total:</span>
                    <strong>$${amount}</strong>
                </div>
            </div>

            <h3 style="margin-bottom: 1rem;">Select Payment Method:</h3>
            
            <div class="payment-methods" style="display: grid; gap: 0.5rem; margin-bottom: 1.5rem;">
                <!-- PayPal -->
                <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; cursor: pointer;">
                    <input type="radio" name="payment" value="paypal" style="margin-right: 1rem;">
                    <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" style="height: 24px; margin-right: 1rem;">
                    <span>PayPal</span>
                </label>
                
                <!-- Credit Card -->
                <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; cursor: pointer;">
                    <input type="radio" name="payment" value="card" checked style="margin-right: 1rem;">
                    <div style="display: flex; gap: 0.5rem; margin-right: 1rem;">
                        <i class="fab fa-cc-visa" style="font-size: 1.5rem; color: #1a1f71;"></i>
                        <i class="fab fa-cc-mastercard" style="font-size: 1.5rem; color: #eb001b;"></i>
                        <i class="fab fa-cc-amex" style="font-size: 1.5rem; color: #006fcf;"></i>
                    </div>
                    <span>Credit/Debit Card</span>
                </label>
                
                <!-- CashApp -->
                <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; cursor: pointer;">
                    <input type="radio" name="payment" value="cashapp" style="margin-right: 1rem;">
                    <div style="width: 24px; height: 24px; background: #00d632; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                        <span style="color: white; font-weight: bold;">$</span>
                    </div>
                    <span>Cash App</span>
                </label>
                
                <!-- Zelle -->
                <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; cursor: pointer;">
                    <input type="radio" name="payment" value="zelle" style="margin-right: 1rem;">
                    <div style="width: 24px; height: 24px; background: #6d1ed4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                        <span style="color: white; font-weight: bold; font-size: 0.8rem;">Z</span>
                    </div>
                    <span>Zelle</span>
                </label>
            </div>

            <!-- Card Form (shown when credit card selected) -->
            <div id="cardForm" style="display: none; margin-bottom: 1.5rem;">
                <input type="text" placeholder="Card Number" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 0.5rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <input type="text" placeholder="MM/YY" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
                    <input type="text" placeholder="CVV" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
            </div>

            <!-- PayPal Form (shown when PayPal selected) -->
            <div id="paypalForm" style="display: none; margin-bottom: 1.5rem;">
                <input type="email" placeholder="PayPal Email" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
            </div>

            <!-- CashApp Form -->
            <div id="cashappForm" style="display: none; margin-bottom: 1.5rem;">
                <input type="text" placeholder="$Cashtag or Phone Number" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
            </div>

            <!-- Zelle Form -->
            <div id="zelleForm" style="display: none; margin-bottom: 1.5rem;">
                <input type="text" placeholder="Email or Phone Number" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
            </div>

            <div style="display: flex; gap: 1rem;">
                <button onclick="paymentSystem.completePayment('${booking.tutorId}', '${booking.tutorName}', ${booking.duration}, ${amount})" 
                        style="flex: 1; padding: 1rem; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-lock"></i> Pay $${amount}
                </button>
                <button onclick="this.closest('.payment-modal').remove()" 
                        style="flex: 1; padding: 1rem; background: #f1f5f9; color: #64748b; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Cancel
                </button>
            </div>
            
            <p style="margin-top: 1rem; text-align: center; color: #64748b; font-size: 0.9rem;">
                <i class="fas fa-lock"></i> Secure payment processing • 256-bit SSL encryption
            </p>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Handle payment method selection
        const radios = modal.querySelectorAll('input[name="payment"]');
        const forms = {
            card: modal.querySelector('#cardForm'),
            paypal: modal.querySelector('#paypalForm'),
            cashapp: modal.querySelector('#cashappForm'),
            zelle: modal.querySelector('#zelleForm')
        };

        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                // Hide all forms
                Object.values(forms).forEach(form => {
                    if (form) form.style.display = 'none';
                });
                
                // Show selected form
                const selectedForm = forms[radio.value];
                if (selectedForm) {
                    selectedForm.style.display = 'block';
                }
                
                // Update selected method
                this.selectedMethod = radio.value;
                
                // Update label styles
                radios.forEach(r => {
                    r.closest('label').style.borderColor = r.checked ? '#10b981' : '#ddd';
                    r.closest('label').style.background = r.checked ? '#f0fdf4' : 'white';
                });
            });
        });

        // Show card form by default
        forms.card.style.display = 'block';
        radios[1].closest('label').style.borderColor = '#10b981';
        radios[1].closest('label').style.background = '#f0fdf4';
    }

    async completePayment(tutorId, tutorName, duration, amount) {
        // Show processing
        const processingModal = document.createElement('div');
        processingModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
        `;
        
        processingModal.innerHTML = `
            <div style="text-align: center; color: white;">
                <div class="spinner" style="border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 3px solid white; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <h3>Processing Payment...</h3>
                <p>Please wait while we secure your transaction</p>
            </div>
        `;
        
        document.body.appendChild(processingModal);
        
        // Add spin animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Process payment
        try {
            const payment = await this.processPayment(amount, tutorName, duration);
            
            // Remove modals
            document.querySelector('.payment-modal')?.remove();
            processingModal.remove();
            
            // Show success
            this.showPaymentSuccess(payment);
            
        } catch (error) {
            processingModal.remove();
            this.showPaymentError(error);
        }
    }

    showPaymentSuccess(payment) {
        const successModal = document.createElement('div');
        successModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
        `;
        
        successModal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 16px; text-align: center; max-width: 400px;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                <h2 style="color: #10b981; margin-bottom: 1rem;">Payment Successful!</h2>
                <p style="color: #64748b; margin-bottom: 1rem;">
                    Transaction ID: ${payment.id}
                </p>
                <p style="color: #64748b; margin-bottom: 1.5rem;">
                    Your session with ${payment.tutor} has been confirmed.
                    You'll receive a confirmation email shortly.
                </p>
                <button onclick="this.closest('div[style*=\\"position: fixed\\"]').remove(); window.location.href='chat-learn.html';" 
                        style="padding: 0.75rem 2rem; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Start Session
                </button>
            </div>
        `;
        
        document.body.appendChild(successModal);
        
        // Auto close after 5 seconds
        setTimeout(() => {
            successModal.remove();
        }, 5000);
    }

    showPaymentError(error) {
        alert('Payment failed. Please try again.');
    }
}

// Initialize payment system
const paymentSystem = new PaymentSystem();

// Export for use in other files
window.paymentSystem = paymentSystem;
