import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/suntvmall-weekly.test.mjs"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
