import { describe, expect, it } from 'vitest'
import { extractHtml } from '../qualityTestHtml'

describe('extractHtml', () => {
  it('unwraps fenced html and drops surrounding prose', () => {
    expect(extractHtml('Here you go:\n```html\n<!DOCTYPE html><html></html>\n```\nEnjoy')).toBe('<!DOCTYPE html><html></html>')
  })

  it('skips leading prose without fences', () => {
    expect(extractHtml('Sure! <html><body>x</body></html>')).toBe('<html><body>x</body></html>')
  })

  it('returns raw output when no html marker exists', () => {
    expect(extractHtml('  <svg></svg> ')).toBe('<svg></svg>')
  })
})
