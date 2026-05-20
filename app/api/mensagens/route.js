import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";
import { moderar } from "@/app/_lib/moderacao";

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS mensagens (
      msg_id           SERIAL PRIMARY KEY,
      not_id           INTEGER NOT NULL,
      msg_destinatario VARCHAR(100),
      msg_remetente    VARCHAR(100) DEFAULT 'Anônimo',
      msg_texto        TEXT NOT NULL,
      msg_lida         BOOLEAN DEFAULT FALSE,
      msg_data         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// POST /api/mensagens
export async function POST(request) {
  const body = await request.json();
  const { not_id, msg_destinatario, msg_remetente, msg_texto } = body;

  if (!not_id || !msg_texto) {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  }

  const mod = moderar(msg_texto);
  if (!mod.ok) {
    return NextResponse.json({ error: mod.motivo }, { status: 422 });
  }

  const client = await getClient();
  try {
    await ensureTable(client);
    await client.query(
      `INSERT INTO mensagens (not_id, msg_destinatario, msg_remetente, msg_texto)
       VALUES ($1, $2, $3, $4)`,
      [not_id, msg_destinatario || "", msg_remetente || "Anônimo", msg_texto.trim()]
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } finally {
    client.release();
  }
}

// GET /api/mensagens?destinatario=X  (para futura caixa de entrada)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dest = searchParams.get("destinatario");
  if (!dest) return NextResponse.json({ error: "destinatario obrigatório" }, { status: 400 });

  const client = await getClient();
  try {
    await ensureTable(client);
    const result = await client.query(
      `SELECT * FROM mensagens WHERE msg_destinatario = $1 ORDER BY msg_data DESC`,
      [dest]
    );
    return NextResponse.json({ mensagens: result.rows });
  } finally {
    client.release();
  }
}
