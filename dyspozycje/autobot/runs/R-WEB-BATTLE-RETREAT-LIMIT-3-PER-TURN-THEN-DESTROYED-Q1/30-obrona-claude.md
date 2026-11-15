# R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1 — raport Obrony (Operator HAIKU), odpowiedź na zarzuty Evaluatora r1

STATUS: PASS-WITH-NOTES (Obrona). Zarzuty 1–8 rozstrzygnięte: 4 PRZYJĘTE w pełni lub częściowo z dowodem, 1 ODRZUCONY z dowodem (remis), 3 pozostają NIE ZMIERZONO/NIE WYKONANO (wymienione niżej). Ostateczny werdykt należy do Final Control.
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1
GOAL: armia może wykonać do TRZECH odwrotów w jednej turze; po wyczerpaniu kolejna przegrana bitwa w tej turze = unicestwienie armii; licznik zeruje się w następnej turze; dotyczy gracza i AI (parytet).
BAZA: 97be63d56 (kandydat r1, rodzic 50f607fe3). Worktree przełączony na 97be63d56, potem commit rundy 2.
KOD RUNDY 2: `5a971c1e6ca8cd5e1f78932130b3e1d1f6f97805` (gałąź worktree, odłączona od main).

## ODPOWIEDZI NA ZARZUTY EVALUATORA

### Zarzut 1 — brak realnej weryfikacji w Chromium — PRZYJĘTY CZĘŚCIOWO
- Dodano `gra/tools/battle-retreat-limit-browser-test.cjs` + `battle-retreat-limit-browser-entry.{ts,html}` (kopia entry z R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1, parametr `?retreat=N`). Prawdziwa bitwa 3D (BattleScene, Skip) + prawdziwy `applyPostBattleMap` + prawdziwy helper `battle-retreat-limit.ts`.
- Wynik (surowe wyjście, `BROWSER PASS`): licznik 0 i 2 → przegrani (atakujący) zostają na mapie (17 jednostek, odwrót 2 heksy), `defAnnihilated=false`, `atkAnnihilated=false`; licznik 3 → `atkOnMap=0`, `loserOnMap=0`, `atkAnnihilated=true`.
- NIE ZMIERZONO w Chromium: przycisk „Wycofaj” wyszarzony z powodem (preBattle.ts), komunikat `showHintMessage` po unicestwieniu (main.ts) i zrzuty ekranu. Entry nie uruchamia `main.ts` ani UI bitwy. Punkt (4) dispatchu jest więc spełniony tylko częściowo; zgodnie z dispatchem to nadal FAIL przy FC, chyba że orkiestrator uzna tę weryfikację za wystarczającą.
- Stary `battle-defeat-survivor-retreat-browser-test.cjs` (regresja odwrotu 2-hex): `BROWSER PASS`.

### Zarzut 2 — odwrót przegranego ATAKUJĄCEGO nie liczony i bez unicestwienia — PRZYJĘTY
- `post-battle-map.ts`, gałąź `winner === 'obronca'`: gdy `!cityBattle && input.atkRetreatBudgetExhausted === true` → przegrani atakujący (żywi z atkRoster) usuwani, flaga `attackerAnnihilatedByRetreatLimit = true`. W przeciwnym razie `retreatAtkRosterToStart` + `recordRetreatOnRoster(survivorsLeft)` (licznik +1 na rosterze atakującego) gdy są żywi ocaleli i nie ma miasta.
- `main.ts` (wywołanie `applyPostBattleMap`): `atkRetreatBudgetExhausted: !cityOnHex && retreatBudgetExhausted(atkRoster)`.
- Testy: 2g (lustro: atakujący po wyczerpaniu ginie, flagi poprawne, a0 w removedIds), 2h (budżet 0: ocalały atakującego zostaje, licznik 0→1). Chromium: przypadki retreat=2 i retreat=3 powyżej.

### Zarzut 3 — remis (`retreatDefendersOnTie`) nie liczy odwrotu — ODRZUCONY (dowód)
- `post-battle-map.ts` ~446–455: `retreatDefendersOnTie` wywołuje `placeFanOutGroup(input, defAlive, lead, dir, !!input.cityOnBattleHex)` — BEZ parametru `twoHex`, czyli nie jest odwrotem o 2 heksy (forma (b) z dispatchu). Remis również nie jest „przegraną” (warunek unicestwienia z dispatchu). Forma (a) to wycofanie PRZED bitwą (applyDefenderPreBattleRetreat), nie po remisie.
- Test 2j pinuje to jako ZAŁOŻENIE: remis nie zmienia licznika i nie unicestwia. Jeśli orkiestrator/FC uzna, że remisowe rozproszenie obrońców to odwrót — wymagana decyzja ABC (opcja: liczyć +1 bez unicestwienia); NIE ZMIERZONO w kodzie.

### Zarzut 4 — testy wiązania z main.ts słabe (M2, M4 nie wykryte) — PRZYJĘTY
- Piny przepisane na linie NIEskomentowane (`codeLines` odrzuca linie zaczynające się od `//`, `*`, `/*`):
  - 3c: reset `resetRetreatCountOfUnit(u)` musi być w bloku `for (const u of units)` w EOT.
  - 3d: `defRetreatBudgetExhausted: !cityOnHex` + `&& !allDefendersFortifiedInGarnizon(defRoster)` + `&& retreatBudgetExhausted(defRoster),` — dokładne formy (M4 `&& false` → FAIL).
  - 3b, 3a, 3e, 3h, 3g — dokładne wyrażenia.
- Mutacje (wykonane, kod przywrócony, `cmp` potwierdził):
  - M2 (usunięcie resetu w EOT) → `FAIL: 3c` (42 pass / 1 fail).
  - M4 (`&& retreatBudgetExhausted(defRoster),` → `&& false,`) → `FAIL: 3d`.
  - M7 (`atkRetreatBudgetExhausted` → `false`) → `FAIL: 3g`.
  - M8 (gałąź atakującego wyłączona) → `FAIL: 2g` ×3.
- 2e wzmocnione: wynik jawny (d0 żyje, d1 usunięty, `retreatCountOfUnit(d0)===0`, `d0.odwrotyWTurze===0`).
- NIE ZMIERZONO: pełny test behawioralny `main.ts` (wiązanie nadal przez piny tekstowe; main.ts nie da się wykonać w node bez UI). Test budowy/migracji zapisu (`save/load`) nie został dodany: grep `retreatedThisTurn` w src nie wykazał listy pól zapisu (serializacja ogólna), więc `odwrotyWTurze` przechodzi przez zapis tak samo jak inne pola RuntimeUnit — dowód pośredni, NIE ZMIERZONO bezpośrednio.

### Zarzut 5 — komunikat tylko jako hint, bez wpisu w podsumowaniu; brak rozróżnienia stron — CZĘŚCIOWO PRZYJĘTY
- ROZRÓŻNIENIE STRON — PRZYJĘTE: `main.ts`: `playerArmyDestroyed` (obrona: `defRoster.some(u => u.ownerId === 0)`; atak: `atkRoster.some(u => u.ownerId === 0)`) → gracz dostaje `ARMIA_UNICESTWIONA_KOMUNIKAT`, wróg `ARMIA_WROGA_UNICESTWIONA_KOMUNIKAT` („Armia przeciwnika unicestwiona — wyczerpano trzy odwroty w tej turze”). Pin 3e.
- WPIS W PODSUMOWANIU / DZIENNIKU — NIE WYKONANO: w `main.ts` nie znaleziono wspólnego API wpisów wydarzeń bitwy (grep `addEvent|pushEvent|logEvent|battleSummary` — brak właściwego punktu wpięcia). Wymaga osobnego tematu (podsumowanie bitwy w `battleScene`/panelu).

### Zarzut 6 — brak hasła Civpedia/poradnika i regeneracji wikiBundle — NIE DOTYCZY (brak hasła)
- `grep -rli "odwrot|wycofa" docs/encyklopedia` → tylko `pojecia/zaufanie.md`, `pojecia/wiarygodnosc.md`, `jednostki/hastati.md` — żadne nie opisuje mechanizmu odwrotu armii ani limitu. `docs/PORADNIK-GRACZA/11-oblezanie.md:259` („Strategiczny koszt przedwczesnego odwrotu”) nie zawiera reguły liczbowej, która by się zdezaktualizowała.
- Zatem nie ma czego aktualizować ani regenerować (wikiBundle nietknięty). Jeśli właściciel chce nowego hasła — to osobny temat (poza allowlistą tej rundy: wymagałoby nowego hasła, nie edycji).

### Zarzut 7 — semantyka licznika (max po rosterze) — CZĘŚCIOWO PRZYJĘTY
- Dodano test 2i: roster mieszany (świeży 0 + stary 3) → budżet wyczerpany; świeży obrońca ginie razem z armią. Dowód: `battle-retreat-limit-test` 43/0.
- Scenariusz ROZDZIELENIA armii po odwrotach (licznik przy podziale) — NIE ZMIERZONO: kod nie ma operacji rozdzielania licznika; ZAŁOŻENIE: roster bitwy = armia (zgodnie z decyzją 1 r1). Ryzyko niskie, do rozstrzygnięcia przez FC.

### Zarzut 8 — kandydat na 50f607fe3, origin/main = 42a93543a — ZMIERZONO CZĘŚCIOWO
- `git merge-tree --write-tree origin/main HEAD` → zwrócone drzewo `8606e1d444e6706accf33e97ef36ef3da92c3e58`, BEZ listy konfliktów (czyste scalenie tekstowe).
- NIE ZMIERZONO: testy/tsc na połączonym drzewie (nie scalano — zgodnie z zasadą „nie integruję”). Semantyczna zgodność z FALĄ 731 (m.in. `battle-undeployed`, pościg, WIN-ARMY r3 w `post-battle-map.ts`) — wymaga bramek na drzewie po merge (dla FC/orkiestratora).

## ZMIANY (allowlista, commit 5a971c1e6)

| Plik | Zmiana |
|---|---|
| `gra/src/game/post-battle-map.ts` | `atkRetreatBudgetExhausted` (input), `attackerAnnihilatedByRetreatLimit` (wynik), gałąź `obronca`: unicestwienie atakującego lub odwrót ocalałych atakującego liczony w limicie |
| `gra/src/main.ts` | `atkRetreatBudgetExhausted` w wywołaniu; komunikat dla obu stron (gracz/wróg) |
| `gra/src/game/battle-retreat-limit.ts` | stała `ARMIA_WROGA_UNICESTWIONA_KOMUNIKAT` |
| `gra/tools/battle-retreat-limit-test.cjs` | 2e wzmocnione; 2g–2j; piny 3a–3h na kod (bez komentarzy) |
| `gra/tools/battle-retreat-limit-browser-entry.{ts,html}` (NOWE) | entry Chromium z `?retreat=N` |
| `gra/tools/battle-retreat-limit-browser-test.cjs` (NOWY) | test Chromium: 0/2/3 odwrotów |

## TESTY (liczby z surowego wyjścia, uruchomione w tej rundzie)

- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs`: `20 pass, 0 fail`.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs`: exit 0 (linie [OK]).
- `node tools/combat-test.cjs`: `All sanity checks passed.`
- `node tools/unit-power-test.cjs`: `6 pass, 0 fail`.
- `node tools/battle-retreat-limit-test.cjs` (NOWY): `43 pass, 0 fail` (r1: 29/0).
- `node tools/pre-battle-retreat-exhausted-test.cjs`: `37 pass, 0 fail`.
- `node tools/battle-defeat-survivor-retreat-two-hex-test.cjs`: `44 pass, 0 fail`.
- `node tools/retreat-garnizon-fortyfikacja-test.cjs`: `27 pass, 0 fail`.
- `node tools/weterani-test.cjs`: `WYNIK: 79 PASS, 0 FAIL`.
- `node tools/battle-undeployed-units-test.cjs`: `PASS=37 FAIL=0`.
- `node tools/pre-battle-defender-retreat-test.cjs`: exit 0 (brak linii podsumowania w wyjściu — wynik wyłącznie po kodzie wyjścia).
- `node tools/battle-retreat-limit-browser-test.cjs` (NOWY, Chromium): `BROWSER PASS` (3 przypadki).
- `node tools/battle-defeat-survivor-retreat-browser-test.cjs` (regresja 2-hex, Chromium): `BROWSER PASS`.
- `npm ci --ignore-scripts` w gra/ (71 pakietów) — node_modules tylko lokalnie, gitignore.
- `git diff --cached --check`: czysto.
- Mutacje: M2 → 3c FAIL; M4 → 3d FAIL; M7 → 3g FAIL; M8 → 2g FAIL ×3 (kod przywrócony, cmp OK).
- Test nowy na bazie 50f607fe3: NIE URUCHAMIANO (brak modułu battle-retreat-limit w bazie; czerwony z konstrukcji — jak w r1).
- `mgla-sciezka-inwariant-test`: NIE URUCHAMIANO w tej rundzie (znane 41/1 w `ai.ts`, poza zakresem).

## BLOKADY

- Punkt (4) dispatchu (Chromium: przycisk wyszarzony, komunikat, zrzuty) — NIE ZMIERZONO (częściowo: wynik unicestwienia w Chromium tak).
- Wpis w podsumowaniu/dzienniku bitwy — NIE WYKONANO (brak punktu wpięcia, patrz zarzut 5).
- Remis (zarzut 3) — ODRZUCONY z dowodem; wymaga potwierdzenia przez FC/ABC.
- Pełny test behawioralny main.ts — NIE ZMIERZONO (piny tekstowe + Chromium częściowo).
- Rozdzielanie armii po odwrotach — NIE ZMIERZONO (ZAŁOŻENIE: roster = armia).
- Testy na drzewie po merge z origin/main 42a93543a — NIE ZMIERZONO (merge-tree czysty).

## UWAGI-DLA-ORKIESTRATORA

- Dla FC: decyzja o remisie (zarzut 3) i ewentualny wpis w podsumowaniu bitwy (zarzut 5) to dwa otwarte punkty wymagające decyzji lub osobnego tematu.
- Dla orkiestratora: gałąź worktree ma `gra/node_modules` (lokalnie, nie commitowane). Do sprzątania po FC.
- Zauważono, że `battle-retreat-limit-browser-entry.ts` to kopia entry z R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1 (116 linii) — przy ewentualnej refaktoryzacji wspólnego entry można scalić.
- Nie zakładano sesji, nie integrowano, nie pushowano na main.

## NASTĘPNY KROK

1. Evaluator r2 (SONNET) na `5a971c1e6`: bramki jak wyżej, weryfikacja mutacji M2/M4/M7/M8 niezależnie.
2. Final Control (SONNET) na `5a971c1e6`; decyzja ABC o remisie (zarzut 3) jeśli FC uzna za wymagane.
3. Osobny temat dla wpisu w podsumowaniu bitwy (zarzut 5) i pełnej weryfikacji UI (przycisk/komunikat/zrzuty) — jeśli właściciel wymaga przed deployem.

DEPLOY/PUSH: NIE WYKONANO
