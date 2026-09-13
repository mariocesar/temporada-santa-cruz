import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

/**
 * Base path resolution (see PROJECT.md §5):
 *
 * - Local dev/preview: `/` (default).
 * - GitHub Pages project site (https://USER.github.io/REPO/): the deploy
 *   workflow sets VITE_BASE_PATH="/REPO/" derived from the repository name.
 * - Future custom domain: set VITE_BASE_PATH="/" explicitly in the workflow.
 *
 * Never hard-code asset URLs starting with `/` in application code; use
 * Vite's asset handling or `import.meta.env.BASE_URL`.
 */
export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH ?? '/'
  return {
    base,
    plugins: [svelte()],
  }
})
