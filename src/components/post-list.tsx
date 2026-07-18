import * as React from "react"

import {
  ALL_POSTS_FILTER,
  collectPostTags,
  filterPostsByTag,
} from "../lib/post-filter.mjs"
import PostCard, { type PostSummary } from "./post-card"
import PostFilterBar from "./post-filter-bar"

type PostListProps = Readonly<{
  posts: readonly PostSummary[]
}>

const PostList = ({ posts }: PostListProps) => {
  const [selectedTag, setSelectedTag] = React.useState(ALL_POSTS_FILTER)
  const tags = React.useMemo(() => collectPostTags(posts), [posts])
  const activeTag =
    selectedTag === ALL_POSTS_FILTER || tags.includes(selectedTag)
      ? selectedTag
      : ALL_POSTS_FILTER
  const visiblePosts = React.useMemo(
    () => filterPostsByTag(posts, activeTag),
    [posts, activeTag],
  )

  return (
    <section className="home-posts" aria-labelledby="home-posts-title">
      <h2 id="home-posts-title" className="sr-only">
        게시글 목록
      </h2>
      <PostFilterBar
        tags={tags}
        selectedTag={activeTag}
        resultCount={visiblePosts.length}
        onSelect={setSelectedTag}
      />
      {visiblePosts.length === 0 ? (
        <p className="post-list-empty">
          {posts.length === 0
            ? "아직 게시글이 없습니다."
            : "선택한 태그에 해당하는 글이 없습니다."}
        </p>
      ) : (
        <ol className="post-list">
          {visiblePosts.map(post => (
            <li key={post.id} className="post-list-item">
              <PostCard post={post} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default PostList
