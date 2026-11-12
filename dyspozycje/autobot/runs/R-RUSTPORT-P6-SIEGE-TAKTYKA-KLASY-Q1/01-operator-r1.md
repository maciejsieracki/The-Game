STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-KLASY-Q1
GOAL: Port 1:1 klasyfikatorow jednostek oblezniczych uzywanych jako wejscia K0b/K1/K1b/K3/K4 (isSiegeUnit, isSiegeTower, _isRam, canShoot) jako czyste funkcje nad jawna struktura jednostki, z wektorami wykonanymi z linii pinu 07d2fbd72 (straznik SHA-256, >= 300 przypadkow, wszystkie galezie i typy z gra/data/units.json pinu).
BAZA: aef5993e1 (FC K3, detached). Pin web tylko do odczytu (git show 07d2fbd72). Brak zmian w gra/, Cargo.toml, WERSJE.md, origin/main, rust-port/parity-v2.

ZMIANY/COMMIT:
- rust-port/engine/src/domain/siege_tactics_classify.rs (nowy): is_siege_unit, is_siege_tower, is_ram, can_shoot, norm_name; struktury wejscia ClassifyUnit (typ/jednostka/nazwa: Option<String>, None = null/undefined) i ShootUnit (ranged_base, ammo_left).
- rust-port/engine/src/domain/mod.rs: wylacznie rejestracja `pub mod siege_tactics_classify;`.
- rust-port/engine/tests/p6_siege_tactics_classify_gen.mts (nowy): generator; WYKONUJE linie pinu battleScene.ts (canShoot 1457-1459, isSiegeUnit 1552-1559, isSiegeTower 1561-1564, normName 1648-1650, _isRam 7402-7405) przez node --experimental-strip-types; straznik FRAGMENT_SHA256 = 10c0ec94d60eb96440d396b114e81c81936374684f1f11648c7775fce9453c41.
- rust-port/engine/tests/p6_siege_tactics_classify_vectors/vectors.json (nowy): 922 przypadki (856 nazw x 3 wyniki, 20 canShoot, 46 normName), meta.unitNames = 75 jednostek z pinu.
- rust-port/engine/tests/p6_siege_tactics_classify.rs (nowy): 4 testy zgodnosci (wektory, galezie = meta.categories, 75 jednostek, canShoot, normName).
- dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md: wiersze 27 i 28 -> PORTED; wiersz 30 (a) i wiersze 32.1/32.2 zaktualizowane (predykat dostepny, galezie nie portowane).
- dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-KLASY-Q1/01-operator-r1.md (ten raport).
- Cargo.lock: wygenerowany lokalnie przez cargo, NIE commitowany (untracked).

TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- node --experimental-strip-types p6_siege_tactics_classify_gen.mts: OK, cases=922, straznik SHA-256 zgodny.
- cargo fmt --check: OK (exit 0).
- cargo clippy --all-targets -- -D warnings: OK (exit 0).
- cargo test --lib: 48 passed, 0 failed.
- cargo test --test p6_siege_tactics_approach: 5 passed.
- cargo test --test p6_siege_tactics_approach_k1: 8 passed.
- cargo test --test p6_siege_tactics_walk: 7 passed.
- cargo test --test p6_siege_tactics_end: 8 passed.
- cargo test --test p6_siege_tactics_tower: 12 passed.
- cargo test --test p6_siege_tactics_classify (nowy): 4 passed.
Kryteria binarne: (1) SPELNIONE - cztery klasyfikatory Ported z wektorami pinu i pokryciem galezi (isSiegeUnit:typ 136, :name 228, :false 492; isSiegeTower true 104 / false 752; isRam true 138 / false 718; canShoot true 5 / false 15); (2) SPELNIONE - testy K0b-K4 bez zmian (zielone bez edycji plikow testow); (3) SPELNIONE - bramki zielone.

BLOKADY / NOTATKI:
- Rust nie ma modelu jednostki bitwy z polem `stats` (grep BattleUnit / RuntimeBattleUnit w rust-port/engine/src: brak; UnitRecord nie ma pola Typ). Wejscie zrobione jako jawna struktura ClassifyUnit, zgodnie z dispatchem.
- brake_power_army.rs:31 `is_siege_unit(rola_linia)` to OSOBNY predykat (Rola (linia) === 'Oblezna') dla armyFieldPower; nie jest tym samym co web isSiegeUnit. Nie zmieniany.
- NIE_ZMIERZONO: pelne Unicode NFD. norm_name obejmuje dekompozycje dla liter Latin-1 i Latin Extended-A (tabela strip_diacritic) oraz ł/Ł; znaki spoza tabeli nie dekomponuja sie. Wektory nie zawieraja innych znakow z dekompozycja (potwierdzone testem). Rozbieznosci JS/Rust przy trim (U+FEFF) i finalnym sigma: nie wystepuja w wektorach, nie testowane.
- NIE_ZMIERZONO: pokrycie linii pinu w sensie V8 coverage; galezie = kategorie wynikow pinu.
- Miejsca w K0b-K4, gdzie flagi/predykaty sa dzis WEJSCIAMI (do zastapienia wywolaniem nowych funkcji w przyszlym temacie, bez refaktoru tutaj):
  * rust-port/engine/src/domain/siege_tactics_approach.rs:46 `can_shoot` (struktura obroncy), :48 `range_base`, :81 `is_siege_unit`, :84 `can_shoot` (ApproachUnit/ruchomy) - wywolujacy liczy z ClassifyUnit/ShootUnit.
  * rust-port/engine/src/domain/siege_tactics_tower.rs:69 `can_shoot`, :73 `is_siege_unit`, :75 `is_ram`, :77 `is_siege_tower` (TowerUnit). Komentarz naglowkowy tego pliku (linie 10-13) mowi, ze port klasyfikatorow to "osobny temat" - po tym temacie jest nieaktualny; nie zmieniany (poza allowlista).
  * rust-port/engine/tests/p6_siege_tactics_walk.rs:67-69 i p6_siege_tactics_approach.rs:116,171-173: flagi z wektorow K1/K1b (dane testowe, bez zmian).
- Wiersze planu 32.1 i 32.2 (galezie doktryny) nadal BRAK - tylko predykat jest dostepny.

RUNDY: 1/5 (Operator).
NASTEPNY KROK: Evaluator r1 (weryfikacja wektorow: ponowne uruchomienie gen z PRINT_HASH=1, testy jw.). Po Final Control - integracja orkiestratora (poza tym tematem).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny; brak push do rust-port/parity-v2, brak integracji).
