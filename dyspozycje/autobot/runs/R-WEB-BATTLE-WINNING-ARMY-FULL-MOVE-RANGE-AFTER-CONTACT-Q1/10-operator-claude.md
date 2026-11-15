# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — raport Operatora (runda 1/5)

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
