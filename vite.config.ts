import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base so the build also works when hosted on GitHub Pages.
  base: "./",
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
