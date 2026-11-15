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
