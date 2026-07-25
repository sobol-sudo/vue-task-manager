import { defineConfig } from 'cypress'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The e2e suite runs against a production build, which persists tasks through
 * the REST backend in `VITE_API_URL`. The specs need that same URL to delete
 * the records they created even when an assertion failed before the UI got the
 * chance to, so resolve it here — on the Node side, where the env files are
 * readable — and hand it to the browser through `Cypress.env('apiUrl')`.
 *
 * The lookup follows Vite's own precedence: an explicit `VITE_API_URL` in the
 * environment wins, then `.env.production.local`, then `.env.production`.
 *
 * Cypress loads this file without a TypeScript transform, so it has to stay
 * free of type annotations even though it is typed as `.ts` everywhere else.
 */
const resolveApiUrl = () => {
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL

  const projectRoot = dirname(fileURLToPath(import.meta.url))

  // Both files are optional; fall through to the next candidate.
  for (const envFile of ['.env.production.local', '.env.production']) {
    const envPath = resolve(projectRoot, envFile)
    if (!existsSync(envPath)) continue

    const match = readFileSync(envPath, 'utf8').match(/^VITE_API_URL=(.+)$/m)
    if (match) return match[1].trim()
  }

  return 'local'
}

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:4173',
    env: {
      apiUrl: resolveApiUrl(),
    },
  },
})
