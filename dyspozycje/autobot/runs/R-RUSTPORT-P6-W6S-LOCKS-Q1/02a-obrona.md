STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-W6S-LOCKS-Q1 (W6 wariant A, punkt 1: blokady akcji dyplomacji, runda 2/5, obrona Operatora)
GOAL: port `resolveDiplomacyActionLock` (web, pin 07d2fbd72) do `rust-port/engine/src/domain/diplomacy_locks.rs` z testem behawioralnym na wektorach pinu; odpowiedź na zarzuty Evaluatora r1.
BAZA: kod r1 `3c5a20e9b`, raport r1 `162b586db` (gałąź `R-RUSTPORT-P6-W6S-LOCKS-Q1-wip/operator-r1`). Kod r2: SHA w wiadomości commita (podany w odpowiedzi orkiestratorowi).

ZMIANY/COMMIT (allowlista):
- `rust-port/engine/src/domain/diplomacy_locks.rs`: liczby w notkach bramek przez `fmt_prog_locks` (dla całkowitych `js_number_to_string` z `diplomacy_aggressor`, bez nasycenia `as i64`); notka `'15'` (`${minAge}`, `${remain}`) przez `js_number_to_string` (pełny `Number#toString`: notacja `1e+21` / `1e-7`). Usunięto lokalne `js_num` (`as i64`).
- `rust-port/engine/tests/p6_w6s_locks_gen.mjs`: wiersze graniczne `boundaryRows()` (wiek wasala i respekt ±1/±0.25 wokół progów; pola bramek wszystkich akcji 2..15 = próg + {-1,-0.25,0,0.25,1}); ułamki w losowych wartościach (0.25/0.5/0.75/0.1); wartości ekstremalne dla `'15'` (1e19, -1e21, reszta 9.9999999); wspólny `case15Base()` (pełny kontekst, bez brakujących pól).
- `rust-port/engine/tests/p6_w6s_locks_vectors/locks.json`: regenerowany generatorem z pinu (esbuild 0.24.0 poza repo), 4000 wierszy (r1: 3000). `'15'`: 366 wierszy (316 zablokowana bez wymagania, 26 z wymaganiem respektu, 24 otwarta); 50 notek z ułamkiem w `pozostało`, 26 w notacji wykładniczej.
- `rust-port/engine/tests/p6_w6s_locks.rs`: (a) `vectors_cover_every_case_and_outcome` wzmocniony: każda stała notka web (lista `EXPECTED_NOTES`), prefiks notki wasala (`EXPECTED_PREFIXES`) i każdy rodzaj wymagania per akcja (`REQUIRED_KINDS`) MUSI wystąpić w wektorach; (b) nowy `action_15_age_and_respekt_boundaries_match_web` (wartości wyprowadzone ręcznie z web `diplomacy-locks.ts:357-369` i `respektGate`, nie z wektorów); (c) nowy `action_15_fractional_and_exponent_notes_match_js` (ułamek `0.5`, `9.99999993922529e-8`, `1e+21`, `10000000000000000000`, remis toFixed `89.25` -> `89.3`).
- NIE zmieniano: `diplomacy_nap_trust.rs`, `mod.rs`, `gra/**`, `origin/main`, `WERSJE.md`, `Cargo.toml`, `Cargo.lock` (untracked, NIE commitowany), `rust-port/parity-v2`.

ODPOWIEDZI NA ZARZUTY EVALUATORA:

1. (średni) Granica age == minAge w case '15' — PRZYJMUJĘ.
   - Dodano siatkę graniczną w generatorze: dla '15' age ∈ {min-1, min-0.25, min, min+1, 0, min-1e-7} x respekt ∈ {wch-1, wch-0.25, wch, wch+1} x min ∈ {5,10,12} x wch ∈ {80,90} (144 wierszy); dla każdej akcji 2..15 każde pole bramki = próg ±1 / ±0.25 (715 wierszy). Losowe wiersze mają 35% wartości wokół progu.
   - Dodano test `action_15_age_and_respekt_boundaries_match_web` z wartościami ręcznymi (age == minAge przechodzi; min-1 -> "pozostało 1"; respekt wch-1 -> wymaganie respekt, masz wch-1; respekt == wch przechodzi).
   - Test MUTACYJNY (uruchomiony ręcznie na kopii pliku, plik przywrócony bajt w bajt, nie commitowany):
     - `if age < min_age` -> `if age <= min_age`: FAILED w 3 testach (`action_15_age_and_respekt_boundaries_match_web`, `action_15_fractional_and_exponent_notes_match_js`, `resolve_diplomacy_action_lock_matches_pinned_web_vectors`). Mutacja ZABITA.
     - `if masz >= prog` -> `if masz > prog` (`simple_gate`): FAILED w 2 testach (`action_15_age_and_respekt_boundaries_match_web`, `resolve_diplomacy_action_lock_matches_pinned_web_vectors`). Mutacja ZABITA.

2. (średni) Brak wektorów z częścią ułamkową (toFixed(1), niecałkowite `${n}` w '15') — PRZYJMUJĘ.
   - Wektory: ułamki w `requirement.prog/masz` i w `pozostało` (50 notek z `x.y`, 26 w notacji `e-8`/`e+21`); remisy toFixed z wartościami progu ±0.25 (np. x.25, x.75).
   - Test `action_15_fractional_and_exponent_notes_match_js` pokrywa ręcznie wyliczone przypadki (`0.5`, `9.99999993922529e-8`, `1e+21`, remis `89.25` -> `89.3`). Oczekiwania potwierdzone semantyką JS `toFixed` (remis po wartości bezwzględnej w górę) i `Number#toString`.

3. (niski) `vectors_cover_every_case_and_outcome` wymagał tylko open/locked-req — PRZYJMUJĘ.
   - Test sprawdza teraz: każdą stałą notkę z web per akcja (`EXPECTED_NOTES`, w tym `""` dla gałęzi open i `zrywa Sojusz`), prefiks notki wasala (`EXPECTED_PREFIXES`) oraz każdy rodzaj wymagania per akcja (`REQUIRED_KINDS`: zaufanie / stan / respekt tam, gdzie web je zwraca).
   - Test przechodzi na wektorach r2; brak luki = brak wektora = FAILED.

4. (niski) Rozjazd Rust vs JS dla |x| >= 1e21 (js_num, fmt_prog przez `as i64`) — PRZYJMUJĘ CZĘŚCIOWO, z dowodem zakresu.
   - Naprawione (w zakresie allowlisty): notki `'15'` (`${minAge}`, `${remain}`) i wszystkie notki bramek liczone przez `formatted_note`/`simple_gate` (`fmt_prog_locks`) używają `js_number_to_string` zgodnego z `Number#toString` dla pełnego zakresu (`1e+21`, `1e-7`, `10000000000000000000`). Test: `action_15_fractional_and_exponent_notes_match_js`.
   - Poprawka korekty opisu zarzutu: rozjazd współdzielonego `diplomacy_nap_trust::fmt_prog` zaczyna się już przy |n| >= 2^63 (nie 1e21), bo `as i64` nasyca do i64::MAX.
   - Pozostaje (UDOKUMENTOWANE, NIE naprawione): `dual_gate` (case 3, 4, 6, sojusz/granice/wymiana tech) i `resolve_nap_lock` (case 2) używają `diplomacy_nap_trust::fmt_prog`. Plik poza allowlistą tematu. Osiągalność: progi są stałymi webu, relacja/zaufanie/respekt w silniku są rzędu 0..200; generator dla tych akcji nie produkuje |n| >= 2^53 (tylko NaN, ±Infinity, wartości 0..120 i ułamki). Naprawa wymaga osobnego tematu, który dotknie `diplomacy_nap_trust.rs`.
   - Komentarz w nagłówku `diplomacy_locks.rs` opisuje to ograniczenie.

5. (informacyjny) Kryterium 1: jedyne wołanie na pinie to `diplomacy-audience-actions.ts:83`, brak portu w Rust — PRZYJMUJĘ jako informację, bez zmian w kodzie. Zależność do W8 pozostaje jawna (raport r1, sekcja BLOKADY). Nie zmieniano mapowania.

BRAMKI (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- `cargo fmt --check` (po `rustfmt --edition 2021` na obu plikach tematu): EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: EXIT 0, 28 passed, 0 failed, 0 ignored.
- `cargo test --test p6_w6s_locks`: EXIT 0, 5 passed, 0 failed, 0 ignored (`resolve_diplomacy_action_lock_matches_pinned_web_vectors`, `vectors_cover_every_case_and_outcome`, `action_15_without_vassal_is_locked_with_web_note`, `action_15_age_and_respekt_boundaries_match_web`, `action_15_fractional_and_exponent_notes_match_js`).
- `git diff --check`: czysto. `#[ignore]` w pliku testu: 0.
- Mutacje ręczne: 2 zabite (patrz pkt 1); pliki przywrócone, `cmp` OK.

NIE_ZMIERZONO:
- Porównanie z uruchomioną grą w przeglądarce (test dotyczy logiki, nie UI).
- Zachowanie współdzielonego `fmt_prog` dla |n| >= 2^63 w ścieżkach case 2/3/4/6 (poza allowlistą, nieosiągalne w danych silnika; nie testowano wprost).
- Pełny `cargo test` (zgodnie z kryteriami: `--lib` i wskazany test integracyjny).
- Wydajność.

BLOKADY:
- Kryterium 1 bez zmian względem r1: brak wołającego w Rust, zależność do W8 jawna.
- Ograniczenie fmt w `diplomacy_nap_trust.rs` (pkt 4): udokumentowane, do osobnego tematu.

RUNDY: 2/5 (obrona Operatora, runda 2; ostatni werdykt Evaluatora r1: zarzuty 1-5 jak wyżej)
NASTĘPNY KROK: Evaluator (runda 2, kod r2: SHA w wiadomości commita), weryfikacja: regeneracja wektorów generatorem, mutacje, pokrycie.
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi roboczej `R-RUSTPORT-P6-W6S-LOCKS-Q1-wip/operator-r1`; `rust-port/parity-v2`, `origin/main` nietknięte; brak integracji).
