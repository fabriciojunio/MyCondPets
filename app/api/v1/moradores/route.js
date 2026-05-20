import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";
import { requireApiKey } from "@/app/_lib/apiKey";
import { corsHeaders, withSecurityHeaders } from "@/app/_lib/securityHeaders";

/**
 * API v1 — Moradores (donos de pets)
 * Integração com sistemas de gestão do condomínio.
 *
 * GET /api/v1/moradores             — lista moradores com pets
 * GET /api/v1/moradores?resumo=true — contagem de pets por morador
 */

export async function GET(request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const resumo = searchParams.get("resumo");

  let client;
  try {
    client = await pool.connect();

    if (resumo === "true") {
      const result = await client.query(
        `SELECT d.don_id, d.don_nome, d.don_email, d.don_contato,
                r.res_complemento, r.res_numero, r.res_cep,
                COUNT(p.pet_id)::int AS total_pets
         FROM dono d
         LEFT JOIN residencia r ON d.don_id = r.don_id
         LEFT JOIN pet p ON d.don_id = p.don_id
         GROUP BY d.don_id, d.don_nome, d.don_email, d.don_contato,
                  r.res_complemento, r.res_numero, r.res_cep
         ORDER BY d.don_nome ASC
         LIMIT 200`
      );

      const response = NextResponse.json(
        { data: result.rows, total: result.rows.length, timestamp: new Date().toISOString() },
        { status: 200, headers: corsHeaders(request) }
      );
      return withSecurityHeaders(response);
    }

    const result = await client.query(
      `SELECT d.don_id, d.don_nome, d.don_email, d.don_contato,
              r.res_complemento, r.res_numero, r.res_cep
       FROM dono d
       LEFT JOIN residencia r ON d.don_id = r.don_id
       ORDER BY d.don_nome ASC
       LIMIT 200`
    );

    const response = NextResponse.json(
      { data: result.rows, total: result.rows.length, timestamp: new Date().toISOString() },
      { status: 200, headers: corsHeaders(request) }
    );
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("API v1 /moradores error:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500, headers: corsHeaders(request) }
    );
  } finally {
    if (client) client.release();
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, ["GET", "OPTIONS"]),
  });
}
