# 02a OBRONA — R-RUSTPORT-P6-SIEGE-TAKTYKA-NFDCCC-Q1 (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-NFDCCC-Q1
GOAL: normTerrain z kanonicznym przestawianiem znakow laczacych zgodnie z Node (NFD + strip + lowercase, pin 07d2fbd72).
SHA: kod operatora 08957bab1; raport 9892a8f05; obrona (poprawka) 6493f83a5 (branch wip, bez push, baza 465e9dd95).

## Odpowiedzi na zarzuty

1. (niski) Brak strażnika SHA-256 generatora w tescie Rust — PRZYJMUJĘ, poprawka w 6493f83a5.
   - Dodano w `rust-port/engine/tests/p6_siege_tactics_inputs_terrain.rs`: `generator_straznik_sha256` porownuje SHA-256 pliku
     `p6_siege_tactics_inputs_terrain_gen.mjs` (include_bytes!) z przypietą stalą `GEN_SHA256 = ae2f13a11d153265d82f635640447e0d7aa148f63659685e3df6b9eb435714e4`.
     Dryf generatora (zmiana bez regeneracji wektorow i aktualizacji stalej) oblewa test.
   - SHA-256 zaimplementowany w tescie (FIPS 180-4, bez nowych zaleznosci w Cargo.toml); `sha256_wektor_wzorcowy` sprawdza wektory "abc" i pusty.
   - Wartosc liczona przez Rust zgodna z `sha256sum` na pliku (test przechodzi), wiec stala jest prawdziwa.
   - Strażnik po stronie Node (FRAGMENT_SHA256 pinu) pozostaje bez zmian.
   - Wektory vectors.json nietkniete.

2. (informacyjny) CCC_RANK = ranga kolejnosci ccc, nie surowe ccc; zgodnosc zalezy od Unicode w Node 22 — PRZYJMUJĘ jako znana granica (bez zmiany kodu).
   Kolejnosc sortowania jest identyczna z Node dla wszystkich 929296 par niestartowych (wektory `cccPairFnv`). Zmiana wersji Unicode w Node wymaga regeneracji wektorow i nowej stalej GEN_SHA256 (teraz wykrywane przez test).

3. (informacyjny) Brak #[ignore], osłabionych asercji, zależności od W8, poprawek ręcznych w wektorach — PRZYJMUJĘ jako potwierdzenie, bez działania.

## Bramki (w worktree, commit 6493f83a5, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo)
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 88/88 OK, EXIT 0
- cargo test --test p6_siege_tactics_inputs_terrain: 11/11 OK (w tym generator_straznik_sha256, sha256_wektor_wzorcowy), EXIT 0
- Cargo.lock wygenerowany przez cargo usunięty przed commitem; nie commitowany.

## Granice
- Allowlista: wyłącznie plik testu Rust. Brak zmian w gra/, rust-port/engine/data/, Cargo.toml/Cargo.lock, origin/main, rust-port/parity-v2. Brak push.
- Usunięcie CARGO_TARGET_DIR i sprzątanie: do wykonania przez orkiestratora (katalog poza repo).

## Dług
Brak nowego długu. Znana granica (pkt 2) udokumentowana.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator r2 (weryfikacja poprawki zarzutu 1 i bramek na 6493f83a5), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
