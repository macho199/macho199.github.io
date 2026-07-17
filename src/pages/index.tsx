import type { HeadFC } from "gatsby"
import * as React from "react"

const IndexPage = () => (
  <main>
    <h1>Developer Blog</h1>
    <p>Gatsby foundation is ready.</p>
  </main>
)

export default IndexPage

export const Head: HeadFC = () => <title>Developer Blog</title>
