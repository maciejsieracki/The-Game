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
