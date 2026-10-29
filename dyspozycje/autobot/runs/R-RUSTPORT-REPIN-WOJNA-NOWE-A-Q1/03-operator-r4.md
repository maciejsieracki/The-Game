STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-A-Q1
GOAL: Odpowiedz na zarzuty weryfikacji (verdict PASS-WITH-NOTES na e08aeda1/0da20311): zamknac zarzut 1 (zakres diakrytykow), zarzut 2 (mutacje na nowych galeziach), zarzut 3 (pelny cargo test).
ZMIANY/COMMIT: kod Rust bez zmian w tej rundzie (mutacje przywracane). Commit r4: wektor `ai-era-unit-promotion.json` (regeneracja z weba 91dc998a), generator `gen-repin-wojna-a-web-vectors.mjs` (+2 wpisy katalogu, +5 przypadkow), dossier sekcja 8, logi `*-r4*.log`, ten raport. Zarzut 1 zamkniety w 0a867ba6 (r3, zweryfikowany). Lacznie SHA: 0a867ba6 (Z1), SHA commitu r4 w odpowiedzi orkiestratora. Allowlista zachowana; zero zmian w gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md.
ODPOWIEDZI NA ZARZUTY:
  - Z1 (zakres diakrytykow): PRZYJETY. Poprawka w 0a867ba6: naglowek, komentarz strip_base i dossier sek. 4 zawezone do Latin-1 + ą ć ę ł ń ś ź ż č š ž; reszta NIE_ZMIERZONO. Zweryfikowane: tabela strip_base zgodna z deklaracja.
  - Z2 (mutacje): PRZYJETY. R1-R10 wykonane (10 nowych), wszystkie zabite po domknieciu wektorow; R4 i R6 przezyly na pierwotnych wektorach -> dodano wektory brzegowe (maxHp=0, ujemny surcharge, skarbiec -5), po czym zabite. R6 w zakresie skarbca >=0 rownowazna (dowod w dossier sek. 8).
  - Z3 (pelny cargo test): ZMIERZONE. Dysk 6.6 GB wolne. cargo test --no-fail-fast EXIT=0, 1277 passed / 0 failed (test-r4.log).
TESTY:
  - cargo fmt --all -- --check: EXIT=0 (fmt-r4.log)
  - cargo clippy --all-targets -- -D warnings: EXIT=0 (clippy-r4.log)
  - cargo test --no-fail-fast: EXIT=0, 1277 passed / 0 failed (test-r4.log)
  - Regeneracja z weba 91dc998a: formation-rules.json i army-leadership.json bajt-w-bajt identyczne; ai-era-unit-promotion.json przeregenerowany (618 przypadkow).
  - Mutacje (logi mut-r4-R1..R10 + mut-r4-R4-v0-survivor.log, mut-r4-R6 = wynik na v2): R1 ZABITA, R2 ZABITA, R3 ZABITA, R4 ZABITA (v2; v0 przezyla), R5 ZABITA, R6 ZABITA (v2; v0/v1 przezyla, rownowazna dla T>=0), R7 ZABITA, R8 ZABITA, R9 ZABITA, R10 ZABITA.
  - Mutacje z rund 1-2 (M1-M4): zabite, bez zmian.
  - git diff --check: czysty (przed commitem).
BLOKADY: brak. Cargo.lock lokalny, nieśledzony.
RUNDY: 4/5 (r4; r3 = poprawka Z1)
NASTEPNY KROK: Final Control (Sonnet 5.5) na commicie r4 i raporcie 03. Integracja wylacznie przez orkiestratora.
ZALOZENIA: jak w sekcji 4 dossier (diakrytyki zawezone do Latin-1 + PL + č š ž; siatka calkowita; NaN NIE_ZMIERZONO; indeksy zamiast obiektow; deps jako trait; null==undefined).
DEPLOY/PUSH: NIE WYKONANO
