export function tryParseJson(text) {
  if (!text || text.length < 2) return null
  try {
    return JSON.parse(text)
  } catch {
    // Try to find the last complete JSON object in the text
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}
