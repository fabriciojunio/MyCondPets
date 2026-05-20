import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/authOptions";

export async function POST(request) {
  try {
    const body = await request.json();
    const { itens, nome, email, telefone, endereco } = body;

    if (!itens || itens.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // Tenta pegar a sessão (opcional — compra sem login permitida)
    let don_id = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const donRes = await pool.query(
          "SELECT don_id FROM dono WHERE don_email = $1",
          [session.user.email]
        );
        if (donRes.rows.length > 0) don_id = donRes.rows[0].don_id;
      }
    } catch {}

    // Valida produtos e calcula total
    const ids = itens.map((i) => i.prod_id);
    const prodRes = await pool.query(
      "SELECT prod_id, prod_preco, prod_estoque FROM produto WHERE prod_id = ANY($1) AND prod_ativo = TRUE",
      [ids]
    );

    const prodMap = {};
    prodRes.rows.forEach((p) => { prodMap[p.prod_id] = p; });

    let total = 0;
    for (const item of itens) {
      const prod = prodMap[item.prod_id];
      if (!prod) return NextResponse.json({ error: `Produto ${item.prod_id} não encontrado` }, { status: 400 });
      if (prod.prod_estoque < item.quantidade) {
        return NextResponse.json({ error: `Estoque insuficiente para produto ${item.prod_id}` }, { status: 400 });
      }
      total += Number(prod.prod_preco) * item.quantidade;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Cria pedido
      const pedRes = await client.query(
        `INSERT INTO pedido (don_id, ped_total, ped_nome, ped_email, ped_telefone, ped_endereco)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ped_id`,
        [don_id, total.toFixed(2), nome, email, telefone, endereco]
      );
      const ped_id = pedRes.rows[0].ped_id;

      // Insere itens e atualiza estoque
      for (const item of itens) {
        const prod = prodMap[item.prod_id];
        await client.query(
          "INSERT INTO item_pedido (ped_id, prod_id, item_qtd, item_preco) VALUES ($1, $2, $3, $4)",
          [ped_id, item.prod_id, item.quantidade, prod.prod_preco]
        );
        await client.query(
          "UPDATE produto SET prod_estoque = prod_estoque - $1 WHERE prod_id = $2",
          [item.quantidade, item.prod_id]
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ pedido_id: ped_id, total: total.toFixed(2) }, { status: 201 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
