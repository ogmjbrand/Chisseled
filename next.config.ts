import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  async headers() {
    // Clickjacking protection, expressed so that it does not also block the
    // ways this site legitimately gets looked at.
    //
    // `X-Frame-Options: SAMEORIGIN` was doing both jobs at once: it stopped
    // an attacker framing the storefront, and it stopped every preview pane,
    // embedded browser and deploy-preview iframe from rendering it at all —
    // the browser refuses with "Refused to display ... in a frame", which
    // reads as the site being broken rather than protected.
    //
    // CSP `frame-ancestors` supersedes the legacy header and takes precedence
    // where both are present, so it is the only one set. In development
    // framing is open, so local preview tooling works; in production it is
    // held to same-origin, which is the protection that was actually wanted.
    const frameAncestors =
      process.env.NODE_ENV === "production" ? "frame-ancestors 'self'" : "frame-ancestors *";

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: frameAncestors },
        ],
      },
    ];
  },
};

export default nextConfig;
