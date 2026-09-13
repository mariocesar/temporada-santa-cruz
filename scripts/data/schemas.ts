/**
 * Zod schemas for pipeline inputs (PROJECT.md §44). Data builds fail loudly
 * on schema violations; nothing malformed reaches the normalized layer.
 */

import { z } from 'zod'

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')

/** Empty string or a non-negative decimal (CSV cells are strings). */
const priceCell = z.string().regex(/^(\d+(\.\d+)?)?$/, 'expected empty or non-negative decimal')

/**
 * Text cell: control characters are rejected because deterministic IDs and
 * dedup keys join fields with U+001F — that invariant is enforced here, not
 * merely assumed (see scripts/data/lib/id.ts).
 */
const textCell = z
  .string()
  .refine((s) => !/[\u0000-\u001f\u007f]/.test(s), 'control characters are not allowed')

const requiredTextCell = textCell.refine((s) => s.length > 0, 'must not be empty')

/**
 * Contributor CSV row (§64) plus `report_id`, which links each row to the
 * source report/document it was transcribed from (needed for deterministic
 * IDs, deduplication and report-coverage tracking).
 */
export const rawCsvRowSchema = z.strictObject({
  observed_at: isoDateSchema,
  source_id: requiredTextCell,
  report_id: requiredTextCell,
  market: textCell,
  product_raw: requiredTextCell,
  origin_raw: textCell,
  variety_raw: textCell,
  quality: textCell,
  availability: textCell,
  wholesale_price: priceCell,
  wholesale_unit: textCell,
  retail_price: priceCell,
  retail_unit: textCell,
})

export type RawCsvRow = z.infer<typeof rawCsvRowSchema>

export const RAW_CSV_COLUMNS = Object.keys(rawCsvRowSchema.shape) as Array<keyof RawCsvRow>

// ---------------------------------------------------------------------------
// Registry schemas
// ---------------------------------------------------------------------------

export const productSchema = z.strictObject({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  nameEs: z.string().min(1),
  scientificName: z.string().min(1).optional(),
  aliases: z.array(z.string().min(1)),
  category: z.enum(['fruit', 'vegetable', 'tuber', 'grain', 'herb', 'other']),
  varieties: z.array(z.string().min(1)).optional(),
})

export const originSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  country: z.string().min(1),
  department: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  municipality: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  level: z.enum(['country', 'department', 'province', 'municipality', 'region', 'unknown']),
  aliases: z.array(z.string().min(1)).optional(),
})

export const unitDefSchema = z.strictObject({
  id: z.string().min(1),
  canonical: z.string().min(1),
  aliases: z.array(z.string().min(1)).min(1),
  knownWeightKg: z.number().positive().optional(),
  conversionConfidence: z.number().min(0).max(1).optional(),
})

export const sourceSchema = z
  .strictObject({
    id: z.string().min(1),
    name: z.string().min(1),
    publisher: z.string().min(1),
    /** Evidence taxonomy (§104): market | census | literature. */
    sourceType: z.enum(['market', 'census', 'literature']),
    url: z.url().optional(),
    description: z.string().optional(),
    coverageStart: isoDateSchema.optional(),
    coverageEnd: isoDateSchema.optional(),
    accessedAt: isoDateSchema.optional(),
    methodologyNotes: z.string().optional(),
    licenseNotes: z.string().optional(),
    kind: z.enum(['original', 'mirror']),
    mirrorOf: z.string().min(1).optional(),
    synthetic: z.boolean().optional(),
  })
  // Literature citations must be retrievable and dated (§104).
  .superRefine((source, ctx) => {
    if (source.sourceType !== 'literature') return
    if (!source.url) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'literature sources require url' })
    }
    if (!source.accessedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['accessedAt'],
        message: 'literature sources require accessedAt',
      })
    }
  })

// ---------------------------------------------------------------------------
// Phenology registry (reference seasons, §104)
// ---------------------------------------------------------------------------

const phenologyMonth = z.number().int().min(1).max(12)
/** Week bins only — week 53 is never authorable (folded 52-bin grid). */
const phenologyWeek = z.number().int().min(1).max(52)

/** Cyclic window: months 1–12 or week bins 1–52; start > end wraps. */
export const phenologyWindowSchema = z.union([
  z.strictObject({ startMonth: phenologyMonth, endMonth: phenologyMonth }),
  z.strictObject({ startWeek: phenologyWeek, endWeek: phenologyWeek }),
])

export const phenologyEntrySchema = z.strictObject({
  productId: z.string().min(1),
  windows: z.array(phenologyWindowSchema).min(1),
  /** Cited sources; cross-checked against the source registry (§104). */
  sourceIds: z.array(z.string().min(1)).min(1),
  /** Optional Spanish display note (e.g. region caveat). */
  note: z.string().min(1).optional(),
  /** Free-form citation detail: document, section/page, window read. */
  citation: z.string().min(1),
})

export type PhenologyEntry = z.infer<typeof phenologyEntrySchema>

export const productsFileSchema = z.array(productSchema)
export const originsFileSchema = z.array(originSchema)
export const unitsFileSchema = z.array(unitDefSchema)
export const sourcesFileSchema = z.array(sourceSchema)
export const phenologyFileSchema = z.array(phenologyEntrySchema)
