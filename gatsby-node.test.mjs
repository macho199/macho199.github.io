import assert from "node:assert/strict"
import { test } from "node:test"

import { createPages } from "./gatsby-node.mjs"

const postNode = ({
  id,
  title,
  slug,
  publishedAt,
  sourceInstanceName = "posts",
}) => ({
  id,
  internal: { contentFilePath: `/content/${slug}/index.mdx` },
  parent: { sourceInstanceName },
  frontmatter: {
    title,
    slug,
    publishedAt,
    description: `${title} description`,
    tags: ["Gatsby"],
  },
})

test("creates post pages with chronological previous and next context", async () => {
  const articleOne = postNode({
    id: "post-1",
    title: "Article one",
    slug: "article-one",
    publishedAt: "2026-04-18",
  })
  const articleTwo = postNode({
    id: "post-2",
    title: "Article two",
    slug: "article-two",
    publishedAt: "2026-05-16",
  })
  const articleThree = postNode({
    id: "post-3",
    title: "Article three",
    slug: "article-three",
    publishedAt: "2026-06-27",
  })
  const nonPost = postNode({
    id: "page-1",
    title: "About",
    slug: "about",
    publishedAt: "2026-01-01",
    sourceInstanceName: "pages",
  })
  const createdPages = []

  await createPages({
    actions: { createPage: page => createdPages.push(page) },
    graphql: async () => ({
      data: {
        allMdx: {
          nodes: [articleThree, nonPost, articleOne, articleTwo],
        },
      },
    }),
    reporter: {
      panicOnBuild: message => assert.fail(message),
    },
  })

  assert.deepEqual(
    createdPages.map(({ path, context }) => ({ path, context })),
    [
      {
        path: "/posts/article-one/",
        context: {
          id: "post-1",
          previousPost: null,
          nextPost: { title: "Article two", slug: "article-two" },
        },
      },
      {
        path: "/posts/article-two/",
        context: {
          id: "post-2",
          previousPost: { title: "Article one", slug: "article-one" },
          nextPost: { title: "Article three", slug: "article-three" },
        },
      },
      {
        path: "/posts/article-three/",
        context: {
          id: "post-3",
          previousPost: { title: "Article two", slug: "article-two" },
          nextPost: null,
        },
      },
    ],
  )
})
