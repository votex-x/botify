// Publish Bot Functions

document.getElementById('publishBotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
        showError('Você precisa estar logado para publicar um bot');
        navigateTo('login');
        return;
    }
    
    const title = document.getElementById('botTitle').value;
    const description = document.getElementById('botDescription').value;
    const platform = document.getElementById('botPlatform').value;
    const zipFile = document.getElementById('botZip').files[0];
    const price = parseInt(document.getElementById('botPrice').value) || 0;
    
    if (!title || !description || !platform || !zipFile) {
        showError('Preencha todos os campos obrigatórios');
        return;
    }
    
    if (zipFile.type !== 'application/zip' && !zipFile.name.endsWith('.zip')) {
        showError('O arquivo deve ser um ZIP válido');
        return;
    }
    
    try {
        showLoading('Publicando bot...');
        
        // Check monetization status
        const userData = await getUserData();
        const totalBots = userData?.totalBotsPublished || 0;
        const monetizationEnabled = userData?.monetizationEnabled || false;
        
        // If not monetized and trying to set a price, reject
        if (price > 0 && totalBots < 2) {
            showError('Você precisa publicar 2 bots grátis antes de poder monetizar');
            hideLoading();
            return;
        }
        
        // Upload ZIP file
        const fileName = `${currentUser.uid}/${Date.now()}-${zipFile.name}`;
        const fileUrl = await uploadFile(zipFile, fileName);
        
        if (!fileUrl) {
            showError('Erro ao fazer upload do arquivo');
            hideLoading();
            return;
        }
        
        // Create bot object
        const botData = {
            title: title,
            description: description,
            platform: platform,
            price: price,
            fileUrl: fileUrl,
            fileName: fileName
        };
        
        // Add bot to database
        const botId = await addBot(botData);
        
        if (botId) {
            showSuccess('Bot publicado com sucesso!');
            
            // Reset form
            document.getElementById('publishBotForm').reset();
            
            // Redirect to dashboard
            setTimeout(() => {
                navigateTo('dashboard');
            }, 1500);
        } else {
            showError('Erro ao publicar bot');
        }
        
    } catch (error) {
        showError('Erro ao publicar bot: ' + error.message);
    } finally {
        hideLoading();
    }
});

// File input preview
document.getElementById('botZip')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        console.log('Arquivo selecionado:', file.name, '(' + (file.size / 1024 / 1024).toFixed(2) + ' MB)');
    }
});
