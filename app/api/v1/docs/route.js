import { NextResponse } from "next/server";
import { corsHeaders, withSecurityHeaders } from "@/app/_lib/securityHeaders";

/**
 * API Documentation — /api/v1/docs
 * Retorna a documentação da API para integradores.
 */

const API_DOCS = {
  name: "MyCondPets API",
  version: "1.0.0",
  description:
    "API de integração para sistemas de condomínio, clínicas veterinárias e órgãos de saúde pública. " +
    "Permite acesso a dados de pets, vacinação, saúde e moradores do condomínio.",
  base_url: "/api/v1",
  authentication: {
    type: "API Key",
    header: "x-api-key",
    description:
      "Todas as rotas (exceto /health e /docs) exigem autenticação via API key. " +
      "Solicite sua chave ao administrador do condomínio.",
  },
  endpoints: [
    {
      path: "/api/v1/health",
      method: "GET",
      auth: false,
      description: "Health check do sistema. Retorna status do banco e métricas.",
      response: "{ status, timestamp, checks: { database, queue } }",
    },
    {
      path: "/api/v1/docs",
      method: "GET",
      auth: false,
      description: "Esta documentação.",
    },
    {
      path: "/api/v1/pets",
      method: "GET",
      auth: true,
      description: "Lista todos os pets do condomínio.",
      params: {
        pet_id: "(opcional) ID de um pet específico",
        dono_id: "(opcional) ID do dono para filtrar pets",
      },
      response: "{ data: Pet[], total, timestamp }",
    },
    {
      path: "/api/v1/vacinacao",
      method: "GET",
      auth: true,
      description: "Consulta registros de vacinação.",
      params: {
        pet_id: "(opcional) vacinas de um pet específico",
        status: "(opcional) 'atrasada' | 'vencendo' | 'em_dia' — filtra por status",
      },
      response: "{ data: Vacina[], total, filtro?, impacto_saude?, timestamp }",
    },
    {
      path: "/api/v1/vacinacao",
      method: "POST",
      auth: true,
      description: "Registra nova vacina (integração com clínica veterinária).",
      body: {
        pet_id: "(obrigatório) ID do pet",
        vac_tipo: "(obrigatório) tipo da vacina — ex: 'Antirrábica', 'V10'",
        vac_data_aplicacao: "(obrigatório) data de aplicação — formato YYYY-MM-DD",
        vac_data_vencimento: "(obrigatório) data de vencimento — formato YYYY-MM-DD",
        vac_carteira: "(opcional) URL da carteira de vacinação",
      },
    },
    {
      path: "/api/v1/saude",
      method: "GET",
      auth: true,
      description: "Consulta registros de saúde dos pets.",
      params: {
        pet_id: "(opcional) saúde de um pet específico",
        contagiosas: "(opcional) 'true' — lista pets com doenças contagiosas (zoonoses)",
      },
      response: "{ data, total?, alerta_saude?, timestamp }",
    },
    {
      path: "/api/v1/moradores",
      method: "GET",
      auth: true,
      description: "Lista moradores (donos de pets) do condomínio.",
      params: {
        resumo: "(opcional) 'true' — inclui contagem de pets por morador",
      },
      response: "{ data: Morador[], total, timestamp }",
    },
    {
      path: "/api/v1/dashboard-saude",
      method: "GET",
      auth: true,
      description:
        "Dashboard de saúde pública do condomínio. Métricas de vacinação, doenças contagiosas e alertas.",
      response:
        "{ resumo: { total_pets, vacinacao_atrasada, doencas_contagiosas, ... }, alertas[], timestamp }",
    },
    {
      path: "/api/v1/webhooks",
      method: "POST",
      auth: true,
      description: "Registra um webhook para receber notificações de eventos.",
      body: {
        url: "(obrigatório) URL do webhook",
        events: "(obrigatório) array de eventos — 'pet.created', 'vacina.atrasada', 'doenca.contagiosa'",
        secret: "(opcional) secret para assinatura HMAC dos payloads",
      },
    },
    {
      path: "/api/v1/webhooks",
      method: "GET",
      auth: true,
      description: "Lista webhooks registrados.",
    },
  ],
  impacto_saude_publica: {
    description:
      "A API foi projetada para facilitar o monitoramento de saúde pública em condomínios. " +
      "Através dos endpoints de vacinação e saúde, é possível:",
    casos_de_uso: [
      "Monitorar vacinas atrasadas (raiva, leptospirose) que representam risco para moradores",
      "Identificar pets com doenças contagiosas (zoonoses) para ações preventivas",
      "Integrar com sistemas da prefeitura e vigilância sanitária",
      "Gerar relatórios de cobertura vacinal do condomínio",
      "Alertar moradores sobre campanhas de vacinação",
    ],
  },
  rate_limits: {
    description: "As requisições são limitadas por IP.",
    limits: {
      GET: "60 requisições/minuto",
      POST: "10 requisições/minuto",
    },
  },
};

export async function GET(request) {
  const response = NextResponse.json(API_DOCS, {
    status: 200,
    headers: corsHeaders(request),
  });
  return withSecurityHeaders(response);
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, ["GET", "OPTIONS"]),
  });
}
