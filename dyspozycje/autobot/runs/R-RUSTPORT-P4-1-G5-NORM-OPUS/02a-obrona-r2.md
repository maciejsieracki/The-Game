STATUS: BLOCK (INFRA)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES) i fallback do `hex.ulepszenie` w `sync/build.rs`, 1:1 z pinem 07d2fbd72.
ZMIANY/COMMIT: komentarz w `rust-port/renderer/tests/improvements_sync_g5_gen.mjs` (zarzut 2) + ten raport. Gałąź lokalna `rust-port-wip/p4-1-g5-norm-opus-obr-r2`, rodzic `d43c203a4` (Operator r2). Kod Rust bez zmian (nadal `0671e292d` z r1). Bez Cargo.lock, bez push.
TESTY: generator `--check` EXIT 0 (33 heksy, 44 klucze; vectors.json bez zmian). `git diff --check` czysto. NIE_ZMIERZONO: clippy --all-targets -D warnings, test --test improvements_sync_g5, test --all-targets --no-fail-fast, mutacje (a), (b′), (c).
BLOKADY: INFRA. `df -h /` = 5,5 GB, potem 5,3 GB wolnego (wymóg ≥ 12 GB). Cudze buildy: pid 31789 `cargo test --all-targets --no-fail-fast` (cwd worktree wf_af7143d7-863-1/rust-port/engine) oraz pid 15555 `cargo test --test p6_k5doc_t7a`.
RUNDY: obrona r2 / 5
NASTĘPNY KROK: Final Control r2. Orkiestrator: bramkę renderera uruchomić w oknie ≥ 12 GB i bez cudzych buildów.
DEPLOY/PUSH: NIE WYKONANO

Nazwa pliku ma sufiks `-r2`, bo `02a-obrona.md` należy do r1 (tak jak `02-evaluator-r2.md`).

## Odpowiedzi na zarzuty

### 1. Bramki renderera niezmierzone (INFRA): PRZYJMUJĘ, ale w tej rundzie nie da się tego naprawić
Zmierzyłem ponownie w tej rundzie: `df -h /` = 5,5 GB, a potem 5,3 GB wolnego. Działają cudze buildy: pid 31789 (`cargo test --all-targets`, inny worktree) i pid 15555 (`cargo test --test p6_k5doc_t7a`). Dispatch (BRAMKI, DODATEK r2) każe przy < 12 GB zgłosić BLOCK i niczego nie uruchamiać w połowie, więc bramek nie uruchomiłem. To szósty z rzędu BLOCK INFRA na tym temacie. Operator nie może tego usunąć. Orkiestrator musi zwolnić dysk albo przydzielić okno z wyłącznym dostępem.

### 2. Myląca nazwa `brak_and_empty_skipped`: PRZYJMUJĘ, dodałem komentarz bez zmiany nazwy
Nazwy nie zmieniłem, bo podaje ją DODATEK r2 i opiera się na niej mutacja (b′). Zmiana nazwy rozjechałaby dispatch z wektorami. W generatorze nad wektorem dodałem komentarz. Wyjaśnia, że „skipped” dotyczy tylko `improvementKeysForHex` (terrain-improvements.ts:118). W `merged` wartości `''` i `'brak'` zostają jako warstwy postawione (main.ts:3132-3135, DECYZJA 2), a oczekiwany wynik to `[farma, droga, '', brak]`. Dowód: `vectors.json:573-595` (keysForHex `[farma, droga]`, merged zaczyna się od `farma, droga`), a generator `--check` daje EXIT 0, więc wektory są bez zmian.

### 3. Komentarz `sync/mod.rs:39,46` (dług poza allowlistą): ODRZUCAM jako zadanie tej rundy
DODATEK r2 mówi wprost: „komentarz sync/mod.rs:39,46 … jest POZA allowlistą r1 — NIE zmieniaj go w tej rundzie; odnotuj jako dług”. Zmiana byłaby naruszeniem allowlisty. Dług zostaje odnotowany dla orkiestratora: potrzebny jest osobny temat albo rozszerzenie allowlisty po integracji.

### 4. Weryfikacja statyczna wobec pinu: bez zarzutu, przyjmuję do wiadomości
