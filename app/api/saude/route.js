import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";

// GET /api/saude?pet_id=X
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pet_id = searchParams.get("pet_id");
  if (!pet_id) return NextResponse.json({ error: "pet_id obrigatório" }, { status: 400 });

  const client = await getClient();
  try {
    const result = await client.query(
      "SELECT * FROM saude_pet WHERE pet_id = $1",
      [pet_id]
    );
    return NextResponse.json({ saude: result.rows[0] || null });
  } finally {
    client.release();
  }
}

// POST /api/saude — criar ou atualizar saúde do pet (upsert)
export async function POST(request) {
  const body = await request.json();
  const { pet_id, sau_doencas, sau_contagiosas, sau_alergias, sau_medicacao, sau_comportamento } = body;

  if (!pet_id) return NextResponse.json({ error: "pet_id obrigatório" }, { status: 400 });

  const client = await getClient();
  try {
    const result = await client.query(
      `INSERT INTO saude_pet (pet_id, sau_doencas, sau_contagiosas, sau_alergias, sau_medicacao, sau_comportamento)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (pet_id) DO UPDATE SET
         sau_doencas = EXCLUDED.sau_doencas,
         sau_contagiosas = EXCLUDED.sau_contagiosas,
         sau_alergias = EXCLUDED.sau_alergias,
         sau_medicacao = EXCLUDED.sau_medicacao,
         sau_comportamento = EXCLUDED.sau_comportamento
       RETURNING *`,
      [pet_id, sau_doencas || null, sau_contagiosas || null, sau_alergias || null, sau_medicacao || null, sau_comportamento || null]
    );
    return NextResponse.json({ saude: result.rows[0] }, { status: 201 });
  } finally {
    client.release();
  }
}
