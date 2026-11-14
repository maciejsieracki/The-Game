# R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1 — runda 1 (Operator, rozpoznanie read-only)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R7K7C-WIRING (#106) — rozpoznanie wpięcia `apply_dipl_deltas_to_state` w `advance_turn`.
GOAL: ustalić (a) funkcję pina i miejsce w turze, (b) co zapisuje, (c) czy `undefined -> 0`, (d) miejsce w `advance_turn` i zmiany, (e) wektory ≥150, (f) rekomendację „brak wpisu → błąd vs 0”.
BAZA: `origin/rust-port/parity-v2` = `6acb1d81bd2bdd77fc759ac41e66badbc74fd1b8` (zgodne z oczekiwanym `6acb1d81b`). Worktree detached z tego SHA.
PIN (tylko odczyt): `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/diplomacy-economy.ts`).

ZMIANY/COMMIT: brak zmian kodu (read-only). Commit tylko raportu i dokumentu allowlisty (patrz sekcja Commit na końcu).
TESTY: NIE DOTYCZY (read-only). Nie uruchamiano cargo (zakaz zmian kodu; dysk 2,1 GB wolnego przy starcie, poniżej progu 8 GB, więc budowa nie była bezpieczna także z tego powodu).
BLOKADY: brak blokad rozpoznania. NIE_ZMIERZONO: patrz pkt 9.
RUNDY: 1/5
NASTĘPNY KROK: decyzja właściciela w sprawie pkt 5 (ABC), potem temat wykonawczy z pkt 7.
DEPLOY/PUSH: NIE WYKONANO

---

## 1. Tabela: element pina → Rust → produkcja

| # | Element pina (07d2fbd72) | Miejsce w pinie | Odpowiednik Rust | Wołany w produkcji? (`git grep`) |
|---|---|---|---|---|
| 1 | `runDiplomacyTurnTick()` (kroki D1–D8 tury dyplomacji) | `main.ts:24229`; wywołanie w EOT `main.ts:38214` | `run_dipl_steps` (`turn_war_dipl_steps.rs`), wołany z `run_war_turn` (`turn_war_pipeline.rs:370-381`) | TAK (przez `run_diplomacy_war_phase`, `playable.rs:1183-1196`) |
| 2 | D6: `buildDiploTreasury()` + `tickDiplomacyPayments(...)`; salda zapisywane inline przez `add` | `main.ts:24276-24277` | `tick_diplomacy_payments` (`turn_war_dipl_steps.rs:203`) + `Ledger::add` (`turn_war_dipl_steps.rs:358-363`), który dodatkowo zapisuje `treasury_delta` | TAK (w `run_dipl_steps`) |
| 3 | Zapis salda do skarbca gracza/AI (w pinie inline, bez raportu) | `main.ts:22634-22643`: gałąź człowieka `playerStateByHuman.get(ownerId)!.skarbiec += delta`; gałąź AI `aiSkarbiecByOwner.set(ownerId, (get ?? 0) + delta)` (`:22642`) | `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs:1031-1098`) | NIE. `git grep apply_dipl_deltas_to_state` zwraca tylko definicję (`turn_war_dipl_steps.rs:1031`) i testy (`tests/p6_r7k7c_owner_pools.rs`). |
| 4 | Odczyt salda: `ownerTreasury` = `aiSkarbiecByOwner.get(id) ?? 0` | `main.ts:34864-34866` | `Ledger::balance` (`turn_war_dipl_steps.rs:350-356`) zwraca **błąd** przy braku wpisu | TAK (ścieżka ledgera) |
| 5 | Zapis skarbca właściciela: `setOwnerTreasury` = `Math.max(0, value)` (podłoga; dla AI używana przy łupie/przejęciu, NIE w `add` z D6) | `main.ts:34867-34871` | brak odpowiednika w `apply` (apply NIE podłogowuje skarbców, zgodnie z gałęzią `add` pina, komentarz R-DEFICYT-ZLOTA-KARA-Q1 przy `main.ts:22641`) | n/d |
| 6 | Pula Pracy: `ownerPracaPool` = `aiPracaPoolByOwner.get(id) ?? 0` | `main.ts:34876-34878` | `apply` pula Pracy: brak wpisu → błąd (`turn_war_dipl_steps.rs:1079-1083`), podłoga `max(0)` (`turn_war_dipl_steps.rs:1090-1093`) | n/d |
| 7 | Pula Pracy zapis: `setOwnerPracaPool` = `Math.max(0, value)` | `main.ts:34879-~34885` | `apply`: `if value > 0 { value } else { 0 }` (`turn_war_dipl_steps.rs:1090-1093`) | n/d |
| 8 | Zerowanie wpisów przy eliminacji | `main.ts:35380-35381` (`aiSkarbiecByOwner.delete`, `aiPracaPoolByOwner.delete`) | `eliminate_owner` (Rust, #141) usuwa wpisy | n/d |
| 9 | Ustawienie wpisu AI przy bankowaniu tury (każdy żyjący AI ma wpis po pierwszym bankowaniu) | `main.ts:38978` (`aiSkarbiecByOwner.set(oid, aiSkarb)`, bez podłogi) | producent `dipl_steps_inputs` (`turn_war_inputs.rs:718-740`) eksportuje tylko istniejące wpisy | n/d |
| 10 | Kolejność: D6 (salda) przed tickiem relacji i hamulcem | `runDiplomacyTurnTick` (przed resztą tury AI) | `run_war_turn`: kroki 3b (D1–D7, `turn_war_pipeline.rs:370`) przed krokiem 5 (hamulec D8, `turn_war_pipeline.rs:415`) | TAK |

Faza w `advance_turn` (`playable.rs:1105`): kolejka faz, gdy `TurnPhase::Diplomacy` → `run_diplomacy_war_phase` (`playable.rs:1127-1134`, definicja `:1183-1196`).

## 2. Zachowanie w `run_diplomacy_war_phase` (fakty, dowód linii)

- `playable.rs:1194`: `run_war_turn(&mut ctx).map_err(...)?;`. Wynik `WarTurnReport` jest **odrzucany**. Pola `report.dipl.treasury_deltas` (`turn_war_dipl_steps.rs:137`) i `praca_deltas` (`:138`) nie trafiają do `PlayableState`.
- Wniosek: w produkcji przelewy dyplomatyczne z D6 (trybut) i przepływy Pracy (handel) są liczone w lokalnym `Ledger`, ale **nie są zapisywane do stanu gry**. To potwierdza brak wpięcia `apply_dipl_deltas_to_state`. Skutki dla rozgrywki: NIE_ZMIERZONO (nie uruchamiano gry).
- Obsługa błędu: `advance_turn` (`playable.rs:1127-1134`) cofa kolejkę i `war` (migawki `queue_before`, `war_before`). Migawka NIE obejmuje `economy`. Dlatego wpięcie musi być ostatnim krokiem fazy po sukcesie `run_war_turn`. `apply` jest już atomowy (waliduje wszystko przed zapisem, `turn_war_dipl_steps.rs:1024-1028`).

## 3. Lista zmian do wpięcia (funkcja, faza, stan)

Zmiana minimalna (wariant parytetu, patrz pkt 5):
1. `rust-port/engine/src/domain/playable.rs:1194`: zamienić `run_war_turn(&mut ctx)...?;` na `let report = run_war_turn(&mut ctx)...?;`, a po sukcesie wywołać `apply_dipl_deltas_to_state(&mut self.state, &report.dipl.treasury_deltas, &report.dipl.praca_deltas)` (błąd mapowany na `PlayableError::WarTurn`). Dodać import z `turn_war_dipl_steps`.
2. Faza: `TurnPhase::Diplomacy` w `advance_turn` (`playable.rs:1127-1134`), bez zmiany kolejności faz (wariant B, `events.rs:44`).
3. Stan: `PlayableState.economy.treasury` (gracz), `economy.ai_treasury_by_owner` (`playable.rs:444`), `economy.praca_pool_by_owner` (`playable.rs:448`).
4. Testy: `rust-port/engine/tests/p6_r7k7c_owner_pools.rs`: dodać test integracyjny „faza Diplomacy zapisuje przyrosty do stanu". Obecne testy (`:263-360`) sprawdzają tylko funkcję w izolacji.

Ryzyko kolejności (NIE_ZMIERZONO co do gry): pin nakłada salda inline w D6, przed hamulcem D8 i fazą AI. Rust nakłada je po całym `run_war_turn`. Hamulec D8 czyta `inp` zbudowane przed D1–D7 (`playable.rs:1184`), a `power` pochodzi z producentów, które NIE zawierają skarbca (skarbiec tylko w `dipl_steps_inputs`, `turn_war_inputs.rs:712-740`). Opóźnienie zapisu do końca fazy więc nie zmienia wejść D8. Wymaga potwierdzenia testem sekwencyjnym przy wpięciu.

## 4. Czy `undefined → 0` jest w pinie (dowód)

TAK, wprost dla skarbca AI: `ownerTreasury` (`main.ts:34865`: `aiSkarbiecByOwner.get(ownerId) ?? 0`), `add` w gałęzi AI (`main.ts:22642`: `(get(ownerId) ?? 0) + delta`), odczyt w `aiHireAdministrators` (`main.ts:10238`, `?? 0`). Dla puli Pracy: `ownerPracaPool` (`main.ts:34877`: `?? 0`) i przyrost (`main.ts:39784-39786`: `(get ?? 0) + poolGain`).

Rozbieżność: Rust zwraca błąd (`turn_war_dipl_steps.rs:350-356` dla ledgera; `:1057-1063` i `:1079-1083` dla apply), a `turn_war_inputs.rs:712` jawnie deklaruje „AI nie ma skarbca => brak wpisu (blad …)". Jest to odchylenie oznaczone w komentarzu jako DECISION_REQUIRED (`turn_war_dipl_steps.rs:1027-1030`).

Ważne: błąd w ledgerze działa już dziś, niezależnie od wpięcia `apply`. Gdyby brak wpisu wystąpił w grze (np. wyeliminowany właściciel, któremu pin po `delete` (`main.ts:35380`) mógłby przelać środki i odtworzyć wpis przez `?? 0`), błąd z `run_dipl_steps` trafia przez `?` do `advance_turn` i blokuje koniec tury (`Err`, cofnięcie migawek). To realne ryzyko zatrzymania tury, o osiągalności w praktyce NIE_ZMIERZONO (sprawdzono tylko kod).

## 5. ABC (f): „brak wpisu → błąd” vs „brak wpisu → 0”

Opis: gdy właściciel nie ma wpisu w `ai_treasury_by_owner` lub `praca_pool_by_owner` (np. wyeliminowany AI, który dostaje przelew, albo właściciel przed pierwszym bankowaniem), Rust przerywa całą fazę dyplomacji błędem i tura się nie kończy. Pin traktuje brak jako 0 i tworzy wpis (`?? 0`). Dotyczy ledgera (`turn_war_dipl_steps.rs:350-356`) i `apply` (`:1057-1063`, `:1079-1083`). Decyzja wpływa na wpięcie #106 i na test `apply_deltas_is_atomic_on_missing_owner` (`tests/p6_r7k7c_owner_pools.rs:281-295`).

- **A) Parytet: brak wpisu = 0, wpis zostaje utworzony** (zgodne z pinem: `main.ts:22642`, `:34865`, `:34877`).
  - ZA: 1:1 z pinem (zasada 9); brak zatrzymania tury przez brak wpisu; pin wprost daje 0.
  - PRZECIW: ukrywa niespójność stanu (wpis, którego po eliminacji nie powinno być, powstaje po cichu); wymaga zmiany testów i komentarzy DECISION_REQUIRED.
- **B) Zachować błąd (obecny kod).**
  - ZA: wykrywa niespójny stan jawnie; zgodne z założeniem producenta (`turn_war_inputs.rs:712`).
  - PRZECIW: odchylenie od pinu bez uzasadnienia wynikającego z gry; przy osiągalnym przypadku blokuje koniec tury; wymaga osobnej decyzji właściciela.

**Rekomendacja: A (parytet, brak = 0), oznaczona jako ZGODNE z zasadą 9.** Pin wprost daje 0 w każdym miejscu odczytu i zapisu salda/puli dla AI (pkt 4), a błąd w `advance_turn` to twarde zatrzymanie tury. Jeśli właściciel chce świadomie zachować B, trzeba to zapisać jako odstępstwo w `dyspozycje/rust-port/REJESTR-RUST.md` (zasada 9).

## 6. Wektory testowe (e)

- Istniejący plik `rust-port/engine/tests/p6_r7k7c_vectors/payments.json` (pin `07d2fbd72`, SHA-256 w pliku): **203 przypadki** (asercja `>= 150` już w `payment_vectors_from_pin_match_rust`, `p6_r7k7c_owner_pools.rs:52-60`). Każdy wiersz ma `treasury` (przed) i `balances` (po D6) dla właścicieli 1..4. Z tego **119** przypadków zmienia saldo; 84 to przypadki zerowe (np. `brzeg-pusty`), też użyteczne do testu „brak zmiany = brak zapisu".
- Delta do `apply_dipl_deltas_to_state` = `balances[o] - treasury[o]` dla każdego właściciela. Wystarcza do testu zgodności z pinem dla **skarbców** bez nowego generatora.
- **Brak wektorów pinu dla puli Pracy** w tym pliku (`praca_deltas` z `ledger.praca_delta` w handlu, `turn_war_dipl_steps.rs:410-415`). Wymaga rozszerzenia `rust-port/engine/tests/p6_r7k7c_gen.mjs` (pin) i nowego pliku wektorów.
- Brak wektorów pinu dla D3 (zgodnie z opisem modułu, `p6_r7k7c_owner_pools.rs:9-10`).
- Mapowanie id właścicieli (1..4 → człowiek/AI w `PlayableState`): NIE_ZMIERZONO, do ustalenia w teście.

## 7. Propozycja tematów wykonawczych

| Temat | Allowlista | Zależności | Szacunek rund |
|---|---|---|---|
| **R7K7C-WIRING-IMPL** (#106): wpięcie `apply` w `run_diplomacy_war_phase` + test integracyjny sekwencji faz | `rust-port/engine/src/domain/playable.rs`, `rust-port/engine/tests/p6_r7k7c_owner_pools.rs` | Decyzja ABC (pkt 5) przed startem. NIE zależy funkcjonalnie od ZLOZE (T1/T3), ale #104 (`deactivate_zloze_grants_for_deal`) edytuje `turn_war_dipl_steps.rs`, więc serializować po #104 albo rozdzielić integrację. | 1–2 |
| **R7K7C-PARYTET-BRAK-WPISU** (tylko przy A): brak wpisu = 0 w ledgerze i `apply`; aktualizacja testu `apply_deltas_is_atomic_on_missing_owner` i komentarzy DECISION_REQUIRED | `rust-port/engine/src/domain/turn_war_dipl_steps.rs`, `rust-port/engine/src/domain/turn_war_inputs.rs` (komentarz `:712`), `rust-port/engine/tests/p6_r7k7c_owner_pools.rs` | Przed WIRING-IMPL (ta sama funkcja); może być połączony z nim w jeden temat | 1 |
| **R7K7C-VEC-PRACA**: wektory pinu dla przepływu puli Pracy (handel D-steps) | `rust-port/engine/tests/p6_r7k7c_gen.mjs`, `rust-port/engine/tests/p6_r7k7c_vectors/praca*.json` (nowy), `rust-port/engine/tests/p6_r7k7c_owner_pools.rs` | Niezależny; może iść równolegle z IMPL | 1–2 |

Poza zakresem tych tematów: wektory D3 (brak w pinie) i `deactivateZlozeGrantsForDeal` (#104).

## 8. Rekomendacja (pytanie f)

Rekomenduję wariant A (brak = 0). Zgodne z zasadą 9: pin wprost daje 0, a odstępstwo bez wymogu gry nie jest uzasadnione. Pytanie ABC do właściciela zostaje otwarte tylko wtedy, gdy chce on świadomie zachować błąd (wtedy wpis w `REJESTR-RUST.md`).

## 9. Niepewne twierdzenia (NIE_ZMIERZONO)

- Czy brak wpisu występuje w praktyce w grze (kod sprawdzony statycznie, gry nie uruchamiano).
- Efekt kolejności zapisu (koniec fazy vs inline w D6) na wynik D8 i fazy AI: potrzebny test sekwencyjny przy wpięciu.
- Mapowanie id właścicieli w wektorach na `PlayableState`.
- Wyniki `cargo test`: nie zmierzono (zakaz zmian kodu, dysk poniżej progu).

## Commit

Commit na `wip/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1`, tylko allowlista: ten raport oraz `dyspozycje/rust-port/p6/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1.md`. Bez push do `parity-v2`.
