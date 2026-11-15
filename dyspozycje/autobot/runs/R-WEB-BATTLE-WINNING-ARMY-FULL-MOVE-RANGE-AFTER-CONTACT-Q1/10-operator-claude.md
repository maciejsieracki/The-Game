# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — raport Operatora (runda 3/5, SONNET wg DODATKU 3)

STATUS: PASS-WITH-NOTES (część NIEPRODUKTOWA naprawiona i zmierzona; część „cios przy rozbitym wrogu” = DECYZJA ABC A/B/C z liczbami, NIE wdrożona)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: zwycięska armia w AUTO/SKIP ściga rozbitego wroga pełnym zasięgiem ruchu własnej jednostki.
BAZA: b3417d2a7 (origin/main) + merge kandydata 571e07fb5 (refs/keep/R-WEB-WIN-ARMY-r2-obrona; zawiera zatrzask r1 i narzędzia r2); konflikt tylko w raporcie FC (zostawiono wersję z main). Dispatch wskazywał bazę b3417d2a7, który NIE zawiera kodu r1/r2 (to tylko raport FC), więc merge 571e07fb5 był konieczny.

## ZMIANY/COMMIT
- `gra/src/battle/battleScene.ts` (+56/-1), dwie poprawki planera AUTO konnicy:
  1. `_beginAutoBatchPhase` + `_snapshotAutoBatchIntents(…, reservedLanes?)`: gdy arbitraż (`resolveAutoBatchPhase`) UTNIE plan konnicy na kolizji ścieżek z już zaakceptowanym planem innej jednostki tej fali, konnica jest przeplanowana (te same jednostki źródłowe, klon planowania) z polami cudzych zaakceptowanych ścieżek widzianymi jako zajęte, po czym arbitraż liczony jest drugi raz. Piechota i łucznicy planują jak dotąd (szyk W19). Marker mutacji `/*PATH_RESERVE*/ true`.
  2. `RuntimeBattleUnit.cavTrail` + `_cavalryAction`/`_cavManeuverStep`: w ramach jednej aktywacji konnica nie wraca na pole, które już odwiedziła (koniec ping-pongu A-B-A-B, który spalał całą pulę ruchu bez postępu). Marker mutacji `/*CAV_TRAIL*/`.
  Reguły przed wzwarciem, predykat wzwarcia `!rangedBase`, reguła ciosu i zatrzask r1: BEZ ZMIAN.
- `gra/tools/battle-pursuit-move-behavior-test.cjs` (NOWY): test behawioralny na realnej ścieżce AUTO w Chromium, z 2 mutacjami.
- `gra/tools/battle-pursuit-pace-browser-entry.ts`, `battle-pursuit-pace-measure.cjs`: sondy r3 (arbitraż: planned/accepted/blokujący; wykonane `_doMove` z łańcuchem wywołań; log ciosów; trace aktywacji konnicy; scenariusz 3 „konnica 8 vs wręcz 6”; `PP_MUT=1` = zachowanie sprzed r3; `PP_PROTO=A_CAV|A_ALL` = prototyp reguły ciosu tylko do pomiaru).
- `evidence/r3-macierz-pomiarow.txt` + `evidence/r3-*.json.gz` (surowe `moves`, `planWhy`, `arb`, `callers`, `attackLog`, `planTrace`).

## ZMIERZONO (pkt 1 DODATKU 3): przyczyny NIEPRODUKTOWE utraty ruchu konnicy
Metoda: dla każdej aktywacji konnicy atakującej (tury 9–16, jednostka nie rozbita na starcie): kroki = faktyczne `_doMove` poza planowaniem (NIE wiersz rundy: wiersz rundy przypisuje pierwszy krok fali do poprzedniej rundy — artefakt pomiaru z r2), pula = movementPoints (7). Kategorie utraty: `attack` (cios), `blow_stop` (plan kończy się w zasięgu ciosu przy rozbitym wrogu = reguła produktowa), `other_end` (plan kończy się poza zasięgiem ciosu z niewykorzystanym MP), `zero_noattack` (0 kroków, bez ciosu).

Przyczyna 1 (ZMIERZONA; 100% przypadków `other_end` przed poprawką, s3): arbitraż trzyma KAŻDE pole zaplanowane przez wcześniejszą jednostkę fali jako twardą rezerwację (`reserved` w autoBatchPhase.ts), a każda jednostka planuje na migawce startowej, więc konnica jadąca za tym samym uciekinierem co sąsiad miała plan UCIĘTY na pierwszej kolizji (planned 2 → accepted 1). Pomiar s3 przed poprawką: 141 ucięć planów w całej bitwie, z czego 13 konnicy w turach 9–16, wszystkie `kind=path`, blokujący = wcześniej zaplanowana jednostka fali. Zdarzeń „occupied” w wykonaniu 0, więc r2 miał rację co do braku kolizji w wykonaniu; błąd leżał w arbitrażu. Reszta puli przepadała.
Przyczyna 2 (ZMIERZONA po naprawie 1): ping-pong. `_cavManeuverStep` bierze najlepszy sąsiedni kafel NAWET niepoprawiający dystansu; gdy kafle „do przodu” są zajęte, robi krok w bok i kolejnym krokiem wraca (np. 36,79>37,79>36,79>37,79 … 7 kroków, postęp 0). Baza: 1 aktywacja (s3); po samej naprawie 1: 13 aktywacji (rezerwacje zwiększyły blokady); po naprawie 2: 0.
Wiersze `stop=none` z r2: artefakt przesunięcia pierwszego kroku fali + zwykłe ciosy (aktywacja z `_doAttack` nie ma kroków); po poprawce pomiaru nie pozostają jako nieznane.

Odrzucony wariant naprawy 1 — sekwencyjna rezerwacja WSZYSTKICH jednostek podczas planowania: dawał konnicy 92 unikalne pola w s3, ale CZERWIENIŁ bramkę `battle-line-advance-uniform-test` (`FAIL wall/atk: max front spread 3 <= 2`; baza i wariant docelowy bez FAIL). Dlatego wdrożone jest przeplanowanie tylko ucięć konnicy.

## TABELA: konnica (7 MP), tury 9–16, scenariusz 1 (Hastati 8, Łucznik 6, Konnica 4 vs Hastati 14), strona atakująca
Utrata MP wg przyczyny (suma po jednostkach i turach 9–16; „przed” = `PP_MUT=1`, „po” = kod r3):
| przebieg | MP utracone nieproduktowo (other_end + zero_noattack) przed → po | MP w `blow_stop` (reguła produktowa) przed → po | kroki/pula przed → po |
|---|---|---|---|
| skip s1 | 91 → 0 | 96 → 144 | 37/224 (16,5%) → 80/224 (35,7%) |
| skip s2 | 54 → 0 | 71 → 117 | 29/168 (17,3%) → 100/224 (44,6%) |
| skip s3 | 78 → 0 | 90 → 104 | 42/224 (18,8%) → 29/168 (17,3%) |
| watch s1 | 119 → 0 | 59 → 150 | 39/224 (17,4%) → 60/224 (26,8%) |
| watch s2 | 54 → 0 | 71 → 117 | 29/168 (17,3%) → 100/224 (44,6%) |
| watch s3 | 78 → 0 | 90 → 104 | 42/224 (18,8%) → 29/168 (17,3%) |
Uwaga: współczynnik kroki/pula NIE jest porównywalny między „przed” i „po” (trajektorie bitwy się rozchodzą: inna liczba żywych jednostek i ciosów; s3 po: 24 aktywacje zamiast 32), dlatego wiodąca miara to utrata nieproduktowa, która spada do 0 we wszystkich 6 przebiegach (skip i watch, ziarna 1–3). Surowe wiersze: `evidence/r3-macierz-pomiarow.txt`.
CEL BINARNY „konnica ≥ 80% puli, gdy ma wolną drogę”: ZMIERZONY w teście behawioralnym: aktywacje bez ciosu i bez zakończenia w zasięgu ciosu = 133/133 MP (100%) na s1+s2; mutacja PATH_RESERVE→false: 43/182 (23,6%). Cały współczynnik 35–45% (s1, s2) wynika z `blow_stop`, czyli z reguły ciosu (niżej), nie z błędu planera. Uwaga o definicji: „wolna droga” = aktywacja bez ciosu i bez `blow_stop`; wcześniejsza próba zawężenia o „>= 2 wolne pola sąsiednie” została porzucona jako zbędna.
Piechota (scen. 0 „20 vs 10”, skip s1–s2; scen. 1 piechota): wartości PRZED i PO identyczne co do MP (np. scen. 0/2 s1 154/480, s2 168/480) — poprawka dotyczy wyłącznie konnicy. W scen. 2 (12 vs 12) atakujący przegrywa, więc to nie „zwycięska armia”; zwycięskiej piechoty dotyczą scen. 0 i piechota w scen. 1.
Watch vs skip: wyniki bitwy równe w s2 i s3 (round/atkAlive identyczne); s1: watch runda 30, skip 29 — rozjazd obecny też PRZED r3 (watch 29 vs skip 30), nie wprowadzony tu; bramka AUTO=SKIP: 42/0 (niżej).

## TESTY (surowe wyniki)
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0, 0 linii wyjścia.
- Bramki referencyjne po zmianie: logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0.
- `battle-skip-equals-auto-resolve-test.cjs`: `--- 42 ok, 0 fail; CZESC B: DONE`.
- `battle-pace-latch-test.cjs`: `5/5 pass, 0 fail; mutacja MELEE_LATCH wykryta (czerwona)`.
- `battle-line-advance-uniform-test.cjs`: bez FAIL.
- NOWY `battle-pursuit-move-behavior-test.cjs` (ziarna 1,2, skip, tury 9–16): kod: T1 (arbitraż nie tnie planów konnicy; ucięć kolizyjnych 0) ok, T2 (brak ping-pongu) ok, T3 (wolna droga ≥ 80%: 133/133) ok → 3/3. Mutacje (MUSZĄ być czerwone): PATH_RESERVE→false: ucięć 23, wolna droga 23,6% → wykryta; CAV_TRAIL→false: ping-pong w 24 aktywacjach → wykryta. Czerwone-na-bazie = obie mutacje (zachowanie sprzed r3).
- `git diff --check`: czysty.
- Pomiar powtórzony po merge z aktualnym origin/main (b3417d2a7): wszystkie liczby wyżej są z tej bazy.

## PKT 3: REGUŁA CIOSU (wariant A) — PROTOTYP, NIE wdrożona (flaga `PP_PROTO` w narzędziu pomiarowym; kod produkcyjny bez zmian)
Prototyp A_CAV: konnica kończąca krok w zasięgu ciosu przy `_cavAdjacentNonSpear` uderza od razu (zamiast `done()`); A_ALL: dodatkowo `_advanceStep` (piechota) uderza od razu przez `_pickAdjacentTargetByPriority`. Scen. 1, skip, ziarna 1/2/3, strona atakująca, tury 9–16:
| wariant | konnica `blow_stop` MP | konnica kroki/pula | bitwa: runda (s1,s2,s3) / żywi atakujący (s1,s2,s3) |
|---|---|---|---|
| obecny (po poprawce planera) | 144 / 117 / 104 | 35,7% / 44,6% / 17,3% | 29,29,34 / 17,18,9 |
| A_CAV | 0 / 0 / 0 | 44,9% / 27,2% / 41,1% | 15,27,17 / 18,17,18 |
| A_ALL | 0 / 0 / 0 | 54,5% / 51,4% / 53,6% | 22,13,18 / 16,16,17 |
Wnioski z liczb: A usuwa całe `blow_stop`; konnica zamiast „dziobać” uderza (aktywacje konnicy z ciosem i niewykorzystanym MP w turach 9–16: A_CAV 15/19/13, obecny 0/1/5); bitwa kończy się wcześniej (rundy 13–27 zamiast 29–34); zwycięzca bez zmian (atakujący) we wszystkich 9 przebiegach; straty atakującego bez wyraźnego pogorszenia (16–18 żywych; obecny 9–18). AUTO=SKIP pod prototypem A_ALL (zmiana źródła tymczasowa, przywrócona i zweryfikowana `cmp`): `42 ok, 0 fail`. Łucznicy: NIE ZMIERZONO osobno (narzędzie sumuje konnicę i piechotę; w prototypie `_pickAdjacentTargetByPriority` zwraca tylko sąsiadów, więc strzelec w zasięgu dystansowym nie dostaje w tej ścieżce nowego ciosu; `_canAttackFrom` używa `ru.range`, więc każde wdrożenie oparte na tej funkcji MUSI być osobno zmierzone dla łuczników).
PYTANIE ABC DLA WŁAŚCICIELA (część `blow_stop`): A) uderz od razu przy pozostałym MP (liczby wyżej; rekomendacja: zgodne z zapisem ABC z W21 „konnica dobija”); B) przejście na sąsiedni hex bez ciosu (NIE zmierzono — brak w ścieżce prototypu); C) bez zmian (zostaje „dziobanie”: 104–144 MP z ~170–224 puli konnicy w turach 9–16 przy rozbitym wrogu w zasięgu). Predykat wzwarcia `!rangedBase` i reguła ciosu NIE zmienione — DO POTWIERDZENIA.

## BLOKADY / UWAGI-DLA-ORKIESTRATORA
- DYSK: 5,3 GB na starcie, 1,9 GB pod koniec (poniżej wymaganych 6 GB). Spadek pochodzi z innych sesji (/tmp 7,2 GB); ten worktree ~1,1 GB (node_modules 134 MB). Orkiestrator powinien posprzątać przed r4/FC.
- Narzędzie pomiarowe z r2 miało błąd: wiersz rundy przypisuje pierwszy krok fali do poprzedniej rundy (snapshot po `_beginTurn`). Kroki liczone teraz z `callers`.
- Resztka nieproduktowa po poprawce: 0 MP w 6 przebiegach scen. 1. W scen. 3 (konnica-only, tury 1–4, s3) pozostało 10 MP `other_end` (2 z 32 aktywacji, 4,5% puli) — przyczyna NIE_ZMIERZONA, bez ping-pongu.
- Piechota/łucznicy nadal planują z arbitrażem „ucięcie na kolizji” (`other_end` w scen. 0: 25/32 aktywacji, 50/62 MP w s1/s2): NIE zmienione celowo (szyk W19, bramka line-advance); osobny temat, jeśli właściciel zechce.
- Pomiar: jeden scenariusz mieszany, 3 ziarna; wariancja trajektorii duża (s3: 16 vs 9 żywych bez związku z logiką ruchu).
- Docs (`docs/encyklopedia`, wikiBundle) NIE zmieniane (brak zmiany reguły produktowej; hasło o zatrzasku z r1 bez zmian).

## DŁUG RUST (pkt 5, REPIN)
1. (z r1) zatrzask wzwarcia `melee_latched`: sufity `paceCap`/`lineAdvanceCap` nie wracają po pierwszym wzwarciu wręcz.
2. (r3) planer fali AUTO: po arbitrażu plan konnicy ucięty na kolizji ścieżek jest przeplanowany z polami zaakceptowanych ścieżek innych jednostek jako zajętymi, potem arbitraż drugi raz (tylko `mounted`, tylko ucięte); kolejność = kolejność zasobu.
3. (r3) `cav_trail`: w jednej aktywacji konnica manewrująca (`_cavManeuverStep`) nie wchodzi na pola już odwiedzone.
4. (r3, DO DECYZJI) ewentualny wariant A reguły ciosu — dopisać po decyzji właściciela.

RUNDY: 3/5
NASTĘPNY KROK: Evaluator/Final Control r3; pytanie ABC A/B/C (część `blow_stop`) do właściciela; ewentualna r4 z wdrożeniem wybranego wariantu (kod prototypu: `PP_PROTO` w `battle-pursuit-pace-measure.cjs`).
DEPLOY/PUSH: NIE WYKONANO

---

# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — raport Operatora (runda 2/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: zwycięska armia w AUTO/SKIP ściga rozbitego wroga pełnym zasięgiem ruchu własnej jednostki, bez „dziobania”.
Baza: 3ddd5d2c7 (detached; zawiera zatrzask r1 z 80c31eb96). Zmiany r2 tylko w narzędziach pomiaru; `gra/src/**` bez zmian.

## ZMIANY/COMMIT
- `gra/tools/battle-pursuit-pace-browser-entry.ts`: probe powodu przerwania kroku AUTO (`moves`: go / occupied / impassable / plan_end, zajmujący hex, `acted`, pula, sufity), probe powodu końca planowania (`planWhy`), probe „czy w zasięgu ciosu po ostatnim kroku” (`adjInfo`: can, dir, mounted, wrogowie w promieniu 2, R = routed).
- `gra/tools/battle-pursuit-pace-measure.cjs`: zwraca `moves` i `planWhy` w JSON.
- `dyspozycje/autobot/runs/R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1/evidence/r2-konnica-zatrzymania.json`: tabela konnicy (tury 9–16) dla skip s1, powtórki skip s1, watch s1, skip s2, skip s3.
- Ten raport (`10-operator-claude.md`: sekcja r2 na górze, r1 niżej bez zmian).
Brak zmian reguł gry, brak zmian `battleScene.ts`, brak naprawy (patrz DECYZJA).

## ZMIERZONO (ETAP 1 r2, pkt 1 i 3 dispatchu)
Komenda: `PP_SCEN=1 PP_SEEDS=<s> PP_MODES=<skip|watch> node tools/battle-pursuit-pace-measure.cjs`. Scenariusz 1 = mieszana: Hastati 8, Łucznik 6, Konnica 4 vs Hastati 14. W dispatchu „scenariusz 2” to wariant 12 vs 12 bez konnicy, więc mierzono scen. 1, który zawiera konnicę.
Konnica (mp 7, paceCap = None w tych turach, wróg routed): zmierzone dla każdej tury 9–16:

| run | wykonane / pula (tury 9–16) | zatrzymania przy wrogu w zasięgu ciosu (can=true, pozostało 4 MP) | zdarzenia „occupied” |
|---|---|---|---|
| skip s1 | 76/175 = 43,4% | 18 z 25 tur-konnic | 0 |
| skip s1 powtórka | 76/175 = 43,4% (wiersze identyczne) | 18 z 25 | 0 |
| watch s1 | 75/175 = 42,9% | 14 z 25 | 0 |
| skip s2 | 72/182 = 39,6% | 8 z 26 | 0 |
| skip s3 | 61/168 = 36,3% | 7 z 24 | 0 |

Przykład skip s1 (tura: plan → wykonane, stop): t11 atk17 plan 7 → 7 hexów, 0 MP; t12 atk16 plan 3 → 3, 4 MP, can=true, wróg R (def2R); t13 atk17 plan 3 → 3, 4 MP, can=true, def3R+def4R+def5R; t14 atk15 plan 3 → 3, 4 MP, can=true, def3R+def4R. Pula 7 = mp; `attacks` = 0 w tych turach.

Wnioski z liczb:
1. Zajęte pole przez sojusznika (`occupied`) nie jest przyczyną: 0 zdarzeń w 5 przebiegach. Pomiar obala hipotezę kolizji z `_resolveAutoBatchMovement` z FC r1.
2. Sufit tempa nie jest przyczyną w tych turach (paceCap = None; zatrzask r1 działa).
3. Główna przyczyna (zmierzona): po wykonaniu kroku konnica staje w zasięgu ciosu przy rozbitym (routed) wrogu i kończy aktywację z 4 MP niewykorzystanymi. Kod: `_advanceStep` po `_doMove` ma `if (this._canAttackFrom(ru, ru.q, ru.r)) { done(); return; }` (komentarz: „the blow happens on a later turn”). Cios nie pada (attacks = 0), a w fazie wroga rozbity wróg ucieka, więc w następnej turze konnica znów idzie 3 kroki i znów staje w zasięgu. Stąd obraz „dziobania”: 3 hexy na turę zamiast 7.
4. Pozostałe przerwania z MP (np. t9 atk14 plan 4, 2 MP; t10 atk15 plan 1, 6 MP; can=false, brak wroga w promieniu 2): NIE_ZMIERZONO, która gałąź planera je zwraca. Sondy na `_compactAttackAllowsStep`, `_lineAdvanceWithinCap`, BFS/greedy, `_nearestEnemy` i `_advanceStep` nie zarejestrowały ich dla konnicy (rejestrowały tylko piechotę). Zakres: 4 z 25 tur-konnic w skip s1.
5. Proporcja przy pełnej swobodzie drogi (dispatch: cel ≥80%): NIE_ZMIERZONE w tym scenariuszu, bo w większości tur konnica miała wroga w pobliżu. W turach bez wroga w zasięgu wykonanie = plan (np. t11 atk15: plan 7 → 7).

## DECYZJA (DECISION_REQUIRED, pkt 2 dispatchu: naprawa wymaga zmiany reguły produktowej)
Przyczyna jest w regule walki (kiedy jednostka może zadać cios), nie w kolizji i nie w sufitach tempa, więc nie zmieniam jej bez zgody właściciela. Warianty z liczbami:
- A (rekomendacja): konnica w zasięgu ciosu wroga rozbitego, mając pozostałe MP, zadaje cios od razu i kończy aktywację. Zgodne z zapisem ABC z W21 („konnica dobija”), którego obecny kod nie realizuje (0 ciosów konnicy w tych turach). Oczekiwany skutek: ~4 MP wraca do ruchu w turach ze stykiem (skip s1: 18 z 25 tur).
- B: po dojściu do zasięgu konnica przechodzi na sąsiedni hex przy wrogu (bez ciosu), zużywając MP. Dłuższe chodzenie wokół rozbitego wroga; mniej wiarygodne.
- C: bez zmiany; „dziobanie” pozostaje, zapis właściciela z 2026-11-14 pozostaje niespełniony.
Pytanie ABC do właściciela: A / B / C. Do czasu decyzji nie wdrażam.

## TESTY (surowe wyniki)
- `npx tsc --noEmit` (gra/): EXIT 0.
- `node tools/battle-pace-latch-test.cjs`: `=== battle-pace-latch-test: 5/5 pass, 0 fail; mutacja MELEE_LATCH wykryta (czerwona) ===`.
- `node tools/battle-skip-equals-auto-resolve-test.cjs`: `--- 42 ok, 0 fail; CZESC B: DONE`.
- `git diff --check`: czysty.
- Bramki referencyjne (logic, tech-tree, research, unit-replace, combat) i testy pace/line-advance: NIE URUCHOMIONO ponownie, bo r2 nie zmienia `gra/src/**` (tylko narzędzia pomiaru); wyniki z r1 pozostają.
- Test behawioralny ruchu (pkt 4) i mutacja: NIE WYKONANO, bo nie ma poprawki do zabezpieczenia testem (wariant A/B/C czeka na decyzję).

## BLOKADY
Brak technicznych. Otwarte: decyzja właściciela A/B/C (sekcja DECYZJA) oraz przyczyna części przerwań bez MP (NIE_ZMIERZONO, pkt 4).

## DŁUG RUST (pkt 5)
Brak nowego długu w tej rundzie (brak zmiany reguły). Dług z r1 (UWAGA-3, zatrzask `melee_latched` do REPIN) pozostaje. Jeśli właściciel wybierze A, dodać REPIN: „cios konnicy w zasięgu wroga rozbitego przy pozostałym MP”.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch r2 zakładał scalenie z origin/main (FALA 727). Tej rundy nie wykonano: pomiar i zmiany są na 3ddd5d2c7. Przed integracją sprawdzić `git merge-base --is-ancestor` i `git merge-tree` (FC r1 podał czysty merge z 6c1687274).
- Dysk: na starcie 4,1 GB wolnego (poniżej 6 GB z dispatchu), w trakcie pracy 9,5 GB (zwolnienie poza tym worktree). Pomiar wykonano na node_modules zainstalowanym w worktree (`npm ci` w gra/, 71 pakietów, gitignored).
- Zgodność z ABC: „pościg bez zmian” z W21 wymaga potwierdzenia, czy wariant A zmienia tę regułę (zmienia moment zadania ciosu).

NASTĘPNY KROK: decyzja właściciela A/B/C; po decyzji Operator r3 (wybrany wariant) z testem behawioralnym (a)–(c) i mutacją.

DEPLOY/PUSH: NIE WYKONANO

---

# RUNDA 1/5 — raport Operatora (archiwum, bez zmian)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: zwycięska armia ma w bitwie AUTO (i SKIP) ścigać rozbitego wroga pełnym zasięgiem ruchu, a nie „dziobać”. Baza: origin/main @ fef330d84 (detached), zmiany w worktree (niezacommitowane do chwili raportu, patrz ZMIANY/COMMIT).

## ZMIERZONO (ETAP 1, pomiar w Chromium, bitwa AUTO przez skip, seed 1)

Pomiar: `gra/tools/battle-pursuit-pace-measure.cjs` (przeglądarka, prawdziwa bitwa 3D, `_doMove` tylko w wykonaniu, nie w planowaniu AUTO). Surowe dane: `evidence/pp-scen0.json`, `evidence/pp-scen1.json` (przed poprawką), `evidence/pp-scen1-fix.json` (po poprawce).

Wariant mieszany (scen. 1: atk Hastati:8, Lucznik:6, Konnica:4 vs def Hastati:14), przed poprawką. Konnica = 7 MP, piechota = 3 MP. Kolumny: tura, kontakt wręcz na początku tury (c0), paceCap konnicy (pc, `None` = +inf), kroki wykonane (st), kroki zaplanowane w AUTO (pl), pula niewykorzystana z poprzedniej tury (lo):

| tura | c0 | pc konnicy | st konnicy (typowo) | pl | lo |
|---|---|---|---|---|---|
| 2–5 | 1 | None | 0 (walka) | 0–1 | 4–7 |
| 6–8 | 1 | None | 1–7 | 0–7 | 0–7 |
| 9 | 0 | None | 3 | 0–2 | 0 |
| 10–16 | 0 | **3** | **3** (każda tura) | 3–7 | 4 |

Wariant jednorodny (scen. 0: Hastati 20 vs 10, bez konnicy): pc = 3 = własna pula ruchu przez cały czas, więc sufit nie ogranicza nikogo. Piechota w turach 11–15 idzie pełnym zasięgiem (3 kroki, 0 ataków). W turach 3–8 ruch ograniczała walka (10–15 ataków na turę, 0–1 kroków).

Wniosek z liczb:
1. HIPOTEZA POTWIERDZONA dla armii mieszanej: po zerwaniu kontaktu (tura 10) sufit tempa wraca do 3 MP, czyli puli najwolniejszej jednostki strony. Konnica (7 MP) jest ucinana do 3 hexów na turę przy 2–3 rozbitych wrogach w zasięgu. Mechanizm to `_paceCapFor` z `cache.contact == false` i `min(movementPoints)` po żywych jednostkach strony.
2. HIPOTEZA NIE DOTYCZY armii jednorodnej: sufit równa się własnej puli, więc nic nie ucina.
3. `_lineAdvanceCap` = +inf (null) dla wszystkich mierzonych jednostek. Przyczyna zmierzona: piechota Hastati ma `rangedBase = true` (dbg `rb`), a `_lineAdvanceCap` zwraca +inf dla `rangedBase` i dla `mounted`. Sufit natarcia rangi jest więc w praktyce nieaktywny dla tych jednostek. To nie jest przyczyna pościgu, ale jest to odnotowane poniżej.

## POPRAWKA (ETAP 2, zatrzask wzwarcia wrecz)

Zmiany w `gra/src/battle/battleScene.ts` (+33/−3):
- nowe pole `_meleeLatched` (domyślnie false), reset w `_startBattle` i `_resetBattleRuntimeState`;
- `_refreshMeleeLatch()` wywoływane na początku każdej tury (po `roundNo++`) i zatrzaskuje flagę przy pierwszym kontakcie wrecz (ta sama definicja co dotychczasowy kontakt tempa, wyniesiona do `_meleeContactNow()`);
- `_paceCapFor`: przy wyliczeniu kontaktu ustawia zatrzask; zwraca +inf, gdy `cache.contact || this._meleeLatched`;
- `_lineAdvanceCap`: zwraca +inf, gdy `this._meleeLatched`.
Przed pierwszym wzwarciem zachowanie jest identyczne (zatrzask nie jest ustawiony). Nie zmieniono reguły „równe tempo do pierwszego wzwarcia”, nie zmieniono predykatu kontaktu (`!rangedBase` zostaje, patrz UWAGI).

Efekt po poprawce (scen. 1, seed 1, ten sam pomiar): sufit konnicy = +inf od tury 3 (`pc = None`). Sufit już nie ucina konnicy po zerwaniu kontaktu (w turze 8 jeden jeździec wykonał pełne 7 kroków). Nie osiągnięto jednak pełnego zasięgu w turach 9–16: kroki wykonane to 1–3 na jednostkę przy zaplanowanych 2–7 i niewykorzystanej puli 4. Ta druga przyczyna nie jest sufitem tempa (patrz UWAGA-1). Poprawka usuwa tylko pierwszą z dwóch zmierzonych przyczyn.

## TESTY (surowe wyniki z wywołań)

- `npx tsc --noEmit` (gra/): EXIT 0.
- `node tools/battle-pace-latch-test.cjs` (nowy): `=== battle-pace-latch-test: 5/5 pass, 0 fail; mutacja MELEE_LATCH wykryta (czerwona) ===`, EXIT 0. Testy: (b) przed wzwarciem sufit = pula piechoty — PASS; (a) po zerwaniu kontaktu konnica bez sufitu — PASS; (a2) sufit natarcia rangi zdjęty — PASS; (a3) `_refreshMeleeLatch` przetrwa zerwanie — PASS; (a4) bez kontaktu zatrzask się nie ustawia — PASS. Mutacja: markery `/*MELEE_LATCH*/` i `/*MELEE_LATCH_LINE*/` zamienione na `false` → test (a) czerwony.
- Czerwone na bazie (`git show HEAD` = fef330d84, bez poprawki): `(a)`, `(a2)`, `(a3)` FAIL; `(b)`, `(a4)` PASS (zachowanie przed wzwarciem bez zmian). Wynik: `=== battle-pace-latch-test: 2/5 pass, 3 fail ... ===`.
- `node tools/battle-pace-equal-line-live-test.cjs`: `=== battle-pace-equal-line-live-test: 23 pass, 0 fail ===`, EXIT 0.
- `node tools/battle-line-advance-uniform-test.cjs`: EXIT 0, 0 linii FAIL.
- `node tools/battle-skip-equals-auto-resolve-test.cjs` (determinizm AUTO vs SKIP): EXIT 0, `--- 42 ok, 0 fail; CZESC B: DONE`.
- `node tools/battle-skip-siege-parity-test.cjs`: EXIT 0, `RESULT pass=17 fail=0`.
- Bramki referencyjne z §6 R-PROC-AUTOBOT: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `All sanity checks passed.`; unit-power-test `6 pass, 0 fail`.
- `git diff --check`: patrz sekcja kontroli przed commitem (wykonana po edycji).

NIE_ZMIERZONO:
- Tryb „watch” (AUTO scenicznie) nie został zmierzony: pomiar obejmował tylko `skip`. Test determinizmu AUTO/SKIP przeszedł, ale to nie jest pomiar tempa w trybie scenicznym.
- Pełny zestaw bitew (seedy 2–3, scen. 2 „równe 12 vs 12”): nie uruchomiono, bo wynik jednego ziarna nie daje rozkładu. Zakres ograniczono do tury/jednostki na jednym ziarnie.
- Efekt biznesowy (liczba zabitych/rozbitych) po poprawce nie jest oceniany; jedna para liczb z jednego ziarna (atk żywych 14→16, tura końca 16→17) nie jest dowodem.

## UWAGI-DLA-ORKIESTRATORA (poza zakresem tego tematu; nie wdrażano)

UWAGA-1 (DECISION_REQUIRED, osobny temat): po poprawce konnica w turach 9–16 idzie 1–3 kroki, mimo że pula to 7, a sufit to +inf. Dane z `pp-scen1-fix.json`: `pl` (kroki zaplanowane w AUTO na klonach) = 2–7, `st` (wykonane) = 1–3, `lo` (niewykorzystana pula) = 4. Przyczyna: `_resolveAutoBatchMovement` przerywa ścieżkę, gdy kolejny hex jest zajęty przez inną jednostkę (`occupant !== ru`) albo nieprzejezdny. Plan AUTO zakłada, że sojusznicy już się przesunęli, a wykonanie idzie sekwencyjnie. To jest blokada kolizji z własnymi jednostkami, a nie sufit tempa. Poprawka zmieniałaby zachowanie ruchu (kolejność wykonania albo ponowne planowanie ścieżki), więc według dispatchu wymaga zgody właściciela.

UWAGA-2 (DECISION_REQUIRED, osobny temat): predykat kontaktu tempa i `_lineAdvanceCap` wykluczają jednostki z `rangedBase === true`. Hastati mają `rangedBase = true` (zmierzone dla wszystkich 60 wierszy), więc walka piechoty Hastati nie zatrzaskuje wzwarcia, a sufit natarcia rangi jest dla nich +inf. Zmiana predykatu zmieniłaby moment „do pierwszego wzwarcia”, czyli regułę zakazaną bez zgody właściciela. Do decyzji: czy wzwarcie ma liczyć każdą walkę wrecz (w tym piechotę z zasięgiem ≥2).

UWAGA-3 (dług Rust): reguła zatrzasku do REPIN w Rust (`pace`/`line-advance` po stronie portu): flaga `melee_latched` ustawiana na początku tury przy pierwszym kontakcie wrecz, reset przy starcie bitwy, sufiksy tempa i natarcia zerowane przy flagi = true. Zapisane tu, bez wykonania.

UWAGA-4 (dokumentacja): w `docs/encyklopedia/**` nie ma hasła o tempie marszu (grep po „tempo marszu / równe tempo” bez trafień), więc nie zmieniano dokumentacji ani `wikiBundle.json`.

UWAGA-5 (nazwa narzędzi): `gra/tools/battle-pursuit-pace-browser-entry.{ts,html}`, `battle-pursuit-pace-measure.cjs`, `battle-pace-latch-test.cjs` spełniają wzorzec allowlisty `*pace*`.

## ZMIANY/COMMIT

- `gra/src/battle/battleScene.ts` (zatrzask: pole, `_meleeContactNow`, `_refreshMeleeLatch`, zmiany w `_paceCapFor`, `_lineAdvanceCap`, `_beginTurn`, `_startBattle`, `_resetBattleRuntimeState`)
- `gra/tools/battle-pace-latch-test.cjs` (nowy test + mutacja)
- `gra/tools/battle-pursuit-pace-browser-entry.ts`, `gra/tools/battle-pursuit-pace-browser-entry.html` (pomiar w przeglądarce)
- `gra/tools/battle-pursuit-pace-measure.cjs` (runner pomiaru)
- `dyspozycje/autobot/runs/R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1/evidence/pp-scen0.json`, `pp-scen1.json`, `pp-scen1-fix.json`
- `dyspozycje/autobot/runs/R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1/10-operator-claude.md` (ten plik)
Commit: patrz SHA w odpowiedzi operatora (commit z tymi plikami, bez `git add -A`).

## BLOKADY

Brak blokad technicznych. Otwarte decyzje: UWAGA-1 i UWAGA-2 (wymagają zgody właściciela). Nie wykonano deployu ani pusha.

## RUNDY

1/5 (Operator, HAIKU 5.5). Ostatni werdykt: brak (runda Operatora).

## NASTĘPNY KROK

Evaluator/Final Control (SONNET) na tym commicie: zweryfikować pomiar (ETAP 1), test (a)–(c) z mutacją i bramki. Decyzja właściciela o UWAGA-1 i UWAGA-2 przed ewentualną dalszą pracą nad ruchem.

DEPLOY/PUSH: NIE WYKONANO
