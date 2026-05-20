import { getClient } from "@/app/_lib/dbHelpers";

export async function GET() {
  try {
    const client = await getClient();

    const result = await client.query(`
      SELECT 
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
      INNER JOIN dono 
        ON pet.don_id = dono.don_id
      INNER JOIN residencia 
        ON residencia.don_id = dono.don_id;
    `);

    const pets = result.rows.map(row => ({
      ...row,
      foto: row.foto && row.foto.data
        ? Buffer.from(row.foto).toString() // caso ainda venha buffer
        : row.foto ?? null
    }));

    client.release();

    return new Response(JSON.stringify(pets), { status: 200 });

  } catch (error) {
    console.error("ERRO REAL:", error.message);
    return new Response(JSON.stringify({ error: 'Erro ao buscar pets' }), { status: 500 });
  }
}
