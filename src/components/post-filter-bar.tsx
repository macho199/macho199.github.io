import * as React from "react"

import { ALL_POSTS_FILTER } from "../lib/post-filter.mjs"

type PostFilterBarProps = Readonly<{
  tags: readonly string[]
  selectedTag: string
  resultCount: number
  onSelect: (tag: string) => void
}>

const formatPostCount = (count: number) =>
  `${count} ${count === 1 ? "post" : "posts"}`

const PostFilterBar = ({
  tags,
  selectedTag,
  resultCount,
  onSelect,
}: PostFilterBarProps) => {
  const options = [ALL_POSTS_FILTER, ...tags]

  return (
    <section className="post-filter-toolbar" aria-label="글 필터">
      {tags.length > 0 ? (
        <div className="post-filter-options" role="group" aria-label="태그 필터">
          {options.map(tag => {
            const isSelected = selectedTag === tag
            const isAll = tag === ALL_POSTS_FILTER

            return (
              <button
                key={tag}
                className={`post-filter-button${isSelected ? " is-active" : ""}`}
                type="button"
                data-filter-kind={isAll ? "all" : "tag"}
                aria-pressed={isSelected}
                onClick={() => onSelect(tag)}
              >
                {isAll ? "전체" : tag}
              </button>
            )
          })}
        </div>
      ) : null}
      <p className="post-filter-count" role="status" aria-live="polite">
        {formatPostCount(resultCount)}
      </p>
    </section>
  )
}

export default PostFilterBar
