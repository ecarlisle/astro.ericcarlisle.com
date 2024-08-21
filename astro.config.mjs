import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

import playformCompress from "@playform/compress";

// https://astro.build/config
export default defineConfig({
  cacheDir: "./cache",
  compressHTML: true,
  outDir: "./dist",
  publicDir: "./public",
  root: ".",
  site: "https://ericcarlisle.com",
  srcDir: "./src",
  trailingSlash: "always",
  type: "static",
  build: {
    format: "directory",
    inlineStylesheets: "always"
  },
  server: {
    open: "/",
    port: 3000,
    host: true
  },
  devToolbar: {
    enabled: false
  },
  integrations: [mdx(), sitemap(), react({
    include: ['**/react/*']
  }), playformCompress()]
});