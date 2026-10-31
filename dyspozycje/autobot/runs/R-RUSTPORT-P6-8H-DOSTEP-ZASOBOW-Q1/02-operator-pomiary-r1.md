# R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1 - Operator-pomiary (niezalezna weryfikacja), runda 1/5

STATUS: PASS-WITH-NOTES (partia A zweryfikowana; reszta tematu 8H otwarta)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1
GOAL: niezalezne potwierdzenie partii A (zloto/cyna/zelazo/kultura miasta, `domain/resource_access.rs`): wektory z pinu 91dc998a, bramki fmt/clippy/test z logami i EXIT, mutacje na galeziach sterujacych, zgodnosc z TS.

## ZMIANY / COMMIT

- Weryfikowany kod: `3b332b80eb4a98614beb0ce3b38d8801ad74afcd`; raport operatora: `621e679bed59d57be23488e6c303c63ba717a5d1`.
- Baza potwierdzona: `74b81339e` = `origin/rust-port/parity-v2` (aktualny HEAD).
- Worktree: `/home/user/The-Game/.claude/worktrees/wf_340cae56-806-2`, detached od `621e679bed`.
- ZMIANA (poprawka formatowania, allowlista): `rust-port/engine/src/domain/resource_access.rs`, `rust-port/engine/tests/p6_8h_access.rs` - tylko `rustfmt --edition 2021` (bez zmiany logiki). Powod: `cargo fmt --check` na `parity-v2` + zmiany operatora dawal EXIT=1 (2 roznice w src, 17 w testach); po poprawce EXIT=0.
- Nowe artefakty: `logs/gate-v2-*.txt`, `mutacje/wynik-3-pomiary-v2-48.txt`, `mutacje/mutants_v2.py`, niniejszy raport.
- Pliki spoza allowlisty: brak. `rust-port/engine/Cargo.lock` wygenerowany przez cargo - NIE commitowany.
- Commit tej rundy: SHA w wiadomosci orkiestratora (raport nie moze zawierac wlasnego SHA).
- PUSH: NIE.

## NIEZALEZNE USTALENIA (wazne)

1. Logi bramek operatora (`logs/gate-cargo-test-*.txt`, `gate-clippy-all-targets.txt`) zawieraja sciezke `.../wf_340cae56-806-1/...` - byly uruchomione w INNYM worktree. Dlatego wszystkie bramki powtorzono w `-806-2` (logi `gate-v2-*`).
2. `mutacje/run.py` operatora ma zahardkodowana sciezke `wf_340cae56-806-1`; niniejsze pomiary uzyly kopii runnera z poprawna sciezka (poza repo, `/dev/shm/p6-8h-mut/run_v2.py`), wyniki w `mutacje/wynik-3-pomiary-v2-48.txt`.
3. Dokument tematu `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` ISTNIEJE na galezi zlecenia `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (korekta zalozenia Z-2 operatora: nie jest nieobecny w sensie absolutnym, jest tylko poza `parity-v2`). Tabela §8H w nim (wiersze `8H-P*`, linie ~483-808) NIE zostala zaktualizowana: aktualizacja wymaga commitu na galezi zlecenia (poza allowlista tej galezi roboczej) - tabela statusow jest w tym raporcie i w raporcie 01.

## WEKTORY

- Regeneracja z `git archive 91dc998a gra/src gra/data` (katalog tymczasowy w `/dev/shm`, loader `repin-b-loader-register.mjs` z runu 8A, generator z runu 8H): `zloto.json`, `cyna.json`, `zelazo.json`, `society.json` - BAJT-W-BAJT zgodne z commitowanymi w `rust-port/engine/tests/p6_8h_vectors/`. EXIT=0.
- Przeglad TS vs Rust (odczyt `91dc998a`): `cyna-access.ts`, `zelazo-access.ts`, `zloto-access.ts`, `society-inputs.ts:23-62`, `resource-access.ts:154` - kolejnosc `??`/`||`, `typeof`, `has*Access` (legacy boolean = None), `kopalnia` legacy na zlozu zelaza, `deductMennicaZlotoDrain` (NaN), `cultureMixBreakdown` (Math.round dla wartosci >= 0 = round Rust) - zgodne. Brak rozbieznosci wykrytej.

## BRAMKI (worktree -806-2, `CARGO_TARGET_DIR=/dev/shm/p6-8h-verify-target`, CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0)

- `logs/gate-v2-fmt-check.txt`: `cargo fmt --check`, EXIT=0 (po poprawce rustfmt).
- `logs/gate-v2-cargo-test-p6-8h-access.txt`: 11 passed, 0 failed, EXIT=0.
- `logs/gate-v2-clippy-all-targets.txt`: `cargo clippy --all-targets -- -D warnings`, EXIT=0.
- `logs/gate-v2-cargo-test-full-engine.txt`: `cargo test` pelny silnik, 252 x `test result: ok`, 0 FAILED/panicked, EXIT=0.
- `git diff --cached --check`: EXIT=0.

## MUTACJE (48 = 38 operatora + 10 nowych na galeziach bez mutanta)

Wynik: 44 zabite, 4 przezyte - wszystkie 4 z dowodem rownowaznosci (sprawdzonym przez odczyt kodu):
- M03 (usuniety strazak `placed.is_empty()` w cyna): `any()` na pustej kolekcji = false.
- M30 (`foreign_pct <= 0` -> `< 0`): dla `foreign == 0` obie galezie daja `[owner 100]`; dla innych wartosci identyczne.
- M32 (usuniety `filter(!key.is_empty())`): pusty klucz nie rowna sie zadnej stalej porownania; wynik predykatu bez zmian.
- M33 (usuniety fallback `migrate_legacy_kopalnia_key(raw, None)`): z `hex=None` funkcja zwraca `raw` (nielegacy) albo `kopalnia_miedzi` albo None - nigdy `kopalnia_cyny`/`kopalnia_zelaza`; legacy `kopalnia` na zlozu zelaza obslugiwany osobna galezia (M13/M14 zabite).

Nowe mutanty (M39-M48), wszystkie ZABITE: M39/M40 (`placed`/`hexes = None` -> true, cyna/zelazo), M41 (legacy `return true` -> false, zelazo), M42 (`map_or(0` -> `1`), M43 (`unwrap_or(0.0)` -> `1.0` w zlocie), M44/M45 (`unwrap_or(0.0)` -> `1.0` w cynie/zelazie), M46 (`round` -> `floor`), M47 (pct wlasciciela 100 -> 99), M48 (fallback udzialu 1 -> 0).

M21 (w pliku operatora wzorzec pre-rustfmt) zaadaptowany do formatu po rustfmt; zabity.

Pelne wyniki: `mutacje/wynik-3-pomiary-v2-48.txt`; definicje: `mutacje/mutants_v2.py`. Plik zrodlowy po mutacjach przywrocony i zweryfikowany `cmp`.

## TABELA SYMBOLI (partia A, stan po R1 + pomiar)

Zgodna z tabela operatora (raport 01-operator-r1.md), bez zmian statusow. Liczby: P2 zelazo 6 + zloto 15 = 21 wierszy; P1 w tej partii: cyna 8/8, society-inputs 5/5 (kultura), `improvementKeysOnPlacedHex` 1/1 (posrednio). Pozostale P1 (resource-access: etykiety, collectActiveAccess, getCityResourceAccessForCity, getResourceAccessForCity, isForeignReligionDominant, isPlayerCapitalCity, stolicaEasyBonusActive) - OTWARTE, partia 8H-P1b.

## ZALOZENIA

- Z-P1: pomiary wykonano na kodzie z `3b332b80e` po wylacznie formatowaniu (rustfmt); logika nie zmieniona (potwierdzone: 11/11 i pelny test po zmianie).
- Z-P2: runner mutacji przed pomiarem nie byl commitowany przez operatora w poprawnej sciezce; kopia poza repo, bez zmian semantyki.
- Z-P3: ryzyko resztkowe Z-6 z raportu 01 (JS `trim` vs Rust `trim` dla U+FEFF) pozostaje bez wektora.

## RUNDY

1/5 (pomiary bez FAIL; pomiary nie zuzywaja rundy FAIL).

## NASTEPNY KROK

Operator r2 / partia 8H-P1b: `resource-access.ts` (etykiety, `collectActiveAccess`, `getCityResourceAccessForCity`, `getResourceAccessForCity`) oraz `isForeignReligionDominant`, `isPlayerCapitalCity`, `stolicaEasyBonusActive`; wektory z pinu 91dc998a, mutacje z pokryciem KAZDEJ galezi sterujacej, potem bramki clippy, pelny cargo test i `git diff --check`.

## DEPLOY/PUSH: NIE WYKONANO
