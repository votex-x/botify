// Main App Functions

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Botify App initialized');
    
    // Set up event listeners
    setupEventListeners();
    
    // Navigate to home page
    navigateTo('home');
});

function setupEventListeners() {
    // Add any global event listeners here
    
    // Handle navigation clicks
    document.querySelectorAll('a[onclick*="navigateTo"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
}

// Utility Functions

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatCurrency(amount) {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError('Ocorreu um erro inesperado');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('Ocorreu um erro inesperado');
});

// Add CSS for loader and notifications dynamically
const style = document.createElement('style');
style.textContent = `
    .loader {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    
    .loader-content {
        background: white;
        padding: 30px;
        border-radius: 8px;
        text-align: center;
    }
    
    .loader-content p {
        margin: 0;
        font-weight: bold;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 300px;
    }
    
    .notification.show {
        opacity: 1;
    }
    
    .notification-error {
        background: #e74c3c;
    }
    
    .notification-success {
        background: #27ae60;
    }
`;
document.head.appendChild(style);
