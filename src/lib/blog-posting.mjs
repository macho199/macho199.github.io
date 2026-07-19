/**
 * @typedef {Readonly<{
 *   title: string
 *   description: string
 *   publishedAt: string
 *   tags: readonly string[]
 *   canonicalUrl: string
 *   authorName: string
 *   authorUrl: string
 * }>} BlogPostingInput
 */

/** @param {BlogPostingInput} input */
export const createBlogPosting = ({
  title,
  description,
  publishedAt,
  tags,
  canonicalUrl,
  authorName,
  authorUrl,
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: title,
  description,
  datePublished: publishedAt,
  url: canonicalUrl,
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": canonicalUrl,
  },
  author: {
    "@type": "Person",
    name: authorName,
    url: authorUrl,
  },
  keywords: [...tags],
})

/** @param {unknown} value */
export const serializeJsonLd = value =>
  JSON.stringify(value).replaceAll("<", "\\u003c")
