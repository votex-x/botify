// Explore Page Functions

let allBots = {};
let filteredBots = {};

async function loadExplore() {
    try {
        showLoading('Carregando bots...');
        allBots = await getAllBots();
        
        // Load official Bite bots if not already loaded
        if (Object.keys(allBots).length === 0) {
            await loadOfficialBots();
        }
        
        displayBots(allBots);
        setupFilters();
    } catch (error) {
        showError('Erro ao carregar bots: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadOfficialBots() {
    try {
        // Load official Bite bots
        const officialBots = {
            'bite-bot-1': {
                id: 'bite-bot-1',
                title: 'Bite Moderation Bot',
                description: 'Bot de moderação completo para Discord com sistema de warns, kicks e bans',
                platform: 'discord',
                userId: 'bite-official',
                createdAt: new Date().toISOString(),
                price: 0,
                downloads: 1500,
                rating: 4.8,
                fileUrl: '#',
                official: true
            },
            'bite-bot-2': {
                id: 'bite-bot-2',
                title: 'Bite Music Bot',
                description: 'Bot de música para Discord com suporte a Spotify e YouTube',
                platform: 'discord',
                userId: 'bite-official',
                createdAt: new Date().toISOString(),
                price: 0,
                downloads: 2000,
                rating: 4.9,
                fileUrl: '#',
                official: true
            },
            'bite-bot-3': {
                id: 'bite-bot-3',
                title: 'Bite Telegram Bot',
                description: 'Bot multifuncional para Telegram com comandos úteis',
                platform: 'telegram',
                userId: 'bite-official',
                createdAt: new Date().toISOString(),
                price: 0,
                downloads: 800,
                rating: 4.7,
                fileUrl: '#',
                official: true
            }
        };
        
        // Save official bots to database
        for (const [key, bot] of Object.entries(officialBots)) {
            await database.ref('bots/' + key).set(bot);
        }
        
        allBots = officialBots;
    } catch (error) {
        console.error('Error loading official bots:', error);
    }
}

function displayBots(bots) {
    const botsList = document.getElementById('botsList');
    botsList.innerHTML = '';
    
    if (Object.keys(bots).length === 0) {
        botsList.innerHTML = '<p class="no-bots">Nenhum bot encontrado</p>';
        return;
    }
    
    Object.values(bots).forEach(bot => {
        const botCard = createBotCard(bot);
        botsList.appendChild(botCard);
    });
}

function createBotCard(bot) {
    const card = document.createElement('div');
    card.className = 'bot-card';
    
    const priceText = bot.price > 0 ? `${bot.price} 🍖` : 'Grátis';
    const ratingStars = '⭐'.repeat(Math.floor(bot.rating || 0));
    
    card.innerHTML = `
        <div class="bot-card-header">
            <h3>${bot.title}</h3>
            <span class="bot-platform">${bot.platform}</span>
        </div>
        <p class="bot-description">${bot.description}</p>
        <div class="bot-stats">
            <span>📥 ${bot.downloads || 0} downloads</span>
            <span>${ratingStars} ${bot.rating || 0}</span>
        </div>
        <div class="bot-footer">
            <span class="bot-price">${priceText}</span>
            <button class="btn btn-small" onclick="viewBotDetails('${bot.id}')">Ver Detalhes</button>
        </div>
    `;
    
    return card;
}

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const platformFilter = document.getElementById('platformFilter');
    
    searchInput?.addEventListener('input', applyFilters);
    platformFilter?.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const platformFilter = document.getElementById('platformFilter')?.value || '';
    
    filteredBots = {};
    
    Object.values(allBots).forEach(bot => {
        const matchesSearch = bot.title.toLowerCase().includes(searchTerm) || 
                            bot.description.toLowerCase().includes(searchTerm);
        const matchesPlatform = !platformFilter || bot.platform === platformFilter;
        
        if (matchesSearch && matchesPlatform) {
            filteredBots[bot.id] = bot;
        }
    });
    
    displayBots(filteredBots);
}

async function viewBotDetails(botId) {
    try {
        const bot = allBots[botId];
        if (!bot) {
            showError('Bot não encontrado');
            return;
        }
        
        const detailsContainer = document.getElementById('botDetailsContent');
        const ownsBot = currentUser && await userOwnsBotId(botId);
        const hasPurchased = currentUser && await userHasPurchasedBot(botId);
        const isFree = bot.price === 0 || bot.price === undefined;
        
        let actionButton = '';
        if (currentUser && bot.userId === currentUser.uid) {
            actionButton = `<button class="btn btn-secondary" onclick="editBot('${botId}')">Editar Bot</button>`;
        } else if (isFree) {
            actionButton = `<button class="btn btn-primary" onclick="downloadBot('${botId}')">Baixar Bot</button>`;
        } else if (hasPurchased || ownsBot) {
            actionButton = `<button class="btn btn-primary" onclick="downloadBot('${botId}')">Baixar Bot</button>`;
        } else {
            actionButton = `<button class="btn btn-primary" onclick="purchaseBotUI('${botId}')">Comprar por ${bot.price} 🍖</button>`;
        }
        
        detailsContainer.innerHTML = `
            <div class="bot-details">
                <h2>${bot.title}</h2>
                <p class="bot-platform-badge">${bot.platform}</p>
                <p class="bot-description">${bot.description}</p>
                
                <div class="bot-details-stats">
                    <div class="stat">
                        <span class="stat-label">Downloads:</span>
                        <span class="stat-value">${bot.downloads || 0}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Avaliação:</span>
                        <span class="stat-value">⭐ ${bot.rating || 0}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Preço:</span>
                        <span class="stat-value">${isFree ? 'Grátis' : bot.price + ' 🍖'}</span>
                    </div>
                </div>
                
                <div class="bot-details-actions">
                    ${actionButton}
                </div>
            </div>
        `;
        
        navigateTo('bot-details');
    } catch (error) {
        showError('Erro ao carregar detalhes do bot: ' + error.message);
    }
}

async function downloadBot(botId) {
    try {
        const bot = allBots[botId];
        if (!bot || !bot.fileUrl) {
            showError('Arquivo do bot não encontrado');
            return;
        }
        
        // In a real scenario, this would download the file
        // For now, we'll just show a message
        showSuccess('Bot baixado com sucesso! Verifique sua pasta de downloads.');
    } catch (error) {
        showError('Erro ao baixar bot: ' + error.message);
    }
}

async function purchaseBotUI(botId) {
    if (!currentUser) {
        showError('Você precisa estar logado para comprar bots');
        navigateTo('login');
        return;
    }
    
    try {
        showLoading('Processando compra...');
        const success = await purchaseBot(botId);
        
        if (success) {
            showSuccess('Bot comprado com sucesso!');
            await loadExplore();
        } else {
            showError('Erro ao comprar bot. Verifique seu saldo de Bites.');
        }
    } catch (error) {
        showError('Erro ao comprar bot: ' + error.message);
    } finally {
        hideLoading();
    }
}

function editBot(botId) {
    // TODO: Implement bot editing
    showError('Funcionalidade de edição em desenvolvimento');
}
