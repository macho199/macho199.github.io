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
