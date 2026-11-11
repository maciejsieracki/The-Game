STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BRAKE-INPUTS-Q1
GOAL: Czyste funkcje budujace BrakePhaseInput (W8 podzial 2/3) wg FC r1 FAIL: port computeObjectivePower (web l.2759, pin 07d2fbd72), wektory z pinu generowane przez wykonanie kodu weba, GateFacts.era jako i64, jedno zrodlo roli gracza, wpis zaleznosci do W8 r3.
ZMIANY/COMMIT: baza 99c094771 (detach, = r2 z dispatchu; 82c57a412 jest przodkiem origin/rust-port/parity-v2, sprawdzone `merge-base --is-ancestor`: OK). SHA commitu: w sekcji COMMIT na koncu raportu (uzupelnione po commicie).
  Allowlista (uzyta):
  - rust-port/engine/src/domain/brake_power.rs (NOWY, 210 LOC): port computeObjectivePower + PowerCoeffs, BattlePowerModel, military_component_keys, objective_power_for_owner (adapter).
  - rust-port/engine/src/domain/brake_inputs.rs (zmieniony, 232 LOC): GateFacts.era: i64; OwnerRoles { me, human_ids } (is_human = web isHuman, is_me = web isMe); gate_facts_for; all_power_owner_ids (web allPowerOwnerIds); phase_owners(roles, ...); crisis_war_gate_blocked rzutuje era na f64 przy wywolaniu evaluate_inter_civ_war_gate.
  - rust-port/engine/src/domain/mod.rs (tylko `pub mod brake_power;`).
  - rust-port/engine/tests/p6_brake_inputs.rs (zmieniony: sygnatury i64/OwnerRoles, bez zmian zakresu testow r1).
  - rust-port/engine/tests/p6_brake_inputs_vectors.rs (NOWY, 332 LOC): porownanie portow Rust z wektorami z pinu.
  - rust-port/engine/tests/p6_brake_inputs_gen.mjs (NOWY, 340 LOC): generator, wykonuje kod z pinu.
  - rust-port/engine/tests/p6_brake_inputs_vectors/vectors.json (NOWY, wygenerowany z pinu).
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-BRAKE-INPUTS-Q1/02b-operator-r2.md (ten raport).
  Nie zmieniano: gra/**, WERSJE.md, Cargo.toml, Cargo.lock (wygenerowany lokalnie przez cargo, NIE dodany do commita), istniejace pliki domain/ poza mod.rs.

TESTY:
- cargo fmt --check: EXIT 0 (po cargo fmt; zmiany tylko w plikach allowlisty).
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo test --lib: EXIT 0, 48 passed, 0 failed.
- cargo test --test p6_brake_inputs: EXIT 0, 9 passed, 0 failed.
- cargo test --test p6_brake_inputs_vectors: EXIT 0, 8 passed, 0 failed.
- Regeneracja wektorow (node tests/p6_brake_inputs_gen.mjs <WEB_ROOT> 07d2fbd72...): EXIT 0; `cmp` z commitowanym vectors.json: IDENTYCZNE.
- Liczba przypadkow w vectors.json: objective 61, peace 80, gate 120, eligibility 60, contacts 20, players 20. Gate: 58 blocked / 62 not blocked; peace: 16 locked / 64 not locked (oba galezie pokryte).
- Pokrycie wektorow:
  - computeObjectivePower: WYKONANIE pin/power-objective.ts (realny modul, importy JSON resolwowane); porownanie power, powerBase (dokladnie), komponentow (key, rawCount, coefficient, points, military). Wspolczynniki i flagi wojskowe z pin JSON = data/power-params.json (identyczne, diff OK).
  - isPeaceLockedBetween (main.ts): WYKONANIE wycinka + realne isPeaceTreatyLocked, isForcedEraPeaceLocked, diploPairKey, freshDiploPairMeta, isHumanOwner.
  - diploCrisisWarGateBlocked (main.ts): WYKONANIE wycinka + realne evaluateInterCivWarGate. realMultiwarFlag = true (pin WAR_RULES_MULTIWAR_ENABLED), zapisany w wektorze i sprawdzany w tescie.
  - diploOwnerEligibleForBrake, allPowerOwnerIds (main.ts): WYKONANIE wycinka + realne isAiAiEligibleOwner.
  - getDiplomaticContacts, isHuman, isMe, ME (main.ts): WYKONANIE wycinka.
  - Wejscia podawane jawnie jako fakty wektora (NIE wycinane z pinu, zob. BLOKADY 4): isBarbarian, countActiveWarsForOwnerExcludingBarbarians, diplomaticallyDiscoveredOwnersSet, cities, aiStartHexes, typCityCopyOwners, eliminatedOwners, playerStateByHuman, ownerEraByOwner, forcedEraPeaceUntilNextEraByPairKey, diplomacyPairMeta.
- Zaleznosci generatora: Node 22 (stripTypeScriptTypes, eksperymentalne), typescript.js z /opt/node22/lib/node_modules/typescript (TS_JS), WEB_ROOT = `git archive 07d2fbd72... gra/src gra/data` rozpakowane poza repo. Brak esbuild, brak cichych atrap: nieznany identyfikator we wycinku rzuca blad.
- Realna weryfikacja w przegladarce: NIE DOTYCZY (brak zmian wizualnych).

ZGODNOSC ZRODLA GRACZA (FC pkt 4): web uzywa dwoch funkcji: isHuman(id) (humanSeats, zrodlo dla targetIsPlayer w bramce) oraz isMe(id) = id === ME() (zrodlo dla is_player w diploOwnerEligibleForBrake). Port trzyma obie w jednej strukturze OwnerRoles; test player_role_sources_match_web_is_human_and_is_me porownuje obie z wektorem `players` (w tym przypadki humanIds=[0,3]) i przy jednym fotelu sprawdza rownosc isHuman == isMe. Brak trzeciego zrodla w portach.

GateFacts.era (FC pkt 3): i64, zgodnie z web empireEpochForOwner (liczba calkowita 1..10 z playerStateByHuman/ownerEraByOwner/gameStartEra). Konwersja na f64 tylko przy wywolaniu evaluate_inter_civ_war_gate (jego pola sa f64 w sygnaturze); dla calkowitych 1..10 wartosc dokladna.

TABELA POKRYCIA computeObjectivePower (web buildObjectivePowerForOwner, main.ts:2740; 11 skladnikow + zdobycze):
Port funkcji (wzor, wspolczynniki, bitwy-model, flagi wojskowe, zaokraglenie) = PORTOWANE i zweryfikowane wektorami.
Zrodla wejsc (liczniki per wlasciciel) w PlayableState: PONIZEJ. Nazwy kandydatow znalezione grepem; ich semantyki NIE porownywano (NIE_ZWERYFIKOWANE), nie sa podpiete.

| Skladnik (key) | Wejscie web | Rust | Status |
|---|---|---|---|
| armia (`armia`) | sumArmyMForOwner (wariant nominalny; wariant Effective inny tylko tu) | brak zweryfikowanego odpowiednika sumy M per wlasciciel | NIE_PORTOWANE (wejscie od wolajacego) |
| bitwy (`bitwy`) | battlePowerPtsByOwner | brak mapy punktow bitew per wlasciciel | NIE_PORTOWANE |
| ludki (`ludki`) | empirePoborTotals(...).sumaLudkow | kandydat: domain/recruitment.rs `empire_pobor_totals` | NIE_ZWERYFIKOWANE |
| rekruci (`rekruci`) | rekrutUnitEquivalents(pobor.rekruci, epoka, costMult) | kandydat: domain/recruitment.rs `rekrut_unit_equivalents` | NIE_ZWERYFIKOWANE |
| miasta (`miasta`) | ownerCities.length | trywialne (liczba miast wlasciciela) | wejscie od wolajacego |
| terytorium (`terytorium`) | countTerritoryHexes(statsTerritoryNodesForOwner) | brak potwierdzonego licznika | NIE_PORTOWANE |
| infra (`infra`) | countBuildingsForOwner | brak potwierdzonego licznika | NIE_PORTOWANE |
| tech (`tech`) | countTechForOwner | brak potwierdzonego licznika | NIE_PORTOWANE |
| ulepszenia (`ulepszenia`) | countImprovementsForOwner | brak potwierdzonego licznika | NIE_PORTOWANE |
| kultura (`kultura`) | empireCultureTotal(cultureCities, ownerId) | kandydat: domain/order_effects_culture.rs `empire_culture_total` (argument PressureCity) | NIE_ZWERYFIKOWANE |
| religia (`religia`) | countCitiesWithDominantStateReligion(religionCities, ...) | brak zgodnej funkcji (`empire_religion_total` ma inna semantyke, niesprawdzona) | NIE_ZMIERZONO |
| zdobycze (`zdobycze`) | zdobyczePowerByOwner (stale wsp. 2) | brak stanu zdobyczy w Rust | NIE_PORTOWANE |

Wniosek: objective_power_for_owner jako pelny producent z PlayableState NIE jest zrobiony. Jest port funkcji + adapter; wejscia skladnikow musza przyjsc od wolajacego (W8 r3 albo osobny temat producentow mocy).

ZALEZNOSC DO W8 r3 (wolajacy w Rust, NIE zrobione w tym temacie):
- run_war_turn musi wywolac: is_peace_locked_between / peace_locked_set (fakty: forced[] z WarTurnState, epoki wlascicieli, PairMetaWeb z RUST_DIPLOMACY_KEY);
- gate_blocked_set z GateFacts przez gate_facts_for(roles, id, era, war_count). Wymaga countActiveWarsForOwnerExcludingBarbarians po stronie Rust (NIE podpiete);
- phase_owners(OwnerRoles{me, human_ids}, all_power_owner_ids(cities, starts), OwnerFacts) - OwnerFacts z isBarbarian, typCityCopyOwners, eliminatedOwners, liczby miast (NIE podpiete);
- contacts_for z diplomaticallyDiscoveredOwnersSet (NIE podpiete);
- power_map(owners, |id| objective_power_for_owner(raw_for(id), ...)) - raw_for wymaga tabeli pokrycia powyzej (NIE_PORTOWANE w wiekszosci skladnikow).
Zrodlo prawdy: bez zmian wzgledem r1 (klucze rust* z WarTurnState: RUST_DIPLOMACY_KEY, RUST_BRAKE_PHASE_KEY, RUST_AI_PEACE_KEY, RUST_WAR_WEARINESS_KEY; forced[]). Nie dodano kluczy.

BLOKADY:
1. objective_power_for_owner jako producent z PlayableState: NIE_PORTOWANE dla 9 z 12 skladnikow (tabela). Zrobiony port funkcji i adapter; wejscia od wolajacego.
2. Kandydaci z tabeli (empire_pobor_totals, rekrut_unit_equivalents, empire_culture_total) wymagaja osobnej weryfikacji semantyki przed podpieciem.
3. Producenci nie sa wolani w Rust (run_war_turn); zaleznosc jawna do W8 r3 (sekcja powyzej).
4. Wejscia wektorow isBarbarian, countActiveWarsForOwnerExcludingBarbarians, diplomaticallyDiscoveredOwnersSet, cities/aiStartHexes, a takze stan Map (forced/meta/epoki) sa podawane przez generator jako fakty, nie wycinane z pinu. Testuja funkcje decyzyjne, nie zrodla tych faktow.
5. Baza: dispatch r2 (99c094771) rozni sie od tresci zlecenia (f207ea6b1). Zastosowano dispatch r2 (zgodny z parity-v2, potwierdzone przodkiem 82c57a412). Raport nazwany 02b-operator-r2.md wg dispatchu r2 (zlecenie wspominalo 01-operator-r1.md, ale r1 juz istnieje).
6. Cargo.lock wygenerowany lokalnie (untracked), nie dodany do commita.

RUNDY: 2/5 (Operator r2); ostatni werdykt FC r1: FAIL (zarzuty 1-5 z dispatchu r2); decyzja wymagana: NIE.
NASTEPNY KROK: Evaluator r2 (czy zarzuty FC r1 1-5 zamkniete; tabela pokrycia, weryfikacja kandydatow z tabeli, regeneracja cmp), potem Final Control r2.
COMMIT: lokalny commit na gałęzi detached od 99c094771 (SHA ponizej po commicie). Bez push do rust-port/parity-v2, bez integracji, bez zmian gra/.
DEPLOY/PUSH: NIE WYKONANO
