// All Claude calls go through /api/claude — key stays server-side

export async function callClaude({ system, messages, maxTokens = 1024 }) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const msg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error)
    throw new Error(msg || 'Claude API error')
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// Parse JSON from Claude response safely (strips markdown fences)
export function parseJSON(text) {
  const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  return JSON.parse(cleaned)
}
