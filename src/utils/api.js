// All Claude calls go through /api/claude — key stays server-side

export async function callClaude({ system, messages, maxTokens = 1024 }) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Claude API error')
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// Parse JSON from Claude response safely (strips markdown fences)
export function parseJSON(text) {
  const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  return JSON.parse(cleaned)
}
