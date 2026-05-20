import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";
import { requireApiKey } from "@/app/_lib/apiKey";
import { corsHeaders, withSecurityHeaders } from "@/app/_lib/securityHeaders";

/**
 * API v1 — Dashboard de Saúde Pública
 * Métricas consolidadas de saúde para integração com sistemas de saúde pública,
 * vigilância sanitária e gestão do condomínio.
 *
 * GET /api/v1/dashboard-saude
 */

export async function GET(request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  let client;
  try {
    client = await pool.connect();

    // Execute all queries in parallel for performance
    const [
      totalPets,
      vacinasAtrasadas,
      vacinasVencendo,
      vacinasEmDia,
      doencasContagiosas,
      totalDonos,
      cobertura,
    ] = await Promise.all([
      client.query("SELECT COUNT(*)::int AS total FROM pet"),

      client.query(
        `SELECT COUNT(DISTINCT v.pet_id)::int AS total
         FROM vacinacao v WHERE v.vac_data_vencimento < CURRENT_DATE`
      ),

      client.query(
        `SELECT COUNT(DISTINCT v.pet_id)::int AS total
         FROM vacinacao v
         WHERE v.vac_data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`
      ),

      client.query(
        `SELECT COUNT(DISTINCT v.pet_id)::int AS total
         FROM vacinacao v WHERE v.vac_data_vencimento > CURRENT_DATE + INTERVAL '30 days'`
      ),

      client.query(
        `SELECT COUNT(*)::int AS total FROM saude_pet
         WHERE sau_contagiosas IS NOT NULL AND sau_contagiosas != ''`
      ),

      client.query("SELECT COUNT(*)::int AS total FROM dono"),

      client.query(
        `SELECT COUNT(DISTINCT v.pet_id)::int AS vacinados
         FROM vacinacao v WHERE v.vac_data_vencimento >= CURRENT_DATE`
      ),
    ]);

    const total = totalPets.rows[0].total;
    const vacinados = cobertura.rows[0].vacinados;
    const coberturaVacinal = total > 0 ? Math.round((vacinados / total) * 100) : 0;

    // Build alerts
    const alertas = [];
    const atrasadas = vacinasAtrasadas.rows[0].total;
    const contagiosas = doencasContagiosas.rows[0].total;

    if (atrasadas > 0) {
      alertas.push({
        nivel: atrasadas > 10 ? "critico" : "atencao",
        tipo: "vacinacao_atrasada",
        mensagem: `${atrasadas} pet(s) com vacinas atrasadas — risco de saúde pública`,
        acao: "Contate os donos e agende vacinação urgente",
      });
    }

    if (contagiosas > 0) {
      alertas.push({
        nivel: "critico",
        tipo: "doenca_contagiosa",
        mensagem: `${contagiosas} pet(s) com doenças contagiosas reportadas`,
        acao: "Isole os animais e notifique a vigilância sanitária",
      });
    }

    if (coberturaVacinal < 70) {
      alertas.push({
        nivel: "atencao",
        tipo: "cobertura_baixa",
        mensagem: `Cobertura vacinal de ${coberturaVacinal}% — abaixo do recomendado (70%)`,
        acao: "Organize campanha de vacinação no condomínio",
      });
    }

    const response = NextResponse.json(
      {
        resumo: {
          total_pets: total,
          total_donos: totalDonos.rows[0].total,
          vacinacao: {
            atrasada: atrasadas,
            vencendo: vacinasVencendo.rows[0].total,
            em_dia: vacinasEmDia.rows[0].total,
          },
          cobertura_vacinal_pct: coberturaVacinal,
          doencas_contagiosas: contagiosas,
        },
        alertas,
        impacto_saude:
          "Este dashboard consolida indicadores de saúde animal que afetam diretamente " +
          "a saúde dos moradores do condomínio (zoonoses, raiva, leptospirose, etc.)",
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: corsHeaders(request) }
    );

    return withSecurityHeaders(response);
  } catch (error) {
    console.error("API v1 /dashboard-saude error:", error.message);
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
