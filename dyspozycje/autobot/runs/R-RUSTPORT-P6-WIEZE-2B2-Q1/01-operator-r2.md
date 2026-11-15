STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B2-Q1 (runda 2, dodatek r2 dispatchu)
GOAL: strzał wieży oblężniczej (web `_fireOneTower`, pin 07d2fbd72 `battleScene.ts:4223-4262`): cel wybierany w chwili strzału, `_singleBlow` ranged ze statystykami najmocniejszego strzelca epoki z `city_towers`, sprawdzenie `destroyed`. Odpowiedź na zarzuty FC r1: (1) brak wektorów z pina, (2) szablon zamiast `strongestRangedUnitForEra`, (4) brak czerwonego przebiegu.
BAZA: `ef8eeedc9` (FC r1), gałąź `wip/R-RUSTPORT-P6-WIEZE-2B2-Q2` z tego SHA. Sprawdzone `git merge-base --is-ancestor ef8eeedc9 HEAD`. Gałąź `worktree-wf_36dbda52-96d-1` przestawiona (checkout nowej gałęzi), worktree był czysty.
ZMIANY/COMMIT: SHA w sekcji „Commit” poniżej. Allowlista:
  - `rust-port/engine/src/domain/siege_tactics_loop.rs` (nowe: `tower_setup_from_units`, `stat_row_of_unit`; import `city_towers`, `attacker_from_cu`, `to_combat_unit`)
  - `rust-port/engine/tests/p6_wieze_2b2.rs` (nowe testy r2; istniejące testy r1 bez zmiany asercji; `TowerBody` z polami `shooter_missile`, `targets`)
  - `rust-port/engine/tests/p6_wieze_2b2_gen.mjs` (NOWY, generator wektorów z wykonania pinu)
  - `rust-port/engine/tests/p6_wieze_2b2_vectors/vectors.json` (NOWY, 240 przypadków)
  - `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-2B2-Q1/01-operator-r2.md` (ten raport)
  NIE tknięto: `city_towers.rs` (tylko odczyt), `siege_tactics_turnseq.rs`, `siege_tactics_tower.rs`, testy 2B1/wiring/loop (sygnatura `SiegeEnv` bez zmian, nic do dopasowania), `gra/**`, `Cargo.toml`, `Cargo.lock` (wygenerowany przez cargo, NIEskomitowany, status `??`).
  Commit: `git add` tylko powyższych ścieżek, bez `-A`.

ODPOWIEDŹ NA ZARZUTY FC r1 (03-final-control.md):
  1. Wektory z pina — ZROBIONE. `p6_wieze_2b2_gen.mjs` wycina z pinu `_fireOneTower` (battleScene.ts:4223-4262, zakres do pierwszej linii `  }`) oraz `pickTowerTarget` (gra/src/game/city-towers.ts:141-155) i WYKONUJE je w node (`stripTypeScriptTypes`) w harnessie z mockiem: `_schedule` (kolejka), `_singleBlow` (rejestruje argumenty: `stats`, `kategoria`, `hp`, indeks celu w `this.atk`, `ranged`; zwraca 0). Strażnik SHA-256 fragmentów: `beeb83309a34288136bf81398bee43c33735587db446e5ef9476abd855d20bfa` (w `meta.fragmentSha256`, generator przerywa przy zmianie pinu). Wynik: 240 przypadków (seed 0x2b2): 105 strzałów, 135 bez strzału (22 zniszczona wieża, 15 zakończona bitwa, 98 brak żywego celu, w tym 43 z martwym/znikającym celem). Rust test `tower_fire_matches_pin_vectors` odtwarza każdy przypadek przez `SiegeLoop` (`TowerShot(0)` na zegarze, bez `start`) i asertuje: indeks celu = wektor pinu, brak ciosu gdy pin nie strzela, `expectDelayMs == TOWER_FLY_MS (380)`. Pokrycie asertowane: >= 80 trafień i >= 80 braków.
  2. Strzelec z `city_towers::strongest_ranged_unit_for_era` — ZROBIONE. Nowa funkcja `tower_setup_from_units(units, era, civ, min_range) -> (Option<FullBlowInput>, f64)` (pin `battleScene.ts:4167-4168`): wybór wiersza `strongest_ranged_unit_for_era`, zasięg `tower_range_for`, brak wiersza = `None`. Szablon: `neutral_tower_shot_template()` z podmienionym `attacker` = `attacker_from_cu(to_combat_unit(wiersz))` (kategoria = `Typ ?? 'Distance'`, hp = `Health ?? health ?? 1`, `|| 1`). Konwersja wiersza `UnitRow` (serde_json) -> `StatRow` (UVal) w `stat_row_of_unit`. Test `tower_setup_shooter_comes_from_city_towers_row` na 486 przypadkach `p6_city_towers_vectors` (>= 100 z wierszem; brak wiersza = brak strzelca; zasięg z wiersza). Test `tower_shot_uses_shooter_row_from_city_towers`: moc z wiersza (`missileAttack` 7) trafia do ciosu w pętli (`TowerBody.shooter_missile`).
  4. Czerwony przed zmianą — ZROBIONE, z kodem wyjścia. Na bazie `ef8eeedc9`, po dopisaniu testów r2 (przed jakąkolwiek zmianą produkcji): `cargo test --test p6_wieze_2b2` -> EXIT=101, `error[E0432]: unresolved import ... tower_setup_from_units`. UWAGA (uczciwie): to czerwony na poziomie kompilacji (brak symbolu), nie czerwony behawioralny; behawioralnej czerwieni nie da się uzyskać bez istniejącego API strzelca z wiersza. Log: `/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/red-r2.log`.
  Zarzut 3 (`destroyed` jako `wall_tile_rows`) i 5 (łuk/first-blow) — bez zmian, zgodnie z rozstrzygnięciem FC (proxy udokumentowane, łuk = dług).

PRZYPADEK ZNALEZIONY PRZEZ WEKTOR (informacja dla FC, zgodne z pinem):
  Pin wybiera strzelca przez `strongestRangedUnitForEra` (`missilePower`: `missileAttack ?? 'Atak dystansowy'`), ale cios czyta kolumnę przez `combatNormField(def['missileAttack'], 0)` (`combat.ts:223`). Wiersz z `missileAttack: null` i `Atak dystansowy: 2` jest więc WYBRANY (moc 2 w selekcji), a cios strzela z mocą 0. Rust zachowuje zachowanie pinu po stronie ciosu (`to_combat_unit`), a test używa `combat_missile_of` (kolumna `missileAttack`, null -> 0). Pierwsza wersja testu porównywała z `missile_power` i ujawniła tę rozbieżność; test poprawiony na zachowanie pinu, nie na wygodną wartość.

TESTY:
  - Czerwony przed zmianą: EXIT=101 (patrz wyżej).
  - `cargo test --test p6_wieze_2b2`: EXIT=0, 12/12 ok (log: `.../scratchpad/green-r2e.log`). Testy r1 (9) bez zmiany asercji, plus r2: `tower_setup_shooter_comes_from_city_towers_row`, `tower_shot_uses_shooter_row_from_city_towers`, `tower_fire_matches_pin_vectors`.
  - `cargo clippy --all-targets -- -D warnings`: EXIT=0.
  - `cargo fmt --check`: EXIT=0 (po `cargo fmt`, zmieniono tylko pliki tematu; `git diff --check` czysty).
  - PEŁNY `cargo test --no-fail-fast` (bez filtra): EXIT=0. Podsumowanie z logu: 467 binariów z „test result: ok”, 0 z „FAILED”, 0 „panicked”; łącznie passed=3380, failed=0, ignored=1 (ignorowany test NIE pochodzi z tego tematu; w `p6_wieze_2b2.rs` zero `#[ignore]`). Log: `/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/fulltest-r2.log` (znacznik `FULL_EXIT=0`). Uwaga czasowa: test `pick_auto_improvements_matches_pinned_web_vectors` (`p6_8i_pick`, istniejący, nie z tego tematu) trwa wiele minut w buildzie debug.
  - Brak `#[ignore]`, brak osłabionych asercji (dodatkowo: test r1 `tower_hit_lands_after_tower_fly_ms` ma nadal `>=`; dokładny czas trafienia po stronie Rust NIE jest obserwowalny publicznym API, bo fast-forward dalej przewija tury; zob. NIE_ZMIERZONO).

ZNANE OGRANICZENIA / NIE_ZROBIONE (jawnie, z liniami pina):
  a. Wynik liczbowy obrażeń: test `tower_shot_damages_target_through_single_blow_full` (r1) nadal liczy `expected` tą samą funkcją `single_blow_full` — jest to test OKABLOWANIA (cel, wywołanie ranged, zapis HP), NIE parytetu matematyki. Parytet liczb ciosu pochodzi z wektorów `p6_siege_tactics_blow_full` (K5I). Wektor ciosu wieży (wynik liczbowy z pina) NIE jest zrobiony: wymagałby wykonania `_singleBlow` z pina (`battleScene.ts` ~ `_singleBlow`), poza zakresem tego tematu. NIE_ZMIERZONO.
  b. `hit_arc`: szablon ma stałe `HitArc::Front`, pin liczy łuk z geometrii (`relativeHit`/facing). Dług K5LOOP-FACING (#107, #178).
  c. `first_blow_of_pair`: stałe `true` w szablonie. Dług tego samego tematu co (b).
  d. Efekty `_resolveBlowOutcome` po trafieniu wieży (morale/rout/engaged, pin `_singleBlow` po ciosie): NIE portowane, etykieta `wieza-resolveBlowOutcome-efekty` w `ProdBody::unported` (dług #109/#147).
  e. Mody atakującego (civ/budynki właściciela wieży; pin `_singleBlow` bierze mnożniki strony): szablon ma mnożniki 1.0. NIE_ZMIERZONO.
  f. Zasięg `Health` w postaci tekstu (pin `Number(...)` akceptuje napis): Rust czyta tylko liczby, napis -> hp 1. Drobne, NIE_ZMIERZONO.
  g. Dokładny czas trafienia w Rust (380 ms): test sprawdza opóźnienie z wektora pina (`expectDelayMs`, stała `TOWER_FLY_MS`), a nie czas zegara po trafieniu. Powód: `SiegeLoop::resume` przewija dalej (round cap = 160000 ms w teście), a publiczne API nie daje zatrzymania po jednym timerze. NIE_ZMIERZONO.
  h. `destroyed` jako `!wall_tile_rows.contains(row)` — przyjęte rozstrzygnięciem FC r1 (dowód pin 4194-4198, 4216, 7646-7648). Ścieżka wyłomu w domenie nie istnieje w tym zakresie.
  i. Pin `_fireSiegeTowers` ma guard `this.finished` przy planowaniu; Rust planuje, a blokuje dopiero w `tower_shoot` (`st.finished`). Obserwowalnie równoważne (brak trafienia), ale różne miejsce guardu. Zapisane.

DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji; gałąź `wip/…Q2` lokalnie, `parity-v2` i `origin/main` nietknięte).

NASTĘPNY KROK: Evaluator r2 na commicie (wektory z generatora: weryfikacja ponownym uruchomieniem `node rust-port/engine/tests/p6_wieze_2b2_gen.mjs` i porównaniem SHA; kontrola mutacji: zmiana guardu `dead || fading_out` w `tower_hit` musi dać FAIL w `tower_fire_matches_pin_vectors`). Potem Final Control. Otwarte długi: (a)-(e) wyżej.

Uwaga o trailerze commita: ostatnie linie commita to atrybucja systemowa (`Co-Authored-By` z nazwą modelu i `Claude-Session`), bo tak wymaga reguła atrybucji sesji; treść opisu commita nie zawiera nazwy modelu w tekście.
