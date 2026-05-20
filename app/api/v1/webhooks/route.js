import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";
import { requireApiKey } from "@/app/_lib/apiKey";
import { corsHeaders, withSecurityHeaders } from "@/app/_lib/securityHeaders";
import { sanitizeHtml, truncate } from "@/app/_lib/sanitize";

/**
 * API v1 — Webhooks
 * Permite que sistemas externos se registrem para receber notificações
 * de eventos como novas vacinas, pets cadastrados, doenças contagiosas, etc.
 *
 * POST /api/v1/webhooks  — registra webhook
 * GET  /api/v1/webhooks  — lista webhooks registrados
 */

const VALID_EVENTS = [
  "pet.created",
  "pet.deleted",
  "vacina.registrada",
  "vacina.atrasada",
  "doenca.contagiosa",
  "morador.novo",
];

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS webhooks (
      wh_id SERIAL PRIMARY KEY,
      wh_url TEXT NOT NULL,
      wh_events TEXT[] NOT NULL,
      wh_secret TEXT,
      wh_consumer VARCHAR(100),
      wh_ativo BOOLEAN DEFAULT TRUE,
      wh_criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function POST(request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  let client;
  try {
    const body = await request.json();
    const { url, events, secret } = body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: url, events (array)",
          eventos_validos: VALID_EVENTS,
        },
        { status: 400, headers: corsHeaders(request, ["GET", "POST"]) }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "URL inválida" },
        { status: 400, headers: corsHeaders(request, ["GET", "POST"]) }
      );
    }

    // Validate events
    const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          error: `Eventos inválidos: ${invalidEvents.join(", ")}`,
          eventos_validos: VALID_EVENTS,
        },
        { status: 400, headers: corsHeaders(request, ["GET", "POST"]) }
      );
    }

    client = await getClient();
    await ensureTable(client);

    const consumer = request._apiConsumer || "unknown";

    const result = await client.query(
      `INSERT INTO webhooks (wh_url, wh_events, wh_secret, wh_consumer)
       VALUES ($1, $2, $3, $4) RETURNING wh_id, wh_url, wh_events, wh_ativo, wh_criado_em`,
      [sanitizeHtml(truncate(url, 500)), events, secret || null, consumer]
    );

    const response = NextResponse.json(
      {
        data: result.rows[0],
        message: "Webhook registrado com sucesso",
        eventos_validos: VALID_EVENTS,
      },
      { status: 201, headers: corsHeaders(request, ["GET", "POST"]) }
    );
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("API v1 POST /webhooks error:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500, headers: corsHeaders(request, ["GET", "POST"]) }
    );
  } finally {
    if (client) client.release();
  }
}

export async function GET(request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  let client;
  try {
    client = await getClient();
    await ensureTable(client);

    const consumer = request._apiConsumer || "unknown";

    const result = await client.query(
      `SELECT wh_id, wh_url, wh_events, wh_ativo, wh_criado_em
       FROM webhooks
       WHERE wh_consumer = $1 AND wh_ativo = TRUE
       ORDER BY wh_criado_em DESC`,
      [consumer]
    );

    const response = NextResponse.json(
      {
        data: result.rows,
        total: result.rows.length,
        eventos_validos: VALID_EVENTS,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: corsHeaders(request, ["GET", "POST"]) }
    );
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("API v1 GET /webhooks error:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500, headers: corsHeaders(request, ["GET", "POST"]) }
    );
  } finally {
    if (client) client.release();
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, ["GET", "POST", "OPTIONS"]),
  });
}
