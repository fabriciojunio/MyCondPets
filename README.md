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

## Como rodar localmente

### Pré-requisitos

- **Node.js** 18+
- Conta no **Supabase** (banco de dados PostgreSQL gratuito)
- Credenciais no **Google Cloud Console** (OAuth)
- Token no **Hugging Face** (busca semântica: opcional)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/fabriciojunio/MyCondPets.git
cd MyCondPets

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais (veja a seção abaixo)

# 4. Execute o schema do banco de dados
# No painel do Supabase, acesse SQL Editor e execute o arquivo:
# DB/scriptsSQL.sql

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de Ambiente

Edite `.env.local` com suas credenciais:

```env
# Supabase: crie um projeto em https://supabase.com
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth.js: gere um secret com: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# Google OAuth: crie em https://console.cloud.google.com
# URI de redirecionamento: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"

# Hugging Face: token em https://huggingface.co/settings/tokens
HF_TOKEN="hf_seu_token_aqui"

# API Keys internas (formato: chave:label)
MYCONDPETS_API_KEYS="api-key-1:admin"
MYCONDPETS_ALLOWED_ORIGINS="http://localhost:3000"
```

## Deploy

O projeto está implantado na Vercel: [mycondpets.vercel.app](https://mycondpets.vercel.app)

## Licença

MIT
