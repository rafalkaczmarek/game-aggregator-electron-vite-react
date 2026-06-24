import { useEffect, useState, type RefObject } from 'react'

export function useScrollContainerWidth(scrollRef: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    function readWidth() {
      setWidth((prev) => {
        const next = element!.clientWidth
        return prev === next ? prev : next
      })
    }

    readWidth()

    const observer = new ResizeObserver(readWidth)
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [scrollRef])

  return width
}
