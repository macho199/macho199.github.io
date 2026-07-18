/** @typedef {Readonly<{ tags: readonly string[] }>} TaggedPost */

export const ALL_POSTS_FILTER = "__all_posts__"

/**
 * @param {readonly TaggedPost[]} posts
 * @returns {string[]}
 */
export const collectPostTags = posts => {
  const seen = new Set()
  const tags = []

  for (const post of posts) {
    for (const tag of post.tags) {
      if (tag.trim().length === 0 || seen.has(tag)) {
        continue
      }

      seen.add(tag)
      tags.push(tag)
    }
  }

  return tags
}

/**
 * @template {TaggedPost} T
 * @param {readonly T[]} posts
 * @param {string} selectedTag
 * @returns {T[]}
 */
export const filterPostsByTag = (posts, selectedTag) => {
  if (
    selectedTag === ALL_POSTS_FILTER ||
    !collectPostTags(posts).includes(selectedTag)
  ) {
    return [...posts]
  }

  return posts.filter(post => post.tags.includes(selectedTag))
}
