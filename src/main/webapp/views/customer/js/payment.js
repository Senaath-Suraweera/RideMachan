// Load booking data and initialize page
document.addEventListener('DOMContentLoaded', function () {
    loadBookingData();
    setupCardFormatting();
});

function loadBookingData() {
    // 1. Try sessionStorage first (survives page navigation)
    let bookingData = null;
    try {
        const stored = sessionStorage.getItem('bookingDetails');
        if (stored) {
            bookingData = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to parse bookingDetails from sessionStorage', e);
    }

    // 2. Fallback to in-memory global
    if (!bookingData && window.bookingDetails) {
        bookingData = window.bookingDetails;
    }

    // 3. No data at all → show warning but stay on page so user can use Back to Booking
    if (!bookingData) {
        showNotification('No booking data found. Please start a new booking from the vehicle page.', 'warning');
        return;
    }

    // Keep it in memory too
    window.bookingDetails = bookingData;

    // Populate booking summary
    document.getElementById('summaryVehicleName').textContent = bookingData.vehicleName;
    document.getElementById('summaryMode').textContent = bookingData.modeDisplay;
    document.getElementById('summaryCompany').textContent = `Company: ${bookingData.company}`;

    document.getElementById('summaryPickup').textContent = bookingData.pickupDateTime;
    document.getElementById('summaryReturn').textContent = bookingData.returnDateTime;
    document.getElementById('summaryDuration').textContent = `${bookingData.hours} hour${bookingData.hours > 1 ? 's' : ''}`;
    document.getElementById('summaryLocation').textContent = bookingData.pickupLocation;

    document.getElementById('summaryRate').textContent = `LKR ${Number(bookingData.hourlyRate).toLocaleString()}/hour`;
    document.getElementById('summaryHours').textContent = `${bookingData.hours} hour${bookingData.hours > 1 ? 's' : ''}`;
    document.getElementById('summarySubtotal').textContent = `LKR ${Number(bookingData.subtotal).toLocaleString()}`;
    document.getElementById('summaryServiceFee').textContent = `LKR ${Number(bookingData.serviceFee).toLocaleString()}`;
    document.getElementById('summaryTotal').textContent = `LKR ${Number(bookingData.totalCost).toLocaleString()}`;

    // Update pay button
    document.getElementById('payButtonText').textContent = `Pay LKR ${Number(bookingData.totalCost).toLocaleString()}`;

    // Remove HTML 'required' attributes so only format validation is enforced
    ['card-number', 'expiry-date', 'cvv', 'cardholder-name', 'email', 'phone'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.removeAttribute('required');
    });
}

function setupCardFormatting() {
    // Format card number with spaces
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }

    // Format expiry date as MM/YY
    const expiryInput = document.getElementById('expiry-date');
    if (expiryInput) {
        expiryInput.addEventListener('input', function (e) {
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
        cvvInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        });
    }

    // Format cardholder name (letters and spaces only)
    const nameInput = document.getElementById('cardholder-name');
    if (nameInput) {
        nameInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
        });
    }

    // Format phone number
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/[^\d+\s-]/g, '');
            e.target.value = value;
        });
    }
}

/**
 * FORMAT-ONLY validation.
 * - Empty fields are allowed (no "required" errors).
 * - If a field IS filled, it must match its format.
 */
function validateFormatOnly() {
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiry-date').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    const cardholderName = document.getElementById('cardholder-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (cardNumber.length > 0 && cardNumber.length !== 16) {
        showNotification('Card number must be 16 digits', 'warning');
        return false;
    }

    if (expiryDate.length > 0) {
        if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
            showNotification('Expiry date must be in MM/YY format', 'warning');
            return false;
        }
        const [month] = expiryDate.split('/').map(Number);
        if (month < 1 || month > 12) {
            showNotification('Expiry month must be between 01 and 12', 'warning');
            return false;
        }
    }

    if (cvv.length > 0 && cvv.length !== 3) {
        showNotification('CVV must be 3 digits', 'warning');
        return false;
    }

    if (cardholderName.length > 0 && !/^[a-zA-Z\s]+$/.test(cardholderName)) {
        showNotification('Cardholder name can only contain letters', 'warning');
        return false;
    }

    if (email.length > 0 && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showNotification('Please enter a valid email address', 'warning');
        return false;
    }

    if (phone.length > 0) {
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length < 7) {
            showNotification('Phone number is too short', 'warning');
            return false;
        }
    }

    return true;
}

async function processPayment(event) {
    event.preventDefault();

    if (!validateFormatOnly()) {
        return;
    }

    const bookingData = window.bookingDetails;
    if (!bookingData) {
        showNotification('No booking data found. Please start a new booking.', 'error');
        return;
    }

    const payButton = document.getElementById('payButton');
    const originalHTML = payButton.innerHTML;
    payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
    payButton.disabled = true;

    // Build the payment confirmation object that payment-status will read
    const paymentConfirmation = {
        ...bookingData,
        paymentMethod: document.getElementById('payment-method').value,
        paymentMethodDisplay: getPaymentMethodDisplay(document.getElementById('payment-method').value),
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        cardholderName: document.getElementById('cardholder-name').value,
        confirmationNumber: generateConfirmationNumber(),
        paymentDate: new Date().toISOString(),
        status: 'Confirmed'
    };

    // Call backend to mark booking status = 'confirmed' in company_booking table
    try {
        const response = await fetch('/customer/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rideId: bookingData.rideId,
                vehicleId: bookingData.vehicleId,
                paymentMethod: paymentConfirmation.paymentMethod,
                totalCost: bookingData.totalCost
            })
        });

        let result = null;
        try {
            result = await response.json();
        } catch (_) {
            // Non-JSON response; treat as failure unless status OK
        }

        if (response.ok && (!result || result.success !== false)) {
            // Store for payment-status page in BOTH memory and sessionStorage
            window.paymentConfirmation = paymentConfirmation;
            try {
                sessionStorage.setItem('paymentConfirmation', JSON.stringify(paymentConfirmation));
            } catch (e) {
                console.error('Failed to save paymentConfirmation to sessionStorage', e);
            }

            // Clear the pending booking details now that it's confirmed
            sessionStorage.removeItem('bookingDetails');

            // Fire booking confirmation email (non-blocking fire-and-forget)
            sendBookingConfirmationEmail(paymentConfirmation, bookingData);

            showNotification('Payment successful! Confirmation email sent. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'payment_status.html';
            }, 1500);
        } else {
            payButton.innerHTML = originalHTML;
            payButton.disabled = false;
            const msg = (result && result.message) ? result.message : 'Payment could not be confirmed. Please try again.';
            showNotification(msg, 'error');
        }
    } catch (error) {
        console.error('Confirm payment error:', error);
        payButton.innerHTML = originalHTML;
        payButton.disabled = false;
        showNotification('Network error. Please try again.', 'error');
    }
}

/**
 * Sends a booking confirmation email to the address entered in the
 * Contact Information section. Fire-and-forget — we don't block the
 * redirect on SMTP latency.
 */
function sendBookingConfirmationEmail(paymentConfirmation, bookingData) {
    if (!paymentConfirmation.email) {
        console.warn('No email address provided; skipping confirmation email.');
        return;
    }

    try {
        fetch('/customer/send-booking-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: paymentConfirmation.email,
                bookingId: paymentConfirmation.confirmationNumber,
                customerName: paymentConfirmation.cardholderName,
                vehicleName: bookingData.vehicleName,
                company: bookingData.company,
                mode: bookingData.modeDisplay,
                pickupDateTime: bookingData.pickupDateTime,
                returnDateTime: bookingData.returnDateTime,
                duration: `${bookingData.hours} hour${bookingData.hours > 1 ? 's' : ''}`,
                pickupLocation: bookingData.pickupLocation,
                hourlyRate: `LKR ${Number(bookingData.hourlyRate).toLocaleString()}/hour`,
                subtotal: `LKR ${Number(bookingData.subtotal).toLocaleString()}`,
                serviceFee: `LKR ${Number(bookingData.serviceFee).toLocaleString()}`,
                totalCost: `LKR ${Number(bookingData.totalCost).toLocaleString()}`,
                paymentMethod: paymentConfirmation.paymentMethodDisplay,
                phone: paymentConfirmation.phone
            })
        }).catch(err => console.error('Email send failed:', err));
    } catch (e) {
        console.error('Email dispatch error:', e);
    }
}

function getPaymentMethodDisplay(value) {
    switch (value) {
        case 'credit-debit': return 'Credit/Debit Card';
        case 'paypal': return 'PayPal';
        case 'bank-transfer': return 'Bank Transfer';
        default: return 'Card Payment';
    }
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

function showNotifications() { window.location.href = 'notifications.html'; }
function showMessages() { showNotification('Messages feature coming soon!', 'info'); }
function toggleProfileDropdown() { showNotification('Profile dropdown coming soon!', 'info'); }

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/customer/logout', { method: 'GET' })
            .then(response => {
                if (response.redirected) window.location.href = response.url;
                else window.location.href = '/views/landing/index.html';
            })
            .catch(() => { window.location.href = '/views/landing/index.html'; });
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--success)' :
        type === 'warning' ? 'var(--warning)' :
            type === 'error' ? 'var(--danger)' : 'var(--info)';
    const icon = type === 'success' ? 'fa-check-circle' :
        type === 'warning' ? 'fa-exclamation-triangle' :
            type === 'error' ? 'fa-times-circle' : 'fa-info-circle';

    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background: ${bgColor}; color: white; border-radius: var(--radius);
        box-shadow: var(--shadow-lg); z-index: 10001; font-weight: 500;
        display: flex; align-items: center; gap: 10px;
        animation: slideInRight 0.3s ease; max-width: 400px;
    `;
    notification.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}