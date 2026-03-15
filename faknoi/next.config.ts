import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  serverExternalPackages: [
    "@humanwhocodes/module-importer",
    "@humanwhocodes/config-array",
    "eslint",
  ],
};

export default nextConfig;
