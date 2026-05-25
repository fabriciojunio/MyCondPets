/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",       value: "on" },
  { key: "X-Frame-Options",              value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",       value: "nosniff" },
  { key: "X-XSS-Protection",             value: "1; mode=block" },
  { key: "Referrer-Policy",              value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",           value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kit.fontawesome.com",
      "style-src 'self' 'unsafe-inline' https://ka-f.fontawesome.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://ka-f.fontawesome.com",
      "connect-src 'self' https://api-inference.huggingface.co https://ka-f.fontawesome.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
