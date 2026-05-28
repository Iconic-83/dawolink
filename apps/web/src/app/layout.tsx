import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "DawoLink — Pharmacy Management Platform",
  description: "Smart pharmacy operations platform for Somalia and Africa",
  manifest: "/manifest.json",
  themeColor: "#180D62",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DawoLink",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
