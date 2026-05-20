import { NextResponse } from "next/server";
import pool from "../../_lib/db";

export async function GET() {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query(`
  SELECT 
    d.don_id as id,
    d.don_nome as name,
    d.don_email as email,
    d.don_contato as contact,
    COALESCE(a.adm_tipo, 'USER') as userType,
    CASE WHEN a.don_id IS NOT NULL THEN true ELSE false END as isAdmin,
    CASE WHEN a.adm_tipo = 'MASTER' THEN true ELSE false END as isMaster
  FROM dono d
  LEFT JOIN "Administrativo" a ON d.don_id = a.don_id
  ORDER BY d.don_nome ASC
`);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar administradores:", error);
    return NextResponse.json(
      { error: "Erro ao buscar administradores" },
      { status: 500 },
    );
  } finally {
    if (client) client.release();
  }
}

export async function PUT(request) {
  let client;

  try {
    const { userId, isAdmin } = await request.json();
    client = await pool.connect();

    if (isAdmin) {
      await client.query(
        `INSERT INTO "Administrativo" (don_id, adm_tipo) VALUES ($1, $2)
         ON CONFLICT (don_id) DO UPDATE SET adm_tipo = $2`,
        [userId, "ADMIN"],
      );
    } else {
      await client.query(
        `DELETE FROM "Administrativo" WHERE don_id = $1 AND adm_tipo != 'MASTER'`,
        [userId],
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar permissões:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar permissões" },
      { status: 500 },
    );
  } finally {
    if (client) client.release();
  }
}
