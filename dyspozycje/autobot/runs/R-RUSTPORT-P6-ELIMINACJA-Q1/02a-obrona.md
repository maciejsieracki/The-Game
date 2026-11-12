# OBRONA Operatora (runda 1) — R-RUSTPORT-P6-ELIMINACJA-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ELIMINACJA-Q1
GOAL: odpowiedz na 5 zarzutow Evaluatora (02-evaluator.md, commit 33b5dd19b); przyjete poprawki z dowodem, odrzucenia z dowodem.
ZMIANY/COMMIT: kod obrony: patrz SHA na dole. Allowlista: `rust-port/engine/tests/p6_eliminacja*` (gen, test, vectors.json) oraz `rust-port/engine/src/domain/eliminacja.rs` (tylko komentarz naglowka). Brak zmian w gra/, origin/main, Cargo.lock (nieSledzony, nie commitowany), brak push.
BAZA: kod Operatora 86f039ebf, raport 361bf9c18. Galaz `R-RUSTPORT-P6-ELIMINACJA-Q1-wip/operator-r1` jest zajeta przez inny worktree, wiec praca na detached HEAD.

## Odpowiedzi na zarzuty

### Zarzut 1 (istotne): deals / forced / era-enter nie sa czyszczone — ODRZUCAM w tym temacie, PROPONUJE rejestracje jako osobny temat
Dowody (pin 07d2fbd72, `gra/src/main.ts`):
- `activeDeals = activeDeals.filter(d => !d.strony.includes(ownerId));` — linia 35482.
- wymuszone wojny: `bronzeEraEnterTurnByOwner.delete` 35418, `bronzeForceWar{Pending,Cycle,RestUntil,ActiveByPairKey}` 35418-35424, analogicznie stone i iron; `ironEraEnterTurnByOwner.delete` 35440.
- Rust: `war.diplomacy.deals` (diplomacy.rs:1656), `war.forced[0..2]` (war_turn_state.rs:124), `war.bronze_era_enter_turn_by_owner` i `war.iron_era_enter_turn_by_owner` (war_turn_state.rs:126,128). `eliminate_owner` ich NIE czysci. Zarzut zgodny z kodem.

Uzasadnienie odrzucenia w tym temacie: dyspozycja (GOAL, pkt 2 i 3) wymienia wymiary do czyszczenia i wektoryzowania: miasta, jednostki, akumulatory mocy, relacje. Deals, wymuszone wojny i wpisy epok nie naleza do tego zakresu. Ich czyszczenie wymaga rozszerzenia konstrukcji stanu testu o dodatkowe struktury i generatora o ich snapshot. Dyspozycja tego nie zleca, a dodanie tego do tematu zmienia zakres zadania.

Proponowane ID rejestracji: **ELIMINACJA-GRACZA-DEALS-WOJNY-Q2** (deals + forced[0..2] + era-enter). Oblezenia jako osobna pozycja w tym samym temacie, bo Rust nie ma struktury oblezen wlasciciela. Decyzja rejestracji po stronie orkiestratora.

W kodzie: komentarz naglowka `domain/eliminacja.rs` wymienia teraz te cztery struktury z liniami pinu i polami Rust, jako NIE_ZMIERZONO z proponowanym ID.

### Zarzut 2 (srednie): wektory nie obejmuja tych struktur — ODRZUCAM jako zalezne od zarzutu 1
Bez czyszczenia tych struktur w Rust nie ma czego wektoryzowac. Dodanie pol, ktorych funkcja nie zmienia, dawaloby test bez wartosci. Wektory zostaja dla zakresu z dyspozycji (jednostki, eliminatedOwners, akumulatory bitwy i zdobyczy, relacje). Te pola zostana objete wektorami razem z czyszczeniem w ELIMINACJA-GRACZA-DEALS-WOJNY-Q2.

### Zarzut 3 (male): eliminatedOwners porownywane po sortowaniu — PRZYJMUJE, poprawka
- `p6_eliminacja_gen.mjs`: `eliminated: [...s.eliminatedOwners]` bez sortowania. Set JS zachowuje kolejnosc wstawiania, Vec Rust tez.
- `p6_eliminacja.rs`: `build_state` nie sortuje `eliminated`; asercja `assert_eq!(elim, i64s(&step["expect_eliminated"]))` bez `sort_unstable`.
- Wektory przegenerowane z pinu (straznik SHA-256 przeszedl): 180 przypadkow / 417 krokow.

### Zarzut 4 (male): id ujemne tylko w tescie recznym; galaz oblezen niepokryta — CZESCIOWO PRZYJMUJE
- Przyjete: `CALLS` w generatorze rozszerzone o `-3`. Wektory zawieraja 6 krokow z `owner=-3`: brak jednostek i par do usuniecia, id trafia do `eliminatedOwners`, zgodnie z webem. Test reczny `ujemny_wlasciciel_nie_usuwa_nikogo_ale_trafia_do_zbioru` zostaje.
- Odrzucone: galaz oblezen. Rust nie ma struktury oblezen wlasciciela, wiec galaz nie jest zaimplementowana. Jest to jawnie zadeklarowane jako NIE_ZMIERZONO (naglowek `eliminacja.rs`, pozycja ELIMINACJA-GRACZA-DEALS-WOJNY-Q2).

### Zarzut 5 (informacyjne): brak wolajacego w produkcji — ZGODNE, bez zmiany
Brak wpiecia to swiadoma decyzja dyspozycji (temat #114 osobno). Potwierdzam bramki Evaluatora (ponizej).

## Bramki po poprawkach
Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (scratchpad, do usuniecia po bramkach).
- `cargo fmt --check` (rust-port/engine): exit 0
- `cargo clippy --all-targets -- -D warnings`: exit 0
- `cargo test --lib`: 94 passed
- `cargo test --test p6_eliminacja`: 3 passed
- `cargo test --test p6_power_battle_acc --test p6_power_acc_wiring`: 3 + 11 passed
- Mutacja kontrolna zmiany kolejnosci wstawiania: NIE_ZMIERZONO (nie wykonana w tej rundzie).

RUNDY: 1/5 (obrona w rundzie 1 Operatora).
NASTĘPNY KROK: Evaluator r2 na tym commicie (weryfikacja pkt 3 i 4 oraz komentarza naglowka). Orkiestrator decyduje o rejestracji ELIMINACJA-GRACZA-DEALS-WOJNY-Q2.
DEPLOY/PUSH: NIE WYKONANO

---
## DODATEK r2 (Operator HAIKU, runda 2/5)
BAZA: c7760f46c (FC r1). Jedyna poprawka: rust-port/engine/src/domain/eliminacja.rs, pusta linia `//!` przed "Wolanie z tur/walki" (doc_lazy_continuation). Tylko komentarz.
BRAMKI (rustc 1.97.0, clippy 0.1.97, EXIT z tego worktree):
- cargo fmt --check: 0
- cargo clippy --all-targets -- -D warnings: 0
- cargo test --lib: 0 (94 passed)
- p6_eliminacja: 0 (3 passed)
- p6_power_battle_acc: 0 (11 passed)
- p6_power_acc_wiring: 0 (3 passed)
Mutacja kontrolna: NIE_ZMIERZONO (poza zakresem dodatku).
RUNDY: 2/5. NASTEPNY KROK: Evaluator r2 + FC na nowym SHA.
DEPLOY/PUSH: NIE WYKONANO

---
# DODATEK r2 — OBRONA Operatora (runda 2/5, HAIKU) — R-RUSTPORT-P6-ELIMINACJA-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ELIMINACJA-Q1
GOAL: odpowiedz na zarzuty Evaluatora r2 (02-evaluator.md, commit dce886a70): kazdy zarzut przyjety (poprawka + dowod + commit) albo odrzucony (dowod).
ZMIANY/COMMIT: w tej rundzie zmiana kodu NIE byla potrzebna — zadnego zarzutu blokujacego. Kod do oceny: SHA 5ad5d363c (Operator r2, jedyna zmiana: pusta linia `//!` w `rust-port/engine/src/domain/eliminacja.rs`, diff zweryfikowany: `git show 5ad5d363c -- rust-port/engine/src/domain/eliminacja.rs`). Ten dopisek obrony jest jedyna zmiana tego commita.
BAZA: 5ad5d363c (detached HEAD). Brak push, brak zmian w gra/, origin/main, Cargo.toml, Cargo.lock.

## Odpowiedzi na zarzuty Evaluatora r2

### Zarzut 0 (brak zarzutow blokujacych): ZGODNE
Evaluator odtworzyl bramki (fmt 0, clippy -D warnings 0, cargo test --lib 94, p6_eliminacja 3, p6_power_battle_acc 11, p6_power_acc_wiring 3) i regeneracje wektorow (180 przypadkow, bajt w bajt). Ta obrona NIE uruchamiala cargo ponownie: bramki w tej rundzie = NIE_ZMIERZONO przez Operatora, dowod to wynik Evaluatora i EXIT zapisany w 01-operator-r2.md.

### Zarzut 1 (informacyjny, Q2): regularWarCapturedByPairKey i diplomacyPairMeta nie sa wymienione w naglowku — PRZYJMUJE (jako wpis do Q2, bez zmiany kodu)
Dowod: naglowek `eliminacja.rs` (linie 12-18 w SHA 5ad5d363c) wymienia `diplomacyPairMeta` i `diplomacyFactorLog` tylko ogolnikowo w jednej pozycji NIE_ZMIERZONO; `regularWarCapturedByPairKey` nie wystepuje w module. Zarzut zgodny z plikiem.
Decyzja: zmiana kodu/komentarza poza zakresem dodatku r2 (dyspozycja: jedyna poprawka = clippy). Wpis do zakresu Q2 (`ELIMINACJA-GRACZA-DEALS-WOJNY-Q2`): dopisac `regularWarCapturedByPairKey` oraz `diplomacyPairMeta` jako osobne pozycje z liniami pinu. Rekomendacja dla orkiestratora przy rejestracji Q2.

### Zarzut 2 (informacyjny): galaz oblezen bez wektorow — ODRZUCAM jako defekt tematu
Dowod: `eliminacja.rs` (naglowek) deklaruje oblezenia jako NIE_ZMIERZONO z powodem: brak struktury oblezen wlasciciela w Rust. Generator stubuje galaz oblezen (rzuca), wiec wektorow dla niej nie ma i nie moga byc, dopoki Rust tej struktury nie ma. Zakres ujety w Q2. Zgodne z pkt 2 zarzutow r1, bez zmiany.

### Zarzut 3 (informacyjny): brak wolajacego w produkcji — ODRZUCAM jako defekt
Dowod: dyspozycja r1 wyraznie wyklucza wpiecie w tury/walke ("Brak wpiecia w turn_war_* i combat.rs (osobne tematy)"; "wolajacy = osobny temat"). Brak wolajacego jest zamierzony. Pola serde nie dodano, wiec test zgodnosci wstecznej (pkt 4 dyspozycji) nie dotyczy.

## Stan po rundzie 2
- Kod: bez zmian poza 5ad5d363c (komentarz clippy).
- Otwarte do decyzji orkiestratora: rejestracja ELIMINACJA-GRACZA-DEALS-WOJNY-Q2 z pozycjami z Zarzutu 1 (regularWarCapturedByPairKey, diplomacyPairMeta) oraz deals/forced/era-enter/oblezenia.
- Mutacja kontrolna w tej obronie: NIE_ZMIERZONO (wykonana przez Evaluatora r1, nie powtarzana).

RUNDY: 2/5 (obrona Operatora HAIKU)
NASTEPNY KROK: Final Control r2 na SHA 5ad5d363c + dopisek tej obrony; decyzja orkiestratora o rejestracji Q2.
DEPLOY/PUSH: NIE WYKONANO
