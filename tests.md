# Testes - Botify

Documento para rastrear testes de funcionalidades.

## 🧪 Testes de Autenticação

### Criar Conta
- [ ] Criar conta com email válido
- [ ] Criar conta com email inválido (deve falhar)
- [ ] Criar conta com senhas diferentes (deve falhar)
- [ ] Criar conta com senha curta (deve falhar)
- [ ] Verificar se usuário é criado no Firebase

### Login
- [ ] Login com credenciais corretas
- [ ] Login com email incorreto (deve falhar)
- [ ] Login com senha incorreta (deve falhar)
- [ ] Logout funciona corretamente
- [ ] Sessão é mantida ao recarregar página

## 🤖 Testes de Bots

### Publicar Bot
- [ ] Publicar bot com todos os campos preenchidos
- [ ] Publicar bot sem título (deve falhar)
- [ ] Publicar bot sem descrição (deve falhar)
- [ ] Publicar bot sem arquivo ZIP (deve falhar)
- [ ] Publicar bot com arquivo inválido (deve falhar)
- [ ] Arquivo ZIP é salvo no Firebase Storage
- [ ] Bot aparece no dashboard do usuário
- [ ] Bot aparece na página de exploração

### Exploração de Bots
- [ ] Listar todos os bots
- [ ] Filtrar bots por plataforma
- [ ] Buscar bots por título
- [ ] Buscar bots por descrição
- [ ] Clicar em bot mostra detalhes
- [ ] Bots oficiais aparecem primeiro

### Deletar Bot
- [ ] Deletar bot próprio funciona
- [ ] Arquivo é removido do Storage
- [ ] Bot desaparece da exploração
- [ ] Não é possível deletar bot de outro usuário

## 💰 Testes de Bites

### Saldo de Bites
- [ ] Novo usuário começa com 0 Bites
- [ ] Saldo é exibido no dashboard
- [ ] Saldo é atualizado após compra
- [ ] Saldo é atualizado após venda

### Concessão de Bites (Admin)
- [ ] Admin pode conceder Bites
- [ ] Bites são adicionados ao saldo do usuário
- [ ] Transação é registrada
- [ ] Usuário recebe notificação (se implementado)

### Histórico de Transações
- [ ] Transações aparecem no dashboard
- [ ] Transações mostram tipo correto
- [ ] Transações mostram data correta
- [ ] Transações mostram valor correto

## 🛒 Testes de Compra

### Comprar Bot Grátis
- [ ] Usuário pode baixar bot grátis
- [ ] Bot aparece em "Meus Bots"
- [ ] Transação é registrada

### Comprar Bot Pago
- [ ] Usuário com Bites suficientes pode comprar
- [ ] Usuário com Bites insuficientes não pode comprar (deve falhar)
- [ ] Bites são deduzidos da conta do comprador
- [ ] Bites são adicionados à conta do vendedor
- [ ] Transações são registradas para ambos

## 💵 Testes de Monetização

### Ativar Modo Monetizado
- [ ] Usuário com 0 bots não pode monetizar
- [ ] Usuário com 1 bot não pode monetizar
- [ ] Usuário com 2 bots pode monetizar
- [ ] Modo monetizado é ativado automaticamente
- [ ] Usuário vê status de monetização no dashboard

### Preços de Bots
- [ ] Bots antigos continuam grátis após monetização
- [ ] Novos bots podem ter preço definido
- [ ] Preço é exibido corretamente
- [ ] Preço é validado (não pode ser negativo)

## 🔐 Testes de Segurança

### Validação de Entrada
- [ ] Campos obrigatórios são validados
- [ ] Tamanho de arquivo é validado (máximo 50MB)
- [ ] Tipo de arquivo é validado (apenas ZIP)
- [ ] Email é validado (formato correto)
- [ ] Senha tem requisitos mínimos

### Autenticação
- [ ] Usuários não autenticados não podem acessar dashboard
- [ ] Usuários não autenticados não podem publicar bots
- [ ] Usuários não autenticados não podem comprar bots
- [ ] Tokens expiram corretamente

### Autorização
- [ ] Usuário não pode editar bot de outro usuário
- [ ] Usuário não pode deletar bot de outro usuário
- [ ] Admin pode gerenciar qualquer bot
- [ ] Admin pode conceder Bites

## 🌐 Testes de API

### Endpoint: /health
- [ ] Retorna status 200
- [ ] Retorna JSON válido
- [ ] Inclui timestamp

### Endpoint: /api/bots/validate-zip
- [ ] Valida ZIP válido
- [ ] Rejeita arquivo não-ZIP
- [ ] Rejeita ZIP vazio
- [ ] Retorna lista de arquivos

### Endpoint: /api/bots/extract-info
- [ ] Extrai bot.json
- [ ] Extrai config.json
- [ ] Retorna metadados corretos
- [ ] Funciona com ZIP sem config

### Endpoint: /api/bots/process
- [ ] Processa bot corretamente
- [ ] Valida arquivo
- [ ] Retorna informações corretas
- [ ] Rejeita usuário não autenticado

## 📱 Testes de Responsividade

### Desktop (1920x1080)
- [ ] Layout está correto
- [ ] Navegação funciona
- [ ] Formulários são usáveis
- [ ] Imagens carregam corretamente

### Tablet (768x1024)
- [ ] Layout se adapta
- [ ] Menu é acessível
- [ ] Formulários são usáveis
- [ ] Texto é legível

### Mobile (375x667)
- [ ] Layout se adapta
- [ ] Menu é acessível (hamburger)
- [ ] Formulários são usáveis
- [ ] Texto é legível
- [ ] Botões são clicáveis

## ⚡ Testes de Performance

### Carregamento de Página
- [ ] Página inicial carrega em menos de 3 segundos
- [ ] Dashboard carrega em menos de 2 segundos
- [ ] Exploração carrega em menos de 3 segundos

### Operações
- [ ] Upload de arquivo leva menos de 10 segundos
- [ ] Compra de bot é processada em menos de 2 segundos
- [ ] Busca de bots é instantânea

## 🔄 Testes de Integração

### Firebase
- [ ] Autenticação funciona
- [ ] Realtime Database sincroniza
- [ ] Storage salva arquivos
- [ ] Regras de segurança funcionam

### API Python
- [ ] Endpoints respondem corretamente
- [ ] Validação de ZIP funciona
- [ ] Extração de metadados funciona
- [ ] Erro handling funciona

## 📊 Testes de Dados

### Banco de Dados
- [ ] Usuários são salvos corretamente
- [ ] Bots são salvos corretamente
- [ ] Transações são registradas
- [ ] Dados não são duplicados

### Sincronização
- [ ] Dados são sincronizados em tempo real
- [ ] Mudanças aparecem para todos os usuários
- [ ] Não há conflitos de dados

## 🐛 Testes de Erro

### Tratamento de Erros
- [ ] Erros de rede são tratados
- [ ] Erros de validação são exibidos
- [ ] Erros de servidor são tratados
- [ ] Mensagens de erro são claras

### Recuperação
- [ ] Usuário pode tentar novamente após erro
- [ ] Dados não são perdidos após erro
- [ ] Sessão é mantida após erro

## ✅ Checklist Final

Antes de deploy:

- [ ] Todos os testes passaram
- [ ] Nenhum erro no console
- [ ] Performance é aceitável
- [ ] Responsividade funciona
- [ ] Segurança foi verificada
- [ ] Documentação está atualizada
- [ ] Código foi revisado
- [ ] Variáveis de ambiente estão configuradas

---

Desenvolvido com ❤️ pela Bite
