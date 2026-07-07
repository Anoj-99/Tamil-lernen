import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Verhindert, dass Vite die PostCSS-Config (Tailwind v3) des
  // TamilConnect-Repos eine Ebene höher aufsammelt.
  css: { postcss: { plugins: [] } },
});
