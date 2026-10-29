STATUS: FAIL (runda 2/5; jedyny otwarty NAPRAW wymaga rozszerzenia allowlisty przez orkiestratora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-LOGIKA-CIV-Q1
GOAL: port logiki civ 91dc998a do Rust; 12 czerwonych -> zielone; bramka 1214 passed / 0 failed

## Pomiary wlasne FC (9b4e9f04)
- cargo fmt --all -- --check: EXIT=0
- cargo clippy --all-targets -- -D warnings: EXIT=0 (bez --locked, brak sledzonego Cargo.lock)
- cargo test --all-targets --no-fail-fast: EXIT=101, 1221 passed / 6 failed (test-fc-r2.log) = zgodne z Obrona
- git diff --check f20d4526..9b4e9f04: czysty
- 12 celow: wszystkie zielone (p6_1d x5, p6_1e x7). Zero p6_1*/inne czerwone poza 6 p6_4.
- Zmiany poza dyspozycje/: tylko tests/p6_1d_civ_bonuses.rs, p6_1e_civ_matrix.rs, p6_1e_tables.rs, p6_1e_civ_gaps.rs (nowy). Zero gra/**, src, Cargo.toml, WERSJE.md.

## Werdykty per zarzut
1. p6_1d:339 `>300` -> `assert_eq!(...,106)`: ODDAL. 106/1026 to dane wektora 91dc998a (wektor niezmieniony), asercje per rekord bez zmian, rownosc jest mocniejsza niz prog. Odstepstwo od "nie zmieniaj oczekiwan" jest nieszkodliwe (przestarzaly prog, precedens REPIN-DANE r2).
2. p6_1e_civ_matrix:1296 (galaz legacy): ODDAL. Web 91dc998a civAiProfileFor bez wiersza macierzy = undefined (civ-ai-data.ts:76-82); test pinuje None i zgodnosc z civ_ai_profil_mapy. Nie oslabia.
3. p6_1e_tables:113 / :178: ODDAL. Puste DECISION_REQUIRED/BLOCKED_COMBAT_MULTIPLIER pinowane jako puste (assert is_empty), wyjatki tekstowe jawna lista 2 kluczy plus nowa asercja zamykajaca wyjatki DECISION_REQUIRED. Pin zaostrzony, nie oslabiony.
4. derived.rs poza allowlista (Z1): ODDAL (wyjatek zatwierdzony, tylko schemat serde: pola z #[serde(default)] + parametr_agresja_archetyp). Dowod konieczności: derived-proof-r2.log - po przywroceniu 829a8c0f crate sie nie kompiluje (E0609). Brak innego miejsca na struktury.
5. Mutacje: ODDAL. 28 mutantow, 23 zabite, 5 rownowaznych z dowodem z kodu/danych (5 duplikat sprawdzenia; 12/13 walka_atak_lukownicy=0 w 15 wierszach, wykluczone_g1 tylko ten id; 16 wyjatki tylko dla egipt, ktory jest w pomin_civ; 24 floor(+-0)). Luki 2,6,7,20,21,25,26,27 zamkniete testami p6_1e_civ_gaps.rs (10 testow). Rownowaznosc 12/13 zalezy od biezacych danych - ryzyko zapisane, nie blokuje.
6. Blad liczby p6_4 w raporcie Operatora: ODDAL (skorygowane: core x2, embark x1, march x3).
7. p6_4 x6 czerwonych + niespojnosc allowlisty z bramka 0 failed: NAPRAW (do rundy 3). Dowod, ze to wektory a nie port: wejscia wektorow (core.json/embark.json/march.json) maja cel "wszystko" dla walka_ruch_piechota_teren_plytkie_morze, a web 91dc998a isKnownMatrixCombatEntry (civ-bonuses.ts:279-281, spec :252 'piechota') wymaga celu zgodnego ze spec; edb8fb56 nie sprawdzal. Rust (zgodny z 91dc998a) slusznie ignoruje wpis -> inne koszty (np. got 0.5 vs web 0.667; cost 2.8 vs 2.3077). Oczekiwane wartosci sa z edb8fb56. Wymaga regeneracji p6_4_vectors/{core,embark,march}.json z uruchomionego weba 91dc998a (generator z runu), z kontrola 0 rozbieznosci; alternatywnie korekta wejsc na cel "piechota" (ta sama regeneracja).
   Allowlista nie obejmuje tests/p6_4_*; to decyzja orkiestratora, nie czlowieka. ZALOZENIE FC: orkiestrator rozszerza allowlista o rust-port/engine/tests/p6_4_vectors/** i p6_4_*.rs (tylko wektory i ewentualne dopiski), bez zmian src/.

## Wniosek
Jeden NAPRAW (pkt 7) -> FAIL. Wszystko in-allowlist zaakceptowane (ODDAL). Zadnego DECISION_REQUIRED dla czlowieka.

## SHA do integracji i kolejnosc
- SHA koncowy rundy 2 (Obrona): 9b4e9f04 (+ commit FC z tym dokumentem i logiem, patrz raport). NIE integrowac jeszcze: bramka 0 failed niespelniona.
- Kolejnosc: repin-wip (origin/rust-port/repin-wip) <- r3 (p6_4 wektory) -> dopiero po zielonej calej galezi merge repin-wip do origin/rust-port/parity-v2 jednym ruchem (zgodnie z dispatchem). Obecne 9b4e9f04 (baza: f20d4526 <- 716b828a <- a7590add <- 829a8c0f) nie jest na zadnej galezi zdalnej; r3 powinna isc na nim.
DEPLOY/PUSH: NIE WYKONANO
