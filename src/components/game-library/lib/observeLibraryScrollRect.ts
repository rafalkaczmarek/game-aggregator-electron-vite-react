import { observeElementRect, type Virtualizer } from '@tanstack/react-virtual'
import { LIBRARY_SCROLL_FALLBACK_HEIGHT_PX } from './virtualScroll'

export function observeLibraryScrollRect<T extends Element>(
  instance: Virtualizer<T, Element>,
  callback: (rect: { width: number; height: number }, element: T) => void,
) {
  return observeElementRect(instance, (rect, element) => {
    callback(
      {
        width: rect.width,
        height: rect.height > 0 ? rect.height : LIBRARY_SCROLL_FALLBACK_HEIGHT_PX,
      },
      element,
    )
  })
}
