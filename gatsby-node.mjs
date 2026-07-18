import path from "node:path"

import { validatePostNodes } from "./src/lib/post-validation.mjs"

/**
 * @typedef {object} MdxPostNode
 * @property {string} id
 * @property {{ contentFilePath: string }} internal
 * @property {{ sourceInstanceName?: string } | null} parent
 * @property {{
 *   title: string,
 *   slug: string,
 *   publishedAt: string,
 *   description: string,
 *   tags: Array<string>
 * }} frontmatter
 */

/** @type {import("gatsby").GatsbyNode["createSchemaCustomization"]} */
export const createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type MdxFrontmatter @dontInfer {
      title: String!
      slug: String!
      publishedAt: Date! @dateformat
      description: String!
      tags: [String!]!
    }

    type Mdx implements Node {
      frontmatter: MdxFrontmatter!
    }
  `)
}

/** @type {import("gatsby").GatsbyNode["createPages"]} */
export const createPages = async ({ actions, graphql, reporter }) => {
  const result = await graphql(`
    query CreateMdxPostPages {
      allMdx {
        nodes {
          id
          internal {
            contentFilePath
          }
          parent {
            ... on File {
              sourceInstanceName
            }
          }
          frontmatter {
            title
            slug
            publishedAt
            description
            tags
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panicOnBuild("Unable to query MDX posts.", result.errors)
    return
  }

  /** @type {Array<MdxPostNode>} */
  const nodes = result.data?.allMdx.nodes ?? []
  const posts = nodes.filter(
    post => post.parent?.sourceInstanceName === "posts",
  )

  if (!result.data) {
    reporter.panicOnBuild("The MDX post query returned no data.")
    return
  }

  const validationErrors = validatePostNodes(posts)

  if (validationErrors.length > 0) {
    reporter.panicOnBuild(`Invalid MDX post metadata:\n${validationErrors.join("\n")}`)
    return
  }

  const sortedPosts = [...posts].sort((left, right) =>
    left.frontmatter.publishedAt.localeCompare(right.frontmatter.publishedAt),
  )
  /**
   * @param {MdxPostNode | undefined} post
   * @returns {{ title: string, slug: string } | null}
   */
  const toAdjacentPost = post =>
    post
      ? {
          title: post.frontmatter.title,
          slug: post.frontmatter.slug,
        }
      : null
  const postTemplate = path.resolve("./src/templates/post.tsx")

  for (const [index, post] of sortedPosts.entries()) {
    actions.createPage({
      path: `/posts/${post.frontmatter.slug}/`,
      component: `${postTemplate}?__contentFilePath=${post.internal.contentFilePath}`,
      context: {
        id: post.id,
        previousPost: toAdjacentPost(sortedPosts[index - 1]),
        nextPost: toAdjacentPost(sortedPosts[index + 1]),
      },
    })
  }
}
