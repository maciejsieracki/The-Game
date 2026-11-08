# P6-REPIN-OBLEZENIE-GLOD-COOLDOWN — tabela pomiaru (R-RUSTPORT-REPIN-OBLEZENIE-GLOD-COOLDOWN-Q1, runda 1)

Baza: `origin/rust-port/parity-v2` = `d6414fcf1`. Web: `origin/main` = `fd8cc14a3` (ROBOCZA 143ef730 / FALA 562).
Wektory web: `gra/src/game/siege-starvation.ts` + `gra/src/game/diplomacy-rejection-cooldown.ts` z origin/main,
uruchomione pod Node 22.22.0 (`node --experimental-strip-types`) poza repo.

## Tabela

| FALA | Zmiana webowa | Miejsce w webie (origin/main) | Stan w Rust (parity-v2) | Działanie w tym temacie |
|---|---|---|---|---|
| 555 SIEGEDUR | obrońcy oblężonego miasta = każda żywa wojskowa jednostka na heksie miasta (nie tylko ufortyfikowana) | `gra/src/game/siege-starvation.ts:66` `siegeDefenderUnits` | Brak `siege_defender_units`. Jest `siege_starvation_state` + `garrison_hp_totals` (P1–P2). Brak wywołującego po stronie tury (poza allowlistą). | PORT: `siege_defender_units` w `domain/siege_starvation.rs` + test `p6_repin_oblezenie_obrona.rs` |
| 555 SIEGEDUR | zapasy 2 tury, potem głód 6/8/10 % HP/turę | `siege-starvation.ts` (stan), `turn-economy.ts` (gałąź `oblegane`) | Atrycja: `turn_economy_attrition::siege_turn_garrison_attrition` (istnieje). Zapasy 2 tury: nie zweryfikowane (poza allowlistą). | NIE_ZMIERZONO dla zapasów 2 tur; progi 50 % i stan głodu pokryte testami wektorowymi |
| 556 AIPEACE | AI przegrywająca (≥3 miasta) oferuje graczowi miasto za pokój; gałąź dispatch `oferuj_miasto_za_pokoj`, `zada_miasto_za_pokoj` | `gra/src/game/ai.ts` ok. 6750–6800 (typy 6304/6308, komendy 6760/6786); `diplomacy-proposals.ts` | BRAK: 0 trafień `oferuj_miasto`, `oferuj_trybut_za_pokoj`, `zada_miasto` w `rust-port/engine/src`. Warunki zależą od `warWearinessLevel`, `loserDespair`, `aiPickMiastoDoOddania` (częściowo w `diplomacy_war_weariness_tick.rs`, `diplomacy_war_peace_profile.rs`). | BLOCK — brak całej gałęzi AI pokoju w Rust; to nie jest REPIN, tylko nowy port. Wymaga osobnego tematu (decyzja orkiestratora). |
| 557 CITYCD | osobny klucz cooldownu `miasto_za_pokoj` dla komend miasta za pokój | `gra/src/game/diplomacy-rejection-cooldown.ts` (`CITY_FOR_PEACE_COOLDOWN_KEY`, `rejectCooldownKeyFor`) | Brak modułu (0 trafień `rejection`/`reject_cooldown` poza odrębnymi cooldownami wojennymi). | PORT: `domain/diplomacy_rejection_cooldown.rs` + `mod.rs` (+`pub mod`) + test `p6_repin_oblezenie_cooldown.rs` |

## Założenia (do akceptacji)

* Z-P6R-1 `siege_defender_units` przyjmuje akcesory (`pos`, `is_civilian`) zamiast trait-a: trait wymagałby zmiany
  `recruitment.rs` (poza allowlistą). Pole `hp` = `Option<f64>`; `NaN` nie jest odrzucany (jak web `NaN <= 0` = fałsz).
* Z-P6R-2 Tury w cooldownie jako `f64` (konwencja `diplomacy_truce.rs`). Klucz akcji jako `&str`.
* Z-P6R-3 Brak wartości domyślnej `cooldownTurns` w Rust; wywołujący podaje `AI_REJECTED_OFFER_COOLDOWN_TURNS`.

## Wektory (web → testy Rust)

* `defenders` = `[a, b, h]` (hp 5 / nieustawione / NaN; odrzucone: hp 0, hp −2, cywil, obcy właściciel, sąsiedni hex).
* `starvation`: 12 przypadków (brak oblężenia, zapasy > 0, legacy, record_start, 0,5 = trzyma, 0,4667 = poddanie,
  pusty garnizon, pending, start NaN/0, maxHp 0 pominięty, food NaN) — wszystkie zgodne z `siegeStarvationState`.
* `totals` = `{hp 30, maxHp 30, count 2}`.
* `keys` = `[miasto_za_pokoj, miasto_za_pokoj, pokoj, handel]`.
* `cooldowns` po zapisach = `[{2, miasto_za_pokoj, 10, 13}, {2, pokoj, 11, 13}]`; `checks` = `[T, F, T, F, F, 5, 5]`; `pruned(13)` = `[]`.

## Bramki (wynik)

* `cargo fmt -- --check`: PASS (exit 0).
* `cargo clippy --all-targets -- -D warnings`: PASS (exit 0, po zamianie zbędnego `'a` na elision).
* `cargo test --no-fail-fast` (per binarka): 309 plików testowych + lib; 0 FAILED, 0 panicked. Wyniki: `rest-results.log` i pierwszy log w katalogu scratchpad sesji.
* `#[ignore]` w nowych plikach: 0.
* Baseline przed zmianą nie był mierzony osobno (NIE_ZMIERZONO) — ostateczny stan: 0 failed.
