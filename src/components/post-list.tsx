import * as React from "react"

import PostCard, { type PostSummary } from "./post-card"

type PostListProps = Readonly<{
  posts: readonly PostSummary[]
}>

const PostList = ({ posts }: PostListProps) => (
  <section className="home-posts" aria-labelledby="home-posts-title">
    <h2 id="home-posts-title" className="sr-only">
      게시글 목록
    </h2>
    {posts.length === 0 ? (
      <p className="post-list-empty">아직 게시글이 없습니다.</p>
    ) : (
      <ol className="post-list">
        {posts.map(post => (
          <li key={post.id} className="post-list-item">
            <PostCard post={post} />
          </li>
        ))}
      </ol>
    )}
  </section>
)

export default PostList
