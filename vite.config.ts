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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }
            if (id.includes("@mui/x-data-grid")) {
              return "mui-data-grid";
            }
            if (id.includes("@mui") || id.includes("@emotion")) {
              return "mui";
            }
            if (id.includes("@firebase/firestore")) {
              return "firebase-firestore";
            }
            if (id.includes("@firebase/auth")) {
              return "firebase-auth";
            }
            if (id.includes("@firebase/storage")) {
              return "firebase-storage";
            }
            if (id.includes("@firebase/functions")) {
              return "firebase-functions";
            }
            if (id.includes("@firebase") || id.includes("/firebase/")) {
              return "firebase-core";
            }
            if (
              id.includes("react-dom") ||
              id.includes("react-router") ||
              id.includes("\\node_modules\\react\\") ||
              id.includes("/node_modules/react/")
            ) {
              return "react-vendor";
            }
            return "vendor";
          },
        },
      },
    },
  };
});
