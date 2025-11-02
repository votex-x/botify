# Guia de Deploy - Botify

Este documento descreve como fazer deploy do Botify em produção.

## 📋 Pré-requisitos

- Conta no GitHub
- Conta no Firebase (já configurada)
- Conta no Render.com
- Conta em um serviço de hosting (Firebase Hosting, Vercel, Netlify, etc.)

## 🚀 Deploy do Frontend

### Opção 1: Firebase Hosting

1. **Instale Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **Faça login**:
```bash
firebase login
```

3. **Inicialize o projeto**:
```bash
firebase init hosting
```

4. **Configure o arquivo `firebase.json`**:
```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

5. **Deploy**:
```bash
firebase deploy
```

### Opção 2: Vercel

1. **Instale Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

### Opção 3: Netlify

1. **Instale Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Deploy**:
```bash
netlify deploy --prod --dir=public
```

## 🐍 Deploy da API Python

### Render.com

1. **Crie uma conta em [Render.com](https://render.com)**

2. **Conecte seu repositório GitHub**:
   - Vá para Dashboard
   - Clique em "New +"
   - Selecione "Web Service"
   - Conecte seu repositório GitHub

3. **Configure o Web Service**:
   - **Name**: botify-api
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn api:app`

4. **Configure variáveis de ambiente**:
   - Vá para "Environment"
   - Adicione as seguintes variáveis:
     - `FLASK_ENV`: production
     - `FIREBASE_CREDENTIALS`: (seu JSON de credenciais Firebase)

5. **Deploy automático**:
   - Render faz deploy automático a cada push para a branch principal

### Alternativa: Heroku

1. **Instale Heroku CLI**:
```bash
npm install -g heroku
```

2. **Faça login**:
```bash
heroku login
```

3. **Crie um novo app**:
```bash
heroku create botify-api
```

4. **Configure variáveis de ambiente**:
```bash
heroku config:set FLASK_ENV=production
heroku config:set FIREBASE_CREDENTIALS='{"type":"service_account",...}'
```

5. **Deploy**:
```bash
git push heroku main
```

## 🔐 Configuração de Variáveis de Ambiente

### Frontend (Firebase)

As credenciais já estão em `public/js/firebase-config.js`. Se precisar alterar:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
};
```

### Backend (API Python)

Crie um arquivo `.env` (não commitar):

```env
FLASK_ENV=production
PORT=5000
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"firehx-786aa",...}
```

## 📝 Configuração do Firebase

### Autenticação

1. Vá para Firebase Console
2. Selecione seu projeto
3. Vá para "Authentication"
4. Ative "Email/Password"

### Realtime Database

1. Vá para "Realtime Database"
2. Crie um novo banco de dados
3. Configure as regras de segurança:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".validate": "newData.hasChildren(['email', 'createdAt', 'bites'])"
      }
    },
    "bots": {
      "$botId": {
        ".read": true,
        ".write": "root.child('users').child(auth.uid).child('bots').child($botId).exists() || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".validate": "newData.hasChildren(['title', 'description', 'platform'])"
      }
    },
    "transactions": {
      "$transactionId": {
        ".read": "$transactionId.child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    }
  }
}
```

### Storage

1. Vá para "Storage"
2. Configure as regras:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 52428800;
    }
  }
}
```

## 🔗 URLs de Produção

Após o deploy, você terá:

- **Frontend**: https://seu-dominio.com
- **API**: https://botify-api.onrender.com (ou seu domínio)

Atualize as URLs no código se necessário:

```javascript
// Em public/js/firebase-config.js
const API_URL = 'https://botify-api.onrender.com';
```

## 🧪 Testes de Produção

1. **Teste de autenticação**:
   - Crie uma conta
   - Faça login
   - Verifique se os dados são salvos no Firebase

2. **Teste de publicação de bots**:
   - Faça login
   - Publique um bot
   - Verifique se aparece na exploração

3. **Teste de transações**:
   - Compre um bot
   - Verifique o histórico de transações

4. **Teste de API**:
   - Teste os endpoints com curl ou Postman:
   ```bash
   curl -X POST http://localhost:5000/api/bots/validate-zip \
     -H "Authorization: Bearer token" \
     -F "file=@bot.zip"
   ```

## 📊 Monitoramento

### Render.com
- Dashboard mostra logs em tempo real
- Alertas de erro automáticos

### Firebase
- Console mostra uso de banco de dados
- Alertas de quota

## 🔄 CI/CD

### GitHub Actions (Automático)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## 🚨 Troubleshooting

### API não conecta ao Firebase
- Verifique se `FIREBASE_CREDENTIALS` está correto
- Verifique se o projeto Firebase está ativo

### Frontend não conecta à API
- Verifique a URL da API
- Verifique CORS no backend

### Erro 413 ao fazer upload
- Aumente o limite de tamanho no Flask:
```python
app.config['MAX_CONTENT_LENGTH'] = 52428800  # 50MB
```

## 📞 Suporte

Para problemas com:
- **Firebase**: https://firebase.google.com/support
- **Render**: https://render.com/support
- **Heroku**: https://help.heroku.com

---

Desenvolvido com ❤️ pela Bite
