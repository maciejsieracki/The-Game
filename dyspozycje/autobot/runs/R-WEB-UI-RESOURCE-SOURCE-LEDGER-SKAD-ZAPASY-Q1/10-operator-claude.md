STATUS: PASS-WITH-NOTES (CZĘŚCIOWY: partia 2 NIE domknięta; wykonano podpunkt ZUŻYCIE dla utrzymania i obywateli; handel, budowa/rekrutacja, pamięć poza turą — otwarte)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: dziennik „Skąd zapasy” — runda 2/5 = partia 2 (ZUŻYCIE + HANDEL). Ta runda: ZUŻYCIE w turze (utrzymanie budynków, utrzymanie jednostek, zużycie przez obywateli) jako źródła ubytku w księdze; test fixture 30 tur różnica 0; mutacja daje rozjazd.

BAZA: 060e0be6b (FC r1, zawiera partię 1 151658632 + obronę 60afb0e45) + merge origin/main 3d1670626 (FALA 729/730) — merge bez konfliktów, commit ad10b891b (HEAD przed tą pracą).
KOD RUNDY: gra/src/game/resource-ledger.ts, gra/src/game/building-stock-cost.ts, gra/src/main.ts (3 miejsca + import), gra/tools/resource-ledger-consume-test.cjs (nowy).

ZMIANY/COMMIT:
- resource-ledger.ts: nowe rodzaje źródeł utrzymanie_budynkow, utrzymanie_jednostek, obywatele; LedgerCostPart; allocateTakenToLedgerParts (alokacja faktycznie pobranej ilości na części, suma = pobrane); upkeepLedgerParts; citizenLedgerParts; recordTakenToLedger (no-op bez rekordu tury).
- building-stock-cost.ts: deductBuildingStockCostAcrossCities(cities, ownerId, cost, ledger?) — zwraca FAKTYCZNIE pobrane ilości (wcześniej void); opcjonalny zapis do księgi. Logika odjęcia bez zmian.
- main.ts (wiring, bez zmiany wyniku gry):
  (a) utrzymanie gracza — po odjęciu `hResUpkeep` zapis do econ.resourceLedgerByOwner (budynki/jednostki z econ.resourceUpkeepBuildingsByOwner / resourceUpkeepUnitsByOwner);
  (b) utrzymanie AI — analogicznie dla `aiResUpkeep`;
  (c) zużycie obywateli w resolverze citizenUpkeepDrainForOwner — zapis `v.deductions` do księgi właściciela (ta sama tura, econ w zasięgu, tsc OK).
  Oryginalne podciągi wywołań zachowane (przypisanie do stałej przed wywołaniem), bo testy grep building-upkeep-resources-test i citizen-resource-upkeep-test sprawdzają tekst wywołania; te pliki testów są poza allowlistą tematu i nie były edytowane.
- Commit: patrz sekcja SHA w wyniku Operatora (commit tej rundy zawiera wyłącznie powyższe pliki + ten raport).

TESTY (surowe wyniki z tej rundy, zmierzone):
- npx tsc --noEmit (gra/): exit 0 (przed i po zmianach).
- node tools/resource-ledger-test.cjs (partia 1): 1030 passed, 0 failed (a: maks. różnica 0; a-var cap-12: 0; a-var stolarnia: 0). Uwaga: FC r1 podał 1028; zmierzone 1030 na bazie po merge z main.
- node tools/resource-ledger-consume-test.cjs (NOWY, partia 2): 20 passed, 0 failed — allocate (pełne i częściowe pokrycie, nadwyżka), no-op bez tury, sink równy bez sink, księga = pobrane (drewno -60, sól -4), 30 tur × 3 ziarna (7, 2024, 99991): różnica księgi 0; mutacja (pominięcie zapisu utrzymania) — rozjazd > 0 na każdym ziarnie; stan miast identyczny z księgą i bez księgi (30 tur, 3 ziarna).
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN (33/33)
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed.
- git diff --check: czysty (exit 0).
- Testy grep-owe (zmierzone na HEAD i po zmianie, identyczny wynik): building-upkeep-resources-test 47 passed / 1 failed (D10, dług bazowy); citizen-resource-upkeep-test 122 passed / 2 failed (H-anchor na HEAD, F1; dług bazowy). Nie są to nowe regresje.

ZMIERZONO vs NIE ZMIERZONO:
- ZMIERZONO: powyższe testy helperów i tego samego kształtu wywołań co main.ts; brak wpływu na stan (fixture); tsc.
- NIE ZMIERZONO: test (a) w realnej ścieżce gry ≥3 ziarna × 30 tur (pętla main.ts nie działa w node) — NIE wykonano.
- NIE ZMIERZONO: pomiar czasu tury, hash stanu gry, Chromium (kryteria d, e — partia 4).

BLOKADY / CO JESZCZE NIE JEST ZAPISYWANE (dlatego księga w grze NIE jest jeszcze zgodna ze stanem magazynu, mimo zielonego fixture):
1. Zużycie budowy i rekrutacji (deductBuildingStockCostAcrossCities / deductOwnerStockCost w main.ts: ok. wiersze 4835, 4963, 8495, 10276, 44841 z tekstu) — wykonywane POZA tickiem, bez księgi.
2. Handel: przepływ ilościowy tras (main.ts ok. 40166 odjęcie, ok. 40182 zapis do odbiorcy) — bez księgi; decyzja #311: szlak NIE jest źródłem zapasów (nie księgować szlaku). Źródła „Umowa wymiany z <civ>” i „Warzelnia (<miasto>)” — NIE zaimplementowane.
3. Mutacje poza tickiem: łup z bitwy (ok. 36378), prezenty/dary, zdobycie/oddanie miasta, zakupy AI — bez księgi.
4. Wewnątrz tiku: reconcileOwnerResourceCaps (obcięcie do limitu magazynu) i Mennica (drain Złota) — bez księgi.
5. Mechanizm okna „poza tickiem” (pending ledger absorbowany na starcie tury) — NIE zaimplementowany; jest konieczny, by pkt 1–3 weszły do rekordu następnej tury bez utraty zgodności okna.
6. Pamięć N=10 tur w zapisie gry i jej odczyt — partia 3 (nie ruszane).

UWAGI-DLA-ORKIESTRATORA:
- Rozjazd bazy: w poleceniu BAZA/KANDYDAT = 060e0be6b, ale w DODATKU partia 2 = „baza 4d2359e82 + merge main”. 4d2359e82 jest przodkiem 060e0be6b (sprawdzone), więc użyto 060e0be6b (zawiera partię 1 i FC r1) i scalono origin/main 3d1670626. Proszę potwierdzić w następnej rundzie.
- Zakaz edycji testów poza allowlistą: dwa istniejące testy grep-owe (building-upkeep-resources-test, citizen-resource-upkeep-test) sprawdzają tekst wywołań w main.ts; zachowano te teksty, aby nie ruszać plików spoza allowlisty. Gdyby kolejna runda zmieniała te wywołania, trzeba dopuścić te testy do allowlisty.
- Zalecenie na partię 2b: dodać mechanizm „pending” (zob. BLOKADY pkt 5) przed podpinaniem budowy/rekrutacji/handlu — inaczej rekordy z okna między turami trafią do złej tury.
- Dług procesowy: DODATEK FC r1 zarzut 9 nadal aktualny (DODATEK nie był aktualizowany przed partią 2 do bazy tej rundy).
- Zużycie node_modules w gra/ (npm ci, gitignored) — do sprzątania po tematach zgodnie z regułą dysku; wolne ~11 GB po instalacji.

RUNDY: 2/5 (partia 2 z 4 — częściowa). Poprzednia: FC r1 FAIL (060e0be6b).
NASTĘPNY KROK: runda 3 tego samego ID — dokończyć partię 2 (pkt 1–5 BLOKAD: mechanizm pending + budowa/rekrutacja + handel bez szlaku + Umowa wymiany/Warzelnia + test (a) w ścieżce gry jeśli możliwy przez harness), następnie partia 3 (miasto/bitwa/łup/prezent + zapis historii N) i partia 4 (UI + Chromium + perf + hash).
DEPLOY/PUSH: NIE WYKONANO

---

## RUNDA 3/5 (dokończenie partii 2, Operator HAIKU 5.5) — 2026-11-15

STATUS: BLOCK (partia 2 nie domknięta; kod wykonany dla części zakresu, reszta opisana poniżej)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: partia 2 (zużycie + handel w księdze) — zarzuty FC r2 pkt 1–4
BAZA: 6ae20dbb3 (detach), commit kodu 2d28a8b10 (ten raport w commicie następnym)
ZMIANY/COMMIT:
- gra/src/game/resource-ledger.ts — rodzaje źródeł `umowa_wymiany`, `mennica`, `limit_magazynu`; helpery `recordStockDeltaToTurn`, `recordStockDeltaToPending`.
- gra/src/game/turn-economy.ts (advanceCityEconomy) — migawki magazynu wokół `applyMennicaZlotoDrainForOwners` i `reconcileOwnerResourceCaps`; delta zapisywana do `result.resourceLedgerByOwner` (tylko gdy `ledgerEnabled`).
- gra/src/main.ts — (a) import `recordStockDeltaToPending`; (b) `transferBasketItems` (case umowy jednorazowej, transfer `transferSurowiecIlosc`) — delta obu stron do okna pending jako „Umowa wymiany z <civ>”; (c) `applyCyclicDeliveryOutcome` (dostawa cykliczna) — jak wyżej, „Umowa wymiany z <civ>”. Żadnych zmian w E3c (szlak).
- gra/tools/resource-ledger-trade-test.cjs (nowy) — 10/0.
ALLOWLISTA: wszystkie zmienione pliki w allowliście tematu (resource-ledger, turn-economy, main.ts wpięcie, testy `*ledger*`). Testów grep (building-upkeep-resources, citizen-resource-upkeep) NIE edytowano.

TESTY (surowe wyniki, worktree po commicie 2d28a8b10):
- `npx tsc --noEmit` (gra/): exit 0, 0 błędów (po npm ci w gra/).
- `node tools/resource-ledger-trade-test.cjs`: 10 passed, 0 failed, EXIT 0 (nowy).
- `node tools/resource-ledger-test.cjs`: 1030 passed, 0 failed.
- `node tools/resource-ledger-consume-test.cjs`: 30 passed, 0 failed.
- `logic-test`: LOGIC OK (213/213). `tech-tree-test`: 20 pass, 0 fail. `research-test`: 33/33 ALL GREEN. `unit-replace-test`: 21/21. `combat-test`: 6/6.
- Czerwone bazowe (bez regresji, te same liczby co FC r2): `building-upkeep-resources-test` 47 passed / 1 failed; `citizen-resource-upkeep-test` 122 passed / 2 failed.
- `git diff --check`: czysty (exit 0).

BLOKADY (jawna lista; zarzuty FC r2):
1. ZROBIONE CZĘŚCIOWO — zarzut 1 (handel): „Umowa wymiany z <civ>” wpięta w dwa przelewy (jednorazowy i cykliczny). „Warzelnia (<miasto>)” dla soli — NIE ZROBIONE: plon soli z warzelni jest sumą terytorium na miasto (`territoryResourceByCity`), brak rozbicia na budynek; wymaga osobnej zmiany w zbieraniu plonów (poza tym rundą).
2. ZROBIONE — zarzut 2 (reconcile caps i Mennica): zapis delta w turn-economy. Zweryfikowane testem (cap 140→100 = księga −40).
3. NIE ZROBIONE — zarzut 3 (test w realnej ścieżce gry ≥3 ziarna × 30 tur + hash z/bez księgi): główna pętla gry to main.ts (49 548 linii, przeglądarkowa); nie ma harnessu headless w node. NIE ZMIERZONO.
4. NIE ZROBIONE — szlak E3c (main.ts ~40152–40183): nadal przesuwa brąz/żelazo/cegłę (`deductBuildingStockCostAcrossCities` nadawca, `creditOwnerResourceStock` odbiorca) BEZ księgi. Decyzja #311 (tylko premia) i DODATEK (szlak nie jest źródłem) pozostają SPRZECZNE z kodem. Zgodnie z poleceniem NIE zmieniano E3c i NIE księgowano szlaku. Bez decyzji ABC kryterium (a) „różnica 0 dla 9 surowców” jest w realnej grze CZERWONE na szlakach z aktywnym przepływem.
5. NIE ZROBIONE poza zakresem partii 2: łup z bitwy, prezent/dar, zdobycie/oddanie miasta (partia 3); zapis okna pending w zapisie gry (luka znana, partia 3); reszta odjęć z puli (`building-resource-gate.ts`, `unit-replace-cost.ts`) — NIE ZWERYFIKOWANE.
6. Hash stanu gry z księgą i bez, pomiar czasu tury, Chromium — NIE ZMIERZONO (partia 4).

ZMIERZONO vs NIE ZMIERZONO:
- ZMIERZONO: przelew silnika `transferSurowiecIlosc` (prawdziwy moduł) + delta obu stron — suma księgi = zmiana magazynów (30 iteracji, 3 właścicieli, 2 surowce, różnica 0); mutacja bez wpisu biorcy → rozjazd; cap; okno pending → drain; testy referencyjne jw.
- NIE ZMIERZONO: sama ścieżka main.ts (pętla gry), szlak, warzelnia, hash, perf, Chromium.
- ZAŁOŻENIE: kolejność w tickach — `runDiplomacyTurnTick` (main ~40096) wykonuje się przed `advanceCityEconomy` (~40251) w tej samej turze, więc wpisy okna pending z przelewów trafiają do rekordu tej samej tury. Nie zweryfikowano w żywej grze.

UWAGI-DLA-ORKIESTRATORA:
- Decyzja ABC potrzebna (pytanie do właściciela, bez mojego rozstrzygania): E3c szlak — (A) usunąć przesuw zapasów szlakiem zgodnie z #311 (zmiana reguł, osobny temat), albo (B) księgować przepływ szlaku wbrew DODATKOWI (zmienia źródła w zakresie partii). Do czasu decyzji partia 2 nie jest domknięta.
- Test realnej ścieżki (zarzut 3) wymaga harnessu headless dla main.ts — osobny temat tooling; proponuję zgłosić jako dług.
- `gra/node_modules` (npm ci, 71 pakietów) zainstalowany w worktree — do sprzątania po tym temacie.
- Zmiany w main.ts są w trzech miejscach (import + 2 przelewy); żadna linia E3c nie została dotknięta.

RUNDY: 3/5 (partia 2, runda 3 — częściowa: handel jednorazowy i cykliczny + Mennica + cap w księdze; brak warzelni, brak testu realnej ścieżki, szlak zablokowany decyzją).
NASTĘPNY KROK: decyzja ABC szlak E3c → runda 4 tego samego ID: warzelnia (rozbicie plonu soli per budynek), test realnej ścieżki lub jego harness, potem partia 3 (łup/prezent/miasto) i partia 4.
DEPLOY/PUSH: NIE WYKONANO

---

## RUNDA 4/5 (dokończenie PARTII 2, Operator SONNET 5.5 wg DODATKU 3) — 2026-11-15

STATUS: PASS-WITH-NOTES (zarzuty 1, 2, 3, 4, 6, 7 z DODATKU 3 wykonane i zmierzone; partie 3-4 poza zakresem; uwagi niżej)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: partia 2 domknięta — „Warzelnia (<miasto>)”, test zgodności księgi z magazynem w REALNEJ grze (>=3 ziarna x 30 tur, hash z księgą i bez księgi), wpięcie Mennicy/limitu magazynu w silniku, poprawiony test handlu, reset okna pending przy nowej grze, semantyka pending vs tick zmierzona, opis E3c.
BAZA: f44bddb5c + merge origin/main 42a93543a (FALA 731; merge bez konfliktów). Zmiany wyłącznie w allowliście (resource-ledger.ts, turn-economy.ts, main.ts — wpięcie/hak testowy, testy `*ledger*`, runs/<ID>/**). NIE ruszano: E3c (tylko odczyt do haka), WERSJE.md, manifestu, rust-port, UI.

ZMIANY/COMMIT (SHA: patrz wynik Operatora):
- resource-ledger.ts: rodzaje źródeł `warzelnia`, `wycinka`; `setLedgerRecordingEnabled`/`isLedgerRecordingEnabled` (przełącznik zapisu do księgi, TYLKO dla testu „z księgą / bez księgi”, domyślnie włączony; wyłączony = `recordLedgerFlow` nic nie zapisuje, stan gry nietknięty); `ledgerTurnForOwner` (get-or-create rekordu tury).
- turn-economy.ts (`tickEmpireResourcePipeline`, `recordTerrain`): sól (jedyne źródło: ulepszenie `warzelnia_soli`, terrain-improvements.ts:329) księgowana jako `warzelnia|<miasto>` z etykietą „Warzelnia (<miasto>)”, nie jako ogólny „Teren i plony z mapy”. ZAŁOŻENIE: rozbicie jest per MIASTO (suma Warzelni w terytorium miasta), nie per pojedynczy budynek — każda Warzelnia daje stałą stawkę z JSON; NIE ZMIERZONO osobnego wpisu na każdą Warzelnię.
- main.ts (opis każdej zmiany):
  1. import: `recordLedgerFlow, ledgerTurnForOwner, peekPendingLedger, setLedgerRecordingEnabled, isLedgerRecordingEnabled, type ResourceLedgerTurn`.
  2. `doStartGame`: `resetPendingLedger()` zaraz po `resetEndTurnBlockers('doStartGame')` — reset okna przy NOWEJ GRZE (zarzut 6; wczytanie było załatane w r3).
  3. Wycinka lasu (odkryta przez pomiar w realnej grze: stały nieksięgowany przyrost drewna +55/turę u AI): plon wyrębu gracza (pętla `hexClearingStates` w ticku) księgowany do `econ.resourceLedgerByOwner` (`wycinka|<owner>`, „Wycinka lasu”); plon wyrębu AI (komit `wycinka` w turze AI, po ticku) do okna pending przez `pendingLedgerSink`. Wartość = faktycznie wpisane `creditOwnerResourceStock` (po capie).
  4. `ledgerAuditLastTick = econ.resourceLedgerByOwner; ledgerAuditTickSeq++` zaraz po `drainPendingLedgerInto(...)` — czysty odczyt dla haka testowego.
  5. Zmienne `ledgerAuditLastTick`, `ledgerAuditTickSeq`, `ledgerAuditE3cLast`, `ledgerAuditE3cFires` (przed `prepareSessionForLoad`).
  6. E3c: JEDNA instrukcja po `computeTradeRouteResourceFlow` zapamiętująca przepływy ostatniego ticku i licznik odpaleń (tylko pomiar; E3c nie zmieniony, nie księgowany).
  7. Hak `window.__ledgerTestDebug` (tylko `?civTest=1`, ta sama bramka regexem co sąsiednie haki): `snapshot` (magazyn per owner, rekordy ostatniego ticku, okno pending, e3c), `setRecording`, `pendingPeek`, `scenarioSeed` (setup sceny: Cegielnia/Garncarnia/Mennica/Stolarnia/Spichlerz + zapasy + Warzelnia na heksie), `spawnOwnerCity` (miasto AI przez realne `foundCityAt`+`finalizeCityFounding`), `trade` (realne `transferBasketItems`), `cyclicDeliver` (realne `applyCyclicDeliveryOutcome`).
- Testy: `gra/tools/resource-ledger-engine-test.cjs` (nowy, zarzut 3), `gra/tools/resource-ledger-trade-test.cjs` (przepisany), `gra/tools/resource-ledger-live-measure.cjs` (nowy runner pomiaru w Chromium, zarzut 2).

TESTY (surowe wyniki z tej rundy):
- `npx tsc --noEmit` (gra/): exit 0, 0 błędów (po każdej zmianie).
- `resource-ledger-engine-test.cjs` (NOWY, realny `advanceCityEconomy`): 15 passed, 0 failed. Pokrywa: Warzelnia (etykieta „Warzelnia (Lublin)”, sól NIE w „teren|”, księga = delta magazynu), Mennica (`mennica|0` = -1 złota, księga = delta), limit magazynu (`limit-magazynu|0` ujemny, księga = delta). MUTACJA (esbuild: `recordStockDeltaToTurn` = no-op w osobnym bundlu): 6 asercji czerwonych (mennica x3, cap x3) — Mennica i limit są realnie testowane (zarzut 3/4 Evaluatora).
- `resource-ledger-trade-test.cjs` (przepisany): 24 passed, 0 failed. Osobne księgi per właściciel przez okno pending (jak main.ts), 30 iteracji, księga nadawcy = delta jego magazynu, księga biorcy = delta jego magazynu (maks. różnica 0), etykiety „Umowa wymiany z <civ>” wskazują DRUGĄ stronę (-/+), mutacja (pominięcie zapisu biorcy) = rozjazd; sekcja [7]: struktura obu ścieżek w main.ts (migawka PRZED przelewem, 2 zapisy PO, kind i etykieta, brak kind „szlak”), reset w `prepareSessionForLoad` i `doStartGame`, jedno miejsce drenażu.
- `resource-ledger-test.cjs`: 1030 passed, 0 failed. `resource-ledger-consume-test.cjs`: 30 passed, 0 failed.
- 5 bramek referencyjnych: logic-test LOGIC OK (213/213); tech-tree-test 20 pass / 0 fail; research-test 33/33 ALL GREEN; unit-replace-test 21/21; combat-test 6/6.
- Czerwone bazowe (te same liczby co r2/r3, bez regresji): building-upkeep-resources-test 47 passed / 1 failed; citizen-resource-upkeep-test 122 passed / 2 failed.
- Kontrola białych znaków (diff --check): czysta (exit 0). Dysk: 7,2 GB wolnego po instalacji node_modules i buildzie.

POMIAR W REALNEJ GRZE (zarzut 2; ZMIERZONO) — `node tools/resource-ledger-live-measure.cjs --dist /tmp/civ-ledger-dist --seeds 7,2024,99991 --turns 30` (bundle `vite build --outDir /tmp/...`, headless Chromium, `?civTest=1&civSeed=<s>`, realny `doStartGame` i `endTurn`, tryb przyspieszony, Math.random seedowane jak w determinism-save-load-resume-live):
- Niezmiennik per tura/właściciel/surowiec: (magazyn_po - magazyn_przed) - (suma rekordu ticku + okno_pending_po - okno_pending_przed) == 0. Wynik: maks. różnica = 0 dla wszystkich 9 surowców, wszystkich właścicieli, 30 tur x 3 ziarna (7, 2024, 99991); dokładnie 1 tick na endTurn we wszystkich 90 turach; 0 błędów strony.
- Scena „bogata” (aby zadziałały źródła, których pusta gra nie uruchamia): setup PRZED pierwszym snapshotem (nie jest przepływem księgi) — Cegielnia/Garncarnia/Mennica/Stolarnia/Spichlerz, zapasy, Warzelnia soli, DRUGI właściciel (miasto AI założone hakiem `spawnOwnerCity`, bo w headless AI nie zakłada miast przez pierwsze 30 tur — PRZYCZYNY NIE USTALONO). Bez tej sceny (pierwszy pomiar, minimalna gra) różnica też 0, ale wystąpiły tylko 3 rodzaje źródeł; wynik „bogaty” jest właściwym dowodem.
- Mutacja (analiza: pominięcie jednego rodzaju źródła w sumie księgi) => rozjazd > 0 dla KAŻDEGO z 13-14 rodzajów źródeł, które wystąpiły (min. 1 dla `mennica`; seed 7: teren 315, wejście 200, konwersja 225, warzelnia 75, wycinka 220, budowa 290, umowa_wymiany 100, utrzymanie_budynkow 17, obywatele 13, rekrutacja 13, stolarnia 126, spichlerz 10, utrzymanie_jednostek 3, mennica 1).
- Etykiety w żywej grze (kryterium b): sól z Warzelni = „Warzelnia (Rzym)” / „Warzelnia (Miasto Testowe AI)” (po 2250 w 30 turach, seed 7); sól z umowy = „Umowa wymiany z Asyria” (-20 u nadawcy) i „Umowa wymiany z Rzymianie” (+20 u biorcy); to samo dla drewna 100 (umowa jednorazowa, realny `transferBasketItems`) i 40 (cykliczna, realny `applyCyclicDeliveryOutcome`); etykiety obu stron poprawne, różnica 0.
- Hash stanu gry (digest jednostek+miast bez podzialPracy, `__detHarness.digest`) z księgą ON vs bez zapisu księgi (setRecording(false)): seed 7 30/30, seed 2024 30/30, seed 99991 30/30 identyczne w pomiarze końcowym; rekordy księgi w trybie OFF puste. UWAGA UCZCIWIE: w PIERWSZYM pełnym pomiarze seed 99991 dał rozbieżność hasha w turach 30-31 (28/30); powtórzenie tej samej pary dało 30/30, a kontrola ON-vs-ON tego ziarna 30/30. Nie odtworzono; prawdopodobnie sporadyczny niedeterminizm gry niezależny od księgi (źródło NIE USTALONE, NIE rozstrzygnięte). Księga nie zapisuje do stanu gry (tylko odczyty magazynu), więc nie jest podejrzaną.
- Czas tury (orientacyjnie, NIE pomiar kryterium d — to partia 4): średnia ms/turę ON vs OFF: seed 7 450 vs 495; 2024 464 vs 449; 99991 573 vs 703 — różnice w obie strony, w granicach szumu (tryb przyspieszony, 1 maszyna).

SEMANTYKA PENDING VS TICK (zarzut 7; ZMIERZONO + z kodu): przelew umowy wykonany w TRAKCIE tury gracza (po snapshocie „przed”, przed endTurn) trafia do rekordu ticku TEJ SAMEJ tury (turnBefore 4 -> rekord ticku 4->5; wszystkie 3 przelewy x 3 ziarna). Okno pending jest drenowane raz na endTurn w ticku ekonomii (main.ts: `drainPendingLedgerInto(econ.resourceLedgerByOwner)`, jedyne miejsce). Cykliczne dostawy z `runDiplomacyTurnTick()` wołają się PRZED tym drenażem (wywołanie ~40270, drenaż ~40470), więc też wchodzą do rekordu tej tury. Zapisy po ticku (faza AI: zakup/start budowy AI, wycinka AI, jednorazowe umowy AI) czekają w oknie do ticku NASTĘPNEJ tury (np. „budowa|1” -200 w pendingAfter). Semantyka jest spójna z niezmiennikiem (okno wliczone). Akceptowana, opisana; dla UI partii 4: rekord ticku T = „co się wydarzyło od ticku T-1 do ticku T”.

NOWA GRA (zarzut 6; ZMIERZONO): wpis w oknie (2 właścicieli) -> realny `doStartGame` w tej samej sesji -> okno puste (2 -> 0) dla każdego z 3 ziaren.

E3c (zarzut 5; opis, kod NIE zmieniony, NIE księgowane): main.ts (blok „Handel E3c”, pętla `computeTradeRouteResourceFlow`) — w tickach ekonomii (blok gracza, PRZED `advanceCityEconomy`, raz na turę), dla każdej trasy `status === 'polaczony'` i KAŻDEGO surowca z `TRADE_ROUTE_STOCK_FLOW_KEYS` = braz, zelazo, kon, cegla, zloto, SOL, strona z WIĘKSZYM zapasem oddaje CAŁĄ nadwyżkę ponad `minStockReserve` (=2, econ-params `handel_surowiec_min_stock`) stronie z mniejszym (`deductBuildingStockCostAcrossCities` nadawcy + `creditOwnerResourceStock` odbiorcy z capem odbiorcy), bez limitu przepustowości trasy. To jest dokładnie przypadek właściciela „sól w magazynie bez solanki”: SÓL (i koń, złoto) przenosi się szlakiem, co jest sprzeczne z decyzją #311 (szlak = tylko premia, bez przesuwania zapasów). Zinstrumentowano: `__ledgerTestDebug.snapshot().e3cFires/e3cLast` (licznik odpaleń i przepływy ostatniego ticku). ZMIERZONO: w testach 0 odpaleń (scena bez aktywnych tras — NIE ZMIERZONO zachowania E3c pod trasami). PYTANIE ABC DO WŁAŚCICIELA: (A) usunąć E3c (zgodnie z #311; wtedy księga nie ma tego źródła), czy (B) zostawić i księgować jako źródło „Szlak handlowy z <civ>”? Do rozstrzygnięcia zanim partia 3/4 pokaże sól w UI, bo bez księgowania E3c księga rozjedzie się ze stanem, gdy trasy istnieją.

NIEKSIĘGOWANE ŹRÓDŁA ZNANE Z KODU (nie objęte pomiarem — w pomiarze nie wystąpiły; zakres partii 3): łup z bitwy (`creditOwnerResourceStock` ~l.36540), zwrot przy anulowaniu rekrutacji (`cancelRecruitmentPurchase` ~l.5162), zdobycie/oddanie miasta, prezent/dar, E3c (wyżej), zakupy AI za surowce poza ścieżkami już wpiętymi. Test w realnej grze potwierdza zgodność dla źródeł, które FAKTYCZNIE wystąpiły; nie dowodzi braku innych.

RUNDY: 4/5 (Operator Sonnet, uzasadnienie z DODATKU 3: dwie nieudane rundy Haiku r2 i r3). Do limitu zostaje r5.
BLOKADY: brak. Otwarte: ABC E3c (usunąć/księgować), sporadyczny niedeterminizm seed 99991 (nie z księgi), partia 3 (miasto/bitwa/łup/dar + zapis historii N tur) i partia 4 (UI „Skąd zapasy” + zrzut Chromium + pomiar czasu tury + hash) — poza zakresem tej rundy.
NASTĘPNY KROK: FC r4; potem partia 3 (źródła z listy „nieksięgowane” + historia N tur w zapisie) i partia 4 (UI, Chromium, perf); równolegle ABC E3c.
UWAGI-DLA-ORKIESTRATORA: (1) hak `spawnOwnerCity` i `scenarioSeed` są fixture’em sceny (jawnie, tylko `?civTest=1`); dowód „w realnej grze” dotyczy realnych ścieżek ticku/umowy/budowy/utrzymania, nie naturalnej rozgrywki AI; (2) dług Rust: REPIN — księga jest tylko prezentacją (zapisz); (3) sprzątanie: `gra/node_modules` (npm ci, ignorowany przez kontrolę wersji) i `/tmp/civ-ledger-dist` do usunięcia po integracji; (4) dispatch: hak „za isCivTestEnabled” — użyto tej samej bramki regexem `/[?&]civTest=1/` co sąsiednie haki w main.ts.
DEPLOY/PUSH: NIE WYKONANO
