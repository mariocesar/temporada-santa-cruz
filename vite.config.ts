import { readFileSync } from 'node:fs'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, type Plugin } from 'vite'

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

/**
 * Demo-data guard (PROJECT.md §79): a production build that ships synthetic
 * data must be a deliberate decision. If public/data/index.json says
 * containsDemoData, `vite build` fails unless ALLOW_DEMO_DATA=true.
 * The UI additionally shows the DATOS DE DEMOSTRACIÓN banner at runtime.
 */
function demoDataGuard(): Plugin {
  return {
    name: 'temporada:demo-data-guard',
    apply: 'build',
    buildStart() {
      let index: { containsDemoData?: boolean }
      try {
        index = JSON.parse(readFileSync(new URL('./public/data/index.json', import.meta.url), 'utf8'))
      } catch {
        throw new Error(
          'public/data/index.json is missing or unreadable — run `bun run data` before building.',
        )
      }
      if (index.containsDemoData && process.env.ALLOW_DEMO_DATA !== 'true') {
        throw new Error(
          'The published dataset contains SYNTHETIC demo records. ' +
            'Set ALLOW_DEMO_DATA=true to deliberately build a demo deployment.',
        )
      }
    },
  }
}

export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH ?? '/'
  return {
    base,
    plugins: [svelte(), demoDataGuard()],
  }
})
