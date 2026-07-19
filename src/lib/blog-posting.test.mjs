import assert from "node:assert/strict"
import { test } from "node:test"

import {
  createBlogPosting,
  serializeJsonLd,
} from "./blog-posting.mjs"

test("creates BlogPosting data from canonical post metadata", () => {
  const result = createBlogPosting({
    title: "MDX <GraphQL>",
    description: "Gatsby post pipeline",
    publishedAt: "2026-05-16",
    tags: ["Gatsby", "MDX"],
    canonicalUrl:
      "https://macho199.github.io/posts/gatsby-mdx-graphql-post-system/",
    authorName: "권종성",
    authorUrl: "https://github.com/macho199",
  })

  assert.deepEqual(result, {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "MDX <GraphQL>",
    description: "Gatsby post pipeline",
    datePublished: "2026-05-16",
    url: "https://macho199.github.io/posts/gatsby-mdx-graphql-post-system/",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id":
        "https://macho199.github.io/posts/gatsby-mdx-graphql-post-system/",
    },
    author: {
      "@type": "Person",
      name: "권종성",
      url: "https://github.com/macho199",
    },
    keywords: ["Gatsby", "MDX"],
  })
})

test("serializes JSON-LD without a literal less-than sign", () => {
  const dangerousText = "</script><script>alert('x')</script>"
  const serialized = serializeJsonLd({ headline: dangerousText })

  assert.equal(serialized.includes("<"), false)
  assert.match(serialized, /\\u003c\/script>/)
  assert.deepEqual(JSON.parse(serialized), { headline: dangerousText })
})
