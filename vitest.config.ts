import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` lève une garde "Client Component" hors build Next.
      // En test node, on le neutralise pour pouvoir importer la couche service.
      "server-only": path.resolve(__dirname, "test/server-only-stub.js"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
