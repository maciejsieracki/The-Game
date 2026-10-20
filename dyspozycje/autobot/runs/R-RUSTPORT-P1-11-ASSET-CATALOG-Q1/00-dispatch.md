STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-11-ASSET-CATALOG-Q1
GOAL: P1.11 z PLAN-PORT-RUST-TAURI-20261020.md §4 — katalog assetów: fonty, ikony, sprite'y, modele 3D,
dźwięki, na świeżo pinowanym `main` = `edb8fb56`.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Znaleźć wszystkie katalogi assetów w repo (np. `gra/public`, `gra/src/assets` lub podobne — ustal
faktyczną lokalizację, nie zakładaj) i zapisać w `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md`:
pełną listę plików per typ (fonty, ikony/sprite'y, modele 3D, dźwięki, inne), liczbę plików i łączny
rozmiar per kategoria, format plików (np. .png/.woff2/.mp3/.glb), czy assety są referencjonowane przez
ścieżkę czy zaimportowane jako moduły w kodzie.

ANTY-HALUCYNACYJNA REGUŁA
Liczby/rozmiary muszą pochodzić z realnie uruchomionej komendy w tej rundzie (`find`/`du`/`wc -l`), nie
z pamięci. Jeśli jakaś kategoria (np. modele 3D) nie istnieje w tym repo — zapisz to wprost jako
"BRAK", nie pomijaj cicho.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, pokrywa wszystkie znalezione katalogi assetów z policzoną liczbą/rozmiarem, jawnie
wskazuje kategorie nieobecne.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-11-ASSET-CATALOG-Q1/**`. Odczyt: cały `gra/**` read-only (main
edb8fb56). Zero zapisu w `gra/**`.

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), praca wyłącznie odczytowa.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
