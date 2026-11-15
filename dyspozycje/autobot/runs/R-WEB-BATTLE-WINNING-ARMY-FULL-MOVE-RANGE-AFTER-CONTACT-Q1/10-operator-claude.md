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
