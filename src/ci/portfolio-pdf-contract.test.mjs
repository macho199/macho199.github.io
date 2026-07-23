import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import { PDFDocument } from "pdf-lib"

const repositoryRoot = new URL("../../", import.meta.url)
const generatorUrl = new URL(
  "../../scripts/generate-portfolio-pdf.mjs",
  import.meta.url,
)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8").catch(error => {
    if (error.code === "ENOENT") {
      return ""
    }

    throw error
  })

/** @param {string} source @param {readonly string[]} fragments */
const assertInOrder = (source, fragments) => {
  let previousIndex = -1

  for (const fragment of fragments) {
    const currentIndex = source.indexOf(fragment)

    assert.ok(currentIndex > previousIndex, `${fragment} must appear in order`)
    previousIndex = currentIndex
  }
}

test("loads the portfolio PDF generator as an ESM module", async () => {
  const generator = await import(generatorUrl.href)

  assert.equal(typeof generator.generatePortfolioPdf, "function")
  assert.equal(typeof generator.resolveStaticFile, "function")
})

test("rejects raw and decoded traversal before resolving a public file", async () => {
  const { resolveStaticFile } = await import(generatorUrl.href)
  const traversalPaths = [
    "/../portfolio/index.html",
    "/%2e%2e/portfolio/index.html",
    "/..%2fportfolio/index.html",
    "/%2e%2e%2fportfolio/index.html",
    "/..\\portfolio/index.html",
  ]

  for (const traversalPath of traversalPaths) {
    await assert.rejects(
      resolveStaticFile(traversalPath, "/tmp/portfolio-public"),
      error =>
        error instanceof Error &&
        "statusCode" in error &&
        error.statusCode === 403,
      traversalPath,
    )
  }
})

test("attempts every cleanup task even when one cleanup fails", async () => {
  const { runCleanupTasks } = await import(generatorUrl.href)
  /** @type {string[]} */
  const calls = []
  const browserFailure = new Error("browser close failed")

  const cleanupErrors = await runCleanupTasks([
    () => {
      calls.push("browser")
      throw browserFailure
    },
    () => {
      calls.push("server")
    },
    () => {
      calls.push("temporary file")
    },
  ])

  assert.deepEqual(calls, ["browser", "server", "temporary file"])
  assert.deepEqual(cleanupErrors, [browserFailure])
})

test("defines stable portfolio PDF interfaces and an isolated static server", async () => {
  const generator = await readRepositoryFile("scripts/generate-portfolio-pdf.mjs")

  assert.match(
    generator,
    /export const PORTFOLIO_PDF_PATH\s*=\s*"public\/downloads\/kwon-jongseong-backend-portfolio\.pdf"/,
  )
  assert.match(
    generator,
    /export const PORTFOLIO_PRINT_PATH\s*=\s*"\/portfolio\/print\/"/,
  )
  assert.match(
    generator,
    /export const PORTFOLIO_WEB_URL\s*=\s*"https:\/\/macho199\.github\.io\/portfolio\/"/,
  )
  assert.match(generator, /createServer\(/)
  assert.match(generator, /listen\(0,\s*"127\.0\.0\.1"/)
  assert.match(generator, /new URL\("\.\.\/public\/",\s*import\.meta\.url\)/)
  assert.match(generator, /decodeURIComponent\(/)
  assert.match(generator, /posix\.normalize\(/)
  assert.match(generator, /segment === "\.\."/)
  assert.match(generator, /startsWith\(publicRootPrefix\)/)
  assert.doesNotMatch(generator, /node:child_process|npm run serve|gatsby serve/)
  assert.doesNotMatch(generator, /listen\((?:3000|8000|9000)/)
})

test("reuses an existing Chromium executable without downloading a browser", async () => {
  const generator = await readRepositoryFile("scripts/generate-portfolio-pdf.mjs")

  assert.match(generator, /existsSync\(chromium\.executablePath\(\)\)/)
  assert.match(generator, /PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH/)
  assert.match(generator, /Google Chrome\.app/)
  assert.match(
    generator,
    /chromium\.launch\(\{ headless: true, executablePath \}\)/,
  )
  assert.doesNotMatch(generator, /playwright install|install chromium/)
})

test("waits for an error-free print document before rendering A4", async () => {
  const [generator, printDocument] = await Promise.all([
    readRepositoryFile("scripts/generate-portfolio-pdf.mjs"),
    readRepositoryFile("src/components/portfolio/portfolio-print-document.tsx"),
  ])

  assert.match(
    printDocument,
    /<main className="portfolio-print-document" data-portfolio-print-ready="true">/,
  )
  assert.match(generator, /page\.on\("console"/)
  assert.match(generator, /message\.type\(\) === "error"/)
  assert.match(generator, /page\.emulateMedia\(\{ media: "print" \}\)/)
  assert.match(generator, /response\.status\(\),\s*200/)
  assertInOrder(generator, [
    'page.waitForLoadState("networkidle")',
    "document.fonts.ready",
    "document.fonts.status",
    '[data-portfolio-print-ready="true"]',
    "page.pdf({",
  ])
  assert.match(generator, /fontStatus,\s*"loaded"/)
  assert.match(generator, /format:\s*"A4"/)
  assert.match(generator, /printBackground:\s*true/)
  assert.match(generator, /preferCSSPageSize:\s*true/)
  assert.match(generator, /displayHeaderFooter:\s*false/)
  assert.match(generator, /headerTemplate:\s*""/)
  assert.match(generator, /footerTemplate:\s*""/)
  assert.match(
    generator,
    /margin:\s*\{\s*top:\s*"0",\s*right:\s*"0",\s*bottom:\s*"0",\s*left:\s*"0",?\s*\}/s,
  )
})

test("adds approved metadata and always cleans generation resources", async () => {
  const generator = await readRepositoryFile("scripts/generate-portfolio-pdf.mjs")

  assert.match(generator, /PDFDocument\.load\(/)
  assert.match(
    generator,
    /\.setTitle\("권종성 백엔드 개발자 포트폴리오"\)/,
  )
  assert.match(generator, /\.setAuthor\("권종성"\)/)
  assert.match(
    generator,
    /\.setSubject\("시니어 백엔드 개발 포트폴리오"\)/,
  )
  assert.match(generator, /\.setKeywords\(/)
  assert.match(generator, /\.setCreationDate\(/)
  assert.match(generator, /\.setModificationDate\(/)
  assert.match(
    generator,
    /finally\s*\{[\s\S]*browser\?\.close\(\)[\s\S]*closeServer\([\s\S]*rm\(temporaryDirectory/s,
  )
})

test("verifies PDF structure, metadata, text, labels, and privacy", async () => {
  const verifier = await readRepositoryFile("scripts/verify-portfolio-pdf.mjs")

  assert.match(
    verifier,
    /export const PORTFOLIO_PDF_PATH\s*=\s*"public\/downloads\/kwon-jongseong-backend-portfolio\.pdf"/,
  )
  assert.match(verifier, /process\.argv\[2\]/)
  assert.match(verifier, /"%PDF-"/)
  assert.match(verifier, /10 \* 1024/)
  assert.match(verifier, /10 \* 1024 \* 1024/)
  assert.match(verifier, /PDFDocument\.load\(/)
  assert.match(verifier, /\.getPageCount\(\),\s*9/)
  assert.match(
    verifier,
    /\.getTitle\(\),\s*"권종성 백엔드 개발자 포트폴리오"/,
  )
  assert.match(verifier, /\.getAuthor\(\),\s*"권종성"/)
  assert.match(
    verifier,
    /\.getSubject\(\),\s*"시니어 백엔드 개발 포트폴리오"/,
  )
  assert.match(verifier, /\.getCreationDate\(\)/)
  assert.match(verifier, /\.getModificationDate\(\)/)
  assert.match(verifier, /pdfjs-dist\/legacy\/build\/pdf\.mjs/)
  assert.match(
    verifier,
    /\.map\(item => \("str" in item \? item\.str : ""\)\)\s*\.join\(""\)/s,
  )
  assert.doesNotMatch(verifier, /\.join\(" "\)/)
  assert.match(
    verifier,
    /finally\s*\{[\s\S]*await loadingTask\.destroy\(\)[\s\S]*\}/,
  )
  assert.doesNotMatch(verifier, /await pdfDocument\.destroy\(\)/)

  for (const approvedText of [
    "약 800만 개",
    "1천만 건 이상",
    "최종 미해결 누락 0건",
    "500 TPS",
    "https://macho199.github.io/portfolio/",
    "1 / 9",
    "9 / 9",
  ]) {
    assert.ok(verifier.includes(approvedText), `${approvedText} text contract`)
  }

  assert.match(verifier, /no private email/)
  assert.match(verifier, /no private phone number/)
  assert.match(verifier, /no internal URL/)
})

test("does not synthesize missing dates during semantic verification", async () => {
  const verifier = await readRepositoryFile("scripts/verify-portfolio-pdf.mjs")
  const fixture = await PDFDocument.create({ updateMetadata: false })

  fixture.addPage()
  fixture.setTitle("권종성 백엔드 개발자 포트폴리오")
  fixture.setAuthor("권종성")
  fixture.setSubject("시니어 백엔드 개발 포트폴리오")

  const fixtureBytes = await fixture.save()
  const fixtureDocument = await PDFDocument.load(fixtureBytes, {
    updateMetadata: false,
  })

  assert.equal(fixtureDocument.getCreationDate(), undefined)
  assert.equal(fixtureDocument.getModificationDate(), undefined)
  assert.match(
    verifier,
    /PDFDocument\.load\(pdfBytes,\s*\{\s*updateMetadata:\s*false,?\s*\}\)/s,
  )
})

test("registers exact generation and verification package commands", async () => {
  const packageJson = JSON.parse(await readRepositoryFile("package.json"))

  assert.equal(
    packageJson.scripts?.["generate:portfolio-pdf"],
    "node scripts/generate-portfolio-pdf.mjs",
  )
  assert.equal(
    packageJson.scripts?.["verify:portfolio-pdf"],
    "node scripts/verify-portfolio-pdf.mjs",
  )
})
