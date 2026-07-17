import * as React from "react"
import type { PropsWithChildren } from "react"

import Footer from "./footer"
import Header from "./header"

const Layout = ({ children }: PropsWithChildren) => (
  <div className="site-shell">
    <Header />
    <main id="content" className="site-main">
      {children}
    </main>
    <Footer />
  </div>
)

export default Layout
