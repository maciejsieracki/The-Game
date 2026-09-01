TEMAT:  R-KARTY-HISTORIA-B2-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 6/17 projektu `R-KARTY-HISTORIA-Q1`. DRUGI z trzech batchy treści dla
BUDYNKÓW (B1 już zintegrowany do `main`).

## GOAL
Dopisz pole `historia` (lowercase, konwencja `buildings.json`) do KAŻDEGO z
poniższych 14 budynków w `gra/data/buildings.json`:

1. swiatynia
2. biblioteka
3. studnia
4. akwedukt
5. mennica
6. palisada
7. mury
8. koszary
9. magazyn
10. stela
11. palac
12. palac_ii
13. palac_iii
14. kuznia_zelaza

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-B1-Q1` (przeczytaj ten dispatch
dla pełnego przykładu kalibracyjnego „Tarasy uprawne" i zasad):
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia (nie mechanika gry).
- ZAKAZANE: suche fakty bez narracji, mechanika TEJ gry, identyfikatory
  repo, kopiowanie 1:1 z Wikipedii.
- `palac`/`palac_ii`/`palac_iii` to KOLEJNE poziomy tej samej budowli w grze
  — mimo to każdy wpis MUSI mieć WŁASNY, odrębny tekst (np. różne aspekty
  historyczne pałaców/rezydencji władców na przestrzeni epok, nie kopia tego
  samego akapitu trzy razy).
- Sprawdź już zintegrowany `R-KARTY-HISTORIA-B1-Q1` (`git log`/diff w
  `origin/main`) dla przykładów FAKTYCZNIE zaakceptowanej treści (nie tylko
  przykład z Tarasów) — spójność tonu między batchami budynków jest ważna.

Format wpisu w JSON: pojedynczy string, bez HTML, bez akapitów, UTF-8 z
polskimi znakami wprost. NIE zmieniaj żadnego innego pola żadnego budynku.
Waliduj `jq . gra/data/buildings.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/buildings.json` bez błędu składni.
2. Wszystkie 14 wskazanych budynków ma niepuste pole `historia`, 4-6 zdań,
   zero identyfikatorów/nazwisk repo, zero odniesień do mechaniki gry, zero
   duplikatów (w tym między trzema poziomami pałacu).
3. Żaden INNY budynek i żadne INNE pole tych 14 nie zostały zmienione —
   `git diff` wyłącznie dodane linie `"historia": "..."`.
4. Realny, żywy dowód (headless Chromium): karta DOWOLNEGO z tych 14
   budynków pokazuje sekcję „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.
   `entity-card-historia-section-test.cjs`: jeśli temat naprawczy
   `P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1` jest już zintegrowany do
   `main` w chwili Twojej pracy, test MUSI być zielony bez wyjątków; jeśli
   NIE jest jeszcze zintegrowany, dopuszczalne są TE SAME 2 znane,
   nieblokujące FAIL co w B1 (fixture-drift `stolarnia`) — nie dotykaj tego
   pliku w żadnym wypadku (poza allowlistą).

## ALLOWLISTA — nic poza tym
`gra/data/buildings.json` WYŁĄCZNIE. Zakazane bezwzględnie: wszelkie inne
pliki w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-B2-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz kopiowania tekstu między pałac/pałac_ii/pałac_iii.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
