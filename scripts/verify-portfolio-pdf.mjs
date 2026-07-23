import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"

import { PDFDocument } from "pdf-lib"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

export const PORTFOLIO_PDF_PATH =
  "public/downloads/kwon-jongseong-backend-portfolio.pdf"
export const PORTFOLIO_WEB_URL =
  "https://macho199.github.io/portfolio/"

const MINIMUM_PDF_SIZE = 10 * 1024
const MAXIMUM_PDF_SIZE = 10 * 1024 * 1024
const defaultPdfPath = fileURLToPath(
  new URL(
    "../public/downloads/kwon-jongseong-backend-portfolio.pdf",
    import.meta.url,
  ),
)

const assertValidDate = (value, label) => {
  assert.ok(
    value instanceof Date && Number.isFinite(value.getTime()),
    `${label} must be a valid date`,
  )
}

const extractPdfText = async pdfBytes => {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBytes) })
  const pdfDocument = await loadingTask.promise
  const pageTexts = []

  try {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map(item => ("str" in item ? item.str : ""))
        .join("")

      pageTexts.push(pageText)
      page.cleanup()
    }
  } finally {
    await loadingTask.destroy()
  }

  return pageTexts
}

export const verifyPortfolioPdf = async pdfPath => {
  const pdfBytes = await readFile(pdfPath)

  assert.equal(
    pdfBytes.subarray(0, 5).toString("ascii"),
    "%PDF-",
    "portfolio PDF signature",
  )
  assert.ok(
    pdfBytes.byteLength > MINIMUM_PDF_SIZE,
    "portfolio PDF size greater than 10KB",
  )
  assert.ok(
    pdfBytes.byteLength <= MAXIMUM_PDF_SIZE,
    "portfolio PDF size at most 10MB",
  )

  const pdfDocument = await PDFDocument.load(pdfBytes, {
    updateMetadata: false,
  })

  assert.equal(pdfDocument.isEncrypted, false, "portfolio PDF is unencrypted")
  assert.equal(pdfDocument.getPageCount(), 9, "portfolio PDF page count")
  assert.equal(
    pdfDocument.getTitle(),
    "권종성 백엔드 개발자 포트폴리오",
    "portfolio PDF title",
  )
  assert.equal(pdfDocument.getAuthor(), "권종성", "portfolio PDF author")
  assert.equal(
    pdfDocument.getSubject(),
    "시니어 백엔드 개발 포트폴리오",
    "portfolio PDF subject",
  )
  assertValidDate(pdfDocument.getCreationDate(), "PDF creation date")
  assertValidDate(pdfDocument.getModificationDate(), "PDF modification date")

  const pageTexts = await extractPdfText(pdfBytes)
  const extractedText = pageTexts.join("\n")

  for (const approvedText of [
    "약 800만 개",
    "1천만 건 이상",
    "최종 미해결 누락 0건",
    "500 TPS",
    PORTFOLIO_WEB_URL,
  ]) {
    assert.ok(
      extractedText.includes(approvedText),
      `portfolio PDF contains ${approvedText}`,
    )
  }

  assert.ok(extractedText.includes("1 / 9"), "portfolio PDF contains 1 / 9")
  assert.ok(extractedText.includes("9 / 9"), "portfolio PDF contains 9 / 9")
  assert.doesNotMatch(
    extractedText,
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    "no private email",
  )
  assert.doesNotMatch(
    extractedText,
    /(?:\+82[-.\s]?(?:0)?|0)(?:1[016789]|2|3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)[-.\s]?\d{3,4}[-.\s]?\d{4}/,
    "no private phone number",
  )
  assert.doesNotMatch(
    extractedText,
    /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|[a-z0-9.-]+\.(?:internal|local))(?:[/:?#]|$)/i,
    "no internal URL",
  )

  console.log(
    `portfolio PDF verified: ${pdfDocument.getPageCount()} pages, ${pdfBytes.byteLength} bytes, metadata, text, and privacy contracts passed`,
  )
}

const requestedPdfPath = process.argv[2]
const pdfPath = requestedPdfPath
  ? resolve(process.cwd(), requestedPdfPath)
  : defaultPdfPath

verifyPortfolioPdf(pdfPath).catch(error => {
  console.error(error)
  process.exitCode = 1
})
