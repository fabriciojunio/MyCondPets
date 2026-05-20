import { NextResponse } from 'next/server';
import { getClient } from '../../_lib/dbHelpers';
import pool from '../../_lib/db';
import { gerarEmbedding, formatarEmbedding } from '../../_lib/embeddings';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../_lib/authOptions';
import { rateLimit } from '../../_lib/rateLimit';

// GET — listar notícias com filtros opcionais ?tipo=cachorro&status=aberto
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");

  let client;
  try {
    client = await getClient();

    let where = [];
    let params = [];
    let i = 1;

    if (tipo) { where.push(`n.not_tipo_animal ILIKE $${i++}`); params.push(tipo); }
    if (status) { where.push(`n.not_status = $${i++}`); params.push(status); }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await client.query(
      `SELECT n.*, d.don_nome, d.don_contato
       FROM noticias n
       LEFT JOIN dono d ON n.don_id = d.don_id
       ${whereClause}
       ORDER BY n.not_data_publicacao DESC`,
      params
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return NextResponse.json({ error: 'Erro ao buscar notícias' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

// POST — criar notícia
export async function POST(request) {
  if (rateLimit(request, { max: 5, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 });
  }

  let client;
  try {
    const body = await request.json();
    const { titulo, descricao, donId, foto, tipo_animal, status } = body;

    if (!titulo?.trim()) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    if (!descricao?.trim()) return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 });
    if (!donId) return NextResponse.json({ error: 'Dono é obrigatório' }, { status: 400 });
    if (!foto) return NextResponse.json({ error: 'Foto é obrigatória' }, { status: 400 });

    client = await pool.connect();

    const donoCheck = await client.query('SELECT don_id FROM dono WHERE don_id = $1', [donId]);
    if (donoCheck.rows.length === 0) return NextResponse.json({ error: 'Dono não encontrado' }, { status: 404 });

    // Garante que as colunas existem (migração automática)
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector`).catch(() => {});
    await client.query(`
      ALTER TABLE noticias ADD COLUMN IF NOT EXISTS not_status VARCHAR(20) DEFAULT 'aberto';
      ALTER TABLE noticias ADD COLUMN IF NOT EXISTS not_tipo_animal VARCHAR(50);
    `).catch(() => {});
    await client.query(`
      ALTER TABLE noticias ADD COLUMN IF NOT EXISTS embedding vector(384);
    `).catch(() => {});

    const result = await client.query(
      `INSERT INTO noticias (not_titulo, not_conteudo, not_data_publicacao, don_id, not_foto, not_status, not_tipo_animal)
       VALUES ($1,$2,NOW(),$3,$4,$5,$6) RETURNING *`,
      [titulo.trim(), descricao.trim(), donId, foto, status || 'aberto', tipo_animal || null]
    );

    // Gera embedding em background (não bloqueia a resposta)
    const not_id = result.rows[0].not_id;
    const textoParaEmbedding = `${titulo.trim()} ${descricao.trim()} ${tipo_animal || ''}`;
    gerarEmbedding(textoParaEmbedding).then(async (emb) => {
      if (!emb) return;
      const c = await pool.connect();
      try {
        await c.query(
          `UPDATE noticias SET embedding = $1 WHERE not_id = $2`,
          [formatarEmbedding(emb), not_id]
        );
      } finally {
        c.release();
      }
    }).catch(() => {});

    return NextResponse.json({ message: 'Notícia publicada com sucesso!', noticia: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    return NextResponse.json({ error: 'Erro ao criar notícia' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

// PATCH — atualizar status (aberto → resolvido) — apenas dono ou admin
export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let client;
  try {
    const body = await request.json();
    const { not_id, not_status } = body;
    if (!not_id || !not_status) return NextResponse.json({ error: 'not_id e not_status obrigatórios' }, { status: 400 });

    const statusValidos = ['aberto', 'resolvido', 'perdido', 'encontrado'];
    if (!statusValidos.includes(not_status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    client = await pool.connect();

    // Verifica se o usuário logado é o dono da notícia ou admin
    const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').toLowerCase().split(',').map(e => e.trim()).filter(Boolean);
    const emailUsuario = session.user.email.toLowerCase();
    const isAdmin = admins.includes(emailUsuario);

    if (!isAdmin) {
      const noticiaRes = await client.query(
        `SELECT d.don_email FROM noticias n JOIN dono d ON n.don_id = d.don_id WHERE n.not_id = $1`,
        [not_id]
      );
      if (noticiaRes.rows.length === 0) return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 });
      if (noticiaRes.rows[0].don_email?.toLowerCase() !== emailUsuario) {
        return NextResponse.json({ error: 'Sem permissão para alterar esta notícia' }, { status: 403 });
      }
    }

    await client.query("UPDATE noticias SET not_status = $1 WHERE not_id = $2", [not_status, not_id]);
    return NextResponse.json({ message: 'Status atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

// DELETE — apagar notícia ("resolver pendência") — apenas dono ou admin
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let client;
  try {
    const { searchParams } = new URL(request.url);
    const not_id = searchParams.get('not_id');
    if (!not_id) return NextResponse.json({ error: 'not_id obrigatório' }, { status: 400 });

    client = await pool.connect();

    const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').toLowerCase().split(',').map(e => e.trim()).filter(Boolean);
    const emailUsuario = session.user.email.toLowerCase();
    const isAdmin = admins.includes(emailUsuario);

    if (!isAdmin) {
      const noticiaRes = await client.query(
        `SELECT d.don_email FROM noticias n JOIN dono d ON n.don_id = d.don_id WHERE n.not_id = $1`,
        [not_id]
      );
      if (noticiaRes.rows.length === 0) return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 });
      if (noticiaRes.rows[0].don_email?.toLowerCase() !== emailUsuario) {
        return NextResponse.json({ error: 'Sem permissão para excluir esta notícia' }, { status: 403 });
      }
    }

    await client.query("DELETE FROM comentarios WHERE not_id = $1", [not_id]).catch(() => {});
    await client.query("DELETE FROM curtidas WHERE not_id = $1", [not_id]).catch(() => {});
    await client.query("DELETE FROM noticias WHERE not_id = $1", [not_id]);

    return NextResponse.json({ message: 'Notícia removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar notícia:', error);
    return NextResponse.json({ error: 'Erro ao deletar notícia' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}