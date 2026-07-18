import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

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
  assert.equal(
    createHash("sha256").update(favicon).digest("hex"),
    "e9d4b8b644138993aaf0d6c9904613a3ae820881bed5d03d07eb1032e549693b",
  )
})
