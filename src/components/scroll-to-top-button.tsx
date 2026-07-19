import * as React from "react"

const SCROLL_UP_THRESHOLD_PX = 16
const SCROLL_DURATION_MS = 1000
const CANCEL_SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "Space",
])

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = React.useState(false)
  const startScrollRef = React.useRef<(isKeyboard: boolean) => void>(() => {})

  React.useEffect(() => {
    let lastScrollY = window.scrollY
    let upwardDistance = 0
    let observationFrame: number | null = null
    let scrollAnimationFrame: number | null = null

    const focusSiteLogo = () => {
      document
        .querySelector<HTMLElement>(".site-logo")
        ?.focus({ preventScroll: true })
    }

    const cancelScrollAnimation = () => {
      if (scrollAnimationFrame === null) return

      window.cancelAnimationFrame(scrollAnimationFrame)
      scrollAnimationFrame = null
    }

    const startScroll = (isKeyboard: boolean) => {
      cancelScrollAnimation()

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, 0)
        if (isKeyboard) focusSiteLogo()
        return
      }

      const startScrollY = window.scrollY
      if (startScrollY <= 0) {
        if (isKeyboard) focusSiteLogo()
        return
      }

      const startedAt = window.performance.now()

      const animate = (timestamp: number) => {
        const elapsed = Math.max(0, timestamp - startedAt)
        const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1)
        const easedProgress = 1 - (1 - progress) ** 3

        if (progress < 1) {
          const nextScrollY = Math.max(
            1,
            Math.round(startScrollY * (1 - easedProgress)),
          )
          window.scrollTo(0, nextScrollY)
          scrollAnimationFrame = window.requestAnimationFrame(animate)
          return
        }

        window.scrollTo(0, 0)
        scrollAnimationFrame = null
        if (isKeyboard) focusSiteLogo()
      }

      scrollAnimationFrame = window.requestAnimationFrame(animate)
    }

    const updateVisibility = () => {
      observationFrame = null
      const currentScrollY = window.scrollY

      if (currentScrollY <= window.innerHeight) {
        setIsVisible(false)
        upwardDistance = 0
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false)
        upwardDistance = 0
      } else if (currentScrollY < lastScrollY) {
        upwardDistance += lastScrollY - currentScrollY
        if (upwardDistance >= SCROLL_UP_THRESHOLD_PX) {
          setIsVisible(true)
        }
      }

      lastScrollY = currentScrollY
    }

    const handleScroll = () => {
      if (observationFrame !== null) return

      observationFrame = window.requestAnimationFrame(updateVisibility)
    }

    const handleResize = () => {
      lastScrollY = window.scrollY
      if (window.scrollY <= window.innerHeight) {
        setIsVisible(false)
        upwardDistance = 0
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (CANCEL_SCROLL_KEYS.has(event.code)) cancelScrollAnimation()
    }

    startScrollRef.current = startScroll
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)
    window.addEventListener("wheel", cancelScrollAnimation, { passive: true })
    window.addEventListener("touchstart", cancelScrollAnimation, {
      passive: true,
    })
    window.addEventListener("pointerdown", cancelScrollAnimation, {
      passive: true,
    })
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      startScrollRef.current = () => {}
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("wheel", cancelScrollAnimation)
      window.removeEventListener("touchstart", cancelScrollAnimation)
      window.removeEventListener("pointerdown", cancelScrollAnimation)
      window.removeEventListener("keydown", handleKeyDown)

      if (observationFrame !== null) {
        window.cancelAnimationFrame(observationFrame)
      }
      if (scrollAnimationFrame !== null) {
        window.cancelAnimationFrame(scrollAnimationFrame)
      }
    }
  }, [])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    startScrollRef.current(event.detail === 0)
  }

  return (
    <button
      className={`scroll-to-top-button${isVisible ? " is-visible" : ""}`}
      type="button"
      aria-label="페이지 맨 위로 이동"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      onClick={handleClick}
    >
      <svg
        className="scroll-to-top-icon"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 19V5m-6 6 6-6 6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export default ScrollToTopButton
