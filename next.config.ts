import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yoremio.onrender.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5089",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5089",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "7194",
      },
      {
        protocol: "https",
        hostname: "127.0.0.1",
        port: "7194",
      },
    ],
  },
};

export default nextConfig;
