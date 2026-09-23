import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Catalog image hosts are operator-supplied at runtime; direct images keep
      // the MVP host-agnostic without an unsafe catch-all optimizer allowlist.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([".next/**", "dist/**", ".wrangler/**", "qa/deploy-dry-run/**", "coverage/**", "next-env.d.ts"]),
]);
