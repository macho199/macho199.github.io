import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { test } from "node:test"

import { PDFDocument, StandardFonts } from "pdf-lib"

const verifierUrl = new URL(
  "../../scripts/verify-portfolio-pdf.mjs",
  import.meta.url,
)

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const fixtureContract = {
  canonicalUrl: "https://portfolio.test/",
  name: "Tester",
  pageAnchors: [
    ["Cover"],
    ["Core technologies"],
    ["Project one"],
    ["Project one"],
    ["Project two"],
    ["Project two"],
    ["Project three"],
    ["Project three"],
    ["Additional achievements"],
  ],
  totalPages: 9,
  updatedAt: "2026.07.23",
}

const createFixtureBytes = async () => {
  const document = await PDFDocument.create({ updateMetadata: false })
  const font = await document.embedFont(StandardFonts.Helvetica)

  fixtureContract.pageAnchors.forEach((anchors, index) => {
    const pageNumber = index + 1
    const page = document.addPage([A4_WIDTH, A4_HEIGHT])
    const text = [
      fixtureContract.name,
      fixtureContract.updatedAt,
      fixtureContract.canonicalUrl,
      `${pageNumber} / ${fixtureContract.totalPages}`,
      ...anchors,
    ].join(" | ")

    page.drawText(text, { font, size: 10, x: 20, y: 800 })
  })

  return document.save()
}

/** @param {Uint8Array} pdfBytes */
const loadFixture = async pdfBytes => {
  const { extractPdfText } = await import(verifierUrl.href)

  return {
    document: await PDFDocument.load(pdfBytes, { updateMetadata: false }),
    pageTexts: await extractPdfText(pdfBytes),
  }
}

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

test("rejects private IPv4 in bare text and approved URL paths", async () => {
  const { assertPublicPortfolioText } = await import(verifierUrl.href)
  const privateTextSamples = [
    "10.0.0.1",
    "127.100.20.3",
    "169.254.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.200.10",
    "https://macho199.github.io/portfolio/10.1.2.3",
  ]

  for (const privateText of privateTextSamples) {
    assert.throws(
      () => assertPublicPortfolioText(`visible IPv4: ${privateText}`),
      /no private IPv4/,
      privateText,
    )
  }
})

test("allows legitimate public IPv4 without weakening URL and phone gates", async () => {
  const { assertPublicPortfolioText } = await import(verifierUrl.href)

  assert.doesNotThrow(() =>
    assertPublicPortfolioText(
      "public 8.8.8.8 https://macho199.github.io/portfolio/8.8.4.4",
    ),
  )
  assert.throws(
    () =>
      assertPublicPortfolioText(
        "https://macho199.github.io/portfolio/010-1234-5678",
      ),
    /no private phone number/,
  )
})

test("accepts a nonblank A4 document with exact page-local anchors", async () => {
  const { assertPortfolioPdfPageContracts } = await import(verifierUrl.href)
  const fixture = await loadFixture(await createFixtureBytes())

  assert.equal(typeof assertPortfolioPdfPageContracts, "function")
  assert.doesNotThrow(() =>
    assertPortfolioPdfPageContracts(
      fixture.document,
      fixture.pageTexts,
      fixtureContract,
    ),
  )
})

test("rejects a middle page removed and another page duplicated", async () => {
  const { assertPortfolioPdfPageContracts } = await import(verifierUrl.href)
  const source = await PDFDocument.load(await createFixtureBytes(), {
    updateMetadata: false,
  })
  const mutated = await PDFDocument.create({ updateMetadata: false })
  const copiedPages = await mutated.copyPages(
    source,
    [0, 1, 2, 3, 5, 6, 7, 8, 1],
  )

  copiedPages.forEach(page => mutated.addPage(page))

  const fixture = await loadFixture(await mutated.save())

  assert.throws(
    () =>
      assertPortfolioPdfPageContracts(
        fixture.document,
        fixture.pageTexts,
        fixtureContract,
      ),
    /page 5/,
  )
})

test("rejects an actual blank middle page", async () => {
  const { assertPortfolioPdfPageContracts } = await import(verifierUrl.href)
  const mutated = await PDFDocument.load(await createFixtureBytes(), {
    updateMetadata: false,
  })

  mutated.removePage(4)
  mutated.insertPage(4, [A4_WIDTH, A4_HEIGHT])

  const fixture = await loadFixture(await mutated.save())

  assert.throws(
    () =>
      assertPortfolioPdfPageContracts(
        fixture.document,
        fixture.pageTexts,
        fixtureContract,
      ),
    /page 5 is nonblank/,
  )
})

test("rejects altered A4 dimensions and an incorrect page-local footer", async () => {
  const { assertPortfolioPdfPageContracts } = await import(verifierUrl.href)
  const wrongSize = await PDFDocument.load(await createFixtureBytes(), {
    updateMetadata: false,
  })

  wrongSize.getPage(3).setSize(A4_WIDTH + 2, A4_HEIGHT)

  const wrongSizeFixture = await loadFixture(await wrongSize.save())

  assert.throws(
    () =>
      assertPortfolioPdfPageContracts(
        wrongSizeFixture.document,
        wrongSizeFixture.pageTexts,
        fixtureContract,
      ),
    /page 4 A4 width/,
  )

  const wrongFooter = await PDFDocument.load(await createFixtureBytes(), {
    updateMetadata: false,
  })
  const font = await wrongFooter.embedFont(StandardFonts.Helvetica)

  wrongFooter.removePage(5)
  const replacement = wrongFooter.insertPage(5, [A4_WIDTH, A4_HEIGHT])
  replacement.drawText(
    [
      fixtureContract.name,
      fixtureContract.updatedAt,
      fixtureContract.canonicalUrl,
      "5 / 9",
      "Project two",
    ].join(" | "),
    { font, size: 10, x: 20, y: 800 },
  )

  const wrongFooterFixture = await loadFixture(await wrongFooter.save())

  assert.throws(
    () =>
      assertPortfolioPdfPageContracts(
        wrongFooterFixture.document,
        wrongFooterFixture.pageTexts,
        fixtureContract,
      ),
    /page 6 exact page label/,
  )
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
