/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // desativa o Turbopack
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        // CORS headers for API v1 (microservice endpoints)
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, x-api-key, Authorization",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },

  // Optimize performance
  poweredByHeader: false, // Remove "X-Powered-By: Next.js" header
  compress: true, // Enable gzip compression
};

module.exports = nextConfig;
