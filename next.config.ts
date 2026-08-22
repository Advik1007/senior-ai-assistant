import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preview and phone browsers hit 127.0.0.1 while Next treats another host as origin.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
