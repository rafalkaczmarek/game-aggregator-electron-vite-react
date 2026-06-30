import { describe, expect, it } from 'vitest'
import {
  estimateGridRowHeight,
  getGridColumnCount,
  getVisibleGridRange,
  LIST_ROW_HEIGHT,
} from '@src/components/game-library/lib/virtualScroll'

describe('virtualScroll', () => {
  it('maps container width to grid column counts', () => {
    expect(getGridColumnCount(500)).toBe(2)
    expect(getGridColumnCount(700)).toBe(3)
    expect(getGridColumnCount(899)).toBe(4)
    expect(getGridColumnCount(900)).toBe(5)
    expect(getGridColumnCount(976)).toBe(5)
    expect(getGridColumnCount(1200)).toBe(5)
  })

  it('windows items with fallback height before the scroll container is measured', () => {
    const range = getVisibleGridRange(0, 0, 100, 1, LIST_ROW_HEIGHT)

    expect(range).toEqual({
      startIndex: 0,
      endIndex: 23,
      totalHeight: 100 * LIST_ROW_HEIGHT,
    })
  })

  it('windows visible grid rows with overscan', () => {
    const rowHeight = estimateGridRowHeight(1024, 5)

    expect(getVisibleGridRange(0, rowHeight, 20, 5, rowHeight)).toEqual({
      startIndex: 0,
      endIndex: 15,
      totalHeight: rowHeight * 4,
    })
  })
})
