import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ufbbdzohyzjcfbtjvhmj.supabase.co",
      },
    ],
  },
};

export default nextConfig;
