import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent static pre-rendering
  trailingSlash: false,
};

export default nextConfig;
