STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BRAKE-INPUTS-Q1
GOAL: obrona Operatora r1 wobec zarzutow Evaluatora r1 (FAIL); poprawka tego, co da sie poprawic w tej rundzie, z dowodem.
ZMIANY/COMMIT: baza 1dcb6f718 (Operator r1, ancestor-check OK). Commit obrony: patrz SHA ponizej. Allowlista: rust-port/engine/src/domain/brake_inputs.rs, rust-port/engine/tests/p6_brake_inputs.rs, dyspozycje/autobot/runs/R-RUSTPORT-P6-BRAKE-INPUTS-Q1/**. Cargo.lock nie zmieniony.
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib EXIT 0 (48 passed); cargo test --test p6_brake_inputs EXIT 0 (9 passed). Wektory z pinu: NIE WYKONANO (patrz zarzut 2). CARGO_TARGET_DIR poza repo (scratchpad/target-p6-def), usuniety po bramkach.
BLOKADY: (a) objective_power_for_owner / computeObjectivePower (zarzut 1) - NIEZAMKNIETE, wymagany port w rundzie 2; (b) wektory z pinu i generator (zarzut 2) - NIEZAMKNIETE, runda 2; (c) producenci nie wolani w Rust (zarzut 5) - swiadoma zaleznosc do W8 r3, do wpisu w rejestrze po stronie orkiestratora.
RUNDY: 1/5 (obrona Operatora, Evaluator r1 FAIL)
NASTEPNY KROK: Operator r2 (ten sam ID): port computeObjectivePower (11+ skladnikow, pin 07d2fbd72 gra/src/main.ts:2759) z wektorami wycinanymi z pinu; Evaluator i Final Control r2.
DEPLOY/PUSH: NIE WYKONANO (push tylko galezi wip, bez integracji do rust-port/parity-v2).

## Odpowiedzi na zarzuty

### Zarzut 1 (KRYTYCZNY): brak objective_power_for_owner - PRZYJMUJE, NIE NAPRAWIONE w r1
- Dowod: `grep computeObjectivePower|compute_objective_power|objective_power` w rust-port/engine/src zwraca tylko plik brake_inputs.rs (komentarz i `power_map`). Brak portu.
- Web: pin 07d2fbd72 gra/src/main.ts:2759 `computeObjectivePower({...})` z polami: ownerId, epoka, jednostki, bitwyPktSum, wygraneBitwy, sumaLudkow, rekrutEkw, miasta, heksyTerytorium, budynki, techZbadane, ulepszeniaTerenu, kulturaImperium, miastaJednoscReligii, zdobyczePower. objectivePowerForOwner (l.2874) = cache z buildObjectivePowerForOwner, a web uzywa go takze w l.2880 (respekt) i 11590+ (dyplomacja).
- Zmiana w tej rundzie: brak. Port wymaga przeniesienia calego pipeline'u (sumArmyMForOwner, empirePoborTotals, countTerritoryHexes, countBuildingsForOwner, countTechForOwner, countImprovementsForOwner, empireCultureTotal, countCitiesWithDominantStateReligion, zdobyczePowerByOwner) - zakres wiekszy niz jedna runda obrony. Wejscia z closure'ow main.ts trzeba najpierw wyprowadzic jako czyste fakty.
- Status: zarzut przyjety, otwarty, wymagany w r2. Nie deklaruje GOAL spelnionego.

### Zarzut 2 (KRYTYCZNY): brak wektorow z pinu i generatora - PRZYJMUJE, NIE NAPRAWIONE w r1
- Dowod: brak rust-port/engine/tests/p6_brake_inputs_gen.mjs i katalogu p6_brake_inputs_vectors/ w 1dcb6f718 (allowlista je przewiduje, nie zostaly dodane).
- Czesc funkcji (isPeaceLockedBetween l.11817, diploCrisisWarGateBlocked l.11632, getDiplomaticContacts l.22523) to closure'y nad stanem main.ts (forcedEraPeaceUntilNextEraByPairKey, getDiploPairMeta, isWarRulesMultiwarEnabled, empireEpochForOwner). Wyciecie ich do wykonania wymaga harnessu z zamockowanym stanem; to nie zostalo zrobione. Dlatego testy z r1 sa asercjami autora, nie potwierdzeniem wzgledem webu. Przyznaje: rozumowanie kolowe jest mozliwe.
- Status: przyjety, otwarty; wymagany w r2 (generator + wektory dla funkcji czystych z modulow gra/src/game/*, a dla closure'ow harness).

### Zarzut 3 (contacts_for): filtr `me` i rozbieznosc z webem - PRZYJMUJE, NAPRAWIONE
- Dowod: web `getDiplomaticContacts(humanOwnerId = ME())` (pin main.ts:22523) zwraca `diplomaticallyDiscoveredOwnersSet(humanOwnerId)` (l.10058) BEZ filtra. Wykluczenie gracza jest u zrodla: `updateDiplomaticDiscovery` wola `computeDiplomaticContacts(visible, cities, units)` z domyslnym `playerOwnerId = 0` (gra/src/game/diplomacy-layers.ts:221-237), a funkcja pomija `c.ownerId === playerOwnerId` i barbarzyncow.
- Zmiana: `contacts_for(discovered: &BTreeSet<i64>) -> Vec<i64>` - bez parametru `me` i bez filtra; komentarz opisuje zrodlo wykluczenia. Test `contacts_mirror_web_discovered_set_sorted_without_extra_filter` (zbior {3,0,2,1} -> [0,1,2,3]).
- Uwaga: BrakePhaseInput konsumuje contacts w run_brake_phase (ai_diplomacy_turn.rs:171-172), ktore pomija `oid == me`, wiec usuniecie filtra nie zmienia wyniku fazy.
- Zarzut "trywialny wrapper" przyjety: funkcja jest tozsama z kopia zbioru, co zgadza sie z webem.
- Nie zamknieto: zgodnosc z pinem nie ma wektora (zarzut 2).

### Zarzut 4 (phase_owners): ciche pomijanie i eligibility - PRZYJMUJE, NAPRAWIONE
- Dowod: poprzednia wersja uzywala `filter_map` z `?` - brak faktow cicho usuwal wlasciciela.
- Polityka jawna: `phase_owners(...) -> Result<Vec<PhaseOwner>, MissingOwnerFacts>`; brak faktu zwraca `Err` z `owner_id`. Test `phase_owners_mark_player_and_fail_on_missing_facts` sprawdza Err dla wlasciciela 3 oraz poprawna liste dla kompletnych faktow.
- Eligibility: `diploOwnerEligibleForBrake` (web l.11590) jest stosowane w konsumencie: run_brake_phase (ai_diplomacy_turn.rs:187-190) filtruje przez `is_ai_ai_eligible_owner(&o.info)` i `o.id != me`. Zatem `AiAiOwnerInfo` nie jest "tylko przekazywany" - jest zjadany przez faze. Pozostaje do potwierdzenia wektorem (zarzut 2).
- Commit: patrz SHA.

### Zarzut 5 (producenci nie wolani w Rust) - PRZYJMUJE, bez zmiany kodu
- Dowod: brak wolania producentow w rust-port/engine/src poza testami; dispatch jawnie zapisal "Wolajacy w Rust: jawna zaleznosc do W8 r3" (00-dispatch.md).
- Zmiana: nie wykonana w tym temacie (allowlista nie obejmuje run_war_turn). Wpis do REJESTR/dispatchu W8 r3 nalezy do orkiestratora (allowlista obejmuje tylko dyspozycje/autobot/runs/R-RUSTPORT-P6-BRAKE-INPUTS-Q1/**).
- Status: przyjety jako zaleznosc otwarta do W8 r3.

### Zarzut 6 (baza): blokada 2 "decyzja orkiestratora" jest niepotrzebna - PRZYJMUJE
- Dowod: `git merge-base --is-ancestor 82c57a412 origin/rust-port/parity-v2` -> exit 0. Tip origin/rust-port/parity-v2 w tej sesji = 82c57a412 (git rev-parse). Baza z dispatchu jest zgodna z parity-v2; blokada 2 z 01-operator-r1.md jest nieprawdziwa. Nie wymaga decyzji orkiestratora.
- Zmiana: brak w kodzie. Nalezy usunac blokade 2 z rejestru.

### Zarzut 7 (era f64 i dwa zrodla "gracza") - PRZYJMUJE CZESCIOWO, UDOKUMENTOWANE
- `GateFacts.era: f64` vs web `empireEpochForOwner` (l.2419) zwraca liczbe calkowita - mapowanie jest bezstratne dla malych wartosci; zrodlo wpisane w komentarz do struktury.
- Dwa zrodla "gracza": web uzywa `isHuman(victim)` w `diploCrisisWarGateBlocked` (l.11642, `targetIsPlayer`) i `isMe(o)` (l.13748, `ME()`) w kwalifikacji. Port zachowuje rozdzielenie (GateFacts.is_player = isHuman, OwnerFacts/phase_owners.is_player = id==me) i opisuje to w komentarzu. Zmiany zachowania nie ma.
- Brak testu zgodnosci obu zrodel: przyjety, odroczony do wektorow (r2). W jednym gracz-ludzki (single-player, ME=0) oba sa rownowazne, ale to NIE_ZMIERZONO dla hotseat.

### Zarzut 8 (Evaluator commit ecf835df7 bez push) - PRZYJMUJE jako fakt procesu
- Commit Evaluatora zawiera tylko 02-evaluator.md (doc). Nie wplywa na kod. Nie pushuje ani nie integruje ten commit. Brak zmian w kodzie.

### Zarzut 9 (bramki zielone) - PRZYJMUJE jako informacje
- Nie jest zarzutem wobec kodu. Zielone bramki nie zamykaja zarzutow 1 i 2 (zgodnie z zarzutem). Odtworzone w obronie: patrz TESTY.

## SHA
- Commit obrony: patrz wynik `git rev-parse HEAD` po commicie (podany w raporcie orkiestratora).
- Baza: 1dcb6f718 (Operator r1).
