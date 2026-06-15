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

  it('returns all items before the scroll container is measured', () => {
    expect(getVisibleGridRange(0, 0, 12, 1, LIST_ROW_HEIGHT)).toEqual({
      startIndex: 0,
      endIndex: 12,
      totalHeight: 12 * LIST_ROW_HEIGHT,
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
