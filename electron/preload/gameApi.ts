import { ipcRenderer } from 'electron'
import type {
  AggregatedLibrary,
  GameDescriptionRequest,
  GamePlatform,
  ScanResult,
} from '../../shared/types/game'
import type { RecommendationsOptions, RecommendationsResult } from '../../shared/types/recommendations'

let scanAllImpl: () => Promise<AggregatedLibrary> = () => ipcRenderer.invoke('games:scan-all')
let enrichMetacriticImpl: () => Promise<{ started: true }> = () =>
  ipcRenderer.invoke('games:enrich-metacritic')

let lastRecommendationsOptions: RecommendationsOptions | undefined

function createTrackedRecommendationsImpl(
  invoke: (options?: RecommendationsOptions) => Promise<RecommendationsResult>,
) {
  return (options?: RecommendationsOptions) => {
    lastRecommendationsOptions = options
    return invoke(options)
  }
}

let getRecommendationsImpl = createTrackedRecommendationsImpl((options) =>
  ipcRenderer.invoke('games:get-recommendations', options),
)

export function configureScanAllMock(result: AggregatedLibrary | null) {
  scanAllImpl = result
    ? () => Promise.resolve(result)
    : () => ipcRenderer.invoke('games:scan-all')
}

export function configureEnrichMetacriticMock(result: AggregatedLibrary | null) {
  enrichMetacriticImpl = result
    ? () => ipcRenderer.invoke('e2e:simulate-metacritic-enrichment', result)
    : () => ipcRenderer.invoke('games:enrich-metacritic')
}

export function configureEnrichMetacriticFromCacheMode(enabled: boolean) {
  enrichMetacriticImpl = enabled
    ? () => ipcRenderer.invoke('e2e:enrich-metacritic-cached')
    : () => ipcRenderer.invoke('games:enrich-metacritic')
}

export function configureRecommendationsMock(result: RecommendationsResult | null) {
  getRecommendationsImpl = createTrackedRecommendationsImpl(
    result
      ? () => Promise.resolve(result)
      : (options) => ipcRenderer.invoke('games:get-recommendations', options),
  )
}

export function getLastRecommendationsOptions() {
  return lastRecommendationsOptions
}

export function resetLastRecommendationsOptions() {
  lastRecommendationsOptions = undefined
}

export const gameApi = {
  getLibrary: (): Promise<AggregatedLibrary | null> => ipcRenderer.invoke('games:get-library'),
  scanAll: (): Promise<AggregatedLibrary> => scanAllImpl(),
  enrichMetacritic: (): Promise<{ started: true }> => enrichMetacriticImpl(),
  scanPlatform: (platform: GamePlatform): Promise<ScanResult> =>
    ipcRenderer.invoke('games:scan-platform', platform),
  getGameDescription: (request: GameDescriptionRequest) =>
    ipcRenderer.invoke('games:get-game-description', request),
  getRecommendations: (options?: RecommendationsOptions): Promise<RecommendationsResult> =>
    getRecommendationsImpl(options),
}
