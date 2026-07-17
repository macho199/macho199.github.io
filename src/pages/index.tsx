import { graphql, Link, type HeadFC, type PageProps } from "gatsby"
import * as React from "react"

import Seo from "../components/seo"

type IndexPageData = {
  allMdx: {
    nodes: Array<{
      id: string
      frontmatter: {
        title: string
        slug: string
        publishedAt: string
        description: string
        tags: string[]
      }
    }>
  }
}

const IndexPage = ({ data }: PageProps<IndexPageData>) => {
  const posts = data.allMdx.nodes

  return (
    <main>
      <h1>Developer Blog</h1>
      <p>Notes from building and operating software.</p>
      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading">Posts</h2>
        <ol>
          {posts.map(post => (
            <li key={post.id}>
              <article>
                <h3>
                  <Link to={`/posts/${post.frontmatter.slug}/`}>
                    {post.frontmatter.title}
                  </Link>
                </h3>
                <time dateTime={post.frontmatter.publishedAt}>
                  {post.frontmatter.publishedAt}
                </time>
                <p>{post.frontmatter.description}</p>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}

export default IndexPage

export const Head: HeadFC = ({ location }) => <Seo pathname={location.pathname} />

export const query = graphql`
  query IndexPage {
    allMdx(sort: { frontmatter: { publishedAt: DESC } }) {
      nodes {
        id
        frontmatter {
          title
          slug
          publishedAt(formatString: "YYYY-MM-DD")
          description
          tags
        }
      }
    }
  }
`
