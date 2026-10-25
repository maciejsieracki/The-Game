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
  Dostępne WYŁĄCZNIE settery istniejące na tej gałęzi: `warRulesMultiwar`
  (`setWarRulesMultiwarOverride`), `warAllInCapital` (`setWarAllInCapitalOverride`).
  Settery dyplomacji (tick AI↔AI, hamulec wojny, wygładzanie Respektu) NIE istnieją w
  `gra/src` na tej gałęzi; ich dodanie należy do tematów zależnych (poza allowlistą tego
  tematu). Nieznana nazwa rzuca błąd.

### Skrót stanu (`hash`)

FNV-1a 32-bit po stabilnym JSON (klucze posortowane) z: tura, miasta (właściciel, q, r,
populacja), jednostki (właściciel, typ, q, r, HP `u.hp`, -1 = pełne), relacje par major (status, zaufanie),
liczba umów, oferty (właściciel, typ, powód, goldOnce). **Pomija wszystkie identyfikatory**
(`id` jednostek i `id` ofert nie wchodzą do hasha), bo identyfikatory jednostek zawierają
`Math.random`/`Date.now`. Barbarzyńcy są wykluczeni.

## Determinizm — źródła niedeterminizmu

### R-WEB-TEST-HOOK-DETERMINISM-Q1 (runda 1) -- BLOCK, kryterium (c) NIESPEŁNIONE

Zmierzone (Chromium headless, seed 101, 5 AI, 2 miasta-państwa; hash po każdej turze):

- Źródło 1 (POTWIERDZONE pomiarem): 252 391 wywołań `Math.random` w 12 turach, prawie
  wszystkie z generatora UUID three.js (`MathUtils.generateUUID`, w zminifikowanym buildzie
  wołany z konstruktorów obiektów three.js). Usunięte przez licznik UUID pod hakiem.
- Źródło 2 (POTWIERDZONE w kodzie, małe liczebnie): `Date.now` wołany 87 razy w 12 turach
  (`endTurnStartedAt` i `oldestPendingAutoPreBattleAgeMs`, progi 8000 ms). Zastąpione zegarem
  zależnym od numeru tury (1 ms na turę) pod hakiem.
- Źródło 3 (POTWIERDZONE): potok końca tury oddaje sterowanie przez rAF + `setTimeout`
  (`yieldTurnTransitionUi`), więc czas klatek wchodzi w logikę. Pod hakiem timery i rAF
  działają na zegarze wirtualnym, który przesuwa się tylko na żądanie haka (`drive`).
- Wynik pomiaru przed zegarem wirtualnym (tylko UUID + Date): tura 2 rozjeżdża się
  między przebiegami; różnica = jedna jednostka `Zwiadowca` (owner 13) w jednym przebiegu.
- Wyłączenie AudioContext nie usunęło rozjazdu (audio NIE jest jedynym źródłem).
- Zegar wirtualny: w pojedynczej stronie 3 tury z rzędu identyczne w dwóch przebiegach
  (`a5ab770c`, `e4f59a04`, `d70ada09`), ale przy dwóch stronach równolegle rozjazd wraca
  (seed 101 tura 2, seed 102 już tura 1). NIE_ZMIERZONO, która natywna asynchroniczność
  (ładowanie zasobów, obserwatory, worker/audio) jest przyczyną.
- Koszt: po zakończeniu generacji mapy klatki wirtualne idą z prędkością ~4-60 fps,
  więc pełne 60 tur × 2 przebiegi × 2 seedy nie mieści się w jednej rundzie.

Stan kodu: `gra/src/game/test-hook.ts` (zegar wirtualny, licznik UUID, zegar tury),
`gra/tools/lib/game-sim-harness.cjs` (czekanie na hak i świat odpytywane z Node, nie
przez `waitForFunction`), `gra/tools/test-hook-determinism-test.cjs` (test kryterium c;
aktualnie FAIL). Bez `?testhook=1` zachowanie gry nie zmienione (guard 23/23 PASS).

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
- „Bilans” ofert AI→gracz z `diplomacy-ai-offer-balance.ts` nie jest odczytywany —
  skrypt liczy oferty z `goldOnce < 0` (NIE_ZMIERZONO pełny bilans).
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
