# P1-14B — Re-weryfikacja "NIE-PORTOWANE" na `rust-port/parity-v2` (wersja po obronie, runda 1/5)

**Temat:** `R-RUSTPORT-P1-14B-MISSING-SYSTEMS-RECHECK-Q1` · **Runda:** 1/5 · **Rola:** Operator (obrona)
**Pin Rust:** `rust-port/parity-v2` = `9e33fc779c81e7ccf3a824eab0ec11f7cd1d82a9` (HEAD origin, po poprawce terenu). Weryfikacja przez `git grep <pin>` (odczyt drzewa commita, bez checkoutu; równoważne świeżemu checkoutowi).
**Zakres grep:** `rust-port/engine/src` (31 plików śledzonych). Każda komenda poniżej jest kopiowalna; wynik zweryfikowany ponownie w tej rundzie.
**Format wyniku:** `git grep` pokazuje prefiks `9e33fc77…:`, pominięty w tabeli. Komendy używają ERE: alternatywa to `|` BEZ backslash.
**Wniosek bazowy:** `dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md` §5.

## Wyniki per system (komendy dokładne)

| # | System | Komenda (dokładna) | Trafienia | Werdykt vs audyt |
|---|---|---|---|---|
| 1 | forced-war | `git grep -n -i -E 'forced_war|forced-war|forcedwar|wymuszon|forced_war_waves' 9e33fc77 -- rust-port/engine/src` | 0 | ZGODNY (NIE-PORTOWANE). Zwykłe `DeclareWar` (`diplomacy.rs:535`) istnieje — to nie fale wymuszonych wojen. |
| 2 | culture | `git grep -n -i -E 'culture|kultur' 9e33fc77 -- rust-port/engine/src` | 15 (wszystkie `turn_economy.rs`) | ZNALEZISKO (doprecyzowanie). Trwały zasób `culture: u64` w `turn_economy.rs` (pola `:32,81,127,140`, dochód `:108`, wydatki `:338-343`). Brak systemu kultury. |
| 3 | religion | `git grep -n -i -E 'religion|religi|CommonReligion' 9e33fc77 -- rust-port/engine/src` | 14 (wszystkie `diplomacy.rs`) | ZNALEZISKO (doprecyzowanie). `same_religion_trust_per_turn` / `different_religion_trust_per_turn` (`:240-241,345-346,750-754`), zdarzenie `CommonReligion` (`:552-553,644`). Brak stanu religii miast/cywilizacji i brak systemu religii. |
| 4 | wonders/cuda | `git grep -n -i -E 'wonder|cud' 9e33fc77 -- rust-port/engine/src` | 3 (wszystkie `trade.rs`) | ZNALEZISKO (doprecyzowanie). `trade.rs:1451` = deklaracja parametru typu closure `wonder_trade_bonus_for_owner: F`; `trade.rs:1459-1460` = WYWOŁANIA tego parametru (`route.owner_id`, `route.to_owner_id`). Parametr wstrzykiwany z `tests/trade.rs:351`. Brak cudów świata jako systemu. |
| 5 | państwa-miasta | `git grep -n -i -E 'city_state|citystate|city-state|panstwo_miasto|panstwa_miasta|państwo|panstwo|city_states' 9e33fc77 -- rust-port/engine/src` | 14 literalnie: **11 prawdziwych + 3 fałszywe** | **ZGODNY co do istoty (brak systemu), z dormant kodem.** Patrz sekcja „Państwa-miasta" niżej. Literalnie NIE zero. |
| 6a | batch recruitment | `git grep -n -i -E 'batch' 9e33fc77 -- rust-port/engine/src` | 0 | ZGODNY (NIE-PORTOWANE). |
| 6b | rekrutacja pojedyncza (kontekst) | `git grep -n -i -E 'recruit|rekrut' 9e33fc77 -- rust-port/engine/src` | 46: `recruitment.rs` 39, `lib.rs` 5, `domain/mod.rs` 1, `domain/unit_epoch.rs` 1 | Informacyjnie: rekrutacja JEDNEJ jednostki, bez partii/batch. |
| 7 | auto_manage | `git grep -n -i -E 'auto_manage|automanage|auto-manage' 9e33fc77 -- rust-port/engine/src` (szerzej: `git grep -n -i -E 'auto.?manag|automat|auto_' 9e33fc77 -- rust-port/engine/src`) | 0 (oba) | ZGODNY (NIE-PORTOWANE). |

## Państwa-miasta — rozbicie 14 trafień

Fałszywe (alias typu, nie miasto-państwo): `domain/mod.rs:47`, `domain/state.rs:173` (`pub type CityState = CityDto;`), `lib.rs:48`. Razem 3.

Prawdziwe (11):
- `diplomacy.rs:2904-2905` — pola `proposer_is_city_state`, `responder_is_city_state` w `ProposalEvalContext`.
- `diplomacy.rs:2934-2935` — konstruktor `ProposalEvalContext::new` ustawia OBA na `false`.
- `diplomacy.rs:3265` — gate: `if context.responder_is_city_state && TributeDemand|TributeOffer` → reject „Trybut niedostępny dla państwa-miasta".
- `diplomacy.rs:3801` — `Annexation`: `if !context.responder_is_city_state` → reject „Wchłonięcie v1 tylko miasta-państwa".
- `playable.rs:65,81` — pole `city_state_difficulty_override` (`None` domyślnie).
- `playable.rs:111,144` — `city_states_count: u16` = `6` (stała).
- `playable.rs:167` — `"cityStatesCount:NOT_IMPLEMENTED"` (jawny brak).

**Osiągalność z realnej ścieżki (sprawdzone na pinie):**
- Jedyne miejsce ustawiające `responder_is_city_state = true`: `tests/diplomacy.rs:572` (test). W `src/` nigdzie nie ma literału `ProposalEvalContext { … }`.
- `ProposalEvalContext::new` (`diplomacy.rs:2918`) hardcoduje `false`.
- `evaluate_proposal` / `evaluate_proposal_with_params` nie mają żadnego wywołania poza `diplomacy.rs` i testami w `rust-port/` (`git grep -n -E 'evaluate_proposal|ProposalEvalContext' 9e33fc77 -- rust-port` — poza `tests/` tylko definicje w `diplomacy.rs`).
- Wniosek: gate `:3265` i gałąź Annexation `:3801` są martwe w produkcji. Nie ma systemu państw-miast. Werdykt: zgodne z audytem co do istoty, z dormant kodem literalnie niezerowym.

**Uwaga o `TributeDemand`/`TributeOffer`:** `diplomacy.rs:3412-3473` to ogólna dyplomacja między cywilizacjami (akcje propozycji), NIE mechanika miast-państw. Jedynym specyficznym dla miast-państw gate'em jest `:3265`.

**Parametry tribute/annex:** `git grep -c -i -E 'tribute|annex' 9e33fc77 -- rust-port/engine/src` = **82**: `diplomacy.rs` 80 (parametry `:232-282`, logika `:2713-2748`, `:3116-3126`, `:3215`, `:3412-3473`, `:3800-…`), `combat.rs` 1, `resource_production.rs` 1. Liczba 82 jest realna dla tego wzorca; wzorzec nie zawiera `city_state`, więc nie jest to liczba „miast-państw".

## Podsumowanie

- **Zgodne z audytem (0 trafień):** forced-war, batch recruitment, auto_manage.
- **Doprecyzowanie (niezerowe, bez systemu):** culture (zasób w ekonomii), religion (modyfikatory zaufania dyplomacji), wonders (parametr closure w handlu, bez cudów).
- **Państwa-miasta:** zgodne co do istoty (brak systemu, gate'y nieosiągalne z produkcji); literalnie 11 prawdziwych trafień dormant + 3 fałszywe z aliasu `CityState`. Nie przyjmuje się literalnego „zero" ani wniosku „NIEZGODNY".
- Zastrzeżenie: wynik to statyczny `git grep` na tym pinie; `cargo test` nie uruchamiano.

## Zapis

Zmieniono wyłącznie: ten plik, `dyspozycje/autobot/runs/R-RUSTPORT-P1-14B-MISSING-SYSTEMS-RECHECK-Q1/01-operator.md` (raport wstępny) i `dyspozycje/autobot/runs/R-RUSTPORT-P1-14B-MISSING-SYSTEMS-RECHECK-Q1/02-operator-obrona.md` (obrona). Nie zmieniono `rust-port/engine/**` ani `gra/**`.
