# 02a — Obrona Operatora (runda 2) — R-RUSTPORT-P6-CRED-WOJNA-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-WOJNA-Q1
GOAL: odpowiedź na każdy zarzut rundy Evaluatora (r2): PRZYJMUJĘ z poprawką i dowodem albo ODRZUCAM z dowodem.
BAZA: 86a336324 (raport Operatora r2, kod 66d181ea5). Commit obrony: patrz sekcja „Commit” na końcu.
Pinned web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (tylko odczyt).

## Zarzuty i odpowiedzi

1. **Hak P4 nie wpięty w deklarację wymuszoną (declare_forced_wars / declare_from_assignments).**
   ODPOWIEDŹ: PRZYJMUJĘ — poprawka wykonana.
   - `war_turn_declare.rs`: `declare_forced_wars` wola `note_war_declarations(state, pairs, turn)?` PRZED mutacją stanu wymuszen
     (blad odczytu rejestru nie zostawia czesciowego zapisu). `declare_from_assignments` przekazuje wynik dalej.
     Sygnatury zmienione na `Result<usize, WarTurnError>`.
   - Adaptacja wywołań testowych (tylko `.unwrap()` na wywołaniach, asercje bez zmian): `tests/p6_wire_war_declare.rs`
     (8 miejsc), `tests/p6_wire_war_declare_peace.rs` (2 miejsca).
   - Nowy test: `tests/p6_cred_wojna_forced.rs` (4 testy): obie strony pary zapisane (`last_war_turn`); barbarzyńca nie
     zapisuje rejestru, a wymuszenie działa jak dotąd; `declare_from_assignments` charguje tylko zadeklarowane pary;
     błąd odczytu rejestru → Err i brak zmiany `forced`.
   - Dowód produkcji: `grep` po `src/` — `declare_forced_wars` i `declare_from_assignments` nie mają wołającego poza testami.
     Zgodnie z zarzutem: dziś bez skutku w grze, luka parytetu zamknięta na poziomie funkcji.
   - Wektor przez pipeline dla ścieżki wymuszonej NIE_ZMIERZONO (brak wołającego w produkcji — nie ma czego wektorować pipeline'em).

2. **Test wektorowy nie przechodzi przez run_war_turn; „POTWIERDZONE WEKTOREM” przesadzone.**
   ODPOWIEDŹ: PRZYJMUJĘ — zarzut zasadny. Dowód: `tests/p6_cred_wojna_vectors.rs` wola `note_war_declarations`
   bezposrednio; jedyne wystapienie `run_war_turn` to komentarz (linia 85). Kolejnosc tick P4 jest składana w tescie.
   Korekta: kolejność D4 vs hamulec jest potwierdzona na poziomie komponentów (`note_war_declarations` i odczyt P4),
   NIE na poziomie `run_war_turn`. Pełny wektor pipeline'u NIE_ZMIERZONO (koszt/zakres tej rundy).
   Korekta opisu: raport `01-operator-r2.md` należy czytać z tą korektą.

3. **Zakres wektorów zawężony (activeDeals puste, brak ofert rozejmu, tylko Normal; N2/N1/truceBreach nieporównywane).**
   ODPOWIEDŹ: PRZYJMUJĘ jako ograniczenie — już opisane jako blokada (1) w `01-operator-r2.md` i w nagłówku
   `tests/p6_cred_wojna_vectors.rs`. Bez zmiany kodu: rozszerzenie generatora o traktaty/oferty/trudności to osobny temat.
   Gałęzie N2/N1/truceBreach nie dotykają last-war (zgodnie z pinem); nie są częścią zakresu haka.

4. **Nieaktualny komentarz doc w `credibility.rs` przy `note_war_entered`.**
   ODPOWIEDŹ: PRZYJMUJĘ — poprawione. Komentarz wskazuje faktycznych wołających: `note_war_declarations`
   (hamulec) i `declare_forced_wars` (wymuszona). `credibility.rs` należy do allowlisty „moduły wiarygodności”.

5. **`turn_war_pipeline.rs:422` — błąd z `note_war_declarations` (`?`) wraca po mutacji `ctx.war.brake_phase`; atomowość nie testowana.**
   ODPOWIEDŹ: ODRZUCAM — dowód:
   - `run_dipl_steps` (D4) wywoływane w `run_war_turn` na linii 370, PRZED hamulcem (`run_brake_phase`, linia 415).
     D4 czyta ten sam `war.opaque` przez `CredibilityRegistry::from_meta` (`turn_war_dipl_steps.rs:613`) i propaguje błąd
     operatorem `?`. Jeśli zapis rejestru byłby nieczytelny, pipeline przerwie się już na linii 370, zanim hamulec
     zmodyfikuje `brake_phase`.
   - Między D4 a hakiem (linie 370-422) zapisy do `opaque` idą wyłącznie przez `store_changes` (poprawny JSON), więc
     drugi `from_meta` w `note_war_declarations` (`turn_war_dipl_steps.rs:891`) nie ma realnej ścieżki do błędu.
   - Pipeline i tak mutuje stan przed błędami (`tick_pairs_relation_scores` na `ctx.war.diplomacy`, linia ~395);
     atomowość całego `run_war_turn` przy błędzie nie jest kontraktem tej funkcji. Kontrakt wywołującego: NIE_ZMIERZONO.
   - Hak w ścieżce wymuszonej (zarzut 1) wykonuje sprawdzenie PRZED mutacją, więc tam atomowość jest zapewniona i testowana.

6. **Niewpięte: wypowiedzenie gracza (main.ts:13168), ownerDeclareWarOn (13205), sojusz (23806), klaster (40441); `declare_war_opts` tylko z testów.**
   ODPOWIEDŹ: ODRZUCAM wpięcie w tym temacie — dowód:
   - `declare_war` nie ma żadnego wołającego w `src/` (0 trafień `.declare_war(`); `declare_war_opts` ma tylko definicję
     i wywołanie z `declare_war`. Nie ma produkcyjnego miejsca wywołania do wpięcia.
   - Rejestr wiarygodności żyje w `WarTurnState::opaque`, a `declare_war_opts` działa na `TruceDiplomacy`
     (`diplomacy_truce_flow.rs`, poza allowlistą r2). Wpięcie haka w `declare_war_opts` wymagałoby dostępu
     do `WarTurnState` spoza zakresu allowlisty i nie byłoby wykonywane przez żaden test produkcyjny.
   - Sojusz (23806) i klaster (40441): zgodnie z dyspozycją nie tworzono nowej ścieżki; `alliance_war_obligation`
     istnieje tylko w testach, klaster nie ma odpowiednika w Rust.
   - Wniosek: to osobny temat (wiring wypowiedzenia gracza w Rust razem z dostępem do `WarTurnState`), a nie poprawka
     tej rundy. Pozycja zostaje jako blokada w raporcie.

## Co zmieniono w tej obronie

- `src/domain/war_turn_declare.rs`: hak P4 w `declare_forced_wars` (przed mutacją), `declare_from_assignments` → `Result`.
- `src/domain/credibility.rs`: poprawiony komentarz `note_war_entered` (tylko doc).
- `tests/p6_wire_war_declare.rs`, `tests/p6_wire_war_declare_peace.rs`: `.unwrap()` na wywołaniach (bez zmiany asercji).
- `tests/p6_cred_wojna_forced.rs`: nowy plik, 4 testy.
- Nie zmieniano: `gra/`, `rust-port/engine/data/`, `Cargo.toml`, `Cargo.lock` (nie commitowany), `vectors.json`, generator.

## Bramki (EXIT zapisany)

- `cargo fmt --check` (rust-port/engine): EXIT 0 po `cargo fmt` (zmienione pliki sformatowane).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- Testy celowane: `p6_cred_wojna_forced` 4 ok; `p6_cred_wojna_vectors` 3 ok; `p6_wire_war_declare` 15 ok;
  `p6_wire_war_declare_peace` 7 ok; `p6_wire_war_pipeline` 7 ok; `p6_credibility` 15 ok (liczby z podsumowania `cargo test`).
- `cargo test` (cały): proces przerwany przez limit 590 s (EXIT 124) po 1491 zaliczonych testach, 0 niezaliczonych
  w częściowym logu. Pełny przebieg NIE_ZMIERZONO.
- Mutacja haka w ścieżce wymuszonej: NIE_ZMIERZONO w tej rundzie (test `forced_war_charges_both_sides_of_the_pair` wymusza
  zapis; brak osobnej mutacji wykonanej).

## Commit

SHA: patrz wiersz „SHA obrony” w raporcie orkiestratora (commit zapisany w gałęzi lokalnej
`rust-port-wip/R-RUSTPORT-P6-CRED-WOJNA-Q1-r2-obrona`, bez push).

RUNDY: 2/5 (obrona). Werdykt: PASS-WITH-NOTES; blokady bez zmian: wypowiedzenie gracza/sojusz/klaster (zarzut 6),
pełny wektor pipeline'u (zarzut 2), zakres wektorów (zarzut 3).
NASTĘPNY KROK: Final Control rundy 2 (weryfikacja zarzutów 1, 2, 4 i odrzucenia 5 i 6).
DEPLOY/PUSH: NIE WYKONANO.
