import type { HeadFC } from "gatsby"
import * as React from "react"

import Seo from "../components/seo"

const NotFoundPage = () => (
  <main>
    <h1>Page not found</h1>
    <p>The requested page does not exist.</p>
  </main>
)

export default NotFoundPage

export const Head: HeadFC = ({ location }) => (
  <Seo title="Not Found" pathname={location.pathname} />
)
