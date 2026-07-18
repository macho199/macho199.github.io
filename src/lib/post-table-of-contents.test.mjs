import assert from "node:assert/strict"
import { test } from "node:test"

import { normalizePostTableOfContents } from "./post-table-of-contents.mjs"

test("normalizes root H2 items and ignores nested H3 items", () => {
  const result = normalizePostTableOfContents({
    items: [
      {
        url: "#첫-번째-제목",
        title: "  첫 번째 제목  ",
        items: [{ url: "#중첩-h3", title: "중첩 H3" }],
      },
      {
        url: "#graphql-조회",
        title: "GraphQL 조회",
      },
    ],
  })

  assert.deepEqual(result, [
    {
      id: "첫-번째-제목",
      href: "#첫-번째-제목",
      title: "첫 번째 제목",
    },
    {
      id: "graphql-조회",
      href: "#graphql-조회",
      title: "GraphQL 조회",
    },
  ])
})

test("keeps the href and decodes its DOM heading id", () => {
  assert.deepEqual(
    normalizePostTableOfContents({
      items: [{ url: "#GraphQL%20API", title: "GraphQL API" }],
    }),
    [
      {
        id: "GraphQL API",
        href: "#GraphQL%20API",
        title: "GraphQL API",
      },
    ],
  )
})

test("drops malformed entries without throwing", () => {
  const malformedValues = [undefined, null, {}, { items: "not-an-array" }]

  for (const value of malformedValues) {
    assert.deepEqual(normalizePostTableOfContents(value), [])
  }

  assert.deepEqual(
    normalizePostTableOfContents({
      items: [
        null,
        {},
        { url: "/posts/not-a-fragment/", title: "외부 경로" },
        { url: "#", title: "빈 id" },
        { url: "#bad%ZZ", title: "잘못된 인코딩" },
        { url: "#valid", title: "   " },
        { url: "#valid", title: 42 },
      ],
    }),
    [],
  )
})
