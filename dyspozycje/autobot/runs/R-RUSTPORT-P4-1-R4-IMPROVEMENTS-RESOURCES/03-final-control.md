# FINAL CONTROL R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES (runda 1)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES
GOAL: Renderer 3D: synchronizacja ulepszeń, nakładek zasobów i wiosek per heks z DTO, z obsługą mgły (R4 kontraktu P4-1).
ZMIANY/COMMIT: oceniany commit operatora `aa9d36ac415e5bd3bab1ace3cee274f43ec0b6d0` (rodzic `2edc808d7137e76fdf66e46e846faa802e3a9cd8` = `origin/rust-port/parity-v2`). Final Control nie zmienia kodu; jedyny plik: ten raport (nie commitowany, nie pushowany).
TESTY: `cargo test --all-targets --no-fail-fast` NIE uruchomiony przez nikogo (Operator, Evaluator, FC). Powód: `df -h /` przy starcie FC = 120 MB wolnego (100%), po kilku minutach 119 MB. Próg dispatchu ≥ 8 GB. Żadna komenda cargo nie została uruchomiona przez FC.
BLOKADY: INFRA, dysk — 119–120 MB wolnego na `/`.
RUNDY: 1/5 (BLOCK techniczny, wraca do Operatora z tym samym ID po zwolnieniu dysku).
NASTĘPNY KROK: orkiestrator zwalnia dysk (≥ 8 GB), potem powtórka bramek na `aa9d36ac4` (Operator lub od razu FC): `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` oraz mutacje (a)(b)(c).
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdzono statycznie (SPRAWDZONE)

1. Rodzic commitu = `2edc808d7` (baza z dispatchu, równa `origin/rust-port/parity-v2`).
2. Allowlista (`git diff --stat 2edc808d7 aa9d36ac4`): 8 plików, +2000/-0:
   `01-operator-r1.md`, `src/improvements/{mod.rs, sync/mod.rs, sync/build.rs, sync/input.rs}`,
   `src/lib.rs` (+1 linia `pub mod improvements;`), `tests/improvements_sync_r4.rs`,
   `tests/fixtures/improvements_sync/r4_vectors.json`. Wszystko w allowliście. Brak zmian w
   `view-model`, `engine`, `gra/`, `registry.rs`, `zasoby.rs`. Brak `Cargo.lock`.
3. `#[ignore]` w diffie: brak. Nazwa modelu w treści/trailerach: brak (trailer `Co-Authored-By: Claude <noreply@anthropic.com>`).
4. Asercje testu (przegląd `tests/improvements_sync_r4.rs`): konkretne `assert_eq!` na wartościach
   z fixture (road_mask = 5 i geometria maski, pozycje, skale, rotY, kolejność map), negatywne
   bramki zasobu (`zloze` None, `''`, woda, era, lama, dedykowane ulepszenie). Nie widzę osłabionych
   asercji. Komentarze z `main.ts:linia` pinu obecne.
5. Obozy: brak pola w DTO, opisane jako NIE_ZMIERZONO, bez wymyślonego pola — zgodnie z DECYZJAMI.

## NIE_ZMIERZONO

- Zielone `cargo test --all-targets` (nikt nie uruchomił).
- `cargo fmt --check` i `cargo clippy` EXIT 0 oraz FAIL mutacji (a)(b)(c) — wyłącznie raport Operatora; ani Evaluator, ani FC ich nie powtórzyli.

## Werdykt

BLOCK (INFRA). Statycznie brak zastrzeżeń, ale kryterium końca 2 (bramki EXIT 0, w tym `cargo test`)
nie jest spełnione dowodem. Nie wolno integrować `aa9d36ac4` przed zieloną bramką testów.
