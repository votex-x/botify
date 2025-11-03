document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const publishForm = document.getElementById('publish-form');
    const publishStatus = document.getElementById('publish-status');
    const botsGrid = document.getElementById('bots-grid');
    const loadingMessage = document.getElementById('loading-message');
    const emptyMessage = document.getElementById('empty-message');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const catalogStats = document.getElementById('catalog-stats');
    const botModal = document.getElementById('bot-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalContent = document.getElementById('modal-content');

    // API Endpoints
    const API_BASE = window.location.origin;
    const ENDPOINTS = {
        PUBLISH: `${API_BASE}/api/bots/publish`,
        GET_BOTS: `${API_BASE}/api/bots`,
        DOWNLOAD: `${API_BASE}/api/bots/{id}/download`,
        RATE: `${API_BASE}/api/bots/{id}/rate`,
        SEARCH: `${API_BASE}/api/bots/search`,
        STATS: `${API_BASE}/api/stats`
    };

    // Estado global
    let allBots = [];

    // Inicialização
    loadBots();
    loadStats();

    // Event Listeners
    publishForm.addEventListener('submit', handlePublish);
    searchBtn.addEventListener('click', handleSearch);
    refreshBtn.addEventListener('click', () => {
        loadBots();
        loadStats();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    closeModal.addEventListener('click', () => {
        botModal.classList.add('hidden');
    });

    botModal.addEventListener('click', (e) => {
        if (e.target === botModal) {
            botModal.classList.add('hidden');
        }
    });

    // Funções principais
    async function handlePublish(e) {
        e.preventDefault();
        
        const formData = new FormData(publishForm);
        const fileInput = document.getElementById('bot-zip');
        
        if (!fileInput.files[0]) {
            showStatus('Por favor, selecione um arquivo ZIP.', true);
            return;
        }

        showStatus('Publicando seu bot...', false);

        try {
            const response = await fetch(ENDPOINTS.PUBLISH, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showStatus('✅ Bot publicado com sucesso!', false);
                publishForm.reset();
                // Recarrega a lista de bots
                loadBots();
                loadStats();
            } else {
                showStatus(`❌ Erro: ${data.error}`, true);
            }
        } catch (error) {
            console.error('Erro ao publicar:', error);
            showStatus('❌ Erro de conexão com o servidor.', true);
        }
    }

    async function loadBots() {
        showLoading(true);
        
        try {
            const response = await fetch(ENDPOINTS.GET_BOTS);
            const data = await response.json();

            if (response.ok) {
                allBots = data.bots || [];
                displayBots(allBots);
            } else {
                showEmptyMessage('Erro ao carregar bots.');
            }
        } catch (error) {
            console.error('Erro ao carregar bots:', error);
            showEmptyMessage('Erro de conexão.');
        } finally {
            showLoading(false);
        }
    }

    async function handleSearch() {
        const query = searchInput.value.trim();
        
        if (!query) {
            displayBots(allBots);
            return;
        }

        showLoading(true);

        try {
            const response = await fetch(`${ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (response.ok) {
                displayBots(data.results || []);
            } else {
                displayBots([]);
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            displayBots([]);
        } finally {
            showLoading(false);
        }
    }

    async function loadStats() {
        try {
            const response = await fetch(ENDPOINTS.STATS);
            const data = await response.json();

            if (response.ok) {
                const stats = data.stats;
                catalogStats.innerHTML = `
                    📊 Estatísticas: 
                    ${stats.total_bots} Bots | 
                    ${stats.total_downloads} Downloads | 
                    ⭐ ${stats.average_rating}/5
                `;
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    function displayBots(bots) {
        botsGrid.innerHTML = '';

        if (bots.length === 0) {
            showEmptyMessage('Nenhum bot encontrado.');
            return;
        }

        bots.forEach(bot => {
            const botCard = createBotCard(bot);
            botsGrid.appendChild(botCard);
        });

        emptyMessage.classList.add('hidden');
    }

    function createBotCard(bot) {
        const card = document.createElement('div');
        card.className = 'bot-card';
        
        const tagsHtml = bot.tags && bot.tags.length > 0 
            ? `<div class="bot-tags">${bot.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            <h3>${bot.name || 'Bot Sem Nome'}</h3>
            <div class="bot-author">por ${bot.author || 'Anônimo'}</div>
            <div class="bot-description">${bot.description || 'Sem descrição.'}</div>
            ${tagsHtml}
            <div class="bot-meta">
                <div class="bot-stats">
                    <span class="bot-stat">⬇️ ${bot.downloads || 0}</span>
                    <span class="bot-stat">⭐ <span class="rating">${bot.rating || 'N/A'}</span></span>
                    <span class="bot-stat">📁 ${bot.file_count || 0} files</span>
                </div>
                <button class="download-btn" onclick="downloadBot('${bot.id}', '${bot.name}')">
                    📥 Download
                </button>
            </div>
        `;

        // Click para ver detalhes
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('download-btn')) {
                showBotDetails(bot);
            }
        });

        return card;
    }

    async function downloadBot(botId, botName) {
        try {
            const response = await fetch(ENDPOINTS.DOWNLOAD.replace('{id}', botId), {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                // Abre o download em nova aba
                window.open(data.download_url, '_blank');
                
                // Atualiza estatísticas
                loadBots();
                loadStats();
                
                showTempStatus(`✅ Download iniciado: ${botName}`, false);
            } else {
                showTempStatus(`❌ Erro no download: ${data.error}`, true);
            }
        } catch (error) {
            console.error('Erro no download:', error);
            showTempStatus('❌ Erro de conexão no download.', true);
        }
    }

    function showBotDetails(bot) {
        const metadata = bot.metadata ? JSON.stringify(bot.metadata, null, 2) : 'Nenhum metadata disponível';
        
        modalContent.innerHTML = `
            <h2>${bot.name}</h2>
            <div class="bot-details">
                <p><strong>Autor:</strong> ${bot.author || 'Anônimo'}</p>
                <p><strong>Publicado em:</strong> ${new Date(bot.created_at).toLocaleDateString('pt-BR')}</p>
                <p><strong>Downloads:</strong> ${bot.downloads || 0}</p>
                <p><strong>Avaliação:</strong> ⭐ ${bot.rating || 'N/A'} (${bot.ratings_count || 0} avaliações)</p>
                <p><strong>Descrição:</strong></p>
                <p>${bot.description || 'Sem descrição.'}</p>
                
                ${bot.tags && bot.tags.length > 0 ? `
                    <p><strong>Tags:</strong></p>
                    <div class="bot-tags">${bot.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
                ` : ''}
                
                <p><strong>Arquivos no ZIP:</strong> ${bot.file_count || 0}</p>
                <p><strong>Tamanho:</strong> ${formatFileSize(bot.file_size)}</p>
                
                <div class="metadata-section">
                    <h4>Metadata:</h4>
                    <pre class="metadata">${metadata}</pre>
                </div>
                
                <button class="download-btn" onclick="downloadBot('${bot.id}', '${bot.name}')" style="margin-top: 20px;">
                    📥 Baixar Bot
                </button>
                
                <div class="rating-section" style="margin-top: 20px;">
                    <h4>Avaliar este bot:</h4>
                    <div class="rating-stars">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <button onclick="rateBot('${bot.id}', ${star})" class="star-btn">⭐ ${star}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        botModal.classList.remove('hidden');
    }

    async function rateBot(botId, rating) {
        try {
            const response = await fetch(ENDPOINTS.RATE.replace('{id}', botId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rating })
            });

            const data = await response.json();

            if (response.ok) {
                showTempStatus(`✅ Avaliação enviada: ${rating} estrelas`, false);
                // Fecha o modal e recarrega
                botModal.classList.add('hidden');
                loadBots();
                loadStats();
            } else {
                showTempStatus(`❌ Erro na avaliação: ${data.error}`, true);
            }
        } catch (error) {
            console.error('Erro na avaliação:', error);
            showTempStatus('❌ Erro de conexão na avaliação.', true);
        }
    }

    // Funções auxiliares
    function showStatus(message, isError) {
        publishStatus.textContent = message;
        publishStatus.className = isError ? 'error' : 'success';
        publishStatus.classList.remove('hidden');
    }

    function showTempStatus(message, isError) {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = message;
        tempDiv.className = `success ${isError ? 'error' : 'success'}`;
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '20px';
        tempDiv.style.right = '20px';
        tempDiv.style.zIndex = '1000';
        tempDiv.style.padding = '15px';
        tempDiv.style.borderRadius = '8px';
        tempDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        
        document.body.appendChild(tempDiv);
        
        setTimeout(() => {
            document.body.removeChild(tempDiv);
        }, 3000);
    }

    function showLoading(show) {
        if (show) {
            loadingMessage.classList.remove('hidden');
            botsGrid.classList.add('hidden');
        } else {
            loadingMessage.classList.add('hidden');
            botsGrid.classList.remove('hidden');
        }
    }

    function showEmptyMessage(message) {
        emptyMessage.textContent = message;
        emptyMessage.classList.remove('hidden');
        botsGrid.innerHTML = '';
    }

    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Expor funções globalmente para onClick
    window.downloadBot = downloadBot;
    window.rateBot = rateBot;
});
