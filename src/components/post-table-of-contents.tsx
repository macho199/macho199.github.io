import * as React from "react"

type PostTocItem = Readonly<{
  id: string
  href: `#${string}`
  title: string
}>

type PostTableOfContentsProps = Readonly<{
  items: readonly PostTocItem[]
}>

const ACTIVE_HEADING_OFFSET = 120
const OBSERVER_ROOT_MARGIN = `-${ACTIVE_HEADING_OFFSET}px 0px -60% 0px`

const readHashId = () => {
  const fragment = window.location.hash.slice(1)

  if (!fragment) {
    return ""
  }

  try {
    return decodeURIComponent(fragment)
  } catch {
    return ""
  }
}

const PostTableOfContents = ({ items }: PostTableOfContentsProps) => {
  const [activeId, setActiveId] = React.useState(items[0]?.id ?? "")

  React.useEffect(() => {
    if (items.length === 0) {
      return undefined
    }

    const hashId = readHashId()

    if (items.some(item => item.id === hashId)) {
      setActiveId(hashId)
    }

    if (!("IntersectionObserver" in window)) {
      return undefined
    }

    const headings = items
      .map(item => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => heading !== null)

    if (headings.length === 0) {
      return undefined
    }

    const syncActiveId = () => {
      const activeHeading = headings.reduce<HTMLElement | null>(
        (current, heading) =>
          heading.getBoundingClientRect().top <= ACTIVE_HEADING_OFFSET
            ? heading
            : current,
        null,
      )

      setActiveId(activeHeading?.id ?? headings[0].id)
    }

    const observer = new window.IntersectionObserver(syncActiveId, {
      rootMargin: OBSERVER_ROOT_MARGIN,
      threshold: 0,
    })
    const viewportObserver = new window.IntersectionObserver(syncActiveId)

    for (const heading of headings) {
      observer.observe(heading)
      viewportObserver.observe(heading)
    }

    syncActiveId()

    return () => {
      observer.disconnect()
      viewportObserver.disconnect()
    }
  }, [items])

  if (items.length === 0) {
    return null
  }

  return (
    <aside className="post-toc-rail">
      <nav className="post-toc" aria-label="글 목차">
        <p className="post-toc-title">목차</p>
        <ol className="post-toc-list">
          {items.map(item => {
            const isActive = activeId === item.id

            return (
              <li key={item.id}>
                <a
                  className={`post-toc-link${
                    isActive ? " post-toc-link--active" : ""
                  }`}
                  href={item.href}
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => setActiveId(item.id)}
                >
                  {item.title}
                </a>
              </li>
            )
          })}
        </ol>
      </nav>
    </aside>
  )
}

export default PostTableOfContents
