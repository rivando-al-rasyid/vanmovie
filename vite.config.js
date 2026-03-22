import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  // Multi-page app: each HTML file is its own entry point
  build: {
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        films:  resolve(__dirname, 'films.html'),
        signup: resolve(__dirname, 'signup.html'),
      },
    },
  },
    plugins: [
    tailwindcss(),
  ],

});
