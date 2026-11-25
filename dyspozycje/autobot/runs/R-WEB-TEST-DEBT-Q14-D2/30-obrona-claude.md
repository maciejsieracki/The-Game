# R-WEB-TEST-DEBT-Q14-D2 — obrona Operatora (runda 2/5, odpowiedź na raport Evaluatora r1)

STATUS: FAIL
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D2 (kat. D, 2. połowa: 25 wierszy z 43-stan-156-r5.md)
GOAL: przy każdym teście z połowy ustalić przyczynę, sklasyfikować i naprawić tam, gdzie STARY-PIN lub HARNESS, bez osłabiania asercji.
BAZA: kandydat d20de05bdaef7d78db185d20240adaf82106446c (origin/main f96787fb7 + raport r1). Zero zmian w gra/src i gra/data.

## Odpowiedzi na zarzuty Evaluatora

1. PRZYJMUJĘ — kandydat nie zawierał zmian testów. Naprawiono 4 testy wskazane przez Operatora r1 jako STARY-PIN (json-descriptions-sync, plony-budynkow, rydwan-konnica-x2, wojna-wymuszona-parowanie). Każda zmiana ma powołanie na commit/decyzję (niżej). Asercje nie osłabione: dodano wyłącznie jawne wyjątki dla pól zmienionych decyzją, a nie usunięto żadnego porównania.
2. PRZYJMUJĘ — analiza przyczyn dla 20 testów NIE NASTĄPIŁA w tej rundzie. Nie wykonano git log -S ani diffu pinów dla tych testów. Pozostają klasyfikowane jako NIE-ZMIERZONO (bez zgadywania). Zostaje to do rundy 3 (podział na 2–3 paczki, zgodnie z sugestią Evaluatora).
3. PRZYJMUJĘ — json-descriptions-sync: przyczyna była w komunikacie testu. Pola `pwPrzezMoc` i `ogonPokoju` (nowe, celowe) nie były wyjaśnione w teście. Naprawiono (wynik niżej).
4. PRZYJMUJĘ — wojna-wymuszona-parowanie: TypeError (`assignments[0].ownerId` przy pustym wyniku) był skutkiem FAIL S2/S7, nie osobnym błędem. Klasyfikacja STARY-PIN potwierdzona dowodem (commit 69c7a0a25 i 8df9ac864). Naprawiono, TypeError zniknął.
5. PRZYJMUJĘ — klasyfikacje BŁĄD-GRY z r1 (endturn-battle-deadlock-exec, eliminacja-lup-kwoty, zelazo-gate, rydwan-bierny-atak, surrender-rekrutacja, trade-routes-income, fortify-pole) są wyłącznie KANDYDATAMI, bez minimalnego odtworzenia i bez weryfikacji reguły. Oznaczam je jako NIE-ZMIERZONO (kandydat BŁĄD-GRY do weryfikacji), nie jako potwierdzone.
6. PRZYJMUJĘ — unit-stock-cost-test: w tej rundzie uruchomiony ponownie, wynik 58 passed / 0 failed (exit 0). Co go zazieleniło (zmiana na main po Q13 czy #67) NIE ZMIERZONO. Test nie był modyfikowany.
7. PRZYJMUJĘ w części — BLOCK nie miał blokady technicznej (środowisko działało, bramki zielone). Status zmieniam na FAIL: zadanie nie jest zakończone (20 z 25 testów bez klasyfikacji przyczyny).

## Zmiany (allowlista: gra/tools/*-test.cjs z połowy + raport)

| test | przed (r1, solo) | klasyfikacja | co zmieniono | po (solo, surowe) |
|---|---|---|---|---|
| json-descriptions-sync-test | exit 1, 18/1 (a1: war-weariness-params.json) | STARY-PIN | a1: dodano wyjątek dla sekcji `pwPrzezMoc` (R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1, ABC 2026-11-18) i `ogonPokoju` (R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1, ABC 2026-11-18); komentarz R-WEB-TEST-DEBT-Q14 | exit 0, **19 pass / 0 fail** |
| plony-budynkow-test | exit 1, 64/4 | STARY-PIN ×2 (różne przyczyny) | H0 (Biblioteka/Akademia/razem): oczekiwana wartość liczona od PULI Nauki (teren + budynek), bo referencja terenu daje `yldNone.nauka = 1` (stary komentarz „0” był nieaktualny); asercje procentów 30%/20%/50% bez zmian. C (Targowisko): delta Pieniądza 4 → 3, bo podział suwakiem to splitHandelLargestRemainder (R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1 r2), a nie floor() na części; ręczny rachunek w komentarzu przepisany | exit 0, **68 passed / 0 failed** |
| rydwan-konnica-x2-test | exit 1, 4 niezgodności | STARY-PIN | dodano jawną tabelę `DECYZJE_NADPISANIA` z powołaniami: Rydwan (woły) Surowiec/Utrzymanie surowiec = Drewno (e06ad53c8d, Maciej 2026-10-28); Rydwan egipski Atak dystansowy = 10 i Jeździec z oszczepami Atak dystansowy = 14 (fb17e765a, R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1). Migawka BEFORE nietknięta, reszta asercji x2 bez zmian | exit 0, **13 jednostek, 548 asercji, PASS** |
| wojna-wymuszona-parowanie-test | exit 1, S2 i S7 FAIL + TypeError | STARY-PIN | S2 i S7: para istniejąca zmieniona z `stone` na `bronze` (reguła 8df9ac864 r3: Brąz/Żelazo NIE dołącza do pary Kamienia; S5 już używa bronze). Dodano S2b (negatywny przypadek: Żelazo nie dołącza do pary Kamienia, trafia do unresolved, inwariant ECHO sprawdzony) | exit 0, **50 / 0** |

Nazwy zmienionych plików testów: gra/tools/json-descriptions-sync-test.cjs, gra/tools/plony-budynkow-test.cjs, gra/tools/rydwan-konnica-x2-test.cjs, gra/tools/wojna-wymuszona-parowanie-test.cjs.

## Tabela pozostałych testów (bez zmian w tej rundzie)

| test | stan (z r1, nieruszony) | klasyfikacja | uwagi |
|---|---|---|---|
| drewno-gate-test | czerwony 1/20 | NIE-ZMIERZONO | kandydat BŁĄD-GRY do weryfikacji (dostępność Wojownika bez stocku) |
| dyplo-karta-duplikat-komunikat-test | czerwony 12/3 | NIE-ZMIERZONO | E1: 4. wystąpienie prefiksu w main.ts — do decyzji (martwy kod vs oczekiwana liczba) |
| dyplo-pakt-ekspansja-granica-test | czerwony 22/26 | NIE-ZMIERZONO | możliwy STARY-PIN po FALACH 847–892, nie zbadano |
| egypt-movement-precedence-test | czerwony | NIE-ZMIERZONO | bonus płytkiego morza 0,813 vs 0,676 — nie zbadano |
| eliminacja-lup-kwoty-test | czerwony 34/4 | NIE-ZMIERZONO | kandydat BŁĄD-GRY (brak pozycji raportu eliminacji), nieweryfikowany |
| elimination-spectacle-test | czerwony 83/1 | NIE-ZMIERZONO | „tick rekordów po turn++” — nie zbadano |
| endturn-battle-deadlock-exec-test | czerwony 40/9 | NIE-ZMIERZONO | kandydat BŁĄD-GRY, nieweryfikowany |
| epoka-merge-recruit-test | czerwony 5/13 | NIE-ZMIERZONO | możliwy STARY-PIN (lista jednostek bazowych) — nie zbadano |
| fair-play-tier-grid-test | czerwony 9/3 | NIE-ZMIERZONO | możliwy STARY-PIN (progi tieru) — nie zbadano |
| fortify-pole-test | czerwony 39/2 | NIE-ZMIERZONO | hitChance 39 vs 41 — HARNESS lub BŁĄD-GRY, nie zbadano |
| idb-b1b2b3-test | czerwony 19/1 | NIE-ZMIERZONO | środowiskowe (stan localStorage/IDB w Node) — nie zbadano |
| manual-rebalance-owner-era-test | czerwony 4/1 | NIE-ZMIERZONO | ranking epoki właściciela — nie zbadano |
| perf-endturn-ai-phase-equiv-test | czerwony | NIE-ZMIERZONO | asercja w fazie AI — nie zbadano |
| r-bitwa-kolory-gracz-przeciwnik-q1-test | czerwony | NIE-ZMIERZONO | HARNESS lub zmiana kolorów frakcji — nie zbadano |
| rydwan-bierny-atak-test | czerwony 4/2 | NIE-ZMIERZONO | kandydat BŁĄD-GRY (pościg rydwanu), nieweryfikowany |
| stone-research-costs-test | czerwony 47/1 | NIE-ZMIERZONO | możliwy STARY-PIN (lista zatwierdzeń kosztów) — nie zbadano |
| surrender-rekrutacja-build-gate-test | czerwony 10/1 | NIE-ZMIERZONO | kandydat BŁĄD-GRY (zwrot Pracy po surrender), nieweryfikowany |
| trade-routes-income-test | czerwony 133/1 | NIE-ZMIERZONO | H2e: Mennica stolicy — kandydat BŁĄD-GRY lub STARY-PIN, nieweryfikowany |
| unit-stock-cost-test | zielony 58/0 | ZIELONY | przyczyna zazielenienia NIE ZMIERZONO (patrz zarzut 6) |
| war-allin-capital-test | czerwony 96/2 | NIE-ZMIERZONO | możliwy STARY-PIN (hashe po FALACH 891/892) — nie zbadano |
| zelazo-gate-test | czerwony 4/24 | NIE-ZMIERZONO | kandydat BŁĄD-GRY (dostępność Legionisty), nieweryfikowany |

Liczby po rundzie 2: STARY-PIN 4 (naprawione), HARNESS 0, BŁĄD-GRY 0 potwierdzonych (7 kandydatów NIE-ZMIERZONO), OBCIĄŻENIE 0, NIE-ZMIERZONO 19 (w tym 7 kandydatów BŁĄD-GRY), ZIELONY 1, testy zmienione i zielone: 4 (json, plony, rydwan-konnica, wojna). Tabela wiersza `climate-band-test.cjs` nie dotyczy (osobny temat).

## Bramki (surowe wyjście, worktree na d20de05 + zmiany tej rundy)
- tsc --noEmit: exit 0
- logic-test: exit 0, „LOGIC OK (213/213)”
- tech-tree-test: exit 0, „tech-tree-test: 20 pass, 0 fail”
- research-test: exit 0, „ALL GREEN”
- unit-replace-test: exit 0, „WSZYSTKIE TESTY ZIELONE (21/21)”
- combat-test: exit 0, „All sanity checks passed.”
- ai-test: exit 0, „ai-test: 297 passed, 0 failed”
- era-war-pairing-alliance-test: exit 0, „19 pass, 0 fail”
- ai-ai-alliance-surcharge-test: exit 0, „RESULT: ALL GREEN (live + mutants detected)”

## BLOKADY
Brak blokady technicznej. Blokada procesowa: 19 testów NIE-ZMIERZONO wymaga analizy przyczyn, której nie wykonano w tej rundzie.

## UWAGI-DLA-ORKIESTRATORA
- Kandydaci BŁĄD-GRY (do weryfikacji w osobnym tematu R-WEB-*, nie potwierdzone): endturn-battle-deadlock-exec, eliminacja-lup-kwoty, zelazo-gate, rydwan-bierny-atak, surrender-rekrutacja, trade-routes-income, drewno-gate. Fortify-pole: HARNESS lub BŁĄD-GRY.
- Zmiana wartości Rydwana egipskiego/Jeźdźca z oszczepami (fb17e765a) i Surowca woła (e06ad53c8d) to decyzje, których autor nie ma tu zaznaczonych w KOLEJKA-WEB — pinowanie do obecnych wartości opiera się na commitach, nie na zapisie decyzji właściciela w KOLEJKA.
- Połowa 1/2 (wiersze 16–40 kat. D) nie była objęta tym raportem.

NASTĘPNY KROK: runda 3 Operatora do TEGO SAMEGO ID, na 19 testach NIE-ZMIERZONO, w 2–3 paczkach (git log -S na pinowanych wartościach, diff pinów, weryfikacja kandydatów BŁĄD-GRY względem reguł).
RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO
