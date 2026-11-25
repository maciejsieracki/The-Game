STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D1 (kategoria D, połowa 1/2: pierwsze 25 testów kat. D z tabeli 43-stan-156-r5.md, bez climate-band-test)
GOAL: każdy z 25 testów sklasyfikowany i uruchomiony solo na bazie f96787fb7; naprawy tylko STARY-PIN i HARNESS (asercje nie osłabione); bramki zielone.

BAZA: f96787fb70da4086f9b25487cc4b6c62a2127610 (origin/main, FALA 892), worktree --detach.
ZMIANY-COMMIT: 16 plików gra/tools/*-test.cjs (allowlista, git add po ścieżkach), +72/-25. SHA commita: patrz pole `sha` w StructuredOutput (czubek tej pracy). Brak zmian w gra/src i gra/data. Brak zmian w climate-band-test.cjs i testach generatora map.

## Tabela 25 testów (kat. D, kolejność z 43-stan-156-r5.md)

Przed = wynik solo na bazie (surowe wyjście). Po = wynik po zmianach (surowe wyjście, exit).

| # | test | przed | klasyfikacja | co zmieniono | po |
|---|---|---|---|---|---|
| 1 | administracja-stolica-test.cjs | exit 1: 52 OK / 1 FAIL („Sąd w stolicy: ready, brak blokady lokalizacji”) | STARY-PIN | Sąd ma koszt_surowce 50 x2 (FALA2) x4 (era III) = 400/zasób (AF4 00b1b391b, buildingEraCostMultiplier); pin zapasu 99 zastąpiony 1000, asercja bez zmian | exit 0: 53 OK / 0 FAIL |
| 2 | ai-army-replacement-concentration-test.cjs | exit 1: 34 passed / 1 failed (`pomiar: bez bramki >10% marszow`) | NIE-ZMIERZONO | nic | exit 1, bez zmian: zmierzone mutacja 0,091 (próg >0,10); PO 0,025 < 0,5 x mut PASS. Decyzja: próg 10% przy 2 ziarnach vs 9,1% zmierzone (obniżenie progu = osłabienie, nie robiono) |
| 3 | ai-balans-step3-test.cjs | exit 1: T1d `prog_koszt_x L3 = 70 (got 80)` | STARY-PIN | data/ai-params.json cuda_poziom3_prog_koszt_x = 80 (STEP4 70→80); pin T1d 80 | exit 0: 8/0 |
| 4 | ai-city-render-batch-test.cjs | exit 1: AssertionError „dirty city models flush after AI completion/errors” | HARNESS | okno szukania `} catch (eAILoop) {` od barbStart-700 zgniło (catch ~1000 zn. wcześniej po dopisaniu komentarza); szukanie od aiStart, ta sama asercja | exit 0: 17 assertions passed (mutacji nie wykonano) |
| 5 | ai-home-war-sees-own-land-test.cjs | exit 1: fog gate guard (`if (!targetOnOwnTerritory && ...`) | HARNESS | warunek ma teraz wstęp `(cmd).ambush !== true` i łamie linię; szukanie od `&& !targetOnOwnTerritory && !targetNearLostCity && !aiTargetVisibleForAction(` | exit 0: 4/4 |
| 6 | ai-jednostki-tylko-zakup-test.cjs | exit 1: C4 (kind jednostka → shouldAIPurchaseUnit), C6 (`return;` w cityPanel) | HARNESS | C4: okno regexu 900 → 2000 (bramka ~1600 zn. dalej, po komentarzach R-WEB-AI-CITY-GARRISON); C6: `return(?: false)?;` (kod: `return false;`) | exit 0: 45 passed / 0 failed |
| 7 | ai-march-avoid-foreign-territory-test.cjs | exit 1: C7 „prosba znika (0)” got 1 | HARNESS | mutacja C7 niepełna: prośba no-route w scenariuszu wojennym ma drugie źródło (guardedMarchPath, ai.ts:1133-1134); M_REQ_WAR dołożono M_REQ (ten sam wzorzec co C6). Zweryfikowane w kopii tymczasowej: got 0 | exit 0: 99/0 |
| 8 | ai-move-full-range-test.cjs | exit 1: D2 udział ruchów z zapasem PO 19,7% > PRZED 18,8% + 0,5 pp | NIE-ZMIERZONO (decyzja) | nic | exit 1, bez zmian: 19 passed / 1 failed. Delta +0,9 pp (szum sim ±0,5 pp). Do decyzji: akceptacja kosztu R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1 albo rozszerzenie tolerancji (nie zrobiono) |
| 9 | ai-praca-split-parity-test.cjs | exit 1: 3x „farma: got 2, want 1” | STARY-PIN | farma koszt_praca = 20 (data/terrain-improvements.json); budżet 50 mieści 2 farmy (40), 3 (60) nie. Piny 1→2 (cap 50), mutacja cap 25: 1 farma (20 <= 25) | exit 0: 27/0 |
| 10 | ai4-popyt-obywatele-test.cjs | exit 1: 38 passed / 17 failed (Z1h/infrastruktura, Z2d, Z2e-h, Q2a-n) | STARY-PIN (częściowo) + NIE-ZMIERZONO | NIE NAPRAWIONO w tej rundzie. Q2a-n i Z2e-h pinują przełączniki „Tylko pola z obywatelami”/„Wolno wycinać las” USUNIĘTE 2026-11-04 (R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1; src/game/cities.ts:211 — stałe nie istnieją). Z1h/infrastruktura i Z2d (wyjątek złożowy 12,7) — nie zbadane | exit 1: 38 / 17 (bez zmian) |
| 11 | ambush-deploy-wiring-test.cjs | exit 1: `deploy: atkRosterRef.some(...)||ambushSurprised` | HARNESS | main.ts ~38154 używa `scenePlayerRef` (swapSides); pin zaktualizowany, ta sama semantyka | exit 0: 15 OK / 0 FAIL |
| 12 | autoimprove-pasture-irrigation-q2-test.cjs | exit 1: (e) starved=3, firstIrr, farmNoPast (faza wzrostu 24 tury) | NIE-ZMIERZONO (kandydat BŁĄD-GRY?) | nic | exit 1: 14 OK / 3 FAIL (bez zmian). Co sprawdzić: planner pastwiska/irygacji w fazie wzrostu, wpływ FALI 883/890 na pulę żywności |
| 13 | battle-manual-choice-contract-test.cjs | exit 1: wzorzec `deploy: (atk|def)RosterRef.some` count 2 ≠ 3 | HARNESS | wzorzec obejmuje `scenePlayerRef` (main.ts ~38154); count 3 bez zmiany oczekiwania | exit 0: 12/0 |
| 14 | bramki-tmpdir-unikalnosc-test.cjs | exit 1: 169 (teraz 171) trafień STAŁEJ nazwy pod os.tmpdir() | higiena repo (poza kategoriami) | nic — dług higieny w wielu plikach tools/, nie w zakresie tej połowy | exit 1 (171 trafień) |
| 15 | budynki-koszt-pracy-50-test.cjs | exit 1: 2 FAIL po wcześniejszych 68 poziomach (itemCost bez mnożnika ery; liczba rekordów 43; sha koszt_surowce) | STARY-PIN | oczekiwanie × buildingEraCostMultiplier (production.ts:407, AF4); liczba rekordów 43→44 (mury_kamienne, commit a33354586); fingerprint koszt_surowce przepisany WYŁĄCZNIE z powodu tego rekordu (diff vs 331b8bf5e: jedyne NEW = mury_kamienne {drewno 80, kamien 80}); stary sha 4855006679…07dea → db5dbfaab…523 | exit 0: 183 pass / 0 fail |
| 16 | building-detail-card-entitycard-migration-test.cjs | exit 1: 3 FAIL („Praca (jednorazowo)” nie kończy się na „pkt Pracy”; „Przyrost za poziom” +10 pkt Pracy/poziom; brak playerFacingNote(def.uwagi)) | BŁĄD-GRY (kandydat, UI) | nic (kod gry poza zakresem) | exit 1: 52 pass / 3 fail. Patrz UWAGI-1 |
| 17 | city-state-alliance-test.cjs | exit 1: strong: wrog dist=2 — got 1, want 2 | NIE-ZMIERZONO | nic | exit 1: 73 / 1. Co sprawdzić: ai.ts ~5405-5415 (homeGuardCount/minFieldArmyBeforeSend) — dlaczego drugi strażnik nie wychodzi przy maxPerTurn=2 |
| 18 | citypanel-tech-tile-dead-effects-test.cjs | exit 1: [C] Oblężnictwo „Odblokowuje budynek” nie zawiera Katapulty | STARY-PIN | data/tech.json Oblężnictwo „Odblokowuje budynek” = „Warsztat oblężniczy” (Katapulta nie jest w tym wierszu); pin [C] → „Warsztat oblężniczy” | exit 0: 17 pass / 0 fail |
| 19 | civ-matrix-greece-test.cjs | exit 1: 7 FAIL (aggression 0,75 vs 0,8; decideAIDiplomacy war = undefined na easy/normal/hard) | BŁĄD-GRY (kandydat) / DECYZJA | nic | exit 1: PASS 323 / FAIL 6. Patrz UWAGI-2 |
| 20 | cluster-plan-name-test.cjs | exit 1: 4 FAIL (seed 202: brak odrzuconego slotu, reproducer) | NIE-ZMIERZONO | nic | exit 1: 2 passed / 4 failed. Co sprawdzić: czy zmiany generatora/capital-sep (log „obnizono do 5”) zmieniły fixture seed 202; nie zgadywano |
| 21 | commander-star-emblem-test.cjs | exit 1: regex `applyUnitCommanderStar(tokenObj, vitals ? … )` | HARNESS | units.ts ~6211 — wartość w zmiennej `hasCmd`; regex obejmuje oba zapisy, ta sama semantyka | exit 0: 12/0 |
| 22 | conquest-stability-test.cjs | exit 1: `unstable happiness penalty` got 0, want -2 | STARY-PIN | kara G5 usunięta (R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1, właściciel 2026-09-05); funkcja zwraca stałe 0; pin → 0 | exit 0: 29/0 |
| 23 | culture-religion-test.cjs | exit 1: B9 mnoznikHandelPieniadz fallback got 2.3 | STARY-PIN | mnożnik czytany z civ-matrix (meta_mnoznik_waluta, culture-religion.ts ~1311), nie z wiersza civs; B9 używa cywilizacji spoza macierzy | exit 0: 65/0 |
| 24 | currency-test.cjs | exit 1: efekt1 pieniadz got 11, want 10 | STARY-PIN | podział handlu = largest-remainder (splitHandelLargestRemainder, R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1 r2): 15 → 11/3/1 zamiast floor; pin 11 | exit 0: 37/0 |
| 25 | drewno-gate-test.cjs | exit 1: Wojownik Surowiec (ilość) got 13, want 10 (kontrola) | STARY-PIN | units.json Wojownik „Surowiec (ilość)” = 13; kontrola zachowana (Surowiec=Drewno) | exit 0: 20/20 |

Podsumowanie 25: ZIELONE solo po naprawie 16 (wiersze 1,3,4,5,6,7,9,11,13,15,18,21,22,23,24,25); CZERWONE 9 (wiersze 2,8,10,12,14,16,17,19,20).

Naprawy: STARY-PIN 9 (wiersze 1,3,9,15,18,22,23,24,25; wiersz 10 tylko zidentyfikowany, nienaprawiony), HARNESS 7 (wiersze 4,5,6,7,11,13,21). Asercje nie były usuwane ani łagodzone wartościowo; w wierszach 6 i 7 zmieniono okna/wzorce, nie oczekiwane wartości (C7 po poszerzeniu mutacji daje 0 próśb, czyli nadal wymaga zniknięcia wszystkich próśb).
Mutacje czerwone: sprawdzona tylko dla wiersza 7 (kopia tymczasowa, got 0). Dla pozostałych HARNESS nie wykonano mutacji (pozytywny bieg).

## Bramki (surowe wyjście)
- `npx tsc --noEmit` → exit 0
- logic-test → `LOGIC OK (213/213)`, exit 0
- tech-tree-test → `20 pass, 0 fail`, exit 0
- research-test → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
- unit-replace-test → 21 × [OK], 0 FAIL, exit 0
- combat-test → `All sanity checks passed.`, exit 0
- ai-test → `ai-test: 297 passed, 0 failed`, exit 0
- era-war-pairing-alliance-test → `19 pass, 0 fail`, exit 0
- ai-ai-alliance-surcharge-test → `RESULT: ALL GREEN (live + mutants detected)`, exit 0

## UWAGI-DLA-ORKIESTRATORA (kandydaci R-WEB-*, NIE naprawiano — zakaz zmian gra/src)
1. UWAGI-1 (BŁĄD-GRY/UI, karta budynku po migracji entityCards): `src/ui/entityCards/buildingAdapter.ts` — wiersze „Praca (jednorazowo)” mają wartość `N pkt` (bez „Pracy”), „Przyrost za poziom” `+N pkt / poziom`; brak sekcji „Uwagi” (`playerFacingNote(def.uwagi)` zadeklarowane w komentarzu linii 22, nieobecne w kodzie). Test wymaga pełnych etykiet i sekcji Uwagi. Do decyzji: czy to świadoma zmiana tekstu i porzucenie Uwag, czy regresja.
2. UWAGI-2 (BŁĄD-GRY/DECYZJA, civ-matrix): `src/game/civ-ai-data.ts::resolveArchetypeAggression` używa `dip_agresja_archetyp` (Rzymianie 0,75) jako bazy, a `ai_agresywnosc` tylko jako przesunięcia trudności; test (linia 169, komentarz linia 291) oczekuje 0,8 z ai_agresywnosc i zapowiada „reconcile/deprecate before wiring gameplay”. Dodatkowo `decideAIDiplomacy` nie zwraca `wypowiedz_wojne` dla Rzymian na żadnej trudności (warunki scenariusza nie zbadane). Wymaga decyzji właściciela.
3. UWAGI-3 (NIE-ZMIERZONO, ai4-popyt-obywatele): 17 czerwonych w 38/55. Q2 (przełączniki usunięte 2026-11-04) i Z2e-h trzeba przepisać na asercje „przełącznik nie istnieje / zachowanie stałe” — osobny temat testowy (STARY-PIN, zakres ~20 asercji). Z1h/infrastruktura (picker nie identyczny z demandDriven) i Z2d (wyjątek złożowy warzelni soli 12,7) to możliwe BŁĘDY-GRY — nie zbadano.
4. UWAGI-4 (NIE-ZMIERZONO, autoimprove-pasture-irrigation-q2 (e)): faza wzrostu 24 tury, starved=3 — możliwy BŁĄD-GRY (kolejność etapów / pula), wymaga bisect (`tools/autoimprove-pasture-irrigation-q2-bisect.cjs`).
5. UWAGI-5 (NIE-ZMIERZONO, city-state-alliance strong): drugi strażnik nie wychodzi (got 1 zamiast 2) — podejrzenie interakcji z gwarnizonem min. (FALA 857) lub gate fieldArmy.
6. UWAGI-6 (decyzja, ai-move-full-range D2): sztywna tolerancja 0,5 pp przy szumie sim; delta +0,9 pp. Decyzja: tolerancja vs akceptacja kosztu.
7. UWAGI-7 (higiena, bramki-tmpdir-unikalnosc): 171 trafień stałych nazw pod os.tmpdir() w tools/ (wzrost z 169) — osobny temat sprzątania, nie w tej połowie.
8. UWAGI-8 (NIE-ZMIERZONO, cluster-plan-name seed 202): fixture seed 202 nie daje już odrzuconego slotu — do zbadania po POLAR A1 (generator w toku).
9. UWAGI-9 (NIE-ZMIERZONO, ai-army-replacement, próg 10%): zmierzone 9,1% w mutacji; decyzja o progu lub liczbie ziaren.

## RUNDY
1/5 (ta runda). Nie rozpoczęto rundy 2.

## NASTĘPNY KROK
Orkiestrator: (a) decyzje ABC do właściciela: UWAGI-2 (agresja Rzymian / wojna), UWAGI-6 i UWAGI-9 (progi pomiarowe), UWAGI-1 (tekst karty); (b) osobny temat R-WEB-TEST-DEBT-Q14-D1b dla ai4-popyt (Q2 przepisanie) jeśli zatwierdzone; (c) kandydaci BŁĄD-GRY do R-WEB-*: UWAGI-1, UWAGI-2, UWAGI-4, UWAGI-5, UWAGI-3 (Z1h/Z2d).

DEPLOY/PUSH: NIE WYKONANO
