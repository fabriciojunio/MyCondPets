import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";
import { corsHeaders, withSecurityHeaders } from "@/app/_lib/securityHeaders";
import { getQueueStats } from "@/app/_lib/requestQueue";

/**
 * Health Check — /api/v1/health
 * Público (sem API key), usado por load balancers e monitoramento.
 */

export async function GET(request) {
  const start = Date.now();
  let dbStatus = "ok";
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
  }

  const queue = getQueueStats();

  const response = NextResponse.json(
    {
      status: dbStatus === "ok" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: process.uptime(),
      checks: {
        database: { status: dbStatus, latency_ms: dbLatency },
        queue: {
          running: queue.running,
          pending: queue.highPending + queue.lowPending,
        },
      },
      response_time_ms: Date.now() - start,
    },
    { status: dbStatus === "ok" ? 200 : 503, headers: corsHeaders(request) }
  );

  return withSecurityHeaders(response);
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, ["GET", "OPTIONS"]),
  });
}
