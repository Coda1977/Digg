import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Strict-Transport-Security: enforce HTTPS for 1 year, include subdomains
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer policy: send origin only on cross-origin requests
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy: restrict sensitive browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), payment=()"
  );

  // Content Security Policy
  // Allow Convex WebSocket/HTTP, Deepgram WebSocket, inline styles (Tailwind), and self
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
  const convexWs = convexUrl.replace("https://", "wss://");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${convexUrl} ${convexWs} https://api.deepgram.com wss://api.deepgram.com`,
    `media-src 'self' blob:`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  // Apply to all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
