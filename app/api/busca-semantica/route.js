import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";
import { gerarEmbedding, formatarEmbedding } from "@/app/_lib/embeddings";

// GET /api/busca-semantica?q=cachorro+caramelo+perdido
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ error: "Consulta muito curta." }, { status: 400 });
  }

  const embedding = await gerarEmbedding(q);
  if (!embedding) {
    return NextResponse.json(
      { error: "Serviço de busca indisponível no momento. Tente novamente." },
      { status: 503 }
    );
  }

  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT
         n.not_id,
         n.not_titulo,
         n.not_conteudo,
         n.not_data_publicacao,
         n.not_foto,
         n.not_status,
         n.not_tipo_animal,
         d.don_nome,
         d.don_contato,
         d.don_email,
         1 - (n.embedding <=> $1::vector) AS similaridade
       FROM noticias n
       JOIN dono d ON n.don_id = d.don_id
       WHERE n.embedding IS NOT NULL
       ORDER BY n.embedding <=> $1::vector
       LIMIT 9`,
      [formatarEmbedding(embedding)]
    );

    const noticias = result.rows.map((row) => ({
      id: row.not_id,
      titulo: row.not_titulo,
      descricao: row.not_conteudo,
      data: row.not_data_publicacao,
      dono: row.don_nome,
      donoEmail: row.don_email,
      contato: row.don_contato || "Sem contato",
      imagem: row.not_foto,
      status: row.not_status || "aberto",
      tipoAnimal: row.not_tipo_animal || null,
      similaridade: Math.round(row.similaridade * 100),
    }));

    return NextResponse.json({ noticias });
  } finally {
    client.release();
  }
}
