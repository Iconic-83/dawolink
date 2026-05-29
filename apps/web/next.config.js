const withPWA = require("@ducanh2912/next-pwa").default;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "worker",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /\/v1\/(medicines|inventory\/branches|pharmacy\/branches)/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "dawolink-api-cache",
          expiration: { maxEntries: 500, maxAgeSeconds: 86400 },
        },
      },
    ],
  },
})(nextConfig);
