# DISPATCH R-RUSTPORT-P6-CRED-WOJNA-Q1 (runda 1)

TEMAT: CRED-WOJNA — hak `note_war_entered` (P4) w pipeline wojny + test 3 tur S3 dla `umowa_handlowa` (zadanie #103).
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-CRED-WOJNA-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/...` — wywołanie hooka wejścia w wojnę i obsługa umowy handlowej po wypowiedzeniu.

KROK 0 (obowiązkowy, przed kodem): sprawdź, co już jest. W `rust-port/engine/src/domain/turn_war_dipl_steps.rs:895` hak `reg.note_war_entered(a, b, turn)` JEST wołany. Ustal `git grep` z numerami linii, czy wołanie jest w pipeline wojny produkcyjnie i czy pokrywa wszystkie ścieżki wejścia w wojnę, które pin wywołuje. Brakującą ścieżkę dodaj; jeśli wszystkie są pokryte — nie zmieniaj kodu, dołóż tylko test.

GOAL: (a) pełne pokrycie ścieżek wejścia w wojnę hakiem P4 zgodnie z pinem; (b) test 3 tur S3 dla `umowa_handlowa` porównany z wektorami pinu.

ALLOWLISTA:
- rust-port/engine/src/domain/turn_war_dipl_steps.rs
- rust-port/engine/src/domain/credibility.rs (tylko jeśli potrzebna zmiana)
- rust-port/engine/tests/p6_cred_wojna*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-WOJNA-Q1/01-operator-r1.md

NIE ROBIĆ: wiring zlozeGrants (osobny temat, poza zakresem), zmian formatu zapisu.

KRYTERIA KOŃCA:
1. Wykaz ścieżek wejścia w wojnę: pin vs Rust, z numerami linii, każda pokryta hakiem.
2. Test 3 tur S3 z wektorami z pinu (generator .mjs + strażnik SHA-256), liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test.
5. Jeśli BLOCK — raport z dowodem, bez zmian kodu.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).

---

## DODATEK r2 (po FC r1 = FAIL; runda 2/5, ten sam ID)

Baza r2: `15d85c2ee` (czubek wip z obroną r1; zawiera kod `beefdec4e` i raport `0223d1a2c`). Zweryfikowane: `15d85c2ee` jest przodkiem `origin/claude/rust-sivvrn`. Nie zaczynaj od `23e33793e` z r1.

NAPRAW (zarzuty FC r1, do wykonania w tej rundzie):
1. Brak ≥150 wektorów z pinu dla hooka P4 i testu S3. Dodaj generator `.mjs` wykonujący tekst pinu w node (jak w pozostałych `p6_*_gen.mjs`) i strażnik SHA-256 wyciętych fragmentów. Liczniki niepustości > 0.
2. Kolejność D4/D8 względem P4: dodaj wektory z pinu dla tej kolejności (zarzut 6 FC r1).

ALLOWLISTA r2: bez zmian względem r1, plus nowe pliki `rust-port/engine/tests/p6_cred_wojna*_gen.mjs` i ich wektory JSON (dozwolone przez FC r1).

DO DECYZJI CZŁOWIEKA — NIE ROBIĆ w r2:
- alias `umowa_handlowa` → `LegacyTradeAgreement` (credibility.rs:597-598): pominąć w tej rundzie. Test S3 wykonaj bezpośrednio na `StreamDealKind`, bez aliasu.
- wpięcie wypowiedzenia gracza (web 13168/13205), sojuszu (23806), klastra (40441): poza tematem, to #120.
- wiring `zlozeGrants`: poza zakresem, jak w r1.

BRAMKI r2 (EXIT 0): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `p6_cred_wojna`; `p6_credibility`; `p6_wire_war_pipeline`; pełny `cargo test --no-fail-fast` (dowód liczników). `CARGO_TARGET_DIR` poza repo, usuń po bramkach.

RUNDY: 2/5. Raport: zapisz `01-operator-r2.md` (nie nadpisuj r1). Commit bez nazwy modelu, `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. NIE pushować do parity, nie integrować, nie dotykać `gra/`.

---

## DODATEK r3 (po FC r2 = PASS-WITH-NOTES, decyzja orkiestratora; runda 3/5, ten sam ID)

**Korekta bazy (błąd orkiestratora w DODATKU r2):** `15d85c2ee` NIE jest przodkiem `origin/claude/rust-sivvrn`. Jest 155 commitów za parity. Nie integrować `811f607ee`, bo cofnęłoby 155 commitów.

Baza r3: `003d53f97` (czubek `origin/rust-port/parity-v2`). Jedyna obowiązująca.

ZAKRES r3 (tylko przeniesienie testów z r2 na bazę parity):
1. Przenieś z `811f607ee` (git show) cztery pliki i bez zmian w ich treści, o ile kompilują się na bazie parity:
   - `rust-port/engine/tests/p6_cred_wojna_gen.mjs`
   - `rust-port/engine/tests/p6_cred_wojna_vectors.rs`
   - `rust-port/engine/tests/p6_cred_wojna_vectors/vectors.json`
   - `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-WOJNA-Q1/01-operator-r2.md` (raport r2 bez zmian)
2. Jeśli testy nie kompilują się na parity: napraw WYŁĄCZNIE w tych plikach testowych (nie w `src/`). Zapisz w raporcie, co zmieniono i dlaczego.
3. Generator `.mjs` odtwórz w scratchpadzie (esbuild zainstaluj w scratchpadzie, NIE w repo), wyjście ma być bajt-w-bajt zgodne z `vectors.json`. Liczniki z r2: hak 160 (147/13), kolejność 60 seq, S3 20x3.

ALLOWLISTA r3: wyłącznie 4 pliki powyżej + `01-operator-r3.md`. ZAKAZ: `src/**` (w tym `credibility.rs`, `turn_war_pipeline.rs`, `turn_war_dipl_steps.rs`), `war_turn_declare.rs`, `gra/`, `Cargo.toml`, `Cargo.lock` (nie commitować).

NIE ROBIĆ (decyzje właściciela, poza tą rundą):
- hak w `declare_forced_wars` (`war_turn_declare.rs`, pin 41931): #120 lub rozszerzenie allowlisty.
- alias `umowa_handlowa` → `LegacyTradeAgreement`: pominąć.
- harness pipeline dla kolejności D4/D8: osobny temat (test nadal wywołuje prymitywy rejestru).

BRAMKI r3 (EXIT 0): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `p6_cred_wojna_vectors`; `p6_cred_wojna`; `p6_credibility`; `p6_wire_war_pipeline`; pełny `cargo test --no-fail-fast` (dowód liczników). `CARGO_TARGET_DIR` poza repo, usuń po bramkach.

RUNDY: 3/5. Raport: `01-operator-r3.md`. Commit BEZ nazwy modelu (także bez `Co-Authored-By` z modelem), `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. NIE pushować do parity, nie integrować, nie dotykać `gra/`.

---

## DODATEK r4 (po FC r3 = PASS-WITH-NOTES z zarzutem Z1; decyzja orkiestratora: wariant A; runda 4/5, ten sam ID)

**Powód:** runda 3 nadpisała testy parity (`003d53f97`): usunięto test zgodności wstecz i test S3 z wersji parity (200 przypadków / 1063 kroki → 160+60+20). To osłabienie, nie uzupełnienie. Przyczyna leżała w dispatchu r3, nie w pracy Operatora.

Baza r4: `003d53f97` (czubek `origin/rust-port/parity-v2`). Jedyna obowiązująca.

**Korekta:** hak w `declare_forced_wars` JEST wołany (`war_turn_declare.rs:116` → `turn_war_dipl_steps.rs:895`, test `p6_cred_wojna_forced.rs` 4 ok). Nie trzeba rozszerzać allowlisty o `war_turn_declare.rs`.

ZAKRES r4 (wariant A):
1. **Przywróć bajt-w-bajt** z `003d53f97` (`git checkout 003d53f97 -- <ścieżka>`), bez żadnych zmian:
   - `rust-port/engine/tests/p6_cred_wojna_gen.mjs`
   - `rust-port/engine/tests/p6_cred_wojna_vectors.rs`
   - `rust-port/engine/tests/p6_cred_wojna_vectors/vectors.json`
2. **Dodaj zestaw r2 jako NOWE pliki** (treść z `811f607ee`, czyli `git show 811f607ee:<ścieżka>`), pod nazwami:
   - `rust-port/engine/tests/p6_cred_wojna_gen_r2.mjs`
   - `rust-port/engine/tests/p6_cred_wojna_vectors_r2.rs`
   - `rust-port/engine/tests/p6_cred_wojna_vectors_r2/vectors.json`
   W `p6_cred_wojna_vectors_r2.rs` popraw wyłącznie ścieżkę do vectors (`include_str!`/odczyt) na `p6_cred_wojna_vectors_r2/vectors.json`. Asercje bez zmian.
3. **Przywróć raport r2:** `01-operator-r2.md` z `811f607ee` (ref `refs/keep/R-RUSTPORT-P6-CRED-WOJNA-Q1-r2-code`). Raport r3 zapisz jako `01-operator-r4.md`, nie nadpisuj r2.

**KRYTERIUM KOŃCA (mierzalne):** `git diff --numstat 003d53f97 HEAD -- rust-port/engine/tests` pokazuje **0 usuniętych linii** w plikach parity. Zmiany tylko addytywne (nowe pliki `*_r2*`).

ALLOWLISTA r4: 3 pliki parity (przywrócone, bez zmian netto), 3 nowe pliki `*_r2*`, `01-operator-r2.md` (przywrócony), `01-operator-r4.md`, `02a-obrona-r4.md`. ZAKAZ: `src/**`, `war_turn_declare.rs`, `gra/`, `Cargo.toml`, `Cargo.lock` (nie commitować).

NIE ROBIĆ (decyzje właściciela, poza tą rundą): alias `umowa_handlowa` → `LegacyTradeAgreement` (pominąć); harness pipeline D4/D8 (osobny temat); dowód produkcyjnej kolejności (NIE_ZMIERZONO).

BRAMKI r4 (EXIT 0): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `p6_cred_wojna_gen`-owe testy parity (`p6_cred_wojna`, `p6_cred_wojna_vectors`, `p6_cred_wojna_forced`); `p6_cred_wojna_vectors_r2`; `p6_credibility`; `p6_wire_war_pipeline`; pełny `cargo test --no-fail-fast` z liczbami. `CARGO_TARGET_DIR` poza repo, usuń po bramkach. Dla testów pełnych użyj `timeout` powyżej 585 s albo uruchom w tle i czytaj wynik z pliku (FC r3 miał timeout).

RUNDY: 4/5. Commit: **bez linii `Co-Authored-By` z nazwą modelu** (CLAUDE.md zabrania nazw modeli w artefaktach repo); zostaw `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. NIE pushować do parity, nie integrować, nie dotykać `gra/`.
