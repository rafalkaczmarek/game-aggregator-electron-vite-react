# AGENTS.md — zasady dla agentów AI

Wytyczne specyficzne dla tego repozytorium. Szerszy kontekst projektu: `docs/ARCHITECTURE.md`, `.cursor/rules/`.

## Stack (skrót)

- **Electron + Vite + React + TypeScript**
- **Main process** — skanery, API, sekrety; **renderer** — tylko UI
- **IPC** przez `contextBridge` + `ipcMain.handle` (bez `nodeIntegration` w rendererze)
- Wspólny model gry: `shared/types/game.ts`

## Organizacja `src/components/`

Komponenty grupujemy **per feature** (nie płasko w `components/`).

```
src/components/
├── game-library/
│   ├── GameLibrary.tsx       # główny komponent sekcji (entry point feature)
│   ├── ui/                   # komponenty React — prezentacja
│   ├── lib/                  # czysta logika, typy, formatowanie, utils
│   └── hooks/                # hooki React specyficzne dla feature
└── settings/
    ├── Settings.tsx
    ├── ui/
    ├── hooks/
    ├── context/              # React context (gdy potrzebny)
    └── lib/
```

### Zasady warstw

| Katalog | Co trafia | Czego unikać |
|---------|-----------|--------------|
| `ui/` | Komponenty JSX, layout, interakcje użytkownika | Bezpośrednie wywołania IPC, ciężka logika biznesowa |
| `lib/` | Funkcje czyste, typy, sortowanie, filtrowanie, normalizacja | Importów React / hooków |
| `hooks/` | Stan i efekty wielokrotnego użytku w feature | Logiki niezwiązanej z React |
| `context/` | Provider + hook kontekstu | Logiki domenowej poza udostępnianiem stanu |

Nowe feature'y dodawaj w tym samym schemacie (`FeatureName.tsx` + `ui/`, `lib/`, opcjonalnie `hooks/`, `context/`).

## Konwencje nazw plików

Spójne nazewnictwo ułatwia nawigację i importy. Zasady poniżej — nowe pliki muszą je spełniać.

### Katalogi

| Obszar | Konwencja | Przykład |
|--------|-----------|----------|
| Feature'y w `src/components/` | kebab-case | `game-library/`, `settings/` |
| Podkatalogi warstw | małe litery, krótkie rzeczowniki | `ui/`, `lib/`, `hooks/`, `context/` |
| Moduły Electron / shared | kebab-case lub płaskie nazwy domenowe | `electron/scanners/steam/`, `shared/types/` |

### Pliki źródłowe

| Typ pliku | Konwencja | Przykład |
|-----------|-----------|----------|
| Komponent React (`.tsx`) | **PascalCase** = nazwa domyślnego eksportu | `GameGridView.tsx`, `RecommendationCard.tsx` |
| Entry point feature | **PascalCase** | `GameLibrary.tsx`, `Settings.tsx` |
| Hook React | **camelCase**, prefiks `use` | `usePsnSettings.ts` |
| Context React | **PascalCase**, sufiks `Context` | `SettingsContext.tsx` |
| Moduł logiki (`lib/`, utils, pure TS) | **camelCase** | `virtualScroll.ts`, `titleNormalization.ts` |
| Typy współdzielone (`shared/types/`) | **camelCase**, rzeczownik w liczbie pojedynczej | `game.ts`, `recommendations.ts` |
| Barrel / entry point | `index.ts` | `electron/scanners/index.ts` |
| Moduł jednosłowny (skanery, IPC) | **małe litery** — skrót lub krótki rzeczownik domenowy | `acf.ts`, `vdf.ts`, `api.ts`, `prompt.ts` |
| Moduł wielowyrazowy (Electron, `lib/`) | **camelCase** | `librarySnapshot.ts`, `tokenEstimate.ts` |
| Deklaracje ambient (`.d.ts`) | nazwa pakietu lub modułu | `vite-env.d.ts`, `electron-env.d.ts` |

**Zasada ogólna:** jeśli plik eksportuje komponent React — PascalCase; jeśli eksportuje funkcje/typy — camelCase (lub jedno słowo małymi literami, gdy to ugruntowany skrót w danym folderze).

### Testy

| Typ | Konwencja | Przykład |
|-----|-----------|----------|
| Test komponentu React | **PascalCase** + `.test.tsx` (jak komponent) | `GameLibrary.test.tsx`, `Settings.test.tsx` |
| Test modułu TS (unit) | **camelCase** + `.test.ts` (jak plik źródłowy lub `{obszar}{Moduł}`) | `virtualScroll.test.ts`, `recommendationsAi.test.ts` |
| E2E (Playwright) | **kebab-case** + `.spec.ts` | `library-sort.spec.ts`, `play-status-filter.spec.ts` |
| Setup / helpers testów | **camelCase** | `setup.ts`, `fixtures.ts` |
| Fixture'y danych | **camelCase** | `games.ts`, `psnPlayed.ts`, `buildFixture.ts` |

Testy komponentów: nazwa pliku = nazwa komponentu + `.test.tsx`.  
Testy modułów bez odpowiednika komponentu: camelCase opisujący testowany moduł (np. `libraryStore.test.ts` dla `electron/main/library/store.ts`).

**Nie mieszaj** kebab-case i PascalCase w `test/` (poza `test/e2e/`, gdzie kebab-case jest standardem Playwright). Testy unitowe grupuj w `test/components/` i `test/electron/` zgodnie ze strukturą źródeł — nie wrzucaj nowych plików płasko do `test/`.

### Importy

- `App.tsx` importuje entry pointy: `@src/components/game-library/GameLibrary`, `@src/components/settings/Settings`
- Komponenty `ui/` importują logikę z `../lib/` i hooki z `../hooks/`
- Nie wracaj do płaskiej struktury (`components/GameLibrary.tsx` obok `components/game-library/`)

## `game-library/lib/` — moduły logiki

Logika biblioteki gier jest podzielona na małe pliki (nie jeden duży `format.ts`):

| Plik | Odpowiedzialność |
|------|------------------|
| `types.ts` | `GroupedGame`, `PlayStatusFilter` |
| `labels.ts` | `PLATFORM_LABELS` |
| `titleNormalization.ts` | Normalizacja tytułów (apostrofy, znaki towarowe, dopasowanie duplikatów) |
| `playtime.ts` | `formatPlaytime`, `isGamePlayed` |
| `grouping.ts` | Grupowanie po tytule, helpery `GroupedGame` |
| `sort.ts` | Sortowanie list i grup |
| `filters.ts` | Filtry platform i statusu gry |
| `virtualScroll.ts` | Obliczenia wirtualnego scrolla |
| `format.ts` | **Barrel** — re-eksportuje powyższe (kompatybilność importów w testach) |

Przy rozbudowie dodawaj nową logikę do właściwego modułu, nie do barrelu. Barrel tylko re-eksportuje.

## Filtry biblioteki gier

### Platforma

- Pusty wybór = wszystkie platformy
- Wielokrotny wybór = suma gier z wybranych platform (przed grupowaniem)

### Status gry (Played / Not played)

- **Played:** `playtimeMinutes > 0`
- **Not played:** brak czasu lub `playtimeMinutes === 0`
- Dla **zgrupowanych tytułów** (ta sama gra na wielu platformach): suma `playtimeMinutes` ze wszystkich wpisów; jeśli suma > 0 → Played

Filtry platformy i statusu **łączą się** (AND). Pusty komunikat: „No games match the current filters”.

## Testy

### Struktura `test/`

```
test/
├── setup.ts              # Vitest setup (jsdom mocks, ipcRenderer stub)
├── smoke/                # Smoke / sanity checks
├── fixtures/             # Dane testowe (gry, VDF, GOG DB, PSN)
├── helpers/              # Współdzielone helpery (IPC mocks, ścieżki fixture)
├── components/           # Testy UI — lustrzane odbicie `src/components/`
│   ├── game-library/
│   ├── recommendations/
│   └── settings/
├── electron/             # Testy main process — lustrzane odbicie `electron/`
│   ├── ipc/
│   ├── library/
│   ├── lib/
│   ├── settings/
│   ├── scanners/         # steam/, gog/, psn/, …
│   ├── metadata/
│   └── recommendations/
└── e2e/                  # Playwright (kebab-case `*.spec.ts`)
```

Aliasy importów w testach: `@test/fixtures/...`, `@test/helpers/...`, `@electron/...` (oraz `@src/`, `@shared/`).

### Unit (`test/` poza `e2e/`)

- Pliki testowe: komponenty → `PascalCase.test.tsx`, moduły → `camelCase.test.ts` (patrz sekcja „Konwencje nazw plików”)
- Importy z `game-library`: preferuj `@src/components/game-library/lib/format` lub konkretny moduł z `lib/`
- Importy komponentów UI: `@src/components/game-library/ui/...`
- Importy settings: `@src/components/settings/lib/...`, `@src/components/settings/Settings`
- Fixture'y i ścieżki dyskowe: `@test/fixtures/...`, `fixturePath()` / `testTmpDir()` z `@test/helpers/paths`

### E2E (`test/e2e/`)

- Tekst **„Not played”** występuje zarówno na przycisku filtra, jak i przy czasie gry — asercje ograniczaj do kontenera:
  - `page.getByTestId('game-library-grid').getByText('Not played')`
  - `page.getByTestId('game-library-list').getByText('Not played')`
- Dla przycisku filtra używaj `getByRole('button', { name: 'Played', exact: true })` (unikaj kolizji z etykietą „Not played”)

## Zasady ogólne przy zmianach

1. **Minimalny zakres** — zmieniaj tylko to, co wynika z zadania; nie refaktoruj „przy okazji”
2. **Konwencje projektu** — dopasuj styl, nazewnictwo i strukturę do istniejącego kodu w feature
3. **Sekrety** (`npsso`, Steam API key) tylko w main process — nigdy w rendererze ani w commitach
4. **Skanery** w `electron/scanners/` — jeden moduł per platforma; zwracaj `errors[]` zamiast rzucać wyjątki
5. **Testy** — dodawaj tylko gdy mają sensowne pokrycie; po zmianach w UI/filtrach uruchom `npm test` i `npm run test:e2e`

## Powiązane pliki

- `docs/ARCHITECTURE.md` — architektura i źródła danych platform
- `.cursor/rules/project-context.mdc` — kontekst projektu (always apply)
- `.cursor/rules/electron-scanners.mdc` — konwencje skanerów i IPC
