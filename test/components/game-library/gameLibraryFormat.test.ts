import { describe, expect, it } from 'vitest'
import {
  filterGroupedGamesByPlayStatus,
  formatPlaytime,
  getGroupedGameCoverGame,
  getGroupedGameMetacritic,
  getGroupedGameMetacriticSortScore,
  getGroupedGamePlaytime,
  groupGamesByTitle,
  isGroupedGameInstalled,
  isGroupedGamePlayed,
  isGamePlayed,
  normalizeGameTitle,
  normalizeTitleCharacters,
  sortGamesByTitle,
  sortGroupedGames,
  sortGroupedGamesByTitle,
} from '@src/components/game-library/lib/format'
import type { Game } from '@shared/types/game'
import { sampleGames } from '@test/fixtures/games'

describe('game library format helpers', () => {
  describe('normalizeTitleCharacters', () => {
    it('normalizes curly apostrophes to ASCII', () => {
      expect(normalizeTitleCharacters('Assassin\u2019s Creed')).toBe("Assassin's Creed")
    })

    it('removes trademark symbols and collapses whitespace', () => {
      expect(normalizeTitleCharacters('Call of Duty®:  Modern Warfare™')).toBe(
        'Call of Duty: Modern Warfare',
      )
    })
  })

  describe('normalizeGameTitle', () => {
    it('lowercases and ignores colons for matching', () => {
      expect(normalizeGameTitle('A Plague Tale: Innocence')).toBe('a plague tale innocence')
      expect(normalizeGameTitle('A Plague Tale Innocence')).toBe('a plague tale innocence')
    })
  })

  describe('grouped game helpers', () => {
    const group = groupGamesByTitle([
      {
        id: 'gog-1',
        platform: 'gog',
        title: 'Example Game',
        installed: false,
        playtimeMinutes: 60,
      },
      {
        id: 'epic-1',
        platform: 'epic',
        title: 'Example Game',
        installed: true,
        playtimeMinutes: 30,
        coverUrl: 'https://example.com/cover.jpg',
      },
    ])[0]

    it('picks cover from an entry that has coverUrl', () => {
      expect(getGroupedGameCoverGame(group).coverUrl).toBe('https://example.com/cover.jpg')
    })

    it('sums playtime across platform entries', () => {
      expect(getGroupedGamePlaytime(group)).toBe(90)
    })

    it('returns undefined playtime when all entries are unplayed', () => {
      const unplayed = groupGamesByTitle([
        { id: 'gog-1', platform: 'gog', title: 'Idle Game', installed: false },
        {
          id: 'epic-1',
          platform: 'epic',
          title: 'Idle Game',
          installed: false,
          playtimeMinutes: 0,
        },
      ])[0]

      expect(getGroupedGamePlaytime(unplayed)).toBeUndefined()
    })

    it('marks grouped game installed when any entry is installed', () => {
      expect(isGroupedGameInstalled(group)).toBe(true)
    })

    it('detects played games and groups', () => {
      expect(isGamePlayed(group.entries[0])).toBe(true)
      expect(isGamePlayed({ id: 'idle', platform: 'steam', title: 'Idle', installed: false })).toBe(
        false,
      )
      expect(
        isGamePlayed({
          id: 'zero',
          platform: 'steam',
          title: 'Zero',
          installed: false,
          playtimeMinutes: 0,
        }),
      ).toBe(false)
      expect(isGroupedGamePlayed(group)).toBe(true)
    })
  })

  describe('getGroupedGameMetacritic', () => {
    it('returns undefined when no entry has a rating', () => {
      const grouped = groupGamesByTitle([
        { id: 'gog-1', platform: 'gog', title: 'No Rating Game', installed: false },
        { id: 'epic-1', platform: 'epic', title: 'No Rating Game', installed: false },
      ])[0]

      expect(getGroupedGameMetacritic(grouped)).toBeUndefined()
    })

    it('picks the highest metascore across platform entries', () => {
      const grouped = groupGamesByTitle([
        {
          id: 'gog-1',
          platform: 'gog',
          title: 'Cross Platform Hit',
          installed: false,
          metacritic: { metascore: 78, userScore: 8.1, platform: 'pc' },
        },
        {
          id: 'psn-1',
          platform: 'psn',
          title: 'Cross Platform Hit',
          installed: false,
          metacritic: { metascore: 92, userScore: 7.4, platform: 'playstation-5' },
        },
      ])[0]

      expect(getGroupedGameMetacritic(grouped)).toEqual({
        metascore: 92,
        userScore: 7.4,
        platform: 'playstation-5',
      })
    })

    it('falls back to the entry with the highest user score when no metascore exists', () => {
      const grouped = groupGamesByTitle([
        {
          id: 'gog-1',
          platform: 'gog',
          title: 'User Only Game',
          installed: false,
          metacritic: { userScore: 6.2, platform: 'pc' },
        },
        {
          id: 'epic-1',
          platform: 'epic',
          title: 'User Only Game',
          installed: false,
          metacritic: { userScore: 8.9, platform: 'pc' },
        },
      ])[0]

      expect(getGroupedGameMetacritic(grouped)).toEqual({ userScore: 8.9, platform: 'pc' })
    })

    it('skips entries without ratings when picking the best', () => {
      const grouped = groupGamesByTitle([
        { id: 'gog-1', platform: 'gog', title: 'Mixed Game', installed: false },
        {
          id: 'epic-1',
          platform: 'epic',
          title: 'Mixed Game',
          installed: false,
          metacritic: { metascore: 81, platform: 'pc' },
        },
      ])[0]

      expect(getGroupedGameMetacritic(grouped)).toEqual({ metascore: 81, platform: 'pc' })
    })
  })

  describe('getGroupedGameMetacriticSortScore', () => {
    it('returns metascore when available', () => {
      const grouped = groupGamesByTitle([
        {
          id: 'steam-1',
          platform: 'steam',
          title: 'Rated Game',
          installed: false,
          metacritic: { metascore: 88, userScore: 7.0, platform: 'pc' },
        },
      ])[0]

      expect(getGroupedGameMetacriticSortScore(grouped)).toBe(88)
    })

    it('scales user score to 0-100 when metascore is missing', () => {
      const grouped = groupGamesByTitle([
        {
          id: 'steam-1',
          platform: 'steam',
          title: 'User Rated Game',
          installed: false,
          metacritic: { userScore: 8.5, platform: 'pc' },
        },
      ])[0]

      expect(getGroupedGameMetacriticSortScore(grouped)).toBe(85)
    })

    it('returns undefined when no rating exists', () => {
      const grouped = groupGamesByTitle([
        { id: 'steam-1', platform: 'steam', title: 'Unrated Game', installed: false },
      ])[0]

      expect(getGroupedGameMetacriticSortScore(grouped)).toBeUndefined()
    })
  })

  describe('filterGroupedGamesByPlayStatus', () => {
    const groups = groupGamesByTitle(sampleGames)

    it('returns all groups when status is all', () => {
      expect(filterGroupedGamesByPlayStatus(groups, 'all')).toHaveLength(3)
    })

    it('keeps only played groups', () => {
      const played = filterGroupedGamesByPlayStatus(groups, 'played')
      expect(played.map((group) => group.title).sort()).toEqual(['Alan Wake', 'Dota 2'])
    })

    it('keeps only unplayed groups', () => {
      const unplayed = filterGroupedGamesByPlayStatus(groups, 'unplayed')
      expect(unplayed.map((group) => group.title)).toEqual(['Cyberpunk 2077'])
    })
  })

  describe('formatPlaytime', () => {
    it('returns Not played for missing or zero playtime', () => {
      expect(formatPlaytime()).toBe('Not played')
      expect(formatPlaytime(0)).toBe('Not played')
      expect(formatPlaytime(-5)).toBe('Not played')
    })

    it('formats minutes under one hour', () => {
      expect(formatPlaytime(45)).toBe('45 min')
    })

    it('formats fractional hours below ten hours', () => {
      expect(formatPlaytime(125)).toBe('2.1 hrs')
    })

    it('rounds whole hours at ten hours or more', () => {
      expect(formatPlaytime(600)).toBe('10 hrs')
      expect(formatPlaytime(615)).toBe('10 hrs')
    })
  })

  describe('sortGamesByTitle', () => {
    it('sorts games alphabetically without mutating the source array', () => {
      const sorted = sortGamesByTitle(sampleGames)

      expect(sorted.map((game) => game.title)).toEqual(['Alan Wake', 'Cyberpunk 2077', 'Dota 2'])
      expect(sampleGames.map((game) => game.title)).toEqual([
        'Dota 2',
        'Cyberpunk 2077',
        'Alan Wake',
      ])
    })
  })

  describe('sortGroupedGames', () => {
    const playtimeGames: Game[] = [
      {
        id: 'steam-dota',
        platform: 'steam',
        title: 'Dota 2',
        installed: true,
        playtimeMinutes: 5000,
      },
      {
        id: 'gog-plague',
        platform: 'gog',
        title: 'A Plague Tale: Innocence',
        installed: false,
        playtimeMinutes: 120,
      },
      {
        id: 'epic-plague',
        platform: 'epic',
        title: 'A Plague Tale: Innocence',
        installed: true,
        playtimeMinutes: 30,
      },
      {
        id: 'steam-cyber',
        platform: 'steam',
        title: 'Cyberpunk 2077',
        installed: false,
      },
    ]

    it('sorts grouped games by total playtime descending', () => {
      const grouped = sortGroupedGames(groupGamesByTitle(playtimeGames), 'playtime-desc')

      expect(grouped.map((game) => game.title)).toEqual([
        'Dota 2',
        'A Plague Tale: Innocence',
        'Cyberpunk 2077',
      ])
    })

    it('sorts grouped games by total playtime ascending', () => {
      const grouped = sortGroupedGames(groupGamesByTitle(playtimeGames), 'playtime-asc')

      expect(grouped.map((game) => game.title)).toEqual([
        'Cyberpunk 2077',
        'A Plague Tale: Innocence',
        'Dota 2',
      ])
    })

    it('falls back to title when playtime is equal', () => {
      const grouped = sortGroupedGames(
        groupGamesByTitle([
          { id: 'gog-z', platform: 'gog', title: 'Zelda', installed: false, playtimeMinutes: 60 },
          { id: 'gog-a', platform: 'gog', title: 'Alan Wake', installed: false, playtimeMinutes: 60 },
        ]),
        'playtime-desc',
      )

      expect(grouped.map((game) => game.title)).toEqual(['Alan Wake', 'Zelda'])
    })

    const metacriticGames: Game[] = [
      {
        id: 'steam-dota',
        platform: 'steam',
        title: 'Dota 2',
        installed: true,
        metacritic: { metascore: 90, platform: 'pc' },
      },
      {
        id: 'gog-cyber',
        platform: 'gog',
        title: 'Cyberpunk 2077',
        installed: false,
        metacritic: { metascore: 86, platform: 'pc' },
      },
      {
        id: 'epic-alan',
        platform: 'epic',
        title: 'Alan Wake',
        installed: true,
        metacritic: { metascore: 83, platform: 'pc' },
      },
      {
        id: 'steam-unrated',
        platform: 'steam',
        title: 'Unrated Game',
        installed: false,
      },
    ]

    it('sorts grouped games by metacritic score descending', () => {
      const grouped = sortGroupedGames(groupGamesByTitle(metacriticGames), 'metacritic-desc')

      expect(grouped.map((game) => game.title)).toEqual([
        'Dota 2',
        'Cyberpunk 2077',
        'Alan Wake',
        'Unrated Game',
      ])
    })

    it('sorts grouped games by metacritic score ascending', () => {
      const grouped = sortGroupedGames(groupGamesByTitle(metacriticGames), 'metacritic-asc')

      expect(grouped.map((game) => game.title)).toEqual([
        'Alan Wake',
        'Cyberpunk 2077',
        'Dota 2',
        'Unrated Game',
      ])
    })

    it('falls back to title when metacritic scores are equal', () => {
      const grouped = sortGroupedGames(
        groupGamesByTitle([
          {
            id: 'gog-z',
            platform: 'gog',
            title: 'Zelda',
            installed: false,
            metacritic: { metascore: 80, platform: 'pc' },
          },
          {
            id: 'gog-a',
            platform: 'gog',
            title: 'Alan Wake',
            installed: false,
            metacritic: { metascore: 80, platform: 'pc' },
          },
        ]),
        'metacritic-desc',
      )

      expect(grouped.map((game) => game.title)).toEqual(['Alan Wake', 'Zelda'])
    })
  })

  describe('groupGamesByTitle', () => {
    const duplicateGames: Game[] = [
      {
        id: 'gog-plague',
        platform: 'gog',
        title: 'A Plague Tale: Innocence',
        installed: false,
        playtimeMinutes: 120,
      },
      {
        id: 'epic-plague',
        platform: 'epic',
        title: 'A Plague Tale: Innocence',
        installed: true,
        playtimeMinutes: 30,
        coverUrl: 'https://example.com/plague.jpg',
      },
      {
        id: 'steam-dota',
        platform: 'steam',
        title: 'Dota 2',
        installed: true,
      },
    ]

    it('merges games with the same title across platforms', () => {
      const grouped = groupGamesByTitle(duplicateGames)

      expect(grouped).toHaveLength(2)
      expect(grouped.find((game) => game.title === 'A Plague Tale: Innocence')).toMatchObject({
        platforms: ['gog', 'epic'],
        entries: expect.arrayContaining([
          expect.objectContaining({ platform: 'gog' }),
          expect.objectContaining({ platform: 'epic' }),
        ]),
      })
    })

    it('matches titles case-insensitively', () => {
      const grouped = groupGamesByTitle([
        { id: 'gog-1', platform: 'gog', title: 'Alan Wake', installed: false },
        { id: 'epic-1', platform: 'epic', title: 'alan wake', installed: false },
      ])

      expect(grouped).toHaveLength(1)
      expect(grouped[0].platforms).toEqual(['gog', 'epic'])
    })

    it('matches titles with different apostrophe characters', () => {
      const grouped = groupGamesByTitle([
        { id: 'gog-1', platform: 'gog', title: "Assassin's Creed", installed: false },
        { id: 'epic-1', platform: 'epic', title: 'Assassin\u2019s Creed', installed: false },
      ])

      expect(grouped).toHaveLength(1)
      expect(grouped[0].title).toBe("Assassin's Creed")
      expect(grouped[0].platforms).toEqual(['gog', 'epic'])
    })

    it('matches titles ignoring trademark symbols and colons', () => {
      const grouped = groupGamesByTitle([
        {
          id: 'steam-1',
          platform: 'steam',
          title: 'Call of Duty®: Modern Warfare',
          installed: false,
        },
        { id: 'gog-1', platform: 'gog', title: 'Call of Duty Modern Warfare™', installed: false },
      ])

      expect(grouped).toHaveLength(1)
      expect(grouped[0].title).toBe('Call of Duty: Modern Warfare')
      expect(grouped[0].platforms).toEqual(['steam', 'gog'])
    })

    it('matches titles when only one platform includes a colon', () => {
      const grouped = groupGamesByTitle([
        { id: 'gog-1', platform: 'gog', title: 'A Plague Tale Innocence', installed: false },
        { id: 'epic-1', platform: 'epic', title: 'A Plague Tale: Innocence', installed: false },
      ])

      expect(grouped).toHaveLength(1)
      expect(grouped[0].title).toBe('A Plague Tale: Innocence')
    })

    it('sorts grouped games alphabetically', () => {
      const grouped = sortGroupedGamesByTitle(groupGamesByTitle(duplicateGames))

      expect(grouped.map((game) => game.title)).toEqual(['A Plague Tale: Innocence', 'Dota 2'])
    })

    it('sorts platforms in canonical order within a group', () => {
      const grouped = groupGamesByTitle([
        { id: 'psn-1', platform: 'psn', title: 'Shared Game', installed: false },
        { id: 'epic-1', platform: 'epic', title: 'Shared Game', installed: false },
        { id: 'steam-1', platform: 'steam', title: 'Shared Game', installed: false },
        { id: 'gog-1', platform: 'gog', title: 'Shared Game', installed: false },
      ])

      expect(grouped[0].platforms).toEqual(['steam', 'gog', 'epic', 'psn'])
    })
  })
})
