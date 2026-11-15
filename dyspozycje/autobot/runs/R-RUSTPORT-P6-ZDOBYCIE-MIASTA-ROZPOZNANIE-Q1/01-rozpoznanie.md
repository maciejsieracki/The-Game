# 01 — Rozpoznanie: ZDOBYCIE-MIASTA (#175 / #115), runda 1 (Operator, Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1 (#175; powiązane #115 ZDOBYCIE-MIASTA-WIRING)
GOAL: Ustalić, które funkcje ścieżki zdobycia miasta (runCapitalCapturePlunder, applyCapturePopulationLoss, applyPostCaptureLawOnCapture, akumulatory zdobyczy Power i skutki pochodne) mają wołającego w produkcji Rust, a których brak, wraz z lokalizacją plik:linia.
ZMIANY/COMMIT: tylko ten plik. Zero zmian w `gra/` i `rust-port/`. Brak push.
TESTY: NIE_ZMIERZONO — tryb wyłącznie odczytu (`git show` / `git grep`), `cargo` nie uruchamiany zgodnie z dispatchem. Zachowanie opisuje kod, nie wykonanie.
BLOKADY: brak blokad odczytu. Nazwa `applyCaptureTransfer` z dispatchu nie istnieje w pinie (patrz pkt 19).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje tabelę wybranymi odczytami; zakres wpięcia dzielony na klocki zgodnie z sekcją ZALEŻNOŚCI.
DEPLOY/PUSH: NIE WYKONANO

## Baza odczytu

- Web: pin `07d2fbd72`, `gra/src/**` (`git show 07d2fbd72:...`).
- Rust: `origin/rust-port/parity-v2` = `d5a52a980` (`git show origin/rust-port/parity-v2:rust-port/engine/src/domain/...`).
- "Produkcja" = wołający w `rust-port/engine/src/**` poza `#[cfg(test)]` i poza plikami `tests/`. Przeszukano też `rust-port/**` z wyłączeniem `tests/` — bez dodatkowych wołających.

## Tabela: krok web → odpowiednik Rust

Legenda: ZINTEGROWANE = wołane w produkcji; ROZBIEŻNE = istnieją dwa niezależne byty z różnym stanem; BRAK = brak wołającego w produkcji (logika może istnieć).

| # | Krok / funkcja (web, pin 07d2fbd72) | Odpowiednik Rust (plik:linia) | Wołający w produkcji | Status |
|---|---|---|---|---|
| 1 | `applyCapturePopulationLoss` — def `cities.ts:1235`; wołający: `post-battle-map.ts:508` (bitwa), `main.ts:17700` (kapitulacja głodowa) | `apply_capture_population_loss` — `siege_transfer_effects.rs:63`; wołany w `apply_transfer_with_effects` — `siege_transfer.rs:360` (gdy `TransferExtras::pop_loss = Some`) | Brak. `apply_transfer_with_effects` (`siege_transfer.rs:340`) ma wołającego tylko w testach; wrapper `apply_transfer` (`siege_transfer.rs:316`) też bez wołającego | BRAK (logika jest, wiring nie) |
| 2 | `applyCityCaptureAfterBattle` (`post-battle-map.ts:493`), wołany z `main.ts:36061` — ścieżka zdobycia w bitwie | Brak odpowiednika ścieżki bitwy zdobycia miasta. `combat::resolve_combat` (`combat.rs:321`) i wrapper `combat::resolve` (`combat.rs:381`) bez wołającego w `engine/src` | Brak | BRAK |
| 3 | `applyPostCaptureLawOnCapture` (wołany w `main.ts:17702` i w bitwie) | `apply_post_capture_law_on_capture` — `siege_transfer_effects.rs:163`; wołany `siege_transfer.rs:374` tylko gdy `extras.post_capture_law = Some` | Brak (wolający `apply_transfer_with_effects` niepodpięty) | BRAK |
| 4 | `triggerRebelProtectionWarConsequence` / `wasProtectedRebel` / `rebelPrevOwnerSnapshot` (`main.ts:17700-17720`) | `was_protected_rebel` + `rebel_protection_war_request` wewnątrz `apply_transfer_with_effects` (`siege_transfer.rs:~366-380`) | Brak (jw.) | BRAK |
| 5 | Zmiana `city.ownerId`, flaga miasta-państwa (`clearCityStateFlagOnCapture`), `foundedByOwner` | Wewnątrz `apply_transfer_with_effects`: `siege_transfer.rs:~386-392` (`city.found_by_owner = Some(false)` na `:392`); `clear_city_state_flag_on_capture` w tej samej funkcji | Brak (jw.) | ISTNIEJE (wewnątrz funkcji), wołający BRAK; zgodność z pinem NIE_ZMIERZONO (korekta FC) |
| 6 | `sanitizeProductionQueue(newOwner)` / `sanitizeBuildQueue` (zwrot Pracy, bramka cudów) | `sanitize_production_queue_for_owner` — `siege_transfer_effects.rs:129`; wpięte przez `TransferProduction` w `apply_transfer_with_effects` | Brak (jw.) | BRAK |
| 7 | `runCapitalCapturePlunder(city, oldOwner, newOwner)` — def `main.ts:35558`; wołający: `main.ts:17828` (kapitulacja głodowa), `main.ts:36221` (bitwa) | `run_capital_capture_plunder` — `siege_capital_plunder.rs:504`; wektory `tests/p6_siege_capital_plunder.rs` | **Brak** wołającego (komentarz `siege_transfer.rs:188`: „wolający niepodpięty — W8”) | BRAK (port logiki, bez wiringu) |
| 8 | `applyBarbarianAwareCapitalCapturePlunder` / `applyCapitalCapturePlunder` (`capital-capture.ts`) | `apply_barbarian_aware_capital_capture_plunder` — `siege_capital_plunder.rs:402`; `apply_capital_capture_plunder` — `siege_capital_plunder.rs:311` | Tylko wewnątrz kroku 7 (bez wołającego produkcyjnego) | BRAK (zależne od 7) |
| 9 | Akumulator zdobyczy Power: `zdobyczePowerByOwner.set(newOwner, +powerGain)` (`main.ts:35673-35675`, `barbarianCapturedPowerGain`); odczyt `main.ts:2779` | Dwa byty: (a) `PlunderState::zdobycze_power_by_owner` — `siege_capital_plunder.rs:458`, zapis `:611-615` (osobna mapa przekazywana przez wołającego); (b) produkcyjny akumulator `WarTurnState::zdobycze_power_by_owner` — `war_turn_state.rs:145`, zasilany wyłącznie przez `PlayableState::power_record_city_capture` (`playable.rs:631` → `war_turn_state.rs:654` `record_capture_power_gain`) | (b): brak wołającego `power_record_city_capture` (doc `playable.rs:630`). (a): nie znaleziono scalenia z (b) w produkcji | **ROZBIEŻNE** — produkcyjny akumulator nie dostaje zdobyczy z plundera |
| 10 | Czyszczenie akumulatorów przy eliminacji: `battlePowerPtsByOwner.delete` / `zdobyczePowerByOwner.delete` (`main.ts:35399`, `:35410`) | `PlayableState::power_clear_eliminated_owner` — `playable.rs:643`; wołany z `eliminate_owner` — `eliminacja.rs:66` | `eliminate_owner` (`eliminacja.rs:48`) bez wołającego w `engine/src` | BRAK |
| 11 | `eliminateOwner(oldOwner)` (def `main.ts:35348`), wołany w `runCapitalCapturePlunder` na `main.ts:35769` (gałąź eliminacji) | `eliminate_owner` — `eliminacja.rs:48` (ELIMINACJA-GRACZA). W `ui_calls` plundra NIE ma wpisu `eliminateOwner` — efekt zostaje po stronie wołającego (`siege_capital_plunder.rs:19`, `:477`) | Brak | BRAK |
| 12 | `buildObjectivePowerForOwner(oldOwner).power` = `lostPower` (`main.ts:35670`) | Wejście `PlunderInput::lost_power` od wołającego (`siege_capital_plunder.rs:19-22`) | Wołający BRAK (zależy od producentów Power — wejście jest jawne) | BRAK wołającego |
| 13 | `recordCityCaptureEvent` (web: def `main.ts:10650`; wołający: `main.ts:17848` kapitulacja, `:35647` i `:35724` wewnątrz `runCapitalCapturePlunder`, `:36249` bitwa; korekta FC) | `CaptureEventStore::record_city_capture_event` — `siege_capture_events.rs:182`. Plunder tylko dopisuje wpis do `ui_calls` (`siege_capital_plunder.rs:~575-585`, `:~659-669`) i NIE zapisuje do store (komentarz `:19-27`) | Brak wołającego zapisującego do store | BRAK |
| 14 | `recordCivElimEvent` (def `main.ts:10583`; w plunderze wołany `main.ts:35767`, tuż przed `eliminateOwner` `:35769`; także aneksja `:35336`; korekta FC) | Tylko wpis `ui_calls`/komentarz (`siege_capital_plunder.rs:19`); brak zapisu do store | Brak | BRAK |
| 15 | `noteCityCapture` (kronika cywilizacji; def `gra/src/ui/eliminationSpectacle.ts:138`; wołający: `main.ts:17706` kapitulacja, `:36047` bitwa; korekta FC) | Wpis `Ported` w `TRANSFER_EFFECTS` (`siege_transfer.rs:95-100`, nazwa `:96`); funkcja `siege_transfer_q5::note_city_capture` (`siege_transfer_q5.rs:92`); wołający „PO apply_transfer” | Brak | BRAK (Ported, nie podpięty) |
| 16 | `beginWonderTransferWatch` / `settleWonderTransfer` (def `main.ts:4232` / `:4240`; begin/settle w zakresie tematu: kapitulacja `:17698`/`:17705`, bitwa `:36060`/`:36089`; poza zakresem — patrz „Zakres i wyłączenia”; korekta FC) | `siege_wonder_wrappers::begin_wonder_transfer_watch` (`siege_wonder_wrappers.rs:45`) / `settle_wonder_transfer` (`:107`) (Q9); plan w `siege_wonder_watch.rs:61`, `:106`; tabela `siege_transfer.rs:58`, `:90` z adnotacją „NIE podpięte w apply_transfer” | Brak | BRAK |
| 17 | `handleSiegeCapitulationPhase` (`main.ts:17646`) i `resolveSiegeSurrender` (kapitulacja głodowa) | `handle_siege_capitulation_phase` — `siege_surrender.rs:119`; `surrender_tick_action` — `siege_surrender.rs:143`; `resolve_surrender_path` — `siege_surrender.rs:171` | `surrender_tick_action` i `resolve_surrender_path`: tylko testy w `siege_surrender.rs` (`:230-363`) | BRAK (wiring W8) |
| 18 | `garnizonCountForCity` / `syncCityGarnizon` (`main.ts:17478`, `:17630`) | `garnizon_count_for_city` — `siege_transfer_q5.rs:25` | Brak (komentarz q5: wołający w kolejności web po `enterCityAfterSurrender`) | BRAK |
| 19 | `playerEverOwnedCityByOwner.add(newOwner)` (`main.ts:17816`) | `record_player_ever_owned_city` — `siege_transfer_q5.rs:107` | Brak | BRAK |
| 20 | `applyCaptureTransfer` (nazwa z dispatchu) | **Nie istnieje w pinie** `07d2fbd72` (`git grep -i capturetransfer` — zero trafień). Najbliższe odpowiedniki web: `applyCityCaptureAfterBattle` (`post-battle-map.ts:493`) i blok kapitulacji `main.ts:17698-17848` (korekta FC zakresu). Rust: `apply_transfer` (`siege_transfer.rs:316`) / `apply_transfer_with_effects` (`siege_transfer.rs:340`) | Brak | NIE_ZMIERZONO (nazwa; patrz sekcja NIE_ZMIERZONO) |

Podsumowanie liczbowe (wg tabeli): ZINTEGROWANE w produkcji = **0** z 20 kroków; ROZBIEŻNE = **1** (krok 9); BRAK = **18**; NIE_ZMIERZONO = **1** (krok 20). Logika portowa istnieje dla 1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 19 — jej brak to brak wołającego, nie brak kodu.

## Wnioski

1. Żadna funkcja ścieżki zdobycia miasta nie jest wołana w produkcji Rust. Wszystkie wejścia (`apply_transfer_with_effects`, `run_capital_capture_plunder`, `resolve_surrender_path`, `surrender_tick_action`, `power_record_city_capture`, `eliminate_owner`, `record_city_capture_event`, wrappery cudów) mają wołających wyłącznie w testach lub w komentarzach.
2. Jedyna rozbieżność stanu: akumulator zdobyczy Power. Plunder zapisuje do własnej mapy (`siege_capital_plunder.rs:611-615`), a produkcyjny `WarTurnState::zdobycze_power_by_owner` (`war_turn_state.rs:145`) nie dostaje tej wartości. Wpięcie samego `apply_transfer_with_effects` tego nie naprawi — trzeba jednoznacznie ustalić, która mapa jest źródłem prawdy i scalić zapis w jednym miejscu (decyzja techniczna, nie gameplay; web ma jedną mapę `zdobyczePowerByOwner`, `main.ts:2264`).
3. Status „completed” w tablicy zadań dla #114 ELIMINACJA-GRACZA nie odpowiada kodowi: `eliminate_owner` (`eliminacja.rs:48`) i `power_clear_eliminated_owner` (`playable.rs:643`) nie mają wołającego w produkcji. Do wyjaśnienia przez orkiestratora (rozbieżność statusu, nie zmiana w tym temacie).

## ZALEŻNOŚCI (luki, które są zależnościami innych tematów)

- **W8 (wiring tury/oblężenia):** kroki 1, 3–6, 13, 15–19 wymagają wołającego kapitulacji głodowej (`resolveSiegeSurrender`, web `main.ts:17646-17880`) w fazie tury. Istniejące funkcje `siege_surrender.rs` i `siege_transfer.rs` tego wołającego nie mają — ten sam wzorzec „wołający niepodpięty — W8”.
- **#113 K5LOOP-WIRING / pętla bitwy oblężniczej:** kroki 2, 7 (gałąź bitwy `main.ts:36221`), 9 (`power_record_city_capture`), 10–11 w ścieżce bitwy. Bez produkcyjnej pętli walki nie ma wołającego dla `applyCityCaptureAfterBattle`. `combat::resolve` (`combat.rs:381`) nie ma wołającego.
- **#114 / ELIMINACJA-GRACZA:** krok 10–11 — `eliminate_owner` musi mieć wołającego w `runCapitalCapturePlunder` (krok 7) i w ścieżce eliminacji; to jedno miejsce wpięcia, nie osobny temat.
- **Q7 (event store):** kroki 13–14 — wołający musi wykonać zapis do `CaptureEventStore` obok `ui_calls` (`siege_capital_plunder.rs:19-27`).
- **Q8/Q9 (wonder watch):** krok 16 — wrappery istnieją (`siege_wonder_wrappers.rs`), brak wołającego.
- **Dług Power (#86 POWER-BITWY-ZDOBYCZE / POWER-AKUMULATORY-WIRING-Q1):** krok 9 — dwa akumulatory do scalenia przed wpięciem (pkt 2 wniosków).
- **Temat #115 ZDOBYCIE-MIASTA-WIRING:** wpięcie kroków 1–9 jest jednym tematem tylko wtedy, gdy zależności W8 i pętli walki są już w `parity-v2`; inaczej nie da się go zrobić bez tworzenia nowych ścieżek w produkcji (dispatch tego zakazuje).

## Zakres i wyłączenia (dopisek FC, zarzut 4 Evaluatora)

Tabela obejmuje wyłącznie: bitwę (`post-battle-map.ts:493`, `main.ts:36047-36249`), kapitulację głodową (`main.ts:17698-17848`) i plunder stolicy (`main.ts:35558-35784`).
POZA ZAKRESEM (Rust NIE_ZMIERZONO, brak wniosku o zgodności): aneksja (`main.ts:35272-35287`, `clearCityStateFlagOnCapture` `:35279`, `eliminateOwner` `:35300`, `recordCivElimEvent` `:35336`), cesja (`:36478-36484`), bunt/rebelia (`:39563-39568`), fort (`:16116-16124`), założenie miasta (`:16142-16144`). Te ścieżki nie wołają `applyCapturePopulationLoss` ani `applyPostCaptureLawOnCapture` (potwierdzone `git grep` na pinie), ale dotykają tych samych wrapperów cudów, flagi miasta-państwa i (aneksja) `eliminateOwner`. Tabela NIE dowodzi kompletności „wszystkich zmian właściciela miasta”. Rekomendacja: temat #115 albo osobny temat rozpoznania musi je jawnie objąć lub wyłączyć.

## Stale komentarze w kodzie Rust (dopisek FC, zarzut 5) — temat #115 nie może na nich polegać

- `siege_surrender.rs:37`: „beginWonderTransferWatch / settleWonderTransfer … BRAK (wrapper)” — nieaktualne; `siege_wonder_wrappers.rs:45` i `:107` istnieją, moduł zadeklarowany w `mod.rs:133`.
- `playable.rs:630`: „BRAK wolajacego w produkcji: `apply_transfer_with_effects` nie jest wolany poza testami” — błędne uzasadnienie; `apply_transfer_with_effects` nie woła `power_record_city_capture` w ogóle (brak takiego wywołania w `siege_transfer.rs`). Wołającego `power_record_city_capture` brak w całym `engine/src`; trzeba go dodać niezależnie od wpięcia transferu.

## NIE_ZMIERZONO

- Równoważność logiki Rust z pinem (wartości, kolejność argumentów) — nie re-weryfikowana w tym rozpoznaniu; opieram się na wektorach z `tests/p6_siege_capital_plunder.rs` i `tests/p6_siege_transfer*.rs` jako na deklaracji, nie na uruchomieniu.
- Kolejność wywołań web `main.ts:17700-17880` vs `apply_transfer_with_effects` — nie porównana linia po linii.
- Zachowanie w czasie wykonania (żadne `cargo test`).
- Nazwa `applyCaptureTransfer` (krok 20) — brak w pinie; czy dispatch miał na myśli `applyCityCaptureAfterBattle` czy `apply_transfer`, do rozstrzygnięcia przez orkiestratora.
- Czy `PlunderState::zdobycze_power_by_owner` jest scalany z `WarTurnState` poza produkcją przez kod spoza `engine/src` (np. warstwa WASM/Tauri) — przeszukano `rust-port/**` bez `tests/`, nie znaleziono; nie sprawdzono innych katalogów repo.
- Pełna zgodność statusów z tablicą zadań (#114, #115, #175) — nie weryfikowana poza podanym wyżej przykładem.

## Metoda (do odtworzenia)

- `git grep -n -E 'runCapitalCapturePlunder|applyCaptureTransfer|applyCapturePopulationLoss' 07d2fbd72 -- gra/src/**`
- `git grep -n -E 'apply_transfer_with_effects|run_capital_capture_plunder|apply_capture_population_loss|power_record_city_capture|eliminate_owner|surrender_tick_action|resolve_surrender_path' origin/rust-port/parity-v2 -- rust-port/engine/src`
- odczyt bloków `git show` w zakresach linii podanych w tabeli.
