import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT cat_id, cat_nome FROM categoria_produto ORDER BY cat_nome"
    );
    return NextResponse.json({ categorias: result.rows });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
