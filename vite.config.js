import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/* `npm run build` inlines everything into dist/index.html, so the result still works as one self-contained file */
export default defineConfig({
  plugins: [tailwindcss(), viteSingleFile()],
});
