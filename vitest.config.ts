import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    // читає baseUrl/paths з твого tsconfig
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      // на випадок, якщо немає paths у tsconfig — дублюємо явно
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    testTimeout: 20000,           // глобальний таймаут
    hookTimeout: 20000,
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
});
