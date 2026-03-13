import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent static pre-rendering
  trailingSlash: false,
  generateStaticParams: () => [],
};

export default nextConfig;
