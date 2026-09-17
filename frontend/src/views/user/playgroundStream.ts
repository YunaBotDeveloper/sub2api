// Parses an OpenAI chat-completions SSE stream into content deltas.
export async function* readChatDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const lines = buffer.split('\n')
      buffer = done ? '' : (lines.pop() ?? '')
      for (const raw of lines) {
        const line = raw.trim()
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '' || data === '[DONE]') continue
        const chunk = JSON.parse(data)
        if (chunk.error) throw new Error(chunk.error.message || 'stream error')
        const delta = chunk.choices?.[0]?.delta?.content
        if (delta) yield delta
      }
      if (done) return
    }
  } finally {
    reader.releaseLock()
  }
}

// Extracts a readable message from a non-2xx gateway response.
export async function responseError(res: Response): Promise<string> {
  const text = await res.text()
  try {
    return JSON.parse(text).error?.message || text || `HTTP ${res.status}`
  } catch {
    return text || `HTTP ${res.status}`
  }
}
