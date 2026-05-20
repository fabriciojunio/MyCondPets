/**
 * Rate limiter em memória — simples e sem dependências externas.
 * Para produção em múltiplas instâncias, substitua por Redis.
 *
 * Uso:
 *   const limited = rateLimit(request, { max: 10, windowMs: 60_000 });
 *   if (limited) return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
 */

const store = new Map(); // ip -> { count, resetAt }

/**
 * @param {Request} request
 * @param {{ max?: number, windowMs?: number }} options
 * @returns {boolean} true se o limite foi atingido
 */
export function rateLimit(request, { max = 20, windowMs = 60_000 } = {}) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > max) return true;

  return false;
}

// Limpeza periódica para evitar vazamento de memória
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(ip);
  }
}, 5 * 60_000);
