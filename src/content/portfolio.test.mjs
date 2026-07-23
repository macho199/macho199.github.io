import assert from "node:assert/strict"
import { test } from "node:test"

import {
  getPdfProjects,
  getWebProjects,
  portfolio,
  validatePortfolio,
// @ts-expect-error Node 24 strip-types intentionally imports this TypeScript module directly.
} from "./portfolio.ts"

test("publishes four web projects and three ordered PDF projects", () => {
  assert.deepEqual(
    getWebProjects(portfolio).map(project => project.id),
    ["nas-to-s3", "resume-migration", "recommendation-load-test", "data-pulse"],
  )
  assert.deepEqual(
    getPdfProjects(portfolio).map(project => project.id),
    ["nas-to-s3", "resume-migration", "recommendation-load-test"],
  )
})

test("keeps the approved public portfolio contract valid", () => {
  assert.deepEqual(validatePortfolio(portfolio), [])
  assert.equal(portfolio.updatedAt, "2026-07-23")
})

test("contains no private contact or internal URL pattern", () => {
  const serialized = JSON.stringify(portfolio)

  assert.doesNotMatch(serialized, /@(?!(?:github|macho199))/i)
  assert.doesNotMatch(serialized, /(?:010[-.\s]?\d{4}|localhost|intranet|사번|자격증\s*번호)/i)
  assert.doesNotMatch(serialized, /https?:\/\/(?!macho199\.github\.io|github\.com\/macho199)/i)
})

test("reports blank public content", () => {
  const invalidPortfolio = structuredClone(portfolio)
  invalidPortfolio.projects[0].result[0] = " "

  assert.ok(
    validatePortfolio(invalidPortfolio).some(error =>
      error.includes("portfolio.projects[0].result[0] must not be blank"),
    ),
  )
})

test("reports duplicate web ordering", () => {
  const invalidPortfolio = structuredClone(portfolio)
  invalidPortfolio.projects[1].webOrder = 1

  assert.ok(
    validatePortfolio(invalidPortfolio).includes("webOrder values must be unique"),
  )
})

test("reports non-contiguous PDF ordering", () => {
  const invalidPortfolio = structuredClone(portfolio)
  invalidPortfolio.projects[2].pdfOrder = 4

  assert.ok(
    validatePortfolio(invalidPortfolio).includes(
      "pdfOrder values must form a contiguous sequence starting at 1",
    ),
  )
})

test("requires exactly three PDF projects", () => {
  const invalidPortfolio = structuredClone(portfolio)
  invalidPortfolio.projects[3].pdfOrder = 4

  assert.ok(
    validatePortfolio(invalidPortfolio).includes(
      "portfolio must contain exactly 3 PDF projects",
    ),
  )
})

test("reports non-public links and forbidden content patterns", () => {
  const invalidPortfolio = structuredClone(portfolio)
  Reflect.set(invalidPortfolio.links[0], "url", "https://example.com/private")
  invalidPortfolio.name = "010-1234-5678"

  assert.ok(
    validatePortfolio(invalidPortfolio).some(error =>
      error.includes("portfolio.links[0].url must use an approved public URL"),
    ),
  )
  assert.ok(
    validatePortfolio(invalidPortfolio).includes(
      "portfolio contains a forbidden public-content pattern",
    ),
  )
})
