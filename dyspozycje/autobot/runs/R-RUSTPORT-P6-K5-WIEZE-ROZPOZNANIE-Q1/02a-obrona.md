# 02a-obrona: K5-LOOP-WIEZE rozpoznanie (#96), runda 1 — obrona Operatora

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1 (tylko odczyt, bez kodu)
GOAL: odpowiedź na zarzuty z `02-evaluator.md` (commit `8a688f074`): każdy zarzut PRZYJMUJĘ (poprawka tekstu raportu + dowód) albo ODRZUCAM (dowód z pinu/parity). Poprawki są w tym pliku; `01-rozpoznanie.md` (commit `6d2548532`) pozostaje nietknięty, a sekcja „Poprawione wiersze" zastępuje wskazane wiersze.
ZMIANY/COMMIT: wyłącznie ten plik w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1/`. Zero zmian w `gra/` i `rust-port/`.
TESTY: NIE_URUCHAMIANO (tryb odczytu; bez cargo/npm). Dowody: `git show` / `git grep` na `07d2fbd72` (pin) i `62ff9de35` (Rust).
BLOKADY: brak.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control z tym plikiem i `01-rozpoznanie.md` + poprawkami z sekcji 2. Decyzja orkiestratora, do którego tematu przypisać zarzuty 1 i 2 (sekcja 5).
DEPLOY/PUSH: NIE WYKONANO.

Baza tego pliku: `8a688f074` (fast-forward z `9cbadc54a`), żeby zachować łańcuch commitów runu. `01-rozpoznanie.md` jest tylko w `6d2548532`, więc odczyt tego pliku idzie przez `git show 6d2548532:...`.

## 1. Odpowiedzi na zarzuty

| Zarzut (02-evaluator) | Decyzja | Dowód / skutek |
|---|---|---|
| Potwierdzenia odwołań web i Rust (pkt 1-5 Evaluatora) | PRZYJMUJĘ (potwierdzenie, bez zmiany) | Evaluator sprawdził zgodnie z odczytem Operatora. Brak obalonych odwołań. |
| Zakres commitu `6d2548532` i baza | PRZYJMUJĘ (bez zmiany) | `git show --stat 6d2548532`: jeden plik. Rodzic `9cbadc54a`. Sekcja 0 `01-rozpoznanie.md` to ujawnia. |
| Zarzut 1: szablon strzału wieży ma zerowego obrońcę i łuk Front | PRZYJMUJĘ | Dowód w sekcji 3 poniżej. Pkt 12 → CZĘŚCIOWO, pkt 18 → ROZBIEŻNE. |
| Zarzut 2: pozycja celu z `unit_cell` jest statyczna | PRZYJMUJĘ | Dowód w sekcji 4. Pkt 8 → CZĘŚCIOWO, sekcja 6 bez „NIE_ZMIERZONO" dla tej pozycji. |
| Zarzut 3: generator wycina `_fireSiegeTowers` i stubuje `_fireOneTower` | PRZYJMUJĘ | Dowód w sekcji 5 poniżej. Dopisane w sekcji 3 i 5. |
| Informacyjne: `siege_shooter_threats` bez produkcyjnego wołającego | PRZYJMUJĘ, z doprecyzowaniem | Sprawdzone `git grep` (sekcja 6). Pkt 24 to BRAK w produkcji, nie NIE_ZMIERZONO. |
| Wniosek główny (pick_tower_target, 0/180/360 ms, lot 380 ms, bramki) | PRZYJMUJĘ (bez zmiany) | Zgodne z pinem. Kolejność #98 → #109/#147 → #113 utrzymana, z dopiskiem z zarzutów 1 i 2. |

Korekta numeru (nie zarzut Evaluatora, ale wykryta przy weryfikacji): guard `if (this.finished || t.destroyed) return;` w `_fireOneTower` jest w pinie w linii **4227** (`:4226` to sygnatura `): void {`). Pozostałe numery z `01-rozpoznanie.md` zgadzają się w granicach ±1.

## 2. Poprawione wiersze tabeli (zastępują wiersze z `01-rozpoznanie.md` sekcja 2)

| # | Krok (web) | Web (pin 07d2fbd72) | Rust (62ff9de35) | Status (poprawiony) |
|---|---|---|---|---|
| 8 | Filtr żywych atakujących + pozycja celu | :4229 (filtr), :4230-4233 (`pickTowerTarget(…, enemies.map(u => ({q: u.q, r: u.r, hp: u.bu.hp})))`, ŻYWE `u.q/u.r` w :4232) | `pick_tower_for_row` loop.rs:382-404; pozycja z `unit_cell` = `pu.activate.q/r` (loop.rs:972-974), wartość statyczna z konfiguracji | CZĘŚCIOWO. Filtr OK; pozycja nieaktualna po ruchu (zarzut 2, zależne od #123) |
| 12 | Strzelec syntetyczny i szablon ciosu | :4236-4246; `_singleBlow` :8809 | `tower_shot_from_row` loop.rs:227-240 nadpisuje tylko `attacker`. Szablon `neutral_tower_shot_template` loop.rs:102-150: `hit_arc: Front` (:105), `defender` zerowy (:122-131), `def_on_wall: false` (:133), `env` neutralny (:139-152). Szablon liczony raz na wieżę | CZĘŚCIOWO. Strzelec (kategoria, HP, stats) OK; dane obrońcy i łuk ROZBIEŻNE (zarzut 1) |
| 18 | `_singleBlow(shooter, target, true)`: HP i zabicie | :4264; `_singleBlow` :8809, `cuD` :8814, teren :8833-8834, łuk `relativeHit` :8880-8883 | `tower_blow_on_target` loop.rs:246-272 podmienia tylko `defender_state` (hp, morale, flagi); `single_blow_full` dostaje zerowego obrońcę i łuk Front. Produkcyjne `ProdBody::tower_blow` loop.rs:961-970 przekazuje ten sam szablon | ROZBIEŻNE. Zapis HP i zabicie OK; obrażenia liczone bez obrony/pancerza celu, bez terenu i brodu, łuk zawsze Front (zarzut 1). Efekty `_resolveBlowOutcome` nadal w `unported` (#109/#147) |
| 24 | Wieże jako strefa zagrożenia dla AI | :7924-7937 | `siege_shooter_threats` `siege_tactics_approach.rs:107` (definicja). Poza testami brak wołającego w `rust-port/**/src` (sprawdzone) | BRAK w produkcji (potwierdzone; nie NIE_ZMIERZONO). Zależne od #98 |

Wiersze 1-7, 9-11, 13-17, 19-23 z `01-rozpoznanie.md` bez zmian. Wiersz 13 (`tower_setup_from_units`) potwierdzony: brak wołającego produkcyjnego (loop.rs:192 definicja, reszta w testach).

## 3. Zarzut 1 — szablon strzału wieży (PRZYJMUJĘ)

Dowody (Rust, 62ff9de35, `rust-port/engine/src/domain/siege_tactics_loop.rs`):
- `neutral_tower_shot_template` (:102-150): `hit_arc: HitArc::Front` (:105), `defender: DefenderCu { melee_defence: 0, armor: 0, … }` (:122-131), `def_on_wall: false` (:133), `def_mods` 1.0, `env` neutralny (:139-152: brak brodu, brzegu, rzeki, `brod_kara_obrona: 0`).
- `tower_shot_from_row` (:227-240) zmienia tylko `tmpl.attacker`.
- `tower_blow_on_target` (:246-272) ustawia `input.defender_state` z `st.unit(tref).c` i wywołuje `single_blow_full(&input, rolls)`. Obrońcy (`defender`), teren i łuk nie są przeliczane per cel.
- `ProdBody::tower_blow` (:961-970) przekazuje ten sam `tmpl` do `tower_blow_on_target`.
- Dla porównania `ProdBody::strike` (:1118-1190) liczy `hit_arc = relative_hit(facing obrońcy, pozycje atakującego i obrońcy)` per cel (:1146).

Pin (`gra/src/battle/battleScene.ts`, 07d2fbd72): `_singleBlow(attacker, defender, ranged)` (:8809) liczy `cuD = toCombatUnit(defender.bu, …)` (:8814), `defTerrain` i `atkTerrain` z pozycji obrońcy i atakującego (:8833-8834), bród i brzeg (:8820-8834), `hitArc = relativeHit(defender.facing, …)` (:8880-8883). Dla wieży atakującym jest syntetyczny strzelec w `(wallCol, t.row)` (:4236-4262).

Skutek: po podpięciu (#113) obrażenia wież byłyby liczone bez obrony i pancerza celu, bez terenu i brodu, i zawsze jako cios z frontu. Reguła jest w pinie, więc to nie jest decyzja gameplay.

Poprawka tekstu: pkt 12 i pkt 18 w tabeli zmieniają status (sekcja 2). W sekcji 3 „OK" dla szablonu strzelca zawęża się do struktury (kategoria, HP, stats). W sekcji 5 dopisane zależności (sekcja 5 niżej).

## 4. Zarzut 2 — pozycja celu z `unit_cell` (PRZYJMUJĘ)

Dowody (Rust, 62ff9de35):
- `ProdBody::unit_cell` (loop.rs:972-974) zwraca `(pu.activate.q, pu.activate.r)`. `pick_tower_for_row` (loop.rs:382-404) bierze pozycje tylko stąd.
- Odczyty `activate.q/r` w loop.rs: :903-904 (snapshot do `au`), :948-949 (`ProdUnit::blow`), :972-974 (`unit_cell`), :1131-1136 (`strike`). Nie ma zapisu `activate.q/r` w `rust-port/engine/src` (sprawdzone `git grep` na przypisania `q =`/`r =` w `siege_tactics_*.rs`). Zapisy `u.q`/`unit.q` istnieją tylko w innych strukturach: `siege_tactics_autobatch.rs:307-308` (`BatchBoard`, planowanie) i `siege_tactics_tower.rs:276-277` (`WalkUnit` w `do_move`, :264). Żadna z nich nie aktualizuje `ProdBody.units[…].activate`.
- Ruch nie jest portowany: `out_of_scope` (loop.rs:995-998): gdy `wall_col >= 0` albo `siege_wall_col >= 0`, jednostka trafia do `unported` z tagiem `oblezenie` i dostaje 0.0. Dla jednostek w oblężeniu pozycja nigdy się nie zmienia w `ProdBody`.

Pin: `pickTowerTarget(…, enemies.map(u => ({ q: u.q, r: u.r, hp: u.bu.hp })))` (:4232) czyta ŻYWE `u.q/u.r`, które zmieniają się przy ruchu.

Skutek: w Rust pozycje celów są statyczne z konfiguracji, a nie „mogą brakować". Wybór celu wieży jest poprawny tylko dla jednostek, które nie ruszają się w trakcie bitwy. Zależne od #123 (K5LOOP-RUCH: zapis pozycji po krokach).

Poprawka tekstu: pkt 8 → CZĘŚCIOWO (sekcja 2). Sekcja 6 pkt „Brak `unit_cell`" zastąpiona faktami powyżej. Pozostałe pozycje NIE_ZMIERZONO w sekcji 6 (hp, kolejność timerów) bez zmian.

## 5. Zarzut 3 — pokrycie dowodowe (PRZYJMUJĘ)

Dowód: `rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs`, komentarz nagłówkowy (linie 14-18):
- `_fireSiegeTowers`, `_destroyTowerAtRow`: WYCINANE Z PINU (WIEZE-2B1), planowanie z odroczeniem `_schedule` nie jest w generatorze.
- `_fireOneTower`: STUB no-op (strzał `_singleBlow` wieży to 2B2, poza zakresem). Brak efektu na stanie jednostek.
- Stan wież: `wallTileHp` statyczny; `destroyed` nie jest modelowane w trace.

Skutek dla raportu: pkt 4, 7, 21, 22 (wyłom w trakcie bitwy) nie mają wektora z pinu w pętli. Pkt 5, 6, 16, 17 (harmonogram, lot, bramki) opierają się na odczycie kodu i wektorach `p6_wieze_2b1` / `p6_wieze_2b2` / `p6_tower_target*`, nie na wektorach pętli.

Poprawka tekstu: wektory wyłomu w trakcie bitwy (pkt 7, 21) trzeba dopisać w #98 (zakres K5-LOOP-WYLOM). Dowód pkt 5, 6, 16, 17 oznaczać jako „odczyt kodu + wektory 2B1/2B2".

## 6. Informacyjne — `siege_shooter_threats` i `tower_setup_from_units` (PRZYJMUJĘ, doprecyzowane)

`git grep -n "siege_shooter_threats" 62ff9de35 -- 'rust-port/*.rs'`: definicja `siege_tactics_approach.rs:107`, dokumentacja :6 i :180, testy `p6_siege_tactics_approach*.rs`. Brak wołającego produkcyjnego.
`git grep -n "tower_setup_from_units\|pick_tower_target" 62ff9de35 -- 'rust-port/*' | grep -v tests/`: `tower_setup_from_units` tylko definicja `siege_tactics_loop.rs:192`. `pick_tower_target` ma wołającego produkcyjnego: `pick_tower_for_row` (loop.rs:404), czyli pkt 9 jest poprawny.

Wniosek: pkt 24 i wiersz 13 to BRAK w produkcji (nie NIE_ZMIERZONO). Wzorzec „moduł bez wołającego" jest ten sam co pkt 23.

## 7. Poprawiona sekcja 5 (kolejność i zależności)

1. #98 (K5-LOOP-WYLOM): propagacja wyłomu do `SiegeEnv` (`destroyed`, usunięcie z planowania i z trafień w locie). Dodatkowo wektory wyłomu w trakcie bitwy (zarzut 3).
2. #109 / #147 (K5LOOP-OUTCOME): efekty `_resolveBlowOutcome` od trafienia wieży (pkt 19), wspólne z ciosami zwykłymi.
3. Strzał wieży per cel (zarzut 1): obrońca, teren, brod i łuk liczone z celu (`cuD`, `defTerrain`, `relativeHit` jak w pinie :8814, :8833-8834, :8880-8883). Zależne od #109/#147 i #113. Rekomendacja: przypisać do #146 (K5-LOOP-WIEZE-R2), bo dotyczy samego strzału wieży. Decyzja orkiestratora.
4. Pozycje celów (zarzut 2): zapis `activate.q/r` po krokach ruchu, zależne od #123 (K5LOOP-RUCH). Bez tego `pick_tower_target` w oblężeniu działa na pozycjach statycznych.
5. #113 (K5LOOP-WIRING): wiring `tower_setup_from_units` i `SiegeEnv` z produkcji. Dopiero po 1-4.

## 8. Pozycje NIE_ZMIERZONO (po obronie)

- `hp` celu: web `u.bu.hp`, Rust `c.hp` (nie sprawdzono definicji `CombatUnit.hp` vs `bu.hp`).
- Kolejność timerów o tym samym `due` (wieże vs ruchy jednostek): wg kodu tie-break po `id`, bez wektora.
- Jednostka bez komórki (`unit_cell` → None): nie ustalono, czy w produkcji może wystąpić. Nie sprawdzono, skąd `activate.q/r` pochodzi przy budowie `ProdUnit` (adapter, poza `siege_tactics_loop.rs`).
- Testów nie uruchamiano (tryb odczytu).
