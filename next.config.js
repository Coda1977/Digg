/** @type {import('next').NextConfig} */

// Build Content-Security-Policy using NEXT_PUBLIC_ env vars (inlined at build time)
const convexUrl = (process.env.NEXT_PUBLIC_CONVEX_URL || '').trim();
const convexWs = convexUrl.replace('https://', 'wss://');

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${convexUrl} ${convexWs} https://api.deepgram.com wss://api.deepgram.com`,
  "media-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog'],
  },

  // Server-side packages for PDF generation with Puppeteer
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],

  // Security headers (applied to all routes)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
