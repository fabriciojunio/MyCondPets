/** @jest-environment node */
import { withSecurityHeaders, corsHeaders } from "../securityHeaders";

describe("withSecurityHeaders", () => {
  test("adds all security headers to response", () => {
    const response = new Response("test", { status: 200 });
    const secured = withSecurityHeaders(response);

    expect(secured.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(secured.headers.get("X-Frame-Options")).toBe("DENY");
    expect(secured.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(secured.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(secured.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
    expect(secured.headers.get("Strict-Transport-Security")).toContain("max-age=");
  });
});

describe("corsHeaders", () => {
  function makeRequest(origin) {
    return {
      headers: { get: (name) => (name === "origin" ? origin : null) },
    };
  }

  test("returns CORS headers with wildcard when no origins configured", () => {
    const OLD_ENV = process.env;
    process.env = { ...OLD_ENV, MYCONDPETS_ALLOWED_ORIGINS: undefined };

    const headers = corsHeaders(makeRequest("http://example.com"));

    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(headers["Access-Control-Allow-Headers"]).toContain("x-api-key");
    expect(headers["Access-Control-Max-Age"]).toBe("86400");

    process.env = OLD_ENV;
  });

  test("allows specified methods", () => {
    const headers = corsHeaders(makeRequest(null), ["GET", "POST", "DELETE"]);
    expect(headers["Access-Control-Allow-Methods"]).toBe("GET, POST, DELETE");
  });

  test("defaults to GET and POST methods", () => {
    const headers = corsHeaders(makeRequest(null));
    expect(headers["Access-Control-Allow-Methods"]).toBe("GET, POST");
  });
});
