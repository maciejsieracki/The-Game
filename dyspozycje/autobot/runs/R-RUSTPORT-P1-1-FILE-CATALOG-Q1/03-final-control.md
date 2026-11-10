STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-1-FILE-CATALOG-Q1
GOAL: P1.1 katalog plików `gra/src` (game, ui, map, units, battle, render) + entry pointy, pin main=edb8fb56.
RUNDY: 1/5 (3 zarzuty nieblokujące od Evaluatora, wszystkie PRZYJĘTE przez Obronę, ODDALONE przez Final Control po naprawie)

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md`.

Zweryfikowane niezależnie przez Final Control na pinie `edb8fb56` (`git ls-tree`/`git show`):
game 183/183 .ts/70637 linii; ui 438/117 .ts/73963; map 25/25/23682; units 2/2/1226; battle 15/14 .ts/26867;
render 88/88/59319. Razem 751 plików, 429 .ts, 255694 linii. Stary audyt skorygowany (game 179→183,
ui 105→117 plików .ts). Entry pointy zgodne z pinem.

Zarzuty 1-3 (metoda liczenia linii dla PNG/SVG binarnych, fallback "eksporty:" w opisach) — wszystkie
nieblokujące, naprawione przez Obronę, zweryfikowane i ODDALONE przez Final Control.

Dodatkowe znalezisko Obrony: lokalny checkout roboczy (gałąź sesji) różni się od pinu `edb8fb56` w 138
plikach `gra/` — odnotowane w pliku katalogu jako ostrzeżenie dla przyszłych tematów (czytać z pinu,
nie z checkoutu roboczego).

BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora (commit dokumentacji). Materiał wejściowy gotowy dla P1.17
(klasyfikacja REUSE/ADAPT/REPLACE) i P1.13/P1.14 (weryfikacja opisów mechanicznych).
DEPLOY/PUSH: NIE WYKONANO
