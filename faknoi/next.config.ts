import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  serverExternalPackages: ["@supabase/ssr"],
  webpack: (config, { isServer }) => {
    if (!isServer) return config;
    config.node = {
      ...config.node,
      __dirname: true,
      __filename: true,
    };
    return config;
  },
};

export default nextConfig;
