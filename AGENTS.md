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

### Unit (`test/`)

- Importy z `game-library`: preferuj `@src/components/game-library/lib/format` lub konkretny moduł z `lib/`
- Importy komponentów UI: `@src/components/game-library/ui/...`
- Importy settings: `@src/components/settings/lib/...`, `@src/components/settings/Settings`

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
