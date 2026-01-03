// API Configuration: prefer explicit override, then same-origin server, else localhost:3000
const API_URL = (() => {
    const explicit = window.API_URL;
    if (explicit) return explicit;

    const { protocol, hostname, origin } = window.location;

    // If we are already on the API host (e.g., server serves frontend), reuse origin
    if (origin && origin.startsWith('http') && origin.indexOf('file://') !== 0) {
        // For local dev where frontend is on another port (e.g., 5500), prefer backend 3000
        if (hostname === 'localhost' && !origin.includes(':3000')) {
            return `${protocol}//${hostname}:3000/api`;
        }
        return `${origin.replace(/\/$/, '')}/api`;
    }

    // Safe default
    return 'http://localhost:3000/api';
})();

// API Helper Functions
const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
};

// Authentication Helper Functions
const auth = {
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    setAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    async verifyToken() {
        try {
            const response = await api.get('/auth/verify');
            if (response.success) {
                localStorage.setItem('user', JSON.stringify(response.user));
                return response.user;
            }
            return null;
        } catch (error) {
            this.clearAuth();
            return null;
        }
    },

    isAdmin() {
        const user = this.getUser();
        return user && (user.role === 'admin' || user.role === 'hr');
    },

    logout() {
        this.clearAuth();
        window.location.href = '/login.html';
    },
};

// UI Helper Functions
const ui = {
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;

        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => alertDiv.remove(), 5000);
    },

    showError(message) {
        this.showAlert(message, 'error');
    },

    showSuccess(message) {
        this.showAlert(message, 'success');
    },

    showLoading(element) {
        element.innerHTML = '<div class="spinner"></div>';
    },

    hideLoading(element) {
        const spinner = element.querySelector('.spinner');
        if (spinner) spinner.remove();
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    },

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },

    getBadgeClass(status) {
        const statusMap = {
            'present': 'badge-success',
            'absent': 'badge-danger',
            'half_day': 'badge-warning',
            'leave': 'badge-info',
            'pending': 'badge-warning',
            'approved': 'badge-success',
            'rejected': 'badge-danger',
            'active': 'badge-success',
            'inactive': 'badge-warning',
            'terminated': 'badge-danger'
        };
        return statusMap[status] || 'badge-info';
    },

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h2 class="modal-header">${title}</h2>
                <div class="modal-body">${content}</div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        };

        setTimeout(() => modal.classList.add('active'), 10);

        return modal;
    },
};

// Form Validation
const validate = {
    email(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    password(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
        return regex.test(password);
    },

    required(value) {
        return value && value.trim().length > 0;
    },

    phone(phone) {
        const regex = /^\d{10}$/;
        return regex.test(phone.replace(/\D/g, ''));
    },

    employeeId(id) {
        return /^[A-Z0-9]+$/.test(id);
    },
};

// Initialize navbar if user is authenticated
function initNavbar() {
    if (!auth.isAuthenticated()) return;

    const user = auth.getUser();
    if (!user) return;

    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const isAdmin = auth.isAdmin();

    navbar.innerHTML = `
        <div class="navbar-content">
            <div class="navbar-brand">
                <img src="./logos/dayflow.png" alt="Dayflow" style="height: 32px; width: auto; margin-right: 8px;">
                Dayflow
            </div>
            <ul class="navbar-menu">
                <li><a href="/${isAdmin ? 'admin' : 'employee'}-dashboard.html">Dashboard</a></li>
                ${isAdmin ? '<li><a href="/employees.html">Employees</a></li>' : ''}
                <li><a href="/attendance.html">Attendance</a></li>
                <li><a href="/leave.html">Leave</a></li>
                <li><a href="/payroll.html">Payroll</a></li>
                <li class="navbar-profile-container">
                    <button class="navbar-profile-btn" onclick="toggleProfileDropdown()">
                        <span class="profile-avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                        <span class="profile-name">${user.name || 'User'}</span>
                        <span class="profile-arrow">▼</span>
                    </button>
                    <div class="profile-dropdown" id="profileDropdown">
                        <div class="profile-dropdown-header">
                            <div class="profile-avatar-large">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                            <div>
                                <div class="profile-dropdown-name">${user.name || 'User'}</div>
                                <div class="profile-dropdown-email">${user.email || ''}</div>
                            </div>
                        </div>
                        <div class="profile-dropdown-divider"></div>
                        <a href="/profile.html" class="profile-dropdown-item">
                            <span>👤</span> My Profile
                        </a>
                        <button class="profile-dropdown-item" onclick="toggleSettingsModal()">
                            <span>⚙️</span> Settings
                        </button>
                        <div class="profile-dropdown-divider"></div>
                        <button class="profile-dropdown-item logout-btn" onclick="auth.logout()">
                            <span>🚪</span> Logout
                        </button>
                    </div>
                </li>
            </ul>
        </div>
    `;

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const profileContainer = document.querySelector('.navbar-profile-container');
        const dropdown = document.getElementById('profileDropdown');
        if (profileContainer && !profileContainer.contains(e.target) && dropdown) {
            dropdown.classList.remove('active');
        }
    });
}

// Toggle profile dropdown
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Toggle settings modal
function toggleSettingsModal() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.remove('active');
    
    const existingModal = document.getElementById('settingsModal');
    if (existingModal) {
        existingModal.remove();
        return;
    }

    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    const modal = document.createElement('div');
    modal.id = 'settingsModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close" onclick="document.getElementById('settingsModal').remove()">&times;</span>
            <h2 class="modal-header">⚙️ Settings</h2>
            <div class="settings-section">
                <h3 class="settings-section-title">Appearance</h3>
                <div class="settings-item">
                    <div>
                        <div class="settings-item-label">Dark Mode</div>
                        <div class="settings-item-description">Toggle dark mode for better visibility</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="darkModeToggle" ${isDarkMode ? 'checked' : ''} onchange="toggleDarkMode()">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            <div class="settings-section">
                <h3 class="settings-section-title">General</h3>
                <div class="settings-item">
                    <div>
                        <div class="settings-item-label">Language</div>
                        <div class="settings-item-description">Select your preferred language</div>
                    </div>
                    <select class="form-select" style="width: auto;">
                        <option selected>English</option>
                        <option>Hindi</option>
                        <option>Spanish</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Toggle dark mode
function toggleDarkMode() {
    const isDarkMode = document.getElementById('darkModeToggle').checked;
    localStorage.setItem('darkMode', isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
    ui.showSuccess(isDarkMode ? 'Dark mode enabled' : 'Dark mode disabled');
}

// Initialize dark mode on page load
function initDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

// Check authentication on protected pages
async function checkAuth() {
    if (!auth.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }

    const user = await auth.verifyToken();
    if (!user) {
        window.location.href = '/login.html';
        return false;
    }

    return true;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    const publicPages = ['login.html', 'signup.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Initialize dark mode
    initDarkMode();

    if (!publicPages.includes(currentPage)) {
        const authenticated = await checkAuth();
        if (authenticated) {
            initNavbar();
        }
    } else if (auth.isAuthenticated() && (currentPage === 'login.html' || currentPage === 'signup.html')) {
        // Redirect to dashboard if already logged in
        const user = auth.getUser();
        window.location.href = auth.isAdmin() ? '/admin-dashboard.html' : '/employee-dashboard.html';
    }
});
