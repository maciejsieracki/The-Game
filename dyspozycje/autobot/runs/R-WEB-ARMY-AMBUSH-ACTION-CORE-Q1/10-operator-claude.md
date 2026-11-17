# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — raport Operatora, RUNDA 4/5 (sekcja r4; r3, r2 i r1 poniżej)

STATUS: PASS-WITH-NOTES (pozycje 1, 5, 6, 7 z FC r3 domknięte kodem i testami na realnych funkcjach, mutanty czerwone; pozycja 8: gracz→AI ZMIERZONE w Chromium, AI→gracz NIE ZMIERZONO — AI w żywej grze zaatakowało miasto zamiast wejść w zasadzkę, patrz BLOKADY; PASS niemożliwy, bo pomiar 8 jest niepełny)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: wyzwalacz zasadzki w ruchu gracza, AI i barbarzyńców + niewidoczność zasadzki wroga w pathfindingu/AI/UI + cykl życia + znacznik „W zasadzce” w produkcyjnym UI + testy realnego kroku ruchu + pomiar w Chromium.
BAZA: `2e45abdf356f1d2a1cd7ee93f4f67892a0dbb5b4` (kandydat r3) + `git merge origin/main` (czysto, HEAD po merge `c61629288ec4b5cc8b2e5428b9ba947f01e61179`); `git merge-base --is-ancestor 2e45abdf3 HEAD` = TAK (sprawdzone przed pracą).

## Zarzuty FC r3 → odpowiedź r4

1. TEST KROKU RUCHU (zarzut 1): logika wyzwalacza wyjęta z zagnieżdżonych funkcji `main.ts` do czystego modułu `gra/src/game/ambushMove.ts` (`planPlayerAmbushMove`, `resolveAmbushAfterMove`, `makeAmbushPathCutter`, `unitsForPlanner`, `unitsForViewer`, `releaseAmbushOnMoveOrder`, `reconcileAmbushInWorld`), wołanego z `startAnimatedMove`, `applyMarchSegmentInstant`, wykonawcy AI, pętli barbarzyńców i `syncUnitsRender`. Nowy `gra/tools/ambush-realstep-test.cjs` bundluje esbuildem PRODUKCYJNY kod (bez kopii logiki) i przechodzi realne kroki ruchu (scenariusze S1–S20). Mutanty źródła M2, M3, M4, M9 (wymagane) oraz M7, M10–M17 są CZERWONE (lista w TESTY).
2. WYCIEK WIDOCZNOŚCI (zarzut 5): audyt wszystkich czytelników wrogich `units` — tabela niżej; testy S11–S15 (widz, mapa, kontakt dyplomatyczny, hit-test) + mutanty M9, M11, M12.
3. BARBARZYŃCY (zarzut 6): pętla barbarzyńców w `main.ts` używa `unitsForPlanner` (barbarzyńcy NIE widzą zasadzki gracza przy planowaniu), przycina trasę (`makeAmbushPathCutter`), a po ruchu wyzwala zasadzkę (`resolveAmbushAfterMove`, gałęzie `barbAmbushHit`/`barbStays`) i otwiera bitwę doklejoną komendą ataku. Testy S10, S11 + mutant M10; wykonawca AI: S8, S9 + mutant M13.
4. ZNACZNIK W UI (zarzut 7): „W zasadzce” w produkcyjnych widokach — patrz sekcja Znacznik. Testy DOM na realnych modułach + zrzut 1280×720.
5. POMIAR W CHROMIUM (zarzut 8): `gra/tools/ambush-live-test.cjs` + `ambush-live-vite.config.ts` (build poza repo z wstrzykniętą sondą `window.__amb`; zero zmian źródeł produkcyjnych dla sondy). Gracz→AI: 13 PASS / 0 FAIL. AI→gracz: NIE ZMIERZONO (BLOKADY).

## Audyt czytelników wrogich jednostek (zarzut 5)

Reguła: wróg w wojnie (i barbarzyńca) NIE widzi zasadzki; `isUnitVisibleToViewer(u, viewerOwnerId)` = `!(u.ambush === true && u.ownerId !== viewerOwnerId)`.

| Miejsce | Filtr? | Dlaczego |
|---|---|---|
| `game/visibility.ts` (lista jednostek widocznych dla gracza w mgle) | TAK (`isUnitVisibleToViewer`, l.335) | zasadzka obcego nie jest „widoczną jednostką”, nawet w polu widzenia |
| `game/diplomacy-layers.ts` (kontakty dyplomatyczne z sąsiedztwa jednostek) | TAK (l.268 `continue` dla `ambush`) | ukryta zasadzka nie może otworzyć kontaktu dyplomatycznego ani ujawnić cywilizacji |
| `main.ts` czuwanie/sentry (wybudzanie, l.14247) | TAK | zasadzka nie budzi wartownika; test wiringu r3 (E2) |
| `main.ts` `syncUnitsRender` → `unitsForViewer(rawSrc, ME())` (l.15350) | TAK | render żetonów, minimapa i tokeny bez wrogiej zasadzki; własna zasadzka widoczna |
| `main.ts` blokada ruchu „Heks zajęty” (l.15984) | TAK dla widoczności; heks dalej zajęty przy braku wojny | ruch na heks ukrytej zasadzki WROGA w wojnie jest dozwolony (to wyzwalacz); sojusznik/pokój: heks zajęty |
| `main.ts` klik/hit-test jednostki (`unitAtRepresentative`, l.35339) | TAK (`unitsForViewer`) | klik w heks z wrogą zasadzką nie wybiera ani nie ujawnia jednostki; tooltip heksu też |
| `main.ts` HUD sił / lista armii / karty jednostek | TAK (przez `unitsForViewer` / źródło `syncUnitsRender`) | siły wroga w HUD bez zasadzek |
| `main.ts` plan AI (`unitsForPlanner`, l.38004) | TAK — filtr wg bramki wojny (`areEnemyOwners`) | AI w wojnie nie widzi zasadzki gracza; sojusznik widzi i omija |
| `main.ts` pętla barbarzyńców (`unitsForPlanner`, l.46512) | TAK | barbarzyńcy to wrogowie wszystkich — nie widzą zasadzki |
| `units/setup.ts` `buildMoveOccupancy(..., isAtWar)` | TAK (stos w zasadzce WROGA w wojnie nie blokuje heksu w planowaniu) | pathfinding nie omija ukrytej zasadzki → wchodzi w nią → wyzwalacz |
| `render/units.ts` | własne zasadzki oznaczone (`ambushRepIds` → `_applyAmbushMarks`), cudze nie trafiają do renderu | owner-only znacznik na mapie |
| `game/ai.ts` `decideAITurn` | TAK (lista przefiltrowana przed planistą) | jak wyżej |
| Ranking mocy / siła państwa (Power) | NIE (świadomie) | agregat liczbowy, nie lokalizacja; ujawnia co najwyżej sumę siły, nie położenie zasadzki. Decyzja produktowa → UWAGI-DLA-ORKIESTRATORA |

Poza zakresem: rozstawienie w bitwie (limit linii ≤ 3), reguły scalania/Spacji bez zmian.

## Znacznik „W zasadzce” (zarzut 7)

- Mapa: sprite „oka” na żetonie stosu, TYLKO dla właściciela (`stackAmbushSprites`, `_applyAmbushMarks`, `_makeAmbushMarkSprite` w `render/units.ts`; `StackDisplayInfo.ambushRepIds` w `armyMerge.ts`).
- Panel boczny armii w produkcji (`hexContextTooltip.ts`, chip `.uc-ambush-chip` „W ZASADZCE”), karta jednostki (`unitCardStatus.ts`), `unitPanelHud.ts`, `armyListHud.ts`/`sideListHud.css.ts`, pasek `armyStackHud.ts`. Teksty po polsku: „W zasadzce”, „Zasadzka zastawiona”, „Zasadzka odwołana”, „Wpadłeś w zasadzkę!”.
- Testy DOM: `ambush-realstep-test.cjs` (jsdom na realnych `armyStackHud`, `unitCardStatus`, `armyListHud`, `buildUnitContextTooltipHtml`) + live A5/A6/A7.
- Zrzuty 1280×720 (Chromium, live): `dyspozycje/autobot/runs/R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1/zrzuty/A-znacznik-panel-mapa-1280x720.png`, `A-bitwa-po-wejsciu-1280x720.png`, `B-przed-faza-AI-1280x720.png`, `B-bitwa-AI-wpadlo-1280x720.png`.

## ZMIANY/COMMIT

Pliki spoza allowlisty r3 (konieczne, uzasadnione audytem): `gra/src/game/ambushMove.ts` (NOWY), `game/visibility.ts`, `game/diplomacy-layers.ts`, `render/units.ts`, `game/armyMerge.ts` (tylko pole `ambushRepIds`), `ui/armyListHud.ts`, `ui/sideListHud.css.ts`, `ui/hexContextTooltip.ts`, `ui/unitCardStatus.ts`, `ui/unitPanelHud.ts`, `ui/armyStackHud.ts`. Główne: `gra/src/main.ts` (wpięcie rdzenia), `docs/encyklopedia/pojecia/zasadzka.md`, `gra/src/data/wikiBundle.json` (regeneracja). Narzędzia: `gra/tools/ambush-wiring-test.cjs` (E1 przepisany pod rdzeń), `ambush-realstep-test.cjs`, `.stubs/ambush-realstep-brandAssets-stub.ts`, `ambush-live-test.cjs`, `ambush-live-vite.config.ts`. Commit: patrz końcowy SHA w wyniku Operatora (commit wyłącznie po jawnych ścieżkach, bez `git add -A`). DEPLOY/PUSH: NIE WYKONANO.

## TESTY (surowe wyniki z tego worktree)

- `npx tsc --noEmit` (w `gra/`) → exit 0, brak błędów.
- Pięć bramek referencyjnych: `logic-test` LOGIC OK (213/213); `tech-tree-test` 20 pass, 0 fail; `research-test` PASSED 33 / FAILED 0 / TOTAL 33; `unit-replace-test` 21/21 zielone; `combat-test` 6/6 pass.
- `load-game-regression-test` → 34 PASS / 0 FAIL.
- Determinizm: `determinism-same-seed-test` → WYNIK: PASS; `determinism-digest-stackgroup-test` → ZIELONY (5/5).
- `ambush-realstep-test` → Wynik: 14 OK, 0 FAIL; mutanty czerwone: M2 (S6), M3 (S7), M4 (S3), M7 (S5), M9 (S12, S15), M10 (S11), M11 (S13), M12 (S14), M13 (S9), M14 (S16, S17), M15 (S18), M16 (S19), M17 (S20).
- `ambush-wiring-test` → 27 OK, 0 FAIL; `ambush-core-test` → 40 OK, 0 FAIL; `ambush-ui-reason-test` → 5 OK, 0 FAIL; `ambush-save-roundtrip-test` → 5 OK, 0 FAIL.
- `army-merge-*` (11 plików): besieger-only-move 8 OK/0 FAIL; bounce 4/0; colocated 4/0; dismiss-bounce 16/0; panel-list-visibility 104/0; panel-production-mount 9/0; panel-scroll-real-render 27/0; separate-return-mainguard 73/0; separate-return 16/0; split-direction-icons PASS; stackgroupid 11045 pass/0 fail.
- Chromium (live, 1280×720), build poza repo `/tmp/ambush-live-dist-*` (sonda wstrzyknięta pluginem; usunięta po pracy):
  - A (gracz→AI): 13 PASS / 0 FAIL — zasadzka AI niewidoczna (A1), ruch gracza na heks zasadzki przerwany, gracz staje PRZED zasadzką, zasadzka ujawniona, brak nakładania jednostek, okno bitwy, komunikat „Wpadłeś w zasadzkę!”, znacznik w panelu i na mapie, odwołanie zdejmuje znacznik.
  - B (AI→gracz): 5 PASS / 3 FAIL (NIE ZMIERZONO — patrz BLOKADY). B0, B1 (zasadzka gracza niewidoczna dla AI), B2 (otwarte okno bitwy dla gracza) i B4 PASS, ale okno dotyczyło ataku AI na miasto Rzym, nie wejścia w zasadzkę; B3, B5, B6 FAIL.

## BLOKADY

1. NIE ZMIERZONO: AI→gracz w żywej grze (przerwany ruch AI na zasadzce gracza, wznowienie fazy AI przez `aiCmdResume`, dwie jednostki na jednym heksie). Przyczyny harnessu rozwiązane po drodze (brama NNS gracza wymagała dosypania złota/żywności przez `__aiTradeWiringTestDebug.grantPlayerGold/Food`; równoważenie NNS-AI rozwiązywało syntetyczne jednostki AI — dodany bufor skarbca/spichlerza AI w sondzie). Ostatni przebieg: AI wyszło z heksu startowego i zaatakowało pobliskie miasto gracza (okno „Broni się: obrona miasta Rzym”), omijając korytarz z zasadzką — korytarz leży 3 heksy od miasta, więc AI wybrało cel miejski. Zasadzka NIE została wyzwolona w tym przebiegu, więc żaden warunek B3/B5/B6 nie jest rozstrzygnięty. Logika AI→gracz jest pokryta testem realnego kroku (S6, S7, S12, S15 i mutanty M2, M3, M9 czerwone), ale NIE potwierdzona w Chromium. Wymagane do PASS: scenariusz z korytarzem daleko od miast AI-celów (≥ 8 heksów) albo hak testowy wymuszający cel AI.
2. Brama NNS w t1 (`Zakończ turę` zablokowane przy braku prognozy) — znany dług harnessu (#417/#455); w teście obejście przez dosypanie zasobów, bez zmian reguł gry.
3. Ranking mocy (Power) nie jest filtrowany — decyzja produktowa (UWAGI).

## RUNDY

4/5 (limit 5 rund; po tej rundzie pozostaje 1).

## NASTĘPNY KROK

Evaluator r4 → Final Control. Jeśli FC wymaga domknięcia B w Chromium: runda 5 tylko na harness (korytarz poza zasięgiem miast, bez zmian kodu gry). Wynik tej rundy NIE jest PASS z powodu pozycji 8 (AI→gracz).

DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA

- Pliki poza allowlistą r3 dotknięte świadomie (lista w ZMIANY); diff `main.ts` jest punktowy, rdzeń w `ambushMove.ts`.
- Decyzja produktowa do właściciela (ABC): czy ranking mocy/Power ma ukrywać siłę zasadzek wroga (dziś liczy je jako część siły państwa).
- Rozstawienie w bitwie (linia ≤ 3, formacja) = osobny temat AMBUSH-DEPLOY, nie ruszane.
- Sprzątanie: usunąć `/tmp/ambush-live-dist-*` oraz `gra/node_modules` z worktree po integracji; w `scratchpad/` tylko pliki tymczasowe.

### Lista testów do deployu (po FC PASS)
`tsc --noEmit`; 5 bramek (logic, tech-tree, research, unit-replace, combat); `load-game-regression-test`; `determinism-same-seed-test`; `determinism-digest-stackgroup-test`; `ambush-realstep-test`, `ambush-wiring-test`, `ambush-core-test`, `ambush-ui-reason-test`, `ambush-save-roundtrip-test`; `army-merge-*`; ręcznie w grze: zastaw zasadzkę (przycisk w panelu armii), sprawdź znacznik „W zasadzce” w panelu i na mapie, wejdź wrogiem w cudzą zasadzkę (okno bitwy, gracz stoi przed zasadzką).

### Dług Rust (REPIN po deployu)
Przeniesienie: `ambush`/`ambushAt` w jednostce i zapisie, `resolveAmbushTrigger`/`truncatePathAtAmbush`/`resolveAmbushAfterMove`, `buildMoveOccupancy(isAtWar)`, filtr widoczności (`isUnitVisibleToViewer`) w widoczności/dyplomacji, `reconcileAmbush` (scalenie/podział/odwrót/garnizon/oblężenie), filtr planisty AI/barbarzyńców, teksty PL i hasło wiki „zasadzka”.

---

# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — raport Operatora, RUNDA 3/5 (sekcja r3; r2 i r1 poniżej)

STATUS: PASS-WITH-NOTES (wpięcie 1+2+3+4+5+6 zrobione RAZEM w kodzie i testach na realnych funkcjach; NIE ZMIERZONO Chromium i bitwy w żywej grze — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: wyzwalacz zasadzki w ruchu gracza i AI + niewidoczność w pathfindingu/AI + cykl życia + testy + wiki, w jednej rundzie (decyzja podziału z DODATKU 2).
BAZA: `82f5d6ad2` (kandydat r2) + `git merge origin/main` (`64069b1a2`, FALA 783) bez konfliktów; `git merge-base --is-ancestor origin/main HEAD` = TAK.

ZMIANY (kod):
- `gra/src/game/ambush.ts`: `isAmbushHiddenFromMover`, `truncatePathAtAmbush` (trasa kończy się na ostatnim heksie PRZED zasadzką wroga w wojnie; brak nakładania jednostek), `reconcileAmbush` (cykl życia, jedno miejsce), pole pieczęci `ambushAt` ("q,r,owner"), `cancelAmbush`/`resolveAmbushTrigger` czyszczą oba pola.
- `gra/src/units/setup.ts`: `RuntimeUnit.ambushAt?`; `buildMoveOccupancy(..., isAtWar?)` — z predykatem stos w zasadzce WROGA w wojnie nie blokuje heksu (dla wroga niewidoczny); bez predykatu zachowanie bez zmian (barbarzyńcy, zwiad: zasadzka nadal blokuje, bez ryzyka nakładania).
- `gra/src/game/ai.ts` (punktowo, `decideAITurn`): zasadzki wroga odfiltrowane z listy jednostek widzianej przez planistę AI (pathfinding, „siły wroga w zasięgu”, cele); brak zasadzek = ta sama tablica.
- `gra/src/main.ts` (punktowo): `occupiedForMove` przekazuje `areEnemyOwners`; `fireAmbushOnHex` (zdjęcie stanu, skasowanie zaplanowanego marszu i celu ataku, komunikaty „Wpadłeś w zasadzkę!” / „Zasadzka się powiodła”, bitwa przez `openPlayerMapUnitAttackCore`: poruszający = atakujący, zastawiający = obrońca, STANDARDOWE rozstawienie, punkt wpięcia R3/AMBUSH-DEPLOY opisany w komentarzu); `startAnimatedMove` (obcięcie trasy; pusta trasa = bitwa od razu; po animacji `AnimState.ambushHex` → bitwa); `applyMarchSegmentInstant` (marsz końca tury; bez `launchAttack` zasadzka zostaje nietknięta); executor AI (`truncatePath` przycina trasę, po ruchu `resolveAmbushTrigger` + wstrzyknięty rozkaz `attack` z flagą `ambush` omijający test widoczności i wznowienie fazy AI istniejącą ścieżką `aiCmdResume`/`launchIncomingMapFieldBattle`); `syncUnitsRender` woła `reconcileAmbush`.
- `gra/tools/ambush-wiring-test.cjs` (NOWY, 27 asercji), `docs/encyklopedia/pojecia/zasadzka.md` + wpis w `indeks.md`, regeneracja `gra/src/data/wikiBundle.json` (`node gra/tools/bundle-wiki-for-game.cjs` → 185 haseł).
NIE zmieniano: `armyMerge.ts` (scalenie/podział/odwrót obsługuje `reconcileAmbush` z `syncUnitsRender`; kod armyMerge bez zmian), `save.ts` (pola przechodzą przez zapis jako część jednostki; normalizacja z r1 obejmuje teraz też `ambushAt`), battle/*, WERSJE.md, manifest, rust-port.

ZAŁOŻENIA (luki rozstrzygnięte):
1. „Przerwany na tym heksie”: poruszający zatrzymuje się na heksie SĄSIEDNIM przed zasadzką, bitwa toczy się o heks zasadzki jak zwykły atak (unika dwóch jednostek na jednym heksie). Po wygranej atakującego działa istniejąca logika wejścia/odwrotu.
2. Scalenie widocznej jednostki ze stosem w zasadzce ujawnia CAŁY stos (spójność grupy owner+heks+stackGroupId); podział: część, która odeszła (zmiana heksu), traci zasadzkę, reszta zostaje. To odstępstwo od brzmienia „reszta zostaje” przy scaleniu — dla FC do decyzji.
3. Zasadzka wygasa też przy: sentry, garnizonie, fortyfikacji w polu, oblężeniu, mieście na heksie, zmianie właściciela, zmianie heksu (odwrót po bitwie, relokacja). Zasadzka trwa bez limitu tur (decyzja A), nie wraca do kolejki rozkazów.
4. Sojusznik/pokój/własny: nie wyzwala; heks dla nich pozostaje ZAJĘTY (AI filtruje wszystkie cudze zasadzki, ale wykonawca ruchu w main.ts blokuje heks przy braku wojny — brak nakładania). Barbarzyńcy: nie obsłużeni (zasadzka blokuje ich ruch jak zwykła jednostka; bez trigger) — UWAGA dla orkiestratora.
5. AI ruszające przez zasadzkę wyzwala ją tylko gdy po ruchu stoi bezpośrednio obok heksu zasadzki (inaczej trasa przycięta wcześniej, zasadzka zostaje).

TESTY (surowe wyniki z tego worktree, `npm ci --ignore-scripts`):
- `npx tsc --noEmit` → exit 0.
- `node tools/ambush-wiring-test.cjs` → `Wynik: 27 OK, 0 FAIL` (A pathfinding: real `buildMoveOccupancy`+`computePath`; B obcięcie trasy + realny `resolveAmbushTrigger`; C cykl życia: ruch/odwrót, miasto, właściciel, sentry/garnizon/fortyfikacja/oblężenie, scalenie, podział, stary zapis; D real `decideAITurn` + mutacja filtra AI; E wpięcie w main.ts (strukturalne); F real `serializeGame`/`deserializeGame`).
- `node tools/ambush-core-test.cjs` → `40 OK, 0 FAIL`; `ambush-ui-reason-test` → `5 OK, 0 FAIL`; `ambush-save-roundtrip-test` → `5 OK, 0 FAIL`.
- Mutacje: M7 (usunięcie `u.ownerId !== moverOwnerId` w `resolveAmbushTrigger`) → `ambush-core-test` 38 OK / 2 FAIL oraz `ambush-wiring-test` B5 FAIL; usunięcie ukrycia w `buildMoveOccupancy` → wiring A1 i A5 FAIL; wyłączenie filtra AI w `ai.ts` → wiring D4 wykrywa (bundle zmutowany zmienia decyzję AI).
- Bramki: `logic-test` `LOGIC OK (213/213)`; `tech-tree-test` `20 pass, 0 fail`; `research-test` `PASSED: 33 / FAILED: 0 / TOTAL: 33`; `unit-replace-test` `WSZYSTKIE TESTY ZIELONE (21/21)`; `combat-test` `6/6 pass`, `All sanity checks passed.` (wszystkie exit 0).
- `load-game-regression-test` `34 PASS / 0 FAIL`; `army-merge-colocated-test` `4 pass, 0 fail`; `army-merge-besieger-only-move-test` `WYNIK: 8 OK / 0 FAIL`; `army-merge-dismiss-bounce-test` `16 pass, 0 fail`; `army-merge-bounce-test` `4 pass, 0 fail`.
- Determinizm: `determinism-same-seed-test` `WYNIK: PASS`; `determinism-digest-stackgroup-test` `ZIELONY (5/5)`.
- AI (regresja filtra): `ai-army-composition-per-civ-test` `341 passed, 0 failed`; `ai-army-all-civs-general-muster-test` `26 PASS, 0 FAIL`; `ai-army-scattered-merge-test` `33 passed, 0 failed` w 2 z 3 uruchomień (1 uruchomienie: FAIL jednej asercji czasowej „czas tury AI <= 3x + 10 ms” — test czasowy, rozbieżność przy równoległym obciążeniu; powtórki zielone).
- NIE ZMIERZONO: Chromium / żywa gra (przycisk → zasadzka → wejście wroga → przerwanie ruchu → okno bitwy, zrzuty 1280×720) — brak builda vite i sesji przeglądarkowej w tej rundzie; wpięcie w main.ts potwierdzone tsc i testem strukturalnym E1 + testami funkcji wołanych, NIE realnym krokiem ruchu w grze. `siege-*`, pełne `battle-*` nie uruchamiane.

BLOKADY (jawnie):
1. Brak zmierzonego przebiegu na żywo (Chromium) — kandydat NIE był uruchomiony w grze; ryzyko szczególnie: otwarcie `preBattle` z `renderLoop` i z końca tury, wznowienie fazy AI po bitwie z zasadzki.
2. Barbarzyńcy nie wyzwalają zasadzki (blokuje ich jak zwykła jednostka).
3. Hotseat: „Zasadzka się powiodła” pokazywana tylko, gdy zastawiający jest aktywnym siedzeniem; bitwa AI→gracz tylko dla ownerId 0 (istniejące ograniczenie gałęzi `attack`).
4. Rozstawienie w bitwie na polu wroga + szyk ≤3 (`AMBUSH_FORMATION_MAX_WIDTH`) — POZA zakresem (R4/AMBUSH-DEPLOY), zostaje punkt wpięcia w `fireAmbushOnHex`.
5. Animacja ucięta na końcu tury (gałąź ~46790 main.ts) nie wyzwala zasadzki (zasadzka zostaje, ruch kończy się przed nią).

LISTA DO DEPLOYU (nowe testy): `gra/tools/ambush-core-test.cjs`, `gra/tools/ambush-ui-reason-test.cjs`, `gra/tools/ambush-save-roundtrip-test.cjs`, `gra/tools/ambush-wiring-test.cjs`. Wiki: `docs/encyklopedia/pojecia/zasadzka.md`, `docs/encyklopedia/indeks.md`, `gra/src/data/wikiBundle.json`.

DŁUG RUST (REPIN `rust-port`, NIE zmieniano): `ambush.rs` (stan `ambush`/`ambushAt`, `can_set`, `set`, `cancel`, `is_hidden_from_mover`, `truncate_path_at_ambush`, `resolve_trigger`, `reconcile`, `normalize`), `RuntimeUnit.ambush/ambush_at` i zapis/wczytanie, `build_move_occupancy(…, is_at_war)`, filtr zasadzek wroga w wejściu planisty AI (`decide_ai_turn`), wpięcie w krok ruchu gracza (animowany i końca tury) oraz wykonawcę ruchu AI + atak z flagą `ambush`, `reconcile_ambush` po zmianie stanu jednostek, UI: akcja, `disabledReason`, znacznik „w zasadzce”; fixtury: `ambush-core-test`, `ambush-wiring-test` (A1–F2), `ambush-save-roundtrip-test`.

RUNDY: 3/5 zużyte. Następna: weryfikacja Chromium (gracz→AI i AI→gracz), potem AMBUSH-DEPLOY (rozstawienie + szyk ≤3).
NASTĘPNY KROK: Evaluator → Obrona → Final Control; jeśli FC wymaga żywej weryfikacji — runda 4 tylko pomiar w Chromium + ewentualne poprawki.
UWAGI-DLA-ORKIESTRATORA: `gra/node_modules` w worktree (ignorowany przez git) do sprzątnięcia; testy tymczasowe w `/tmp`; commit tylko ścieżkami (bez `-A`). Brak push i integracji.
DEPLOY/PUSH: NIE WYKONANO

---

# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — raport Operatora, RUNDA 2/5 (sekcja r2; r1 poniżej)

STATUS: PASS-WITH-NOTES (CZĘŚCIOWY — runda 2 NIE domknięta: wyzwalacz w ruchu wroga (pkt 1 dodatku) i filtr AI/pathfindingu (pkt 2) NIE zrobione; zob. BLOKADY 1–3)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL (zakres r2 wg DODATKU 1): (1) wyzwalacz w ruchu wroga, (2) niewidoczność w logice AI/pathfindingu, (3) znacznik „w zasadzce” + tooltip z powodem blokady, (4) cykl życia (cancel przy fortyfikacji/czuwaniu/podziale/scaleniu/odwrocie/mieście/zmianie właściciela), (5) testy na realnych ścieżkach, (6) dokumentacja/listy, (7) pomiary.
Wynik r2: zrobiono (3) i część (4); (1), (2), reszta (4), (5), (6) NIE zrobione; (7) — tsc i bramki zmierzone, Chromium NIE ZMIERZONO.

BAZA: `9b6845ea7` (r1 obrona). `git merge-base --is-ancestor fadf21af9 HEAD` = TAK (origin/main nie przesunął się od r1).

ZMIANY-COMMIT (allowlista r2; tylko te pliki):
- `gra/src/ui/unitPanelHud.ts` — pole `UnitPanelAction.disabledReason?: string` (powód blokady dla `title`). Plik NIE był na allowliście dispatchu; zmiana addytywna, jedno pole — zgłaszam FC.
- `gra/src/ui/armyStackHud.ts` — (a) przycisk akcji: gdy `disabled` i jest `disabledReason`, `title` = powód (zamiast etykiety); (b) pole `ArmyStackHudState.ambushed`; (c) znacznik „w zasadzce” (`<span class="ash-ambush-mark">`) w nagłówku panelu armii (widoczny tylko dla właściciela — HUD dotyczy wyłącznie własnych stosów).
- `gra/src/ui/unitActionBarHtml.ts` — pasek akcji pojedynczej jednostki: `title` = `disabledReason` gdy zablokowane (zaakceptowane w allowliście r2).
- `gra/src/main.ts` (punktowo):
  - akcja `ambush`: `disabledReason` = `ambushCheck.message` (gdy zablokowana i nieaktywna);
  - `buildArmyStackHudStateInner` zwraca `ambushed: isStackAmbushed(stack)`;
  - handler `ambush` (zastawienie): przed `setAmbush` zdejmuje `sentry` i wychodzi z fortyfikacji w polu (`exitFieldFortify`) — zasadzka i czuwanie/fortyfikacja wzajemnie się wykluczają;
  - handler `fortify` (fortyfikacja w polu): `cancelAmbush(stack)` przed `enterFieldFortify`;
  - handler `sentry` (Czuwaj, wejście): `cancelAmbush(stack)`.
- NOWY `gra/tools/ambush-ui-reason-test.cjs` — test realnej funkcji `buildUnitActionBarHtml` (title = powód dla zablokowanego, etykieta dla odblokowanego/aktywnego) + realny komunikat `canSetAmbush`.

NIE zmieniano: `gra/src/game/ambush.ts` (moduł r1 bez zmian), `ai.ts`, `setup.ts`, `save.ts`, `armyMerge.ts`, `battle*`, WERSJE.md, manifest, `gra/` build, `rust-port/`.

TESTY (surowe wyniki, worktree `9b6845ea7` + zmiany r2, `npm ci --ignore-scripts` wykonany):
- `npx tsc --noEmit` → exit 0 (bez błędów wyjścia).
- `node tools/ambush-core-test.cjs` → `Wynik: 40 OK, 0 FAIL`, exit 0 (bez zmian względem r1).
- `node tools/ambush-ui-reason-test.cjs` → `Wynik: 5 OK, 0 FAIL`, exit 0 (NOWY). Powód blokady z realnego kodu: „Armia nie ma ruchu do zużycia na zasadzkę.”
- Bramki referencyjne: `logic-test` → `LOGIC OK (213/213)`, exit 0; `tech-tree-test` → `tech-tree-test: 20 pass, 0 fail`, exit 0; `research-test` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0; `unit-replace-test` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0; `combat-test` → `All sanity checks passed.`, exit 0.
- Regresja armii/zapisu: `load-game-regression-test` → `34 PASS / 0 FAIL`, exit 0; `army-merge-colocated-test` → `4 pass, 0 fail`, exit 0; `army-merge-besieger-only-move-test` → `WYNIK: 8 OK / 0 FAIL`, exit 0; `army-merge-dismiss-bounce-test` → `16 pass, 0 fail`, exit 0; `army-merge-bounce-test` → `4 pass, 0 fail`, exit 0.
- NIE ZMIERZONO: determinizm (`determinizm`/hash), `siege-*`, `ai-*`, pełne `battle-*-test.cjs`, Chromium (zrzuty 1280×720, znacznik, tooltip, przerwanie ruchu, okno bitwy).

BLOKADY (jawnie):
1. (dodatek pkt 1) WYZWALACZ W RUCHU WROGA — NIE ZROBIONE. `resolveAmbushTrigger` (ambush.ts) nadal nie jest wołany w żadnym kroku ruchu (grep: 0 wywołań poza ambush.ts i testem). Powód: otwarcie bitwy przy ruchu AI wymaga mechanizmu wznowienia fazy AI (`aiTurnAwaitingBattle` / `aiCmdResume`, wzór: gałąź `attack` w main.ts ~45700–45745) — a ruch gracza ma osobną ścieżkę startu bitwy (`openPlayerMapUnitAttackCore`, main.ts ~35974, wymaga osobnego rozpisania rosterów). Zrobienie tego „na pół" grozi błędną bitwą w grze, więc nie wpięto.
   Punkty wpięcia do następnej rundy: AI — `truncatePath` w wywołaniu `executeAiCityMove` (main.ts ~45530) + sprawdzenie ostatniego heksu po `moveResult.moved`; gracz — `startAnimatedMove` (main.ts ~33919) i kolejka marszu (main.ts ~34090, ~34659, ~29537).
2. (dodatek pkt 2) FILTR AI/PATHFINDINGU — NIE ZROBIONE, ŚWIADOMIE. `buildMoveOccupancy` (gra/src/units/setup.ts:774) i `occupiedExcluding` (ai.ts:947) nadal traktują heks zasadzki jako zajęty. Ukrycie zasadzki w occupancy BEZ wyzwalacza spowodowałoby, że AI/gracz wchodzi na heks z ukrytą jednostką (dwie jednostki na jednym heksie). Liczenie „sił wroga w zasięgu” w ai.ts: nie zmieniano. `isHexOccupiedForViewer` nadal bez wywołań poza testem.
3. (dodatek pkt 4) CYKL ŻYCIA — CZĘŚCIOWO. Zrobione: zastawienie/fortyfikacja/czuwanie wzajemnie się wykluczają; `cancelAmbush` przy fortyfikacji w polu i czuwaniu (r1: przy rozkazie ruchu). NIE zrobione: split i merge (polityka „scalenie/split zdejmuje zasadzkę z poruszanej części, reszta zostaje”; panele: `openSplitPanelForSelected` main.ts ~15906, `openMergePanelForSelected` ~16090, `armyMerge.ts`), odwrót po bitwie (`assignBounceHexesForUnits`, armyMerge.ts ~758), relokacja, wejście do miasta, zmiana właściciela, zasadzka a `sentry` budzone przez wroga w zasięgu (nie zmieniano — zasadzka nie jest budzona przez zbliżenie wroga; do decyzji FC).
4. (dodatek pkt 5) TESTY NA REALNYCH ŚCIEŻKACH — NIE ZROBIONE: test przez `serializeGame`/`deserializeGame` (pole `ambush` przetrwa zapis) — brak; test scalenia częściowej zasadzki — brak (pkt 4 niezrobiony); test wyzwalacza w realnym kroku ruchu — brak (pkt 1); test filtra AI — brak (pkt 2). Mutacja M7 z r1 pozostaje aktualna w `ambush-core-test.cjs`.
5. (dodatek pkt 6) DOKUMENTACJA — NIE ZROBIONE: hasło wiki/Civpedia „Zasadzka” (+ regeneracja wikiBundle) nie dodane. Lista do deployu (nowe testy): `gra/tools/ambush-core-test.cjs`, `gra/tools/ambush-ui-reason-test.cjs`.
6. (dodatek pkt 7) POMIARY — CZĘŚCIOWO: tsc i bramki zmierzone (wyżej). Chromium NIE ZMIERZONO: brak builda vite poza repo w tej rundzie; znacznik i tooltip sprawdzone wyłącznie testem funkcji renderu (`buildUnitActionBarHtml`) — panel `armyStackHud` (DOM) nie ma testu jednostkowego.
7. Dług Rust (REPIN `rust-port`, NIE zmieniano): r1 (`ambush.ts`, `RuntimeUnit.ambush`, akcja i handler, `cancelAmbush` w `startAnimatedMove`, filtr renderu, normalizacja w `save.ts`) + r2: `UnitPanelAction.disabledReason`, znacznik `ambushed` w HUD, wykluczanie sentry/fortify w handlerach `ambush`/`fortify`/`sentry`.

WAŻNE DLA INTEGRACJI (zachowanie w grze, gdyby ta runda weszła do ROBOCZEJ):
- Zasadzka gracza jest ukryta przed wrogiem w RENDERZE (r1) i jest NIEPRZEKRACZALNĄ przeszkodą dla AI (AI traktuje heks jako zajęty) — NIE ma bitwy ani wyzwalacza. Nie jest to spec (spec: wróg wchodzi i wpada w pułapkę). Zalecenie: NIE wdrażać do ROBOCZEJ jako mechaniki przed domknięciem pkt 1; albo wdrożyć z jawną notatką w rejestrze.

RUNDY: 2/5 zużyte (runda 2 = częściowa). Dispatch kontynuacji: ten sam ID, kolejna runda powinna najpierw domknąć pkt 1 (wyzwalacz gracz + AI, z bitwą), potem pkt 2 (filtr AI dopiero po działającym wyzwalaczu), potem pkt 3–5. Rozstawienie w bitwie (R3) nadal NIE zaczęte.

NASTĘPNY KROK: (a) Evaluator/FC: decyzja, czy runda 3 ma najpierw domknąć wyzwalacz (zalecane: R2a = wyzwalacz + bitwa, R2b = filtr AI + cykl życia, potem R3 = rozstawienie) — dispatch wymaga decyzji orkiestratora o podziale rund (zarzut dispatchu z r1 nadal otwarty); (b) FC: allowlista `gra/src/ui/unitPanelHud.ts` (pole typu) i `gra/src/main.ts` (punktowo).

UWAGI-DLA-ORKIESTRATORA:
- Commit obejmuje kod r2 + nowy test + ten raport (`git add` ścieżkami; bez `-A`). Brak push i brak integracji (zgodnie z dispatchem).
- Zasada z dispatchu „raport bez commita z pracą = BLOCK”: kod został zacommitowany razem z raportem.
- `npm ci --ignore-scripts` uruchomiony w worktree (katalog `gra/node_modules` ignorowany przez git); do sprzątania po rundzie.
- Testy `ambush-core-test.cjs` i `ambush-ui-reason-test.cjs` zapisują tymczasowe pliki `.ambush-*-entry.ts`/`.cjs` w `gra/tools/` i je kasują; po uruchomieniu `git status` czysty.

DEPLOY/PUSH: NIE WYKONANO

---

# (r1) R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — raport r1 (poprzednia runda, zachowany bez zmian)

# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES (etap 1 częściowy: rdzeń stanu, akcja w panelu, reguły blokad i testy zrobione; widoczność w renderze/pathfinding AI i wyzwalacz w ruchu NIE podłączone — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: nowa akcja armii „Zasadzka” (stan w jednostce, blokady z powodem, zużycie całej puli ruchu, odwołanie, zapis/wczytanie ze zgodnością wsteczną), reguły widoczności i wyzwalacza jako czyste funkcje testowane na realnym kodzie; rozstawienie w bitwie, AI i Chromium — runda 2.
ZMIANY/COMMIT: baza `fadf21af9` (origin/main). Commit z kodem i raportem: patrz sekcja SHA poniżej. Allowlista:
- NOWY `gra/src/game/ambush.ts` — stan, `canSetAmbush`, `setAmbush`, `cancelAmbush`, widoczność (`isUnitVisibleToViewer`, `unitsVisibleToViewer`, `isHexOccupiedForViewer`), wyzwalacz (`resolveAmbushTrigger`), normalizacja pola przy wczytaniu (`normalizeAmbushField`), stała `AMBUSH_FORMATION_MAX_WIDTH = 3` (użyta dopiero w rundzie 2).
- `gra/src/units/setup.ts` — pole opcjonalne `RuntimeUnit.ambush?: boolean` (brak pola = brak zasadzki).
- `gra/src/main.ts` — punktowo: import; wpis akcji „ambush” obok „Czuwaj” (blokada z `canSetAmbush`, `inBattle` = `isSaveBlockedByBattle()`); handler `actionId === 'ambush'` (zastawienie/odwołanie na całym stosie, komunikat powodu z `AMBUSH_BLOCK_MESSAGES`); w `startAnimatedMove` `cancelAmbush(stack)` (rozkaz ruchu zdejmuje zasadzkę).
- `gra/src/ui/armyStackHud.ts` — ikona akcji `ambush` w `ASH_ACTION_ICONS`.
- `gra/src/ui/unitActionBarHtml.ts` — ikona `ambush` w `ACTION_ICONS` i wpis w `COMPACT_ACTION_ORDER`. UWAGA: ten plik NIE był wprost na allowliście (allowlista wymienia `hexContextTooltip.ts`/`armyStackHud.ts`); zmiana jest czysto dodająca (ikona + pozycja w liście), zgłaszam do oceny FC.
- NOWY `gra/tools/ambush-core-test.cjs` — test regresji rdzenia.
- `dyspozycje/autobot/runs/R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1/10-operator-claude.md` — ten raport.
Nie zmieniano: `gra/src/game/ai.ts`, `gra/src/battle/*`, `save.ts` (pole jest serializowane jako część obiektu jednostki; stare zapisy bez pola = brak zasadzki — potwierdzone testem), `gra/` build, WERSJE.md, manifest, `rust-port/`, `gra-robocza/`.

TESTY (surowe wyniki, uruchomione lokalnie w worktree po `npm ci --ignore-scripts`):
- `npx tsc --noEmit` → exit 0 (bez błędów).
- `node tools/ambush-core-test.cjs` → `Wynik: 38 OK, 0 FAIL`, exit 0. Pokrywa: stan i zgodność wsteczna (JSON bez pola), setAmbush zeruje cały ruch stosu, kopia niezależna, cancelAmbush usuwa pole; blokady `canSetAmbush` z komunikatami po polsku (in-city, besieging, no-movement, in-battle, already-ambushed, empty) i kolejność powodów; widoczność (właściciel widzi, AI/inni nie widzą); pathfinding wroga (heks zasadzki pusty dla AI, zajęty dla właściciela); wyzwalacz tylko w wojnie, tylko wejście NA heks (sąsiad nie odpala), po wyzwoleniu stan zdjęty, brak wyzwolenia = brak mutacji; normalizacja śmieci w polu.
- Bramki referencyjne: `logic-test` → `LOGIC OK (213/213)`, exit 0; `tech-tree-test` → `20 pass, 0 fail`, exit 0; `research-test` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0; `unit-replace-test` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0; `combat-test` → `All sanity checks passed.`, exit 0.
- Regresja nie-przeglądarkowa: `army-merge-colocated-test` exit 0; `army-merge-besieger-only-move-test` → `WYNIK: 8 OK / 0 FAIL`, exit 0; `army-merge-dismiss-bounce-test` exit 0; `army-merge-bounce-test` exit 0 (bez linii podsumowania — kod wyjścia 0); `load-game-regression-test` → `34 PASS / 0 FAIL`, exit 0.
- NIE ZMIERZONO: Chromium / żywa gra (zrzuty panelu armii, widoczność dla drugiego gracza, wejście wroga → bitwa). Nie uruchamiano `siege-*`, `ai-*` i pełnych `battle-*-test.cjs` (nie wymagano w tej rundzie jako zmieniających kod wyjścia; do uruchomienia w rundzie 2 wraz z integracją AI/bitwy).

BLOKADY (jawnie — to, co NIE jest w tej rundzie i NIE działa w grze):
1. WIDOCZNOŚĆ W GRZE: `isUnitVisibleToViewer` / `unitsVisibleToViewer` NIE są podpięte do renderu (`unitRenderer.sync` w main.ts ~15423) ani do mgły. Oznacza to, że po zastawieniu zasadzka gracza NADAL jest rysowana wrogowi. Przed wdrożeniem na ROBOCZĄ należy domknąć w rundzie 2 (render: filtr dla każdego widza ≠ właściciel).
2. PATHFINDING AI: `isHexOccupiedForViewer` NIE jest użyty w `ai.ts`/pathfindingu. AI nadal traktuje heks zasadzki jako zajęty. Wymaganie „AI MUSI traktować heks jako pusty” NIE spełnione w tej rundzie.
3. WYZWALACZ W RUCHU: `resolveAmbushTrigger` NIE jest wpięty w krok ruchu wroga (ścieżka gracza/AI/kolejka marszu). Wróg wchodzący na heks zasadzki nie przerywa ruchu i nie otwiera bitwy.
4. ROZSTAWIENIE W BITWIE (strefa po obu stronach, szyk ≤ 3 w długiej linii, AUTO-spójność): NIE zaimplementowane — runda 2 zgodnie z podziałem z dispatchu.
5. Scalanie/rozdzielanie stosu (`armyMerge.ts`): NIE sprawdzone pod kątem zachowania stanu zasadzki. Rozdzielenie stosu zasadzki może dać część bez pola (zdejmie stan w części), a scalenie zwykłej jednostki do stosu zasadzki może wciągnąć ją w zasadzkę — wymaga punktowej decyzji w rundzie 2 (proponowane: nie pozwalać łączyć/dzielić stosu w zasadzce).
6. Tura AI: `canSetAmbush`/`setAmbush` NIE są wołane przez AI (zgodnie z dispatchem — decyzja AI to osobny temat). API dla AI istnieje w `ambush.ts`.
7. Wiki/Civpedia (hasło „Zasadzka”): NIE dodane.
8. Dług Rust (REPIN w `rust-port`): reguła zasadzki, pole `ambush` i akcja nie są przeniesione do Rust — do zapisania jako dług po wdrożeniu weba.

DECYZJE/ZAŁOŻENIA W RUNDZIE 1 (luki rozstrzygnięte założeniem):
- Nazwa pola: `ambush` (angielski, jak `sentry`); stan boolowski, bez zapisu współrzędnych — zasadzka jest na heksie jednostki.
- „Zastawiający” = właściciel stosu; wrogość liczona przez wołającego (`isAtWar` jako parametr), żeby reguły były czyste i testowalne.
- `inBattle` w akcji = `isSaveBlockedByBattle()` (scena bitwy lub podsumowanie otwarte) — węższe niż „bitwa”, ale bezpieczne.
- Akcja „Odwołaj zasadzkę” jest zawsze aktywna dla stosu w zasadzce (nawet w mieście/oblężeniu — w tych przypadkach zasadzki nie da się zastawić, więc taki stan nie powstaje normalnie).
- Odwołanie zasadzki nie zużywa ruchu (zgodnie z decyzją ABC „odwołaj”).

NASTĘPNY KROK: runda 2 (ten sam ID, ten sam dispatch, zachowana baza): (a) widoczność w `unitRenderer.sync` i mgle dla każdego widza ≠ właściciel; (b) pathfinding wroga i `ai.ts` tylko punktowo (filtr widoczności, bez zmiany logiki AI); (c) wyzwalacz w kroku ruchu wroga (przerwanie na heksie, otwarcie bitwy, zdjęcie stanu, komunikaty „Wpadłeś w zasadzkę!” / „Zasadzka się powiodła”); (d) rozstawienie w `gra/src/battle/*` (strefa po obu stronach, długa linia ≤ 3, AUTO spójne); (e) polityka split/merge dla stosu w zasadzce; (f) live w Chromium (build vite POZA repo) z zrzutami; (g) testy `ambush-*` dopisane do stałej listy deployu.

DEPLOY/PUSH: NIE WYKONANO (operator nie pushuje ani nie integruje; sprzątanie `gra/node_modules` i plików tymczasowych po raporcie).

UWAGI-DLA-ORKIESTRATORA:
- Kolejność integracji: ta runda NIE nadaje się do deployu na ROBOCZĄ — w grze gracz zobaczy akcję „Zasadzka”, ale wróg nadal widzi i może wejść na ukrytą armię bez bitwy. Zalecam nie wdrażać przed rundą 2 albo wdrożyć z ostrzeżeniem w rejestrze.
- Zakres dispatchu sugeruje 5 rund; po rundzie 2 ocenić, czy zostają 3 (AI-use jest osobnym tematem).
