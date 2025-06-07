import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/pdf/:filename.pdf",
        destination: "/api/pdf/:filename",
      },
    ];
  },
};

export default nextConfig;
