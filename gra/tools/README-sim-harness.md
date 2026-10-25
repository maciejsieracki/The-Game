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
  ustawia `Math.random` na mulberry32(seed) i woła `doStartGame` (ta sama
  ścieżka co kreator „Nowa Gra"). `aiCount` przechodzi jako `civTypesCount = aiCount + 1`
  (ZAŁOŻENIE: suwak cywilizacji liczy także gracza, por. `aiCivSelectionCap = count-1`
  w `src/ui/aiCivPicker.ts`). Miasta-państwa to osobne kopie klastra: mapa ma
  `civTypes × (1 + cityStates)` miast startowych, więc liczba właścicieli miast NIE jest
  liczbą cywilizacji. Następnie „klika" startowy heks gracza (`tryFoundPlayerCityAt`),
  bo bez stolicy bramka `awaitingFirstPlayerCity` blokuje koniec tury.
  Trudność: `easy|normal|hard` albo etykiety `Łatwy|Normalny|Trudny`.
- `runTurns(n, {autoResolveBattles=true, playerPolicy='pass'|'accept-all-offers'|'reject-all-offers', turnTimeoutMs=60000})`
  — dla każdej tury: wg polityki rozstrzyga oferty AI→gracz (`resolvePendingDiplomacy`),
  klika „Auto" w realnym oknie pre-bitwy (`.pb-btn[data-act="auto"]`) aż kolejka bitew jest
  pusta, kończy turę (`advanceSeat`) i czeka na przyrost tury. Zwraca tablicę
  `{turn, ms, wars, deals, offers, battlesAuto, hash, offerIds}` (`offerIds` = id ofert
  widocznych w turze; metryka `offers` w sim-metrics liczy UNIKALNE id, nie sumę kolejki). Przy niedokończeniu tury wpis
  dostaje `hash` z prefiksem `TIMEOUT:` i pętla się kończy.
- `snapshot()` — `{turn, wars: [[a,b]...], warCount, deals, trust: {"a-b": zaufanie},
  cities, owners, units, offers: [{id, ownerId, cmdType, reason, goldOnce}], hash}`.
- `setFlag(name, value)` — nadpisanie flagi przez jej settera `setXOverride`.
  Dostępne nazwy: `warRulesMultiwar` (`setWarRulesMultiwarOverride`), `warAllInCapital`
  (`setWarAllInCapitalOverride`), `diploTickWarBrake` (`setDiploTickWarBrakeOverride`),
  `diploSensibleDeals` (`setDiploSensibleDealsEnabled`; `null` = ON). Nieznana nazwa rzuca błąd.
  Wartości domyślne produkcji: wszystkie cztery flagi ON.
- Per tura `runTurns` zwraca dodatkowo `trust` (Zaufanie par "a-b"), `offerDetail`
  (id, ownerId, cmdType, reason, goldOnce) i `endBlocked` (true = TIMEOUT końca tury).
  R-WEB-MEASURE-ROBOCZA-Q1: `runTurns` najpierw wykonuje realną próbę końca tury; gdy bramka
  (`dealsEndTurnGate`) ją odrzuci przy wiszącej ofercie handlowej AI->gracz (`negotiationTable`,
  `isAiTradeOfferAwaitingPlayer`), oferta jest rozpatrywana wg polityki (`pass`/`reject-all-offers`
  = odrzuć, `accept-all-offers` = akceptuj przez `handleNegotiationAccept/Reject`) i koniec tury
  jest ponawiany. Per tura: `blockedByOffer`, `resolvedOnBlock`, `releasedAfterResolve`,
  `tradeOffers` (id, typ, `reason`, `goldOnce`, `bilansPW`), `eras`, `crisis`, `tStart/tEnd`.
  Bilans PW oferty = `aiProposalPlayerBenefitSurplus` (odczyt, bez zmiany logiki). Legacy
  `pendingDiplomacyInbox` obsługiwane jak wcześniej. Flaga `dealsEndTurnGate` (bramka) NIE
  jest przełączana przez `setFlag` (ustawiana przy starcie gry, domyślnie ON).
  `sim-metrics.cjs --json` wypisuje blok `summary.diplo` (wojny per tura, rozkład Zaufania,
  oferty z `reason`, tury zablokowane). Gracz = id 0 (ZAŁOŻENIE).

### Skrót stanu (`hash`)

FNV-1a 32-bit po stabilnym JSON (klucze posortowane) z: tura, miasta (właściciel, q, r,
populacja), jednostki (właściciel, typ, q, r, HP `u.hp`, -1 = pełne), relacje par major (status, zaufanie),
liczba umów, oferty (właściciel, typ, powód, goldOnce). **Pomija wszystkie identyfikatory**
(`id` jednostek i `id` ofert nie wchodzą do hasha), bo identyfikatory jednostek zawierają
`Math.random`/`Date.now`. Barbarzyńcy są wykluczeni.

## Determinizm — źródła niedeterminizmu

### Wynik badania (R2) -- NIE_DETERMINISTYCZNE, przyczyna częściowo zidentyfikowana

Zmierzone (komendy: `tools/lib/game-sim-harness.cjs`, dwa świeże strony, seed 101,
5 AI, 2 miasta-państwa, 12 tur; hash po każdej turze):

- Start (`eeca0aa5`) i tura 1 są identyczne w obu przebiegach.
- Wariant BEZ podziału RNG: tury 2 i 3 identyczne (`a5ab770c`, `b86973e1`), tura 4
  rozjeżdża się (`3948f099` vs `1e9212ab`).
- Wariant Z PODZIAŁEM RNG (rAF -> strumień renderu): tura 2 już się rozjeżdża
  (`a5ab770c` vs `a2527a00`). Podział został usunięty z kodu, bo nie pomaga (i wygląda
  na gorszy): oznacza to, że część logiki gry wykonuje się wewnątrz klatek rAF, a więc
  jej draws nie są oddzielone od renderu.

Potwierdzone źródło (kod, nie hipoteza): three.js 0.169.0
`MathUtils.generateUUID` (`node_modules/three/src/math/MathUtils.js:10-19`) wywołuje
`Math.random()` 4 razy na każdy UUID. UUID tworzą konstruktory obiektów three.js
(geometrie, materiały, obiekty), więc każde tworzenie obiektu w renderze konsumuje
globalny strumień `Math.random`, którego używa też logika gry. Liczba tych obiektów
zależy od czasu klatek. To jest mechanizm rozjazdu, ale nie jedyny: samo odizolowanie
strumienia nie wystarczyło, więc drugim kandydatem jest czasowe sterowanie hakiem
(`Auto` pre-bitwy klikane w pętli 30 ms, progi `healStaleEndTurnBlockers` i
`oldestPendingAutoPreBattleAgeMs` oparte o czas ścienny). NIE_ZMIERZONO: który z nich
dominuje.

Wniosek dla tematów zależnych: hash z tego haka NIE nadaje się do porównań OFF=baza
ani do determinizmu seed-to-seed, dopóki nie zostanie usunięte źródło z logiki gry
(poza allowlistą tego tematu) albo nie zostanie zrobiony hak sterujący czasem.

### Inne źródła (zbadane w `gra/src/`)

- `Math.random` — 14 wystąpień w `main.ts`, 25 w `gra/src/game/*.ts`. Najważniejsze dla stanu:
  `pickVillageReward(Math.random())` (nagrody z wiosek), losowanie w generatorze mapy,
  AI, walka, barbarzyńcy.
- `Date.now()` — w `armyMerge.ts` (identyfikator `sg…`), `cities.ts` (`budowa-lista-…`),
  `save.ts` (nazwy zapisów). Dotyczą identyfikatorów, nie decyzji; hash je pomija.
  Nieprzebadane (NIE_ZMIERZONO): progi czasowe w `healStaleEndTurnBlockers` oraz
  `oldestPendingAutoPreBattleAgeMs` (zależność od czasu ściennego). Jeśli determinizm
  nie domknie się po podziale RNG, to jest pierwsza hipoteza do sprawdzenia.
- Generacja mapy w Web Workerze (`generujSwiatAsync`) zależy od seeda, nie od czasu.

## Ograniczenia

- Podział metryk „wojny per epoka" nie jest wykonany: skrypt raportuje maksimum wojen
  w przebiegu; podział na epoki wymagałby odczytu epoki gracza per tura (poza zakresem).
- Bilans ofert AI→gracz: od R-WEB-MEASURE-ROBOCZA-Q1 odczytywany jako `bilansPW`
  (`aiProposalPlayerBenefitSurplus`) dla wpisów stołu negocjacji. Zdarzenia wojen AI-AI nie mają
  agresora w stanie gry (NIE_ZMIERZONO); wojny AI->gracz i wymuszone wojny epoki -- z linii konsoli.
- Blokada końca tury z przyczyną innej niż oferta handlowa (np. stan `endTurnInProgress`) jest
  widoczna tylko jako `endBlockedTurns` i linie `endTurnLines` w JSON.
- `playerPassive` jest zapisywane w opcjach, ale gracz i tak nie wykonuje akcji poza
  zamknięciem tury (założenie: brak akcji = pasywność).
- Czas tury zależy od obciążenia maszyny; pomiary równoległe z innymi procesami są
  zawyżone.
- `playerPassive` jest zapisywane, ale NIE egzekwowane: hak nie blokuje akcji gracza,
  bo hak tylko kończy tury i rozstrzyga bitwy/oferty (NIE_ZMIERZONO w osobnym teście).
- Hash obejmuje miasta (właściciel, q, r, pop), jednostki (właściciel, typ, q, r, HP),
  relacje, liczbę umów i oferty. NIE obejmuje złota, technologii, budynków ani wartości
  Respektu. Test „OFF = baza" w tematach zależnych musi porównywać także te pola.
- Metryki „wojny przed T40" i „max wojen" bez podziału na epoki (patrz wyżej).
