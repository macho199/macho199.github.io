import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { validatePostNodes } from "./post-validation.mjs"

/**
 * @param {string} publishedAt
 */
const postWithDate = publishedAt => ({
  id: `post-${publishedAt}`,
  frontmatter: {
    title: "Test post",
    slug: "test-post",
    publishedAt,
    description: "Test description",
    tags: [],
  },
})

describe("publishedAt validation", () => {
  for (const publishedAt of ["0001-01-01", "2000-02-29", "2024-02-29", "2026-02-28"]) {
    it(`accepts ${publishedAt}`, () => {
      assert.deepEqual(validatePostNodes([postWithDate(publishedAt)]), [])
    })
  }

  for (const publishedAt of [
    "0000-01-01",
    "1900-02-29",
    "2026-00-10",
    "2026-02-29",
    "2026-02-31",
    "2026-13-01",
    "2026-2-28",
    "2026-02-28T00:00:00Z",
  ]) {
    it(`rejects ${publishedAt}`, () => {
      const errors = validatePostNodes([postWithDate(publishedAt)])

      assert.equal(errors.length, 1)
      assert.match(errors[0], /real calendar date in YYYY-MM-DD format/)
    })
  }
})
