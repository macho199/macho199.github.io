import type { PropsWithChildren } from "react"

const ContentContainer = ({ children }: PropsWithChildren) => (
  <div className="site-container">{children}</div>
)

export default ContentContainer
