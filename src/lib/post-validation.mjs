const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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
      Number.isNaN(Date.parse(frontmatter.publishedAt))
    ) {
      errors.push(`Post ${post.id} publishedAt is not a valid date: ${frontmatter.publishedAt}`)
    }
  }

  return errors
}
