import type { NextConfig } from "next";

/**
 * Product photography is served from /public, from Supabase Storage, or from
 * any extra HTTPS hosts listed in IMAGE_REMOTE_HOSTS (comma-separated) — e.g.
 * while images migrated from an old platform are still being rehosted.
 */
const imageHosts = [
  "*.supabase.co",
  ...(process.env.IMAGE_REMOTE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
  },

  experimental: {
    optimizePackageImports: ["react", "react-dom"],
    // Admin product-image uploads go through a server action (validated, max 8 MB).
    serverActions: { bodySizeLimit: "10mb" },
  },

  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    const framing = isProd
      ? [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'",
          },
        ]
      : [];

    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
          ...framing,
        ],
      },
    ];
  },
};

export default nextConfig;