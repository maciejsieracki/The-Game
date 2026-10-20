# P1-14B — Re-weryfikacja "NIE-PORTOWANE" na `rust-port/parity-v2`

**Temat:** `R-RUSTPORT-P1-14B-MISSING-SYSTEMS-RECHECK-Q1` · **Runda:** 1/5 · **Rola:** Operator
**Pin Rust:** `rust-port/parity-v2` = `9e33fc779c81e7ccf3a824eab0ec11f7cd1d82a9` (HEAD origin, po poprawce terenu, 2026-10-20), świeży shallow clone.
**Zakres grep:** `rust-port/engine/src/**` (31 plików śledzonych w `git ls-files rust-port/engine/src`), `git grep -n -i -E`.
**Wniosek bazowy:** `dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md` §5.

## Wyniki per system

| # | System | Komenda (skrót) | Trafienia | Werdykt vs audyt |
|---|---|---|---|---|
| 1 | forced-war | `git grep -i -E 'forced_war\|forced-war\|forcedwar\|wymuszon\|wymuszona\|forced_war_waves\|ForcedWar'` | 0 | ZGODNY (NIE-PORTOWANE). Uwaga: zwykłe `DeclareWar` (`diplomacy.rs:535`) istnieje, to nie fale wymuszonych wojen. |
| 2 | culture | `git grep -i -E 'culture\|kultur'` | 15 (wszystkie `turn_economy.rs`) | ZNALEZISKO. Trwały zasób `culture` (pola `culture: u64` w `turn_economy.rs:32,81,127,140`, dochód `:108`, wydatki `:338-343`). Brak systemu kultury. |
| 3 | religion | `git grep -i -E 'religion\|religi\|religia\|CommonReligion'` | 14 (`diplomacy.rs`) | ZNALEZISKO. `same_religion_trust_per_turn` / `different_religion_trust_per_turn` (`:240-241,345-346,750-754`), zdarzenie `CommonReligion` (`:552-553,644`). Brak systemu religii (brak stanu religii miast/cywilizacji). |
| 4 | wonders/cuda | `git grep -i -E 'wonder\|cud\|cuda\|wonders'` | 3 | ZNALEZISKO (doprecyzowanie). Tylko parametr domknięcia `wonder_trade_bonus_for_owner` (`trade.rs:1451,1459-1460`), wstrzykiwany z testu `tests/trade.rs:351`. Brak cudów świata jako systemu. |
| 5 | państwa-miasta | `git grep -i -E 'city_state\|citystate\|city-state\|panstwo_miasto\|panstwa_miasta\|państwo\|panstwo\|city_states'` | 14 | **NIEZGODNY.** `diplomacy.rs:2904-2935` (kontekst `responder_is_city_state`), `diplomacy.rs:3265` (`ProposalAction::TributeDemand`/`TributeOffer` dla miast-państw), `diplomacy.rs:3801-3803` (`ProposalAction::Annexation` tylko dla miast-państw, reject "Wchłonięcie v1 tylko miasta-państwa"), parametry `tribute_*`/`annexation_*` (`:232-282`, 82 trafienia łącznie dla tribute/annex). Brak zakładania/ekonomii państw-miast; `playable.rs:111,144` (`city_states_count: 6`) i `playable.rs:167` (`cityStatesCount:NOT_IMPLEMENTED`). |
| 6a | batch recruitment | `git grep -i 'batch'` | 0 | ZGODNY (NIE-PORTOWANE). |
| 6b | rekrutacja pojedyncza (kontekst) | `git grep -i -E 'recruit\|rekrut'` | 46 (`recruitment.rs`) | Informacyjnie: istnieje rekrutacja JEDNEJ jednostki (koszt/utrzymanie, `recruitment.rs`), bez partii/batch. |
| 7 | auto_manage | `git grep -i -E 'auto_manage\|automanage\|auto-manage'` oraz szerzej `auto.?manag\|automat\|auto_` | 0 | ZGODNY (NIE-PORTOWANE). |

## Podsumowanie

- **Zgodne z audytem:** forced-war, batch recruitment, auto_manage (0 trafień).
- **Doprecyzowanie (trafienia niezerowe, ale bez systemu):** culture (zasób w ekonomii), religion (modyfikatory zaufania dyplomacji), wonders (parametr w handlu).
- **Sprzeczne z audytem:** państwa-miasta — w `diplomacy.rs` jest logika danin (TributeDemand/TributeOffer) i aneksji (Annexation) warunkowana przez `responder_is_city_state`; audyt twierdzi "zero".
- Zastrzeżenie: wynik dotyczy wyłącznie statycznego `git grep` na tym pinie; nie uruchomiono `cargo test`.

## Zapis

Zmieniono wyłącznie: ten plik oraz `dyspozycje/autobot/runs/R-RUSTPORT-P1-14B-MISSING-SYSTEMS-RECHECK-Q1/01-operator.md`. Nie zmieniono `rust-port/engine/**` ani `gra/**`.
