import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";

// ══════════════════════════════════════════════════════
//  BUSCA IA LOCAL — sem API externa, sem custo
//  Algoritmo: tokenização + sinônimos PT-BR + scoring
// ══════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  "de","do","da","dos","das","um","uma","uns","umas","o","a","os","as",
  "e","é","em","no","na","nos","nas","por","para","com","que","se",
  "ao","às","pelo","pela","pelos","pelas","ou","mas","eu","me","meu",
  "minha","meus","minhas","seu","sua","seus","suas","como","mais","muito",
  "bem","já","qual","quero","busco","preciso","tem","há","ter","para","esse",
  "essa","este","esta","esses","essas","estes","estas",
]);

// Sinônimos e expansões semânticas PT-BR para pet shop
const SINONIMOS = {
  // Cores
  "vermelho":    ["vermelha","vermelhas","vermelhos","red","encarnado"],
  "azul":        ["azuis","blue","navy","marinho"],
  "amarelo":     ["amarela","amarelas","amarelos","gold","dourado"],
  "verde":       ["verdes","green"],
  "rosa":        ["rosas","pink","lilás","lilás"],
  "marrom":      ["marrons","castanho","castanha","café","café","chocolate"],
  "preto":       ["preta","pretas","pretos","black","negro","negra"],
  "branco":      ["branca","brancas","brancos","white"],
  "laranja":     ["laranjas","orange"],
  "cinza":       ["cinzas","grey","gray"],

  // Padrões
  "bolinha":     ["bolinhas","bolinha","bola","bolas","poa","poas","poá","polka","dot","dots","pintinha","pintinhas"],
  "floral":      ["flores","florido","florida","florais","flower","flowers"],
  "listrado":    ["listrada","listras","listra","stripe","stripes","xadrez"],

  // Tipos de produtos
  "coleira":     ["coleiras","collar"],
  "guia":        ["guias","trela","trelas","lead","leash"],
  "cama":        ["camas","caminha","caninhas","almofada","almofadas","colchão"],
  "brinquedo":   ["brinquedos","toy","toys","brincar"],
  "ração":       ["rações","comida","alimento","alimentos","feed"],
  "shampoo":     ["sabonete","banho","higiene"],
  "roupa":       ["roupas","vestuário","veste","blusa","camiseta"],
  "mochila":     ["mochilas","bolsa","bolsas","bag","carrier"],
  "casinha":     ["casinhas","abrigo","abrigos","casa"],

  // Animais
  "cachorro":    ["cão","cães","dog","dogs","canino","caninos","pet"],
  "gato":        ["gatos","cat","cats","felino","felinos","gatinho","gatinhos"],
  "pet":         ["animal","animais","bichinho","bichinhos"],

  // Materiais
  "couro":       ["couros","leather","corium"],
  "nylon":       ["náilon","nilón"],
  "borracha":    ["borrachas","rubber","látex"],
  "tecido":      ["tecidos","pano","algodão","cotton"],
  "sisal":       ["sisal"],
  "pelúcia":     ["pelúcias","plush","macio"],

  // Tamanhos
  "pequeno":     ["pequena","pequenos","pequenas","mini","p","filhote","filhotes"],
  "médio":       ["média","médios","médias","m"],
  "grande":      ["grande","grandes","g","porte grande"],

  // Funcional
  "led":         ["luminoso","luminosa","luz","iluminado","noturno","noturna"],
  "retrátil":    ["extensível","extensivel","retratil"],
  "impermeável": ["impermeavel","resistente","chuva","água"],
  "ortopédico":  ["ortopedico","ortopédica","ortopedica","conforto"],
  "natural":     ["naturais","orgânico","orgânica","sem conservantes"],
  "antipulgas":  ["antipulga","repelente","carrapato","carrapatos","pulga","pulgas"],
};

/** Normaliza texto: minúsculo + remove acentos + pontuação */
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

/** Tokeniza e remove stop words */
function tokenizar(texto) {
  return normalizar(texto)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** Expande tokens com sinônimos */
function expandirTokens(tokens) {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    // Verifica se o token é uma chave
    if (SINONIMOS[token]) {
      SINONIMOS[token].forEach((s) => expanded.add(normalizar(s)));
    }
    // Verifica se o token está nos valores (busca reversa)
    for (const [chave, valores] of Object.entries(SINONIMOS)) {
      if (valores.map(normalizar).includes(token)) {
        expanded.add(normalizar(chave));
        valores.forEach((s) => expanded.add(normalizar(s)));
      }
    }
  }
  return [...expanded];
}

/** Calcula score de um produto para a query */
function calcularScore(produto, queryTokens, queryExpandida) {
  const campos = {
    tags:      { texto: normalizar(produto.prod_tags || ""),      peso: 3 },
    nome:      { texto: normalizar(produto.prod_nome || ""),      peso: 2 },
    descricao: { texto: normalizar(produto.prod_descricao || ""), peso: 1 },
    categoria: { texto: normalizar(produto.cat_nome || ""),       peso: 1.5 },
  };

  let score = 0;
  let matchCount = 0;

  for (const token of queryExpandida) {
    for (const [, { texto, peso }] of Object.entries(campos)) {
      if (texto.includes(token)) {
        score += peso;
        matchCount++;
      }
    }
  }

  // Bônus: match de frase completa (tokens da query originais todos presentes no nome)
  const nomeNorm = campos.nome.texto;
  const todosNoNome = queryTokens.every((t) => nomeNorm.includes(t));
  if (todosNoNome && queryTokens.length > 1) score += 5;

  // Bônus: match de frase completa nas tags
  const tagsNorm = campos.tags.texto;
  const todosNasTags = queryTokens.every((t) => tagsNorm.includes(t));
  if (todosNasTags && queryTokens.length > 1) score += 4;

  // Penaliza sem estoque
  if (produto.prod_estoque <= 0) score *= 0.3;

  return { score, matchCount };
}

/** Gera interpretação legível da query */
function gerarInterpretacao(queryOriginal, tokens, expandidos) {
  const extras = expandidos.filter((t) => !tokens.includes(t)).slice(0, 5);
  if (extras.length === 0) return `Resultados para: "${queryOriginal}"`;
  return `Buscando por "${queryOriginal}" — também considerando: ${extras.join(", ")}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Consulta muito curta" }, { status: 400 });
    }

    // 1. Busca todos os produtos ativos
    const prodResult = await pool.query(`
      SELECT
        p.prod_id, p.prod_nome, p.prod_descricao,
        p.prod_preco, p.prod_estoque, p.prod_imagem,
        p.prod_tags, p.prod_ativo,
        c.cat_nome
      FROM produto p
      LEFT JOIN categoria_produto c ON p.cat_id = c.cat_id
      WHERE p.prod_ativo = TRUE
      ORDER BY p.prod_id
    `);

    const produtos = prodResult.rows;

    if (produtos.length === 0) {
      return NextResponse.json({ produtos: [], interpretacao: "Nenhum produto cadastrado.", total: 0 });
    }

    // 2. Processa a query
    const queryTokens   = tokenizar(query);
    const queryExpandida = expandirTokens(queryTokens);

    // 3. Calcula score para cada produto
    const scored = produtos
      .map((p) => {
        const { score, matchCount } = calcularScore(p, queryTokens, queryExpandida);
        return { produto: p, score, matchCount };
      })
      .filter(({ matchCount }) => matchCount > 0)
      .sort((a, b) => b.score - a.score);

    const produtosOrdenados = scored.map(({ produto }) => produto);

    // 4. Fallback: se não encontrou nada, faz ILIKE no banco
    if (produtosOrdenados.length === 0) {
      const q = `%${query}%`;
      const res = await pool.query(
        `SELECT p.*, c.cat_nome FROM produto p
         LEFT JOIN categoria_produto c ON p.cat_id = c.cat_id
         WHERE p.prod_ativo = TRUE AND (
           p.prod_nome ILIKE $1 OR p.prod_tags ILIKE $1 OR p.prod_descricao ILIKE $1
         ) ORDER BY p.prod_id LIMIT 20`,
        [q]
      );
      return NextResponse.json({
        produtos: res.rows,
        interpretacao: `Resultados para: "${query}"`,
        total: res.rows.length,
      });
    }

    const interpretacao = gerarInterpretacao(query, queryTokens, queryExpandida);

    return NextResponse.json({
      produtos: produtosOrdenados,
      interpretacao,
      total: produtosOrdenados.length,
    });

  } catch (error) {
    console.error("Erro na busca IA local:", error);
    return NextResponse.json({ error: "Erro na busca" }, { status: 500 });
  }
}
