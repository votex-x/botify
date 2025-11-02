# Guia de Desenvolvimento - Botify

Este documento descreve como desenvolver e contribuir para o Botify.

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- Node.js 14+ (para ferramentas de desenvolvimento)
- Python 3.8+ (para API)
- Git
- Um editor de código (VS Code recomendado)

### Instalação

1. **Clone o repositório**:
```bash
git clone https://github.com/seu-usuario/botify.git
cd botify
```

2. **Instale dependências Python**:
```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Instale dependências Node (opcional, para ferramentas)**:
```bash
npm install
```

## 🚀 Desenvolvimento Local

### Frontend

1. **Inicie um servidor web**:
```bash
# Usando Python
python -m http.server 8000

# Ou usando Node.js
npx http-server public
```

2. **Acesse em seu navegador**:
```
http://localhost:8000
```

3. **Edite os arquivos**:
   - HTML: `public/index.html`
   - CSS: `public/css/*.css`
   - JavaScript: `public/js/*.js`

### Backend (API Python)

1. **Inicie a API**:
```bash
python api.py
```

2. **A API estará disponível em**:
```
http://localhost:5000
```

3. **Teste os endpoints**:
```bash
curl http://localhost:5000/health
```

## 📁 Estrutura do Projeto

```
botify/
├── public/                  # Frontend
│   ├── index.html          # Página principal
│   ├── pages/              # Páginas adicionais
│   ├── css/                # Estilos
│   │   ├── style.css       # Estilos globais
│   │   ├── auth.css        # Autenticação
│   │   ├── explore.css     # Exploração
│   │   ├── dashboard.css   # Dashboard
│   │   └── admin.css       # Admin
│   └── js/                 # Scripts
│       ├── firebase-config.js  # Configuração Firebase
│       ├── auth.js             # Autenticação
│       ├── navigation.js       # Navegação
│       ├── explore.js          # Exploração
│       ├── dashboard.js        # Dashboard
│       ├── publish.js          # Publicação
│       ├── admin.js            # Admin
│       └── app.js              # Aplicação
├── api.py                  # API Python (Flask)
├── requirements.txt        # Dependências Python
├── Procfile               # Configuração Render
├── README.md              # Documentação
├── DEPLOY.md              # Guia de deploy
└── DEVELOPMENT.md         # Este arquivo
```

## 🔧 Desenvolvimento de Funcionalidades

### Adicionar uma Nova Página

1. **Crie o HTML em `public/index.html`**:
```html
<div id="nova-page" class="page">
    <h2>Minha Nova Página</h2>
    <!-- Conteúdo aqui -->
</div>
```

2. **Crie o JavaScript em `public/js/nova-page.js`**:
```javascript
async function loadNovaPage() {
    try {
        // Carregue dados aqui
    } catch (error) {
        showError('Erro: ' + error.message);
    }
}
```

3. **Adicione a navegação em `public/js/navigation.js`**:
```javascript
case 'nova-page':
    loadNovaPage();
    break;
```

4. **Importe o script em `public/index.html`**:
```html
<script src="/js/nova-page.js"></script>
```

### Adicionar um Novo Endpoint da API

1. **Edite `api.py`**:
```python
@app.route('/api/novo-endpoint', methods=['POST'])
@require_auth
def novo_endpoint():
    try:
        data = request.get_json()
        # Implemente a lógica aqui
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

2. **Teste com curl**:
```bash
curl -X POST http://localhost:5000/api/novo-endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"data": "value"}'
```

### Adicionar um Novo Estilo CSS

1. **Crie um novo arquivo em `public/css/`**:
```css
/* public/css/nova-pagina.css */
.nova-pagina {
    /* Estilos aqui */
}
```

2. **Importe em `public/index.html`**:
```html
<link rel="stylesheet" href="/css/nova-pagina.css">
```

## 🧪 Testes

### Teste Manual

1. **Teste de autenticação**:
   - Crie uma conta
   - Faça login
   - Verifique se os dados são salvos

2. **Teste de publicação**:
   - Publique um bot
   - Verifique se aparece na exploração

3. **Teste de compra**:
   - Compre um bot
   - Verifique o histórico

### Teste de API

```bash
# Validar ZIP
curl -X POST http://localhost:5000/api/bots/validate-zip \
  -H "Authorization: Bearer token" \
  -F "file=@test.zip"

# Health check
curl http://localhost:5000/health
```

## 🐛 Debugging

### Frontend

1. **Abra o DevTools** (F12)
2. **Verifique o console** para erros
3. **Use `console.log()`** para debug:
```javascript
console.log('Variável:', variavel);
```

### Backend

1. **Verifique os logs**:
```bash
python api.py
```

2. **Use `print()` para debug**:
```python
print('Variável:', variavel)
```

## 📝 Convenções de Código

### JavaScript

- Use camelCase para variáveis e funções
- Use const por padrão, let se necessário
- Adicione comentários para lógica complexa
- Use async/await em vez de callbacks

```javascript
// ✅ Bom
async function loadUserData() {
    const userData = await getUserData();
    console.log('User:', userData);
}

// ❌ Ruim
function loadUserData() {
    getUserData().then(function(data) {
        console.log('User:', data);
    });
}
```

### Python

- Use snake_case para variáveis e funções
- Use docstrings para funções
- Mantenha linhas com menos de 80 caracteres
- Use type hints quando possível

```python
# ✅ Bom
def get_user_data(user_id: str) -> dict:
    """Retrieve user data from database."""
    return database.ref(f'users/{user_id}').get().val()

# ❌ Ruim
def getUserData(user_id):
    return database.ref('users/' + user_id).get().val()
```

### CSS

- Use kebab-case para classes
- Agrupe estilos relacionados
- Use variáveis CSS para cores e tamanhos
- Mantenha especificidade baixa

```css
/* ✅ Bom */
.bot-card {
    background: var(--bg-color);
    padding: 20px;
    border-radius: 8px;
}

.bot-card:hover {
    box-shadow: var(--shadow-lg);
}

/* ❌ Ruim */
.botCard {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
}

.botCard:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

## 🔒 Segurança

### Boas Práticas

1. **Nunca exponha chaves de API**:
   - Use variáveis de ambiente
   - Não commite `.env`

2. **Valide entrada do usuário**:
   - Valide no frontend e backend
   - Sanitize dados antes de usar

3. **Use HTTPS em produção**:
   - Todos os dados sensíveis devem ser criptografados

4. **Implemente rate limiting**:
   - Proteja contra abuso de API

## 📚 Recursos Úteis

- [Firebase Documentation](https://firebase.google.com/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)

## 🤝 Contribuindo

1. **Crie uma branch**:
```bash
git checkout -b feature/sua-feature
```

2. **Faça suas mudanças**:
```bash
git add .
git commit -m "Adicionar feature: descrição"
```

3. **Push para a branch**:
```bash
git push origin feature/sua-feature
```

4. **Abra um Pull Request**:
   - Descreva suas mudanças
   - Referencie issues relacionadas

## 📋 Checklist de Desenvolvimento

Antes de fazer commit:

- [ ] Código segue as convenções
- [ ] Não há erros no console
- [ ] Funcionalidade foi testada
- [ ] Comentários foram adicionados
- [ ] Nenhuma chave de API foi exposta

## 🚀 Próximas Etapas

- [ ] Adicionar testes unitários
- [ ] Implementar WebSockets para tempo real
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Implementar sistema de notificações
- [ ] Adicionar análise de bots

---

Desenvolvido com ❤️ pela Bite
