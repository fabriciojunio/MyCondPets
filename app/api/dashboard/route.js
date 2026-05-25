import { NextResponse } from 'next/server';
import { getClient } from '../../_lib/dbHelpers';

export async function GET() {
  let client;

  try {
    client = await getClient();

    const result = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM pet) AS total_pets,
        (SELECT COUNT(*) FROM pet WHERE pet_porte IS NULL OR pet_porte = '') AS total_perdidos,
        (SELECT COUNT(*) FROM dono) AS total_donos,
        (SELECT COUNT(DISTINCT r.res_numero) FROM residencia r JOIN pet p ON p.don_id = r.don_id) AS total_aptos_com_pets
    `);

    const row = result.rows[0];
    const dashboard = {
      petsCadastrados:  parseInt(row.total_pets) || 0,
      petsPerdidos:     parseInt(row.total_perdidos) || 0,
      donosCadastrados: parseInt(row.total_donos) || 0,
      aptosComPets:     parseInt(row.total_aptos_com_pets) || 0,
    };

    return NextResponse.json(dashboard, { status: 200 });

  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}