import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";
import { requireApiKey } from "@/app/_lib/apiKey";
import { corsHeaders, withSecurityHeaders } from "@/app/_lib/securityHeaders";
import { safeId } from "@/app/_lib/sanitize";

/**
 * API v1 — Vacinação
 * Endpoint para integração com clínicas veterinárias e sistemas de saúde.
 *
 * GET  /api/v1/vacinacao?pet_id=1     — vacinas de um pet
 * GET  /api/v1/vacinacao?status=atrasada — pets com vacina atrasada (impacto saúde pública)
 * POST /api/v1/vacinacao               — registrar vacina (integração clínica veterinária)
 */

export async function GET(request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const pet_id = searchParams.get("pet_id");
  const status = searchParams.get("status");

  let client;
  try {
    client = await getClient();

    if (pet_id) {
      const id = safeId(pet_id);
      if (!id) {
        return NextResponse.json(
          { error: "pet_id inválido" },
          { status: 400, headers: corsHeaders(request) }
        );
      }

      const result = await client.query(
        `SELECT v.*,
          p.pet_nome, p.pet_especie, p.pet_raca,
          CASE
            WHEN v.vac_data_vencimento < CURRENT_DATE THEN 'atrasada'
            WHEN v.vac_data_vencimento <= CURRENT_DATE + INTERVAL '30 days' THEN 'vencendo'
            ELSE 'em_dia'
          END AS vac_status
         FROM vacinacao v
         JOIN pet p ON v.pet_id = p.pet_id
         WHERE v.pet_id = $1
         ORDER BY v.vac_data_vencimento`,
        [id]
      );

      const response = NextResponse.json(
        { data: result.rows, total: result.rows.length, timestamp: new Date().toISOString() },
        { status: 200, headers: corsHeaders(request) }
      );
      return withSecurityHeaders(response);
    }

    if (status === "atrasada" || status === "vencendo" || status === "em_dia") {
      const condition =
        status === "atrasada"
          ? "v.vac_data_vencimento < CURRENT_DATE"
          : status === "vencendo"
            ? "v.vac_data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'"
            : "v.vac_data_vencimento > CURRENT_DATE + INTERVAL '30 days'";

      const result = await client.query(
        `SELECT v.*, p.pet_nome, p.pet_especie, p.pet_raca,
                d.don_nome, d.don_email, d.don_contato,
                '${status}' AS vac_status
         FROM vacinacao v
         JOIN pet p ON v.pet_id = p.pet_id
         LEFT JOIN dono d ON p.don_id = d.don_id
         WHERE ${condition}
         ORDER BY v.vac_data_vencimento ASC
         LIMIT 200`
      );

      const response = NextResponse.json(
        {
          data: result.rows,
          total: result.rows.length,
          filtro: status,
          impacto_saude: status === "atrasada"
            ? "Pets com vacinas atrasadas representam risco de saúde pública para o condomínio"
            : null,
          timestamp: new Date().toISOString(),
        },
        { status: 200, headers: corsHeaders(request) }
      );
      return withSecurityHeaders(response);
    }

    // Default: todas as vacinas
    const result = await client.query(
      `SELECT v.*, p.pet_nome,
        CASE
          WHEN v.vac_data_vencimento < CURRENT_DATE THEN 'atrasada'
          WHEN v.vac_data_vencimento <= CURRENT_DATE + INTERVAL '30 days' THEN 'vencendo'
          ELSE 'em_dia'
        END AS vac_status
       FROM vacinacao v
       JOIN pet p ON v.pet_id = p.pet_id
       ORDER BY v.vac_data_vencimento ASC
       LIMIT 200`
    );

    const response = NextResponse.json(
      { data: result.rows, total: result.rows.length, timestamp: new Date().toISOString() },
      { status: 200, headers: corsHeaders(request) }
    );
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("API v1 /vacinacao error:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500, headers: corsHeaders(request) }
    );
  } finally {
    if (client) client.release();
  }
}

export async function POST(request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  let client;
  try {
    const body = await request.json();
    const { pet_id, vac_tipo, vac_data_aplicacao, vac_data_vencimento, vac_carteira } = body;

    if (!pet_id || !vac_tipo || !vac_data_aplicacao || !vac_data_vencimento) {
      return NextResponse.json(
        { error: "Campos obrigatórios: pet_id, vac_tipo, vac_data_aplicacao, vac_data_vencimento" },
        { status: 400, headers: corsHeaders(request, ["GET", "POST"]) }
      );
    }

    const id = safeId(pet_id);
    if (!id) {
      return NextResponse.json(
        { error: "pet_id inválido" },
        { status: 400, headers: corsHeaders(request, ["GET", "POST"]) }
      );
    }

    client = await getClient();

    // Verify the pet exists
    const petCheck = await client.query("SELECT pet_id FROM pet WHERE pet_id = $1", [id]);
    if (petCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pet não encontrado" },
        { status: 404, headers: corsHeaders(request, ["GET", "POST"]) }
      );
    }

    const result = await client.query(
      `INSERT INTO vacinacao (pet_id, vac_tipo, vac_data_aplicacao, vac_data_vencimento, vac_carteira)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, vac_tipo.slice(0, 50), vac_data_aplicacao, vac_data_vencimento, vac_carteira || null]
    );

    const response = NextResponse.json(
      { data: result.rows[0], message: "Vacina registrada com sucesso" },
      { status: 201, headers: corsHeaders(request, ["GET", "POST"]) }
    );
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("API v1 POST /vacinacao error:", error.message);
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
