# Architektura — Game Aggregator

Dokumentacja decyzji z planowania projektu (Electron + Vite + React).

## Cel

Jedna aplikacja desktopowa wyświetlająca gry z:

- Steam
- GOG Galaxy
- Epic Games
- PlayStation Network (PSN)

## Dlaczego Electron (a nie Tauri)

| Kryterium | Electron | Tauri |
|-----------|----------|-------|
| Czas do MVP | Krótszy | Dłuższy (Rust) |
| Integracje npm (`psn-api`, VDF) | Natywne w main | Port do Rust |
| RAM / rozmiar | Większy | Mniejszy |
| Jeden język (TS) | Tak | TS + Rust |

**Decyzja:** Electron na start; Tauri rozważyć, jeśli RAM/tray stanie się problemem po działającym MVP.

## Źródła danych per platforma

### Steam

- **Zainstalowane:** `steamapps/*.acf`
- **Biblioteka:** `userdata/<steamid>/config/`, `libraryfolders.vdf`
- **Metadane:** Steam Web API (`GetOwnedGames`) + Steam API key
- **Trudność:** niska

### GOG Galaxy

- **Lokalnie:** SQLite w `%ProgramData%\GOG.com\Galaxy\storage\`
- **Trudność:** średnia (nieudokumentowany schemat)

### Epic Games

- **Zainstalowane:** `%PROGRAMDATA%\Epic\EpicGamesLauncher\Data\Manifests\`
- **Pełna biblioteka:** często niepełna lokalnie; może wymagać API konta
- **Trudność:** średnia–wysoka

### PSN

- **Nie ma danych na dysku PC** — tylko chmura
- **Publiczny profil:** PSN ID (Online ID) → Account ID → lista gier
- **Biblioteka:** [`psn-api`](https://github.com/achievements-app/psn-api) (nieoficjalne API Sony)
- **Autoryzacja:** token `npsso` (ciasteczko z playstation.com); wiele endpointów go wymaga nawet dla publicznych profili
- **Trudność:** średnia (kruche API, ToS)

## Architektura procesów

```
┌─────────────────────────────────────┐
│  Renderer (React)                   │
│  — lista gier, filtry, ustawienia   │
└──────────────┬──────────────────────┘
               │ IPC (gameApi)
┌──────────────▼──────────────────────┐
│  Main process (Node.js)             │
│  ├─ scanners/steam.ts               │
│  ├─ scanners/gog.ts                 │
│  ├─ scanners/epic.ts                │
│  ├─ scanners/psn.ts                 │
│  └─ scanners/index.ts → scanAll()   │
└─────────────────────────────────────┘
```

## Wspólny model danych

```typescript
interface Game {
  id: string              // unikalny w obrębie platformy
  platform: GamePlatform
  title: string
  coverUrl?: string
  playtimeMinutes?: number
  installed: boolean
  sourceId?: string       // np. steam appid, PSN titleId
}
```

## Plan implementacji

### Faza 1 — Szkielet (obecna)

- [x] Projekt Electron + Vite + React
- [x] Typy współdzielone, IPC, puste skanery
- [ ] UI: lista gier + przycisk „Skanuj”

### Faza 2 — Steam

- Auto-wykrywanie ścieżki Steam (Windows)
- Parser VDF + `.acf`
- Opcjonalnie Steam Web API dla okładek i czasu gry

### Faza 3 — PSN

- Konfiguracja `npsso` w ustawieniach (main process)
- Pole PSN ID → `getProfileFromUserName` → `getUserTitles`

### Faza 4 — GOG + Epic

- GOG: odczyt SQLite Galaxy
- Epic: manifesty + ewentualne uzupełnienie API

### Faza 5 — UX

- Filtry per platforma, wyszukiwarka
- Tray, sync w tle
- Uruchamianie gier (`steam://`, exe)

## Bezpieczeństwo

- `contextIsolation: true`, brak `nodeIntegration` w głównym oknie
- Tokeny tylko w main process
- `preload` eksponuje wąskie API (`gameApi`), nie cały `ipcRenderer` (docelowo)

## Ryzyka

- Launchery zmieniają format plików → parsery wymagają aktualizacji
- PSN API nieoficjalne → może przestać działać
- Epic/PSN — ograniczenia regulaminów platform
