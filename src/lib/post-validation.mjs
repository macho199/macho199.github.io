const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const publishedAtPattern = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * @param {number} year
 * @returns {boolean}
 */
const isLeapYear = year => year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)

/**
 * @param {string} value
 * @returns {boolean}
 */
const isValidPublishedAt = value => {
  const match = publishedAtPattern.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < 1 || month < 1 || month > 12) {
    return false
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

  return day >= 1 && day <= daysInMonth[month - 1]
}

/**
 * @typedef {object} PostFrontmatter
 * @property {string | null | undefined} title
 * @property {string | null | undefined} slug
 * @property {string | null | undefined} publishedAt
 * @property {string | null | undefined} description
 * @property {Array<string> | null | undefined} tags
 */

/**
 * @typedef {object} PostNode
 * @property {string} id
 * @property {PostFrontmatter | null | undefined} frontmatter
 */

/**
 * Validate author-controlled post metadata before Gatsby creates routes.
 *
 * @param {Array<PostNode>} posts
 * @returns {Array<string>}
 */
export const validatePostNodes = posts => {
  /** @type {Array<string>} */
  const errors = []
  /** @type {Map<string, string>} */
  const slugOwners = new Map()

  for (const post of posts) {
    const frontmatter = post.frontmatter

    if (!frontmatter) {
      errors.push(`Post ${post.id} is missing frontmatter.`)
      continue
    }

    /** @type {Array<"title" | "slug" | "publishedAt" | "description">} */
    const requiredStringFields = ["title", "slug", "publishedAt", "description"]

    for (const field of requiredStringFields) {
      const value = frontmatter[field]

      if (typeof value !== "string" || value.trim() === "") {
        errors.push(`Post ${post.id} requires a non-empty ${field}.`)
      }
    }

    if (!Array.isArray(frontmatter.tags)) {
      errors.push(`Post ${post.id} requires a tags array.`)
    } else if (frontmatter.tags.some(tag => typeof tag !== "string" || tag.trim() === "")) {
      errors.push(`Post ${post.id} contains an empty tag.`)
    }

    const slug = frontmatter.slug

    if (typeof slug !== "string" || !slugPattern.test(slug)) {
      errors.push(
        `Post ${post.id} slug must use lowercase letters, numbers, and single hyphens: ${String(slug)}`,
      )
    } else {
      const existingOwner = slugOwners.get(slug)

      if (existingOwner) {
        errors.push(`Duplicate post slug "${slug}" in ${existingOwner} and ${post.id}.`)
      } else {
        slugOwners.set(slug, post.id)
      }
    }

    if (
      typeof frontmatter.publishedAt === "string" &&
      frontmatter.publishedAt.trim() !== "" &&
      !isValidPublishedAt(frontmatter.publishedAt)
    ) {
      errors.push(
        `Post ${post.id} publishedAt must be a real calendar date in YYYY-MM-DD format: ${frontmatter.publishedAt}`,
      )
    }
  }

  return errors
}
