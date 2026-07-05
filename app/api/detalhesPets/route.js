import { getClient } from "@/app/_lib/dbHelpers";

export async function GET(request) {
  let client;
  try {
    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    client = await getClient();

    const [dataResult, countResult] = await Promise.all([
      client.query(
        `SELECT
          pet.pet_nome AS nome,
          pet.pet_raca AS raca,
          pet.pet_idade AS idade,
          pet.pet_cor AS cor,
          pet.pet_sexo AS sexo,
          pet.pet_porte AS porte,
          pet.pet_foto AS foto,
          dono.don_nome AS dono,
          dono.don_contato AS telefone,
          residencia.res_complemento AS endereco,
          residencia.res_numero AS num
        FROM pet
        INNER JOIN dono ON pet.don_id = dono.don_id
        INNER JOIN residencia ON residencia.don_id = dono.don_id
        ORDER BY pet.pet_nome
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      client.query(`
        SELECT COUNT(*) AS total
        FROM pet
        INNER JOIN dono ON pet.don_id = dono.don_id
        INNER JOIN residencia ON residencia.don_id = dono.don_id
      `),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    const pets = dataResult.rows.map(row => ({
      ...row,
      foto: row.foto?.data ? Buffer.from(row.foto).toString() : row.foto ?? null,
    }));

    return new Response(JSON.stringify({
      pets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }), { status: 200 });

  } catch {
    return new Response(JSON.stringify({ error: 'Erro ao buscar pets' }), { status: 500 });
  } finally {
    if (client) client.release();
  }
}
