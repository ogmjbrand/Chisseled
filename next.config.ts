import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    // Production is exactly what it was: X-Frame-Options: SAMEORIGIN, plus
    // the CSP `frame-ancestors 'self'` that supersedes it in modern browsers.
    // Same posture, stated in both the legacy and current syntax.
    //
    // Development drops the framing restriction so local preview panes and
    // embedded browsers can render the site. That is a dev-only relaxation and
    // never ships.
    const framing = isProd
      ? [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ]
      : [];

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ...framing,
        ],
      },
    ];
  },
};

export default nextConfig;
