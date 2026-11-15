# 03-final-control: K5-LOOP-WIEZE rozpoznanie (#96), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1
GOAL: orzeczenie na dowodzie o rozpoznaniu wież oblężniczych (pin `07d2fbd72` vs Rust `62ff9de35`): `01-rozpoznanie.md` (Operator, `6d2548532`) + `02-evaluator.md` (`8a688f074`) + `02a-obrona.md` (`8f342a9d0`).
ZMIANY/COMMIT: wyłącznie ten plik oraz scalenie (merge `1cfcfd204`) łańcucha `6d2548532` z `8f342a9d0`; wszystko w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1/`. Zero zmian w `gra/` i `rust-port/`. SHA końcowy: patrz ostatnia linia raportu w odpowiedzi (commit tego pliku na `1cfcfd204`).
TESTY: NIE_URUCHAMIANO (tryb odczytu). Dowody przez `git show` / `git grep` na `07d2fbd72` i `62ff9de35`.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: (1) przypisać zarzuty 1 i 2 do tematów (poniżej), (2) wpisać wnioski do rejestru, (3) zaktualizować tytuł #146. Bez pytania do właściciela (web rozstrzyga).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Zakres commitów (zweryfikowane samodzielnie)

| Commit | Rodzic | Pliki | Wynik |
|---|---|---|---|
| `6d2548532` (Operator) | `9cbadc54a` | `01-rozpoznanie.md` (+99) | tylko katalog runu |
| `8a688f074` (Evaluator) | `9cbadc54a` | `02-evaluator.md` (+37) | tylko katalog runu |
| `8f342a9d0` (Obrona) | `8a688f074` | `02a-obrona.md` (+100) | tylko katalog runu |
| `1cfcfd204` (scalenie FC) | `8f342a9d0` + `6d2548532` | `01-rozpoznanie.md` (+99) | tylko katalog runu |

`git diff --stat 9cbadc54a 8f342a9d0 -- gra rust-port` puste. Uwaga procesowa: Operator i Evaluator odgałęzili się równolegle od `9cbadc54a` (nie od bazy `62ff9de35` z dispatchu), więc `01-rozpoznanie.md` nie było w łańcuchu `02`/`02a`. Scalone merge'em; treść `01` bez zmian względem `6d2548532`. Odczyt Rust przez `git show 62ff9de35` jest równoważny pracy na worktree z tej bazy.

## 2. Orzeczenia na zarzuty

Zarzuty zweryfikowałem samodzielnie (kod pinu i Rust), nie na słowo Evaluatora ani Obrony.

| Zarzut | Dowód własny | Orzeczenie |
|---|---|---|
| Potwierdzenie odwołań web/Rust, brak obalonych | pin: `_fireOneTower` guard :4227, `pickTowerTarget` :4230-4233, `idx<0` :4234. Rust: `ProdBody::tower_blow` loop.rs:961-970, `unit_cell` :972-974 | ODDAL (zarzut potwierdza raport; bez zmiany). Korekta numeru guardu :4226 -> :4227 przyjęta |
| Zakres commitu `6d2548532`, baza | tabela w sekcji 1 | ODDAL (zgodne; odstępstwo bazy ujawnione w sekcji 0 `01`) |
| ZARZUT 1: szablon strzału wieży ma obrońcę zerowego i łuk Front | `neutral_tower_shot_template` loop.rs:102-150: `hit_arc: Front`, `DefenderCu{melee_defence:0, armor:0}`, `def_mods` 1.0, `def_on_wall:false`, `env` neutralny. `tower_blow_on_target` :246-272 podmienia tylko `defender_state` (hp/morale/flagi). Pin: `_singleBlow` :8809, `cuD = toCombatUnit(defender.bu)` :8814, teren z pozycji obrońcy i atakującego :8832-8834, `hitArc = relativeHit(defender.facing, …)` :8880-8882 | NAPRAW (w dokumencie: przyjęte przez Obronę, pkt 12 -> CZĘŚCIOWO, pkt 18 -> ROZBIEŻNE). Do kodu: wiązać z #109/#147 i #113; rekomendacja przypisania do #146. Web rozstrzyga, nie jest to decyzja gameplay |
| ZARZUT 2: `unit_cell` statyczny | `git grep 'activate\.(q\|r)'` na `62ff9de35`: wyłącznie odczyty (loop.rs:903-904, 948-949, 974, 1131-1136), zero zapisów w `rust-port`. Ruch w oblężeniu = `out_of_scope "oblezenie"`. Pin :4232 czyta żywe `u.q/u.r` | NAPRAW (pkt 8 -> CZĘŚCIOWO, zależne od #123 K5LOOP-RUCH). Nie decyzja gameplay |
| ZARZUT 3: generator wycina `_fireSiegeTowers`/`_destroyTowerAtRow`, stubuje `_fireOneTower` | `p6_siege_tactics_loop_gen.mjs` komentarz nagłówkowy: wycięte z pinu WIEZE-2B1, `_fireOneTower` STUB no-op, `destroyed` niemodelowane (statyczny `wallTileHp`) | NAPRAW w #98 (wektory wyłomu w trakcie bitwy). W raporcie status pkt 5, 6, 16, 17 czytać jako "odczyt kodu + wektory 2B1/2B2/tower_target", nie wektory pętli |
| Informacyjne: `siege_shooter_threats` bez wołającego | `git grep` na `62ff9de35`: poza testami tylko definicja `siege_tactics_approach.rs:107`; `tower_setup_from_units` tylko definicja loop.rs:192 | ODDAL (przyjęte; pkt 24 = BRAK w produkcji, nie NIE_ZMIERZONO) |
| Wniosek główny Operatora | `pick_tower_target`, 0/180/360 ms, lot 380 ms, bramki zgodne z pinem | ODDAL (potwierdzone) |

DO DECYZJI CZŁOWIEKA: brak. Każda luka ma rozstrzygnięcie w pinie (zasada: web najpierw).

## 3. Obowiązująca treść (konsolidacja)

Czytać `01-rozpoznanie.md` z poprawkami z `02a-obrona.md` sekcja 2 (wiersze 8, 12, 18, 24 zastąpione) i sekcją 7 (kolejność). Sekcja 4 `01` ("w zakresie #96/#146 wybór celu jest podpięty, zostaje destroyed i wiring") jest po zarzutach 1 i 2 zawężona: wybór celu jest zgodny w logice, ale (a) pozycje celów są statyczne (zależne od #123), (b) dane obrońcy/łuk/teren w strzale wieży są neutralne (zależne od #109/#147 i #113).

Kolejność robót (obowiązująca):
1. #98 (K5-LOOP-WYLOM): stan `destroyed` w `SiegeEnv`, propagacja wyłomu, wektory wyłomu w trakcie bitwy (generator trzeba rozszerzyć o `_fireSiegeTowers`/`_destroyTowerAtRow` bez stubów).
2. #109/#147 (OUTCOME): `_resolveBlowOutcome` od trafienia wieży.
3. Strzał wieży per cel (obrońca, teren, bród, łuk jak pin :8814, :8832-8834, :8880-8882): rekomendacja = #146 (K5-LOOP-WIEZE-R2), po #109/#147; tytuł #146 zaktualizować (pick_tower_target jest już w ścieżce strzału).
4. #123 (RUCH): zapis `activate.q/r`.
5. #113 (WIRING): `tower_setup_from_units`, `SiegeEnv`, po 1-4. Konsument `siege_shooter_threats` też dopiero tu.

## 4. NIE_ZMIERZONO (bez zgadywania)

- `hp` celu: pin `u.bu.hp` vs Rust `c.hp` (definicje nieporównane).
- Kolejność timerów o równym `due` (wieże vs ruchy): wg kodu tie-break po `id`, brak wektora.
- Pochodzenie `activate.q/r` przy budowie `ProdUnit` (adapter poza `siege_tactics_loop.rs`).
- Testów nie uruchamiano.
