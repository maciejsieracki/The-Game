# R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ROZPOZNANIE-Q1 — rozpoznanie bramek wojen epoki i MULTIWAR

Temat: DYPLOMACJA-MULTIWAR (#181), runda 1, tylko odczyt (bez zmian kodu).
Baza: `5e8b116e8` (dispatch). Pin: `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/war-rules-multiwar.ts`, `gra/data/war-rules-params.json`), tylko odczyt.

Konwencja: `P:` = plik:linia w pinie 07d2fbd72; `R:` = plik:linia w `rust-port/engine/src/domain/` (chyba że podano inaczej). Status: PORTOWANE = funkcja 1:1 istnieje; NIEPODPIĘTE = brak wołającego w kodzie produkcyjnym (sprawdzone grep po `rust-port/engine/src`); BRAK = brak odpowiednika; NIE_ZMIERZONO = nie ustalono.

Uwaga o źródłach: komentarze w Rust odwołują się do innych pinów (`a61337844`, `5dd53e60f`, `14f2af1b0`). Wartości parametrów zweryfikowano wprost z `07d2fbd72:gra/data/war-rules-params.json` i są zgodne z literałami Rust (patrz pozycja 0).

## 0. Parametry (pin JSON vs Rust)

| Parametr | Pin `war-rules-params.json` | Rust | Status |
|---|---|---|---|
| delayInterCivWarsUntilTurn | 40 | `diplomacy_multiwar_gate.rs:12` = 40.0 | zgodne |
| eraForcedWarStartTurnsFromEra | stone/bronze/iron = 40 | `diplomacy_multiwar_gate.rs:58,60` (bronze, iron = 40.0; stone brak stałej) | zgodne, stone NIE_ZMIERZONO (brak stałej) |
| eraForcedWarIgnoreR1 | ["bronze","iron"] | logika `is_era_forced_war_ignoring_r1` `diplomacy_multiwar_gate.rs:64` | zgodne |
| maxConcurrentWarsStone | 1 | `diplomacy_multiwar_gate.rs:14` = Some(1) | zgodne |
| maxConcurrentWarsFromBronze | null | `diplomacy_multiwar_gate.rs:16` = None | zgodne |
| maxEraForcedWarsPerEra | null | `diplomacy_multiwar.rs:88-92` (`ERA_WAR_PARAMS`) = None | zgodne |
| maxEraForcedWarsPerCivPerEra | 1 | `diplomacy_multiwar.rs:88-92` = Some(1) | zgodne |
| enabledForcedWarEras | ["stone","bronze","iron"] | `diplomacy_multiwar.rs:70-74` | zgodne |
| engageRadiusHexes | 10 | parametr wywołania `pick_engagement_army` (`war_rules_multiwar.rs:42`), brak stałej | zgodne co do użycia |

## 1. Tabela elementów zakresu

Flagi:

| # | Element | Pin | Rust | Status |
|---|---|---|---|---|
| 1 | Flaga główna `WAR_RULES_MULTIWAR_ENABLED` (=true) i override testowy | P: `war-rules-multiwar.ts:50`, override `:55-60`, użycie np. `main.ts:11633`, `:23740`, `:40649`, `:41886` | Brak stałej. Wejście runtime: `multiwar_enabled` w `turn_war_pipeline.rs:82,87,92`; `brake_inputs.rs:125` | CZĘŚCIOWO: flaga jako parametr, bez stałej ON |
| 2 | Flaga `WAR_EPOCH_PLAYER_FIRST_ENABLED` (=true) | P: `war-rules-multiwar.ts:69`, `:78-79`; użycie `main.ts:40656`, `:41963`, `:37334` | Brak stałej. Pole wejścia `war_epoch_player_first` `war_turn_forced.rs:78`; użycie `war_turn_forced.rs:340`, `:394` | NIEPODPIĘTE (pole bez wołającego produkcyjnego) |

R1 i R2 (bramka wypowiedzenia):

| # | Element | Pin | Rust | Status |
|---|---|---|---|---|
| 3 | R1 `isInterCivWarOpenAtTurn` (tura >= 40) | P: `war-rules-multiwar.ts:88` | `diplomacy_multiwar_gate.rs:19` | PORTOWANE. Produkcja tylko przez hamulec: `brake_inputs.rs:134` → `gate_blocked_set` `brake_inputs.rs:147` → `turn_war_pipeline.rs:356` |
| 4 | R2 `concurrentWarLimitForEra` (Kamień=1, reszta bez limitu) | P: `war-rules-multiwar.ts:121` | `diplomacy_multiwar_gate.rs:24-30` | PORTOWANE, produkcja jak #3 |
| 5 | `evaluateInterCivWarGate` (R1 + R2 napastnik + R2 cel, cel-gracz bez limitu) | P: `war-rules-multiwar.ts:152`. Wołający pin: `main.ts:11632` (`diploCrisisWarGateBlocked`, hamulec), `main.ts:23738` (`interCivWarBlockedForAi`: klaster państw-miast, gracz, sojusznik dołączający), `main.ts:41886` (komenda `wypowiedz_wojne`) | `diplomacy_multiwar_gate.rs:105`; produkcja tylko `brake_inputs.rs:134` | PORTOWANE. Wołający z `interCivWarBlockedForAi` (23738) i `wypowiedz_wojne` (41886): BRAK w Rust |
| 6 | `isEraForcedWarIgnoringR1` | P: `war-rules-multiwar.ts:99` | `diplomacy_multiwar_gate.rs:64` | PORTOWANE. Wołający: tylko `evaluate_inter_civ_war_gate` (`:106`) i testy `p6_dyplo_multiwar2_eraign.rs:137-139`. Hamulec nie niesie `eraTag`, więc w produkcji gałąź zawsze = zwykłe wypowiedzenie |
| 7 | `isWarMarchOpenForPair` (marsz AI w W1, R1 albo wojna epoki Brąz/Żelazo) | P: `war-rules-multiwar.ts:112`; wołający `main.ts:35039` | `diplomacy_multiwar_gate.rs:71` | PORTOWANE. Wołający tylko w testach (`p6_dyplomacja_multiwar3_f.rs:105-120`). BRAK w produkcji |

Wojny epoki (wymuszone), bramka wypowiedzenia:

| # | Element | Pin | Rust | Status |
|---|---|---|---|---|
| 8 | `forcedEraTagFromPowod` (prefiks `R-EPOKA-…-WYMUSZONA-WOJNA:`) | P: `war-rules-multiwar.ts:172`; wołający `main.ts:41859-41960` (wielokrotnie) | `diplomacy_multiwar.rs:95` | PORTOWANE. Wołających brak (poza definicją) |
| 9 | `isForcedEraWarEnabled` | P: `war-rules-multiwar.ts:201` | `diplomacy_multiwar.rs:108` | PORTOWANE. Wołający tylko `evaluate_era_forced_war_gate` |
| 10 | `canDeclareEraForcedWar` (R3 globalny, null = bez limitu) | P: `war-rules-multiwar.ts:187` | `diplomacy_multiwar.rs:113` | PORTOWANE. Wołający tylko `evaluate_era_forced_war_gate` |
| 11 | `eraWarCountFor` / `canCivJoinEraForcedWar` (licznik per cywilizacja i epoka, limit 1) | P: `war-rules-multiwar.ts:218`, `:230` | `diplomacy_multiwar.rs:126`, `:134` | PORTOWANE. Wołający: `war_era_pool.rs:105`, `evaluate_era_forced_war_gate` |
| 12 | `recordEraForcedWarParticipation` (zużycie licznika napastnik + cel) | P: `war-rules-multiwar.ts:241`; użycie `main.ts:41954` | `diplomacy_multiwar.rs:398` | PORTOWANE. Wołający tylko testy (`p6_zapis_erawar_counts.rs`, `p6_zapis_erawar_save.rs`). BRAK w produkcji |
| 13 | `evaluateEraForcedWarGate` (kolejność: epoka wyłączona → multiwar → R3 → licznik napastnika → licznik celu) | P: `war-rules-multiwar.ts:391`; użycie `main.ts:41866-41878` (pole `multiwarEnabled` w `41873`) | `diplomacy_multiwar.rs:173` (kolejność zgodna z pinem) | PORTOWANE 1:1. ZERO wołających, nawet w testach |
| 14 | Stan live licznika `eraWarCountByCivKey` (zapis przy wypowiedzeniu, odczyt w bramce) | P: zapis `main.ts:41954`, odczyt `:40712`, `:41873`; czyszczenie/odtwarzanie `:46605` | Brak pola w `WarTurnState`. `EraWarCounts` (`diplomacy_multiwar.rs:344`) używany tylko w `save_load.rs:194,258` (komentarz i builder `with_era_war_counts`; wołający NIE_ZMIERZONO) | BRAK stanu live w produkcji |
| 15 | Stan `forcedEraWarDeclaredByTag` (R3 licznik per epoka) | P: `main.ts:41873`, `:41945-41951` | brak pola; `can_declare_era_forced_war` nie wołane | BRAK |
| 16 | `rebuildEraWarCountsFromActivePairs` / `restoreEraWarCounts` | P: `war-rules-multiwar.ts:344`, `:367` | `diplomacy_multiwar.rs:415`, `:433`, `:440` (wołane tylko z `restore_era_war_counts`) | PORTOWANE. Wołający produkcyjny NIE_ZMIERZONO (sprawdzić w temacie wykonawczym) |

Pula wojen wymuszonych, parowanie, filtry kandydatów:

| # | Element | Pin | Rust | Status |
|---|---|---|---|---|
| 17 | `isPlayerEligibleForEraWarPool` | P: `war-rules-multiwar.ts:310`; użycie `main.ts:40608-40640` (w bloku `playerCity`) | `war_era_pool.rs:76`; użycie `war_turn_forced.rs:315` (w `forced_war_step`) | PORTOWANE. NIEPODPIĘTE: `forced_war_step` bez wołającego produkcyjnego |
| 18 | `isPlayerEraWarSlotFree` (filtr kandydata AI na partnera gracza) | P: `war-rules-multiwar.ts:329`; użycie `main.ts:40712` | `war_era_pool.rs:96`; test `p6_repin_ai_war_vectors.rs:77`; wejście `war_turn_forced.rs:90` (`era_war_counter_ok`), użycie `:363` | PORTOWANE. NIEPODPIĘTE |
| 19 | `pickPlayerReferenceCity` (stolica gracza, fallback pierwsze miasto) | P: `war-rules-multiwar.ts:434`; użycie `main.ts:40614` | `diplomacy_multiwar_gate.rs:126`; test `p6_dyplomacja_multiwar_interciv.rs:104` | PORTOWANE. NIEPODPIĘTE |
| 20 | `isWarTreatyBlocked` (wojna epoki omija NAP/pokój, blokuje tylko sojusz) | P: `war-rules-multiwar.ts:420` (wariant obiektowy); użycie `main.ts:40681` (pula), `:41909` (komenda wypowiedzenia) | `diplomacy_multiwar_gate.rs:77` (wariant pozycyjny, 4 bool; logika zgodna); testy `p6_dyplo_multiwar2_eraign.rs:147-152` | PORTOWANE (inna sygnatura). BRAK wołającego w produkcji |
| 21 | Blokada pary wojny wymuszonej (NAP / pokój / sojusz) | P: `main.ts:40681` (`isForcedWarPairBlocked`) | `war_turn_forced.rs:88` (`is_pair_blocked`, wejście) | NIEPODPIĘTE (wejście bez wołającego) |
| 22 | Parowanie wojen wymuszonych `assignForcedWarPairings` | P: forced-war-common (port G2a) | `war_forced_pairing.rs:120`; wołane tylko z `war_turn_forced.rs:415` (`forced_war_step`, `war_turn_forced.rs:231`) | PORTOWANE. NIEPODPIĘTE: `forced_war_step` bez wołającego produkcyjnego (tylko `tests/p6_wire_war_forced_step.rs`) |
| 23 | Deklaracje wojny wymuszonej `declare_forced_wars` / `declare_from_assignments` | P: `main.ts:41859-41960` | `war_turn_declare.rs:110`, `:141`; brak wołającego produkcyjnego | NIEPODPIĘTE; zależne od CRED-HAK #120 (hak P4) |
| 24 | `backfillMissingEraEntryTurns` (przy wczytaniu zapisu) | P: `war-rules-multiwar.ts:281`; użycie `main.ts:46783-46784` | brak (0 trafień w `rust-port/`) | BRAK |
| 25 | Epoka-player-first w puli (K2): gracz wypada z puli, gdy opcja wyłączona | P: `main.ts:40656-40660`, `:41963` | `war_turn_forced.rs:340-342` (pole wejścia) | NIEPODPIĘTE |
| 26 | `player_epoch_war_enabled` (domyślnie true) | P: `main.ts:37334` (stan) | `diplomacy_multiwar.rs:209`; `save_load.rs:312`; `war_turn_forced.rs:80` | PORTOWANE. Używane w zapisie; wiring w pętli wojny NIEPODPIĘTE |

Deklaracje i wpływ na status relacji:

| # | Element | Pin | Rust | Status |
|---|---|---|---|---|
| 27 | Wypowiedzenie z hamulca: efekt na stan wojny | P: `main.ts:41886-41960` (`zarejestrujWypowiedzenie`, stan wojny) | `turn_war_pipeline.rs:418-425` zapisuje raport i wywołuje `note_war_declarations` (`turn_war_dipl_steps.rs:876`, hak wiarygodności P4, `turn_war_pipeline.rs:422`). Zmiana statusu przez `apply_diplomatic_event(DeclareWar)` tylko w `diplomacy_truce_flow.rs:271,322`, a `declare_war_opts` (`:247`) nie ma wołającego produkcyjnego. Komentarz `playable.rs:1108-1109` mówi: „Deklaracje wojny z hamulca nie maja jeszcze efektow (W4/W8)” | NIE_ZMIERZONO, rozbieżność komentarz vs kod do weryfikacji w temacie wykonawczym |
| 28 | Wypowiedzenie przez sojusz / klaster (dołączanie) | P: `main.ts:23738` (`interCivWarBlockedForAi`) | BRAK. Komentarz `turn_war_dipl_steps.rs:24-26` potwierdza, że ścieżki sojusz/klaster NIE są wpięte | BRAK. Zależne od #120 |
| 29 | W1/W2 (AI all-in: wybór armii i przydział grup) | P: `main.ts:35031-35064`; `war-rules-multiwar.ts` wybór celu | `war_rules_multiwar.rs:42` (`pick_engagement_army`), `:77` (`allocate_groups_to_enemies`) | Funkcje PORTOWANE. Bramka `isWarRulesMultiwarEnabled()`/`isMe` przy wołaniu: NIE_ZMIERZONO |

## 2. Lista brakujących elementów (plik:linia)

Brakujące w produkcji (funkcja istnieje, nie ma wołającego w `src`):
- Bramka wypowiedzenia gracza/AI (komenda `wypowiedz_wojne`): `evaluate_era_forced_war_gate` (`diplomacy_multiwar.rs:173`), `record_era_forced_war_participation` (`diplomacy_multiwar.rs:398`), `is_war_treaty_blocked` (`diplomacy_multiwar_gate.rs:77`), `forced_era_tag_from_powod` (`diplomacy_multiwar.rs:95`). Odpowiedniki pin: `main.ts:41866-41963`.
- Stan live liczników: brak pola `eraWarCountByCivKey` i `forcedEraWarDeclaredByTag` w `WarTurnState` (pin `main.ts:41945-41954`, `:46605`).
- Pula wojen wymuszonych: `forced_war_step` (`war_turn_forced.rs:231`) bez wołającego; w nim `is_player_eligible_for_era_war_pool` (`war_era_pool.rs:76`), `is_player_era_war_slot_free` (`war_era_pool.rs:96`), `pick_player_reference_city` (`diplomacy_multiwar_gate.rs:126`), `assign_forced_war_pairings` (`war_forced_pairing.rs:120`). Pin: `main.ts:40608-40712`.
- Deklaracje wymuszone: `declare_forced_wars` (`war_turn_declare.rs:110`), `declare_from_assignments` (`war_turn_declare.rs:141`). Pin: `main.ts:41859-41960`.
- Marsz AI i sojusz/klaster: `is_war_march_open_for_pair` (`diplomacy_multiwar_gate.rs:71`) bez wołającego w produkcji (pin `main.ts:35039`); `interCivWarBlockedForAi` nie ma odpowiednika (pin `main.ts:23738`).
- Backfill: `backfillMissingEraEntryTurns` (pin `war-rules-multiwar.ts:281`, `main.ts:46783-46784`) brak w Rust.
- Flaga epoch-first: brak stałej i brak wiringu pola `war_epoch_player_first` (`war_turn_forced.rs:78`) z produkcji (pin `war-rules-multiwar.ts:69`).

Do rozstrzygnięcia (NIE_ZMIERZONO):
- Efekt statusu relacji dla wypowiedzeń z hamulca (pozycja 27).
- Wołający produkcyjny `restore_era_war_counts` / `with_era_war_counts` (`save_load.rs:258`).

## 3. Zależności

- CRED-HAK (#120): hak P4 dla wypowiedzenia gracza, sojuszu, klastra oraz `declare_forced_wars`/`declare_from_assignments`. Zaznaczone, NIE rozstrzygane. Dotyczy pozycji 23, 28 i pozostałych wejść wypowiedzenia.
- Pozycja 27 (efekt statusu z hamulca) jest warunkiem wstępnym dla testów end-to-end wojny epoki.
- `forced_war_step` (pozycja 22) musi zostać wpięty do `run_war_turn` przed resztą puli.

## 4. Propozycja podziału na tematy wykonawcze

Szacunki rund są oparte na liczbie niepodpiętych funkcji i pól stanu z tabeli, nie na pomiarze.

| Temat | Zakres (pozycje) | Zależności | Szacunek rund | Uzasadnienie |
|---|---|---|---|---|
| T3-A DYPL-MW-GATE-WYPOW | 8–16: bramka `wypowiedz_wojne` (era gate, licznik, R3, treaty), stan liczników w `WarTurnState`, zapis/odczyt | pozycja 27 (wyjaśnić przed startem) | 2 | 6 funkcji portowanych bez wołającego + 2 nowe pola stanu; testy wektorowe istnieją |
| T3-B DYPL-MW-POOL-WYMUS | 17–23, 25–26: `forced_war_step` w `run_war_turn`, pula gracza, filtr kandydata, `is_pair_blocked`, parowanie, deklaracje wymuszone | T3-A; CRED-HAK #120 dla haka P4 przy deklaracjach | 3 | największy zakres: nowy wiring kroku w pipeline + ok. 6 wejść z produkcji |
| T3-C DYPL-MW-MARSZ-KLASTER | 7, 28, 29: `is_war_march_open_for_pair` w marszu AI, `interCivWarBlockedForAi` dla klastra i sojusznika | CRED-HAK #120 (sojusz/klaster); wyjaśnić wołanie W1/W2 | 2 | 2 wołające w pinie (`main.ts:35039`, `:23738`) + zależność od #120 |
| T3-D DYPL-MW-BACKFILL | 24, restore liczników z zapisu (pozycja 16, wołający NIE_ZMIERZONO) | T3-A | 1 | jedna funkcja i ścieżka odczytu zapisu |

Kolejność: T3-A (po wyjaśnieniu pozycji 27) → T3-B i T3-D równolegle po T3-A → T3-C po CRED-HAK #120.

## 5. Ocena dla właściciela

- Pozycja 27 jest decyzją gameplay/stanu, nie tylko techniczną (czy wypowiedzenie z hamulca zmienia status pary na wojnę w produkcji). Wymaga weryfikacji przed startem T3-A.
- Liczby tur (40) i limity (1 per cywilizacja w epoce, null globalnie) są zgodne między pinem a Rust; nie wymagają nowej decyzji.

## 6. Dowody (komendy)

- `git show 07d2fbd72:gra/data/war-rules-params.json` (parametry).
- `git grep` po `multiwar|declareWar` w `07d2fbd72:gra/src` i grep po `rust-port/engine/src` i `rust-port/engine/tests` dla każdej nazwy funkcji z tabeli (wołający produkcyjni vs testy).
- Odczyt wierszy pinu `main.ts` (11632, 23738, 35031-35064, 40608-40712, 41859-41963, 46605, 46783) i `war-rules-multiwar.ts` (50, 69, 88-434).
