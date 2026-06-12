import { useEffect, useState, type RefObject } from 'react'

interface ScrollContainerMetrics {
  width: number
  height: number
  scrollTop: number
}

export function useScrollContainerMetrics(
  scrollRef: RefObject<HTMLElement | null>,
): ScrollContainerMetrics {
  const [metrics, setMetrics] = useState<ScrollContainerMetrics>({
    width: 0,
    height: 0,
    scrollTop: 0,
  })

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    function readMetrics() {
      setMetrics({
        width: element!.clientWidth,
        height: element!.clientHeight,
        scrollTop: element!.scrollTop,
      })
    }

    readMetrics()

    element.addEventListener('scroll', readMetrics, { passive: true })

    const observer = new ResizeObserver(readMetrics)
    observer.observe(element)

    return () => {
      element.removeEventListener('scroll', readMetrics)
      observer.disconnect()
    }
  }, [scrollRef])

  return metrics
}
