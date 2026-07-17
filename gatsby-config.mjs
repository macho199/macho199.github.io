import path from "node:path"
import { fileURLToPath } from "node:url"

import remarkGfm from "remark-gfm"

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))

/** @type {import("gatsby").GatsbyConfig} */
const config = {
  siteMetadata: {
    title: "Developer Blog",
    description: "Notes from building and operating software.",
    siteUrl: "https://macho199.github.io",
  },
  plugins: [
    "gatsby-plugin-postcss",
    {
      resolve: "gatsby-plugin-mdx",
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "posts",
        path: path.join(rootDirectory, "content", "posts"),
      },
    },
    {
      resolve: "gatsby-plugin-sitemap",
      options: {
        excludes: ["/404.html"],
      },
    },
  ],
}

export default config
