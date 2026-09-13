/** Shared filesystem helpers for the offline data pipeline. */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository root (scripts/data/lib/ → three levels up). */
export const ROOT = fileURLToPath(new URL('../../..', import.meta.url))

export const PATHS = {
  raw: path.join(ROOT, 'data', 'raw'),
  normalized: path.join(ROOT, 'data', 'normalized'),
  generated: path.join(ROOT, 'data', 'generated'),
  metadata: path.join(ROOT, 'data', 'metadata'),
  publicData: path.join(ROOT, 'public', 'data'),
} as const

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T
}

export function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
}

export function readText(file: string): string {
  return fs.readFileSync(file, 'utf8')
}

export function writeText(file: string, text: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}

/** All CSV files under a directory, recursively, sorted for determinism. */
export function listCsvFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith('.csv')) {
      out.push(path.join(entry.parentPath, entry.name))
    }
  }
  return out.sort()
}

/** Loud pipeline failure (§44: fail data builds loudly). */
export function fail(message: string): never {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

export function ok(message: string): void {
  console.log(`✔ ${message}`)
}
