import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";
import { moderar } from "@/app/_lib/moderacao";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/authOptions";
import { rateLimit } from "@/app/_lib/rateLimit";

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS comentarios (
      com_id    SERIAL PRIMARY KEY,
      not_id    INTEGER NOT NULL,
      com_autor VARCHAR(100) DEFAULT 'Anônimo',
      com_texto TEXT NOT NULL,
      com_data  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// GET /api/comentarios?not_id=X
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const not_id = searchParams.get("not_id");
  if (!not_id) return NextResponse.json({ error: "not_id obrigatório" }, { status: 400 });

  const client = await getClient();
  try {
    await ensureTable(client);
    const result = await client.query(
      `SELECT com_id, com_autor, com_texto, com_data
       FROM comentarios WHERE not_id = $1
       ORDER BY com_data ASC`,
      [not_id]
    );
    return NextResponse.json({ comentarios: result.rows });
  } finally {
    client.release();
  }
}

// POST /api/comentarios
export async function POST(request) {
  // Requer sessão ativa
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Você precisa estar logado para comentar." }, { status: 401 });
  }

  // Rate limit: máx 10 comentários por minuto por IP
  if (rateLimit(request, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Muitos comentários. Aguarde um momento." }, { status: 429 });
  }

  const body = await request.json();
  const { not_id, com_texto } = body;

  if (!not_id || !com_texto?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  }

  if (com_texto.trim().length > 500) {
    return NextResponse.json({ error: "Comentário muito longo. Máximo 500 caracteres." }, { status: 400 });
  }

  const mod = moderar(com_texto);
  if (!mod.ok) {
    return NextResponse.json({ error: mod.motivo }, { status: 422 });
  }

  // Usa o nome da sessão, não aceita do body
  const com_autor = session.user.name || session.user.email;

  const client = await getClient();
  try {
    await ensureTable(client);
    const result = await client.query(
      `INSERT INTO comentarios (not_id, com_autor, com_texto)
       VALUES ($1, $2, $3) RETURNING *`,
      [not_id, com_autor, com_texto.trim()]
    );
    return NextResponse.json({ comentario: result.rows[0] }, { status: 201 });
  } finally {
    client.release();
  }
}
