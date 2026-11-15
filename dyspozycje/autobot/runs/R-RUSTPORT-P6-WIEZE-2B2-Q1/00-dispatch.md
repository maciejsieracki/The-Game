# DISPATCH R-RUSTPORT-P6-WIEZE-2B2-Q1 (runda 1)

TEMAT: WIEZE-2B2 — strzał wieży oblężniczej: callback zaplanowanego wystrzału wybiera cel (`pick_tower_target`), zadaje obrażenia przez `_singleBlow` ranged ze statystykami najmocniejszego strzelca epoki (`towerShooterRow`), i sprawdza stan wieży (`destroyed`). Część 2 z 2 (część 1 = 2B1, w `parity-v2`).
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: `14d5e50b9` (czubek `origin/rust-port/parity-v2`). PRZED pracą: `git merge-base --is-ancestor 14d5e50b9 HEAD` musi być prawdą; inaczej przestaw. Gałąź robocza: `wip/R-RUSTPORT-P6-WIEZE-2B2-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/battle/battleScene.ts` — `_fireSiegeTowers` (ok. 4208–4220, guard `!this.towerShooterRow` w linii ok. 4209), `_fireOneTower` (ok. 4223–4262: `if (t.destroyed) return`, `pickTowerTarget`, `shooter` = syntetyczny strzelec ze `stats: shooterRow`, `_schedule(RANGED_FLY_MS, ... this._singleBlow(shooter, target, true) ...)`), `towerRangeFor` / `strongestRangedUnitForEra` (już w Rust: `rust-port/engine/src/domain/city_towers.rs`).

## ZAŁOŻENIA (zasada 9: parytet 1:1)
- Dane strzelca (`towerShooterRow`) = wynik `strongest_ranged_unit_for_era` z `city_towers.rs` dla epoki/nacji obrońcy; brak wiersza → brak strzału (guard jak pin).
- Obrażenia = wspólna ścieżka `_singleBlow` (ranged=true) już w Rust (`siege_tactics_blow_full.rs`), NIE nowa matematyka.
- Stan `destroyed` wieży jest ustawiany przy zniszczeniu kafla muru (`_destroyTowerAtRow`) i sprawdzany w callbacku strzału (pin: `if (t.destroyed) return`).

## ZAKRES
1. `SiegeEnv` (`siege_tactics_loop.rs`): pole danych strzelca wieży (wiersz jako dane wejściowe z `city_towers`), guard braku wiersza.
2. Callback wystrzału w `fire_siege_towers`/`tower_shoot` (`siege_tactics_loop.rs`): wybór celu (`pick_tower_target`) w chwili strzału, sprawdzenie `destroyed`, strzał `_singleBlow` z syntetycznym strzelcem, aktualizacja trafionego celu. Usunąć pusty callback z 2B1 i komentarz `// 2B2`.
3. Stan `destroyed` wieży (`_destroyTowerAtRow` pełny efekt jak pin, jeśli dotyczy), jego sprawdzenie w strzale.
4. Testy: istniejące (`p6_wieze_2b1.rs`, `p6_tower_target_wiring.rs`, `p6_siege_tactics_loop*.rs`) dopasować; nowy `p6_wieze_2b2.rs` z wektorami z generatora (`p6_wieze_2b2_gen.mjs`, wykonuje pin `_fireOneTower` z mockiem, strażnik SHA-256) — lub, jeśli niewykonalne, wartości pina z cytatem linii i jawnym zapisem w raporcie.

## ALLOWLISTA (tylko te pliki)
- `rust-port/engine/src/domain/siege_tactics_loop.rs`, `siege_tactics_turnseq.rs`, `siege_tactics_tower.rs` (tylko jeśli zmiana sygnatury), `city_towers.rs` (tylko odczyt; zmiany NIE)
- `rust-port/engine/tests/p6_wieze_2b1.rs`, `p6_tower_target_wiring.rs`, `p6_siege_tactics_loop.rs`, `p6_siege_tactics_loop_resume.rs`, `p6_siege_tactics_loop_gen.mjs`, `p6_siege_tactics_loop_vectors/vectors.json` (dopasowanie do nowej sygnatury SiegeEnv; regeneracja jeśli wektory się zmieniają; BEZ osłabiania asercji)
- `rust-port/engine/tests/p6_wieze_2b2.rs`, `p6_wieze_2b2_gen.mjs`, `p6_wieze_2b2_vectors/` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-2B2-Q1/**`
ZAKAZ: wszystko inne, `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), `git add -A`, push do `parity-v2`.

## KRYTERIA KOŃCA
1. Test czerwony przed zmianą (kod wyjścia): strzał wieży nie zadaje obrażeń / brak sprawdzenia `destroyed`.
2. Po zmianie: zadanie obrażeń przez `_singleBlow` (wartość z testu wektorowego lub cytat pina), zniszczona wieża nie strzela, brak wiersza strzelca = brak strzału.
3. PEŁNY `cargo test` (bez filtra, `--no-fail-fast`) EXIT 0 — to jest wymóg, nie tylko `p6_siege*`. Uruchom w tle z logiem, jeśli > 590 s.
4. `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo fmt --check` EXIT 0.
5. Brak `#[ignore]`, brak osłabionych asercji, zmiany tylko na allowliście.
6. Raport: co zrobione (SHA), wynik pełnego testu (log), co NIE zrobione.

## RAPORT I COMMIT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. Commit na `wip/…`, BEZ push. Treść commita bez nazwy modelu; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
