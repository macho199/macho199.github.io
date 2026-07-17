import * as React from "react"

export type PostHeaderData = Readonly<{
  title: string
  description: string
  tags: readonly string[]
  publishedAt: string
  publishedAtDisplay: string
}>

type PostHeaderProps = Readonly<{
  post: PostHeaderData
}>

const PostHeader = ({ post }: PostHeaderProps) => (
  <header className="post-header">
    {post.tags.length > 0 ? (
      <ul className="post-tags" aria-label="태그">
        {post.tags.map((tag, index) => (
          <li key={`${tag}-${index}`}>
            <span className="post-tag">{tag}</span>
          </li>
        ))}
      </ul>
    ) : null}
    <h1 className="post-title">{post.title}</h1>
    <p className="post-description">{post.description}</p>
    <time className="post-date" dateTime={post.publishedAt}>
      {post.publishedAtDisplay}
    </time>
  </header>
)

export default PostHeader
