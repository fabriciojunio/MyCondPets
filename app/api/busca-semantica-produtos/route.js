import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";
import { gerarEmbedding, formatarEmbedding } from "@/app/_lib/embeddings";

async function ensureProdutoEmbedding(client) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS vector`).catch(() => {});
  await client.query(`
    ALTER TABLE produto ADD COLUMN IF NOT EXISTS embedding vector(384)
  `).catch(() => {});
}

// GET /api/busca-semantica-produtos?q=coleira+vermelha
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Consulta muito curta." }, { status: 400 });
  }

  const embedding = await gerarEmbedding(q);
  if (!embedding) {
    return NextResponse.json({ error: "Serviço IA indisponível. Tente a busca normal." }, { status: 503 });
  }

  const client = await getClient();
  try {
    await ensureProdutoEmbedding(client);

    const result = await client.query(
      `SELECT
         p.prod_id, p.prod_nome, p.prod_descricao,
         p.prod_preco, p.prod_estoque, p.prod_imagem,
         p.prod_tags, p.prod_ativo,
         c.cat_nome,
         1 - (p.embedding <=> $1::vector) AS similaridade
       FROM produto p
       LEFT JOIN categoria_produto c ON p.cat_id = c.cat_id
       WHERE p.prod_ativo = TRUE AND p.embedding IS NOT NULL
       ORDER BY p.embedding <=> $1::vector
       LIMIT 12`,
      [formatarEmbedding(embedding)]
    );

    return NextResponse.json({
      produtos: result.rows,
      total: result.rows.length,
      interpretacao: `Busca semântica IA para: "${q}"`,
    });
  } finally {
    client.release();
  }
}

// POST /api/busca-semantica-produtos/gerar — gera embeddings para todos os produtos sem embedding
export async function POST() {
  const client = await getClient();
  try {
    await ensureProdutoEmbedding(client);

    const { rows: semEmbedding } = await client.query(
      `SELECT prod_id, prod_nome, prod_descricao, prod_tags FROM produto WHERE embedding IS NULL AND prod_ativo = TRUE LIMIT 50`
    );

    let gerados = 0;
    for (const p of semEmbedding) {
      const texto = `${p.prod_nome} ${p.prod_descricao || ""} ${p.prod_tags || ""}`.trim();
      const emb = await gerarEmbedding(texto);
      if (!emb) continue;
      await client.query(
        `UPDATE produto SET embedding = $1 WHERE prod_id = $2`,
        [formatarEmbedding(emb), p.prod_id]
      );
      gerados++;
      // Pequena pausa para não sobrecarregar a API
      await new Promise((r) => setTimeout(r, 200));
    }

    return NextResponse.json({ gerados, total: semEmbedding.length });
  } finally {
    client.release();
  }
}
