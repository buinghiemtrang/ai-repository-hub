import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280],
    imageSizes: [32, 48, 64, 96, 256, 384, 512],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "repository-images.githubusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "opengraph.githubassets.com" },
      { protocol: "https", hostname: "user-images.githubusercontent.com" },
      { protocol: "https", hostname: "camo.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
