import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || env.API_URL || "https://api.alpha-cut.com";

  return {
    plugins: [react()],
    build: {
      emptyOutDir: false,
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err, _req, res) => {
              if (res && "writeHead" in res && !(res as any).headersSent) {
                (res as any).writeHead(502, { "Content-Type": "application/json" });
                (res as any).end(
                  JSON.stringify({ error: "API Gateway proxy unreachable", detail: err.message })
                );
              }
            });
          },
        },
      },
    },
  };
});
