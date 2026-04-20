import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "/pokedex/",
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
  ],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query")) return "query";
          if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router") || id.includes("@tanstack/history")) return "router";
          if (id.includes("radix-ui") || id.includes("@radix-ui")) return "radix";
          if (id.includes("/react-dom/") || id.includes("/react/") || id.includes("scheduler")) return "react";
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
