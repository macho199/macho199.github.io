import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { test } from "node:test"
import sharp from "sharp"

const repositoryRoot = new URL("../../", import.meta.url)

test("uses one local profile favicon from every page Head", async () => {
  const [seo, notFound, favicon] = await Promise.all([
    readFile(new URL("src/components/seo.tsx", repositoryRoot), "utf8"),
    readFile(new URL("src/pages/404.tsx", repositoryRoot), "utf8"),
    readFile(new URL("static/favicon.png", repositoryRoot)),
  ])

  assert.match(
    seo,
    /<link id="favicon" rel="icon" type="image\/png" sizes="128x128" href="\/favicon\.png" \/>/,
  )
  assert.doesNotMatch(seo, /avatars\.githubusercontent\.com/)
  assert.match(notFound, /import Seo from "\.\.\/components\/seo"/)
  assert.match(
    notFound,
    /<Seo title="Not Found" pathname=\{location\.pathname\} \/>/,
  )

  const metadata = await sharp(favicon).metadata()
  const { data: pixels, info } = await sharp(favicon)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const protectedArtwork = await sharp(favicon)
    .removeAlpha()
    .extract({ left: 24, top: 24, width: 80, height: 80 })
    .raw()
    .toBuffer()

  /** @param {number} x @param {number} y */
  const alphaAt = (x, y) => pixels[(y * info.width + x) * 4 + 3]
  /** @param {number} x @param {number} y */
  const rgbAt = (x, y) => {
    const offset = (y * info.width + x) * 4
    return [...pixels.subarray(offset, offset + 3)]
  }

  assert.equal(metadata.width, 128)
  assert.equal(metadata.height, 128)
  assert.equal(metadata.hasAlpha, true)
  assert.equal(alphaAt(0, 0), 0)
  assert.equal(alphaAt(127, 0), 0)
  assert.equal(alphaAt(0, 127), 0)
  assert.equal(alphaAt(127, 127), 0)
  assert.equal(alphaAt(64, 64), 255)
  assert.ok(alphaAt(54, 0) > 0 && alphaAt(54, 0) < 255)
  assert.deepEqual(rgbAt(54, 0), [250, 187, 175])
  assert.equal(
    createHash("sha256").update(protectedArtwork).digest("hex"),
    "ccccfcbf5dbbbedcaeddc14a4e3cb06f221a5954e0b67791bade8944c926d912",
    "favicon interior artwork must remain unchanged",
  )
})

test("configures verified site identity and article structured data", async () => {
  const [{ default: config }, seo] = await Promise.all([
    import(new URL("../../gatsby-config.mjs", import.meta.url).href),
    readFile(new URL("src/components/seo.tsx", repositoryRoot), "utf8"),
  ])
  const metadata = config.siteMetadata

  assert.equal(metadata.authorName, "권종성")
  assert.equal(metadata.authorUrl, "https://github.com/macho199")
  assert.equal(typeof metadata.googleSiteVerification, "string")
  assert.equal(
    metadata.googleSiteVerification,
    metadata.googleSiteVerification.trim(),
  )
  assert.ok(metadata.googleSiteVerification.length > 0)
  assert.doesNotMatch(
    metadata.googleSiteVerification,
    /example|todo|placeholder|발급값/i,
  )

  assert.match(seo, /authorName: string/)
  assert.match(seo, /authorUrl: string/)
  assert.match(seo, /googleSiteVerification: string/)
  assert.match(
    seo,
    /<meta\s+id="google-site-verification"\s+name="google-site-verification"\s+content=\{siteMetadata\.googleSiteVerification\}\s+\/>/,
  )
  assert.match(seo, /createBlogPosting\(/)
  assert.match(seo, /serializeJsonLd\(blogPosting\)/)
  assert.match(seo, /type="application\/ld\+json"/)
})
