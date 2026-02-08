// API Base URL
const API_URL = window.location.origin + '/api';

// Global State
let currentUser = null;
let cart = [];
let allProducts = [];
let allUsers = [];
let allSalesHistory = [];

// Sanitize error messages to remove technical details
function sanitizeErrorMessage(error) {
    if (!error) return 'An error occurred. Please try again.';
    
    const message = typeof error === 'string' ? error : error.message || String(error);
    
    // Remove localhost/technical details
    if (message.includes('localhost:5000')) {
        return 'Server communication error. Please try again.';
    }
    
    // Map common error patterns to friendly messages
    if (message.includes('Insufficient stock') || message.includes('stock')) {
        return 'Not enough stock available. Please check inventory.';
    }
    if (message.includes('Not found') || message.includes('404')) {
        return 'Item not found. Please refresh and try again.';
    }
    if (message.includes('Unauthorized') || message.includes('401')) {
        return 'Session expired. Please log in again.';
    }
    if (message.includes('Forbidden') || message.includes('403')) {
        return 'You do not have permission to perform this action.';
    }
    if (message.includes('Credit limit')) {
        return message; // Keep specific credit limit messages
    }
    if (message.includes('Connection') || message.includes('network')) {
        return 'Connection error. Please check your internet and try again.';
    }
    
    // If message is too technical, show generic message
    if (message.length > 100 || message.includes('at ') || message.includes('Success:')) {
        return 'Sales Successful.';
    }
    
    return message;
}

// Show error without sanitization (for detailed error messages from API)
function showErrorMessage(message, type = 'error', duration = 5000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '12px';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    
    let gradient = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    if (type === 'warning') {
        gradient = 'linear-gradient(135deg, #f39c12 0%, #d68910 100%)';
    }
    
    el.style.background = gradient;
    el.style.color = '#fff';
    el.style.padding = '16px 24px';
    el.style.marginTop = '8px';
    el.style.borderRadius = '12px';
    el.style.boxShadow = '0 10px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)';
    el.style.maxWidth = '420px';
    el.style.wordWrap = 'break-word';
    el.style.fontSize = '15px';
    el.style.fontWeight = '500';
    el.style.lineHeight = '1.4';
    el.style.backdropFilter = 'blur(8px)';
    el.style.border = '1px solid rgba(255,255,255,0.2)';
    el.style.pointerEvents = 'auto';
    el.style.animation = 'slideInUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.letterSpacing = '0.3px';
    el.textContent = message;

    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

// Show Notification Toast
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Sanitize the message
    const cleanMessage = sanitizeErrorMessage(message);

    
    // Add icon based on type
    let icon = '';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠';
    if (type === 'info') icon = 'ⓘ';
    
    notification.innerHTML = `<span style="font-size: 18px;">${icon}</span><span>${cleanMessage}</span>`;
    container.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check Authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showPage('loginPage');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            redirectToRolePage();
        } else {
            // Invalid or expired token
            localStorage.removeItem('token');
            currentUser = null;
            showPage('loginPage');
        }
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        currentUser = null;
        showPage('loginPage');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Login Form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Product Form
    document.getElementById('productForm')?.addEventListener('submit', handleProductSubmit);
    
    // User Form
    document.getElementById('userForm')?.addEventListener('submit', handleUserSubmit);
    
    // Checkout Form
    document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckout);
    
    // Restock Form
    document.getElementById('restockForm')?.addEventListener('submit', handleRestockSubmit);
    
    // Pay Debt Form
    document.getElementById('payDebtForm')?.addEventListener('submit', handlePayDebtSubmit);
    // Add Debt Form (Cashier)
    document.getElementById('addDebtForm')?.addEventListener('submit', handleAddDebtSubmit);
    
    // Barcode Input
    document.getElementById('barcodeInput')?.addEventListener('keypress', handleBarcodeInput);
    
    // Quick Search
    document.getElementById('quickSearch')?.addEventListener('input', handleQuickSearch);
    
    // Amount Paid Input
    document.getElementById('amountPaid')?.addEventListener('input', calculateChange);
    
    // Restock cost calculation
    document.getElementById('restockQuantity')?.addEventListener('input', calculateRestockCost);
    document.getElementById('restockCost')?.addEventListener('input', calculateRestockCost);
    
    // Customer selection change
    document.getElementById('checkoutCustomer')?.addEventListener('change', updateCustomerDebtInfo);
    // Add Debt customer change (modal)
    const addDebtSelect = document.getElementById('addDebtCustomer');
    if (addDebtSelect) addDebtSelect.addEventListener('change', updateAddDebtCustomerInfo);
}

// Login
// Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const eyeIcon = document.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.add('eye-hidden');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('eye-hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
                localStorage.setItem('token', data.token);
                // Fetch fresh user data from the server to avoid stale client-side state
                try {
                    const freshUser = await apiCall(`/users/${data.user.id}`);
                    currentUser = freshUser;
                } catch (err) {
                    // Fallback: normalize returned user (map `id` -> `_id`) so other code works
                    currentUser = Object.assign({}, data.user, { _id: data.user.id });
                }
                errorDiv.textContent = '';
                showNotification(' Login successfully!', 'success', 2000);
                setTimeout(() => redirectToRolePage(), 500);
        } else {
            const cleanError = sanitizeErrorMessage(data.error || 'Login failed');
            errorDiv.textContent = cleanError;
            showNotification(cleanError, 'error');
        }
    } catch (error) {
        const cleanError = 'Connection error. Please check your internet and try again.';
        errorDiv.textContent = cleanError;
        showNotification(cleanError, 'error');
    }
}

// Logout
function logout() {
    // Clear all state
    localStorage.removeItem('token');
    currentUser = null;
    cart = [];
    allProducts = [];
    allUsers = [];
    allSalesHistory = [];
    
    // Reset tabs to default (dashboard)
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Clear forms and modals
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').textContent = '';
    
    // Close any open modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    // Clear UI elements to ensure a fresh state
    try {
        if (typeof updateCartDisplay === 'function') updateCartDisplay();
    } catch (e) { console.error('updateCartDisplay error:', e); }
    const sr = document.getElementById('searchResults'); if (sr) sr.innerHTML = '';
    const qs = document.getElementById('quickSearch'); if (qs) qs.value = '';
    const bi = document.getElementById('barcodeInput'); if (bi) bi.value = '';

    // Show login page
    showPage('loginPage');
    
    // Focus on login input
    setTimeout(() => {
        const loginInput = document.getElementById('loginUsername');
        if (loginInput) loginInput.focus();
    }, 100);
}

// Redirect to Role Page
function redirectToRolePage() {
    if (!currentUser) return;

    switch (currentUser.role) {
        case 'ADMIN':
            showPage('adminPage');
            document.getElementById('adminUserName').textContent = currentUser.fullName;
            
            // Reset to dashboard tab
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.querySelector('.tab-btn').classList.add('active');
            document.getElementById('dashboardTab').classList.add('active');
            
            // Load fresh dashboard data
            setTimeout(() => loadAdminDashboard(), 100);
            break;
        case 'CASHIER':
            showPage('cashierPage');
            document.getElementById('cashierUserName').textContent = currentUser.fullName;
            // Load fresh products and customer data
            // Ensure the cashier screen is fully refreshed (clear cart, focus barcode, reload lists)
            setTimeout(() => {
                if (typeof refreshCashierScreen === 'function') {
                    refreshCashierScreen().catch(err => console.error('Refresh cashier screen error:', err));
                } else {
                    loadProducts();
                    loadCashierCustomers();
                }
            }, 100);
            break;
        case 'CUSTOMER':
            showPage('customerPage');
            document.getElementById('customerUserName').textContent = currentUser.fullName;
            // Load fresh customer data
            setTimeout(() => loadCustomerData(), 100);
            break;
    }
}

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// Show Tab
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');

    // Load data based on tab
    switch(tabName) {
        case 'dashboard':
            loadAdminDashboard();
            break;
        case 'products':
            loadAdminProducts();
            break;
        case 'users':
            loadAdminUsers();
            break;
        case 'debts':
            loadDebts();
            break;
        case 'reports':
            loadReport('daily');
            break;
        case 'salesHistory':
            loadSalesHistory('daily');
            break;
    }
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    
    // If no token exists, throw error with specific message
    if (!token) {
        throw new Error('UNAUTHORIZED_NO_TOKEN');
    }

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
        // For 401, throw specific error code so handlers can detect it
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED_INVALID_TOKEN');
        }
        
        try {
            const error = await response.json();
            throw new Error(error.error || `HTTP ${response.status} Error`);
        } catch (e) {
            if (e.message.includes('Unexpected token')) {
                throw new Error(`HTTP ${response.status} Error`);
            }
            throw e;
        }
    }

    return await response.json();
}

// Format Currency
function formatCurrency(amount) {
    return '₱' + parseFloat(amount).toFixed(2);
}

// ADMIN FUNCTIONS
async function loadAdminDashboard() {
    try {
        // Load daily sales
        const salesReport = await apiCall('/transactions/reports/sales?period=daily');
        document.getElementById('totalSales').textContent = formatCurrency(salesReport.totalSales);
        document.getElementById('totalTransactions').textContent = salesReport.totalTransactions;

        // Load low stock
        const lowStock = await apiCall('/products/alerts/low-stock');
        document.getElementById('lowStockCount').textContent = lowStock.length;
        
        const lowStockList = document.getElementById('lowStockList');
        if (lowStock.length === 0) {
            lowStockList.innerHTML = '<p class="empty-state">No low stock items</p>';
        } else {
            lowStockList.innerHTML = lowStock.map(p => `
                <div class="cart-item">
                    <div>
                        <div class="cart-item-name">${p.name}</div>
                        <div class="cart-item-price">Stock: ${p.stock} (Threshold: ${p.lowStockThreshold})</div>
                    </div>
                </div>
            `).join('');
        }

        // Load users count
        const users = await apiCall('/users');
        const activeUsers = users.filter(u => u.isActive).length;
        document.getElementById('activeUsers').textContent = activeUsers;
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

async function loadAdminProducts() {
    try {
        allProducts = await apiCall('/products');
        displayProducts(allProducts);
    } catch (error) {
        console.error('Load products error:', error);
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.barcode}</td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${formatCurrency(p.price)}</td>
            <td>${p.stock}</td>
            <td>
                <button onclick="showRestockModal('${p._id}')" class="btn btn-sm btn-success" title="Restock">📦</button>
                <button onclick="showPurchaseHistory('${p._id}')" class="btn btn-sm" title="Purchase History">📋</button>
                <button onclick="showRestockHistory('${p._id}')" class="btn btn-sm" title="Restock History">📊</button>
                <button onclick="editProduct('${p._id}')" class="btn btn-sm">Edit</button>
                <button onclick="deleteProduct('${p._id}')" class="btn btn-sm btn-danger">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddProduct() {
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    openModal('productModal');
}

async function editProduct(id) {
    try {
        const product = allProducts.find(p => p._id === id);
        if (!product) return;

        document.getElementById('productModalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product._id;
        document.getElementById('productBarcode').value = product.barcode;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productThreshold').value = product.lowStockThreshold;
        
        openModal('productModal');
    } catch (error) {
        showToast('Error loading product. Please try again.', 'error');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const productData = {
        barcode: document.getElementById('productBarcode').value,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        lowStockThreshold: parseInt(document.getElementById('productThreshold').value)
    };

    try {
        if (id) {
            await apiCall(`/products/${id}`, 'PUT', productData);
        } else {
            await apiCall('/products', 'POST', productData);
        }
        
        closeModal('productModal');
        loadAdminProducts();
        showToast('Product saved successfully!', 'success');
    } catch (error) {
        showToast('Error saving product. Please try again.', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        await apiCall(`/products/${id}`, 'DELETE');
        loadAdminProducts();
        showToast('Product deleted successfully!', 'success');
    } catch (error) {
        showToast('Error deleting product. Please try again.', 'error');
    }
}

// USER MANAGEMENT
async function loadAdminUsers() {
    try {
        allUsers = await apiCall('/users');
        displayUsers(allUsers);
    } catch (error) {
        console.error('Load users error:', error);
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => {
        const balance = u.balance || 0;
        // Only show debt (negative balance), hide credit (positive balance)
        const debtDisplay = balance < 0 
            ? `<span style="color: #e74c3c; font-weight: 600;">₱${Math.abs(balance).toFixed(2)}</span>`
            : `<span style="color: #27ae60;">No debt</span>`;
        
        return `
        <tr>
            <td>${u.username}</td>
            <td>${u.fullName}</td>
            <td>${u.role}</td>
            <td>${debtDisplay}</td>
            <td>${u.role === 'CUSTOMER' ? formatCurrency(u.creditLimit || 1000) : 'N/A'}</td>
            <td><span class="status-badge ${u.isActive ? 'status-active' : 'status-inactive'}">
                ${u.isActive ? 'Active' : 'Inactive'}
            </span></td>
            <td>
                ${u.role === 'CUSTOMER' ? `<button onclick="viewCustomerHistory('${u._id}')" class="btn btn-sm" title="View History">📋</button>` : ''}
                <button onclick="editUser('${u._id}')" class="btn btn-sm">Edit</button>
                ${u.isActive ? 
                    `<button onclick="deactivateUser('${u._id}')" class="btn btn-sm btn-danger">Deactivate</button>` :
                    `<button onclick="activateUser('${u._id}')" class="btn btn-sm btn-success">Activate</button>`
                }
                <button onclick="deleteUserPermanent('${u._id}')" class="btn btn-sm btn-danger" title="Permanently Delete">🗑️</button>
            </td>
        </tr>
    `;
    }).join('');
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filtered = allUsers.filter(u => 
        u.username.toLowerCase().includes(searchTerm) ||
        u.fullName.toLowerCase().includes(searchTerm) ||
        u.role.toLowerCase().includes(searchTerm)
    );
    displayUsers(filtered);
}

function showAddUser() {
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('userSearch').value = '';
    openModal('userModal');
}

async function editUser(id) {
    try {
        const user = allUsers.find(u => u._id === id);
        if (!user) return;

        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('userId').value = user._id;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userUsername').disabled = true;
        document.getElementById('userPassword').required = false;
        document.getElementById('userPassword').placeholder = 'Leave blank to keep current password';
        document.getElementById('userFullName').value = user.fullName;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userCreditLimit').value = user.creditLimit || 1000;
        
        toggleCustomerFields();
        openModal('userModal');
    } catch (error) {
        showToast('Error loading user profile. Please try again.', 'error');
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('userId').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    
    const userData = {
        username: document.getElementById('userUsername').value,
        fullName: document.getElementById('userFullName').value,
        role: role,
        creditLimit: parseFloat(document.getElementById('userCreditLimit').value) || 1000
    };

    if (password) {
        userData.password = password;
    }

    try {
        if (id) {
            await apiCall(`/users/${id}`, 'PUT', userData);
        } else {
            userData.password = password;
            await apiCall('/users', 'POST', userData);
        }
        
        closeModal('userModal');
        document.getElementById('userUsername').disabled = false;
        loadAdminUsers();
        showToast('User account saved successfully!', 'success');
    } catch (error) {
        showToast('Error saving user account. Please try again.', 'error');
    }
}

async function deactivateUser(id) {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
        await apiCall(`/users/${id}`, 'DELETE');
        loadAdminUsers();
        showToast('User account deactivated successfully!', 'success');
    } catch (error) {
        showToast('Error deactivating user. Please try again.', 'error');
    }
}

async function activateUser(id) {
    try {
        await apiCall(`/users/${id}`, 'PUT', { isActive: true });
        loadAdminUsers();
        showToast('User account activated successfully!', 'success');
    } catch (error) {
        showToast('Error activating user. Please try again.', 'error');
    }
}

async function deleteUserPermanent(id) {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
        await apiCall(`/users/${id}/permanent`, 'DELETE');
        loadAdminUsers();
        showToast('User account permanently deleted!', 'success');
    } catch (error) {
        showToast('Error deleting user. Please try again.', 'error');
    }
}

// REPORTS
async function loadReport(period) {
    try {
        const report = await apiCall(`/transactions/reports/sales?period=${period}`);
        const debts = await apiCall('/transactions/reports/debts');
        
        const reportContent = document.getElementById('reportContent');
        reportContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(report.totalSales)}</div>
                    <div class="stat-label">Total Sales</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${report.totalTransactions}</div>
                    <div class="stat-label">Transactions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(report.averageTransaction)}</div>
                    <div class="stat-label">Average Transaction</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(debts.totalDebt)}</div>
                    <div class="stat-label">Total Outstanding Debt</div>
                </div>
            </div>
            
            <h4>Top Products</h4>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity Sold</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.topProducts.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.quantity}</td>
                            <td>${formatCurrency(p.revenue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h4 style="margin-top: 30px;">Customers with Outstanding Debt</h4>
            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Outstanding Debt</th>
                        <th>Credit Limit</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${debts.customers && debts.customers.length > 0 ? debts.customers.map(c => {
                        const debt = Math.abs(c.balance);
                        const exceedsLimit = debt > (c.creditLimit || 0);
                        return `
                        <tr ${exceedsLimit ? 'style="background-color: #ffe8e8;"' : ''}>
                            <td>${c.fullName}</td>
                            <td style="color: #e74c3c; font-weight: 600;">₱${debt.toFixed(2)}</td>
                            <td>₱${(c.creditLimit || 0).toFixed(2)}</td>
                            <td>${exceedsLimit ? '<span style="color: #e74c3c; font-weight: 600;">⚠️ Exceeds Limit</span>' : '<span style="color: #27ae60;">Within Limit</span>'}</td>
                        </tr>
                    `}).join('') : '<tr><td colspan="4" class="empty-state">No customers with debt</td></tr>'}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Report error:', error);
        document.getElementById('reportContent').innerHTML = '<p class="empty-state">Error loading report</p>';
    }
}

// SALES HISTORY FUNCTIONS
async function loadSalesHistory(period = 'daily') {
    try {
        const now = new Date();
        let startDate;

        if (period === 'daily') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (period === 'weekly') {
            const day = now.getDay();
            const diff = now.getDate() - day;
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            // All time - set to very old date
            startDate = new Date('2020-01-01');
        }

        const endDate = new Date();

        // Fetch all transactions in the period
        const transactions = await apiCall(`/transactions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);

        // Flatten items from all transactions into a single array
        allSalesHistory = [];
        transactions.forEach(t => {
            if (t.items && t.items.length > 0) {
                t.items.forEach(item => {
                    allSalesHistory.push({
                        date: t.createdAt,
                        cashierName: t.cashierName,
                        productName: item.productName,
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: item.subtotal,
                        transactionNumber: t.transactionNumber
                    });
                });
            }
        });

        displaySalesHistory(allSalesHistory);
    } catch (error) {
        console.error('Sales history error:', error);
        document.getElementById('salesHistoryTableBody').innerHTML = 
            '<tr><td colspan="7" class="empty-state">Error loading sales history</td></tr>';
    }
}

function displaySalesHistory(items) {
    const tbody = document.getElementById('salesHistoryTableBody');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No sales records found</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td>${item.cashierName}</td>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>₱${item.subtotal.toFixed(2)}</td>
            <td>${item.transactionNumber}</td>
        </tr>
    `).join('');
}

function searchSalesHistory() {
    const searchInput = document.querySelector('#salesHistoryTab .search-box input').value.toLowerCase();
    
    if (!searchInput) {
        displaySalesHistory(allSalesHistory);
        return;
    }

    const filtered = allSalesHistory.filter(item =>
        item.productName.toLowerCase().includes(searchInput) ||
        item.cashierName.toLowerCase().includes(searchInput) ||
        item.transactionNumber.toLowerCase().includes(searchInput)
    );

    displaySalesHistory(filtered);
}

// CASHIER POS FUNCTIONS
async function loadProducts() {
    try {
        allProducts = await apiCall('/products');
    } catch (error) {
        console.error('Load products error:', error);
    }
}

async function loadCashierCustomers() {
    try {
        allUsers = await apiCall('/users/customers');
    } catch (error) {
        console.error('Load cashier customers error:', error);
    }
}

async function handleBarcodeInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const barcode = e.target.value.trim();
        
        if (!barcode) return;
        
        try {
            const product = await apiCall(`/products/barcode/${barcode}`);
            addToCart(product);
            e.target.value = '';
        } catch (error) {
            showToast('✕ Product not found. Please check the barcode and try again.', 'error');
            e.target.value = '';
        }
    }
}

function addToCart(product, quantity = 1) {
    const existingItem = cart.find(item => item.productId === product._id);
    
    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            showToast('Insufficient stock available. Only ' + product.stock + ' remaining.', 'warning');
            return;
        }
        existingItem.quantity += quantity;
    } else {
        if (quantity > product.stock) {
            showToast('Insufficient stock available. Only ' + product.stock + ' remaining.', 'warning');
            return;
        }
        cart.push({
            productId: product._id,
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            quantity: quantity,
            stock: product.stock
        });
    }
    
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-state">Cart is empty<br>Scan a product to begin</p>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatCurrency(item.price)} each</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-total">${formatCurrency(subtotal)}</div>
                <button class="qty-btn" style="background: #e74c3c;" onclick="removeFromCart(${index})">×</button>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = total.toFixed(2);
}

function updateQuantity(index, change) {
    const item = cart[index];
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > item.stock) {
        showToast('Insufficient stock available. Only ' + item.stock + ' remaining.', 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    updateCartDisplay();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('🗑️ Clear all items from your cart?')) {
        cart = [];
        updateCartDisplay();
        showToast('Cart cleared successfully!', 'success');
    }
}

// Refresh Cashier Screen - clears cart and reloads data for next customer
async function refreshCashierScreen() {
    try {
        // Clear cart
        cart = [];
        updateCartDisplay();
        
        // Clear barcode input and focus it
        const barcodeInput = document.getElementById('barcodeInput');
        barcodeInput.value = '';
        barcodeInput.focus();
        
        // Reload products and customers
        await loadProducts();
        await loadCashierCustomers();
        
        // Clear search results
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('quickSearch').value = '';
        
        showToast('Cashier screen refreshed for next customer', 'info', 2000);
    } catch (error) {
        showToast('Error refreshing screen. Please try again.', 'error');
    }
}

// Quick Search
let searchTimeout;
async function handleQuickSearch(e) {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const results = await apiCall(`/products/search?q=${encodeURIComponent(query)}`);
            displaySearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
        container.innerHTML = '<p class="empty-state">No products found</p>';
        return;
    }
    
    container.innerHTML = results.map(p => `
        <div class="search-result-item" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "\\'")})''>
            <div style="font-weight: 600;">${p.name}</div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                <span style="color: #7f8c8d;">Stock: ${p.stock}</span>
                <span style="color: #27ae60; font-weight: 600;">${formatCurrency(p.price)}</span>
            </div>
        </div>
    `).join('');
}

// Checkout
function showCheckoutModal() {
    if (cart.length === 0) {
        showToast('⚠ Your cart is empty. Please add items before checkout.', 'warning');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('checkoutTotal').textContent = total.toFixed(2);
    document.getElementById('amountPaid').value = '';
    document.getElementById('changeAmount').textContent = '0.00';
    document.getElementById('changeRow').style.display = 'none';
    document.getElementById('customerDebtInfo').style.display = 'none';
    document.getElementById('paymentMethod').value = 'CASH';
    document.getElementById('amountPaidGroup').style.display = 'block';
    
    loadCustomers();
    openModal('checkoutModal');
    setTimeout(() => document.getElementById('amountPaid').focus(), 100);
}

function calculateChange() {
    const total = parseFloat(document.getElementById('checkoutTotal').textContent);
    const paid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const change = paid - total;
    
    if (change >= 0) {
        document.getElementById('changeAmount').textContent = change.toFixed(2);
        document.getElementById('changeRow').style.display = 'flex';
    } else {
        document.getElementById('changeRow').style.display = 'none';
    }
}

async function handleCheckout(e) {
    e.preventDefault();
    
    const total = parseFloat(document.getElementById('checkoutTotal').textContent);
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const customerId = document.getElementById('checkoutCustomer').value;
    
    if (paymentMethod === 'CASH' && amountPaid < total) {
        showToast('Amount paid is less than total. Please adjust the payment amount.', 'warning');
        return;
    }
    
    if ((paymentMethod === 'DEBT' || paymentMethod === 'PARTIAL') && !customerId) {
        showToast('Please select a customer for debt transactions.', 'warning');
        return;
    }
    
    const transactionData = {
        items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        })),
        amountPaid,
        paymentMethod,
        customerId: customerId || undefined
    };
    
    try {
        const transaction = await apiCall('/transactions', 'POST', transactionData);
        
        let message = `Transaction completed!\nTransaction #: ${transaction.transactionNumber}`;
        
        if (paymentMethod === 'CASH') {
            message += `\nChange: ${formatCurrency(transaction.change)}`;
        } else if (paymentMethod === 'DEBT') {
            message += `\nAmount added to debt: ${formatCurrency(total)}`;
        } else if (paymentMethod === 'PARTIAL') {
            const debtAmount = total - amountPaid;
            message += `\nCash Paid: ${formatCurrency(amountPaid)}\nAdded to debt: ${formatCurrency(debtAmount)}`;
        }
        
        showToast('Transaction completed! ' + message.replace(/\n/g, ' | '), 'success', 5000);
        
        cart = [];
        updateCartDisplay();
        closeModal('checkoutModal');
        
        // Reload products to get updated stock (non-blocking)
        // Don't await - if it fails, don't disrupt the successful purchase
        loadProducts().catch(err => {
            console.warn('Failed to refresh products list after checkout:', err);
        });
    } catch (error) {
        const errorMsg = error.message || String(error);
        
        console.error('=== CHECKOUT ERROR ===');
        console.error('Error message:', errorMsg);
        console.error('Full error:', error);
        console.error('Cart items:', cart.map(i => ({ name: i.name, quantity: i.quantity })));
        console.error('Transaction data would have been:', {
            items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
            amountPaid: parseFloat(document.getElementById('amountPaid').value) || 0,
            paymentMethod: document.getElementById('paymentMethod').value,
            customerId: document.getElementById('checkoutCustomer').value,
        });
        console.error('===================');
        
        // Handle authorization errors
        if (errorMsg.includes('UNAUTHORIZED')) {
            localStorage.removeItem('token');
            currentUser = null;
            setTimeout(() => {
                showErrorMessage('Session expired. Please log in again.', 'error', 4000);
                setTimeout(() => {
                    showPage('loginPage');
                }, 500);
            }, 100);
        } else if (errorMsg.includes('Credit limit')) {
            // Show credit limit errors with actual message
            showErrorMessage(`❌ ${errorMsg}`, 'warning', 6000);
        } else if (errorMsg.includes('Insufficient stock')) {
            // Show stock errors
            showErrorMessage(`⚠️ ${errorMsg}`, 'warning', 5000);
        } else if (errorMsg.includes('required for') || errorMsg.includes('not found')) {
            // Show not found errors
            showErrorMessage(`❌ ${errorMsg}`, 'error', 5000);
        } else {
            // Show the actual error message without sanitization for DEBT issues
            showErrorMessage(`❌ ${errorMsg}`, 'error', 5000);
        }
    }
}

// CUSTOMER FUNCTIONS
async function loadCustomerData() {
    try {
        // Update debt information
        // Fetch fresh customer + their transactions using dedicated endpoint
        const data = await apiCall(`/transactions/customer/${currentUser._id}/history`);

        const user = data.customer;
        const transactions = data.transactions || [];

        const debt = Math.abs(user.balance);
        let balanceDisplay = 'No debt';
        if (user.balance < 0) {
            balanceDisplay = `₱${debt.toFixed(2)} owed`;
        }
        document.getElementById('customerBalance').textContent = balanceDisplay;

        const customerHistory = document.getElementById('customerHistory');
        if (transactions.length === 0) {
            customerHistory.innerHTML = '<p class="empty-state">No purchase history</p>';
            return;
        }

        customerHistory.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Transaction #</th>
                        <th>Products</th>
                        <th>Total</th>
                        <th>Payment</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.slice(0, 20).map(t => `
                        <tr>
                            <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                            <td>${t.transactionNumber}</td>
                            <td>${t.items ? t.items.map(item => `${item.productName} (x${item.quantity})`).join(', ') : 'N/A'}</td>
                            <td>₱${(t.totalAmount || 0).toFixed(2)}</td>
                            <td>${t.paymentMethod === 'DEBT_PAYMENT' ? 'DEBT PAYMENT' : t.paymentMethod}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Customer data error:', error);
    }
}

// Simple toast notifications
function showToast(message, type = 'info', timeout = 3500) {
    // Sanitize message to remove technical details
    const cleanMessage = sanitizeErrorMessage(message);
    
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '12px';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    
    // Set gradient backgrounds based on type
    let gradient = '';
    if (type === 'error') {
        gradient = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    } else if (type === 'success') {
        gradient = 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)';
    } else if (type === 'warning') {
        gradient = 'linear-gradient(135deg, #f39c12 0%, #d68910 100%)';
        timeout = Math.max(timeout, 5000); // Longer timeout for warnings
    } else {
        gradient = 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)';
    }
    
    el.style.background = gradient;
    el.style.color = '#fff';
    el.style.padding = '16px 24px';
    el.style.marginTop = '8px';
    el.style.borderRadius = '12px';
    el.style.boxShadow = '0 10px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)';
    el.style.maxWidth = '420px';
    el.style.wordWrap = 'break-word';
    el.style.fontSize = '15px';
    el.style.fontWeight = '500';
    el.style.lineHeight = '1.4';
    el.style.backdropFilter = 'blur(8px)';
    el.style.border = '1px solid rgba(255,255,255,0.2)';
    el.style.pointerEvents = 'auto';
    el.style.animation = 'slideInUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.letterSpacing = '0.3px';
    el.textContent = cleanMessage;

    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, timeout);
}

// MODAL FUNCTIONS
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// TOGGLE CUSTOMER FIELDS
function toggleCustomerFields() {
    const role = document.getElementById('userRole').value;
    const creditLimitGroup = document.getElementById('creditLimitGroup');
    
    if (role === 'CUSTOMER') {
        creditLimitGroup.style.display = 'block';
    } else {
        creditLimitGroup.style.display = 'none';
    }
}

// DEBT MANAGEMENT
async function loadDebts() {
    try {
        const data = await apiCall('/transactions/reports/debts');
        
        document.getElementById('totalDebtAmount').textContent = formatCurrency(data.totalDebt);
        document.getElementById('totalDebtors').textContent = data.count;
        
        const tbody = document.getElementById('debtsTableBody');
        
        if (!data.customers || data.customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No customers with debt</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.customers.map(c => {
            const debt = Math.abs(c.balance);
            const exceedsLimit = debt > (c.creditLimit || 0);
            return `
            <tr ${exceedsLimit ? 'style="background-color: #ffe8e8;"' : ''}>
                <td>${c.fullName}</td>
                <td style="color: #e74c3c; font-weight: 600;">₱${debt.toFixed(2)} ${exceedsLimit ? '⚠️' : ''}</td>
                <td>₱${(c.creditLimit || 0).toFixed(2)}</td>
                <td>
                    <button onclick="showPayDebtModal('${c._id}')" class="btn btn-sm btn-success">💰 Pay</button>
                    <button onclick="viewCustomerHistory('${c._id}')" class="btn btn-sm">📋 History</button>
                </td>
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Load debts error:', error);
        document.getElementById('debtsTableBody').innerHTML = '<tr><td colspan="4" class="empty-state">Error loading debts</td></tr>';
    }
}

async function showPayDebtModal(customerId) {
    try {
        // Hide or show customer selector based on whether customerId is provided
        const selectGroup = document.getElementById('payDebtCustomerSelectGroup');
        
        if (customerId) {
            // Called from Admin's Debts tab with a specific customer
            selectGroup.style.display = 'none';
            const customer = await apiCall(`/users/${customerId}`);
            
            document.getElementById('payDebtCustomerId').value = customer._id;
            document.getElementById('payDebtCustomerInfo').innerHTML = `
                <div><strong>Customer:</strong> ${customer.fullName}</div>
                <div style="color: #e74c3c; font-weight: 600; font-size: 18px; margin-top: 10px;">
                    Current Debt: ₱${Math.abs(customer.balance).toFixed(2)}
                </div>
            `;
            document.getElementById('payDebtAmount').value = '';
            document.getElementById('payDebtAmount').max = Math.abs(customer.balance);
            document.getElementById('remainingDebt').textContent = Math.abs(customer.balance).toFixed(2);
        } else {
            // Called from Cashier without customer - show customer selector
            selectGroup.style.display = 'block';
            document.getElementById('payDebtCustomerId').value = '';
            document.getElementById('payDebtCustomerInfo').innerHTML = '';
            document.getElementById('payDebtAmount').value = '';
            document.getElementById('remainingDebt').textContent = '0.00';
            
            // Load customers with debt
            const customers = await apiCall('/users/customers');
            const customersWithDebt = customers.filter(c => c.balance < 0);
            
            const select = document.getElementById('payDebtCustomer');
            select.innerHTML = '<option value="">Select customer</option>';
            
            customersWithDebt.forEach(c => {
                const option = document.createElement('option');
                option.value = c._id;
                const debt = Math.abs(c.balance);
                option.textContent = `${c.fullName} (Owes: ₱${debt.toFixed(2)})`;
                option.dataset.balance = c.balance;
                select.appendChild(option);
            });
        }
        
        openModal('payDebtModal');
    } catch (error) {
        showToast('Could not load customer details. Please try again.', 'error');
    }
}

function updatePayDebtCustomerInfo() {
    const select = document.getElementById('payDebtCustomer');
    const customerId = select.value;
    
    if (!customerId) {
        document.getElementById('payDebtCustomerId').value = '';
        document.getElementById('payDebtCustomerInfo').innerHTML = '';
        document.getElementById('payDebtAmount').value = '';
        document.getElementById('remainingDebt').textContent = '0.00';
        return;
    }
    
    const option = select.options[select.selectedIndex];
    const debt = Math.abs(parseFloat(option.dataset.balance) || 0);
    
    document.getElementById('payDebtCustomerId').value = customerId;
    document.getElementById('payDebtCustomerInfo').innerHTML = `
        <div><strong>Customer:</strong> ${option.textContent.split(' (')[0]}</div>
        <div style="color: #e74c3c; font-weight: 600; font-size: 18px; margin-top: 10px;">
            Current Debt: ₱${debt.toFixed(2)}
        </div>
    `;
    document.getElementById('payDebtAmount').value = '';
    document.getElementById('payDebtAmount').max = debt;
    document.getElementById('remainingDebt').textContent = debt.toFixed(2);
}

async function showAddDebtModal() {
    try {
        const customers = await apiCall('/users/customers');

        const select = document.getElementById('addDebtCustomer');
        select.innerHTML = '<option value="">Select customer</option>';

        customers.forEach(c => {
            const option = document.createElement('option');
            option.value = c._id;
            option.textContent = `${c.fullName} (Debt: ${formatCurrency(Math.abs(c.balance < 0 ? c.balance : 0))})`;
            option.dataset.balance = c.balance;
            option.dataset.creditLimit = c.creditLimit;
            select.appendChild(option);
        });

        document.getElementById('addDebtAmount').value = '';
        document.getElementById('addDebtNote').value = '';
        document.getElementById('addDebtCustomerInfo').innerHTML = '';

        // show modal
        openModal('addDebtModal');
    } catch (error) {
        showToast('Error loading customers. Please try again.', 'error');
    }
}

function updateAddDebtCustomerInfo() {
    const select = document.getElementById('addDebtCustomer');
    const id = select.value;
    if (!id) {
        document.getElementById('addDebtCustomerInfo').innerHTML = '';
        return;
    }
    const option = select.options[select.selectedIndex];
    const balance = parseFloat(option.dataset.balance) || 0;
    const creditLimit = parseFloat(option.dataset.creditLimit) || 0;

    document.getElementById('addDebtCustomerInfo').innerHTML = `
        <div><strong>Customer:</strong> ${option.textContent.split(' (')[0]}</div>
        <div style="color: #e74c3c; font-weight: 600; margin-top:8px;">Current Debt: ${formatCurrency(Math.abs(balance))}</div>
        <div>Credit Limit: ${formatCurrency(creditLimit)}</div>
    `;
}

async function handleAddDebtSubmit(e) {
    e.preventDefault();

    const customerId = document.getElementById('addDebtCustomer').value;
    const amount = parseFloat(document.getElementById('addDebtAmount').value);
    const note = document.getElementById('addDebtNote').value;

    if (!customerId) return showToast('Please select a customer', 'warning');
    if (isNaN(amount) || amount <= 0) return showToast('Please enter a valid amount', 'warning');

    try {
        console.log('Adding debt:', { customerId, amount, note });
        const result = await apiCall('/transactions/adjust-balance', 'POST', { customerId, amount, note });
        console.log('Debt transaction created:', result);

        // Fetch updated customer to get fresh data
        const updatedCustomer = await apiCall(`/users/${customerId}`);
        console.log('Updated customer:', updatedCustomer);
        
        const newDebt = Math.abs(updatedCustomer.balance);
        const creditLimit = updatedCustomer.creditLimit || 1000;
        const limitExceeded = newDebt > creditLimit;

        let message = `Debt record added!\nAmount: ₱${amount.toFixed(2)}\nCustomer Total Debt: ₱${newDebt.toFixed(2)}\nCustomer: ${updatedCustomer.fullName}`;
        
        if (limitExceeded) {
            message += `\n\nWARNING: Credit limit exceeded!\nCredit Limit: ₱${creditLimit.toFixed(2)}\nExceeds by: ₱${(newDebt - creditLimit).toFixed(2)}`;
        }

        showToast(message, limitExceeded ? 'warning' : 'success', limitExceeded ? 6000 : 4000);
        closeModal('addDebtModal');
        
        // Refresh both tabs - use Promise to ensure both complete
        console.log('Refreshing debts and users...');
        Promise.all([
            loadDebts().catch(err => console.error('Error loading debts:', err)),
            (currentUser && currentUser.role === 'ADMIN' ? loadAdminUsers() : Promise.resolve())
                .catch(err => console.error('Error loading users:', err))
        ]);
    } catch (error) {
        console.error('Add debt error:', error);
        const errorMsg = error.message || error;
        // Check if it's a credit limit error from API
        if (errorMsg.includes('Credit limit exceeded')) {
            showToast(sanitizeErrorMessage(errorMsg), 'warning');
        } else {
            showToast('Failed to add debt record. Please try again.', 'error');
        }
    }
}

async function handlePayDebtSubmit(e) {
    e.preventDefault();
    
    const customerId = document.getElementById('payDebtCustomerId').value;
    const amount = parseFloat(document.getElementById('payDebtAmount').value);
    
    if (!customerId) {
        showToast('⚠ Please select a customer', 'warning');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast('⚠ Please enter a valid payment amount', 'warning');
        return;
    }
    
    try {
        console.log('Recording debt payment:', { customerId, amount });
        const result = await apiCall('/transactions/pay-debt', 'POST', { customerId, amount });
        
        // Fetch updated customer info
        const updatedCustomer = await apiCall(`/users/${customerId}`);
        const remainingDebt = Math.abs(updatedCustomer.balance);
        
        let message = `✅ Payment Recorded!\\nAmount Paid: ₱${amount.toFixed(2)}\\nCustomer: ${updatedCustomer.fullName}`;
        if (remainingDebt > 0) {
            message += `\\nRemaining Debt: ₱${remainingDebt.toFixed(2)}`;
        } else {
            message += `\\n✅ Debt Fully Paid!`;
        }
        
        showToast(message, 'success');
        
        closeModal('payDebtModal');
        
        // Refresh data for both admin and cashier
        try {
            await loadDebts();
            console.log('Debts loaded');
        } catch(e) {
            console.error('Error loading debts:', e);
        }
        
        try {
            // Only refresh user list if current user is admin
            if (currentUser && currentUser.role === 'ADMIN') {
                await loadAdminUsers();
                console.log('Users loaded');
            }
        } catch(e) {
            console.error('Error loading users:', e);
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast('✕ Payment failed. Please try again.', 'error');
    }
}

// RESTOCK FUNCTIONS
async function showRestockModal(productId) {
    try {
        const product = allProducts.find(p => p._id === productId);
        if (!product) return;
        
        document.getElementById('restockProductId').value = product._id;
        document.getElementById('restockProductInfo').innerHTML = `
            <div><strong>Product:</strong> ${product.name}</div>
            <div><strong>Current Stock:</strong> ${product.stock}</div>
            <div><strong>Barcode:</strong> ${product.barcode}</div>
        `;
        
        document.getElementById('restockForm').reset();
        document.getElementById('restockProductId').value = product._id;
        document.getElementById('restockTotalCost').textContent = '0.00';
        
        openModal('restockModal');
    } catch (error) {
        showToast('Error loading restock form. Please try again.', 'error');
    }
}

function calculateRestockCost() {
    const quantity = parseFloat(document.getElementById('restockQuantity').value) || 0;
    const cost = parseFloat(document.getElementById('restockCost').value) || 0;
    const total = quantity * cost;
    document.getElementById('restockTotalCost').textContent = total.toFixed(2);
}

async function handleRestockSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('restockProductId').value;
    const restockData = {
        quantity: parseInt(document.getElementById('restockQuantity').value),
        costPerUnit: parseFloat(document.getElementById('restockCost').value),
        supplier: document.getElementById('restockSupplier').value,
        notes: document.getElementById('restockNotes').value
    };
    
    try {
        const result = await apiCall(`/products/${productId}/restock`, 'POST', restockData);
        
        showToast('Product restocked successfully! New stock: ' + result.newStock + ' units', 'success');
        
        closeModal('restockModal');
        loadAdminProducts();
    } catch (error) {
        showToast('Restock failed. Please try again.', 'error');
    }
}

// HISTORY FUNCTIONS
async function showPurchaseHistory(productId) {
    try {
        const data = await apiCall(`/products/${productId}/purchase-history`);
        
        document.getElementById('historyModalTitle').textContent = `Purchase History - ${data.product.name}`;
        
        if (data.purchaseHistory.length === 0) {
            document.getElementById('historyContent').innerHTML = '<p class="empty-state">No purchase history</p>';
        } else {
            document.getElementById('historyContent').innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                            <th>Cashier</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.purchaseHistory.map(h => `
                            <tr>
                                <td>${new Date(h.date).toLocaleDateString()}</td>
                                <td>${h.customerName}</td>
                                <td>${h.quantity}</td>
                                <td>${formatCurrency(h.price)}</td>
                                <td>${formatCurrency(h.subtotal)}</td>
                                <td>${h.cashierName}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        openModal('historyModal');
    } catch (error) {
        showToast('Error loading purchase history. Please try again.', 'error');
    }
}

async function showRestockHistory(productId) {
    try {
        const data = await apiCall(`/products/${productId}/restock-history`);
        
        document.getElementById('historyModalTitle').textContent = `Restock History - ${data.product.name}`;
        
        if (data.restockHistory.length === 0) {
            document.getElementById('historyContent').innerHTML = '<p class="empty-state">No restock history</p>';
        } else {
            const totalSpent = data.restockHistory.reduce((sum, r) => sum + r.totalCost, 0);
            const totalQuantity = data.restockHistory.reduce((sum, r) => sum + r.quantity, 0);
            
            document.getElementById('historyContent').innerHTML = `
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                    <div><strong>Current Stock:</strong> ${data.product.currentStock}</div>
                    <div><strong>Total Restocked:</strong> ${totalQuantity} units</div>
                    <div><strong>Total Spent:</strong> ${formatCurrency(totalSpent)}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Quantity</th>
                            <th>Cost/Unit</th>
                            <th>Total Cost</th>
                            <th>Supplier</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.restockHistory.map(h => `
                            <tr>
                                <td>${new Date(h.restockDate).toLocaleDateString()}</td>
                                <td>${h.quantity}</td>
                                <td>${formatCurrency(h.costPerUnit)}</td>
                                <td>${formatCurrency(h.totalCost)}</td>
                                <td>${h.supplier}</td>
                                <td>${h.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        openModal('historyModal');
    } catch (error) {
        showToast('Error loading restock history. Please try again.', 'error');
    }
}

async function viewCustomerHistory(customerId) {
    try {
        const data = await apiCall(`/transactions/customer/${customerId}/history`);
        
        document.getElementById('historyModalTitle').textContent = `Purchase History - ${data.customer.name}`;
        
        if (data.transactions.length === 0) {
            document.getElementById('historyContent').innerHTML = '<p class="empty-state">No purchase history</p>';
        } else {
            const totalSpent = data.transactions.reduce((sum, t) => sum + t.totalAmount, 0);
            const currentDebt = Math.abs(data.customer.balance);
            
            document.getElementById('historyContent').innerHTML = `
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                    <div><strong>Current Debt:</strong> ${data.customer.balance < 0 ? 
                        `<span style="color: #e74c3c;">₱${currentDebt.toFixed(2)}</span>` : 
                        '<span style="color: #27ae60;">No debt</span>'}</div>
                    <div><strong>Credit Limit:</strong> ₱${(data.customer.creditLimit || 0).toFixed(2)}</div>
                    <div><strong>Total Spent:</strong> ₱${totalSpent.toFixed(2)}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Transaction #</th>
                            <th>Products</th>
                            <th>Total</th>
                            <th>Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.transactions.map(t => `
                            <tr>
                                <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                                <td>${t.transactionNumber}</td>
                                <td>${t.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}</td>
                                <td>₱${t.totalAmount.toFixed(2)}</td>
                                <td>${t.paymentMethod === 'DEBT_PAYMENT' ? 'DEBT PAYMENT' : t.paymentMethod}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        openModal('historyModal');
    } catch (error) {
        showToast('Error loading customer history. Please try again.', 'error');
    }
}

// CHECKOUT ENHANCEMENTS
async function loadCustomers() {
    try {
        const customers = await apiCall('/users/customers');
        
        const select = document.getElementById('checkoutCustomer');
        select.innerHTML = '<option value="">Walk-in Customer</option>';
        
        customers.forEach(c => {
            const option = document.createElement('option');
            option.value = c._id;
            option.textContent = `${c.fullName} (Debt: ${formatCurrency(Math.abs(c.balance < 0 ? c.balance : 0))})`;
            option.dataset.balance = c.balance;
            option.dataset.creditLimit = c.creditLimit;
            select.appendChild(option);
        });
    } catch (error) {
        const errorMsg = error.message || String(error);
        
        // Handle auth errors
        if (errorMsg.includes('UNAUTHORIZED')) {
            localStorage.removeItem('token');
            currentUser = null;
            showToast('Session expired. Please log in again.', 'error');
            setTimeout(() => showPage('loginPage'), 1000);
        } else {
            console.error('Load customers error:', error);
            showToast('Error loading customers. Please try again.', 'error');
        }
    }
}

function handlePaymentMethodChange() {
    const method = document.getElementById('paymentMethod').value;
    const amountPaidGroup = document.getElementById('amountPaidGroup');
    const amountInput = document.getElementById('amountPaid');
    
    if (method === 'DEBT') {
        amountPaidGroup.style.display = 'none';
        amountInput.required = false;
        amountInput.value = 0;
    } else {
        amountPaidGroup.style.display = 'block';
        amountInput.required = true;
    }
    
    updateCustomerDebtInfo();
}

function updateCustomerDebtInfo() {
    const customerId = document.getElementById('checkoutCustomer').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const debtInfo = document.getElementById('customerDebtInfo');
    
    if (!customerId || paymentMethod === 'CASH') {
        debtInfo.style.display = 'none';
        return;
    }
    
    const select = document.getElementById('checkoutCustomer');
    const selectedOption = select.options[select.selectedIndex];
    const currentBalance = parseFloat(selectedOption.dataset.balance) || 0;
    const creditLimit = parseFloat(selectedOption.dataset.creditLimit) || 1000;
    const total = parseFloat(document.getElementById('checkoutTotal').textContent);
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    
    let newDebt = 0;
    if (paymentMethod === 'DEBT') {
        newDebt = Math.abs(currentBalance - total);
    } else if (paymentMethod === 'PARTIAL') {
        const remaining = total - amountPaid;
        newDebt = Math.abs(currentBalance - remaining);
    }
    
    document.getElementById('customerCurrentBalance').textContent = Math.abs(currentBalance).toFixed(2);
    document.getElementById('customerCreditLimit').textContent = creditLimit.toFixed(2);
    document.getElementById('customerNewDebt').textContent = newDebt.toFixed(2);
    
    debtInfo.style.display = 'block';
}
