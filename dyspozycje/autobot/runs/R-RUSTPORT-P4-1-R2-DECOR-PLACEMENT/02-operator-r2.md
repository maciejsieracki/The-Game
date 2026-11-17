# R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT — Operator r2

STATUS: PASS
DOMAIN: GAME (renderer 3D, dekor terenu)
TEMAT: R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT
GOAL: rozmieszczenie lasu/dżungli per heks wg `HexDynDto.nakladka` oraz stan per heks `hide_decor_at_hex` / `sync_forest_for_units` (pin `07d2fbd72`); r2 = wyłącznie zmiany z DODATKU r2 dispatchu (wariant A orkiestratora po BLOCK r1).
ZMIANY/COMMIT: BAZA = commit r1 `47f49150835b09d2afda9bc35209ec6e21a7fedc` (worktree detached, `HEAD` sprawdzony przed pracą). Osobny commit r2 na tej bazie (SHA w odpowiedzi Operatora). Pliki:
- `rust-port/renderer/tests/decor_web_parity.rs` — WYŁĄCZNIE `decor_sources()`: skan rekursywny katalogu `src/decor/` (wejście do podkatalogów zamiast asercji „no sub-directories”), wpisy sortowane po ścieżce (deterministyczna kolejność), asercja `out.len() >= 10` zachowana. Konsumenci (`decor_uses_jsmath_not_platform_libm`, `decor_reuses_core_instead_of_copies`) i ich asercje bez zmian. Nic więcej w pliku.
- `rust-port/renderer/tests/decor_placement_scene.rs` — tylko numery linii pinu w komentarzu modułu.
- `rust-port/renderer/src/decor/placement/mod.rs` — tylko numery linii pinu w komentarzach (zero zmian w kodzie).
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT/02-operator-r2.md` (ten raport).
Bez `Cargo.lock` (cargo go modyfikuje przy każdym przebiegu — przywrócony `git checkout`, nie w commicie).

## Poprawki linii pinu (sprawdzone na `git show 07d2fbd72:gra/src/render/scene.ts`)
| Wektor | Było | Jest | Treść linii w pinie |
|---|---|---|---|
| V1 warunek | `:2347` | `:2348` | `if (hex.nakladka === Nakladka.Las && isDryLandTeren(t))` (`:2347` to komentarz) |
| V2 dżungla | `:2352` | `:2354` | `if (isWarmJungleForestHex(q, r, map.wysokoscR))` |
| V2 wariant/obrót dżungli | `:2353-2354` | `:2355-2356` | `wariantDjungliDlaHeksa`, `rotacjaDjungliDlaHeksa` |
| V2 wariant/obrót lasu | `:2363-2364` | `:2365-2366` | `wariantLasuDlaHeksa`, `rotacjaLasuDlaHeksa` |
| V3 baseY | `:2348` | `:2349` | `const baseY = vis.height + vis.yOffset;` |
| V3 position/scale | `:2350-2351` | `:2352-2353` | `dummy.position.set(x, baseY, z)`, `dummy.scale.set(1, 1, 1)` |
| V4 dopisywanie do warstw | `:2356-2372` | `:2357-2373` | od `const jm = djunglaInst[v]!` do `lasIdx[v] = li + 1` (to samo przesunięcie o 1; poza listą Ewaluatora, ale w tym samym bloku — poprawione, by nie zostawić błędnego zakresu) |
| blok rozmieszczenia (`mod.rs` doc + `place_forests`) | `:2346-2374` | `:2348-2374` | `:2346` pusta, `:2347` komentarz; `:2374` zamyka gałąź lasu |

Pozostałe odniesienia sprawdzone i poprawne bez zmian: `NL_NATURAL` `:1719`, pętla `Object.values(map.hexes)` `:1727`, `syncForestForUnits` `:3164-3170`, `hideDecorAtHex` `:3172-3174`, `forestHidden` `:3259-3260`, `applyLasFog` `:3307-3328`.

TESTY (w `rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR=/tmp/tgt-r2decor-placement-opr2` — unikalny, poza repo, usunięty po bramkach):
- `df -h /` na starcie 6,3 GB; przed bramkami **8,8 GB** (≥ 8 GB → bramki uruchomione); po teście 9,0 GB.
- `cargo fmt --check` → **EXIT 0**
- `cargo clippy --all-targets -- -D warnings` → **EXIT 0**
- `cargo test --all-targets --no-fail-fast` → **EXIT 0**: 69 zestawów, **568 passed, 0 failed, 0 ignored** (r1: 566 passed / 2 failed). `decor_web_parity` **12/12**, `decor_placement_scene` **9/9**.
- Czułość strażnika na podkatalog (mutacja, cofnięta): dopisanie do `decor/placement/mod.rs` funkcji z `x.sin()` i `fn forest_tree_count_for_hex` → `decor_web_parity` **FAIL 2** (`decor_uses_jsmath_not_platform_libm` wskazał `placement/mod.rs:335: ["sin"]`, `decor_reuses_core_instead_of_copies` wskazał `placement/mod.rs:337`), 10 ok. Po przywróceniu pliku: 12/12 i 9/9. Strażnik skanuje więc nowy podkatalog (silniejszy niż przed zmianą, nie słabszy).
- `git diff --check` → czysto. Brak `#[ignore]`, brak osłabionych asercji.
BLOKADY: brak
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 (zakres DODATKU r2: diff `decor_sources()`, linie pinu, pełny `cargo test`), potem Final Control; w rejestrze opisać zmianę strażnika z P4-17 (wariant A).
DEPLOY/PUSH: NIE WYKONANO
