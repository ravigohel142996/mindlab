import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permit the Arena live-preview host in development. The app's browser
  // requests use same-origin /api routes, so no backend URL is exposed.
  allowedDevOrigins: ["*.e2b.app", "127.0.0.1"],
};

export default nextConfig;
