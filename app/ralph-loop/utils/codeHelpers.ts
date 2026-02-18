export function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars).trimEnd()}...`
}

export function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function titleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function extractAppNameFromUrl(url: string): string {
  if (!url || url === 'https://example.com') return ''

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    // Remove www. prefix
    const domain = hostname.replace(/^www\./, '')

    // Extract main domain name (before first dot or entire if no dot)
    const mainDomain = domain.split('.')[0]

    // Convert to title case (e.g., 'google' -> 'Google', 'flipkart' -> 'Flipkart')
    return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1)
  } catch {
    return ''
  }
}

export function deriveNameFromCode(code: string) {
  const testMatch = code.match(/test\(['"]([^'"]+)['"]/)
  if (testMatch?.[1]) return testMatch[1]
  const classMatch = code.match(/class\s+([A-Za-z0-9_]+)/)
  if (classMatch?.[1]) return classMatch[1]
  const nameMatch = code.match(/suiteName\s*[:=]\s*['"]([^'"]+)['"]/)
  if (nameMatch?.[1]) return nameMatch[1]
  return ''
}

