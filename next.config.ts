import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When building for Tauri desktop, use static export.
  // Set NEXT_EXPORT=true to enable static output.
  ...(process.env.NEXT_EXPORT === "true"
    ? {
        output: "export",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
