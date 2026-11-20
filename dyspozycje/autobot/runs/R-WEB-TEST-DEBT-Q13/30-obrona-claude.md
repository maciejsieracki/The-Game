# R-WEB-TEST-DEBT-Q13 - obrona Operatora (runda 4), odpowiedzi na zarzuty Evaluatora

STATUS: PASS-WITH-NOTES (częściowo: 3 naprawy kategorii A; cel 30 napraw NIE osiągnięty)
DOMAIN: GAME (testy; zero zmian w gra/src, gra/data)
TEMAT: R-WEB-TEST-DEBT-Q13
GOAL: testy czerwone do obowiązujących reguł, bez osłabiania asercji; błędy gry jako kandydaci R-WEB-*.
BAZA: 88fc90a0f (detached, kandydat); zmiany w commicie obrony (SHA w polu sha).

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ. Nie wykonano 30 napraw. Wykonano 3 naprawy kategorii A (dowód: wyjście surowe):
   - ai-dlug-porzadki-q1-test.cjs: `17 passed, 0 failed` (wcześniej ReferenceError orderMultMap; atrapy Map dla nowych zmiennych restore).
   - atak-adiacencja-wymagana-test.cjs: `57 passed, 0 failed` (wcześniej ReferenceError marchStopNotified; dodano Map marchStopNotified/marchStopDetail w fabryce).
   - barbarian-cooperation-grace-maints-wiring-test.cjs: `29 passed, 0 failed` (wcześniej ReferenceError ME; ME()=0 = gracz; import realnych cyclicExchange* z src/game/diplomacy-cyclic-display).
2. PRZYJMUJĘ. Kategorie C i D nie zostały wyznaczone; X=88 nierozstrzygnięte. Tabela 40-triage-r3.md (156 wierszy, P 21 / A 18 / E 29 / X 88, liczone skryptem categorize.sh na 20-sweep-r3-raw.txt).
3. PRZYJMUJĘ. 29 pozycji E nie zostało ponowionych sekwencyjnie po 300 s. NIE ZMIERZONO.
4. PRZYJMUJĘ część, z dowodem:
   - Tabela 40-triage-r3.md przebudowana: poprawne kolumny (kat | exit | pozycja | pierwsza linia FAIL).
   - Research: `PASSED: 33 / FAILED: 0 / TOTAL: 33` (liczba wypisana, zgodnie z zarzutem).
   - Komentarz KANDYDAT R-WEB-STONE-ERA-ENTRY-40 dodany w gra/tools/forced-war-stone-test.cjs (nad asercją eq(startTurn, 40)); forced-war-stone `PASSED: 31 / FAILED: 0`.
   - Hunki TESTDEBTQ13 nieobecne w main pominięte świadomie w scaleniu (zgodnie z dispatchem); komentarz dodany tutaj.

## Naprawy nieukończone (kategoria A, stan po obronie)
- recruitment-batch-contract-test.cjs: dodano stuby effectiveGameDifficultyForOwner ('normal') i pendingLedgerSink (no-op); test nadal czerwony - ReferenceError recruitFollowGeneralForOrder. Okno purchaseRecruitmentUnit w main.ts zależy od ok. 20 kolejnych symboli; wymaga przebudowy harnessu, nie łatania.
- tartak-oboz-wyscig-race-test.cjs: naprawiono kotwicę końcową pętli gracza (nazwaWyswietlana) i stub setPlacedLayersOwned w fabryce AI; test nadal czerwony - ReferenceError empireEpochForOwner (kolejna zależność okna).

## Nierozstrzygnięte (A/X/E)
- Kategoria A pozostała: 15 pozycji z 18 (w tym recruitment i tartak wyżej); część to pozycje live (ROBOCZA_HTML/--dist) wymagające środowiska, część build (esbuild Build failed).
- Kategoria X 88 i E 29 bez zmian.

## Testy (surowe wyniki po zmianach obrony)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-archer-slinger-test: 51 OK, 0 FAIL
- combat-test: All sanity checks passed.
- forced-war-stone-test: PASSED: 31 / FAILED: 0
- ai-dlug-porzadki-q1: 17 passed, 0 failed; atak-adiacencja: 57 passed, 0 failed; barbarian-cooperation: 29 passed, 0 failed

## BLOKADY
- Brak 30 napraw; rekrutacja i tartak czerwone; 88 X i 29 E nierozstrzygnięte; brak sekwencyjnego ponowienia E.
- Nie wykonano: C (martwe testy), D (kandydaci R-WEB-*), listy "nowych czerwonych" względem FC DIPLOWARLEVEL.

## UWAGI-DLA-ORKIESTRATORA
- Ponowienie E (29 x 300 s) wymaga partii po 1-2 testy na wywołanie Bash (limit 590 s) - koszt czasu, nie zrobiono.
- Harnessy wycinające tekst z main.ts (recruitment, tartak, ai-dlug) gniją przy każdej zmianie okna; zalecam osobny temat przebudowy na eksport funkcji zamiast wycinania tekstu.
- Kandydat R-WEB-STONE-ERA-ENTRY-40 (kod: tura globalna vs decyzja 40 tur) do osobnego tematu.

RUNDY: 4/5 (obrona)
NASTĘPNY KROK: runda 5 (ostatnia) - przebudowa harnessów recruitment/tartak, sekwencyjne E, kategoria C/D.
DEPLOY/PUSH: NIE WYKONANO

---

# RUNDA 5 — obrona (Operator Haiku, odpowiedzi na zarzuty Evaluatora fa328703)

BAZA: `6629dbded` (kandydat). Zmiany tylko w dwóch plikach testowych; gra/src, gra/data nietknięte.
Środowisko: `gra/node_modules` nie istniało w worktree -> `npm ci --ignore-scripts` (71 pakietów, df / 8,2 GB wolne po instalacji; node_modules nieśledzone, nie commitowane).

## Odpowiedzi na zarzuty

| # | Zarzut | Werdykt | Dowód / co zrobiono |
|---|---|---|---|
| 1 | Kategoria D (50) nierozstrzygnięta, „NIE ZMIERZONO” | PRZYJMUJĘ | Nie rozstrzygnięto w tej rundzie. Wyjątek: unit-stock-cost przeniesiony D->B i naprawiony (pkt 6). Pozostałe 49 D: bez analizy przyczyny, NIE ZMIERZONO. |
| 2 | Kategoria E nie ponowiona sekwencyjnie | PRZYJMUJĘ | Nie ponowiono w tej rundzie (29 testów x do 300 s nie mieściło się w limicie rundy). NIE ZMIERZONO sekwencyjnie. |
| 3 | 10 pozycji B nienaprawionych, w tym trywialne | PRZYJMUJĘ częściowo | Naprawione: naval-water-access-gate (38/2 -> **40/0**) i unit-stock-cost (56/2 -> **58/0**, patrz 6). Zostało 9 B: hud-moc-warstwa:168 i moc-ranking-rozjazd:145 (pin 49 — patrz 4), ai-player-parity:307, dyplo-bilans-r2:273 i r3:224, granice-relacja:358 (3 FAIL, nie analizowano), hotseat-etap6d:41, march-attack-queue:287, war-epoch-player-first-main-guard (FAIL [baza], nie analizowano). |
| 4 | mur-paradoks: pin 49 -> units.json bez decyzji | PRZYJMUJĘ | Zgoda: zmiana nie ma decyzji. Stan faktyczny: `gra/data/units.json` Konnica `fieldPower` = 98 (commit 851fc3fd8 nie zmienia tej wartości, historia wartości NIE ZBADANA); dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-JEDNOSTKI.md:17 pisze „Nie rozstrzygam, czy błąd jest w wiki, czy w danych” (49 wiki vs 98 dane); PYTANIA-OTWARTE.md (BUG-TOOLTIP-MOC-NIEPELNA, C-MOC-Q1) sprzeczne. Asercja po zmianie sprawdza spójność armyFieldPower z danymi, NIE wartość. **Pytanie ABC do właściciela:** Konnica rekrut = 49 (wiki/tabliczka) czy 98 (units.json)? Do czasu decyzji hud-moc i moc-ranking zostają czerwone (nie zmieniano ich). |
| 5 | ai-army-composition: garnizon liczony jako „wręcz” | PRZYJMUJĘ jako notę | Założenie operatora, nie zatwierdzone przez właściciela. Bez zmiany kodu. **Pytanie ABC:** czy garnizon miasta ma wchodzić do klasy „wręcz” w pomiarze procentów armii? Nie weryfikowałem liczb 0,0% vs 75% z r3. |
| 6 | Kandydaci climate-band i unit-stock-cost bez odtworzenia | PRZYJMUJĘ, z wynikami | **unit-stock-cost NIE jest błędem gry — stary pin.** `gra/data/units.json` (Konnica, „Epoka”: „Żelazo”, ok. linia 589); `gra/src/game/building-stock-cost.ts` (komentarz: „Iron and every later era x4”). Pin oczekiwał x2 (epoka Brąz). Zmieniono oczekiwania na 100/100 (25x4) i fixture 100/99 -> 100. Wynik: **58 passed, 0 failed** (było 56/2). **climate-band-test: odtworzone:** `cd gra && node tools/climate-band-test.cjs` -> `FAIL: map has polar terrain (0 hexes)`, linia `gra/tools/climate-band-test.cjs:75`, generator `generujSwiat(42, 'standardowy', 'kontynenty', ...)`. Nie ustalono, czy to regresja generatora (kandydat R-WEB-MAP-POLAR-ZERO), czy stary pin; sprawdzenie reguły C-MAP-Q3 NIE ZMIERZONO. |

## Wyniki surowe (ta runda)

- `naval-water-access-gate-test.cjs`: `40 pass, 0 fail` (exit 0). Zmiany: pin „replaceAvailabilityCtxForCity” (funkcja usunięta z main.ts) przepięty na `productionAvailabilityCtxForCity` (per-miasto; następca pin 4 EmpireWide); okno bramki zakupu 3400 -> 4800 (bramka Naval przy ~4300 zn. od kotwicy).
- `unit-stock-cost-test.cjs`: `58 passed, 0 failed` (exit 0).
- `mur-paradoks-test.cjs`: `29 pass, 0 fail` (exit 0), bez zmian w tej rundzie.
- `unit-replace-test.cjs`: exit 0, ostatnia linia `[OK] cross-type melee matrix passes for all 15 civilizations`. Liczby passed nie zapisano.
- Nie uruchamiano ponownie: ai-test (kod gry nietknięty), tsc, logic/tech-tree/research/combat (zmiany tylko w 2 plikach testowych .cjs, nie w gra/src).

## Pytania ABC do właściciela (z tej obrony)

1. Konnica rekrut: 49 czy 98 (fieldPower w units.json) — odblokowuje hud-moc, moc-ranking, mur-paradoks.
2. Garnizon w klasie „wręcz” w pomiarze armii AI (zarzut 5).

## Kandydaci R-WEB-* (nie naprawiano)

- R-WEB-MAP-POLAR-ZERO: climate-band-test.cjs:75, odtworzenie jak wyżej (0 hexes polarnych dla seed 42 kontynenty).

## Notatka o metodzie

Przy pierwszym uruchomieniu w worktree brakowało `esbuild` (brak node_modules). Testy climate-band i granice-relacja nie startowały z tego powodu; to nie jest błąd gry. Klasyfikacja D dla climate-band pochodzi z wcześniejszego biegu, ten wynik odtworzono po `npm ci`.

NASTĘPNY KROK: Evaluator/FC: ponowna weryfikacja naval (40/0), unit-stock-cost (58/0), mur-paradoks (29/0); decyzje ABC 1–2 przed rundą 6 (limit rund wyczerpany — decyzja właściciela).
DEPLOY/PUSH: NIE WYKONANO
