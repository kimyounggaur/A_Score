import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stage B is a browser-only mock store, so an omitted deployment variable must
  // fail safe to a visible demo rather than looking like a live commerce site.
  // Stage C explicitly sets this to "false" after the external release gates pass.
  env: {
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === "false" ? "false" : "true",
  },
};

export default nextConfig;
