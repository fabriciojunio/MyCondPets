import { NextResponse } from 'next/server';
import { getClient } from '../../_lib/dbHelpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../_lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let client;

  try {
    client = await getClient();

    const result = await client.query(`
      SELECT 
        don_id,
        don_nome,
        don_email
      FROM dono
      ORDER BY don_nome ASC
    `);

    return NextResponse.json(result.rows, { status: 200 });

  } catch (error) {
    console.error(' Erro ao buscar donos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar donos' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}