export const LIBRARY_SCROLL_HEIGHT_CLASS = 'h-[min(70vh,900px)]'

export const LIST_ROW_HEIGHT = 63

const GRID_GAP_PX = 12

export function getGridColumnCount(width: number): number {
  if (width >= 1024) return 5
  if (width >= 768) return 4
  if (width >= 640) return 3
  return 2
}

export function estimateGridRowHeight(containerWidth: number, columnCount: number): number {
  const cardWidth = (containerWidth - GRID_GAP_PX * (columnCount - 1)) / columnCount
  const coverHeight = cardWidth * (215 / 460)
  return coverHeight + 92 + GRID_GAP_PX
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
