/**
 * Security headers applied to all API responses.
 * Prevents clickjacking, XSS, MIME sniffing, and other attacks.
 */

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * Apply security headers to a NextResponse or Response.
 * @param {Response} response
 * @returns {Response}
 */
export function withSecurityHeaders(response) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Create CORS headers for API v1 (microservice) endpoints.
 * @param {Request} request
 * @param {string[]} allowedMethods
 * @returns {object} headers object
 */
export function corsHeaders(request, allowedMethods = ["GET", "POST"]) {
  const origin = request.headers.get("origin") || "*";
  const allowedOrigins = process.env.MYCONDPETS_ALLOWED_ORIGINS || "*";

  // Check if origin is in the allowed list
  let responseOrigin = "*";
  if (allowedOrigins !== "*") {
    const origins = allowedOrigins.split(",").map((o) => o.trim());
    if (origins.includes(origin)) {
      responseOrigin = origin;
    } else {
      responseOrigin = origins[0] || "*";
    }
  }

  return {
    "Access-Control-Allow-Origin": responseOrigin,
    "Access-Control-Allow-Methods": allowedMethods.join(", "),
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}
