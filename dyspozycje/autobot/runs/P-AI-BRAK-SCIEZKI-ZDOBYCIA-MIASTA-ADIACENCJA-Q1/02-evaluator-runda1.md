# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 — Evaluator, runda 1/5

MODEL+EFFORT: Opus 5, effort high · DATA: 2026-09-05 · worktree `/home/user/wt-ai-adiacencja`,
gałąź `autobot/…-ADIACENCJA-Q1`, baza `022b82aa` (przodek HEAD, potwierdzone `merge-base
--is-ancestor`), HEAD `1e5a850d`, drzewo czyste przed i po każdej mutacji.

STATUS: FAIL
DOMAIN: GAME
TEMAT: P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1
GOAL: rozkaz `move` AI major na sąsiedni, niebroniony obcy heks miasta skutkuje przejęciem,
jednostka nie traci tury bez efektu.

## POTWIERDZONE WŁASNYM PRZEBIEGIEM

- `744c4374` jest przodkiem bazy — teza Operatora („wyzwalacz opisuje stan sprzed") POTWIERDZONA.
  `main.ts:31523` woła `executeAiCityMove`, `:31540` wpina `tryAutoCaptureEmptyCityAt`.
- **Własna symulacja** (`decideAITurn` + REALNY `computePath`/Dijkstra z `units/setup`,
  nie atrapa ścieżki z bramki Operatora): `ownerId 2 → 1`, jednostka `7,6 → 7,7`, `ruchLeft 0`,
  1 komenda jednostki. Bronione → planista emituje `attack`, `ownerId` 2. `maMur`/`mury`/dystans 3
  → brak przejęcia. Tura 2 po przejęciu — 0 komend, brak zwisu.
- Bramki: nowa 53/53 · tsc 0 błędów · logic 213/213 · tech-tree 19/19 · research 33/33 ·
  unit-replace 13/13 · combat 6/6. Sąsiedzi (gracz+barbarzyńcy+AI): ai-city-capture-integration
  14, city-hex-movement 13, siege-defenders 12/0, capital-capture 86/86, post-capture-law 25/0,
  map-attack-city 13/0, map-siege 6/0, siege-ai 17/0, ai-fog 8/8, barb-city-behavior 178/0,
  barb-city-owner-contract 3/3, barbarians 213/0, city-limit-conquered 15/0 — wszystkie zielone.
  `barb-camp-destruction` 82/2 i `barb-city-capture-cluster` 92/1 czerwone — asercje TEKSTOWE na
  `main.ts`, a `git diff 022b82aa..HEAD --name-only -- gra/src` = 0 plików, więc preegzystujące.
- ZAKRES: diff = dokładnie 2 pliki, oba `A`: `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs`
  i `…/01-operator-runda1.md`. Zero `barbarians.ts`, zero `ai.ts`/`main.ts`. §2b nienaruszone.
- MUTACJE WŁASNE (inne niż Operatora — jego szły w egzekutor/`main.ts`, moje w
  `city-hex-movement.ts` i `ai.ts`), każda cofnięta `cp` z kopii, po każdej `git diff --quiet` OK:
  E1 usunięcie `hasDefenders` (chm:50) → **53/53 ZIELONE (dziura)**; E2 usunięcie `maMur` (chm:51)
  → 51/53; E3 `canUnitOccupyCityHex` → `return true` (chm:33) → 45/53 + city-hex-movement 11/13;
  E4 usunięcie `targetCityId` (ai.ts:2807) → 45/53.

## ZARZUTY

**1. Parytet złamany w stronę SZERSZĄ dla AI: cywilne jednostki AI wchodzą na obcy heks miasta.**
`city-hex-movement.ts:40-53` (`canAiEnterEmptyEnemyCity`) nie ma filtru `isCivilianUnit`, a
`ai.ts:2795-2809` emituje `move` z `targetCityId` dla KAŻDEJ jednostki niebędącej zwiadowcą
(pętla `ai.ts:2766` po `myUnits` bez filtra cywili; `isWithinCityAttackRange` = sam dystans 1).
Zmierzone: Robotnik i Osadnik AI → `moved=true`, POZYCJA `7,7` (heks obcego miasta),
`ownerId` pozostaje 2, `ruchLeft=0`. Gracz jest tu odrzucany bezwarunkowo (`main.ts:23195`
+ podpowiedź „Obce miasto — stój na sąsiednim heksie"). Narusza kryterium końca 3 dispatchu
(„warunek niezamierzony i nieuzasadniony = defekt do naprawy w tej rundzie") i czyni fałszywym
zdanie raportu Operatora K3 „Wszystkie są WĘŻSZE — AI nie może nic, czego nie może gracz".
Dla GOAL: cywil AI traci turę bez efektu i parkuje w cudzym mieście — ten sam defekt, który
temat ma usunąć, tylko dla innej klasy jednostek.

**2. Asercje negatywne K4 nie pilnują granicy, którą deklarują — brak asercji na `moved`/pozycji.**
`gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs:296,305,315,327,337` sprawdzają wyłącznie
`res.captured` i `cities[].ownerId`. Dowód: mutacja E1 (usunięcie `if (hasDefenders) return false;`,
`city-hex-movement.ts:50`) zostawia bramkę **53/53 ZIELONĄ**, a zachowanie zmienia się na:
jednostka AI staje na heksie BRONIONEGO miasta (`moved=true`, pozycja `7,7`, obrońca nadal `7,7`,
`ownerId=2`). Kryterium 4 i „tryb drugi samooszukiwania" z dispatchu wymagają, żeby bramka
łapała rozluźnienie bramki obrońców po stronie AI. Poprawka: dodać do K4 asercje `res.moved===false`
i pozycję jednostki bez zmiany.

**3. K2 nie dowodzi przejęcia produkcyjnym `tryAutoCaptureEmptyCityAt` — dowodzi własnej atrapy.**
`…-test.cjs:194-199` przepisuje `city.ownerId = anchor.ownerId` w harnessie bramki i POMIJA
warunek kotwicy `const anchor = arrivingUnits.find(u => !isCivilianUnit(u))` z `main.ts:26629`.
Produkcyjna funkcja jest pokryta wyłącznie asercjami TEKSTOWYMI A6a-A6f. To jest dokładny powód,
dla którego zarzut 1 przeszedł niezauważony. W repo istnieje wzorzec realnego dowodu end-to-end
(`ai-buduje-budynki-test.cjs`: vite przez binarkę + headless Chromium + `doStartGame`/`endTurn()`),
więc „domknięcie `main()`" nie jest tu barierą nie do przejścia.

**4. Raport Operatora nie ma pól kontraktu.** `01-operator-runda1.md` nie zawiera linii `STATUS:`,
`DOMAIN:`, `TEMAT:`, `GOAL:` (jedyne pole kontraktu to `DEPLOY/PUSH:` w linii 90). Wymagane przez
INDEX-PROCESU §6, „Minimalny kontrakt raportu" i C-055 (`DOMAIN`). Brak `GOAL:` uniemożliwia
kontrolę §16a pkt 9. Dodatkowo `ZMIANY/COMMIT` nie podaje SHA, tylko odsyła do `git log`.

**5. Przekroczenie limitu objętości raportu.** 695 słów wobec ~400 (§11) — sam w sobie
`PASS-WITH-NOTES`, nie `FAIL`, ale wraca do skrócenia.

Nota (nie zarzut): rozjazd „dispatch vs kod" Operator rozpoznał i udokumentował, odrzucając
`DECISION_REQUIRED` z uzasadnieniem — do rozstrzygnięcia przez Final Control/orkiestratora.
Wpis nowej bramki do tabeli §6 należy do integracji (poza allowlistą Operatora) — zgadza się.

ZMIANY/COMMIT: bez zmian w `gra/`; ten raport w `runs/…-ADIACENCJA-Q1/02-evaluator-runda1.md`.
TESTY: jak wyżej — wszystkie uruchomione samodzielnie, nie odtworzone z raportu.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Obrona Operatora (§3c, lista zarzutów niepusta), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
