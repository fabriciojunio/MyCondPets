import pool from "@/app/_lib/db";

export async function DELETE(request) {
  
  const { pet_nome, userEmail } = await request.json();

  if (!pet_nome || !userEmail) {
    return new Response(JSON.stringify({ error: "Dados inválidos" }), { status: 400 });
  }

  const client = await pool.connect();

  try {
    // Buscar o dono pelo email
    const donoResult = await client.query(
      'SELECT don_id FROM dono WHERE don_email = $1;',
      [userEmail]
    );

    if (donoResult.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Dono não encontrado" }), { status: 404 });
    }

    const dono = donoResult.rows[0];

    // Excluir o pet usando don_id (não don_email)
    const deleteResult = await client.query(
      "DELETE FROM pet WHERE pet_nome = $1 AND don_id = $2;",
      [pet_nome, dono.don_id]
    );

    if (deleteResult.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Pet não encontrado" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Pet excluído com sucesso" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao excluir pet:", error);
    return new Response(JSON.stringify({ error: "Erro ao excluir pet" }), { status: 500 });
  } finally {
    client.release();
  }
}