import { NextResponse } from 'next/server';
import { getClient } from '../../_lib/dbHelpers';

export async function GET() {
  let client;
  
  try {
    client = await getClient();
    
    // ============================== 
    // CONSULTAS DO DASHBOARD 
    // ============================== 
    
    // Total de Pets
    const totalPetsResult = await client.query(`
      SELECT COUNT(*) AS total_pets 
      FROM pet;
    `);
    
    // Pets Perdidos - usando a coluna pet_porte como indicador temporário
    // Você pode adicionar uma coluna 'perdido' depois ou usar outra lógica
    const totalPetsPerdidosResult = await client.query(`
      SELECT COUNT(*) AS total_perdidos 
      FROM pet 
      WHERE pet_porte IS NULL OR pet_porte = '';
    `);
    
    // Total de Donos
    const totalDonosResult = await client.query(`
      SELECT COUNT(*) AS total_donos 
      FROM dono;
    `);
    
    // Apartamentos com Pets - usando res_numero ao invés de res_apto
    const totalAptosPetsResult = await client.query(`
      SELECT COUNT(DISTINCT residencia.res_numero) AS total_aptos_com_pets 
      FROM residencia 
      JOIN pet ON pet.don_id = residencia.don_id;
    `);
   
    const dashboard = {
      petsCadastrados: parseInt(totalPetsResult.rows[0].total_pets) || 0,
      petsPerdidos: parseInt(totalPetsPerdidosResult.rows[0].total_perdidos) || 0,
      donosCadastrados: parseInt(totalDonosResult.rows[0].total_donos) || 0,
      aptosComPets: parseInt(totalAptosPetsResult.rows[0].total_aptos_com_pets) || 0,
    };
    
    return NextResponse.json(dashboard, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}