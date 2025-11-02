# Botify - Repositório de Bots

Botify é uma plataforma completa para compartilhar, descobrir e monetizar bots para Discord, Telegram e outras plataformas. Construído com HTML, CSS, JavaScript puro no frontend e Python (Flask) no backend, com Firebase para autenticação e armazenamento.

## 🚀 Características

- **Autenticação Firebase**: Login seguro com email e senha
- **Exploração de Bots**: Descubra bots oficiais da Bite e da comunidade
- **Publicação de Bots**: Publique seus bots em formato ZIP
- **Sistema de Moeda (Bites)**: Moeda interna para comprar e vender bots
- **Modo Monetizado**: Ative após publicar 2 bots grátis
- **Gerenciamento de Versões**: Atualize seus bots com novos ZIPs
- **API Python**: Hospede código Python para APIs de bots
- **Dashboard**: Gerencie seus bots, saldo de Bites e transações

## 📋 Requisitos

### Frontend
- Navegador moderno com suporte a ES6
- Conexão com internet para Firebase

### Backend (API Python)
- Python 3.8+
- pip (gerenciador de pacotes Python)
- Conta no Render.com (para deploy)

## 🔧 Instalação

### Frontend

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/botify.git
cd botify
```

2. Abra `public/index.html` em seu navegador ou sirva com um servidor web:
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx http-server public
```

3. Acesse em `http://localhost:8000`

### Backend (API Python)

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas configurações
```

3. Execute a API localmente:
```bash
python api.py
```

4. A API estará disponível em `http://localhost:5000`

## 🔐 Configuração do Firebase

As credenciais do Firebase já estão configuradas em `public/js/firebase-config.js`. Para usar seu próprio projeto Firebase:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication (Email/Password)
3. Crie um Realtime Database
4. Configure Storage
5. Atualize as credenciais em `firebase-config.js`

## 📁 Estrutura do Projeto

```
botify/
├── public/
│   ├── index.html           # Página principal
│   ├── css/
│   │   ├── style.css        # Estilos globais
│   │   ├── auth.css         # Estilos de autenticação
│   │   ├── explore.css      # Estilos de exploração
│   │   └── dashboard.css    # Estilos do dashboard
│   └── js/
│       ├── firebase-config.js   # Configuração Firebase
│       ├── auth.js              # Funções de autenticação
│       ├── navigation.js        # Sistema de navegação
│       ├── explore.js           # Funcionalidades de exploração
│       ├── dashboard.js         # Funcionalidades do dashboard
│       ├── publish.js           # Publicação de bots
│       └── app.js               # Aplicação principal
├── api.py                   # API Python (Flask)
├── requirements.txt         # Dependências Python
├── Procfile                 # Configuração para Render
└── README.md               # Este arquivo
```

## 🌐 Deploy

### Frontend (Firebase Hosting)

1. Instale Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Inicialize o projeto:
```bash
firebase init
```

3. Deploy:
```bash
firebase deploy
```

### Backend (Render.com)

1. Crie uma conta em [Render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um novo Web Service
4. Configure:
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn api:app`
5. Adicione variáveis de ambiente
6. Deploy

## 📚 API Endpoints

### Validação de ZIP
```
POST /api/bots/validate-zip
Content-Type: multipart/form-data
Authorization: Bearer {token}

Resposta:
{
  "files": [...],
  "file_count": 10,
  "size": 1024000,
  "valid": true
}
```

### Extração de Informações
```
POST /api/bots/extract-info
Content-Type: multipart/form-data
Authorization: Bearer {token}

Resposta:
{
  "success": true,
  "bot_info": {...},
  "files": [...]
}
```

### Processar Bot
```
POST /api/bots/process
Content-Type: multipart/form-data
Authorization: Bearer {token}

Parâmetros:
- file: arquivo ZIP
- user_id: ID do usuário
- bot_id: ID do bot

Resposta:
{
  "success": true,
  "bot_id": "...",
  "file_size": 1024000,
  "file_count": 10,
  "metadata": {...}
}
```

### Atualizar Bot
```
POST /api/bots/{bot_id}/update
Content-Type: multipart/form-data
Authorization: Bearer {token}

Parâmetros:
- file: arquivo ZIP
- user_id: ID do usuário

Resposta:
{
  "success": true,
  "version": "2024-01-01T12:00:00"
}
```

### Baixar Bot
```
GET /api/bots/{bot_id}/download
Authorization: Bearer {token}
```

### Salvar Código Python
```
POST /api/python-api
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "bot_id": "...",
  "user_id": "...",
  "code": "..."
}

Resposta:
{
  "success": true,
  "message": "Python API code saved successfully"
}
```

## 🎯 Fluxo de Uso

### Para Usuários Comuns

1. **Criar Conta**: Faça login com email e senha
2. **Explorar Bots**: Navegue pela página de exploração
3. **Baixar Bots**: Baixe bots grátis ou compre com Bites
4. **Ver Detalhes**: Clique em um bot para ver mais informações

### Para Criadores de Bots

1. **Criar Conta**: Faça login
2. **Publicar Bot**: Vá para "Publicar Novo Bot"
3. **Preencher Informações**: Título, descrição, plataforma, arquivo ZIP
4. **Publicar**: Seu bot fica disponível para download
5. **Ativar Monetização**: Após 2 bots, ative modo monetizado
6. **Definir Preços**: Defina preços para novos bots
7. **Atualizar Bots**: Atualize com novos ZIPs
8. **Ganhar Bites**: Receba Bites quando alguém comprar seu bot

## 💰 Sistema de Bites

- **Concessão**: Admin pode conceder Bites aos usuários
- **Compra**: Use Bites para comprar bots pagos
- **Venda**: Ganhe Bites quando alguém compra seu bot
- **Histórico**: Veja todas as suas transações

## 🔄 Sistema de Monetização

- **Requisito**: Publicar 2 bots grátis
- **Ativação**: Automática após 2 bots
- **Bots Antigos**: Continuam grátis mesmo após ativação
- **Novos Bots**: Podem ter preço definido

## 🐛 Troubleshooting

### Firebase não conecta
- Verifique as credenciais em `firebase-config.js`
- Verifique se o projeto Firebase está ativo
- Verifique a conexão com a internet

### API Python não funciona
- Verifique se as dependências estão instaladas: `pip install -r requirements.txt`
- Verifique se a porta 5000 está disponível
- Verifique os logs: `python api.py`

### Problemas com upload de ZIP
- Verifique se o arquivo é um ZIP válido
- Verifique o tamanho do arquivo (máximo 50MB)
- Verifique se o ZIP não está vazio

## 📝 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📧 Contato

Para dúvidas ou sugestões, entre em contato através do email ou abra uma issue no GitHub.

## 🙏 Agradecimentos

- Firebase pela infraestrutura de autenticação e banco de dados
- Render.com pelo hosting da API
- Comunidade de desenvolvedores de bots

---

Desenvolvido com ❤️ pela Bite
