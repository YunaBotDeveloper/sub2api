import { describe, expect, it, vi } from 'vitest'
import {
  PAYMENT_POPUP_RESULT_MESSAGE,
  listenForPopupResult,
  pickPopupResultQuery,
  reportResultToOpener,
} from '../paymentPopupBridge'

const ORIGIN = 'https://panel.example.com'

function fakeWindow(overrides: Partial<Window> = {}) {
  const listeners: Array<(event: MessageEvent) => void> = []
  const win = {
    location: { origin: ORIGIN },
    opener: null as Window | null,
    close: vi.fn(),
    addEventListener: vi.fn((_type: string, handler: (event: MessageEvent) => void) => {
      listeners.push(handler)
    }),
    removeEventListener: vi.fn((_type: string, handler: (event: MessageEvent) => void) => {
      const index = listeners.indexOf(handler)
      if (index >= 0) listeners.splice(index, 1)
    }),
    ...overrides,
  }
  return { win: win as unknown as Window, listeners }
}

describe('pickPopupResultQuery', () => {
  it('keeps only the known order identifiers', () => {
    expect(pickPopupResultQuery({
      order_id: '4',
      out_trade_no: 'sub2_1',
      resume_token: 'tok',
      status: 'cancelled',
      redirect: 'https://evil.example.com',
      admin: 'true',
    })).toEqual({
      order_id: '4',
      out_trade_no: 'sub2_1',
      resume_token: 'tok',
      status: 'cancelled',
    })
  })

  it('drops blank and non-string values', () => {
    expect(pickPopupResultQuery({ order_id: '  ', out_trade_no: 42, status: undefined })).toEqual({})
  })
})

describe('reportResultToOpener', () => {
  it('posts the order to the opener at our own origin and closes', () => {
    const postMessage = vi.fn()
    const { win } = fakeWindow({ opener: { postMessage } as unknown as Window })

    expect(reportResultToOpener({ order_id: '4', evil: 'x' }, win)).toBe(true)
    expect(postMessage).toHaveBeenCalledWith(
      { type: PAYMENT_POPUP_RESULT_MESSAGE, query: { order_id: '4' } },
      ORIGIN,
    )
    expect(win.close).toHaveBeenCalled()
  })

  it('does nothing when the window is not a popup', () => {
    const { win } = fakeWindow()

    expect(reportResultToOpener({ order_id: '4' }, win)).toBe(false)
    expect(win.close).not.toHaveBeenCalled()
  })

  it('renders in place when the opener rejects the message', () => {
    // A closed opener throws; the result must stay visible here rather than
    // closing a window that never handed anything off.
    const opener = { postMessage: vi.fn(() => { throw new Error('closed') }) }
    const { win } = fakeWindow({ opener: opener as unknown as Window })

    expect(reportResultToOpener({ order_id: '4' }, win)).toBe(false)
    expect(win.close).not.toHaveBeenCalled()
  })

  it('still reports success when closing is refused', () => {
    const postMessage = vi.fn()
    const { win } = fakeWindow({
      opener: { postMessage } as unknown as Window,
      close: vi.fn(() => { throw new Error('refused') }),
    })

    expect(reportResultToOpener({ order_id: '4' }, win)).toBe(true)
    expect(postMessage).toHaveBeenCalled()
  })
})

describe('listenForPopupResult', () => {
  it('ignores messages from another origin', () => {
    const onResult = vi.fn()
    const { win, listeners } = fakeWindow()
    listenForPopupResult(onResult, win)

    listeners[0]({
      origin: 'https://evil.example.com',
      data: { type: PAYMENT_POPUP_RESULT_MESSAGE, query: { order_id: '4' } },
    } as MessageEvent)

    expect(onResult).not.toHaveBeenCalled()
  })

  it('ignores same-origin messages that are not ours', () => {
    const onResult = vi.fn()
    const { win, listeners } = fakeWindow()
    listenForPopupResult(onResult, win)

    listeners[0]({ origin: ORIGIN, data: { type: 'something-else' } } as MessageEvent)
    listeners[0]({ origin: ORIGIN, data: 'plain string' } as MessageEvent)
    listeners[0]({ origin: ORIGIN, data: null } as MessageEvent)

    expect(onResult).not.toHaveBeenCalled()
  })

  it('forwards a filtered query for our own message', () => {
    const onResult = vi.fn()
    const { win, listeners } = fakeWindow()
    listenForPopupResult(onResult, win)

    listeners[0]({
      origin: ORIGIN,
      data: {
        type: PAYMENT_POPUP_RESULT_MESSAGE,
        query: { order_id: '4', status: 'success', redirect: 'https://evil.example.com' },
      },
    } as MessageEvent)

    expect(onResult).toHaveBeenCalledWith({ order_id: '4', status: 'success' })
  })

  it('removes the listener when stopped', () => {
    const onResult = vi.fn()
    const { win, listeners } = fakeWindow()

    const stop = listenForPopupResult(onResult, win)
    stop()

    expect(listeners).toHaveLength(0)
    expect(win.removeEventListener).toHaveBeenCalled()
  })
})
