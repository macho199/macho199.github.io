import assert from "node:assert/strict"
import { test } from "node:test"

import {
  ALL_POSTS_FILTER,
  collectPostTags,
  filterPostsByTag,
} from "./post-filter.mjs"

const posts = [
  { id: "new", tags: ["Gatsby", "GraphQL", "", "   "] },
  { id: "middle", tags: ["Gatsby", "MDX", "GraphQL"] },
  { id: "old", tags: ["React", "MDX"] },
]

test("collects unique non-blank tags in first appearance order", () => {
  assert.deepEqual(collectPostTags(posts), [
    "Gatsby",
    "GraphQL",
    "MDX",
    "React",
  ])
})

test("keeps every post in source order for the all filter", () => {
  assert.deepEqual(
    filterPostsByTag(posts, ALL_POSTS_FILTER).map(post => post.id),
    ["new", "middle", "old"],
  )
})

test("matches one tag exactly without reordering posts", () => {
  assert.deepEqual(
    filterPostsByTag(posts, "GraphQL").map(post => post.id),
    ["new", "middle"],
  )
  assert.deepEqual(filterPostsByTag(posts, "graphql"), posts)
})

test("falls back to all posts when the selected tag no longer exists", () => {
  assert.deepEqual(filterPostsByTag(posts, "Missing"), posts)
})
