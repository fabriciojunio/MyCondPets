"use server";

import pool from "@/app/_lib/db";

export async function excluiPET(request) {
  const { pet_nome, don_cpf } = await request.json();

  if (!pet_nome || !don_cpf) {
    return new Response(JSON.stringify({ error: "Dados inválidos" }), { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query("DELETE FROM pet WHERE pet_nome = $1 AND don_cpf = $2;", [
      pet_nome,
      don_cpf,
    ]);

    return new Response(JSON.stringify({ message: "Pet excluído com sucesso" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao excluir pet" }), { status: 500 });
  } finally {
    client.release();
  }
}
