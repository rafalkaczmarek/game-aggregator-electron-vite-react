import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

const LIBRARY_SCROLL_TEST_ID = /^game-library-(grid|list)$/

class ResizeObserverMock {
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: { width: 1024, height: 600 } as DOMRectReadOnly,
        } as ResizeObserverEntry,
      ],
      this,
    )
  }

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
})

const nativeGetBoundingClientRect = Element.prototype.getBoundingClientRect

Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element) {
  const testId = this.getAttribute('data-testid')
  if (testId && LIBRARY_SCROLL_TEST_ID.test(testId)) {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 600,
      right: 1024,
      width: 1024,
      height: 600,
      toJSON: () => ({}),
    } as DOMRect
  }

  return nativeGetBoundingClientRect.call(this)
}

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get(this: HTMLElement) {
    const testId = this.getAttribute('data-testid')
    if (testId && LIBRARY_SCROLL_TEST_ID.test(testId)) return 600
    return 0
  },
})

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get(this: HTMLElement) {
    const testId = this.getAttribute('data-testid')
    if (testId && LIBRARY_SCROLL_TEST_ID.test(testId)) return 1024
    return 0
  },
})

afterEach(() => {
  cleanup()
})
