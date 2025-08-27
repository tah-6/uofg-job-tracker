// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Keep these false so Vercel surfaces real problems.
  // You can flip to true temporarily if you need the build to pass while you fix lint/TS.
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  // If you keep seeing the “inferred workspace root” warning, you can set this:
  // experimental: { turbopack: { root: process.cwd() } },
};

export default nextConfig;
