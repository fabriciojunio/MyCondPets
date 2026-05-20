import { NextResponse } from "next/server";
import { getClient } from "@/app/_lib/dbHelpers";
import { requireApiKey } from "@/app/_lib/apiKey";
import { corsHeaders, withSecurityHeaders } from "@/app/_lib/securityHeaders";
import { safeId } from "@/app/_lib/sanitize";

/**
 * API v1 — Saúde dos Pets
 * Integração com sistemas de saúde pública e zoonoses.
 *
 * GET /api/v1/saude?pet_id=1           — saúde de um pet específico
 * GET /api/v1/saude?contagiosas=true   — pets com doenças contagiosas (zoonoses)
 */

export async function GET(request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const pet_id = searchParams.get("pet_id");
  const contagiosas = searchParams.get("contagiosas");

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
        `SELECT s.*, p.pet_nome, p.pet_especie, p.pet_raca,
                d.don_nome, d.don_contato
         FROM saude_pet s
         JOIN pet p ON s.pet_id = p.pet_id
         LEFT JOIN dono d ON p.don_id = d.don_id
         WHERE s.pet_id = $1`,
        [id]
      );

      const response = NextResponse.json(
        { data: result.rows[0] || null, timestamp: new Date().toISOString() },
        { status: 200, headers: corsHeaders(request) }
      );
      return withSecurityHeaders(response);
    }

    // Filtro de doenças contagiosas — impacto na saúde do condomínio
    if (contagiosas === "true") {
      const result = await client.query(
        `SELECT s.*, p.pet_nome, p.pet_especie, p.pet_raca,
                d.don_nome, d.don_email, d.don_contato
         FROM saude_pet s
         JOIN pet p ON s.pet_id = p.pet_id
         LEFT JOIN dono d ON p.don_id = d.don_id
         WHERE s.sau_contagiosas IS NOT NULL
           AND s.sau_contagiosas != ''
         ORDER BY p.pet_nome ASC
         LIMIT 100`
      );

      const response = NextResponse.json(
        {
          data: result.rows,
          total: result.rows.length,
          alerta_saude: "Lista de pets com doenças contagiosas reportadas — risco para moradores",
          timestamp: new Date().toISOString(),
        },
        { status: 200, headers: corsHeaders(request) }
      );
      return withSecurityHeaders(response);
    }

    // Default: todos os registros de saúde
    const result = await client.query(
      `SELECT s.*, p.pet_nome, p.pet_especie
       FROM saude_pet s
       JOIN pet p ON s.pet_id = p.pet_id
       ORDER BY p.pet_nome ASC
       LIMIT 100`
    );

    const response = NextResponse.json(
      { data: result.rows, total: result.rows.length, timestamp: new Date().toISOString() },
      { status: 200, headers: corsHeaders(request) }
    );
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("API v1 /saude error:", error.message);
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
