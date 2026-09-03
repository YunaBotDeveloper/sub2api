import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AmountInput from '../AmountInput.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

function mountInput(props: Record<string, unknown> = {}) {
  return mount(AmountInput, {
    props: { modelValue: null, ...props },
  })
}

describe('AmountInput currency switch', () => {
  it('hides the switch when only one currency is offered', () => {
    const wrapper = mountInput({ currencyOptions: ['VND'] })
    expect(wrapper.findAll('button').some((b) => b.text() === 'VND')).toBe(false)
  })

  it('emits the picked currency', async () => {
    const wrapper = mountInput({ currency: 'VND', currencyOptions: ['VND', 'USD'] })
    const usd = wrapper.findAll('button').find((b) => b.text() === 'USD')
    expect(usd).toBeTruthy()
    await usd!.trigger('click')
    expect(wrapper.emitted('update:currency')).toEqual([['USD']])
  })

  it('rejects a fractional amount in a zero-decimal currency', async () => {
    // 10.5 ₫ does not exist; the input must refuse the decimal point outright
    // rather than let the backend round it away.
    const wrapper = mountInput({ currency: 'VND' })
    const input = wrapper.get('input')
    await input.setValue('10.5')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()

    await input.setValue('10000')
    expect(wrapper.emitted('update:modelValue')).toEqual([[10000]])
  })

  it('allows two decimals in USD', async () => {
    const wrapper = mountInput({ currency: 'USD' })
    await wrapper.get('input').setValue('10.55')
    expect(wrapper.emitted('update:modelValue')).toEqual([[10.55]])
  })

  it('renders quick amounts with thousand separators', () => {
    // 1000000 makes the reader count zeroes; ₫1,000,000 does not.
    const text = mountInput({ currency: 'VND', amounts: [1000000] }).text()
    expect(text).toContain('1,000,000')
    expect(text).not.toContain('1000000')
  })

  it('shows the symbol for the active currency', async () => {
    expect(mountInput({ currency: 'VND' }).text()).toContain('₫')
    expect(mountInput({ currency: 'USD' }).text()).toContain('$')
  })
})
