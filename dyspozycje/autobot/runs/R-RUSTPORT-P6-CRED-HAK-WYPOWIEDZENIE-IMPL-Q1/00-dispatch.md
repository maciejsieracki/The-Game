# DISPATCH R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1 (runda 1)

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: wypowiedzenie wojny przez gracza — pierwszy wycinek wdrożenia (zadanie #171, po rozpoznaniu CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1, FC PASS-WITH-NOTES 769d0aac3).
MODEL: Operator HAIKU 5.5; Obrona HAIKU 5.5; Evaluator SONNET 5.5; Final Control SONNET 5.5.

ZASADA (CLAUDE.md zasada 11): ZASADY Z WEBU, KODOWANIE W RUST. Pin `07d2fbd72`. Kolejność kroków i wartości parametrów bierzesz z webu, nie z pamięci. Pytań do właściciela NIE zadajesz; brak rozstrzygnięcia w webie = NIE_ZMIERZONO.

ŹRÓDŁO: rozpoznanie `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/01-rozpoznanie.md` (sekcje 1–2) oraz obrona `02a-obrona.md` (poprawki numerów linii i kolejności; czytaj je razem z raportem).

KROK 0 (obowiązkowy, przed kodem): z pinu odczytaj i zapisz w `01-parametry.md`: wartości N2, N3, N5 z `_diplomacyParams` (web `gra/src/main.ts` i pliki diplomacji), progi karencji, kary zlamana_obietnica, oraz kolejność kroków `playerDeclareWarOnOwner` (main.ts ~13152–13185) z numerami linii. Bez tych liczb nie piszesz testów wektorowych.

ZAKRES WDROŻENIA (tylko to; reszta = BRAK w rejestrze, nie w tym temacie):
1. Krok kolejności w Rust: wrapper `declare_war_by_player` (nowy moduł) wykonuje kroki w kolejności webu: (a) kara za wiarygodność BEZ zapisu relacji, (b) `breakTreatiesOnWar` z `breakerIsPlayer=true`, (c) relacja → wojna, (d) rejestracja wypowiedzenia z przyczyną. Dla istniejącego `declare_war_opts` (`diplomacy_truce_flow.rs:247`) NIE zmieniaj sygnatury; wrapper użyj tylko tam, gdzie kolejność jest identyczna z webem.
2. Komenda `declare_war` w `rust-port/engine/src/bridge.rs` (dopisanie, bez zmiany istniejących komend). Wersja kontraktu: sprawdź konwencję w `bridge.rs` i zapisz decyzję (bump `CONTRACT_VERSION` TYLKO jeśli konwencja tego wymaga; decyzję uzasadnij w raporcie).
3. Testy: wektory z pinu (wartości z KROKU 0), przypadek kolejności (kara liczona przy relacji pokoju, nie wojny), przypadek bez karencji, test mutacji (zamiana kroków a↔c musi dać FAIL).

NIE W TYM TEMACIE: `diplomacyLayerForOwner`, `playerDiplomacyActionAllowed`, `pruneTributeNegotiationsBetween`, `recordWarDeclarationEvent`, `pruneInvalidNegotiations`, `applyDiploEventTracked`, `applyAllianceObligationsOnWar` (zostają BRAK w rejestrze jako osobne tematy).

BAZA: `origin/rust-port/parity-v2` = `a01363d5f`. Worktree z tej bazy. Przed pracą: `git merge-base --is-ancestor a01363d5f HEAD`.

ALLOWLISTA (wszystko poza tym = FAIL):
- `rust-port/engine/src/domain/diplomacy_player_war.rs` — NOWY
- `rust-port/engine/src/domain/mod.rs` — WYŁĄCZNIE dopisanie `pub mod diplomacy_player_war;`
- `rust-port/engine/src/bridge.rs` — WYŁĄCZNIE dopisanie komendy `declare_war` (+ ewentualny bump wersji)
- `rust-port/engine/tests/p6_cred_hak_*.rs` — NOWE pliki testów
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1/**`

ZERO ZMIAN W: `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`, `src-tauri/**`, `rust-port/engine/src/domain/diplomacy.rs` (tylko odczyt), `diplomacy_truce_flow.rs` (tylko odczyt), `Cargo.lock` (nie commitować).

BRAMKI (EXIT 0, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, CARGO_TARGET_DIR poza repo):
- `cargo fmt --check` w `rust-port/engine`
- `cargo clippy --all-targets -- -D warnings`
- `cargo test --all-targets` (pełny)
- `git diff --check`

KRYTERIA KOŃCA: 1) kolejność kroków z KROKU 0 odtworzona i udokumentowana plik:linia; 2) wektory z pinu; 3) test mutacji z FAIL; 4) brak `#[ignore]`, brak osłabionych asercji; 5) każde pole/krok bez odpowiednika jawnie w NIE_ZMIERZONO lub BRAK.

PROCES: Operator (impl) → Evaluator → (Obrona jeśli zarzuty) → Final Control. Commit z jawnym `git add` (nigdy `-A`). Bez push na parity, bez integracji, bez deployu. Commit z `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` i ostatnią linią `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`; nazwy modelu nie wpisuj do treści kodu ani raportów.
