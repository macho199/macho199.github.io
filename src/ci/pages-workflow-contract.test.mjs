import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const repositoryRoot = new URL("../../", import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8").catch(error => {
    if (error.code === "ENOENT") {
      return ""
    }

    throw error
  })

/** @param {string} source */
const stripYamlComments = source =>
  source
    .split("\n")
    .map(line => {
      const commentIndex = line.search(/(^|\s)#/)

      return commentIndex === -1 ? line : line.slice(0, commentIndex).trimEnd()
    })
    .join("\n")

/**
 * @param {string} workflow
 * @param {string} jobName
 */
const readJob = (workflow, jobName) => {
  const marker = `  ${jobName}:\n`
  const markerIndex = workflow.indexOf(marker)

  if (markerIndex === -1) {
    return ""
  }

  const bodyStart = markerIndex + marker.length
  const remainder = workflow.slice(bodyStart)
  const nextJobIndex = remainder.search(/^  [A-Za-z0-9_-]+:\n/m)
  const body = nextJobIndex === -1 ? remainder : remainder.slice(0, nextJobIndex)

  return `${marker}${body}`
}

/**
 * @param {string} source
 * @param {readonly string[]} fragments
 */
const assertInOrder = (source, fragments) => {
  let previousIndex = -1

  for (const fragment of fragments) {
    const currentIndex = source.indexOf(fragment)

    assert.ok(currentIndex > previousIndex, `${fragment} must appear in order`)
    previousIndex = currentIndex
  }
}

test("ignores YAML comments when checking active workflow configuration", () => {
  const activeWorkflow = stripYamlComments(`permissions:
  contents: read
  # pages: write
# PAT is not used`)

  assert.doesNotMatch(activeWorkflow, /pages: write|\bPAT\b/)
})

test("targets main and keeps Pages runs serialized", async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")
  const workflow = stripYamlComments(workflowFile)
  assert.match(
    workflow,
    /^on:\n  pull_request:\n    branches: \[main\]\n  push:\n    branches: \[main\]\n  workflow_dispatch:\n/m,
  )
  assert.match(
    workflow,
    /^concurrency:\n  group: pages\n  cancel-in-progress: false$/m,
  )
  assert.doesNotMatch(workflow, /pull_request_target/)
})

test("builds and verifies the Pages artifact in order", async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")
  const workflow = stripYamlComments(workflowFile)
  const buildJob = readJob(workflow, "build")

  assert.notEqual(buildJob, "", "build job must exist")
  assertInOrder(buildJob, [
    "        uses: actions/checkout@v6",
    "        uses: actions/setup-node@v6",
    "        run: npm ci",
    "        run: npm test",
    "        run: npm run typecheck",
    "        run: npm run build",
    "        run: npm run verify:styles",
    "        run: npm run verify:layout",
    "        run: npm run verify:home",
    "        run: npm run verify:post",
    "        uses: actions/configure-pages@v5",
    "        uses: actions/upload-pages-artifact@v4",
  ])
  assert.match(buildJob, /^          node-version-file: \.nvmrc$/m)
  assert.match(buildJob, /^          cache: npm$/m)
  assert.match(buildJob, /^          path: public$/m)
  assert.match(buildJob, /permissions:\n      contents: read/)
  assert.doesNotMatch(
    buildJob,
    /^      (?:pages: write|id-token: write)|^    environment:$/m,
  )
  assert.doesNotMatch(buildJob, /^        run: npm run clean$/m)
})

test("deploys only from main after build with least privilege", async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")
  const workflow = stripYamlComments(workflowFile)
  const deployJob = readJob(workflow, "deploy")

  assert.notEqual(deployJob, "", "deploy job must exist")
  assert.match(deployJob, /^    needs: build$/m)
  assert.match(
    deployJob,
    /^    if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'$/m,
  )
  assert.match(deployJob, /permissions:\n      contents: read/)
  assert.match(deployJob, /^      pages: write$/m)
  assert.match(deployJob, /^      id-token: write$/m)
  assert.match(deployJob, /environment:\n      name: github-pages/)
  assert.match(
    deployJob,
    /^      url: \$\{\{ steps\.deployment\.outputs\.page_url \}\}$/m,
  )
  assert.match(deployJob, /^        id: deployment$/m)
  assert.match(deployJob, /^        uses: actions\/deploy-pages@v4$/m)
})

test("does not add generated branches or long-lived credentials", async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")
  const workflow = stripYamlComments(workflowFile)
  assert.doesNotMatch(
    workflow,
    /secrets\.|GITHUB_TOKEN|\bPAT\b|api[_-]?key|gh-pages|git push/i,
  )
})
