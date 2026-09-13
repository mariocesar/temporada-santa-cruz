/**
 * Minimal RFC-4180-style CSV support for the offline pipeline (§64).
 * Handles quoted fields containing commas, escaped quotes ("") and newlines.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  const push = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    push()
    rows.push(row)
    row = []
  }
  while (i < text.length) {
    const c = text[i]!
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      if (field !== '') throw new Error(`Unexpected quote mid-field at offset ${i}`)
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      push()
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      pushRow()
      i++
      continue
    }
    field += c
    i++
  }
  if (inQuotes) throw new Error('Unterminated quoted CSV field')
  if (field !== '' || row.length > 0) pushRow()
  return rows
}

/** Parse a CSV with a header row into records keyed by column name. */
export function parseCsvRecords(text: string): {
  header: string[]
  records: Array<Record<string, string>>
} {
  const rows = parseCsv(text)
  if (rows.length === 0) return { header: [], records: [] }
  const header = rows[0]!
  const records: Array<Record<string, string>> = []
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]!
    if (cells.length === 1 && cells[0] === '') continue // trailing blank line
    if (cells.length !== header.length) {
      throw new Error(
        `CSV row ${r + 1} has ${cells.length} fields, header has ${header.length}`,
      )
    }
    const record: Record<string, string> = {}
    header.forEach((name, c) => {
      record[name] = cells[c]!
    })
    records.push(record)
  }
  return { header, records }
}

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function toCsv(rows: ReadonlyArray<ReadonlyArray<string>>): string {
  return rows.map((row) => row.map(escapeField).join(',')).join('\n') + '\n'
}
