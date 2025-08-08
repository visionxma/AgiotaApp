# Controle de Empréstimos - App Nativo

Um aplicativo completo para controle de empréstimos pessoais, desenvolvido com React Native, Expo e Firebase.

## 🚀 Funcionalidades

### Autenticação
- ✅ Login e registro com email/senha
- ✅ Recuperação de senha
- ✅ Função "Lembrar-me"
- ✅ Logout seguro

### Gestão de Devedores
- ✅ Cadastro de devedores
- ✅ Visualização de detalhes
- ✅ Edição de informações
- ✅ Exclusão (apenas sem empréstimos ativos)

### Controle de Empréstimos
- ✅ Criação de empréstimos
- ✅ Cálculo automático de juros
- ✅ Registro de pagamentos (amortizações)
- ✅ Histórico completo de transações
- ✅ Quitação e perdão de dívidas

### Relatórios
- ✅ Dashboard com resumo financeiro
- ✅ Relatórios detalhados por devedor
- ✅ Estatísticas gerais
- ✅ Análise de lucros e perdas

### Funcionalidades Offline
- ✅ **Funcionamento completo offline**
- ✅ **Cache local com AsyncStorage**
- ✅ **Sincronização automática quando online**
- ✅ **Indicador de status de conexão**
- ✅ **Fila de sincronização para operações offline**

## 🔧 Tecnologias

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **Firebase Auth** - Autenticação nativa
- **Firestore** - Banco de dados NoSQL com suporte offline
- **AsyncStorage** - Cache local
- **TypeScript** - Tipagem estática
- **Expo Router** - Navegação
- **Lucide Icons** - Ícones

## 📱 Estrutura do Projeto

```
app/
├── (tabs)/                 # Navegação principal
│   ├── index.tsx          # Dashboard
│   ├── devedores.tsx      # Lista de devedores
│   ├── novo-emprestimo.tsx # Criar empréstimo
│   └── relatorios.tsx     # Relatórios
├── auth/                  # Telas de autenticação
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── devedor/               # Gestão de devedores
│   ├── [id].tsx          # Detalhes do devedor
│   └── novo.tsx          # Cadastrar devedor
├── emprestimo/            # Gestão de empréstimos
│   └── [id].tsx          # Detalhes do empréstimo
└── amortizacao/           # Pagamentos
    └── [id].tsx          # Registrar pagamento

components/                # Componentes reutilizáveis
├── Button.tsx
├── Card.tsx
├── Input.tsx
├── EmprestimoCard.tsx
├── SyncIndicator.tsx
└── OfflineNotice.tsx

utils/                     # Utilitários
├── authNative.ts         # Autenticação Firebase nativa
├── storageNative.ts      # Armazenamento com suporte offline
├── firebaseNative.ts     # Configuração Firebase nativa
├── calculations.ts       # Cálculos financeiros
└── firebase.ts           # Configuração Firebase web (legacy)

contexts/                  # Contextos React
├── AuthContext.tsx       # Contexto de autenticação
└── AuthContextNative.tsx # Implementação nativa
```

## 🔒 Segurança e Privacidade

### Isolamento de Dados
- Cada usuário tem seus dados completamente isolados
- Estrutura: `/users/{userId}/devedores` e `/users/{userId}/emprestimos`
- Regras de segurança do Firestore impedem acesso cruzado

### Autenticação
- Firebase Authentication nativo
- Senhas criptografadas pelo Firebase
- Tokens de sessão seguros
- Logout automático em caso de token expirado

### Dados Offline
- Cache local criptografado
- Sincronização segura quando online
- Limpeza automática do cache no logout

## 📊 Funcionalidades Financeiras

### Cálculo de Juros
- Juros compostos mensais convertidos para diários
- Cálculo automático baseado em dias corridos
- Atualização em tempo real do saldo devedor

### Histórico de Transações
- Registro completo de todas as operações
- Saldo anterior e posterior para cada transação
- Observações personalizadas

### Relatórios
- Resumo financeiro em tempo real
- Análise de performance por devedor
- Projeção de lucros e perdas

## 🌐 Suporte Offline

O aplicativo funciona completamente offline:

1. **Cache Local**: Todos os dados são armazenados localmente
2. **Operações Offline**: Todas as funcionalidades disponíveis sem internet
3. **Sincronização**: Dados são sincronizados automaticamente quando online
4. **Indicadores Visuais**: Status de conexão sempre visível
5. **Fila de Sincronização**: Operações offline são enfileiradas para sincronização

## 🚀 Como Executar

1. Instale as dependências:
```bash
npm install
```

2. Configure o Firebase:
   - Adicione o arquivo `google-services.json` em `android/app/`
   - Configure as regras de segurança do Firestore

3. Execute o projeto:
```bash
npm run android  # Para Android
npm run ios      # Para iOS
npm run dev      # Para desenvolvimento web
```

## 📋 Regras de Segurança do Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regra para dados dos usuários
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcoleções do usuário
      match /{collection}/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 🔄 Fluxo de Sincronização

1. **Online**: Operações são salvas diretamente no Firestore e cache local
2. **Offline**: Operações são salvas no cache local e marcadas para sincronização
3. **Volta Online**: Fila de sincronização é processada automaticamente
4. **Listeners**: Mudanças remotas são sincronizadas em tempo real quando online

## 📱 Compatibilidade

- ✅ Android (nativo)
- ✅ iOS (nativo)
- ✅ Web (modo de desenvolvimento)
- ✅ Modo offline completo
- ✅ Sincronização automática