import * as React from "react"
import type { PropsWithChildren } from "react"

import Footer from "./footer"
import Header from "./header"
import ScrollToTopButton from "./scroll-to-top-button"

const Layout = ({ children }: PropsWithChildren) => (
  <div className="site-shell">
    <Header />
    <main id="content" className="site-main">
      {children}
    </main>
    <Footer />
    <ScrollToTopButton />
  </div>
)

export default Layout
