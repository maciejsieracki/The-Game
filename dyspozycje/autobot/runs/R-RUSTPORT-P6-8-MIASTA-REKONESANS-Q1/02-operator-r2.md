STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8-MIASTA-REKONESANS-Q1
GOAL: Rekonesans P6.8 (18 pozycji miast) względem pinu 91dc998a, podział na 10 tematów 8A–8J. Dokument, bez zmian kodu. Runda 2 = odpowiedź na zarzuty FAIL z rundy 1.
ZMIANY/COMMIT: baza R1 `84e19cbc` (Operator R1, rodzic `4c005237`). Poprawka dokumentu: `6c4f2b1fab022b330d2e89dbb661f3bce665fd4e` (`dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md`, przepisany). Ten plik raportu: commit następny (`git log -1` na gałęzi). Allowlista: tylko dokument P6-8 i katalog runu. Zero zmian w `rust-port/**`, `gra/**`, `src-tauri/**`.

ODPOWIEDŹ NA ZARZUTY
1. Lista symboli: PRZYJMUJĘ. §11 dokumentu: 515 symboli top-level (304 funkcje, 99 const, 111 type, 1 class) z plik:linia @91dc998a, LOC, tematem i partią. Asercje generatora: suma LOC per plik = `wc -l`; 515/515 wierszy ma temat i partię.
2. Gotowe treści dispatchów: PRZYJMUJĘ. §9: 10 bloków (GOAL, ALLOWLISTA, SYMBOLE, KRYTERIA KOŃCA, ZALEŻNOŚCI, WEKTORY) + wspólne BAZA/BRAMKI/BUILD/ZAKAZY/PROCEDURA. Plan wektorów §5, komendy §8.
3. Sprzeczność limitu rozmiaru: PRZYJMUJĘ CZĘŚCIOWO. Zachowano 10 tematów (wymóg liczby). Każdy temat wykonywany w partiach ≤600 LOC na granicy symbolu: 22 partie (8A 2, 8B 2, 8C 2, 8D 2, 8E 2, 8F 3, 8G 2, 8H 2, 8I 3, 8J 2). Wyjątek: `pickAutoImprovements` (1 funkcja, 633 LOC) = ZAŁOŻENIE Z-9. Alternatywa (≥17 tematów po ≤600 LOC) opisana w §3 jako Opcja B, NIE przyjęta domyślnie.
4. Cytowania Rust: PRZYJMUJĘ. Ponowiony przegląd `rust-port/engine/{src,tests}` (§1). Poprawione: poz. 9 (`terrain.rs:138,249,391`, `territory.rs:13,183`, `start_position.rs:587`, `improvement_build.rs:812,815`, `city_growth.rs:534,1449`), poz. 15 (`state.rs:544–545`), poz. 16 (`state.rs:1661,1759`), poz. 18 (`building_costs.rs:910–930`, `derived.rs:4008`). Allowlista 8G rozszerzona o `terrain.rs`, `territory.rs`, `start_position.rs`, `improvement_build.rs`.
5. Statusy heurystyczne: PRZYJMUJĘ. Pomiar: 304 nazwy funkcji web szukane w `rust-port/engine/src` (`snake_case` i oryginał, granice słów): 33 trafienia (górna granica, ok. 4 fałszywe, np. `pick`, `round4`, `clampPct`). Wynik §1: PORTOWANE 0, CZĘŚC. 8, BRAK* 10. BRAK* oznacza brak nazw i cytowań, NIE funkcjonalny brak. Różnice względem GAP opisane w §1.
6. `wealth.ts` jako typ: PRZYJMUJĘ. `git diff -U0 edb8fb56 91dc998a -- gra/src/game/wealth.ts`: 1 hunk `@@ -57,0 +58,20`, dwie nowe funkcje behawioralne: `wealthParamsWithCapModifier` (mnoży `capNaEpoke` przez `1+mod`) i `wealthParamsWithMultiplierModifier` (mnoży `mnoznikNaPoziom`). Rust: 0 trafień nazw. Klasa BEHAWIORALNA, temat 8D (§1 poz. 16, §10).
7. Hunki `economy.ts` i `production.ts`: PRZYJMUJĘ. §10: każdy hunk → symbol → temat → partia. `production.ts` 44 (42 nie-komentarz, 2 komentarz), `economy.ts` 41 (25 / 16), `wealth.ts` 1. Klasy heurystyczne (Z-8). Zgodność z B2 (hunki 3, 7, 8–14) potwierdzona cytowaniami w `building_costs.rs` i `production_units.rs`. Nie czytano semantycznie każdego hunka (NIE_ZMIERZONO, §7).
8. Kolizje i generator wektorów:
   - Z-4, `recruitment.rs`: ODRZUCAM zarzut. ALLOWLISTA dispatchu B3 (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/00-dispatch.md`) zawiera `rust-port/engine/src/domain/{city_growth,recruitment}.rs`. Tylko GOAL wymienia `city_growth.rs`. Dowód cytowany w §4.
   - Zależność 8F od modułów NOWYCH z REPIN-D (`domain/economy_yield.rs`, `domain/work_tax.rs`): PRZYJMUJĘ, dodano (§2, §4, §9 8F). Dowód: dispatch D, ALLOWLISTA.
   - Generator wektorów: PRZYJMUJĘ rozstrzygnięcie. Generator B2 (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B2-Q1/gen-repin-b2-vectors.mjs` + `repin-b-loader-register.mjs`, obecne w `4c005237`), Node v22.22.0, `--experimental-transform-types`, bez builda. Uruchomiony na `git archive 91dc998a gra/src gra/data` odtworzył 4 pliki wektorów B2 bajt-w-bajt (`cmp`: SAME×4).
9. Drobne: PRZYJMUJĘ. SHA w tym raporcie. Granice `production.ts` jako przedziały półotwarte po początku symbolu: 8A `[1,682)`, 8B `[682,1253)`, 8C `[1253,1977)`, 8B `[1977,2542)`. `unitStockShortfallLabel` (start 682) ma jednego właściciela (8B). Etykiety T1–T10 zamienione na 8A–8J w całym dokumencie. Zakres 1977–2541 w 8B, spójnie w tabeli i §3.

TESTY:
- Bramki cargo: NIE DOTYCZĄ (dokument, zero zmian kodu).
- `git diff --check` (przed commitem dokumentu i przed raportem): czysty.
- `wc -l` 18 plików = 10150; symbole 515 (fn 304); trafienia nazw 33/304; hunki 44 + 41 + 1 = 86.
- Generator B2 na 91dc998a: 4/4 pliki identyczne z committed wektorami.

BLOKADY: brak.
RUNDY: 2/5 (ostatni werdykt: FAIL R1; ten raport to odpowiedź).
NASTĘPNY KROK: Evaluator (weryfikacja R2: lista symboli, dispatche, cytowania, hunki, SHA) → Final Control. Bez pytań ABC; założenia Z-1…Z-9 w §6 dokumentu.
DEPLOY/PUSH: NIE WYKONANO
