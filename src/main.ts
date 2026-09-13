import { mount } from 'svelte'
// Self-hosted fonts (no external requests from the published page):
// Alegreya + Alegreya Sans, Huerta Tipográfica's Spanish-language
// superfamily — the editorial voice of the design system (§9).
import '@fontsource/alegreya/500.css'
import '@fontsource/alegreya/700.css'
import '@fontsource/alegreya/800.css'
import '@fontsource/alegreya-sans/400.css'
import '@fontsource/alegreya-sans/400-italic.css'
import '@fontsource/alegreya-sans/500.css'
import '@fontsource/alegreya-sans/700.css'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
