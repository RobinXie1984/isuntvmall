import { resolveStoreDeploymentConfig } from "./scripts/prepare-store-deployment.mjs";
import { loadStoreProfile } from "./config/store-profile-loader.mjs";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

const profile = loadStoreProfile();
const deploymentConfig = resolveStoreDeploymentConfig(profile);

export default defineConfig({
  define: { "process.env.NEXT_PUBLIC_STORE_PROFILE": JSON.stringify(JSON.stringify(profile)) },
  plugins: [
    vinext(),
    cloudflare({
      ...(deploymentConfig ? { configPath: deploymentConfig } : {}),
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
