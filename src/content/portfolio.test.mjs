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

test("publishes the approved AI-agent and expert-judgment working style", () => {
  assert.ok(
    portfolio.workingStyle.includes(
      "AI 에이전트는 탐색·정리·추적에 사용",
    ),
  )
  assert.ok(
    portfolio.workingStyle.includes(
      "최종 판단과 검증은 개발자가 담당",
    ),
  )
})

test("contains no private contact or internal URL pattern", () => {
  const serialized = JSON.stringify(portfolio)

  assert.doesNotMatch(serialized, /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)
  assert.doesNotMatch(serialized, /(?:010[-.\s]?\d{4}|localhost|intranet|사번|자격증\s*번호)/i)
  assert.doesNotMatch(serialized, /https?:\/\/(?!macho199\.github\.io|github\.com\/macho199)/i)
})

test("rejects every email address from public content", () => {
  for (const email of ["name@macho199.dev", "person@example.com"]) {
    const invalidPortfolio = structuredClone(portfolio)
    invalidPortfolio.name = email

    assert.ok(
      validatePortfolio(invalidPortfolio).includes(
        "portfolio contains a forbidden public-content pattern",
      ),
      `expected ${email} to be rejected`,
    )
  }
})

test("rejects bare private, loopback, and link-local IPv4 addresses", () => {
  const privateAddresses = [
    "10.2.3.4",
    "127.0.0.1",
    "169.254.10.20",
    "172.16.0.1",
    "172.31.255.254",
    "192.168.1.10",
  ]

  for (const privateAddress of privateAddresses) {
    const invalidPortfolio = structuredClone(portfolio)
    invalidPortfolio.name = `internal ${privateAddress}`

    assert.ok(
      validatePortfolio(invalidPortfolio).includes(
        "portfolio contains a forbidden public-content pattern",
      ),
      privateAddress,
    )
  }
})

test("checks IPv4 inside approved URLs without rejecting legitimate public IPv4", () => {
  const privateUrlPortfolio = structuredClone(portfolio)
  Reflect.set(
    privateUrlPortfolio.links[0],
    "url",
    "https://macho199.github.io/portfolio/10.0.0.8",
  )

  assert.ok(
    validatePortfolio(privateUrlPortfolio).includes(
      "portfolio contains a forbidden public-content pattern",
    ),
  )

  for (const publicText of ["public resolver 8.8.8.8", "not an IP 999.1.1.1"]) {
    const publicPortfolio = structuredClone(portfolio)
    publicPortfolio.name = publicText

    assert.deepEqual(validatePortfolio(publicPortfolio), [], publicText)
  }
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
