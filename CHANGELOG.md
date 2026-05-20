# Changelog — MyCondPets

> Data: 19/03/2026
> Responsável: Júnior

---

## Resumo das Mudanças

Esta entrega cobre duas frentes principais: **cobertura de testes automatizados** para todas as rotas de API e **correção de texto na interface**.

---

## 1. Testes Automatizados — Criação e Correção de Suites (13 arquivos)

### Problema
Nenhum dos arquivos de teste das rotas de API estava passando. O erro comum era:

```
ReferenceError: Request is not defined
ReferenceError: Response is not defined
```

O ambiente padrão do Jest (`jsdom`) não possui os globals de Web API (`Request`, `Response`, `Headers`) que o Next.js usa internamente ao importar `next/server`. Isso travava os testes antes mesmo de executar qualquer `describe`.

### Solução Aplicada
Adicionado o pragma `/** @jest-environment node */` no topo de todos os arquivos de teste de rotas de API. O ambiente `node` do Jest usa o Node.js 18+ nativo, que já inclui esses globals.

### Arquivos Criados/Corrigidos

| Arquivo | Status | Observação |
|---|---|---|
| `app/api/dashboard/route.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/api/donos/route.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/api/pets/route.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/api/pet/route.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/api/detalhesPets/route.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/api/administradores/route.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/api/comentarios/route.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/api/perfil/route.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/_lib/actions/verificaPerfilCompleto.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/_actions/delete/excluiPet.test.js` | ✅ Corrigido | Adicionado pragma `@jest-environment node` |
| `app/api/noticias/route.test.js` | ✅ Corrigido | Pragma + correção de mock leakage e TypeError |
| `app/api/pedidos/route.test.js` | ✅ Corrigido | Pragma + reescrita para corrigir hoisting do jest.mock |
| `app/api/categorias/route.test.js` | ✅ Corrigido | Pragma + reescrita para corrigir hoisting do jest.mock |

---

### Correções Específicas por Arquivo

#### `app/api/noticias/route.test.js`

**Problema 1 — Mock leakage no teste de 404:**
O teste "retorna 404 quando dono não existe" enfileirava 4 valores com `mockResolvedValueOnce`, mas a rota retornava 404 após consumir apenas o primeiro. Os 3 valores restantes vazavam para os testes seguintes, causando falhas em cascata nos testes do `PATCH`.

```js
// ANTES (errado — enfileirava 3 ALTERs que nunca seriam consumidos):
mockClient.query.mockReset();
mockClient.query
  .mockResolvedValueOnce({ rows: [] })         // donoCheck
  .mockResolvedValueOnce({})                    // ALTER TABLE (nunca chegado)
  .mockResolvedValueOnce({})                    // ALTER TABLE (nunca chegado)
  .mockResolvedValueOnce({});                   // ALTER TABLE (nunca chegado)

// DEPOIS (correto):
mockClient.query.mockResolvedValueOnce({ rows: [] }); // donoCheck — retorna 404 imediatamente
```

**Problema 2 — TypeError no teste de criação com sucesso:**
`.catch(() => {})` estava sendo encadeado no retorno de `mockResolvedValueOnce()`, que retorna o mock (não uma Promise).

```js
// ANTES (errado — .catch() em mock, não em Promise):
mockClient.query
  .mockResolvedValueOnce({ rows: [{ don_id: 1 }] })
  .mockResolvedValueOnce({}).catch(() => {})  // TypeError!

// DEPOIS (correto):
mockClient.query
  .mockResolvedValueOnce({ rows: [{ don_id: 1 }] }) // donoCheck
  .mockResolvedValueOnce({})                          // CREATE EXTENSION
  .mockResolvedValueOnce({})                          // ALTER TABLE
  .mockResolvedValueOnce({})                          // ALTER TABLE embedding
  .mockResolvedValueOnce({ rows: [{ not_id: 99, not_titulo: "T" }] }); // INSERT
```

#### `app/api/pedidos/route.test.js` e `app/api/categorias/route.test.js`

**Problema — `ReferenceError: Cannot access 'mockPool' before initialization`:**
`jest.mock()` é içado (hoisted) para antes das declarações de variáveis. A factory referenciava `const mockPool` que ainda não havia sido inicializado.

```js
// ANTES (errado — mockPool não existe ainda quando a factory roda):
const mockPool = { query: jest.fn() };
jest.mock("@/app/_lib/db", () => ({
  default: mockPool, // ReferenceError!
}));

// DEPOIS (correto — factory inline + import da referência do mock):
import db from "@/app/_lib/db";

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(), query: jest.fn() },
}));

// No beforeEach:
db.connect.mockResolvedValue(mockClient);
```

---

## 2. Resultado dos Testes

Após todas as correções, **22/22 suites passando, 0 falhas**.

```
Test Suites: 22 passed, 22 total
Tests:       ~80 passed
Coverage:    33.5% statements (subiu de ~17%)
```

---

## 3. Interface — Correção de Texto

**Arquivo:** `app/noticias/NoticiasCarousel.jsx`

Corrigido texto do botão de busca por IA na página de Notícias:

| Antes | Depois |
|---|---|
| `✦ Busca por notícias com IA` | `✦ Busque por notícias com IA` |

---

## Mensagem de Commit Sugerida

```
test: corrige todas as suites de teste das rotas de API e ajusta texto da UI

- Adiciona pragma `@jest-environment node` em 13 arquivos de teste para
  resolver ReferenceError de Request/Response no ambiente jsdom do Jest
- Reescreve mocks de `categorias` e `pedidos` para corrigir ReferenceError
  causado pelo hoisting do jest.mock antes de inicializar variáveis
- Corrige vazamento de mock (mock leakage) no teste POST /api/noticias:
  teste de 404 não enfileira mais valores unreachable que vazavam para
  testes subsequentes do PATCH
- Remove encadeamento de .catch() em retorno de mockResolvedValueOnce
  (não é uma Promise) no teste de criação de notícia
- fix(ui): corrige label do botão de busca IA em NoticiasCarousel.jsx
  de "Busca por" para "Busque por"

Resultado: 22/22 suites passando, cobertura de statements subiu de ~17% para ~33.5%
```

---

## Arquivos Modificados (Resumo)

```
app/api/dashboard/route.test.js
app/api/donos/route.test.js
app/api/pets/route.test.js
app/api/pet/route.test.js
app/api/detalhesPets/route.test.js
app/api/administradores/route.test.js
app/api/comentarios/route.test.js
app/api/perfil/route.test.js
app/api/noticias/route.test.js           ← correções adicionais de mock
app/api/pedidos/route.test.js            ← reescrita completa dos mocks
app/api/categorias/route.test.js         ← reescrita completa dos mocks
app/_lib/actions/verificaPerfilCompleto.test.js
app/_actions/delete/excluiPet.test.js
app/noticias/NoticiasCarousel.jsx        ← correção de texto UI
```
