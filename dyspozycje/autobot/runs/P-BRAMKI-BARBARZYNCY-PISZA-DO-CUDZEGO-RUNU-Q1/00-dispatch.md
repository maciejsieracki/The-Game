# P-BRAMKI-BARBARZYNCY-PISZA-DO-CUDZEGO-RUNU-Q1 — dispatch

TEMAT: `P-BRAMKI-BARBARZYNCY-PISZA-DO-CUDZEGO-RUNU-Q1`
RUNDA: 1/5
DOMAIN: INFRA (mechaniczna naprawa harnessu — zero zmiany asercji/logiki pomiarowej)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Final Control tematu `P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1` zauważył podczas przebiegu całej
rodziny bramek barbarzyńców, że `gra/tools/barb-karencja-czas-trwania-real-render-test.cjs`
oraz dwie bramki `barbarian-cooperation-grace*` zapisują dowody PNG do ŚLEDZONEGO katalogu
runu INNEGO tematu: `dyspozycje/autobot/runs/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1/dowody/`.
Samo uruchomienie tych bramek brudzi drzewo poza własnym tematem i łamie guard §2b „czyste
drzewo" każdego równoległego tematu, który akurat trzyma inny worktree i sprawdza
`git status --short`. Final Control poprzedniego tematu przywrócił plik kopią blobu z `HEAD`
(nie `git checkout`), drzewo czyste — **to NIE jest defekt tematu barbarzyńców**, bramki nie
były w nim zmieniane.

**Analogia do już zamkniętego dziś tematu** `P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1` (commit
`57c327d9`): ta sama klasa problemu (bramka pisze do stałej, współdzielonej/śledzonej ścieżki
zamiast do własnego, unikalnego katalogu tymczasowego), inny konkretny przejaw (katalog runu
cudzego tematu zamiast `os.tmpdir()`). Wzorzec naprawy z tamtego tematu (unikalny sufiks per
proces, np. `${process.pid}` lub `fs.mkdtempSync`) jest bezpośrednio przenośny.

## GOAL

1. Znajdź dokładnie 3 bramki: `gra/tools/barb-karencja-czas-trwania-real-render-test.cjs` oraz
   dwie bramki `barbarian-cooperation-grace*` (ustal dokładne nazwy plików grepem —
   `grep -rl "R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1" gra/tools/`).
2. W każdej z nich zmień ścieżkę zapisu dowodów PNG z twardo zakodowanego
   `dyspozycje/autobot/runs/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1/dowody/` na WŁASNY,
   tymczasowy katalog — wzorzec już istniejący w repo:
   `gra/tools/n12-zrzuty-zywy-chromium.cjs` (użyj `os.tmpdir()` z unikalnym sufiksem per
   proces, np. `${process.pid}` albo `fs.mkdtempSync`), albo wzorzec z poprawionych dziś bramek
   tematu `P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1` (przeczytaj `git show 57c327d9` dla
   referencji).
3. Zero zmian logiki pomiarowej/asercji — WYŁĄCZNIE ścieżka zapisu dowodów. Liczba asercji nie
   może spaść.
4. Jeśli te bramki są nadal użyteczne jako dowód dla właściciela (zrzuty PNG), rozważ czy
   powinny zapisywać KOPIĘ też do WŁASNEGO katalogu `dowody/` (jeśli taki istnieje dla tego
   tematu) — ale PRIORYTETEM jest zaprzestanie pisania do cudzego, śledzonego katalogu runu.

## BINARNE KRYTERIUM SUKCESU

- Żadna z trzech bramek nie zapisuje niczego do
  `dyspozycje/autobot/runs/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1/**` — potwierdzone
  uruchomieniem bramek i sprawdzeniem `git status --short` w CAŁYM repo (nie tylko w
  allowliście tego tematu) — musi być czyste poza plikami tego tematu.
- Wszystkie trzy bramki nadal PASS z tą samą liczbą asercji co dziś (sprawdź liczby przed
  zmianą i po — zero spadku).
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/tools/barb-karencja-czas-trwania-real-render-test.cjs`
- dwie bramki `barbarian-cooperation-grace*` (dokładne nazwy do ustalenia grepem)
- `dyspozycje/autobot/runs/P-BRAMKI-BARBARZYNCY-PISZA-DO-CUDZEGO-RUNU-Q1/**`

Zakazane bezwzględnie: `gra/src/**`, `gra/data/**`, pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`,
oraz KATEGORYCZNIE `dyspozycje/autobot/runs/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1/**` (cudzy
temat — zero zapisu, w tym podczas testowania). Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-barb-cudzy-run`, gałąź
`autobot/P-BRAMKI-BARBARZYNCY-PISZA-DO-CUDZEGO-RUNU-Q1`, baza jawnie `origin/main` (commit
`b737a950` w chwili założenia, może być nowszy przy starcie pracy — potwierdź `git log -1`
PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian logiki mechaniki/pomiarowej — wyłącznie ścieżka zapisu dowodów.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Absolutny zakaz jakiegokolwiek zapisu (nawet testowego/tymczasowego) do
  `dyspozycje/autobot/runs/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1/**` w trakcie tej pracy.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
