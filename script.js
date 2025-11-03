document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const statusMessage = document.getElementById('status-message');
    const resultDisplay = document.getElementById('result-display');
    const validationResult = document.getElementById('validation-result');
    const authTokenInput = document.getElementById('auth-token');

    // Use a URL correta baseada no domínio atual
    const API_ENDPOINT = window.location.origin + '/api/bots/validate-zip';

    function showStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.className = isError ? 'error' : 'success';
        statusMessage.classList.remove('hidden');
        resultDisplay.classList.add('hidden');
    }

    function hideStatus() {
        statusMessage.classList.add('hidden');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideStatus();
        validationResult.textContent = '';
        resultDisplay.classList.add('hidden');

        const fileInput = document.getElementById('bot-zip');
        const file = fileInput.files[0];
        const authToken = authTokenInput.value.trim();

        if (!file) {
            showStatus('Por favor, selecione um arquivo ZIP.', true);
            return;
        }

        if (!authToken) {
            showStatus('Por favor, insira o Token de Autorização.', true);
            return;
        }

        showStatus('Validando arquivo ZIP...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showStatus('Validação concluída com sucesso!', false);
                validationResult.textContent = JSON.stringify(data, null, 2);
                resultDisplay.classList.remove('hidden');
            } else {
                const errorMessage = data.error || 'Erro desconhecido na validação.';
                showStatus(`Erro na validação: ${errorMessage}`, true);
                validationResult.textContent = JSON.stringify(data, null, 2);
                resultDisplay.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Erro ao enviar requisição:', error);
            showStatus('Erro de conexão com o servidor. Verifique se o backend está rodando.', true);
        }
    });
});
