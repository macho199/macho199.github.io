import type { HeadFC } from "gatsby"
import * as React from "react"

const NotFoundPage = () => (
  <main>
    <h1>Page not found</h1>
    <p>The requested page does not exist.</p>
  </main>
)

export default NotFoundPage

export const Head: HeadFC = () => <title>Not Found | Developer Blog</title>
