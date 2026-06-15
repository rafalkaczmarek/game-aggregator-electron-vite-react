export const LIBRARY_SCROLL_HEIGHT_CLASS = 'h-[min(70vh,900px)]'

export const LIST_ROW_HEIGHT = 44

export const GRID_GAP_PX = 12
export const GRID_ROW_GAP_PX = 20
/** Card width relative to grid column (`<li>` slot). */
export const GRID_CARD_WIDTH_SCALE = 0.95
const GRID_COVER_HEIGHT_RATIO = 3 / 2
/** Fixed meta block: padding + 2-line title + platform/playtime row. */
export const GRID_CARD_META_HEIGHT_PX = 80

export function getGridColumnCount(width: number): number {
  // max-w-5xl (1024px) minus section padding leaves ~976px — 5 cols need a lower threshold.
  if (width >= 900) return 5
  if (width >= 768) return 4
  if (width >= 640) return 3
  return 2
}

export function estimateGridRowHeight(containerWidth: number, columnCount: number): number {
  const columnWidth = (containerWidth - GRID_GAP_PX * (columnCount - 1)) / columnCount
  const cardWidth = columnWidth * GRID_CARD_WIDTH_SCALE
  const coverHeight = cardWidth * GRID_COVER_HEIGHT_RATIO
  return coverHeight + GRID_CARD_META_HEIGHT_PX + GRID_ROW_GAP_PX
}

export function getVisibleGridRange(
  scrollTop: number,
  viewportHeight: number,
  itemCount: number,
  columnCount: number,
  rowHeight: number,
  overscanRows = 2,
): { startIndex: number; endIndex: number; totalHeight: number } {
  if (itemCount === 0) {
    return { startIndex: 0, endIndex: 0, totalHeight: 0 }
  }

  const rowCount = Math.ceil(itemCount / columnCount)
  const totalHeight = rowCount * rowHeight

  if (viewportHeight <= 0) {
    return { startIndex: 0, endIndex: itemCount, totalHeight }
  }

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscanRows)
  const endRow = Math.min(
    rowCount,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscanRows,
  )

  return {
    startIndex: startRow * columnCount,
    endIndex: Math.min(itemCount, endRow * columnCount),
    totalHeight,
  }
}
