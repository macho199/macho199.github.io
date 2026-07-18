import { graphql, type HeadFC, type PageProps } from "gatsby"
import * as React from "react"

import ContentContainer from "../components/content-container"
import HomeIntro from "../components/home-intro"
import Layout from "../components/layout"
import PostList from "../components/post-list"
import type { PostSummary } from "../components/post-card"
import Seo from "../components/seo"

type IndexPageData = Readonly<{
  allMdx: Readonly<{
    nodes: ReadonlyArray<
      Readonly<{
        id: string
        frontmatter: Omit<PostSummary, "id">
      }>
    >
  }>
}>

const IndexPage = ({ data }: PageProps<IndexPageData>) => {
  const posts: PostSummary[] = data.allMdx.nodes.map(({ id, frontmatter }) => ({
    id,
    ...frontmatter,
  }))

  return (
    <Layout>
      <ContentContainer>
        <HomeIntro />
        <PostList posts={posts} />
      </ContentContainer>
    </Layout>
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
          publishedAtDisplay: publishedAt(formatString: "YYYY.MM.DD")
          description
          tags
        }
      }
    }
  }
`
