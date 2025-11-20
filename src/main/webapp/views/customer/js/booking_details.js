// Sample bookings database with company information
// IMPORTANT: Company IDs MUST match the companyData object in company-profile.html
const bookingsDatabase = {
    'CC-2024-008': {
        id: 'CC-2024-008',
        vehicle: 'Toyota Prius',
        vehicleType: 'Sedan',
        vehiclePlate: 'CAA-1234',
        rentalType: 'with-driver',
        status: 'Active',
        pickup: 'Colombo Fort Railway Station',
        dropoff: 'Kandy City Center',
        pickupDate: '8/13/2024',
        pickupTime: '09:00',
        dropoffDate: '8/13/2024',
        dropoffTime: '18:00',
        amount: 15000,
        baseFare: 12000,
        driverCharges: 2000,
        serviceFee: 1000,
        paymentStatus: 'Paid',
        company: {
            id: 1,
            name: 'Premium Rentals',
            phone: '+94 11 234 5678',
            email: 'info@premiumrentals.lk'
        },
        driver: {
            id: 'driver-001',
            name: 'Lasith Perera',
            initial: 'LP',
            rating: 4.8,
            reviews: 156,
            trips: 250,
            experience: 8,
            languages: 'Multilingual',
            bio: 'Experienced professional driver with over 8 years of service. Specialized in long-distance tours and airport transfers.',
            phone: '+94 77 123 4567'
        }
    },
    'CC-2024-009': {
        id: 'CC-2024-009',
        vehicle: 'Toyota Prius',
        vehicleType: 'Sedan',
        vehiclePlate: 'SMI-4537',
        rentalType: 'with-driver',
        status: 'Confirmed',
        pickup: 'Colombo Fort Railway Station',
        dropoff: 'Bandaranaike International Airport',
        pickupDate: '8/16/2024',
        pickupTime: '06:00',
        dropoffDate: '8/16/2024',
        dropoffTime: '18:00',
        amount: 12000,
        baseFare: 9000,
        driverCharges: 2000,
        serviceFee: 1000,
        paymentStatus: 'Paid',
        company: {
            id: 2,
            name: 'City Car Rentals',
            phone: '+94 81 234 5679',
            email: 'info@citycarrentals.lk'
        },
        driver: {
            id: 'driver-002',
            name: 'Ruwan Silva',
            initial: 'RS',
            rating: 4.7,
            reviews: 152,
            trips: 200,
            experience: 9,
            languages: 'English, Sinhala, Tamil',
            bio: 'Professional driver specializing in airport transfers and city tours. Known for punctuality and excellent customer service.',
            phone: '+94 71 234 5678'
        }
    },
    'BB-2024-010': {
        id: 'BB-2024-010',
        vehicle: 'Toyota Aqua',
        vehicleType: 'Hybrid',
        vehiclePlate: 'BAA-5678',
        rentalType: 'with-driver',
        status: 'Confirmed',
        pickup: 'Galle Face Green',
        dropoff: 'Sigiriya Rock Fortress',
        pickupDate: '8/18/2024',
        pickupTime: '06:00',
        dropoffDate: '8/18/2024',
        dropoffTime: '20:00',
        amount: 25000,
        baseFare: 20000,
        driverCharges: 3000,
        serviceFee: 2000,
        paymentStatus: 'Payment Pending',
        company: {
            id: 3,
            name: 'Budget Wheels',
            phone: '+94 91 234 5680',
            email: 'contact@budgetwheels.lk'
        },
        driver: {
            id: 'driver-003',
            name: 'Chaminda Fernando',
            initial: 'CF',
            rating: 4.6,
            reviews: 98,
            trips: 150,
            experience: 6,
            languages: 'Sinhala, English',
            bio: 'Friendly and knowledgeable driver with extensive experience in cultural site tours.',
            phone: '+94 76 345 6789'
        }
    },
    'SD-2024-011': {
        id: 'SD-2024-011',
        vehicle: 'Suzuki Alto',
        vehicleType: 'Compact',
        vehiclePlate: 'KAA-9012',
        rentalType: 'self-drive',
        status: 'Confirmed',
        pickup: 'Kandy City Centre',
        dropoff: 'Temple of the Tooth',
        pickupDate: '8/20/2024',
        pickupTime: '06:00',
        dropoffDate: '8/20/2024',
        dropoffTime: '17:00',
        amount: 8500,
        baseFare: 7000,
        driverCharges: 0,
        serviceFee: 1500,
        paymentStatus: 'Payment Pending',
        company: {
            id: 1,
            name: 'Premium Rentals',
            phone: '+94 11 234 5678',
            email: 'info@premiumrentals.lk'
        },
        driver: null
    },
    'LL-2024-004': {
        id: 'LL-2024-004',
        vehicle: 'Toyota Prius',
        vehicleType: 'Sedan',
        vehiclePlate: 'LAA-3456',
        rentalType: 'with-driver',
        status: 'Completed',
        pickup: 'Colombo Airport',
        dropoff: 'Kandy Queens Hotel',
        pickupDate: '8/10/2024',
        pickupTime: '09:00',
        dropoffDate: '8/10/2024',
        dropoffTime: '18:00',
        amount: 18000,
        baseFare: 14000,
        driverCharges: 2500,
        serviceFee: 1500,
        paymentStatus: 'Completed',
        company: {
            id: 2,
            name: 'City Car Rentals',
            phone: '+94 81 234 5679',
            email: 'info@citycarrentals.lk'
        },
        driver: {
            id: 'driver-001',
            name: 'Lasith Perera',
            initial: 'LP',
            rating: 4.8,
            reviews: 156,
            trips: 250,
            experience: 8,
            languages: 'Multilingual',
            bio: 'Experienced professional driver with over 8 years of service.',
            phone: '+94 77 123 4567'
        }
    }
};

// Global variables
let currentBooking = null;

// Load components
function loadComponent(elementId, filePath, callback) {
    fetch(filePath)
        .then(response => response.text())
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
            if (callback) callback();
        })
        .catch(error => console.error('Error loading component:', error));
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadComponent('navbar-container', '../components/navbar.html', () => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        const bookingsNav = document.querySelector('[data-page="bookings"]');
        if (bookingsNav) bookingsNav.classList.add('active');
    });

    loadComponent('header-container', '../components/header.html', () => {
        const pageTitle = document.querySelector('.hi h1');
        if (pageTitle) {
            pageTitle.textContent = 'Booking Details';
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) subtitle.textContent = 'Complete information about your reservation';
        }
    });

    setTimeout(() => {
        initializeBookingDetails();
    }, 100);
});

function initializeBookingDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id') || 'CC-2024-009';
    
    const booking = bookingsDatabase[bookingId];
    
    if (!booking) {
        showNotification('Booking not found', 'warning');
        setTimeout(() => window.location.href = 'bookings.html', 2000);
        return;
    }

    currentBooking = booking;

    // Update booking header
    document.getElementById('bookingId').textContent = booking.id;
    const statusBadge = document.getElementById('bookingStatus');
    statusBadge.textContent = booking.status;
    statusBadge.className = 'status-badge';
    if (booking.status === 'Active' || booking.status === 'Confirmed') {
        statusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
        statusBadge.style.color = '#10b981';
    } else if (booking.status === 'Completed') {
        statusBadge.style.background = 'rgba(72, 149, 239, 0.1)';
        statusBadge.style.color = '#4895ef';
    }

    // Update vehicle information
    document.getElementById('vehicleName').textContent = booking.vehicle;
    document.getElementById('companyName').textContent = booking.company.name;
    document.getElementById('vehicleTypeText').textContent = booking.vehicleType;
    document.getElementById('vehiclePlateText').textContent = booking.vehiclePlate;
    document.getElementById('rentalTypeText').textContent = 
        booking.rentalType === 'with-driver' ? 'With Driver' : 'Self-Drive';

    // Update schedule
    document.getElementById('pickupLocation').textContent = booking.pickup;
    document.getElementById('dropoffLocation').textContent = booking.dropoff;
    document.getElementById('pickupDate').innerHTML = 
        `<i class="fas fa-calendar"></i> ${booking.pickupDate}`;
    document.getElementById('pickupTime').innerHTML = 
        `<i class="fas fa-clock"></i> ${booking.pickupTime}`;
    document.getElementById('dropoffDate').innerHTML = 
        `<i class="fas fa-calendar"></i> ${booking.dropoffDate}`;
    document.getElementById('dropoffTime').innerHTML = 
        `<i class="fas fa-clock"></i> ${booking.dropoffTime}`;
    
    // Calculate duration
    const startHour = parseInt(booking.pickupTime.split(':')[0]);
    const endHour = parseInt(booking.dropoffTime.split(':')[0]);
    const duration = endHour - startHour;
    document.getElementById('durationText').textContent = `${duration} Hours`;

    // Update cost breakdown
    document.getElementById('baseFare').textContent = `LKR ${booking.baseFare.toLocaleString()}`;
    document.getElementById('driverCharges').textContent = `LKR ${booking.driverCharges.toLocaleString()}`;
    document.getElementById('serviceFee').textContent = `LKR ${booking.serviceFee.toLocaleString()}`;
    document.getElementById('totalAmount').textContent = `LKR ${booking.amount.toLocaleString()}`;
    document.getElementById('paymentStatusText').textContent = booking.paymentStatus;

    // Show/hide driver or self-drive sections
    if (booking.rentalType === 'self-drive') {
        document.getElementById('driverCard').style.display = 'none';
        document.getElementById('selfDriveCard').style.display = 'block';
        document.getElementById('driverChargesRow').style.display = 'none';
    } else {
        document.getElementById('driverCard').style.display = 'block';
        document.getElementById('selfDriveCard').style.display = 'none';
        
        // Update driver information
        if (booking.driver) {
            const driver = booking.driver;
            document.getElementById('driverPlaceholder').textContent = driver.initial;
            document.getElementById('driverName').textContent = driver.name;
            document.getElementById('driverRating').textContent = driver.rating;
            document.getElementById('driverReviews').textContent = `(${driver.reviews} reviews)`;
            document.getElementById('driverBio').textContent = driver.bio;
            document.getElementById('driverTrips').textContent = `${driver.trips}+ Trips`;
            document.getElementById('driverExperience').textContent = `${driver.experience} Years Experience`;
            document.getElementById('driverLanguages').textContent = driver.languages;
            
            // Store driver ID for navigation
            window.currentDriverId = driver.id;
        }
    }

    // Update support modal information
    updateSupportModal(booking);
}

function updateSupportModal(booking) {
    // Update driver support option
    if (booking.driver) {
        document.getElementById('driverSupportOption').style.display = 'block';
        document.getElementById('driverContactInfo').innerHTML = `
            <strong>Name:</strong> ${booking.driver.name}<br>
            <strong>Phone:</strong> ${booking.driver.phone}
        `;
    } else {
        document.getElementById('driverSupportOption').style.display = 'none';
    }

    // Update company support option
    document.getElementById('companyContactInfo').innerHTML = `
        <strong>Company:</strong> ${booking.company.name}<br>
        <strong>Phone:</strong> ${booking.company.phone}<br>
        <strong>Email:</strong> ${booking.company.email}
    `;
}

function navigateToCompany() {
    if (currentBooking && currentBooking.company) {
        // Store company ID in sessionStorage to be read by company-profile.html
        sessionStorage.setItem('selectedCompanyId', currentBooking.company.id);
        // Navigate to company profile page
        window.location.href = `company-profile.html?company=${currentBooking.company.id}`;
    }
}

function navigateToDriverProfile() {
    if (window.currentDriverId) {
        sessionStorage.setItem('selectedDriverId', window.currentDriverId);
        sessionStorage.setItem('previousPage', 'booking_details');
        window.location.href = 'driver-profile.html';
    }
}

function viewInvoice() {
    if (currentBooking) {
        sessionStorage.setItem('invoiceBookingId', currentBooking.id);
        window.location.href = `payment_status.html?id=${currentBooking.id}`;
    }
}

function callDriver() {
    if (currentBooking && currentBooking.driver) {
        showNotification(`Calling ${currentBooking.driver.name}...`, 'info');
        setTimeout(() => {
            window.location.href = `tel:${currentBooking.driver.phone}`;
        }, 1000);
    }
}

function messageDriver() {
    if (currentBooking && currentBooking.driver) {
        showNotification(`Opening message to ${currentBooking.driver.name}...`, 'info');
        // In a real app, this would open a messaging interface
        setTimeout(() => {
            alert(`Message feature coming soon. You can call ${currentBooking.driver.name} at ${currentBooking.driver.phone}`);
        }, 1000);
    }
}

function contactSupport() {
    const modal = document.getElementById('supportModal');
    modal.classList.add('show');
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    modal.classList.remove('show');
}

function contactDriverPhone() {
    if (currentBooking && currentBooking.driver) {
        window.location.href = `tel:${currentBooking.driver.phone}`;
    }
}

function contactCompanyPhone() {
    if (currentBooking && currentBooking.company) {
        window.location.href = `tel:${currentBooking.company.phone}`;
    }
}

function contactAdmin() {
    window.location.href = 'tel:+94112345678';
}

function cancelBooking() {
    if (currentBooking && (currentBooking.status === 'Active' || currentBooking.status === 'Confirmed')) {
        const modal = document.getElementById('cancelModal');
        modal.classList.add('show');
    } else {
        showNotification('This booking cannot be cancelled', 'warning');
    }
}

function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    modal.classList.remove('show');
}

function confirmCancel() {
    closeCancelModal();
    showNotification('Processing cancellation...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Booking cancelled successfully', 'success');
        setTimeout(() => {
            window.location.href = 'bookings.html';
        }, 2000);
    }, 1500);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type} show`;
    
    const iconClass = type === 'success' ? 'check-circle' : 
                     type === 'warning' ? 'exclamation-triangle' : 
                     type === 'error' ? 'times-circle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${iconClass}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const cancelModal = document.getElementById('cancelModal');
    const supportModal = document.getElementById('supportModal');
    
    if (event.target === cancelModal) {
        closeCancelModal();
    }
    if (event.target === supportModal) {
        closeSupportModal();
    }
}