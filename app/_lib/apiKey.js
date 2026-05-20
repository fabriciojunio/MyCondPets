/**
 * API Key authentication for microservice integrations.
 *
 * Systems like condominium management apps, veterinary clinics,
 * and public health services authenticate via API key.
 *
 * Keys are stored as comma-separated values in the env variable
 * MYCONDPETS_API_KEYS (e.g. "key1:condmanager,key2:vetclinic").
 * Format: "apikey:label" — the label identifies the consumer.
 */

const HEADER_NAME = "x-api-key";

/**
 * Parse configured API keys from environment.
 * @returns {Map<string, string>} key -> label
 */
function getApiKeys() {
  const raw = process.env.MYCONDPETS_API_KEYS || "";
  const map = new Map();
  if (!raw) return map;

  for (const entry of raw.split(",")) {
    const [key, label] = entry.trim().split(":");
    if (key) map.set(key, label || "unknown");
  }
  return map;
}

/**
 * Validate the API key from the request.
 * @param {Request} request
 * @returns {{ valid: boolean, consumer: string | null }}
 */
export function validateApiKey(request) {
  const apiKey = request.headers.get(HEADER_NAME);

  if (!apiKey) {
    return { valid: false, consumer: null };
  }

  const keys = getApiKeys();
  const label = keys.get(apiKey);

  if (!label) {
    return { valid: false, consumer: null };
  }

  return { valid: true, consumer: label };
}

/**
 * Middleware helper — returns a 401 Response if the key is invalid,
 * or null if authentication passes.
 * @param {Request} request
 * @returns {Response | null}
 */
export function requireApiKey(request) {
  const { valid, consumer } = validateApiKey(request);

  if (!valid) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "API key inválida ou ausente. Envie o header x-api-key.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Attach consumer info to request for logging
  request._apiConsumer = consumer;
  return null;
}
