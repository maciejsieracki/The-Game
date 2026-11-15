STATUS: PASS
DOMAIN: GAME
TEMAT: #176 R7K7C-STATUS: czy R7K7C-WIRING (apply_dipl_deltas_to_state w advance_turn, parytet brak wpisu = 0) jest zintegrowany na parity (#106)
GOAL: Rozpoznanie tylko do odczytu: czy apply_dipl_deltas_to_state jest wpięte w ruch tury na parity, czy parytet "brak wpisu = 0" jest zachowany, czy istnieją wektory >=150 dla apply.
BAZA: origin/rust-port/parity-v2 = 10a2fc4af (wg korekty bazy w dispatchu; d5a52a980 jest jego przodkiem). Web: pin 07d2fbd72 (gra/src/main.ts, gra/src/game/diplomacy-economy.ts).
ZMIANY/COMMIT: tylko katalog runu dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-STATUS-ROZPOZNANIE-Q1/. Zero zmian w gra/, rust-port/, origin/main, rust-port/parity-v2.
TESTY: NIE_URUCHAMIANO (rozpoznanie statyczne przez git grep/git show; zgodnie z dispatchem bez cargo). Dowody: git grep na 10a2fc4af i 07d2fbd72. Zmiana tej rundy (obrona r1) dotyczy wyłącznie plików .md w katalogu runu; kod na 10a2fc4af jest niezmieniony, więc bramki kodu nie mają tu przedmiotu.
BLOKADY: brak dla rozpoznania. Luka faktyczna ponizej (nie blokada tego tematu).
RUNDY: 1/5 (rozpoznanie); obrona r1 poprawia tabelę wg zarzutów (patrz 02a-obrona.md)
NASTEPNY KROK: Evaluator (weryfikacja tabeli i dowodow), potem Final Control. Decyzja o wpieciu apply w advance_turn to osobny temat (#106), wymaga zmiany poza allowlista.
DEPLOY/PUSH: NIE WYKONANO

## 1. Tabela: krok -> odpowiednik Rust (plik:linia na 10a2fc4af)

| Krok / funkcja | Web (pin 07d2fbd72) | Rust (10a2fc4af) | Status |
|---|---|---|---|
| Przyrost skarbca AI z delty dyplomacji | main.ts:22642-22643 `aiSkarbiecByOwner.set(ownerId, (get ?? 0) + delta)` (brak wpisu = 0) | turn_war_dipl_steps.rs:1065-1081 (gałąź AI, `ai_treasury_by_owner`, brak wpisu -> `err` :1071-1074); funkcja :1041-1110 | ROZBIEZNE (brak wpisu: web = 0, Rust = blad; świadome, opisane w komentarzu :1034-1040) |
| Przyrost skarbca gracza ludzkiego | main.ts:22639-22640 `playerStateByHuman.get(ownerId)!.skarbiec += delta` (brak wpisu = wyjątek, NIE 0: non-null `!`) | turn_war_dipl_steps.rs:1059-1064 (wyliczenie, walidacja skończoności :1061-1063), zapis :1104-1105 -> `economy.treasury` | ZINTEGROWANE w funkcji, NIEWOŁANE w ruchu tury (patrz wiersz 6). Brak wpisu: web = wyjątek, Rust = blad (oba odrzucają; zgodne co do skutku, nie co do typu) |
| Przyrost puli Pracy właściciela | main.ts:34876-34877 `ownerPracaPool` (AI: `?? 0`; człowiek: `pracaPoolByHuman.get(ownerId)!`), :34879-34880 `setOwnerPracaPool` (zapis `Math.max(0, value)`) | turn_war_dipl_steps.rs:1083-1101 (podłoga 0 zgodna z pinem :1098-1100; brak wpisu -> `err` :1089-1093) | ROZBIEZNE dla AI (brak wpisu: web = 0, Rust = blad); dla człowieka web = wyjątek; podłoga ZINTEGROWANA |
| D3 handel cykliczny (źródło deltas) | main.ts:24271 wywołanie `tickCyclicResourceTradeDeals()`; definicja w pinie domknięta w main.ts:24077 | turn_war_dipl_steps.rs:456 `fn tick_cyclic_resource_trade_deals` (prywatna), wołana z `run_dipl_steps` :934; ledger -> `report.treasury_deltas` / `praca_deltas` (:1020-1021) | ZINTEGROWANE jako producent raportu; NIE_ZMIERZONO parytet wektorów (patrz NIE_ZMIERZONO) |
| D6 płatności (danina) | main.ts:24275-24298: wywołanie `tickDiplomacyPayments` w :24277, blok obsługi zerwań :24278-24298. Definicja: gra/src/game/diplomacy-economy.ts:78 | turn_war_dipl_steps.rs:206 `tick_diplomacy_payments`, wołane :954 | ZINTEGROWANE (w raporcie kroku) |
| Wołający run_dipl_steps w turze | advance tury web | turn_war_pipeline.rs:370 `report.dipl = run_dipl_steps(...)` w `run_war_turn` (turn_war_pipeline.rs:251) | ZINTEGROWANE |
| Wołający run_war_turn w turze | advance_turn web | playable.rs:1247 `run_war_turn(&mut ctx)` w `advance_turn` (playable.rs:1158), jedyne wołanie (komentarz :1234) | ZINTEGROWANE |
| Wpięcie apply_dipl_deltas_to_state w advance_turn | przepływ delt zapisuje się do stanu w tej samej turze | BRAK: `apply_dipl_deltas_to_state` ma definicję (:1041) i wołających wyłącznie w testach (`rust-port/engine/tests/p6_r7k7c_owner_pools.rs:18,275,291,305,322,338,352`). Zero wołających w `rust-port/engine/src` (git grep). | BRAK |
| Settery wejść skarbca/Pracy (zapis produkcyjny) | main.ts:34867-34871 `setOwnerTreasury`, :34879 `setOwnerPracaPool` | playable.rs:960-969 `set_owner_treasury`, :973-979 `set_owner_praca_pool`; zero wołających w `src` poza definicją (git grep); komentarz :441 | BRAK wołającego produkcyjnego; ZALEŻNOŚĆ od #106 (kto inicjuje wpisy) |
| Wektory pinu dla apply >=150 | - | BRAK. `tests/p6_r7k7c_vectors/payments.json` (pin 07d2fbd72, sha256 w pliku) pokrywa `activeDealsToPaymentDeals`, `tickDiplomacyPayments`, `tributeBreakPairsFromDeals` - NIE `apply_dipl_deltas_to_state` (potwierdza 02a-obrona.md w runie R7K7C-Q1). | BRAK |
| Wektory pinu dla D3 `tickCyclicResourceTradeDeals` | main.ts:24077 | Brak wektorów pinu; pokrycie tylko behawioralne 3 tur w `p6_wire_war_dipl_steps.rs` | BRAK wektorów (NIE_ZMIERZONO) |

Uwaga do nazwy: w webie NIE ma funkcji o nazwie `applyDiplDeltas` (git grep na gra/src: 0 trafień). Mutacje skarbca/puli w webie są bezpośrednie w miejscach wywołań (np. main.ts:22642). Rust zebrał je w jedną funkcję; to odwzorowanie, nie kopia nazwy.

## 2. Odpowiedź na pytania z dispatchu

- Czy apply_dipl_deltas_to_state jest wołane w advance_turn: NIE. Istnieje (turn_war_dipl_steps.rs:1041), jest wołane tylko z testów. Delty z `DiplStepsReport` nie trafiają do `PlayableState` między turami. Zgodne z faktem już opisanym w 01-operator-r1.md i 02a-obrona.md (R7K7C-Q1).
- Parytet "brak wpisu = 0": NIE zachowany, ale tylko dla gałęzi AI (skarbiec i Praca). Web czyta brak wpisu AI jako 0 (`?? 0`); Rust zwraca błąd (`WarTurnError::DiplStep`, helper `err` :154) i nie zapisuje nic (atomowość). Dla gracza ludzkiego web nie czyta 0, tylko rzuca wyjątek (`playerStateByHuman.get(ownerId)!`, main.ts:22640); Rust też odrzuca. Świadome odchylenie w AI oznaczone w kodzie jako OTWARTE. Rozstrzygnięcie (zmiana na 0 zgodnie z pinem) to osobna decyzja wdrożeniowa, nie w tym temacie.
- Czy wektory >=150 istnieją: NIE dla apply. Plik payments.json (pin 07d2fbd72) zawiera wektory płatności (nagłówek: `"pin"`, `"payments"`), nie apply. Nie zliczono liczby przypadków (NIE_ZMIERZONO); dla apply nie ma harnessu wektorowego.
- Czy #106 jest zintegrowane na parity: CZĘŚCIOWO. Producenci i raport (D3/D6, run_war_turn) są na parity; samo wpięcie apply w advance_turn i wektory apply/D3 - NIE.

## 3. Zależności do innych tematów

- #106 R7K7C-WIRING: wpięcie apply w `playable.rs` advance_turn (po run_war_turn, wejście `report.dipl.treasury_deltas` / `praca_deltas`) + decyzja "brak wpisu" + wektory apply. Produkcyjnym zapisem wejść skarbca i Pracy są settery `set_owner_treasury` (playable.rs:960-969) i `set_owner_praca_pool` (playable.rs:973-979), które dziś nie mają produkcyjnego wołającego; decyzja "brak wpisu = 0" wpływa więc także na to, kto inicjuje te wpisy. Wymaga zmiany poza allowlistą R7K7C.
- #104 ZLOZA-WIRING oraz #172 ZLOZA-WIRING-IMPL: zależą od tego samego PlayableState (deactivate_zloze_grants_for_deal, sync_relation_status_from_deals) - niezależne od apply, ale ten sam plik i wejście stanu.
- #135/#167 COMBAT-WEJSCIA: bez związku z dyplomacją.
- #176 niniejszy temat zamyka pytanie statusowe; #224 (ponowienie po zwolnieniu dysku) staje się nieaktualny po tym rozpoznaniu, bo odczyt był statyczny.

## 4. NIE_ZMIERZONO

- Wynik `cargo test` dla p6_r7k7c_owner_pools.rs na 10a2fc4af: NIE_ZMIERZONO (cargo nie było w zakresie tej rundy: rozpoznanie statyczne, zmiana tylko w .md).
- Zachowanie runtime (czy delty są gubione w praktyce w symulacji wielu tur): NIE_ZMIERZONO; wniosek o braku wpięcia wynika z grep na wołających, nie z uruchomienia.
- Pełna równoważność D3 `tickCyclicResourceTradeDeals` (main.ts:24077) z Rust `tick_cyclic_resource_trade_deals` (turn_war_dipl_steps.rs:456): NIE_ZMIERZONO (domknięcie wymaga wielu funkcji pomocniczych w main.ts; bez wektorów).
- Dokładna linia zapisu puli Pracy w web dla każdego wywołania `setOwnerPracaPool` poza main.ts:34880: tylko wybrane wystąpienia odczytane.
