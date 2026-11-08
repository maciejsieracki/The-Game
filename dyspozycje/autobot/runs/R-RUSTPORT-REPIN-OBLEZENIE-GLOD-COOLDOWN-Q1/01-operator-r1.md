STATUS: BLOCK (częściowo: FALA 555 i 557 wykonane; FALA 556 zablokowana, patrz BLOKADY)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-OBLEZENIE-GLOD-COOLDOWN-Q1
GOAL: REPIN zmian weba: (a) FALA 555 SIEGEDUR, (b) FALA 557 CITYCD, (c) FALA 556 AIPEACE. Baza: origin/rust-port/parity-v2 = d6414fcf1 (check-out detached). Wektory z web origin/main (Node 22). Tabela pomiaru: dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-GLOD-COOLDOWN.md (brak w dispatchu, utworzona).
ZMIANY-COMMIT: 4509f00fe (kod + testy + tabela). Allowlista zachowana: domain/siege_starvation.rs, domain/diplomacy_rejection_cooldown.rs (nowy), domain/mod.rs (+pub mod), tests/p6_repin_oblezenie_obrona.rs i tests/p6_repin_oblezenie_cooldown.rs (nowe), dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-GLOD-COOLDOWN.md. Brak zmian w gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri.
  - (a) 555: `siege_defender_units` (web siegeDefenderUnits, siege-starvation.ts:66): obrońcy = każda żywa wojskowa jednostka właściciela na heksie miasta, bez cywilów, bez hp<=0 (NaN zostaje, jak web).
  - (b) 557: moduł diplomacy_rejection_cooldown (rejectCooldownKeyFor, CITY_FOR_PEACE_COOLDOWN_KEY = "miasto_za_pokoj", record/is/prune). Cały moduł był nieportowany.
  - (c) 556: NIE zaimplementowano (patrz BLOKADY).
TESTY:
  - cargo fmt -- --check: PASS (exit 0).
  - cargo clippy --all-targets -- -D warnings: PASS (exit 0). Jedna poprawka po pierwszym przebiegu: zbędne 'a w siege_defender_units.
  - cargo test --no-fail-fast, per binarka: 309 plików testowych + lib, 0 FAILED, 0 panicked, 0 nowych #[ignore]. Nowe: p6_repin_oblezenie_obrona (defenders, totals, 13 stanów głodu z wektorami web, progi 0,5 i NaN/zero start) oraz p6_repin_oblezenie_cooldown (klucze, cooldown 3 tury, prune, partner).
  - Wektory web: `defenders=[a,b,h]`, `starvation` 12 przypadków, `keys=[miasto_za_pokoj, miasto_za_pokoj, pokoj, handel]`, `cooldowns`, `checks=[T,F,T,F,F,5,5]`, `pruned(13)=[]`.
  - Baseline przed zmianą: NIE_ZMIERZONO osobno (ostateczny stan 0 failed).
  - Cargo.lock wygenerowany lokalnie przez cargo i usunięty (nie tracony).
  - CARGO_TARGET_DIR poza worktree (katalog scratchpad sesji), CARGO_INCREMENTAL=0, debug wyłączony. Po zakończeniu do usunięcia.
BLOKADY:
  - FALA 556 AIPEACE: brak w Rust całej gałęzi AI pokoju (0 trafień `oferuj_miasto`, `oferuj_trybut_za_pokoj`, `zada_miasto` w rust-port/engine/src). Web: ai.ts ok. 6750–6800 zależy od warWearinessLevel, loserDespair, aiPickMiastoDoOddania. To jest nowy port AI, nie REPIN. Wymaga osobnego tematu i decyzji orkiestratora.
  - FALA 555 wywołujący: siege_defender_units nie ma jeszcze wywołującego w Rust. Tura oblężenia (turn-economy, gałąź oblegane) jest poza allowlistą.
  - FALA 555 zapasy 2 tury: NIE_ZMIERZONO (logika w turn-economy, poza allowlistą).
  - Dispatch wspomina "siegeDefenderUnits: 2 tury zapasów, potem 6/8/10 %": atrycja Rust istnieje (turn_economy_attrition::siege_turn_garrison_attrition), ale nie została zmierzona pod kątem zgodności z weba.
ZAŁOŻENIA (do akceptacji):
  - Z-P6R-1: siege_defender_units przyjmuje akcesory (closure) zamiast trait-a. Trait wymagałby zmiany recruitment.rs (poza allowlistą).
  - Z-P6R-2: tury w cooldownie jako f64 (konwencja diplomacy_truce.rs); klucz akcji jako &str.
  - Z-P6R-3: brak domyślnej wartości cooldownTurns; wywołujący podaje AI_REJECTED_OFFER_COOLDOWN_TURNS.
  - Z-P6R-4: dispatch podaje oblężenie jako "siegeDefenderUnits" w siege-starvation.ts; funkcja jest tam (linia 66). Jej konsument (siege.ts) i gałąź dispatchu AI (ai.ts) to osobne miejsca w webie.
RUNDY: 1/5
NASTĘPNY KROK: (1) Orkiestrator decyduje o osobnym temacie na AIPEACE (port gałęzi AI pokoju, ai.ts 6750–6800 + zależności). (2) Osobny temat na wywołującego siege_defender_units w turze oblężenia (wymaga rozszerzenia allowlisty o turn-economy). (3) Ewentualna weryfikacja zapasów 2 tur z web.
DEPLOY/PUSH: NIE WYKONANO
