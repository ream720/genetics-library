import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  let base = "/"; // Default (for Firebase)

  if (mode === "gh-pages") {
    // If we run `vite build --mode gh-pages`
    base = "/genetics-library/";
  }

  return {
    plugins: [react()],
    base,
  };
});
