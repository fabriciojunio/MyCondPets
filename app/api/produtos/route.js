import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");
  const busca = searchParams.get("busca");
  const limite = parseInt(searchParams.get("limite") || "100");

  try {
    let query = `
      SELECT
        p.prod_id,
        p.prod_nome,
        p.prod_descricao,
        p.prod_preco,
        p.prod_estoque,
        p.prod_imagem,
        p.prod_tags,
        c.cat_id,
        c.cat_nome
      FROM produto p
      LEFT JOIN categoria_produto c ON p.cat_id = c.cat_id
      WHERE p.prod_ativo = TRUE
    `;
    const params = [];

    if (categoria && categoria !== "todos") {
      params.push(categoria);
      query += ` AND c.cat_nome = $${params.length}`;
    }

    if (busca) {
      params.push(`%${busca}%`);
      const n = params.length;
      query += ` AND (
        p.prod_nome ILIKE $${n} OR
        p.prod_descricao ILIKE $${n} OR
        p.prod_tags ILIKE $${n}
      )`;
    }

    query += ` ORDER BY p.prod_id LIMIT $${params.length + 1}`;
    params.push(limite);

    const result = await pool.query(query, params);
    return NextResponse.json({ produtos: result.rows });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { prod_nome, prod_descricao, prod_preco, prod_estoque, prod_imagem, prod_tags, cat_id } = body;

    if (!prod_nome || !prod_preco) {
      return NextResponse.json({ error: "Nome e preço obrigatórios" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO produto (prod_nome, prod_descricao, prod_preco, prod_estoque, prod_imagem, prod_tags, cat_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [prod_nome, prod_descricao, prod_preco, prod_estoque || 0, prod_imagem, prod_tags, cat_id]
    );

    return NextResponse.json({ produto: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
