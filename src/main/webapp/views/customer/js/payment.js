// Default booking data for demo purposes
const defaultBookingData = {
    vehicleId: 1,
    vehicleName: "Honda Vezel",
    company: "Premium Rentals Colombo",
    mode: 'self-drive',
    modeDisplay: 'Self Drive',
    pickupDate: '2025-10-24',
    pickupTime: '09:00',
    pickupDateTime: 'Fri, Oct 24, 2025, 09:00 AM',
    returnDate: '2025-10-25',
    returnTime: '18:00',
    returnDateTime: 'Sat, Oct 25, 2025, 06:00 PM',
    pickupLocation: 'Colombo 03',
    hours: 33,
    hourlyRate: 2700,
    subtotal: 89100,
    serviceFee: 500,
    totalCost: 89600
};

// Load booking data and initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadBookingData();
    setupCardFormatting();
    setupFormValidation();
});

function loadBookingData() {
    // Get booking data from memory (set by vehicle-profile page)
    let bookingData = window.bookingDetails;
    
    // If no booking data, use default demo data
    if (!bookingData) {
        bookingData = defaultBookingData;
        window.bookingDetails = bookingData;
    }
    
    // Populate booking summary
    document.getElementById('summaryVehicleName').textContent = bookingData.vehicleName;
    document.getElementById('summaryMode').textContent = bookingData.modeDisplay;
    document.getElementById('summaryCompany').textContent = `Company: ${bookingData.company}`;
    
    document.getElementById('summaryPickup').textContent = bookingData.pickupDateTime;
    document.getElementById('summaryReturn').textContent = bookingData.returnDateTime;
    document.getElementById('summaryDuration').textContent = `${bookingData.hours} hour${bookingData.hours > 1 ? 's' : ''}`;
    document.getElementById('summaryLocation').textContent = bookingData.pickupLocation;
    
    document.getElementById('summaryRate').textContent = `LKR ${bookingData.hourlyRate.toLocaleString()}/hour`;
    document.getElementById('summaryHours').textContent = `${bookingData.hours} hour${bookingData.hours > 1 ? 's' : ''}`;
    document.getElementById('summarySubtotal').textContent = `LKR ${bookingData.subtotal.toLocaleString()}`;
    document.getElementById('summaryServiceFee').textContent = `LKR ${bookingData.serviceFee.toLocaleString()}`;
    document.getElementById('summaryTotal').textContent = `LKR ${bookingData.totalCost.toLocaleString()}`;
    
    // Update pay button
    document.getElementById('payButtonText').textContent = `Pay LKR ${bookingData.totalCost.toLocaleString()}`;
}

function setupCardFormatting() {
    // Format card number with spaces
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }

    // Format expiry date as MM/YY
    const expiryInput = document.getElementById('expiry-date');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Format CVV (numbers only, max 3 digits)
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        });
    }

    // Format cardholder name (letters and spaces only)
    const nameInput = document.getElementById('cardholder-name');
    if (nameInput) {
        nameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
        });
    }

    // Format phone number
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\d+\s-]/g, '');
            e.target.value = value;
        });
    }
}

function setupFormValidation() {
    const form = document.querySelector('.payment-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validateForm()) {
                e.preventDefault();
            }
        });
    }
}

function validateForm() {
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiry-date').value;
    const cvv = document.getElementById('cvv').value;
    const cardholderName = document.getElementById('cardholder-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    // Validate card number (should be 16 digits)
    if (cardNumber.length !== 16) {
        showNotification('Please enter a valid 16-digit card number', 'warning');
        return false;
    }

    // Validate expiry date
    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
        showNotification('Please enter a valid expiry date (MM/YY)', 'warning');
        return false;
    }

    const [month, year] = expiryDate.split('/').map(Number);
    if (month < 1 || month > 12) {
        showNotification('Please enter a valid month (01-12)', 'warning');
        return false;
    }

    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        showNotification('Card has expired', 'warning');
        return false;
    }

    // Validate CVV
    if (cvv.length !== 3) {
        showNotification('Please enter a valid 3-digit CVV', 'warning');
        return false;
    }

    // Validate cardholder name
    if (cardholderName.trim().length < 3) {
        showNotification('Please enter a valid cardholder name', 'warning');
        return false;
    }

    // Validate email
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showNotification('Please enter a valid email address', 'warning');
        return false;
    }

    // Validate phone
    if (phone.trim().length < 10) {
        showNotification('Please enter a valid phone number', 'warning');
        return false;
    }

    return true;
}

function processPayment(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    // Get booking data
    const bookingData = window.bookingDetails || defaultBookingData;

    // Show processing state
    const payButton = document.getElementById('payButton');
    const originalHTML = payButton.innerHTML;
    payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
    payButton.disabled = true;

    // Simulate payment processing (3 seconds)
    setTimeout(() => {
        // Simulate successful payment (90% success rate for demo)
        const paymentSuccess = Math.random() > 0.1;

        if (paymentSuccess) {
            // Store payment confirmation
            const paymentConfirmation = {
                ...bookingData,
                paymentMethod: document.getElementById('payment-method').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                confirmationNumber: generateConfirmationNumber(),
                paymentDate: new Date().toISOString(),
                status: 'Confirmed'
            };

            window.paymentConfirmation = paymentConfirmation;

            showNotification('Payment successful! Redirecting to confirmation...', 'success');
            
            setTimeout(() => {
                // Redirect to payment status/confirmation page
                window.location.href = 'payment-confirmation.html';
            }, 2000);
        } else {
            // Payment failed
            payButton.innerHTML = originalHTML;
            payButton.disabled = false;
            showNotification('Payment failed. Please try again or use a different card.', 'error');
        }
    }, 3000);
}

function generateConfirmationNumber() {
    const prefix = 'RMB';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

function goBackToBooking() {
    if (confirm('Are you sure you want to go back? Your booking details will be preserved.')) {
        window.history.back();
    }
}

function showNotifications() {
    window.location.href = 'notifications.html';
}

function showMessages() {
    showNotification('Messages feature coming soon!', 'info');
}

function toggleProfileDropdown() {
    showNotification('Profile dropdown coming soon!', 'info');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Call backend servlet
        fetch('/customer/logout', { method: 'GET' })
            .then(response => {
                // Follow redirect from servlet
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    // Manual fallback
                    window.location.href = '/views/landing/index.html';
                }
            })
            .catch(error => {
                console.error('Logout failed:', error);
                window.location.href = '/views/landing/index.html';
            });
    }
}


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    const bgColor = type === 'success' ? 'var(--success)' : 
                    type === 'warning' ? 'var(--warning)' : 
                    type === 'error' ? 'var(--danger)' : 
                    'var(--info)';
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'warning' ? 'fa-exclamation-triangle' : 
                 type === 'error' ? 'fa-times-circle' : 
                 'fa-info-circle';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${bgColor};
        color: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 10001;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}