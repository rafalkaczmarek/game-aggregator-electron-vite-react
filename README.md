# Game Aggregator

Desktopowa aplikacja agregująca gry z **Steam**, **GOG Galaxy**, **Epic Games** i **PSN** w jednej liście.

Stack: **Electron + Vite + React + TypeScript + Tailwind CSS**.

> Bazuje na [electron-vite-react](https://github.com/electron-vite/electron-vite-react).

## Dokumentacja

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — decyzje architektoniczne, źródła danych per platforma, plan MVP
- Reguły Cursor w `.cursor/rules/` — kontekst dla AI w tym repozytorium

## Szybki start

```sh
cd game-aggregator-electron-vite-react
pnpm install
pnpm dev
```

## Struktura (rozszerzona)

```tree
├── docs/                 Dokumentacja projektu
├── shared/types/         Typy współdzielone (main + renderer)
├── electron/
│   ├── main/
│   │   └── ipc/          Handlery IPC
│   └── scanners/         Skanery per platforma
├── src/                  React UI
└── test/
```

## IPC — skanowanie biblioteki

Renderer wywołuje `window.gameApi`:

```typescript
const library = await window.gameApi.scanAll()
const steam = await window.gameApi.scanPlatform('steam')
```

## Plan implementacji

1. **Steam** — VDF + `steamapps/*.acf` (pierwszy pełny skaner)
2. **PSN** — `psn-api` + PSN ID (profil publiczny)
3. **GOG** — SQLite GOG Galaxy
4. **Epic** — manifesty launchera

## Skrypty

- `pnpm dev` — development
- `pnpm build` — build + electron-builder
- `pnpm test` — Vitest
- `pnpm test:e2e` — Playwright
- `pnpm typecheck` — TypeScript

## Wymagania

Node.js >= 20.19.0 || >= 22.12.0
