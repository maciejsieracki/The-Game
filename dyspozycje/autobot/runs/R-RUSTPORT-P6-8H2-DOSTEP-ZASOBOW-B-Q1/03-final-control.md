STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1
GOAL: P6.8H2 partia B, Final Control rundy 2 na `93815cafc` (baza `44a3e9ccf` = ancestor `origin/rust-port/parity-v2`).
ZMIANY/COMMIT: ten plik (jedyna zmiana Final Control). Kod i dokument tematu bez zmian.
TESTY (weryfikacja własna): `git diff --name-only 44a3e9ccf..93815cafc` mieści się w allowliście (resource_access.rs, resource_access/capital_labels.rs, tests/p6_8h2_capital_labels.rs, dokument tematu, katalog runu), zero zmian w gra/**, Cargo.toml, WERSJE.md, improvements.rs. Logi Operatora z EXIT=0: gate-fmt, gate-clippy, gate-test-full (commitowane). Nie powtarzałem cargo w tym przebiegu: dysk `/` 0 B wolnego (No space left on device), więc NIE_ZMIERZONO przeze mnie; poprzedni FC odtworzył fmt/clippy/11 testów na tym SHA.

ZARZUTY (rozstrzygnięcie):
1. Zakres: 13 z 16 funkcji resource-access.ts nie zportowane — NAPRAW (Operator r3).
2. Brak wektorów z pinu 91dc998a — NAPRAW.
3. Różnica JS vs Rust: potwierdzona dowodem. gra/src/game/resource-access.ts:64 `SUROWIEC_KEY_LABEL: Record<string,string>` i `labelForHex` `if (ZLOZE_LABEL[z]) return ZLOZE_LABEL[z]!` (zwykły obiekt) — dla z="constructor"/"toString" web zwraca funkcję z prototypu, Rust None/kapitalizację. Do tego charAt(0) vs chars().next(). Brak wektora i brak wpisu NIE_ZMIERZONO — NAPRAW (wektor z pinu + opis rozbieżności).
4. clearCityCultureMix (state.rs:544-581) i placedImprovementsWithZlotoTradeGrant (main.ts) niezbadane — NAPRAW (lekcja nr 3: opis wywołującego z dowodem grep).
5. Mutacje tylko capital_labels.rs; brak mutantów dla tabel i gałęzi `if let Some` — NAPRAW (mutacja albo dowód równoważności plik:linia).
6. Brak surowego logu M13 SURVIVED przed poprawką — NAPRAW (powtórzyć M13 bez nowego testu i commitować log).
7. Nagłówek dokumentu tematu: "runda 1/5", commit 598da6429; sekcja diff --check odsyła do raportu zamiast do logu gate-*.txt z EXIT= — NAPRAW.
8. Gałąź p6-8h2-dostep-zasobow-b wskazuje 598da6429, a 93815cafc jest na detached HEAD (worktree -2/-3) — NAPRAW (przenieść gałąź na SHA końcowy). Uwaga proceduralna: nie przenosiłem, bo to krok integracji.
DO DECYZJI CZŁOWIEKA: brak.

Rozstrzygnięcie zarzutu z OBRONY o zleceniu merge/push z głównego czatu: ODDAL — poza zakresem Final Control; wiadomości właściciela w kontekście są przestarzałe, merge/deploy/push wymaga READY_FOR_DEPLOY i osobnej autoryzacji. Obrona słusznie nie wykonała merge. Uwaga: deploy ROBOCZA (5ab3d58e2) już jest na origin/main wg Obrony; merge gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 ma konflikt w dyspozycje/REJESTR-PROSB-I-ZADAN.md — decyzja orkiestratora, nie tego tematu.

Wierność tego, co zportowano: zgodna z webem (poprzedni FC, bez rozbieżności) — część zrobiona jest poprawna.

BLOKADY: zarzuty 1-8 (NAPRAW). INFRA: dysk `/` pełny (0 B) — kolejne rundy wymagają zwolnienia miejsca (target na /dev/shm; nie usuwać cudzych worktree).
RUNDY: 2/5 (FC) -> wraca do Operatora r3, ten sam ID.
NASTĘPNY KROK: Operator r3 (13 funkcji resource-access.ts, wektory z pinu 91dc998a, mutacje nowych gałęzi i tabel, opis placedImprovementsWithZlotoTradeGrant/clearCityCultureMix, surowy log M13, poprawka nagłówka dokumentu), potem Evaluator i Final Control.
SHA końcowy do integracji: brak (FAIL). Najnowszy SHA pomiarowy: `93815cafc` (kod); po commicie tego raportu SHA = SHA commitu FC nad `93815cafc`. Kolejność względem origin/rust-port/parity-v2 (44a3e9ccf): rebase/merge po PASS, partia B nad 44a3e9ccf; 8I i M07B niezależne (inne pliki).
DEPLOY/PUSH: NIE WYKONANO

---

# Final Control — runda 4/5 (zarzuty Evaluatora r3 + Obrona r4)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1
GOAL: P6.8H2 partia B — port `resource-access.ts` (16 fn) + `society-inputs.ts` (religia dominująca), wektory z pinu `91dc998a`.
ZMIANY/COMMIT: oceniano `fb18c7824` (kod `9b158a55a` + raport r4). Baza `44a3e9ccf` == `origin/rust-port/parity-v2` (merge-base zgodny, brak dryfu). `git diff --name-only 44a3e9ccf fb18c7824` mieści się w allowlista (resource_access.rs, resource_access/**, tests/p6_8h2_*, dokument tematu, katalog runu); zero zmian w gra/**, Cargo.toml, WERSJE.md, improvements.rs, mapgen/**. `git diff --check 44a3e9ccf fb18c7824`: czysto.

ROZSTRZYGNIĘCIE ZARZUTÓW (dowód własny):
1. isForeignReligionDominant — ODDAL (naprawione): `society_inputs.rs` (105 LOC), test `p6_8h2_society_inputs` 5/5, mutanty S01–S11 (7 KILLED + 4 równoważne z uzasadnieniem plik:logika).
2. Z1 / domyślna ścieżka `computeEmpireLivestockUnlocks` — ODDAL (naprawione): `active_access.rs:333,427-436`. Własny mutant (`(None, Some(placed)) if false`) -> test FAILED (KILLED).
3. Mutanty ogonków/era/tiebreak — ODDAL (naprawione): własne mutanty `era_ui_name(1)->None` (linia 53) i `'ł'->letter('l',0)` (linia 270) -> oba KILLED; dokument: M37–M44 KILLED, tiebreak bajtowy usunięty.
4. Test prototypów bez `continue` — ODDAL (naprawione): 270 przypadków asercjami; źródło rozbieżności w `mapgen/params.rs` poza allowlistą (zakaz zmian) -> NASTĘPNA-PARTIA/M07B, jawnie w dokumencie.
5. Dokument tematu — ODDAL (naprawione): runda 4/5, SHA kodu `9b158a55a`, gałąź wskazuje commit raportu (zgodne z `git rev-parse`); `gate-diffcheck-r4.txt` jest komentarzem + EXIT, ale własny `git diff --check` na zakresie baza..HEAD czysty (uwaga kosmetyczna).
6. Pusta linia przed `EXIT=` — ODDAL (zarzut chybiony): w logach r4 linia bezpośrednio przed `EXIT=0` to wynik cargo (`test result`), pusta linia jest wcześniej; po jednym `EXIT=` w pliku.
7. Duplikat `clear_city_culture_mix` (resource_access.rs:320 vs state.rs:546/581) i hak `placed_improvements_with_zloto_trade_grant` (:266) — ODDAL: opis z dowodem grep; oba symbole z partii A (już w parity-v2) są używane przez testy spoza allowlisty (`p6_8h_access.rs`, `p6_6a_conquest.rs`), więc usunięcie wymaga zmiany plików poza zakresem; web-odpowiednik no-op `@deprecated`. Zapisane jako NASTĘPNA-PARTIA (sprzątanie), nie blokuje. Decyzja produktowa człowieka: brak.

Zarzutów NAPRAW: 0 -> PASS.

TESTY (własne, target /dev/shm, usunięty po pracy): `cargo fmt --all -- --check` EXIT=0 (w `rust-port/engine`); `cargo clippy --all-targets -- -D warnings` EXIT=0; `p6_8h2_active_access` 11/11, `p6_8h2_capital_labels` 11/11, `p6_8h2_society_inputs` 5/5, `p6_8h_access` 13/13; pełny `cargo test` 1967 passed, 0 failed.
NIE_ZMIERZONO: regeneracja wektorów z pinu (`gen-vectors.sh 91dc998a`, wymaga sieci/esbuild); pełny przebieg 55 mutantów (powtórzono 3 wybrane).
BLOKADY: brak blokujących. Notatki: Z7, Z7b, Z5 (źródło w mapgen) jako NASTĘPNA-PARTIA.
RUNDY: 4/5 (FC) -> PASS-WITH-NOTES.
NASTĘPNY KROK: integracja orkiestratora. SHA końcowy do integracji: kod `9b158a55a`, głowa gałęzi `p6-8h2-dostep-zasobow-b` = `fb18c7824` (po commicie tego raportu: SHA commitu FC nad `fb18c7824`). Baza `44a3e9ccf` == origin/rust-port/parity-v2, merge bez konfliktów oczekiwany (zakres rozłączny z 8I `improvements.rs`/`auto_improvements*` i M07B `mapgen/**`); przed merge ponowić `git fetch origin rust-port/parity-v2` i bramki po scaleniu.
DEPLOY/PUSH: NIE WYKONANO
