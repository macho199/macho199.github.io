import { Link } from "gatsby"
import * as React from "react"

export type AdjacentPost = Readonly<{
  title: string
  slug: string
}>

type PostNavigationProps = Readonly<{
  previousPost: AdjacentPost | null
  nextPost: AdjacentPost | null
}>

const PostNavigation = ({
  previousPost,
  nextPost,
}: PostNavigationProps) => {
  if (!previousPost && !nextPost) {
    return null
  }

  return (
    <nav className="post-navigation" aria-label="이전·다음 게시글">
      {previousPost ? (
        <Link
          className="post-navigation-card post-navigation-card--previous"
          to={`/posts/${previousPost.slug}/`}
        >
          <span className="post-navigation-direction post-navigation-direction--previous">
            이전 글
          </span>
          <strong className="post-navigation-title">{previousPost.title}</strong>
        </Link>
      ) : null}
      {nextPost ? (
        <Link
          className="post-navigation-card post-navigation-card--next"
          to={`/posts/${nextPost.slug}/`}
        >
          <span className="post-navigation-direction post-navigation-direction--next">
            다음 글
          </span>
          <strong className="post-navigation-title">{nextPost.title}</strong>
        </Link>
      ) : null}
    </nav>
  )
}

export default PostNavigation
