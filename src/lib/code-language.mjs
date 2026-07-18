const LANGUAGE_LABELS = new Map([
  ["js", "JavaScript"],
  ["javascript", "JavaScript"],
  ["ts", "TypeScript"],
  ["typescript", "TypeScript"],
  ["tsx", "TSX"],
  ["graphql", "GraphQL"],
  ["css", "CSS"],
  ["sh", "Shell"],
  ["bash", "Shell"],
  ["shell", "Shell"],
  ["shellscript", "Shell"],
  ["yaml", "YAML"],
  ["yml", "YAML"],
  ["text", "Text"],
  ["txt", "Text"],
  ["plain", "Text"],
])

/**
 * @param {string} [language]
 * @returns {string}
 */
export const getCodeLanguageLabel = language => {
  const normalized = language?.trim().toLowerCase() ?? ""

  if (!normalized) {
    return "Text"
  }

  const approvedLabel = LANGUAGE_LABELS.get(normalized)

  if (approvedLabel) {
    return approvedLabel
  }

  return normalized
    .split(/[-_]+/)
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}
