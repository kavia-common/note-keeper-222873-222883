import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Ensure the dev server is accessible externally and on the correct port
    host: '0.0.0.0',
    port: 3000,
    // Allow the Kavia-hosted domain to access the dev server
    allowedHosts: [
      'vscode-internal-22144-beta.beta01.cloud.kavia.ai'
    ]
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
})
