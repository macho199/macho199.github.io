import { Link } from "gatsby"
import * as React from "react"

export type PostSummary = Readonly<{
  id: string
  title: string
  slug: string
  description: string
  tags: readonly string[]
  publishedAt: string
  publishedAtDisplay: string
}>

type PostCardProps = Readonly<{
  post: PostSummary
}>

const PostCard = ({ post }: PostCardProps) => (
  <article className="post-card">
    <div className="post-card-main">
      {post.tags.length > 0 ? (
        <ul className="post-card-tags" aria-label="태그">
          {post.tags.map((tag, index) => (
            <li key={`${post.id}-${tag}-${index}`}>
              <span className="post-card-tag">{tag}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <h3 className="post-card-title">
        <Link
          to={`/posts/${post.slug}/`}
          className="post-card-title-link"
        >
          {post.title}
        </Link>
      </h3>
      <p className="post-card-description">{post.description}</p>
      <time className="post-card-date" dateTime={post.publishedAt}>
        {post.publishedAtDisplay}
      </time>
    </div>
  </article>
)

export default PostCard
