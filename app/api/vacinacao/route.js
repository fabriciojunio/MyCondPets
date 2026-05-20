import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS vacinacao (
      vac_id SERIAL PRIMARY KEY,
      pet_id INTEGER NOT NULL,
      vac_tipo VARCHAR(50),
      vac_data_aplicacao DATE,
      vac_data_vencimento DATE,
      vac_carteira TEXT
    )
  `);
}

// GET /api/vacinacao?pet_id=X
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pet_id = searchParams.get("pet_id");
  if (!pet_id) return NextResponse.json({ error: "pet_id obrigatório" }, { status: 400 });

  let client;
  try {
    client = await getClient();
    await ensureTable(client);
    const result = await client.query(
      `SELECT *,
        CASE
          WHEN vac_data_vencimento < CURRENT_DATE THEN 'atrasada'
          WHEN vac_data_vencimento <= CURRENT_DATE + INTERVAL '30 days' THEN 'vencendo'
          ELSE 'em_dia'
        END AS vac_status
       FROM vacinacao WHERE pet_id = $1 ORDER BY vac_data_vencimento`,
      [pet_id]
    );
    return NextResponse.json({ vacinas: result.rows });
  } catch {
    return NextResponse.json({ vacinas: [] }, { status: 200 });
  } finally {
    if (client) client.release();
  }
}

// POST /api/vacinacao — criar vacina
export async function POST(request) {
  const body = await request.json();
  const { pet_id, vac_tipo, vac_data_aplicacao, vac_data_vencimento, vac_carteira } = body;

  if (!pet_id || !vac_tipo || !vac_data_aplicacao || !vac_data_vencimento) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  let client;
  try {
    client = await getClient();
    await ensureTable(client);
    const result = await client.query(
      `INSERT INTO vacinacao (pet_id, vac_tipo, vac_data_aplicacao, vac_data_vencimento, vac_carteira)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [pet_id, vac_tipo, vac_data_aplicacao, vac_data_vencimento, vac_carteira || null]
    );
    return NextResponse.json({ vacina: result.rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar vacina" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

// DELETE /api/vacinacao?vac_id=X
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const vac_id = searchParams.get("vac_id");
  if (!vac_id) return NextResponse.json({ error: "vac_id obrigatório" }, { status: 400 });

  let client;
  try {
    client = await getClient();
    await ensureTable(client);
    await client.query("DELETE FROM vacinacao WHERE vac_id = $1", [vac_id]);
    return NextResponse.json({ message: "Vacina removida" });
  } catch {
    return NextResponse.json({ error: "Erro ao remover vacina" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
