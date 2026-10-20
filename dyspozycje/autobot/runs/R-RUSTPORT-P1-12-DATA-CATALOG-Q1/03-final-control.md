STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-12-DATA-CATALOG-Q1
GOAL: Katalog wszystkich plików `gra/data/*.json` (30 pozycji: 29 JSON + 1 PNG), pin main=edb8fb56.
RUNDY: 1/5 (4 realne zarzuty od Evaluatora — błędny schemat rekordu, zawyżona liczba rekordów,
mylący nagłówek kolumny dla plików bez rekordów, niepełne sekcje diplomacy.json — wszystkie naprawione
przez Obronę, ODDALONE przez Final Control po niezależnej weryfikacji)

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-12-DATA-CATALOG.md`.

Wszystkie 30 plików `gra/data/` pokryte (potwierdzone `ls` na rozpakowanym `edb8fb56`). Po poprawkach:
`terrain-improvements.json` poprawnie opisany jako 22 rekordy (nie 24 — wykluczono `_meta` i
`_miasto_zasieg_ref`), `diplomacy.json` opisuje wszystkie 11 sekcji top-level (w tym `params`, 132
klucze, wcześniej pominięte), 8 plików bez jednolitej struktury rekordów oznaczonych jawnie jako
"obiekt bez rekordów: N sekcji" zamiast mylącego "rekordy zweryfikowane".

Znalezisko: lokalne drzewo robocze (gałąź sesji) różni się od pinu `edb8fb56` w 5 plikach `gra/data`
(ai-params, city-names-pools, civ-matrix, civs, units) — katalog opisuje wyłącznie stan na pinie,
zgodnie z zasadą świeżego pinu.

BLOKADY: brak. Zero zapisu w `gra/**`.
NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
