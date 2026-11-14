STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1 (etap a, #104, T2 rozpoznania R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2)
GOAL: Czysta domena zerwania traktatow przy wojnie (breakTreatiesOnWar) i dobrowolnym zerwaniu (breakTreatyVoluntarily) na jawnym stanie DiplomacyState, zgodna 1:1 z pinem 07d2fbd72f758705f8e1d59cc4968027ffbafe75. Bez wpiecia w produkcje (etap b).

ZMIANY/COMMIT: branch wip/R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1 z bazy 533d46dd3 (commit podany w raporcie koncowym, bez push).
- rust-port/engine/src/domain/diplomacy.rs: +84 linii, 0 usuniec. Nowe metody `DiplomacyState::break_treaties_on_war` (linia 1690) i `DiplomacyState::break_treaty_voluntarily` (linia 1708); wolne funkcje `trade_treaty_break_penalty_free` (4329), `voluntary_treaty_break_plan` (4336), stale `TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS` (4306), typy `VoluntaryTreatyBreakPlan` (4312) i `VoluntaryTreatyBreak` (4320). Dodany jeden import `use crate::domain::alliance_war_obligation::treaties_broken_by_war;` (wymagany przez metode wojny). Istniejace funkcje `suspend_zloze_grants_for_war`, `deactivate_zloze_grants_for_deal` i `treaties_broken_by_war` NIE zmienione, tylko wolane.
- rust-port/engine/tests/p6_zloze_break_war_a.rs (NOWY, 324 linie): 7 testow.
- rust-port/engine/tests/p6_zloze_break_war_a_gen.mjs (NOWY, 276 linii): generator; wykonuje tekst pina przez transpilacje TypeScript w node; straznik SHA-256 czterech plikow pina.
- rust-port/engine/tests/p6_zloze_break_war_a_vectors/vectors.json (NOWY): 260 przypadkow wojny + 300 dobrowolnych zerwan.
- dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1/01-operator-r1.md (ten raport).
Poza commitem: rust-port/engine/Cargo.lock (wygenerowany przez cargo, NIE commitowany, zgodnie z dispatchem).

Funkcje (kryterium 1):
- `DiplomacyState::break_treaties_on_war(a, b) -> Vec<String>` (diplomacy.rs:1690). Kolejnosc jak pin: suspend -> treatiesBrokenByWar -> removeTreatiesById -> deactivate per id. Pusta lista zerwan = brak zmian w umowach (pin: return).
- `DiplomacyState::break_treaty_voluntarily(deal_id, turn) -> Option<VoluntaryTreatyBreak>` (diplomacy.rs:1708). Brak umowy = None, bez zmian stanu (pin: `if (!deal) return`). Plan -> removeTreatiesById -> deactivate.
- `voluntary_treaty_break_plan(deal, turn)` (diplomacy.rs:4336) = pin `voluntaryTreatyBreakPlan`; `trade_treaty_break_penalty_free` (diplomacy.rs:4329) = pin `tradeTreatyBreakPenaltyFree` (prog 10 tur, wiek = max(0, tura - zawarta)).

TESTY (kody wyjscia, wszystko z CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- cargo fmt --check: EXIT 0 (cargo fmt uruchomiony na crate; zmienione tylko pliki tematu).
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo test --lib: EXIT 0 (114 passed, 0 failed).
- cargo test --test p6_zloze_break_war_a: EXIT 0 (7 passed): vectors_meet_minimum_counts_and_pin; break_treaties_on_war_matches_pin_vectors; break_treaty_voluntarily_matches_pin_vectors; trade_penalty_free_boundary_is_ten_turns; alliance_is_never_penalty_free_and_opens_n3_when_open_ended; war_break_keeps_unrelated_pairs_and_deals; deactivate_helper_is_reused_by_voluntary_break.
- cargo test --test p6_zloze_grants_state: EXIT 0 (8 passed).
- cargo test --test p6_zloze_wire_expire_tribute: EXIT 0 (1 passed).
- git diff --check: czysty (takze dla nowych plikow przez git add -N, cofniete).

Wektory (kryterium 2): generator wykonany przez `node p6_zloze_break_war_a_gen.mjs <pinDir> <outDir>`, OK war=260 voluntary=300. Liczniki galezi (z pliku wektorow):
- wojna z zerwana umowa: 81; wojna bez umowy do zerwania: 179; przypadki ze zmiana grantu wskutek zerwanej umowy: 44 (asercje testu wymagaja >0 dla: zerwana umowa, bez umowy, wygaszenie grantu przez umowe, zawieszenie grantu przez wojne).
- dobrowolne: bez kary (penaltyFree): 31; okno N3 (openN3Window): 104; N5 (n5Charged): 132; nieistniejace id: 33.
Asercje na stanie: umowy (lista id i pelna rownosc ActiveDeal), granty (pelna rownosc), zwrocone id, plan. Brak #[ignore], brak osłabionych asercji.

Straznik SHA-256 pinu (oczekiwany = zmierzony): gra/src/game/diplomacy-pn-engine.ts ee1b1aab...9257; gra/src/game/diplomacy-treaties.ts 9b8e3bd8...6cb; gra/src/game/diplomacy-penalty-preview.ts ae78466a...6c5; gra/src/types/diplomacy.ts 1a963e56...6b.

BLOKADY:
1. BAZA: HEAD worktree (78af786ed) NIE byl potomkiem 533d46dd3. Zgodnie z dispatchem przestawiono: `git checkout -b wip/R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1 533d46dd3` (merge-base --is-ancestor = OK).
2. NIE_ZROBIONE (poza zakresem etapu a, zgodnie z dispatchem):
   - kara wiarygodnosci i zdarzenia: `zlamana_obietnica` / `zlamana_obietnica_ai` (breakTreatiesOnWar), parametr `bezKary` (r3, casus belli) — w pinie main.ts:23686-23700;
   - dobrowolne zerwanie: zapis okna N3 (`setDiploPairMeta` / `n3Window`), `appendWiarygodnoscEvent` N5 (`zerwanie_dobrowolne_handel` / `zerwanie_dobrowolne_traktat`), `applyDiploEventTracked` relacji, karencja WspolnaWalkaBarbarzyncy (`recordBarbarianCooperationGrace`) — pin main.ts:22741-22790;
   - wywolanie produkcyjne obu funkcji (etap b, po #120/#104 czesc 2).
3. ROZBIEZNOSCI Rust vs pin (udokumentowane, nie zmieniane w tym temacie):
   a. `formed_turn: u32` w Rust jest zawsze obecne, pin ma opcjonalne `zawartaTura`. Przypadek pinu „wiek nieznany" (stary zapis bez zawartaTura: penaltyFree = false) nie ma odpowiednika; generator zawsze podaje zawartaTura, wiec wektory tego nie pokrywaja. Do rozstrzygniecia przy wpieciu (etap b) lub w migracji zapisu.
   b. `TreatyKind` w Rust łączy `umowa_handlowa` i `umowa_szlakow` w jeden wariant `TradeRoute` (alias serde). Pin rozroznia je jako osobne rodzaje. Dla obu funkcji (zerwanie wojna, penaltyFree, plan) zachowanie jest identyczne, ale wiernosc nazewnicza nie jest pełna.
   c. `rozejm` nie jest modelowany w Rust (pin tez nie ma go w BREAK_ON_WAR, wiec bez wplywu na te funkcje).
4. Pin-owy `treatiesBrokenByWar` i `removeTreatiesById` odtworzone przez istniejacy Rust `treaties_broken_by_war` (alliance_war_obligation.rs, NIE zmieniony) i inline `retain`. Zbior wojenny zgodny z pinem BREAK_ON_WAR po mapowaniu nazw (Nap, FullAlliance, DefensiveAlliance, OpenBorders, MilitaryMarch, BarbarianCooperation, TradeRoute, Exchange).
5. Commit: dispatch wymaga tresci bez nazwy modelu, a naglowek sesji wymaga linii Co-Authored-By z nazwa modelu. Zastosowano dispatch (bez linii Co-Authored-By); linia `Claude-Session` obecna. Do decyzji orkiestratora.

RUNDY: 1/5 (dispatch: runda 1)
NASTEPNY KROK: Evaluator r1 — weryfikacja zgodnosci z pinem (tekst funkcji pina vs Rust), mutacje (np. prog 10 -> 9, kolejnosc suspend/deactivate), nastepnie Final Control. Integracja i push dopiero po READY_FOR_DEPLOY (orkiestrator).
DEPLOY/PUSH: NIE WYKONANO
