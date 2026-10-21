STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1
GOAL: Katalog mapowania 30 plików `gra/data/*.json` (pin edb8fb56) → struktury Rust (`parity-v2`
9e33fc77), z kluczami i statusem loadera, per klucz.

RUNDY: 2/5.
- R1: Operator → Evaluator **21 zarzutów** — kryterium „każdy klucz ma status z dowodem" nie było
  spełnione dla większości z 30 plików (wiele sekcji/kluczy pominiętych lub skwitowanych zbiorczym
  „BRAK" bez listy) → Final Control FAIL → NAPRAW.
- R2: Operator przepisał cały katalog na pełną, rekurencyjną listę 1527 unikalnych kluczy z dowodem
  per klucz (plik 1806 linii) → Evaluator 4 drobne zarzuty (literówki w liczbach kategorii,
  niespójna klasyfikacja 2 pól jako PRZEMIANOWANE zamiast SŁOWO-słaby, brakujący wiersz dla pliku
  binarnego) → Final Control 4×ODDAL, zweryfikowane niezależnie (`git grep`).

ZMIANY/COMMIT: nowy plik `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` (1806 linii).

WYNIK: 1527 unikalnych kluczy (rekurencyjnie) ze statusem: BRAK 1269, SERDE (prawdziwy match) 148,
LITERAL 32, PRZEMIANOWANE 1 (`forestExtra`), SŁOWO-słaby (zbieżność nazw, nie dowód) 49. **Loader:
NIE dla 29/29 plików JSON** — brak JAKIEGOKOLWIEK mechanizmu wczytywania `gra/data/*.json` do Rust w
`src/`/`tests/`/`benches/` na `parity-v2` (4 odwołania to tylko komentarze). **Znalezisko krytyczne
dla P3+: `units.json` vs `recruitment.rs` — 75/75 NAZW zgodnych, ale 75/75 WARTOŚCI rozbieżnych**
(np. Wojownik: koszt 10 web vs 5 Rust, stock 50 vs 13, utrzymanie 10 vs 3) — komentarz w kodzie Rust
„mirrored from units.json" jest nieprawdziwy, dane są rozsynchronizowane całkowicie.
`buildings.json` kontrastowo: 40/40 rekordów ZGODNYCH wartościowo.

BLOKADY: brak dla tego tematu. Poza zakresem (do przyszłego tematu, orkiestrator decyduje o
priorytecie): systemowa rozbieżność wartości `units.json`↔`recruitment.rs` wymaga osobnej, głębszej
analizy (czy to literalny błąd portu, czy świadomy inny balans) przed P3.5-P3.7.

NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
