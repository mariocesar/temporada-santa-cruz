import { describe, expect, it } from 'vitest'
import { parseCsv, parseCsvRecords, toCsv } from '../../scripts/data/lib/csv'

describe('parseCsv', () => {
  it('parses quoted fields with commas, escaped quotes and newlines', () => {
    const text = 'a,"b,c","say ""hi""","line\nbreak"\n'
    expect(parseCsv(text)).toEqual([['a', 'b,c', 'say "hi"', 'line\nbreak']])
  })

  it('handles CRLF and trailing newlines', () => {
    expect(parseCsv('a,b\r\nc,d\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('rejects unterminated quotes', () => {
    expect(() => parseCsv('a,"broken')).toThrow(/Unterminated/)
  })
})

describe('parseCsvRecords', () => {
  it('maps rows to header keys and rejects ragged rows', () => {
    const { records } = parseCsvRecords('x,y\n1,2\n3,4\n')
    expect(records).toEqual([
      { x: '1', y: '2' },
      { x: '3', y: '4' },
    ])
    expect(() => parseCsvRecords('x,y\n1\n')).toThrow(/fields/)
  })

  it('handles empty input', () => {
    expect(parseCsvRecords('')).toEqual({ header: [], records: [] })
  })
})

describe('toCsv', () => {
  it('round-trips through parseCsv', () => {
    const rows = [
      ['a', 'b,c', 'say "hi"'],
      ['', 'plain', 'multi\nline'],
    ]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})
