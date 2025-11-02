// Authentication Functions

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        showLoading('Fazendo login...');
        await auth.signInWithEmailAndPassword(email, password);
        showSuccess('Login realizado com sucesso!');
        navigateTo('home');
    } catch (error) {
        showError('Erro ao fazer login: ' + error.message);
    } finally {
        hideLoading();
    }
});

// Signup
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showError('As senhas não coincidem');
        return;
    }
    
    if (password.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    try {
        showLoading('Criando conta...');
        await auth.createUserWithEmailAndPassword(email, password);
        showSuccess('Conta criada com sucesso!');
        navigateTo('home');
    } catch (error) {
        showError('Erro ao criar conta: ' + error.message);
    } finally {
        hideLoading();
    }
});

// Logout
async function logout() {
    try {
        showLoading('Fazendo logout...');
        await auth.signOut();
        showSuccess('Logout realizado com sucesso!');
        navigateTo('home');
    } catch (error) {
        showError('Erro ao fazer logout: ' + error.message);
    } finally {
        hideLoading();
    }
}

// UI Helper Functions
function showLoading(message) {
    let loader = document.getElementById('loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'loader';
        document.body.appendChild(loader);
    }
    loader.innerHTML = `<div class="loader-content"><p>${message}</p></div>`;
    loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
