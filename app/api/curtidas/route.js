import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/authOptions";

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS curtidas (
      cur_id    SERIAL PRIMARY KEY,
      not_id    INTEGER NOT NULL,
      cur_email VARCHAR(200) NOT NULL,
      cur_data  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(not_id, cur_email)
    )
  `);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const not_id = searchParams.get("not_id");
  if (!not_id) return NextResponse.json({ error: "not_id obrigatório" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const emailUsuario = session?.user?.email || null;

  const client = await pool.connect();
  try {
    await ensureTable(client);
    const totalRes = await client.query("SELECT COUNT(*) AS total FROM curtidas WHERE not_id = $1", [not_id]);
    const total = parseInt(totalRes.rows[0].total, 10);
    let curtiu = false;
    if (emailUsuario) {
      const curtiuRes = await client.query("SELECT 1 FROM curtidas WHERE not_id = $1 AND cur_email = $2", [not_id, emailUsuario]);
      curtiu = curtiuRes.rows.length > 0;
    }
    return NextResponse.json({ total, curtiu });
  } finally {
    client.release();
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Você precisa estar logado para curtir." }, { status: 401 });
  }
  const body = await request.json();
  const { not_id } = body;
  if (!not_id) return NextResponse.json({ error: "not_id obrigatório" }, { status: 400 });

  const emailUsuario = session.user.email;
  const client = await pool.connect();
  try {
    await ensureTable(client);
    const existeRes = await client.query("SELECT cur_id FROM curtidas WHERE not_id = $1 AND cur_email = $2", [not_id, emailUsuario]);
    if (existeRes.rows.length > 0) {
      await client.query("DELETE FROM curtidas WHERE not_id = $1 AND cur_email = $2", [not_id, emailUsuario]);
    } else {
      await client.query("INSERT INTO curtidas (not_id, cur_email) VALUES ($1, $2) ON CONFLICT DO NOTHING", [not_id, emailUsuario]);
    }
    const totalRes = await client.query("SELECT COUNT(*) AS total FROM curtidas WHERE not_id = $1", [not_id]);
    const total = parseInt(totalRes.rows[0].total, 10);
    const curtiu = existeRes.rows.length === 0;
    return NextResponse.json({ total, curtiu });
  } finally {
    client.release();
  }
}