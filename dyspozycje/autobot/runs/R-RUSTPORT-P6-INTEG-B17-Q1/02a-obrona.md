# 02a-obrona — R-RUSTPORT-P6-INTEG-B17-Q1 (runda 1, obrona Operatora HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-INTEG-B17-Q1
GOAL: odpowiedź na pięć zarzutów wobec runy integracyjnej B17 (STAN-ULEPSZENIA + R7K7-B + K5-LOOP).

Baza weryfikacji: gałąź `rust-port-wip/R-RUSTPORT-P6-INTEG-B17-Q1` (HEAD 15097a342, raport 237e54526).
Ta obrona nie zmienia kodu gry; zapisany jest tylko ten plik.

## Weryfikacja ancestry i zakresu (wykonana w tej rundzie)

- `82bb87fb1`, `da070d099`, `ec7a0ff78`, `4d348e9ac` — `git merge-base --is-ancestor` = TAK dla każdego.
- `git diff --stat 82bb87fb1 rust-port-wip/R-RUSTPORT-P6-INTEG-B17-Q1`: 31 plików, +228871 / −31.
- Nowe `#[ignore]`, `todo!`, `unimplemented!` w diffie `.rs` względem bazy: brak (jedyne trafienia to tekst w plikach `.md` runów).

## Odpowiedzi na zarzuty

### Zarzut 1 — pliki poza allowlistą: `tests/p6_wire_war_epoch.rs`, `tests/p6_wire_war_pop.rs`
**PRZYJMUJĘ** (fakt potwierdzony, nieblokujące).
- Dowód: `git diff 82bb87fb1 rust-port-wip/R-RUSTPORT-P6-INTEG-B17-Q1 -- rust-port/engine/tests/p6_wire_war_epoch.rs rust-port/engine/tests/p6_wire_war_pop.rs` — w każdym pliku dokładnie jedna dodana linia `improvements: Vec::new(),` (oba pliki na liście zmienionych w `--name-only`).
- Pochodzenie: pole `improvements` w `PlayableMap` dodaje commit STAN-ULEPSZENIA (`4d348e9ac`); literały struktury w tych testach bez tego pola nie kompilują się.
- Stan: dispatch nie wymienia tych plików w allowliście, a mój raport operatora o nich nie wspomniał. Błąd był w raporcie, nie w kodzie.
- Poprawka w tej rundzie: brak zmiany kodu (usunięcie linii złamałoby kompilację). Decyzja, czy rozszerzyć allowlistę dla tej mechanicznej zmiany, należy do FC/orkiestratora.

### Zarzut 2 — `ignored=1` bez wskazania pliku
**PRZYJMUJĘ** (luka w raporcie, nieblokujące).
- Dowód: `git grep -n '#\[ignore' 82bb87fb1 -- rust-port/engine/tests/p6_order_lane.rs` → `rust-port/engine/tests/p6_order_lane.rs:1530: #[ignore]`. Ten `#[ignore]` istnieje już na bazie `82bb87fb1` i nie został dodany w B17.
- Diff integracji nie dodaje żadnego nowego `#[ignore]` w kodzie `.rs`.
- Poprawka: ten plik (wskazanie `p6_order_lane.rs:1530` jako źródła `ignored=1`).

### Zarzut 3 — brak wołającego w produkcji: `deactivate_zloze_grants_for_deal`, `sync_relation_status_from_deals`, `siege_tactics_loop`
**PRZYJMUJĘ jako fakt** (nieblokujące, nie naprawiam w B17).
- Dowód (`git grep` w gałęzi integracji, `rust-port/engine/src`): definicje `diplomacy.rs:4190` (`deactivate_zloze_grants_for_deal`) i `diplomacy.rs:4218` (`sync_relation_status_from_deals`); `domain/mod.rs:117` deklaruje `pub mod siege_tactics_loop`; brak wywołań poza definicjami i deklaracją.
- Pokrycie: w `00-dispatch`/tabeli zadań istnieją tematy `ZLOZA-WIRING` (#104) i `K5-LOOP-*` (#91, #96–#99). Sprawdziłem tylko ich obecność w tabeli zadań; ich treści i kolejności nie weryfikowałem — NIE_ZMIERZONO.
- Nie wiążę tych funkcji w tej rundzie: poza allowlistą i zależne od tematów wiringu.

### Zarzut 4 — bramki odtworzone samodzielnie (potwierdzenie, bez obrony)
Zgadza się z moją relacją; nie zarzut wobec mnie. Nie uruchamiałem ponownie `cargo fmt`, `clippy` ani `cargo test` w tej rundzie (NIE_ZMIERZONO w tej obronie — wyniki bramek pochodzą z raportu `01-operator-r1.md` i odtworzenia przez Evaluatora).

### Zarzut 5 — konflikt rozwiązany wg dispatchu (potwierdzenie, bez obrony)
Zweryfikowane w kodzie:
- `rust-port/engine/src/domain/turn_war_inputs.rs:90`: `pub const EXPLICIT_ZERO_REASONS: [(&str, &str); 0] = [];`
- `rust-port/engine/tests/p6_wire_war_inputs.rs:268–271`: asercja `ulepszenia_terenu` zmieniona z `ExplicitZero` na `Provided(0.0)` z komentarzem o producencie na warstwach stanu. Jest to zmiana oczekiwana dispatchem; nie jest osłabieniem (inne asercje bitew/zdobyczy bez zmian: `Provided(0.0)`).
- `ancestry` czterech wejść: TAK.

## Podsumowanie

- Zarzut 1: PRZYJĘTY (fakt), brak zmiany kodu; do decyzji FC: allowlista dla dwóch mechanicznych linii.
- Zarzut 2: PRZYJĘTY (fakt), źródło `ignored=1` = `p6_order_lane.rs:1530`, istniejące na bazie.
- Zarzut 3: PRZYJĘTY (fakt), odroczony; powiązany z `ZLOZA-WIRING` (#104) i `K5-LOOP-*` (#91, #96–#99), których treści nie weryfikowałem.
- Zarzuty 4 i 5: potwierdzenia, bez obrony.

NIE_ZMIERZONO w tej rundzie: ponowne bramki cargo; treść tematów ZLOZA-WIRING i K5-LOOP.

ZMIANY/COMMIT: tylko ten plik `dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-B17-Q1/02a-obrona.md`; brak zmian kodu; brak push.
TESTY: nie uruchamiano (obrona dokumentacyjna; dane z weryfikacji git).
BLOKADY: brak.
RUNDY: 1/5 (obrona).
NASTĘPNY KROK: FC decyduje o allowliście dla dwóch linii `improvements: Vec::new()` i o przyjęciu luk.
DEPLOY/PUSH: NIE WYKONANO
