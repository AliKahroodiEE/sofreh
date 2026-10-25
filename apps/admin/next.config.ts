import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the production Docker image (see Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // This app has its own lockfile inside the monorepo; keep Turbopack scoped to it.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
