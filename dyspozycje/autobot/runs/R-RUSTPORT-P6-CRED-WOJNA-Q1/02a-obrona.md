# 02a — Obrona Operatora (runda 1) — R-RUSTPORT-P6-CRED-WOJNA-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-WOJNA-Q1
GOAL: obrona punkt po punkcie zarzutów z rundy Evaluatora/FC; poprawki kodu tam, gdzie zarzut był zasadny i dało się go zamknąć w tej rundzie.
BAZA: 237e54526 (linia rust-port/parity-v2); commit Operatora r1 = 0223d1a2c (kod beefdec4e, raport 01-operator-r1.md).
SHA obrony: patrz sekcja „Commit” na końcu.

## Zarzuty i odpowiedzi

1. **KRYTYCZNY — punkt 4 dispatchu (≥150 wektorów z pinu, wykonanie tekstu, strażnik SHA-256) niedostarczony.**
   ODPOWIEDŹ: PRZYJMUJĘ — zarzut zasadny. Stan faktyczny: `vectors.json` ma 48 sekwencji bez wojny; brak generatora z `chargeWarDeclarationCredibility`. Nie dowiozę ≥150 wektorów w tej rundzie: wymaga rozszerzenia generatora o ścieżkę hamulca (web `main.ts:12176-12225`) i wykonania tekstu z pinu — to osobny temat. W tej rundzie NIE_ZMIERZONO dla wektorów z pinu. Strażnik SHA-256 nie został dodany.

2. **KRYTYCZNY — punkt 3 (test 3 tur S3 `umowa_handlowa`) niedostarczony.**
   ODPOWIEDŹ: PRZYJMUJĘ jako STOP z decyzją (zgodnie z dispatchem: „decyzja gameplay → STOP dla tego elementu z opisem"). Diagnoza: `stream_kind_of` (credibility.rs:597-598) nie produkuje `LegacyTradeAgreement`, więc alias `umowa_handlowa` nie ma realnej ścieżki wejścia. DECYZJA POTRZEBNA: czy wprowadzić alias w `stream_kind_of` (zmiana zachowania rejestru), czy uznać alias za martwy w Rust i pominąć test. Test nie został dopisany, żeby nie utrwalać jednej z tych dwóch interpretacji.

3. **WYSOKI — hak wpięty tylko dla deklaracji z hamulca D8; web woła `chargeWarDeclarationCredibility` w 5 miejscach (main.ts:13168, 13205, 23806, 40441, 41931).**
   ODPOWIEDŹ: PRZYJMUJĘ dla części: pokrycie hamulca D8 (AI-AI i gracz-AI z `may_declare`) jest wpięte i przetestowane. NIE wpinam pozostałych: 13168 i 13205 (wypowiedzenie przez gracza w UI i ścieżka attacker/defender) leżą poza `run_war_turn` w warstwie komend gracza, którą ten temat nie obejmuje w allowliście; 23806 (sojusz) i 40441 (klaster) — NIE_ZMIERZONO, już opisane w 01-operator-r1 (blokada 4). Zakres jest jawny w dokumentacji modułu (turn_war_dipl_steps.rs, komentarz przy haku).

4. **ŚREDNI — brak guardu `isBarbarian` z weba (main.ts:12177 w `chargeWarDeclarationCredibility`) w `note_war_declarations`/`note_war_entered`; brak testu na deklarację z barbarzyńcą.**
   ODPOWIEDŹ: PRZYJMUJĘ i NAPRAWIONO w tej rundzie. `note_war_declarations` (turn_war_dipl_steps.rs) filtruje pary z właścicielem −1 (`BARBARIAN_OWNER_ID`) przed wpisem, zgodnie z guardem webu (`if (isBarbarian(declarerId) || isBarbarian(targetId)) return false;`, main.ts:12181). Dodano test `note_war_declarations_ignores_pairs_with_barbarian` (zapis opaque bez zmian, brak wpisu w `last_war_turn`). Pytanie „czy deklaracje z hamulca mogą zawierać barbarzyńcę": NIE_ZMIERZONO w pinie na poziomie wejść hamulca; guard jest defensywny i nie zmienia wyniku dla par AI.

5. **ŚREDNI — zmieniona istniejąca asercja w `p6_credibility.rs` (`!contains(KEY_LAST_WAR)` → `contains`), wbrew „bez zmiany asercji".**
   ODPOWIEDŹ: PRZYJMUJĘ, że zmiana jest. Dispatch dopuszcza zmianę „literałów/oczekiwań wynikających z haka — wymień" w allowliście `p6_*`; zmiana jest wynikiem haka i wymieniona w raporcie 01 i w komentarzu testu. Dodatkowo asercja jest teraz wzmocniona (`assert_eq` liczby wpisów = 2 dla tury 2). Brak wektora z pinu potwierdzającego zapis last-war w tym scenariuszu — zarzut zasadny, NIE_ZMIERZONO (patrz pkt 1).

6. **ŚREDNI — hak wołany po D8, a odczyt P4 w D4 jest wcześniej; brak wektora z pinu potwierdzającego kolejność wobec deklaracji AI (main.ts:41931); testy sprawdzają tylko zapis `last_war_turn`, nie wpływ na P4 w kolejnych turach.**
   ODPOWIEDŹ: PRZYJMUJĘ jako ograniczenie dowodowe. Kolejność D4 vs D8 w tej samej turze jest zgodna z kolejnością faz w `run_war_turn` (hak po hamulcu), ale dowód z pinu (wektor z kolejnością) NIE został zrobiony — NIE_ZMIERZONO. Wpływ na P4 w turze następnej nie jest objęty testem; odczyt P4 czyta zapisany stan bez zmian kodu (pole `wiarygodnoscOstatniaWojnaTuraByOwner`), co potwierdza fakt, że zapis jest czytany przez istniejący kod P4.

7. **NISKI — punkt 2 (difficulty, excluded_owners) zostawiony domyślnie z opisem; brak dowodu grepem, że producenta nie ma.**
   ODPOWIEDŹ: PRZYJMUJĘ, że brakowało dowodu. Sprawdzenie w tej rundzie: `DiplStepsInputs::difficulty` i `credibility_excluded_owners` (turn_war_dipl_steps.rs:94-97) — komentarz w kodzie mówi wprost „`StartGameParams.difficulty` nie jest jeszcze zmapowane przez producenta (BRAK)". Producent `turn_war_inputs.rs` ma `NOT_IMPLEMENTED`. Realnego wejścia z PlayableState/WarTurnState nie ma, więc zostają wartości domyślne (Normal, pusty zbiór) — zgodnie z dispatchem „jeśli nie — jawnie opisz i zostaw domyślne". Decyzja: NIE_ZMIERZONO, brak producenta.

8. **NISKI — nowe testy nie pokrywają: ścieżki gracz-AI z hamulca (may_declare), wielu deklaracji w jednej turze, round-tripu zapisu opaque po haku, zgodności wstecznej starego zapisu bez klucza.**
   ODPOWIEDŹ: PRZYJMUJĘ częściowo i DOPISANO w tej rundzie:
   - wiele deklaracji w jednej turze: test `note_war_declarations_several_pairs_in_one_turn_write_all_sides` (cztery wpisy w tej samej turze);
   - barbarzyńca: test z pkt 4.
   NIE_ZMIERZONO w tej rundzie: ścieżka gracz-AI z `may_declare` (wymaga fixture z `BrakePhaseOutput` gracza, poza zakresem allowlisty testów p6_cred_wojna bez dalszego rozszerzenia), round-trip opaque po haku (istniejący test „zapis -> odczyt -> tura 4" w p6_credibility.rs:700+ pokrywa round-trip dla tego scenariusza, ale nie osobno po haku) oraz zgodność wsteczna starego zapisu bez klucza. Te trzy elementy: do osobnego tematu.

## Zmiany w tej rundzie (obrona)
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs`: guard barbarzyńcy w `note_war_declarations`.
- `rust-port/engine/tests/p6_cred_wojna.rs`: 2 nowe testy (barbarzyńca; wiele par w jednej turze).
- Formatowanie rustfmt tych dwóch plików.
- Nie zmieniono `Cargo.toml`, `Cargo.lock` (wygenerowany lokalnie, NIE commitowany), `gra/`, `rust-port/engine/data/`, `WERSJE.md`, origin/main.

## Bramki (obrona)
- `cargo fmt --check` (rust-port/engine): EXIT 0 po formatowaniu.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 (przed rustfmt; rustfmt nie zmienia semantyki).
- `cargo test --test p6_cred_wojna`: 7 passed (w tym 2 nowe).
- `cargo test --test p6_credibility --test p6_wire_war_pipeline --lib`: lib 94 ok; p6_credibility 15 ok; p6_wire_war_pipeline 7 ok.
- Pełny `cargo test --no-fail-fast`: NIE_ZMIERZONO.
- Target poza repo (scratchpad), usunięty po bramkach.

## Wynik dla zarzutów
| # | Zarzut | Werdykt |
|---|---|---|
| 1 | wektory z pinu ≥150 | PRZYJMUJĘ — NIE_ZMIERZONO, osobny temat |
| 2 | test S3 umowa_handlowa | PRZYJMUJĘ — STOP, DECYZJA POTRZEBNA (alias) |
| 3 | 5 miejsc wołania web | PRZYJMUJĘ częściowo — D8 wpięte; 13168/13205 poza zakresem; 23806/40441 NIE_ZMIERZONO |
| 4 | guard isBarbarian | PRZYJMUJĘ — NAPRAWIONO + test |
| 5 | zmieniona asercja | PRZYJMUJĘ — dozwolone wyjątkiem allowlisty, wymienione |
| 6 | kolejność D4/D8, brak wpływu P4 | PRZYJMUJĘ — NIE_ZMIERZONO z pinu |
| 7 | difficulty/excluded_owners bez dowodu | PRZYJMUJĘ — brak producenta (NOT_IMPLEMENTED), domyślne |
| 8 | brakujące testy | PRZYJMUJĘ częściowo — 2 dodane; 3 NIE_ZMIERZONO |

## Pytania do właściciela (decyzje gameplay)
- Alias `umowa_handlowa` → `LegacyTradeAgreement`: wprowadzić w `stream_kind_of` czy pominąć?
- Wypowiedzenie przez gracza (13168/13205) i sojusz/klaster (23806/40441): czy wpinać w tym temacie, czy osobnym?

BLOKADY: punkt 1 (wektory z pinu), 2 (test S3 — decyzja), część 3 (13168/13205/23806/40441), część 6 (dowód kolejności), część 8 (gracz-AI, round-trip po haku, zgodność wsteczna). Brak decyzji gameplay poza aliasem.

RUNDY: 1/5 (obrona w rundzie Operatora 1)
NASTĘPNY KROK: Evaluator ponownie na SHA obrony; FC; pytanie ABC o alias S3.
DEPLOY/PUSH: NIE WYKONANO (zakaz push/integracji w dispatchu).
