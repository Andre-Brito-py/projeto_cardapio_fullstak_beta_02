# Documentação de Segurança - Sistema Multi-Tenant

## Visão Geral

Este documento descreve as medidas de segurança implementadas no sistema de cardápio digital multi-tenant, garantindo isolamento completo entre lojas e proteção de dados sensíveis.

## 1. Arquitetura de Segurança Multi-Tenant

### 1.1 Isolamento de Dados por Loja

**Implementação:**
- Cada loja possui um `storeId` único que atua como chave de isolamento
- Todos os dados são filtrados automaticamente por `storeId`
- Middleware `multiTenancy.js` garante contexto de loja em todas as operações

**Componentes:**
```javascript
// Middleware de identificação de loja
identifyStore() // Extrai storeId de headers/domínio
addStoreContext() // Injeta storeId nas queries
requireStoreAdmin() // Valida permissões de administrador
```

### 1.2 Isolamento de Arquivos Estáticos

**Estrutura de Diretórios:**
```
uploads/
├── stores/
│   ├── {storeId}/
│   │   ├── foods/
│   │   ├── categories/
│   │   ├── banners/
│   │   └── temp/
│   └── shared/ (arquivos globais)
└── legacy/ (compatibilidade)
```

**Implementação:**
- Upload de arquivos isolado por loja
- Validação de propriedade antes de operações de arquivo
- Fallback para estrutura legada quando necessário

## 2. Sistema de Auditoria e Logs

### 2.1 Modelo de Auditoria

**Campos Principais:**
- `storeId`: Identificação da loja
- `userId`: Usuário que executou a ação
- `action`: Tipo de ação realizada
- `category`: Categoria da operação (food, order, user, etc.)
- `severity`: Nível de criticidade (low, medium, high, critical)
- `previousData`: Estado anterior dos dados
- `newData`: Novo estado dos dados
- `requestInfo`: Informações da requisição (IP, User-Agent)

### 2.2 Middleware de Auditoria

**Funcionalidades:**
- Captura automática de todas as operações
- Mapeamento inteligente de rotas para categorias
- Interceptação de respostas para capturar dados
- Logging de tentativas de login falhadas
- Geração de tags automáticas para facilitar busca

### 2.3 Sistema de Logs Estruturados

**Tipos de Log:**
- `app.log`: Logs gerais da aplicação
- `audit.log`: Logs de auditoria específicos
- `security.log`: Eventos de segurança
- `errors.log`: Erros do sistema
- `warnings.log`: Avisos e alertas
- `performance.log`: Métricas de performance

**Rotação de Logs:**
- Arquivos antigos (>30 dias) são automaticamente removidos
- Logs incluem timestamp, storeId e contexto completo

## 3. Controle de Acesso e Autenticação

### 3.1 Níveis de Permissão

**Super Admin:**
- Acesso completo ao sistema
- Gerenciamento de todas as lojas
- Configurações globais
- Auditoria cross-tenant

**Store Admin:**
- Acesso restrito à própria loja
- Gerenciamento de produtos, pedidos e configurações
- Visualização de logs da própria loja

**Store User:**
- Acesso limitado a funcionalidades específicas
- Sem acesso a configurações administrativas

### 3.2 Middleware de Autenticação

```javascript
// Fluxo de autenticação
identifyStore() → authMultiTenant() → requireStoreAdmin() → addStoreContext()
```

**Validações:**
- Token JWT válido
- Usuário ativo e não suspenso
- Permissões adequadas para a operação
- Contexto de loja correto

## 4. Segurança de Upload de Arquivos

### 4.1 Validações Implementadas

**Tipo de Arquivo:**
- Whitelist de extensões permitidas (.jpg, .jpeg, .png, .webp)
- Validação de MIME type
- Verificação de assinatura de arquivo (magic numbers)

**Tamanho e Limites:**
- Limite máximo por arquivo: 5MB
- Limite de arquivos por loja
- Validação de dimensões de imagem

**Isolamento:**
- Arquivos salvos em diretórios específicos por loja
- Validação de propriedade antes de acesso/exclusão
- Prevenção de path traversal

### 4.2 Limpeza de Arquivos Órfãos

**Processo Automatizado:**
- Verificação periódica de arquivos não referenciados
- Remoção segura com backup temporário
- Log de todas as operações de limpeza

## 5. Proteção Contra Vulnerabilidades

### 5.1 Injeção de Dados

**MongoDB Injection:**
- Sanitização de inputs com mongoose
- Validação de tipos de dados
- Uso de schemas rígidos

**XSS (Cross-Site Scripting):**
- Sanitização de dados de entrada
- Escape de caracteres especiais
- Validação no frontend e backend

### 5.2 CSRF e CORS

**CORS Configuration:**
```javascript
cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-ID']
})
```

**Headers de Segurança:**
- `X-Store-ID`: Identificação da loja
- Validação de origem das requisições
- Rate limiting por IP e loja

## 6. Monitoramento e Alertas

### 6.1 Métricas de Segurança

**Indicadores Monitorados:**
- Tentativas de login falhadas
- Acessos não autorizados
- Operações suspeitas cross-tenant
- Upload de arquivos maliciosos
- Alterações em dados críticos

### 6.2 Sistema de Alertas

**Triggers Automáticos:**
- Múltiplas tentativas de login falhadas
- Acesso a dados de outra loja
- Operações administrativas fora do horário
- Alterações em configurações críticas

## 7. Backup e Recuperação

### 7.1 Estratégia de Backup

**Dados:**
- Backup diário automático por loja
- Retenção de 30 dias
- Backup incremental a cada 6 horas

**Arquivos:**
- Sincronização com storage externo
- Versionamento de arquivos críticos
- Backup de logs de auditoria

### 7.2 Procedimentos de Recuperação

**Cenários Cobertos:**
- Corrupção de dados de uma loja específica
- Perda de arquivos de upload
- Necessidade de rollback de configurações
- Recuperação de logs de auditoria

## 8. Compliance e Regulamentações

### 8.1 LGPD (Lei Geral de Proteção de Dados)

**Implementações:**
- Consentimento explícito para coleta de dados
- Direito ao esquecimento (exclusão de dados)
- Portabilidade de dados
- Log de todas as operações com dados pessoais

### 8.2 Retenção de Dados

**Políticas:**
- Dados de clientes: 5 anos após última interação
- Logs de auditoria: 7 anos
- Dados financeiros: 10 anos
- Arquivos temporários: 30 dias

## 9. Procedimentos de Segurança

### 9.1 Resposta a Incidentes

**Fluxo de Resposta:**
1. Detecção automática via logs
2. Isolamento da loja afetada
3. Análise forense dos logs
4. Notificação dos stakeholders
5. Implementação de correções
6. Relatório pós-incidente

### 9.2 Atualizações de Segurança

**Processo:**
- Monitoramento de vulnerabilidades
- Testes em ambiente isolado
- Deploy gradual com rollback automático
- Validação pós-deploy

## 10. Configurações Recomendadas

### 10.1 Variáveis de Ambiente

```env
# Segurança
JWT_SECRET=<chave-forte-256-bits>
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600

# Auditoria
AUDIT_ENABLED=true
LOG_LEVEL=info
LOG_RETENTION_DAYS=30

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp
UPLOAD_PATH=/uploads/stores
```

### 10.2 Configurações de Produção

**Nginx:**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

**MongoDB:**
```javascript
// Índices de segurança
db.auditLogs.createIndex({ "storeId": 1, "createdAt": -1 })
db.users.createIndex({ "email": 1, "storeId": 1 }, { unique: true })
```

## 11. Checklist de Segurança

### 11.1 Deploy em Produção

- [ ] Variáveis de ambiente configuradas
- [ ] Certificados SSL válidos
- [ ] Firewall configurado
- [ ] Backup automático ativo
- [ ] Monitoramento de logs ativo
- [ ] Rate limiting configurado
- [ ] Headers de segurança aplicados
- [ ] Validação de uploads testada
- [ ] Isolamento multi-tenant verificado
- [ ] Sistema de auditoria funcionando

### 11.2 Manutenção Periódica

- [ ] Revisão de logs de segurança (semanal)
- [ ] Atualização de dependências (mensal)
- [ ] Teste de backup e recuperação (mensal)
- [ ] Auditoria de permissões (trimestral)
- [ ] Penetration testing (semestral)
- [ ] Revisão de políticas de segurança (anual)

## 12. Contatos e Responsabilidades

**Equipe de Segurança:**
- Administrador de Sistema: [email]
- Desenvolvedor Principal: [email]
- Responsável por Compliance: [email]

**Procedimentos de Emergência:**
- Telefone de emergência: [número]
- Email de incidentes: security@empresa.com
- Escalação: CTO → CEO → Jurídico

---

**Última Atualização:** [Data]
**Versão:** 1.0
**Próxima Revisão:** [Data + 6 meses]