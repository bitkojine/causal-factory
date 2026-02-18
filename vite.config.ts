import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/causal-factory/",
  root: ".",
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@causaloop/core": path.resolve(
        __dirname,
        "../causaloop-repo/packages/core/src",
      ),
      "@causaloop/platform-browser": path.resolve(
        __dirname,
        "../causaloop-repo/packages/platform-browser/src",
      ),
      "@causaloop/devtools": path.resolve(
        __dirname,
        "../causaloop-repo/packages/devtools/src",
      ),
    },
  },
});
