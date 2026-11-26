import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// The website lives in public/ as finished HTML, CSS and JS: Vite serves and copies it exactly as it is.
// The React app (src/) only opens the homepage when someone lands on "/".
export default defineConfig({
  server: { host: "::", port: 8080 },
  plugins: [react()],
});
