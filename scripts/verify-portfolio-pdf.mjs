import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { BlockList, isIP } from "node:net"
import { fileURLToPath, pathToFileURL } from "node:url"
import { resolve } from "node:path"

import { PDFDocument } from "pdf-lib"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

export const PORTFOLIO_PDF_PATH =
  "public/downloads/kwon-jongseong-backend-portfolio.pdf"
export const PORTFOLIO_WEB_URL =
  "https://macho199.github.io/portfolio/"

const MINIMUM_PDF_SIZE = 10 * 1024
const MAXIMUM_PDF_SIZE = 10 * 1024 * 1024
const httpUrlPattern =
  /https?:\/\/[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]*?(?=https?:\/\/|[^A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]|$)/giu
const privatePhonePatterns = [
  /(?<!\d)\+\d{1,3}(?:[\s().-]*\d){7,12}(?!\d)/u,
  /(?<!\d)0(?:1[016789]|2|3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)[\s().-]*\d{3,4}[\s.-]*\d{4}(?!\d)/u,
]
const ipv6CandidatePattern =
  /\[?(?:[a-f0-9]{0,4}:){2,7}(?:(?:\d{1,3}\.){3}\d{1,3}|[a-f0-9]{0,4})(?:%[a-z0-9._~-]+)?\]?/giu
const privateIpv6BlockList = new BlockList()

privateIpv6BlockList.addAddress("::1", "ipv6")
privateIpv6BlockList.addSubnet("fe80::", 10, "ipv6")
privateIpv6BlockList.addSubnet("fc00::", 7, "ipv6")
privateIpv6BlockList.addSubnet("::ffff:127.0.0.0", 104, "ipv6")
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

const createPdfLoadingTask = data => getDocument({ data })

const runWithCleanup = async (operation, cleanup, aggregateMessage) => {
  let operationError
  let operationFailed = false

  try {
    return await operation()
  } catch (error) {
    operationError = error
    operationFailed = true
    throw error
  } finally {
    try {
      await cleanup()
    } catch (cleanupError) {
      if (!operationFailed) {
        throw cleanupError
      }

      const operationErrors =
        operationError instanceof AggregateError &&
        operationError.cause === operationError.errors[0]
          ? operationError.errors
          : [operationError]
      const primaryError =
        operationError instanceof AggregateError && operationError.cause
          ? operationError.cause
          : operationError

      throw new AggregateError(
        [...operationErrors, cleanupError],
        aggregateMessage,
        { cause: primaryError },
      )
    }
  }
}

export const extractPdfText = async (
  pdfBytes,
  createLoadingTask = createPdfLoadingTask,
) => {
  const loadingTask = createLoadingTask(new Uint8Array(pdfBytes))

  return runWithCleanup(
    async () => {
      const pdfDocument = await loadingTask.promise
      const pageTexts = []

      for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber += 1
      ) {
        const page = await pdfDocument.getPage(pageNumber)

        const pageText = await runWithCleanup(
          async () => {
            const textContent = await page.getTextContent()

            return textContent.items
              .map(item => ("str" in item ? item.str : ""))
              .join("")
          },
          () => page.cleanup(),
          "PDF.js text extraction and page cleanup both failed",
        )

        pageTexts.push(pageText)
      }

      return pageTexts
    },
    () => loadingTask.destroy(),
    "PDF.js document work and loading-task cleanup both failed",
  )
}

export const assertPublicPortfolioText = extractedText => {
  assert.doesNotMatch(
    extractedText,
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    "no private email",
  )
  assert.ok(
    !privatePhonePatterns.some(pattern => pattern.test(extractedText)),
    "no private phone number",
  )

  const detectedHttpUrls = extractedText.match(httpUrlPattern) ?? []

  for (const detectedUrl of detectedHttpUrls) {
    let url

    try {
      url = new URL(detectedUrl)
    } catch {
      assert.fail("no internal URL or unapproved public URL")
    }

    const hasApprovedOrigin =
      url.protocol === "https:" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      (url.hostname === "macho199.github.io" ||
        (url.hostname === "github.com" &&
          (url.pathname === "/macho199" ||
            url.pathname.startsWith("/macho199/"))))

    assert.ok(
      hasApprovedOrigin,
      `no internal URL or unapproved public URL: ${detectedUrl}`,
    )
  }

  const textWithoutHttpUrls = extractedText.replace(httpUrlPattern, " ")

  assert.doesNotMatch(
    textWithoutHttpUrls,
    /(?:^|[^\p{L}\p{N}_])(?:localhost|intranet|internal)(?=$|[^\p{L}\p{N}_])/iu,
    "no internal host text",
  )
  assert.doesNotMatch(
    textWithoutHttpUrls,
    /(?:^|[^\p{L}\p{N}_])(?:[a-z0-9-]+\.)+(?:internal|local)(?=$|[^\p{L}\p{N}_])/iu,
    "no internal host text",
  )
  const detectedIpv6Addresses =
    textWithoutHttpUrls.match(ipv6CandidatePattern) ?? []
  const hasPrivateIpv6Address = detectedIpv6Addresses.some(candidate => {
    const unbracketedCandidate = candidate.replace(/^\[|\]$/gu, "")

    return (
      isIP(unbracketedCandidate) === 6 &&
      privateIpv6BlockList.check(unbracketedCandidate, "ipv6")
    )
  })

  assert.ok(
    !hasPrivateIpv6Address,
    "no internal host text",
  )
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
  assertPublicPortfolioText(extractedText)

  console.log(
    `portfolio PDF verified: ${pdfDocument.getPageCount()} pages, ${pdfBytes.byteLength} bytes, metadata, text, and privacy contracts passed`,
  )
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isDirectRun) {
  const requestedPdfPath = process.argv[2]
  const pdfPath = requestedPdfPath
    ? resolve(process.cwd(), requestedPdfPath)
    : defaultPdfPath

  verifyPortfolioPdf(pdfPath).catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
