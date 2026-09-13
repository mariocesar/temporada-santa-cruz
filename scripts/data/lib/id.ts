/**
 * Deterministic observation IDs (PROJECT.md §65–66).
 *
 * The ID hashes the observation's SOURCE IDENTITY — original publisher (not
 * the mirror it arrived through), report, date, market and the raw row
 * dimensions. Re-importing the same report, or importing the same report
 * from a mirror, reproduces the same ID, which makes deduplication a plain
 * ID collision.
 */

import { createHash } from 'node:crypto'

export interface ObservationIdentity {
  originalSourceId: string
  reportId: string
  observedAt: string
  market: string
  productRaw: string
  originRaw: string
  varietyRaw: string
  quality: string
  /**
   * Print-order discriminator for reports whose printed dimensions do not
   * disambiguate tiered lines (see `row_seq` in schemas.ts). Appended to
   * the key ONLY when non-empty so that every pre-existing observation ID
   * stays stable. Unambiguous: text fields cannot contain the separator,
   * so a 9-field key can never collide with an 8-field one.
   */
  rowSeq?: string
}

const SEP = "\u001f" // unit separator: cannot appear in CSV text fields

export function observationId(identity: ObservationIdentity): string {
  const fields = [
    identity.originalSourceId,
    identity.reportId,
    identity.observedAt,
    identity.market,
    identity.productRaw,
    identity.originRaw,
    identity.varietyRaw,
    identity.quality,
  ]
  if (identity.rowSeq) fields.push(identity.rowSeq)
  const key = fields.join(SEP)
  return 'obs_' + createHash('sha256').update(key, 'utf8').digest('hex').slice(0, 16)
}
