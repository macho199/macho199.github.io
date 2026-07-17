import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const repositoryRoot = new URL("../../", import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8").catch(error => {
    if (error.code === "ENOENT") {
      return ""
    }

    throw error
  })

test("renders one hidden home heading and the approved introduction", async () => {
  const homeIntro = await readRepositoryFile("src/components/home-intro.tsx")

  assert.match(
    homeIntro,
    /<h1 id="home-title" className="sr-only">[\s\S]*개발자 블로그[\s\S]*<\/h1>/,
  )
  assert.match(
    homeIntro,
    /AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의\s+엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다\./,
  )
})

test("renders a typed post card with informational tags and real metadata", async () => {
  const postCard = await readRepositoryFile("src/components/post-card.tsx")

  assert.match(postCard, /export type PostSummary = Readonly<\{/)
  assert.match(postCard, /<ul className="post-card-tags" aria-label="태그">/)
  assert.match(postCard, /<span className="post-card-tag">\{tag\}<\/span>/)
  assert.match(
    postCard,
    /<Link[\s\S]*?to=\{`\/posts\/\$\{post\.slug\}\/`\}[\s\S]*?className="post-card-title-link"[\s\S]*?>/,
  )
  assert.match(
    postCard,
    /<time className="post-card-date" dateTime=\{post\.publishedAt\}>[\s\S]*\{post\.publishedAtDisplay\}[\s\S]*<\/time>/,
  )
  assert.doesNotMatch(postCard, /<button\b/)
})

test("renders an ordered post list or the approved empty state", async () => {
  const postList = await readRepositoryFile("src/components/post-list.tsx")

  assert.match(
    postList,
    /<section className="home-posts" aria-labelledby="home-posts-title">/,
  )
  assert.match(
    postList,
    /<h2 id="home-posts-title" className="sr-only">[\s\S]*게시글 목록[\s\S]*<\/h2>/,
  )
  assert.match(postList, /<ol className="post-list">/)
  assert.match(postList, /<li key=\{post\.id\} className="post-list-item">/)
  assert.match(postList, /<PostCard post=\{post\} \/>/)
  assert.match(postList, /아직 게시글이 없습니다\./)
  assert.doesNotMatch(postList, /<button\b/)
})

test("imports the React runtime required by Gatsby SSR", async () => {
  const componentSources = await Promise.all(
    [
      "src/components/home-intro.tsx",
      "src/components/post-card.tsx",
      "src/components/post-list.tsx",
    ].map(readRepositoryFile),
  )

  for (const source of componentSources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})
