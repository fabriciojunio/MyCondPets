# Como Contribuir

## Configuração do Ambiente

1. Fork e clone o repositório
2. `npm install`
3. Copie `.env.example` para `.env.local` e configure as variáveis
4. Execute os scripts SQL em `/DB/scriptsSQL.sql`
5. `npm run dev`

## Padrão de Commits (Conventional Commits em português)

```
feat: adicionar campo de vacinação no perfil do pet
fix: corrigir validação de CPF do tutor
docs: atualizar instruções de instalação
test: adicionar testes para rota de cadastro de pet
refactor: extrair lógica de upload para serviço dedicado
```

## Testes

```bash
npm test          # executa todos os testes
npm run lint      # verifica o código
```
