STATUS: PASS-WITH-NOTES (runda 1: część A POMIAR wykonana; B/C/D nie rozpoczęte)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1
GOAL: jedna wersja reguł ekonomii 1:1 z webem origin/main, użyta w turn_economy; usunięte martwe duplikaty po przepięciu.
BAZA: origin/rust-port/parity-v2 = 707b50c41bc916c31a75da402dc1d1a1c54ec9a3 (detached, sparse: rust-port, dyspozycje). Pin weba: origin/main 9733ea8b0.

ZMIANY/COMMIT: pliki (allowlista OK): dyspozycje/rust-port/p6/P6-REPIN-EKONOMII.md (nowy, tabela symboli, hunki, wektory, plan partii); dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1/01-operator-r1.md. Zero zmian w kodzie Rust i gra/. SHA commitu: patrz sekcja DEPLOY-PUSH / wiersz ponizej.

WYNIKI POMIARU (A):
- Są TRZY rodziny reguł skalowania produkcji, nie dwie:
  1. improvements.rs: resource_production_amount_for_era + territory_resource_yield_for_improvement (f64, zbior legacy = tartak, kamieniolom). Wołane przez turn_economy_territory.rs:226 (PRODUKCJA).
  2. improvements.rs: *_all_producers (zbior = terytorium.ulepszenia, zgodny z webem). NIE wołane w src/, tylko p6_repin_autoimpr_terrain.rs.
  3. domain/resource_production.rs (u32/u8): tylko testy i wewnetrzne wolania; citizen_consumption_era_multiplier ZYWE (turn_economy_resources, city_growth).
- BLAD PARYTETU: turn_economy produkuje po starym zbiorze; web od 2026-11-03 skaluje wszystkie ulepszenia terytorium x1,5/epoke. Rust zaniza produkcje epok 2-3 dla glinianki, kopalni, warzelni soli, stadniny, kopalni zlota i cyny.
- Epoka w economy_yield.rs: BRAK (zero pojec epoki). Mnoznik zuzycia m(e) jest zaportowany w resource_production.rs (p6_repin_ekon_f_m_era.rs).

TESTY: NIE_ZMIERZONO. Nie uruchomiono cargo fmt/clippy/test (brak baseline'u, brak zmian kodu do bramkowania). Dysk przy starcie: 4,4 GB wolnego (prog 1,5 GB nieprzekroczony). Liczba #[ignore]: NIE_ZMIERZONO.

BLOKADY:
- Allowlista nie obejmuje improvements.rs (duplikaty R1/R2/A1/A2) ani resource_production.rs (rodzina 3). Usuniecie definicji wymaga rozszerzenia allowlisty (decyzja orkiestratora). Przepiecie turn_economy_territory.rs (w allowliscie) mozna zrobic bez tego.
- Przepiecie na A2 zmienia zachowanie produkcji (epoki 2-3). Wymaga regeneracji wektorow z weba (p6_23_vectors, p6_adv_q2a_vectors, potoki p6_adv_*, p6_empirefood_e2e) w tej samej partii. Node 22 i uruchomienie weba NIE wykonane w tej rundzie.
- NIE_ZMIERZONO: hunk po hunku R2 vs web territoryResourceYieldForImprovement (null vs None, fallback 10 vs domyslna_ilosc).

RUNDY: 1/5
NASTEPNY KROK: runda 2 (ten sam TEMAT, baza jak wyzej, dopisek w 00-dispatch.md): (B1) przepiac turn_economy_territory.rs:226 na territory_resource_yield_for_improvement_all_producers; (B2) regeneracja wektorow z origin/main (git archive gra/src gra/data do katalogu poza repo, Node 22), nowe testy p6_repin_ekonomii_*; baseline cargo test zmierzyc przed zmianami. Decyzja orkiestratora przed (D): rozszerzyc allowliste o improvements.rs i resource_production.rs.
DEPLOY/PUSH: NIE WYKONANO
