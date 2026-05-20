<div align="center">

# MyCondPets

### Organização, segurança e carinho em cada patinha!

Plataforma de gerenciamento de pets para condomínios residenciais — registre, gerencie e conecte tutores e seus animais de estimação em uma comunidade segura.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?style=flat-square&logo=postgresql)
![NextAuth](https://img.shields.io/badge/NextAuth.js-4.24-purple?style=flat-square)

</div>

---

## Sobre o Projeto

O **MyCondPets** é uma aplicação web desenvolvida para facilitar a convivência em condomínios com pets. A plataforma permite que moradores cadastrem seus animais de estimação, mantenham perfis atualizados e se comuniquem com a comunidade por meio de um mural de notícias — ideal para alertas de pets perdidos ou encontrados.

Administradores do condomínio têm acesso a um painel com estatísticas e podem consultar todos os pets e seus tutores de forma centralizada.

---

## Funcionalidades

### Para Moradores
- **Login com Google** — autenticação segura via OAuth
- **Perfil do tutor** — cadastro com nome, contato, apartamento e endereço
- **Cadastro de pets** — nome, espécie, raça, data de nascimento, cor, porte, sexo e foto
- **Gerenciamento de pets** — visualize e remova seus pets cadastrados
- **Mural de notícias** — acesse comunicados da comunidade (pets perdidos, encontrados etc.)
- **Publicar notícias** — crie posts com foto e descrição para alertar os vizinhos

### Para Administradores
- **Dashboard** — painel com estatísticas: total de pets, pets perdidos, tutores cadastrados e apartamentos com pets
- **Diretório de pets** — pesquise e visualize todos os pets do condomínio com informações de contato do tutor

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Framework | [Next.js](https://nextjs.org/) 15 (App Router) |
| UI | [React](https://react.dev/) 19 |
| Autenticação | [NextAuth.js](https://next-auth.js.org/) 4.24 + Google OAuth |
| Banco de Dados | [PostgreSQL](https://www.postgresql.org/) (via `pg`) |
| Ícones | [Lucide React](https://lucide.dev/) + [React Icons](https://react-icons.github.io/react-icons/) |
| Testes | [Jest](https://jestjs.io/) + [Testing Library](https://testing-library.com/) |
| Linting | ESLint |
| Gerenciador de pacotes | pnpm |

---

## Estrutura do Projeto

```
MyCondPets/
├── app/
│   ├── api/                          # Rotas de API (serverless)
│   │   ├── auth/[...nextauth]/       # Endpoints de autenticação (NextAuth)
│   │   ├── pets/                     # Listagem de pets
│   │   ├── pet/                      # Operações por pet (ex: deletar)
│   │   ├── perfil/                   # Atualização de perfil
│   │   ├── noticias/                 # CRUD de notícias
│   │   ├── donos/                    # Listagem de tutores
│   │   ├── detalhesPets/             # Detalhes com dados do tutor
│   │   ├── dashboard/                # Estatísticas do painel admin
│   │   └── administradores/          # Rotas administrativas
│   │
│   ├── _lib/                         # Utilitários do servidor
│   │   ├── db.js                     # Pool de conexão PostgreSQL
│   │   ├── authOptions.js            # Configuração do NextAuth
│   │   └── actions/                  # Server Actions
│   │       ├── buscaOuCriaDono.js    # Busca ou cria tutor no banco
│   │       └── verificaPerfilCompleto.js
│   │
│   ├── components/                   # Componentes reutilizáveis
│   │   ├── header/
│   │   ├── footer/
│   │   ├── login/
│   │   └── authLayout/
│   │
│   ├── cadastropet/                  # Página de cadastro de pet
│   ├── perfilDono/                   # Página de perfil do tutor
│   ├── noticias/                     # Listagem de notícias
│   ├── criarNoticias/                # Criar notícia
│   ├── detalhesPets/                 # Detalhes de pets (admin)
│   ├── telaInicialCond/              # Dashboard administrativo
│   ├── login/                        # Página de login
│   ├── layout.jsx                    # Layout raiz com SessionProvider
│   ├── page.jsx                      # Página inicial
│   └── globals.css
│
├── DB/
│   └── scriptsSQL.sql               # Schema e scripts do banco de dados
│
├── public/
│   └── images/                      # Imagens estáticas e uploads de pets
│
└── middleware.js                     # Proteção de rotas (NextAuth)
```

---

## Banco de Dados

O schema do PostgreSQL possui as seguintes tabelas principais:

| Tabela | Descrição |
|--------|-----------|
| `dono` | Dados do tutor (usuário autenticado) |
| `residencia` | Endereço e apartamento vinculados ao tutor |
| `pet` | Informações do pet vinculado ao tutor |
| `noticias` | Publicações da comunidade |

O script completo de criação está em [DB/scriptsSQL.sql](DB/scriptsSQL.sql).

---

## Como Rodar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) instalado e rodando
- [pnpm](https://pnpm.io/) (ou npm/yarn)
- Credenciais do [Google OAuth](https://console.cloud.google.com/)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/MyCondPets.git
cd MyCondPets
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/mycondpets

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# NextAuth
NEXTAUTH_SECRET=uma_string_secreta_aleatoria
NEXTAUTH_URL=http://localhost:3000
```

> **Dica:** Para gerar um `NEXTAUTH_SECRET` seguro, execute:
> ```bash
> openssl rand -base64 32
> ```

### 4. Configure o banco de dados

```bash
psql -U postgres -c "CREATE DATABASE mycondpets;"
psql -U postgres -d mycondpets -f DB/scriptsSQL.sql
```

### 5. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## Scripts Disponíveis

```bash
pnpm dev            # Inicia o servidor de desenvolvimento
pnpm build          # Gera o build de produção
pnpm start          # Inicia o servidor em modo produção
pnpm lint           # Executa o ESLint
pnpm test           # Executa os testes
pnpm test:watch     # Testes em modo watch
pnpm test:coverage  # Gera relatório de cobertura de testes
```

---

## Configurando o Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth Client ID**
5. Selecione **Web application**
6. Em **Authorized redirect URIs**, adicione:
   - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
   - `https://seu-dominio.com/api/auth/callback/google` (produção)
7. Copie o **Client ID** e **Client Secret** para o `.env.local`

---

## Acesso Administrativo

O painel administrativo é acessado por contas configuradas como administradoras no banco de dados. Administradores têm acesso ao dashboard com estatísticas e ao diretório completo de pets e tutores do condomínio.

---

## Deploy

O projeto está pronto para deploy na [Vercel](https://vercel.com/):

1. Faça o push do projeto para o GitHub
2. Importe o repositório na Vercel
3. Configure as variáveis de ambiente no painel da Vercel
4. Configure um banco PostgreSQL (ex: [Neon](https://neon.tech/), [Supabase](https://supabase.com/))
5. Atualize o `NEXTAUTH_URL` com a URL de produção

---

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

<div align="center">
Feito com carinho para a comunidade de condomínios e seus pets 🐾
</div>
