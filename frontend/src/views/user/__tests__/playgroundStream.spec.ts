import { describe, expect, it } from 'vitest'
import { readChatDeltas, responseError } from '../playgroundStream'

function streamOf(...parts: string[]) {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      parts.forEach((part) => controller.enqueue(encoder.encode(part)))
      controller.close()
    }
  })
}

async function collect(body: ReadableStream<Uint8Array>) {
  let out = ''
  for await (const delta of readChatDeltas(body)) out += delta
  return out
}

describe('playgroundStream', () => {
  it('joins deltas split across chunks and stops at [DONE]', async () => {
    const body = streamOf(
      'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\ndata: {"choi',
      'ces":[{"delta":{"content":"lo"}}]}\n\n: keep-alive\n\ndata: [DONE]\n\n'
    )
    expect(await collect(body)).toBe('Hello')
  })

  it('throws on an in-stream error event', async () => {
    await expect(collect(streamOf('data: {"error":{"message":"quota"}}\n\n'))).rejects.toThrow('quota')
  })

  it('reads the gateway error message', async () => {
    expect(await responseError(new Response('{"error":{"message":"bad key"}}', { status: 401 }))).toBe('bad key')
    expect(await responseError(new Response('', { status: 502 }))).toBe('HTTP 502')
  })
})
