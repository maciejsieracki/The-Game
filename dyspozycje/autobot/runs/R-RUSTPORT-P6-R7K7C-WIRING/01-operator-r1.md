STATUS: BLOCK (INFRA: bramki clippy i `cargo test --all-targets` NIE uruchomione, df / < 8 GB; wiring i testy celowane ZIELONE)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING (runda 1), #106 / #298 / #299
GOAL: wpiac `apply_dipl_deltas_to_state` w `advance_turn` (wiring D6/D3 -> PlayableState), parytet "brak wpisu = 0", wektory apply >= 150 z pinu, mutacje (a)(b)(c) daja FAIL.
BAZA: `origin/rust-port/parity-v2` = 760be5187 (detached). Pin (tylko odczyt): 07d2fbd72, gra/src/main.ts.

ZMIANY/COMMIT:
- `rust-port/engine/src/domain/playable.rs` (allowlista): `run_diplomacy_war_phase` przyjmuje raport `run_war_turn` i wola `apply_dipl_deltas_to_state(&mut self.state, &report.dipl.treasury_deltas, &report.dipl.praca_deltas)`; blad mapowany na `PlayableError::WarTurn`, a `advance_turn` przy bledzie fazy cofa kolejke i stan wojny (istniejaca migawka).
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs`: BEZ zmian (sygnatura bez zmian).
- `rust-port/engine/tests/p6_r7k7c.rs` (NOWY, allowlista `p6_r7k7c*.rs`): dwa podmoduly. `apply` = 6 testow (wektory z pinu, brak wpisu = 0, pusta tabela nic nie zmienia, zerowy przyrost tworzy wpis jak pin `add`, niefinitny przyrost i przepelnienie odrzucaja cala aplikacje). `wiring` = 1 test: trzy tury `advance_turn` z danina (trybut AI 2 -> gracz, 40/tura).
- `rust-port/engine/tests/p6_r7k7c_vectors/apply.json` (NOWY): 232 wektory (12 brzegowych + 220 losowych, PRNG mulberry32 ziarno 2311). Kazdy wektor ma `ref` = `main.ts:<linie>` (add 22628-22644, ownerTreasury/setOwnerTreasury 34864-34871, ownerPracaPool/setOwnerPracaPool 34876-34894).
- `rust-port/engine/tests/p6_r7k7c_vectors/apply_gen.mjs` (NOWY): generator. Wykonuje tekst pinu przez `stripTypeScriptTypes` (Node 22.23) i `new Function`; wycinki pinu sa odczytywane przez `git show 07d2fbd72:gra/src/main.ts`, a SHA-256 kazdego wycinka zapisany w `apply.json` (`fragments`). Uzycie: `node rust-port/engine/tests/p6_r7k7c_vectors/apply_gen.mjs`.
  - Uwaga: lokalizacja w `p6_r7k7c_vectors/`, bo `p6_r7k7c_gen.mjs` juz istnieje w bazie (generator payments R7K7C-Q1, 366c42729) i nie byl ruszany (raz nadpisany przez pomylke, przywrocony `git checkout`, zero zmian netto).
- Commit: kod + raport, bez Cargo.lock (nie zmieniany), bez push do parity.

WYNIK WIRINGU: `apply_dipl_deltas_to_state` w `advance_turn` dziala w produkcji. Scenariusz wg pinu (`main.ts:24275-24298`, `diplomacy-economy.ts` `tickDiplomacyPayments`: platnosc gdy saldo >= kwota): tura 1 gracz 10->50, AI 100->60; tura 2 gracz 50->90, AI 60->20; tura 3 AI 20<40 -> trybut zerwany, umowa usunieta, salda bez zmian. Test zielony.

TESTY (wykonane, EXIT 0):
- `cargo test -p civ-engine --test p6_r7k7c`: 7 passed (apply 6, wiring 1), uruchomione na drzewie po `cargo fmt`.
- `cargo fmt --check -p civ-engine`: EXIT 0.

MUTACJE (kazda na scratchpadzie, potem przywrocona; drzewo wrocilo do stanu commitowanego):
- (a) usuniecie wywolania `apply_dipl_deltas_to_state` z `run_diplomacy_war_phase`: `wiring` FAIL (left `[(10,100),(10,100),(10,100)]`, right `[(50,60),(90,20),(90,20)]`). Wynik: FAIL, zgodnie z oczekiwaniem.
- (b) "brak wpisu" jako blad (`unwrap_or(0.0)` -> `ok_or_else(err)` dla skarbca AI i puli Pracy w `turn_war_dipl_steps.rs`): `apply` FAIL 3 testy (`brak_wpisu_wlasciciela_to_zero_nie_blad`, `zerowy_przyrost_bez_wpisu_tworzy_zero_jak_pin`, `wektory_z_pinu_apply_zgodne`). Wynik: FAIL.
- (c) zamiana kolejnosci apply wzgledem poprzedniego kroku tury: RÓWNOWAZNOSC (mutant nierozrozniajacy). Apply stosuje sie po calym `run_war_turn`, a kroki nastepujace po nim w tej samej turze (faza Victory, `evaluate_victory` -> `victory_power_inputs` -> `power_raw_for_owner`) NIE czytaja `economy.treasury`, `ai_treasury_by_owner` ani `praca_pool_by_owner` (grep po `src/domain/*.rs`: czytaja te pola tylko `turn_war_inputs.rs` i `diplomacy_basket.rs`, czyli wejscia budowane PRZED `run_war_turn`). Przeniesienie apply przed/po fazie Victory nie zmienia zadnej obserwowalnej wartosci. Decyzja, czy to uznac za equivalent mutant: ORKIESTRATOR (zasada "rownowaznosc mutantow").

BLOKADY:
1. BRAMKI NIE ZAMKNIETE: `cargo clippy --all-targets -- -D warnings` i `cargo test --all-targets --no-fail-fast` NIE uruchomione. Powod: df / = 8,2 GB przy starcie, 6,5 GB przed fmt/testem merged, 4,6 GB po testach (inne procesy zapisuja na dysk). Regula < 8 GB => BLOCK INFRA. Kody wyjscia: clippy NIE_ZMIERZONO, all-targets NIE_ZMIERZONO.
2. WEKTORY D3 (#299) NIE zrobione: dispatch wymagal wektorow >= 150 dla apply I dla D3. Zrobione tylko apply (232). D3 (`tick_cyclic_resource_trade_deals` / Ledger) wymaga osobnego generatora z pinu `tickCyclicResourceTradeDeals` (main.ts:24077-24180) i wejsc z `DiplStepsInputs` — NIE_ZMIERZONO w tej rundzie.
3. ROZJAZD PARITY (znaleziony, NIE naprawiany, poza zakresem allowlisty; do decyzji orkiestratora): w `Ledger` D3 (`turn_war_dipl_steps.rs`, ok. linii 399-412, przelew `Work`: `ledger.praca.insert(buyer, b - z)`, `ledger.praca.insert(seller, s + z)`) pula Pracy NIE jest podlogowana w trakcie kroku, a pin podlogowuje KAZDY zapis (`setOwnerPracaPool` -> `Math.max(0, value)`, main.ts:34879-34882), wywolywany przy main.ts:24015-24016 (zaplata praca w handlu cyklicznym) i main.ts:12588-12589 (danina/handel `praca`). Apply podlogowuje tylko sume. Przyklad: pula wlasciciela = 0; w jednej turze placi 5 (pin: 0), potem otrzymuje 10 (pin: 10); Rust: suma -5+10=+5 -> 5. Dodatkowo `buyerOk` (pin main.ts:24155 czyta pule po podlodze) czyta w Rust niepodlogowana wartosc z ledgera. To jest DECISION_REQUIRED albo osobny temat parity (nie wybieram sam). Propozycja naprawy (do zatwierdzenia): `Ledger::praca` podlogowac przy kazdym `insert` (`max(0, ...)`) i odczyt `praca_of` traktowac jako wartosc po podlodze. Wymaga zmiany w `turn_war_dipl_steps.rs` poza sygnatura, wiec poza tym dispatchem.
4. Pin nie ma przeplywu "skarbiec podlogowany" dla `add` (main.ts:22642 `aiSkarbiecByOwner.set(ownerId, (get ?? 0) + delta)` bez `Math.max`) — Rust `Ledger::add` i `apply` zgodne z tym (bez podlogi). Komentarz w `apply` ("pin nie podlogowuje") jest zgodny z `add`, a NIE z `setOwnerTreasury` (main.ts:34868 ma `Math.max(0, value)`); to rozroznienie zostalo zachowane swiadomie, bo D3/D6 pisza skarbiec przez `add`.

NASTEPNY KROK: (1) bramki clippy + `cargo test --all-targets --no-fail-fast` po zwolnieniu dysku do >= 8 GB; (2) wektory D3 (#299) jako osobny dispatch; (3) decyzja orkiestratora: rozjazd praca-podloga (blokada 3) i equivalent mutant (c).
DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push do parity-v2, bez integracji).
RUNDY: 1/5
