const TRADEMARK_PATTERN = /[\u2122\u00AE\u00A9\u2120]/g

export function normalizeTitleCharacters(title: string): string {
  return title
    .replace(/[\u2018\u2019\u201A\u2032`´]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(TRADEMARK_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeGameTitle(title: string): string {
  return normalizeTitleCharacters(title).replace(/:/g, '').toLocaleLowerCase()
}
