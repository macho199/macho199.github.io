import { graphql, Link, type HeadFC, type PageProps } from "gatsby"
import type { ReactNode } from "react"

type PostData = {
  mdx: {
    frontmatter: {
      title: string
      slug: string
      publishedAt: string
      description: string
      tags: string[]
    }
  }
}

type PostTemplateProps = PageProps<PostData> & {
  children: ReactNode
}

const PostTemplate = ({ data, children }: PostTemplateProps) => {
  const { frontmatter } = data.mdx

  return (
    <main>
      <article>
        <header>
          <h1>{frontmatter.title}</h1>
          <time dateTime={frontmatter.publishedAt}>{frontmatter.publishedAt}</time>
          <p>{frontmatter.description}</p>
          <ul aria-label="Tags">
            {frontmatter.tags.map(tag => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </header>
        {children}
      </article>
      <Link to="/">Back to posts</Link>
    </main>
  )
}

export default PostTemplate

export const query = graphql`
  query PostById($id: String!) {
    mdx(id: { eq: $id }) {
      frontmatter {
        title
        slug
        publishedAt(formatString: "YYYY-MM-DD")
        description
        tags
      }
    }
  }
`

export const Head: HeadFC<PostData> = ({ data }) => (
  <title>{data.mdx.frontmatter.title} | Developer Blog</title>
)
