STATUS: GOTOWE DO EVALUATORA (Operator, runda 2/5). Wynik Operatora, nie werdykt bramki.
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1
GOAL: Katalog faktów mapowania `gra/data/*.json` (pin edb8fb56) → struktury Rust (parity-v2 9e33fc77), z dowodem per klucz.
ZMIANY-COMMIT: Nadpisany nowy plik allowlisty `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` (1806 linii). `git diff --check` czysty. Brak commitu. Zero zmian w `gra/**`, zero kodu Rust. Brak osobnego pliku runu (zgodnie z zasadą bez plików-raportów).
TESTY (dowody mechaniczne, nie deklaracje):
- Kryterium 1 (struktura): 29 plików JSON, każdy z wierszem; struktury Rust wskazane z ścieżką i linią.
- Kryterium 2 (klucze): 1527 unikalnych kluczy rekurencyjnie. Rozkład: BRAK 1269, SERDE 148, LITERAL 32, PRZEMIANOWANE 3, SLOWO 47, META 28. Każdy klucz w appendixie z dowodem plik:linia. SLOWO/LITERAL dla słów ogólnych są oznaczone jako słabe.
- Kryterium 3 (loader): NIE dla 29/29. Brak odczytu plików w `src/`, `tests/`, `benches/` (6 trafień `gra/data` to komentarze). Jedyny element częściowy: `trade.rs:1868` `RawTradeParameters` deserializuje już sparsowany obiekt `econ-params` (`handel_szlaki`, `ekonomia_miasta`), bez testu na prawdziwym pliku.
- Wartości porównane (nie tylko klucze):
  - `buildings.json` vs `building_costs.rs`: 40/40 rekordów zgodnych. Brak w Rust: `warsztat_oblezniczy`, `akademia_wojskowa`.
  - `units.json` vs `recruitment.rs`: 75/75 nazw zgodnych, 75/75 wartości rozbieżnych. Wojownik: web koszt 5 i ilość 13, Rust 10 i 50. Rust odpowiada starszej historii `units.json` (commity od `2b53a793` wstecz), nie pinowi edb8fb56.
  - `resources.json`: 9/15 ID zgodnych z `ResourceKey`. Brak: zywnosc, cegla, ceramika, braz, zelazo, stal.
  - `terrain-improvements.json`: 22/22 ID zgodnych z `ImprovementKey`.
  - `city-names-pools.json`: 15/15 ID obecnych w `CivilizationKind`.
  - `terrain-movement`: `Wybrzeze` brak w Rust.
- Nie porównano wartości pozostałych plików (ai-params, diplomacy, econ-params, combat-params itd.). Zostawiono to P2.10 / P3.5–P3.7 i jest to wprost zapisane w §6.
- Klucze `_…` (`_opis`, `_meta`, `_maciej_kroki`) sklasyfikowane jako META (dokumentacja schematu, poza domeną). Rozstrzygnięcie w §5, nie wymaga decyzji projektowej.
BLOKADY: brak techniczne. Ograniczenie merytoryczne: wartości poza §3 nieporównane.
RUNDY: 2/5
NASTEPNY KROK: Evaluator — zweryfikować status SERDE/LITERAL na losowej próbce i wartości w §3. Final Control — ocenić, czy rozbieżność `units.json` (stary mirror) wymaga osobnego tematu.
DEPLOY/PUSH: NIE WYKONANO