import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { test } from "node:test"

const verifierUrl = new URL(
  "../../scripts/verify-portfolio-pdf.mjs",
  import.meta.url,
)

test("imports the verifier without executing its CLI", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `await import(${JSON.stringify(verifierUrl.href)})`,
    ],
    { encoding: "utf8" },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, "")
  assert.equal(result.stderr, "")
})

test("exports pure privacy and PDF text helpers", async () => {
  const verifier = await import(verifierUrl.href)

  assert.equal(typeof verifier.assertPublicPortfolioText, "function")
  assert.equal(typeof verifier.extractPdfText, "function")
})

test("rejects every HTTP URL outside the approved public locations", async () => {
  const { assertPublicPortfolioText } = await import(verifierUrl.href)
  const unapprovedUrls = [
    "http://intranet/private",
    "http://[::1]/private",
    "https://[fe80::1]/secret",
    "https://service.corp.internal/private",
    "https://example.com/public",
    "https://macho199.github.io.evil.example/portfolio/",
    "https://github.com/macho199.evil",
    "https://macho199.github.io/,https://example.com/private",
    "https://macho199.github.io/)(https://example.com/private",
    "https://macho199.github.io/?next=https://example.com/private",
  ]

  for (const url of unapprovedUrls) {
    assert.throws(
      () => assertPublicPortfolioText(`visible URL: ${url}`),
      error => error instanceof Error,
      url,
    )
  }
})

test("rejects bare internal hosts, IPv6 addresses, and email addresses", async () => {
  const { assertPublicPortfolioText } = await import(verifierUrl.href)
  const privateTextSamples = [
    "localhost:8080/private",
    "intranet portal",
    "internal",
    "service.internal",
    "[::1]",
    "0:0:0:0:0:0:0:1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fe90::1",
    "febf::1",
    "fd12:3456::1",
    "private-contact@example.com",
  ]

  for (const privateText of privateTextSamples) {
    assert.throws(
      () => assertPublicPortfolioText(`visible text: ${privateText}`),
      error => error instanceof Error,
      privateText,
    )
  }
})

test("rejects Korean and international phone number formats", async () => {
  const { assertPublicPortfolioText } = await import(verifierUrl.href)
  const phoneNumbers = [
    "+82 (0)10-1234-5678",
    "+82 10 1234 5678",
    "010-1234-5678",
    "+1 (415) 555-2671",
    "contact/010-1234-5678",
    "contact.010-1234-5678",
    "phone+82 (0)10-1234-5678",
  ]

  for (const phoneNumber of phoneNumbers) {
    assert.throws(
      () => assertPublicPortfolioText(`visible phone: ${phoneNumber}`),
      /no private phone number/,
      phoneNumber,
    )
  }
})

test("accepts approved URLs, dates, metrics, and page labels", async () => {
  const { assertPublicPortfolioText } = await import(verifierUrl.href)
  const approvedText = [
    "업데이트 2026-07-23",
    "약 800만 개",
    "1천만 건 이상",
    "최종 미해결 누락 0건",
    "500 TPS",
    "1 / 9",
    "https://macho199.github.io/",
    "https://macho199.github.io/portfolio/",
    "https://github.com/macho199",
    "https://github.com/macho199/example",
    "https://macho199.github.io/internal",
    "https://macho199.github.io/ipv6/::1",
    "https://github.com/macho199권종성",
  ].join("\n")

  assert.doesNotThrow(() => assertPublicPortfolioText(approvedText))
})

test("destroys the PDF.js loading task when document loading rejects", async () => {
  const { extractPdfText } = await import(verifierUrl.href)
  const loadingFailure = new Error("PDF.js loading failed")
  let loadingTaskDestroyed = false
  const createLoadingTask = () => ({
    destroy: async () => {
      loadingTaskDestroyed = true
    },
    promise: Promise.reject(loadingFailure),
  })

  await assert.rejects(
    extractPdfText(new Uint8Array(), createLoadingTask),
    error => error === loadingFailure,
  )
  assert.equal(loadingTaskDestroyed, true)
})

test("cleans the PDF.js page when text extraction rejects", async () => {
  const { extractPdfText } = await import(verifierUrl.href)
  const extractionFailure = new Error("PDF.js text extraction failed")
  let loadingTaskDestroyed = false
  let pageCleaned = false
  const page = {
    cleanup: () => {
      pageCleaned = true
    },
    getTextContent: async () => {
      throw extractionFailure
    },
  }
  const createLoadingTask = () => ({
    destroy: async () => {
      loadingTaskDestroyed = true
    },
    promise: Promise.resolve({
      getPage: async () => page,
      numPages: 1,
    }),
  })

  await assert.rejects(
    extractPdfText(new Uint8Array(), createLoadingTask),
    error => error === extractionFailure,
  )
  assert.equal(pageCleaned, true)
  assert.equal(loadingTaskDestroyed, true)
})

test("rejects phone-shaped text inside an approved URL path", async () => {
  const { assertPublicPortfolioText } = await import(verifierUrl.href)
  const privatePhoneTextSamples = [
    "https://github.com/macho199/010-1234-5678",
    "https://macho199.github.io/portfolio/+82 (0)10-1234-5678",
  ]

  for (const privatePhoneText of privatePhoneTextSamples) {
    assert.throws(
      () => assertPublicPortfolioText(privatePhoneText),
      /no private phone number/,
      privatePhoneText,
    )
  }
})

test("preserves document-load and loading-task cleanup failures", async () => {
  const { extractPdfText } = await import(verifierUrl.href)
  const loadingFailure = new Error("PDF.js loading failed")
  const destroyFailure = new Error("PDF.js loading-task destroy failed")
  const createLoadingTask = () => ({
    destroy: async () => {
      throw destroyFailure
    },
    promise: Promise.reject(loadingFailure),
  })

  await assert.rejects(
    extractPdfText(new Uint8Array(), createLoadingTask),
    error => {
      assert.ok(error instanceof AggregateError)
      assert.deepEqual(error.errors, [loadingFailure, destroyFailure])
      assert.equal(error.cause, loadingFailure)
      return true
    },
  )
})

test("preserves text-extraction and page-cleanup failures", async () => {
  const { extractPdfText } = await import(verifierUrl.href)
  const extractionFailure = new Error("PDF.js text extraction failed")
  const pageCleanupFailure = new Error("PDF.js page cleanup failed")
  let loadingTaskDestroyed = false
  const page = {
    cleanup: () => {
      throw pageCleanupFailure
    },
    getTextContent: async () => {
      throw extractionFailure
    },
  }
  const createLoadingTask = () => ({
    destroy: async () => {
      loadingTaskDestroyed = true
    },
    promise: Promise.resolve({
      getPage: async () => page,
      numPages: 1,
    }),
  })

  await assert.rejects(
    extractPdfText(new Uint8Array(), createLoadingTask),
    error => {
      assert.ok(error instanceof AggregateError)
      assert.deepEqual(error.errors, [extractionFailure, pageCleanupFailure])
      assert.equal(error.cause, extractionFailure)
      return true
    },
  )
  assert.equal(loadingTaskDestroyed, true)
})
