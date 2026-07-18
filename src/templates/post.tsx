import { MDXProvider } from "@mdx-js/react"
import { graphql, Link, type HeadFC, type PageProps } from "gatsby"
import * as React from "react"
import type { ReactNode } from "react"

import CodeBlock from "../components/code-block"
import ContentContainer from "../components/content-container"
import Layout from "../components/layout"
import PostHeader, { type PostHeaderData } from "../components/post-header"
import PostNavigation, {
  type AdjacentPost,
} from "../components/post-navigation"
import PostTableOfContents from "../components/post-table-of-contents"
import Seo from "../components/seo"
import { normalizePostTableOfContents } from "../lib/post-table-of-contents.mjs"

type PostData = Readonly<{
  mdx: Readonly<{
    tableOfContents: unknown
    frontmatter: PostHeaderData &
      Readonly<{
        slug: string
      }>
  }>
}>

type PostPageContext = Readonly<{
  previousPost: AdjacentPost | null
  nextPost: AdjacentPost | null
}>

type PostTemplateProps = PageProps<PostData, PostPageContext> &
  Readonly<{
    children: ReactNode
  }>

const mdxComponents = {
  pre: CodeBlock,
}

const PostTemplate = ({ data, pageContext, children }: PostTemplateProps) => {
  const { frontmatter } = data.mdx
  const tocItems = normalizePostTableOfContents(data.mdx.tableOfContents)

  return (
    <Layout>
      <ContentContainer>
        <nav className="post-back-nav" aria-label="게시글 탐색">
          <Link to="/" className="post-back-link">
            ← 게시글 목록
          </Link>
        </nav>
        <article className="post-page">
          <PostHeader post={frontmatter} />
          <div className="post-body-shell">
            <div className="mdx-content">
              <MDXProvider components={mdxComponents}>{children}</MDXProvider>
            </div>
            <PostTableOfContents items={tocItems} />
          </div>
          <PostNavigation
            previousPost={pageContext.previousPost}
            nextPost={pageContext.nextPost}
          />
        </article>
      </ContentContainer>
    </Layout>
  )
}

export default PostTemplate

export const query = graphql`
  query PostById($id: String!) {
    mdx(id: { eq: $id }) {
      tableOfContents(maxDepth: 2)
      frontmatter {
        title
        slug
        publishedAt(formatString: "YYYY-MM-DD")
        publishedAtDisplay: publishedAt(formatString: "YYYY.MM.DD")
        description
        tags
      }
    }
  }
`

export const Head: HeadFC<PostData> = ({ data, location }) => (
  <Seo
    title={data.mdx.frontmatter.title}
    description={data.mdx.frontmatter.description}
    pathname={location.pathname}
    type="article"
    publishedAt={data.mdx.frontmatter.publishedAt}
    tags={[...data.mdx.frontmatter.tags]}
  />
)
