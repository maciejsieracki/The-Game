STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L3-DEFS-Q1 (UNIT-REPLACE L-3 etap 3: produkcyjne zrodlo ReplaceUnitDef; runda 1/5, Operator)
GOAL: (1) port 1:1 categoryOf z pinu 07d2fbd72; (2) produkcyjna tabela ReplaceUnitDef z rust-port/engine/data/units.json; (3) podlaczenie tabeli jako zrodla defs w komendzie replace_unit (marker UNIT-REPLACE-L3-DEFS-SOURCE-OPEN usuniety, wstrzykniecie defs w testach zachowane); (4) wektory z pinu (node, 75 jednostek + przypadki skrajne); (5) lista rozbieznosci kategorii wynikajacych z danych.
ZMIANY/COMMIT: baza 415a7d67f (detach). Allowlista: rust-port/engine/src/domain/unit_replace_defs.rs (nowy), src/domain/mod.rs (rejestracja), src/domain/playable.rs (zrodlo defs: replace_unit bez defs = produkcja; replace_unit_with_defs = wstrzykniecie; wywolania testow w module przelaczone), tests/p6_unit_replace_l3_state.rs (tylko zmiana nazwy wywolan na replace_unit_with_defs, asercje bez zmian), tests/p6_unit_replace_defs.rs (nowy), tests/p6_unit_replace_defs_vectors/ (gen-category-vectors.mjs + 4 pliki JSON). Nie dotknieto: gra/**, rust-port/engine/data/**, Cargo.toml, Cargo.lock (nie commitowany), origin/main, WERSJE.md. SHA kodu i raportu: patrz `git log -1` na galezi roboczej (commit tego etapu).
TESTY:
- cargo fmt -- --check: zielone (po cargo fmt na nowych plikach).
- cargo clippy --all-targets -- -D warnings: zielone.
- cargo test --lib: 58 passed, 0 failed.
- cargo test --test p6_unit_replace_defs: 7 passed (categoryOf pin 75/75, przypadki skrajne 32/32, dane Rust 75/75, raport rozbieznosci kategorii pusty, tabela produkcyjna = wektory, e2e zamiana produkcyjna na PlayableGame, odrzucenie nieznanego typu bez mutacji).
- cargo test --test p6_unit_replace_l3: 8 passed.
- cargo test --test p6_unit_replace_l3_state: 11 passed (istniejace testy bez oslabien, tylko przelaczone na replace_unit_with_defs).
- cargo test --test p6_repin_unit_replace_pure: 7 passed.
- cargo test --test p6_repin_unit_replace_execute: 1 passed.
- cargo test --test p6_wire_war_pipeline: 7 passed.
- Wektory: gen-category-vectors.mjs uruchomiony na pinie (gra/src/units/setup.ts, gra/data/units.json z 07d2fbd72) i na rust-port/engine/data/units.json. Typ-stripping tekstu pinu przez node:module.stripTypeScriptTypes (logika bez zmian).
- Pelny `cargo test` (wszystkie testy integracyjne) NIE_ZMIERZONO w tym etapie (poza wskazanymi bramkami).
BLOKADY:
- (A) KOSZT PIENIEDZY, ZNANA ROZBIEZNOSC PARYTETU (nie rozstrzygana tu): web replaceUnitMoneyCost = unitProductionItem(...)?.koszt z civBonusy, kosztJednostekPace, poziomem trudnosci (main.ts:7913). Tabela produkcyjna bierze bazowy Pieniadz z derived/unit-gold-costs.json (te same wartosci co canonical_recruitment_costs), bez mnoznikow civ/tempo/trudnosci. Domkniecie: osobny temat (wymaga ProductionData/AvailabilityContext).
- (B) MAX HP: web newMaxHp = effectiveMaxHp(unitHealth, parametryBonus, veteranBonus); tabela ma bazowe Health (zgodnie z istniejacym kontraktem ReplaceUnitDef.max_hp). Bonusy weterana/parametrow nie sa w tabeli.
- (C) Funkcja normalizacji diakrytyk: uzyto civ_bonuses::strip_diacritics (NFD + U+0300-U+036F + lowercase, z tabeli civ-bonus-diacritics.json) i mapy ł->l; zakres tabeli nie zostal osobno zweryfikowany poza nazwami z units.json i wektorami edge (Łuczniczka, Ż/Ł/Ś).
- Rozbieznosci kategorii wynikajace z danych: BRAK. Pola wejsciowe categoryOf (Jednostka, Rola (linia), Super-jednostka, Typ) sa identyczne miedzy pinem a rust-port/engine/data/units.json dla wszystkich 75 jednostek; wynik categoryOf dla danych Rust = wynik dla pinu (plik: tests/p6_unit_replace_defs_vectors/category-discrepancies.json = []).
- Rozbieznosci DANYCH (poza kategoria, do decyzji gameplay wlasciciela, NIE rozstrzygane): 51 z 75 jednostek rozni sie w 71 polach; klucze roznicy: 'Zastąp specjalnie', fieldPower, Epoka, Tech, Atak, Obrona, Przebicie, 'Bonus vs Spearman %', meleeAttack, meleeDefence, piercing, Top3, Historia. Dane units.json NIE zostaly zmienione (zakaz rust-port/engine/data/**).
- Brak blokad technicznych.
RUNDY: 1/5 (Operator); wynik do Evaluatora.
NASTEPNY KROK: Evaluator (Sonnet) + Final Control; ocena decyzji (A) jako osobnego tematu do decyzji wlasciciela.
DEPLOY/PUSH: NIE WYKONANO (push i integracja zakazane dla Operatora; commit lokalny na galezi roboczej).
