import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Imagens de produtos/logos vêm de URLs externas informadas pelo lojista.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
