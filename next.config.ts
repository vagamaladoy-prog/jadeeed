import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseHost = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    // uploaded banners/photos never change under the same URL
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
    // admin photo uploads go through server actions; images are shrunk in the browser to ≤ 4 MB
    // (Vercel functions accept at most 4.5 MB per request)
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  poweredByHeader: false,
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
