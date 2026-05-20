# MyCondPets 🐾

Plataforma web para gestão de pets em condomínios residenciais. Permite que moradores cadastrem seus animais, e o administrador tenha visibilidade completa sobre os pets do condomínio.

## Funcionalidades

- **Login via Google OAuth** com NextAuth.js
- **Cadastro de tutores** com dados de contato e apartamento
- **Registro de pets**: nome, espécie, raça, nascimento, cor, porte, sexo e foto
- **Mural de comunicados** para alertas de perdidos/achados
- **Painel administrativo** com estatísticas: total de pets, perdidos, tutores e apartamentos
- **Busca semântica** com embeddings (Hugging Face)
- **API RESTful** versionada com autenticação por API Key
- **Segurança**: CSP headers, rate limiting, sanitização de inputs

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth.js + Google OAuth |
| Banco de Dados | PostgreSQL via Supabase |
| ORM | Prisma (via raw SQL) |
| IA | Hugging Face (busca semântica) |
| Estilo | Tailwind CSS |
| Testes | Jest + Testing Library |

## Como executar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha as variáveis com suas credenciais

# 3. Executar as migrações SQL
# Execute os scripts em /DB/scriptsSQL.sql no seu banco de dados

# 4. Iniciar o servidor
npm run dev
```

## Variáveis de Ambiente

Consulte o arquivo `.env.example` para as variáveis necessárias.

## Deploy

O projeto está implantado na Vercel: [mycondpets.vercel.app](https://mycondpets.vercel.app)

## Licença

MIT
