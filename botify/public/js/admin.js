// Admin Functions

// Check if user is admin
async function checkAdminAccess() {
    if (!currentUser) {
        window.location.href = '/';
        return false;
    }

    try {
        const userData = await getUserData();
        if (userData?.role !== 'admin') {
            showError('Acesso negado. Você não é um administrador.');
            window.location.href = '/';
            return false;
        }
        return true;
    } catch (error) {
        showError('Erro ao verificar permissões');
        return false;
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminAccess();
    if (isAdmin) {
        loadAdminDashboard();
    }
});

// Grant Bites Form
document.getElementById('grantBitesForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('userEmail').value;
    const amount = parseInt(document.getElementById('bitesAmount').value);
    const reason = document.getElementById('bitesReason').value;

    try {
        showLoading('Concedendo Bites...');

        // Find user by email
        const usersRef = database.ref('users');
        const snapshot = await usersRef.orderByChild('email').equalTo(email).get();

        if (!snapshot.exists()) {
            showError('Usuário não encontrado');
            hideLoading();
            return;
        }

        let userId = null;
        snapshot.forEach((childSnapshot) => {
            userId = childSnapshot.key;
        });

        if (!userId) {
            showError('Usuário não encontrado');
            hideLoading();
            return;
        }

        // Grant bites
        const success = await grantBites(userId, amount, reason);

        if (success) {
            showSuccess(`${amount} Bites concedidos com sucesso para ${email}`);
            document.getElementById('grantBitesForm').reset();
        } else {
            showError('Erro ao conceder Bites');
        }
    } catch (error) {
        showError('Erro: ' + error.message);
    } finally {
        hideLoading();
    }
});

// Load admin dashboard
async function loadAdminDashboard() {
    try {
        showLoading('Carregando dashboard...');

        // Load statistics
        await loadStatistics();

        // Load users
        await loadUsers();

        // Load official bots
        await loadOfficialBots();

    } catch (error) {
        showError('Erro ao carregar dashboard: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const usersSnapshot = await database.ref('users').get();
        const botsSnapshot = await database.ref('bots').get();
        const transactionsSnapshot = await database.ref('transactions').get();

        const totalUsers = usersSnapshot.val() ? Object.keys(usersSnapshot.val()).length : 0;
        const totalBots = botsSnapshot.val() ? Object.keys(botsSnapshot.val()).length : 0;
        const totalTransactions = transactionsSnapshot.val() ? Object.keys(transactionsSnapshot.val()).length : 0;

        // Calculate total bites in circulation
        let totalBites = 0;
        if (usersSnapshot.val()) {
            Object.values(usersSnapshot.val()).forEach(user => {
                totalBites += user.bites || 0;
            });
        }

        const statsContainer = document.getElementById('statsContainer');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h4>Total de Usuários</h4>
                <p class="stat-value">${totalUsers}</p>
            </div>
            <div class="stat-card">
                <h4>Total de Bots</h4>
                <p class="stat-value">${totalBots}</p>
            </div>
            <div class="stat-card">
                <h4>Transações</h4>
                <p class="stat-value">${totalTransactions}</p>
            </div>
            <div class="stat-card">
                <h4>Bites em Circulação</h4>
                <p class="stat-value">${totalBites}</p>
            </div>
        `;

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const snapshot = await database.ref('users').get();
        const usersList = document.getElementById('usersList');

        if (!snapshot.val()) {
            usersList.innerHTML = '<p class="no-users">Nenhum usuário encontrado</p>';
            return;
        }

        const users = Object.entries(snapshot.val()).map(([id, user]) => ({
            id,
            ...user
        }));

        displayUsers(users);
        setupUserSearch(users);

    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';

        const createdDate = new Date(user.createdAt).toLocaleDateString('pt-BR');

        userCard.innerHTML = `
            <div class="user-info">
                <h4>${user.email}</h4>
                <p>ID: ${user.id}</p>
                <p>Bites: ${user.bites || 0}</p>
                <p>Bots: ${Object.keys(user.bots || {}).length}</p>
                <p>Criado em: ${createdDate}</p>
            </div>
            <div class="user-actions">
                <button class="btn btn-small" onclick="grantBitesUI('${user.id}', '${user.email}')">Conceder Bites</button>
                <button class="btn btn-small" onclick="viewUserDetails('${user.id}')">Detalhes</button>
            </div>
        `;

        usersList.appendChild(userCard);
    });
}

function setupUserSearch(users) {
    const searchInput = document.getElementById('searchUser');
    searchInput?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = users.filter(user =>
            user.email.toLowerCase().includes(searchTerm)
        );
        displayUsers(filtered);
    });
}

function grantBitesUI(userId, email) {
    const amount = prompt(`Quantos Bites deseja conceder para ${email}?`);
    if (amount && !isNaN(amount)) {
        const reason = prompt('Motivo da concessão:');
        if (reason) {
            grantBitesDirectly(userId, parseInt(amount), reason);
        }
    }
}

async function grantBitesDirectly(userId, amount, reason) {
    try {
        showLoading('Concedendo Bites...');
        const success = await grantBites(userId, amount, reason);

        if (success) {
            showSuccess(`${amount} Bites concedidos com sucesso`);
            await loadUsers();
        } else {
            showError('Erro ao conceder Bites');
        }
    } catch (error) {
        showError('Erro: ' + error.message);
    } finally {
        hideLoading();
    }
}

function viewUserDetails(userId) {
    showError('Funcionalidade em desenvolvimento');
}

// Load official bots
async function loadOfficialBots() {
    try {
        const snapshot = await database.ref('bots').orderByChild('official').equalTo(true).get();
        console.log('Official bots loaded');
    } catch (error) {
        console.error('Error loading official bots:', error);
    }
}

// Add official bot form
document.getElementById('addOfficialBotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('officialBotTitle').value;
    const description = document.getElementById('officialBotDescription').value;
    const platform = document.getElementById('officialBotPlatform').value;
    const file = document.getElementById('officialBotFile').files[0];

    if (!file) {
        showError('Selecione um arquivo ZIP');
        return;
    }

    try {
        showLoading('Adicionando bot oficial...');

        // Upload file
        const fileName = `official/${Date.now()}-${file.name}`;
        const fileUrl = await uploadFile(file, fileName);

        if (!fileUrl) {
            showError('Erro ao fazer upload do arquivo');
            hideLoading();
            return;
        }

        // Create official bot
        const botId = database.ref('bots').push().key;
        const botData = {
            id: botId,
            title: title,
            description: description,
            platform: platform,
            fileUrl: fileUrl,
            userId: 'bite-official',
            official: true,
            createdAt: new Date().toISOString(),
            downloads: 0,
            rating: 5,
            price: 0
        };

        await database.ref('bots/' + botId).set(botData);

        showSuccess('Bot oficial adicionado com sucesso!');
        document.getElementById('addOfficialBotForm').reset();

    } catch (error) {
        showError('Erro ao adicionar bot: ' + error.message);
    } finally {
        hideLoading();
    }
});

// Logout
async function logout() {
    try {
        await auth.signOut();
        window.location.href = '/';
    } catch (error) {
        showError('Erro ao fazer logout: ' + error.message);
    }
}
