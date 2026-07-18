/**
 * @typedef {Readonly<{
 *   id: string
 *   href: `#${string}`
 *   title: string
 * }>} PostTocItem
 */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isRecord = value =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/**
 * @param {unknown} tableOfContents
 * @returns {PostTocItem[]}
 */
export const normalizePostTableOfContents = tableOfContents => {
  if (!isRecord(tableOfContents) || !Array.isArray(tableOfContents.items)) {
    return []
  }

  return tableOfContents.items.flatMap(item => {
    if (!isRecord(item)) {
      return []
    }

    const title = typeof item.title === "string" ? item.title.trim() : ""
    const url = typeof item.url === "string" ? item.url : ""

    if (!title || !url.startsWith("#") || url.length === 1) {
      return []
    }

    let id = ""

    try {
      id = decodeURIComponent(url.slice(1))
    } catch {
      return []
    }

    if (!id) {
      return []
    }

    const href = /** @type {`#${string}`} */ (url)

    return [{ id, href, title }]
  })
}
