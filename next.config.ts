import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright's local web server uses this loopback origin in the e2e base.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
