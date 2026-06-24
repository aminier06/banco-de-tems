import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // GitHub Pages publica los proyectos en una subruta: https://usuario.github.io/nombre-repo/
  // El workflow de GitHub Actions pasa VITE_BASE_PATH con ese valor al compilar.
  // En desarrollo local (npm run dev) o en otros hostings, se queda en "/".
  base: process.env.VITE_BASE_PATH || "/",
});
