import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dawolink/types", "@dawolink/ui"],
  output: "standalone",
};

export default nextConfig;
