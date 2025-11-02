// Navigation Functions

function navigateTo(page) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const selectedPage = document.getElementById(page + '-page');
    if (selectedPage) {
        selectedPage.classList.add('active');
        
        // Load page-specific data
        switch(page) {
            case 'explore':
                loadExplore();
                break;
            case 'dashboard':
                if (!currentUser) {
                    showError('Você precisa estar logado para acessar o dashboard');
                    navigateTo('login');
                    return;
                }
                loadDashboard();
                break;
            case 'publish-bot':
                if (!currentUser) {
                    showError('Você precisa estar logado para publicar um bot');
                    navigateTo('login');
                    return;
                }
                break;
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

// Set default page on load
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('home');
});
