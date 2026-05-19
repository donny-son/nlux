import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site into `out/` for GitHub Pages.
  output: "export",
  // GitHub Pages has no Image Optimization server.
  images: { unoptimized: true },
};

export default nextConfig;
