import { describe, expect, it } from 'vitest'
import { currencySymbol, formatPaymentAmount } from '../currency'

describe('formatPaymentAmount', () => {
  it('uses the currency default fraction digits', () => {
    expect(formatPaymentAmount(100, 'JPY', 'en-US')).not.toContain('.00')
    expect(formatPaymentAmount(100, 'KRW', 'en-US')).not.toContain('.00')
    expect(formatPaymentAmount(100, 'HKD', 'en-US')).toContain('.00')
  })
})

describe('currencySymbol', () => {
  it('maps common payment currencies and falls back safely', () => {
    expect(currencySymbol('USD')).toBe('$')
    expect(currencySymbol('cny')).toBe('¥')
    expect(currencySymbol('EUR')).toBe('€')
    // An unset currency falls back to the gateway currency (VND).
    expect(currencySymbol('')).toBe('₫')
    expect(currencySymbol('VND')).toBe('₫')
    expect(currencySymbol('XYZ')).toBe('XYZ')
  })
})

describe('formatPaymentAmount decimals per currency', () => {
  it('renders VND without decimals', () => {
    // ₫10000.00 was the bug: a hard-coded toFixed(2) on an amount whose
    // currency has no minor unit.
    const formatted = formatPaymentAmount(10000, 'VND', 'en')
    expect(formatted).not.toContain('.00')
    expect(formatted).toContain('10,000')
  })

  it('keeps two decimals for USD', () => {
    expect(formatPaymentAmount(100, 'USD', 'en')).toContain('100.00')
  })
})
