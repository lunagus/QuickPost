
import { defineConfig } from 'vite'

export default defineConfig({
  // Basic configuration needed for the project
  server: {
    // Falls back to index.html for unknown routes (SPA behavior)
    proxy: {}, // keeps default behavior but explicitly defining allows easier extension
    fs: {
      strict: false
    }
  },
  // Ensure that in development, we fallback to index.html for non-existent paths
  // This is often default in Vite for SPA but explicit configuration helps avoid issues
  // "appType: 'spa'" suggests that if a static asset is not found, serve index.html
  appType: 'spa'
})
