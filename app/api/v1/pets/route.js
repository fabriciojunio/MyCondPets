import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";
import { requireApiKey } from "@/app/_lib/apiKey";
import { corsHeaders, withSecurityHeaders } from "@/app/_lib/securityHeaders";
import { safeId } from "@/app/_lib/sanitize";

/**
 * API v1 — Pets
 * Endpoint público para sistemas externos (condomínios, clínicas veterinárias).
 * Autenticado via API key (header x-api-key).
 *
 * GET /api/v1/pets           — lista todos os pets
 * GET /api/v1/pets?pet_id=1  — detalhes de um pet específico
 * GET /api/v1/pets?dono_id=1 — pets de um dono específico
 */

export async function GET(request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const pet_id = searchParams.get("pet_id");
  const dono_id = searchParams.get("dono_id");

  let client;
  try {
    client = await pool.connect();

    let query = `
      SELECT
        p.pet_id, p.pet_nome, p.pet_especie, p.pet_raca,
        p.pet_porte, p.pet_cor, p.don_id,
        d.don_nome, d.don_email, d.don_contato
      FROM pet p
      LEFT JOIN dono d ON p.don_id = d.don_id
    `;
    const params = [];

    if (pet_id) {
      const id = safeId(pet_id);
      if (!id) {
        return NextResponse.json(
          { error: "pet_id inválido" },
          { status: 400, headers: corsHeaders(request) }
        );
      }
      query += " WHERE p.pet_id = $1";
      params.push(id);
    } else if (dono_id) {
      const id = safeId(dono_id);
      if (!id) {
        return NextResponse.json(
          { error: "dono_id inválido" },
          { status: 400, headers: corsHeaders(request) }
        );
      }
      query += " WHERE p.don_id = $1";
      params.push(id);
    }

    query += " ORDER BY p.pet_nome ASC LIMIT 100";

    const result = await client.query(query, params);

    const response = NextResponse.json(
      {
        data: result.rows,
        total: result.rows.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: corsHeaders(request) }
    );

    return withSecurityHeaders(response);
  } catch (error) {
    console.error("API v1 /pets error:", error.message);
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
