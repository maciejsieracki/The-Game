# R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ROZPOZNANIE-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ROZPOZNANIE-Q1
GOAL: Odpowiedzieć na każdy zarzut; poprawić dokument rozpoznania tam, gdzie zarzut jest trafny; rozstrzygnąć pozycję 27.
BAZA: `470bba561` (commit Evaluatora na `wip/eval-MULTIWAR-r1`, worktree `wf_f638a0ba-62e-2`). Commit obrony: patrz `git log -1` na gałęzi roboczej (detached HEAD worktree `wf_f638a0ba-62e-3`), SHA podany w raporcie zwrotnym.
ZMIANY/COMMIT: tylko `dyspozycje/rust-port/p6/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ROZPOZNANIE-Q1-ROZPOZNANIE.md` i ten plik. Bez zmian w `rust-port/**`, `gra/**`, testach, Cargo. Bez push.
TESTY: NIE DOTYCZY (zmiana wyłącznie dokumentacyjna; dispatch: TESTY NIE DOTYCZY). Weryfikacja: grep po `rust-port/engine/{src,tests}` i `git grep` po pinie `07d2fbd72`.
BLOKADY: brak. Jedno uwarunkowanie: pozycja 27 jest rozstrzygnięta jako BRAK w produkcji, a decyzja, czy wpiąć to w T3-A, wymaga pytania ABC do właściciela (zmienia zachowanie gry).
RUNDY: 1/5 (obrona w tej samej rundzie, bez nowej rundy Operatora).
NASTĘPNY KROK: ponowna ocena Evaluatora tylko dla pozycji 13, 27, 29 oraz wpisów 5/28 (nowe wołające); potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1 — poz. 13: „ZERO wołających, nawet w testach” — PRZYJMUJĘ
Dowód: `rust-port/engine/tests/p6_dyplo_multiwar_gates.rs:224` woła `evaluate_era_forced_war_gate(&gi, &params)`.
Poprawka: poz. 13 w tabeli. Wołający produkcyjny BRAK; wołający tylko testy `p6_dyplo_multiwar_gates.rs:224`.

### Z2 — poz. 29: błędny pin `main.ts:35031-35064` — PRZYJMUJĘ
Dowód (`git grep` po `07d2fbd72`):
- definicje: `gra/src/game/war-rules-multiwar.ts:454` (`pickEngagementArmy`), `:493` (`allocateGroupsToEnemies`);
- wołający pin: `gra/src/game/warAllInCapital.ts:775` (alloc), `:801` (pick); `gra/src/game/ai.ts:4979` (W2 alloc, pominięte w zarzucie);
- `gra/src/main.ts:35039` to filtr `isWarMarchOpenForPair` (pozycja 7), nie wołający W1/W2.
Poprawka: poz. 29 przepisana (pin, wołający pin, Rust).

Produkcyjny wołający Rust (zarzut: „nie ustalono”) — ustalony w obronie:
- `war_all_in_capital_plan.rs:404,435` leżą w `plan_war_all_in_capital_with_defenders` (`:302`).
- Wołający `plan_war_all_in_capital_with_defenders`: `ai_war_march_plan.rs:198` (w `plan_war_march_core`) oraz testy `p6_repin_*`.
- `plan_war_march_core` i `plan_war_march` (adapter) mają wołających tylko w `rust-port/engine/tests/` (`p6_wire_war_march_adapter.rs`, `p6_wire_war_march_core.rs`, `p6_wire_war_march_vectors.rs`).
- `plan_war_all_in_capital` wołany tylko w testach `p6_repin_wojna_d_*`.
Wniosek: W1/W2 w Rust są NIEPODPIĘTE (test-only). Wpis w tabeli zmieniony ze „PORTOWANE” na „NIEPODPIĘTE”, dodano pozycję do listy brakujących.

### Z3 — poz. 5 i 28: niepełne wołające `evaluateInterCivWarGate` / `interCivWarBlockedForAi` — PRZYJMUJĘ
Dowód (`git grep` po `07d2fbd72:gra/src/main.ts`):
- `11634` (hamulec, `diploCrisisWarGateBlocked`);
- `23742` (wewnątrz `interCivWarBlockedForAi`, definicja `:23739`);
- `23885` (sojusznik dołączający — wołający `interCivWarBlockedForAi`);
- `40440` (klaster państw-miast — wołający `interCivWarBlockedForAi`);
- `40696` (pula wymuszonych woła `evaluateInterCivWarGate` bezpośrednio);
- `41887` (komenda `wypowiedz_wojne`).
Poprawka: wiersze 5 i 28 oraz lista brakujących (sekcja 2) i T3-C (sekcja 4). `:40696` przypisane do T3-B, `:41887` do T3-A, `:23885`/`:40440` do T3-C. Rust: `:40696` i `:41887` BRAK w produkcji; `:23885`/`:40440` BRAK (zgodnie z komentarzem `turn_war_dipl_steps.rs:24-26`).

### Z4 — poz. 0 (Kamień): sprzeczne „zgodne” i „brak stałej” — PRZYJMUJĘ
Dowód: pin `war-rules-params.json:5`: `"eraForcedWarStartTurnsFromEra": { "stone": 40, "bronze": 40, "iron": 40 }`. Rust `diplomacy_multiwar_gate.rs:58,60` ma stałe tylko dla bronze i iron; brak stałej dla stone.
Poprawka: wiersz opisuje to jednoznacznie: „BRAK stałej w Rust (wartość pinu = 40, brak rozbieżności wartości); bronze/iron zgodne”.
Dodatkowo: komentarz `diplomacy_multiwar.rs:94` cytuje `war-rules-multiwar.ts:139` dla `forcedEraTagFromPowod`; w pinie funkcja jest w `:172`. Dopisane do uwagi o źródłach w dokumencie.

### Z5 — commit Operatora z `Co-Authored-By` mimo zakazu w dispatchu — PRZYJMUJĘ jako fakt, nie blokuje
Commit `d37f55774` zawiera linię `Co-Authored-By: Claude Haiku 5.5`. Historii nie przepisuję (to commit już opublikowany w łańcuchu). Commit obrony ma wyłącznie linię `Claude-Session` i nie zawiera linii z nazwą modelu, zgodnie z dispatchem. Decyzja o `d37f55774` należy do orkiestratora.

### Z6 — poz. 27 pozostaje NIE_ZMIERZONO, choć dowód jest osiągalny — PRZYJMUJĘ, rozstrzygnięte
Dowód po stronie pinu (`07d2fbd72:gra/src/main.ts:11700-11713`, hamulec): przy wojnie z hamulca ustawiane są: `setDiploRelation(declarer, victim, applyDiploEventTracked(…, 'wojna_wypowiedziana'))` (`:11707-11711`), `breakTreatiesOnWar(…, {bezKary: true})` (`:11705`), `applyAllianceObligationsOnWar` (`:11706`), `zarejestrujWypowiedzenie(declarer, turn, 'hamulec')` (`:11713`).
Dowód po stronie Rust:
- produkcja `turn_war_pipeline.rs:418-422` woła tylko `note_war_declarations` (`turn_war_dipl_steps.rs:876-897`), czyli zapis licznika wiarygodności P4; nie zmienia `RelationStatus`;
- `DiplomaticEvent::DeclareWar` (`diplomacy.rs:632`) stosowany w `diplomacy_truce_flow.rs:271,322`; metody `declare_war` (`:239`) i `declare_war_opts` (`:247`) nie mają wołającego w `rust-port/engine/src` (jedyny wołający `declare_war` → `declare_war_opts` na `:240`; testy `p6_repin_rozejm_silnik.rs:253`);
- `grep` po `rust-port/` nie znajduje żadnego produkcyjnego wywołania `declare_war(`;
- zgodne z komentarzem `playable.rs:1108-1109` („Deklaracje wojny z hamulca nie maja jeszcze efektow (W4/W8)”).
Rozstrzygnięcie: w produkcji Rust wojna z hamulca NIE zmienia statusu relacji i NIE zrywa traktatów/sojuszy. Pozycja 27 w tabeli: BRAK. Zakres skutków dla `WarTurnState` pozostaje NIE_ZMIERZONO (nie zbadano, czy inne odczyty stanu wojny w Rust korzystają z `WarTurnState` zamiast relacji).
Zmiana w dokumencie: wiersz 27, sekcje 2, 3, 4 (T3-A) i 5. Pytanie do właściciela: czy wpiąć zmianę statusu z hamulca (zmienia zachowanie gry) — pytanie ABC w odpowiedzi orkiestratora.

### Z7 — bramki cargo (fmt, clippy, test) nie odtworzone — ODRZUCAM (nie wymagane)
Dispatch: „TESTY: NIE DOTYCZY: rozpoznanie bez zmian kodu”. Diff obrony: wyłącznie pliki dokumentacji (dwa pliki wyżej). Nie ma czego kompilować. Weryfikacja zakresu: `git diff --stat` i `git diff --check` przed commitem.

## Lista zmian w dokumencie

1. Sekcja 0, wiersz `eraForcedWarStartTurnsFromEra`: stone = BRAK stałej w Rust, wartość pinu 40.
2. Uwaga o źródłach: dodany przykład nieaktualnego pina (`forcedEraTagFromPowod` :139 vs :172).
3. Wiersz 5: wołający pinu 11634, 23742, 40696, 41887; status BRAK dla wołających poza hamulcem.
4. Wiersz 13: wołający tylko testy `p6_dyplo_multiwar_gates.rs:224`.
5. Wiersz 27: BRAK (rozstrzygnięte); pin/Rust z dowodem.
6. Wiersz 28: wołający pinu 23885 i 40440, pin definicji 23739.
7. Wiersz 29: pin definicji W1/W2 (`war-rules-multiwar.ts:454,493`), wołający pinu (`warAllInCapital.ts:775,801`, `ai.ts:4979`), Rust NIEPODPIĘTE (test-only).
8. Sekcja 2: dodana pozycja W1/W2; poprawione odwołania do 23739; pozycja 27 przeniesiona z „do rozstrzygnięcia”.
9. Sekcja 3, 4, 5: pozycja 27 rozstrzygnięta jako BRAK; T3-A musi wpiąć zmianę statusu z hamulca; T3-C opisany z nowymi wołającymi.

## Co pozostaje otwarte

- Pytanie ABC do właściciela: wpiąć zmianę statusu relacji z hamulca do T3-A (zmiana zachowania gry) — opcje w odpowiedzi orkiestratora.
- NIE_ZMIERZONO: skutki braku zmiany `RelationStatus` dla `WarTurnState` (poz. 27); bramka `isWarRulesMultiwarEnabled()` przy wołaniu W1/W2 w pinie (poz. 29); wołający produkcyjny `restore_era_war_counts` (poz. 16, `save_load.rs:258`).
