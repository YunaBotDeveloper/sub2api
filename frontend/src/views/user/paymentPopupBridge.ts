/**
 * Hand the payment outcome from the checkout popup back to the window that
 * opened it.
 *
 * The gateway redirects the popup to our result page, which leaves the outcome
 * stranded in a window the user did not start from. The popup therefore posts a
 * short message to its opener and closes itself; the opener navigates to the
 * result page in place.
 *
 * The message carries only the identifiers needed to address the order. It is
 * never trusted for the payment outcome itself — the result page always reloads
 * the order from the backend — so a forged message can at most send the user to
 * a result page that then reports the real status.
 */

export const PAYMENT_POPUP_RESULT_MESSAGE = 'sub2api:payment-result'

/** Query parameters the result page needs to look an order up. */
const FORWARDED_QUERY_KEYS = ['order_id', 'out_trade_no', 'resume_token', 'status'] as const

export type PaymentPopupResultQuery = Partial<Record<(typeof FORWARDED_QUERY_KEYS)[number], string>>

export interface PaymentPopupResultMessage {
  type: typeof PAYMENT_POPUP_RESULT_MESSAGE
  query: PaymentPopupResultQuery
}

/** Keep only the known keys, as strings — never forward arbitrary query input. */
export function pickPopupResultQuery(query: Record<string, unknown>): PaymentPopupResultQuery {
  const picked: PaymentPopupResultQuery = {}
  for (const key of FORWARDED_QUERY_KEYS) {
    const value = query[key]
    if (typeof value === 'string' && value.trim()) {
      picked[key] = value
    }
  }
  return picked
}

function isPaymentPopupResultMessage(data: unknown): data is PaymentPopupResultMessage {
  if (!data || typeof data !== 'object') return false
  const candidate = data as Partial<PaymentPopupResultMessage>
  return candidate.type === PAYMENT_POPUP_RESULT_MESSAGE
    && !!candidate.query
    && typeof candidate.query === 'object'
}

/**
 * Called from the popup. Reports the outcome to the opener and closes.
 *
 * Returns true when the handoff happened, false when this window is not a
 * popup (or its opener is gone) and should render the result itself.
 */
export function reportResultToOpener(
  query: Record<string, unknown>,
  win: Window = window,
): boolean {
  const opener = win.opener as Window | null
  if (!opener || opener === win) return false

  try {
    // Same-origin target only: the opener is our own app, and restricting the
    // target keeps the order identifiers away from any other document that
    // might end up in this window.
    opener.postMessage(
      { type: PAYMENT_POPUP_RESULT_MESSAGE, query: pickPopupResultQuery(query) },
      win.location.origin,
    )
  } catch {
    // A closed or cross-origin opener throws; fall back to rendering here.
    return false
  }

  try {
    win.close()
  } catch {
    // Closing can be refused; the message already reached the opener, so the
    // user still sees the result in the main window.
  }
  return true
}

/**
 * Called from the window that opened the popup. Invokes `onResult` with the
 * forwarded query. Returns a function that removes the listener.
 */
export function listenForPopupResult(
  onResult: (query: PaymentPopupResultQuery) => void,
  win: Window = window,
): () => void {
  const handler = (event: MessageEvent) => {
    // Reject anything not from our own origin before looking at the payload.
    if (event.origin !== win.location.origin) return
    if (!isPaymentPopupResultMessage(event.data)) return
    onResult(pickPopupResultQuery(event.data.query as Record<string, unknown>))
  }

  win.addEventListener('message', handler)
  return () => win.removeEventListener('message', handler)
}
