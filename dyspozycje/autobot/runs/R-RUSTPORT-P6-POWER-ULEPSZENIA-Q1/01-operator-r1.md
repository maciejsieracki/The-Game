STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-ULEPSZENIA-Q1 (producent skladnika „ulepszenia" computeObjectivePower; runda 1/5, Operator)
GOAL: (1) opisac na pinie 07d2fbd72 formule skladnika „ulepszenia" z liniami; (2) jesli dane z Rust pozwalaja - port 1:1 jako producent Ported z wektorami z pinu; (3) jesli nie - jawny BRAK z dowodem.
BAZA: 46c42deab (= origin/rust-port/parity-v2 po INTEG-B12), worktree detached; NIE pushowano, NIE integrowano, gra/ i origin/main nietkniete.

## 1. Formula z pinu (07d2fbd72)

Skladnik `ulepszenia` (klucz breakdown `ulepszenia`, power-objective.ts:249):
  points = countImprovementsForOwner(owner) * coeff.ulepszenieTerenu
  coeff = 5 (gra/data/power-params.json:64-66, `ulepszenie_terenu.pkt`; fallback DEFAULT_COEFF power-objective.ts:133).
  Wywolanie: main.ts:2771 (buildObjectivePowerForOwner) oraz main.ts:2826 (wariant Effective, ten sam licznik).

Licznik `countImprovementsForOwner(ownerId)`, main.ts:2643-2653:
  nodes = statsTerritoryNodesForOwner(ownerId)            (main.ts:5657)
        = foundingNodesForOwner(owner, cityNodesForOwner(owner), fortNodes)   (fort-territory.ts:199-208)
          cityNodesForOwner (main.ts:5661) = miasta wlasciciela jako {q, r, pop, level: 1}
          forty/posterunki: ownerId == owner && !contestedUseless (fort-territory.ts:204-205)
  nodes.length === 0 ? 0 : countImprovementsForNodes(nodes)
countImprovementsForNodes, main.ts:2654-2668:
  suma po UNII dyskow promieni r_n = cityTerritoryRadius(node) (map/territory.ts:89-93) po ISTNIEJACYCH heksach mapy,
  bez duplikatow (seen); kazdy heks wnosi improvementKeysForHex(hex).length (main.ts:2666).
  Promien: miasto = cityRangeForPopulation(pop) (okolica.ts:46-50: pop<=0 -> 0, inaczej clamp(floor(pop), 5, 15)
  wg miasto-params.json zasieg_okolicy_baza=5 / zasieg_okolicy_max=15); fort = 5; posterunek = 3
  (map/territory.ts:75-77).
improvementKeysForHex, terrain-improvements.ts:358-379: zbior roznych kluczy warstw `ulepszenia` (normalizeImprovementKey,
  terrain-improvements.ts:117-123, aliasy LEGACY_KEY_ALIASES :32); gdy brak warstw - pojedyncze `ulepszenie`; null/'brak'/'' -> 0.
Wagi: jeden wspolczynnik (5) na liczbe ulepszen; brak wag per typ ulepszenia.

## 2. Rust - co zrobiono

- NOWY src/domain/brake_power_improvements.rs:
  improvement_count_for_hex (improvements::improvement_keys_for_hex), improvement_count_for_build_hex (BuildHex),
  count_improvements_for_nodes (unia dyskow + seen), ulepszenia_for_owner (miasta + forty -> founding_nodes_for_owner -> licznik).
  Surowy licznik (jak terytorium); mnozenie x5 po stronie brake_power (nie podpinane - linia W8 INTEG-B13).
- COMPONENT_SOURCES (brake_power_producers.rs) i REST_COMPONENT_SOURCES (brake_power_rest.rs): `ulepszenia` -> RustProducer(...).
- Testy zgodnosci tabel zaktualizowane (wylacznie zmiana statusu):
  p6_power_producers.rs: no_producer = ["bitwy","zdobycze"]; lista RustProducer + "ulepszenia" (po "tech").
  p6_power_rest.rs: rest_no_producer_keys = ["bitwy","zdobycze"]; petla RustProducer + "ulepszenia".
  p6_power_sources.rs: no_producer = ["bitwy","zdobycze"]; lista RustProducer + "ulepszenia"; check_key "ulepszenia" => check_ulepszenia (nowe wektory).
  p6_power_nozeros.rs: bez zmian (przechodzi).
- Nowe testy: tests/p6_power_improvements.rs (6 testow) + tests/p6_power_improvements_gen.mjs (generator; wykonuje wyciete funkcje weba w node 22) + tests/p6_power_improvements_vectors/vectors.json.
  Straznik: pin `07d2fbd72f758705f8e1d59cc4968027ffbafe75`, extracted_sha256 `3cb3f155986d7c9d141ff171640977328218c5f3a44c325210fd7501fc510b93` (stala w tescie), 247 przypadkow (167 na poziomie heksa, w tym 7 brzegowych; 80 na poziomie wlasciciela, 65 z wynikiem > 0). Wejscia: LCG, ziarno 0x0bad5eed; obejmuja puste/null/'brak', aliasy legacy, prototypy JS (constructor, toString), duplikaty, pop niecalkowite (3.7), forty nieuzyteczne.
- Nie zmieniano brake_power.rs, turn_war_*.rs, Cargo.toml, Cargo.lock (plik wygenerowany przez cargo, NIE commitowany), WERSJE.md, gra/.

## 3. Ocena: `placed_improvements_for_owner` NIE jest portem tej sumy

turn_economy_inputs_native.rs:82 zwraca heksy z `w.placed`, ktorych wlascicielem wg `territory_owner_at` (jeden wlasciciel na heks)
jest owner. Web liczy UNIE dyskow wlasnych wezlow (bez rozstrzygania konkurencji miedzy imperiami). Dla heksow spornych wyniki
sie roznia; dodatkowo web czyta pola `hex.ulepszenia/ulepszenie`, a nie `w.placed`. Dlatego nie uzyto tej funkcji.
Wolajacy W8 (INTEG-B13) musi podac `hex_improvements` z BuildMap (improvement_count_for_build_hex), nie z placed.

## 4. Bramki

- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 49 passed, 0 failed
- cargo test --test p6_power_improvements --test p6_power_rest --test p6_power_sources --test p6_power_producers --test p6_power_nozeros --test p6_power_nan --test p6_power_army: EXIT 0
  (pierwszy przebieg: p6_power_producers 1 FAIL - lista coverage bez "ulepszenia"; poprawione w tej samej rundzie)
- Srodowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (usuwany po bramkach).
- df przed startem: 12 GB wolne (/), wymog >= 8 GB spelniony.

## 5. BLOKADY / NIE_ZMIERZONO

- NIE_ZMIERZONO: pelny cargo test (poza powyzszym zestawem) i wiring W8 - poza allowlista tej rundy (linia W8 w INTEG-B13).
- NIE_ZMIERZONO: zgodnosc wartosci w grze (HUD/ranking) - brak uruchomienia w przegladarce; to czysta funkcja.
- Brak blokad formalnych. Wymagane od orkiestratora w INTEG-B13: podpiecie ulepszenia_for_owner do power_raw_for_owner
  oraz zrodla hex_improvements z BuildMap (sekcja 3).

## 6. RUNDY / NASTEPNY KROK / DEPLOY-PUSH

RUNDY: 1/5 (Operator).
NASTEPNY KROK: Evaluator (Sonnet) na gałęzi wip/R-RUSTPORT-P6-POWER-ULEPSZENIA-Q1; potem Final Control; integracja orkiestratora (kolejnosc W8 wg INTEG-B13).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej, bez push).
