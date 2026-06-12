import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Render API — baked into production build if VITE_API_URL is unset on Vercel. */
const DEFAULT_PRODUCTION_API_URL = "https://nutricrew-dddi.onrender.com/api";

export default defineConfig(({ mode }) => {
  if (mode === "production" && !process.env.VITE_API_URL) {
    process.env.VITE_API_URL = "https://nutricrew-dddi.onrender.com/api";
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("react-dom") ||
                id.includes("react-router") ||
                id.includes("/react/")
              ) {
                return "vendor-react";
              }
              if (id.includes("i18next")) {
                return "vendor-i18n";
              }
            }
            if (
              id.includes("/locales/exercises") ||
              id.includes("/locales/dishRecipes") ||
              id.includes("/locales/dishNames") ||
              id.includes("/locales/exerciseNames")
            ) {
              return "wellness-i18n";
            }
          },
        },
      },
    },
  };
});
