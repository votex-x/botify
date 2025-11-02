// Dashboard Functions

async function loadDashboard() {
    try {
        showLoading('Carregando dashboard...');
        
        const userData = await getUserData();
        if (!userData) {
            showError('Erro ao carregar dados do usuário');
            return;
        }
        
        // Update user info
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('biteBalance').textContent = userData.bites || 0;
        
        // Load user's bots
        await loadUserBots(userData);
        
        // Load monetization status
        await loadMonetizationStatus(userData);
        
        // Load transactions
        await loadTransactions();
        
    } catch (error) {
        showError('Erro ao carregar dashboard: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadUserBots(userData) {
    try {
        const myBotsList = document.getElementById('myBotsList');
        myBotsList.innerHTML = '';
        
        const userBots = userData.bots || {};
        
        if (Object.keys(userBots).length === 0) {
            myBotsList.innerHTML = '<p class="no-bots">Você ainda não publicou nenhum bot</p>';
            return;
        }
        
        // Get all bots data
        const allBots = await getAllBots();
        
        Object.keys(userBots).forEach(botId => {
            const bot = allBots[botId];
            if (bot) {
                const botCard = createUserBotCard(bot);
                myBotsList.appendChild(botCard);
            }
        });
        
    } catch (error) {
        console.error('Error loading user bots:', error);
    }
}

function createUserBotCard(bot) {
    const card = document.createElement('div');
    card.className = 'user-bot-card';
    
    const priceText = bot.price > 0 ? `${bot.price} 🍖` : 'Grátis';
    
    card.innerHTML = `
        <div class="bot-card-header">
            <h3>${bot.title}</h3>
            <span class="bot-platform">${bot.platform}</span>
        </div>
        <p class="bot-description">${bot.description}</p>
        <div class="bot-stats">
            <span>📥 ${bot.downloads || 0} downloads</span>
            <span>Preço: ${priceText}</span>
        </div>
        <div class="bot-actions">
            <button class="btn btn-small" onclick="editBotUI('${bot.id}')">Editar</button>
            <button class="btn btn-small btn-danger" onclick="deleteBotUI('${bot.id}')">Deletar</button>
            <button class="btn btn-small" onclick="updateBotUI('${bot.id}')">Atualizar</button>
        </div>
    `;
    
    return card;
}

async function loadMonetizationStatus(userData) {
    try {
        const monetizationSection = document.getElementById('monetizationStatus');
        const totalBots = userData.totalBotsPublished || 0;
        const monetizationEnabled = userData.monetizationEnabled || false;
        
        let statusHTML = '';
        
        if (monetizationEnabled) {
            statusHTML = `
                <div class="monetization-enabled">
                    <h4>✅ Modo Monetizado Ativo</h4>
                    <p>Você pode definir preços para seus novos bots!</p>
                    <p>Bots publicados: ${totalBots}</p>
                </div>
            `;
        } else {
            const botsNeeded = 2 - totalBots;
            statusHTML = `
                <div class="monetization-disabled">
                    <h4>🔒 Modo Monetizado Desativado</h4>
                    <p>Publique ${botsNeeded} bot(s) mais para ativar o modo monetizado</p>
                    <p>Bots publicados: ${totalBots}/2</p>
                </div>
            `;
        }
        
        monetizationSection.innerHTML = statusHTML;
        
    } catch (error) {
        console.error('Error loading monetization status:', error);
    }
}

async function loadTransactions() {
    try {
        const transactionsList = document.getElementById('transactionsList');
        const transactions = await getUserTransactions();
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<p class="no-transactions">Nenhuma transação</p>';
            return;
        }
        
        transactionsList.innerHTML = '';
        
        transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            
            const typeEmoji = {
                'earn': '📈',
                'spend': '📉',
                'purchase': '🛒',
                'sale': '💰'
            }[transaction.type] || '📝';
            
            const date = new Date(transaction.timestamp).toLocaleDateString('pt-BR');
            
            transactionItem.innerHTML = `
                <div class="transaction-info">
                    <span class="transaction-type">${typeEmoji} ${transaction.type}</span>
                    <span class="transaction-description">${transaction.description}</span>
                    <span class="transaction-date">${date}</span>
                </div>
                <span class="transaction-amount ${transaction.type === 'spend' || transaction.type === 'purchase' ? 'negative' : 'positive'}">
                    ${transaction.type === 'spend' || transaction.type === 'purchase' ? '-' : '+'}${transaction.amount} 🍖
                </span>
            `;
            
            transactionsList.appendChild(transactionItem);
        });
        
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

async function editBotUI(botId) {
    showError('Funcionalidade de edição em desenvolvimento');
}

async function deleteBotUI(botId) {
    if (confirm('Tem certeza que deseja deletar este bot?')) {
        try {
            showLoading('Deletando bot...');
            const success = await deleteBot(botId);
            
            if (success) {
                showSuccess('Bot deletado com sucesso!');
                await loadDashboard();
            } else {
                showError('Erro ao deletar bot');
            }
        } catch (error) {
            showError('Erro ao deletar bot: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

async function updateBotUI(botId) {
    showError('Funcionalidade de atualização em desenvolvimento');
}
