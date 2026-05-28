import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,   // don't force-reload; let our sync engine handle it
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Cache API responses (medicines, inventory) for offline reads
        urlPattern: /^https?:\/\/.*\/api\/v1\/(medicines|inventory|pharmacy\/branches)/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "dawolink-api-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        // Always try network for POS transactions — fallback handled in code
        urlPattern: /^https?:\/\/.*\/api\/v1\/pos/,
        handler: "NetworkOnly",
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dawolink/types", "@dawolink/ui"],
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default withPWAConfig(nextConfig);
