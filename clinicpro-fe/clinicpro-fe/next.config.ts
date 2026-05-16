import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "djjecafahozffgadyiws.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Nếu có nhiều project Supabase:
      // { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
