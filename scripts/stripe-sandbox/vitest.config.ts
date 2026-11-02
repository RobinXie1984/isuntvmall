import {defineConfig} from "vitest/config";
import path from "node:path";
export default defineConfig({resolve:{alias:{"@":path.resolve("src")}},test:{environment:"node",include:["scripts/stripe-sandbox/settlement.test.ts"],testTimeout:30000}});
