# Harness symulacji headless (`?testhook=1`) — R-WEB-TEST-HOOK-HEADLESS-GAME-Q1

Narzędzie do MIERZENIA prawdziwej gry (Chromium/Playwright) bez ręcznej obsługi bitew:
wiele tur z N AI, seedem i poziomem trudności. Hak testowy istnieje WYŁĄCZNIE przy
parametrze URL `?testhook=1`. Bez niego `window.__test` nie powstaje, a `Math.random`
pozostaje natywny (test: `tools/test-hook-guard-test.cjs`).

## Pliki

| Plik | Rola |
|---|---|
| `gra/src/game/test-hook.ts` | Hak `window.__test` (bramka `?testhook=1`, reseed RNG, pętla tur, snapshot, hash). |
| `gra/src/main.ts` (blok `installTestHook({...})`) | Domknięcia wołające REALNE funkcje gry: `doStartGame`, `advanceSeat`, `tryFoundPlayerCityAt`, przycisk „Auto" pre-bitwy, `resolvePendingDiplomacy`. |
| `gra/tools/lib/game-sim-harness.cjs` | Harness Playwright: build bundla do katalogu tymczasowego, otwarcie strony, start gry, przebieg tur. |
| `gra/tools/sim-metrics.cjs` | Przykładowy skrypt: tabela metryk per seed. |
| `gra/tools/test-hook-guard-test.cjs` | Test strażnika (kryteria a, d) + testy czystych funkcji. |

## Użycie (z katalogu `gra/`)

```bash
node tools/sim-metrics.cjs --seeds 101,102 --turns 60 --ai 5 [--cs 2] \
  [--difficulty normal|easy|hard] [--era kamien|braz|zelazo] \
  [--policy pass|accept-all-offers|reject-all-offers] \
  [--flag warRulesMultiwar=true] [--flag warAllInCapital=false] \
  [--no-auto-battles] [--json]

node tools/test-hook-guard-test.cjs
```

Wymagania: `node_modules` w `gra/` (Vite, Playwright, esbuild) oraz przeglądarka
Chromium (domyślna Playwright albo `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).
Bundle budowany jest przez `vite.js build --outDir <os.tmpdir()>/civ-dist-simharness-*`
i kasowany po zakończeniu. Repo nie jest modyfikowane (zero `npm run build|dev`).

## API `window.__test` (tylko z `?testhook=1`)

- `startGame({seed, aiCount (4–6), cityStates, difficulty, era, playerPassive})` —
  ustawia `Math.random` na mulberry32(seed) i woła `doStartGame` (ta sama ścieżka co
  kreator „Nowa Gra"). Następnie „klika" startowy heks gracza (`tryFoundPlayerCityAt`),
  bo bez stolicy bramka `awaitingFirstPlayerCity` blokuje koniec tury.
  Trudność: `easy|normal|hard` albo etykiety `Łatwy|Normalny|Trudny`.
- `runTurns(n, {autoResolveBattles=true, playerPolicy='pass'|'accept-all-offers'|'reject-all-offers', turnTimeoutMs=60000})`
  — dla każdej tury: wg polityki rozstrzyga oferty AI→gracz (`resolvePendingDiplomacy`),
  klika „Auto" w realnym oknie pre-bitwy (`.pb-btn[data-act="auto"]`) aż kolejka bitew jest
  pusta, kończy turę (`advanceSeat`) i czeka na przyrost tury. Zwraca tablicę
  `{turn, ms, wars, deals, offers, battlesAuto, hash}`. Przy niedokończeniu tury wpis
  dostaje `hash` z prefiksem `TIMEOUT:` i pętla się kończy.
- `snapshot()` — `{turn, wars: [[a,b]...], warCount, deals, trust: {"a-b": zaufanie},
  cities, owners, units, offers: [{id, ownerId, cmdType, reason, goldOnce}], hash}`.
- `setFlag(name, value)` — nadpisanie flagi przez jej settera `setXOverride`.
  Dostępne: `warRulesMultiwar`, `warAllInCapital`. Nieznana nazwa rzuca błąd.

### Skrót stanu (`hash`)

FNV-1a 32-bit po stabilnym JSON (klucze posortowane) z: tura, miasta (właściciel, q, r,
populacja), jednostki (właściciel, typ, q, r), relacje par major (status, zaufanie),
liczba umów, oferty (właściciel, typ, powód, goldOnce). **Pomija wszystkie identyfikatory**
(`id` jednostek i `id` ofert nie wchodzą do hasha), bo identyfikatory jednostek zawierają
`Math.random`/`Date.now`. Barbarzyńcy są wykluczeni.

## Determinizm — źródła niedeterminizmu

Zbadane w `gra/src/`:

- `Math.random` — 14 wystąpień w `main.ts`, 25 w `gra/src/game/*.ts`. Najważniejsze dla stanu:
  `pickVillageReward(Math.random())` (nagrody z wiosek), losowanie w generatorze mapy.
  **Pod hakiem** `startGame` reseeduje `Math.random` (mulberry32), więc sekwencja jest
  powtarzalna dla tego samego seeda i tej samej kolejności wywołań.
- `Date.now()` — w `armyMerge.ts` (identyfikator `sg…`), `cities.ts` (`budowa-lista-…`),
  `save.ts` (nazwy zapisów). Dotyczą identyfikatorów, nie decyzji; hash je pomija.
  Do potwierdzenia NIE_ZMIERZONO: czy któryś identyfikator nie wpływa na kolejność
  iteracji (`Map`/`sort` po id).
- Kolejność asynchroniczna: generacja mapy w Web Workerze (`generujSwiatAsync`) — wynik
  zależy od seeda, nie od czasu; czas ścienny nie wchodzi do hasha.

Dowód determinizmu (kryterium c): patrz sekcja „Wyniki" w raporcie Operatora
(dwa przebiegi `--seeds 101 --turns 5` i porównanie hashy per tura).

## Ograniczenia

- Podział metryk „wojny per epoka" nie jest wykonany: skrypt raportuje maksimum wojen
  w przebiegu; podział na epoki wymagałby odczytu epoki gracza per tura (poza zakresem).
- „Bilans” ofert AI→gracz z `diplomacy-ai-offer-balance.ts` nie jest odczytywany —
  skrypt liczy oferty z `goldOnce < 0` (NIE_ZMIERZONO pełny bilans).
- `playerPassive` jest zapisywane w opcjach, ale gracz i tak nie wykonuje akcji poza
  zamknięciem tury (założenie: brak akcji = pasywność).
- Czas tury zależy od obciążenia maszyny; pomiary równoległe z innymi procesami są
  zawyżone.
