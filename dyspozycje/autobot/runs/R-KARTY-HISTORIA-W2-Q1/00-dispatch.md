TEMAT:  R-KARTY-HISTORIA-W2-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 17/17, OSTATNIA część OSTATNIEGO tematu projektu `R-KARTY-HISTORIA-Q1`.
DRUGI i OSTATNI z dwóch batchy dla cudów. Po tym temacie WSZYSTKIE 5
kategorii encji (budynki, technologie, ulepszenia terenu, jednostki, cuda)
mają w pełni ukończony rys historyczny — cały projekt (17/17) zamknięty.

## GOAL
Dopisz pole `historia` (lowercase, konwencja spójna z `buildings.json`/
`terrain-improvements.json`) do KAŻDEGO z poniższych 9 obiektów w tablicy
`cuda` w `gra/data/wonders.json` (dopasuj po polu `id`):

1. `ziggurat` (Ziggurat / Piramida Słońca)
2. `mundo_perdido` (Świątynia Mundo Perdido)
3. `terakotowa_armia` (Terakotowa armia)
4. `koloseum` (Koloseum)
5. `dur_sharrukin` (Dur-Sharrukin)
6. `brama_narodow` (Brama wszystkich narodów)
7. `palac_weiyang` (Pałac Weiyang)
8. `yerkapi` (Yerkapı — Brama w ziemi)
9. `posag_peruna` (Posąg Peruna)

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-W1-Q1` i pozostałych 15
tematach serii:
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- Sprawdź pole `cywilizacje` każdego cudu w danych i pisz o WŁAŚCIWEJ
  cywilizacji/regionie. Dwa wyjątki wymagające szczególnej uwagi:
  - `mundo_perdido`: w danych przypisany do cywilizacji Inków
    (`cywilizacje: ["inkowie"]`), ALE realny „Mundo Perdido" (Zaginiony
    Świat) to kompleks w Tikal — to stanowisko MAJÓW, nie Inków (Ameryka
    Środkowa, nie Andy). NIE fabrykuj nieistniejącego inkaskiego miejsca o
    tej nazwie. Opisz REALNY kompleks Mundo Perdido w Tikal (Majowie),
    zaznaczając naturalnie ten rozjazd nazwa/cywilizacja w grze jeśli to
    pomaga jasności tekstu, albo (alternatywnie, jeśli wolisz czystszą
    prozę bez metakomentarza) opisz go jako część szerszej mezoamerykańskiej
    tradycji budowlanej bez podkreślania niezgodności — decyzja stylistyczna
    należy do Ciebie, ale FAKTY muszą być prawdziwe (Tikal, Majowie, nie
    Inkowie/Andy).
  - `brama_narodow`: w danych dostępna dla WSZYSTKICH cywilizacji (cud
    „wyścigowy", jak `hamonga` z W1) — realny historyczny odpowiednik to
    Brama Wszystkich Narodów w Persepolis (Persja Achemenidzka, Kserkses I),
    NIEZALEŻNIE od tego, że „Persja" nie jest osobną cywilizacją na liście
    gry. Opisz REALNĄ Bramę w Persepolis.
- `ziggurat`/`dur_sharrukin` — dwa RÓŻNE miejsca mezopotamskie (ziggurat to
  ogólny typ budowli sumeryjskiej/babilońskiej, Dur-Sharrukin to konkretne
  neoasyryjskie miasto Sargona II) — odrębne teksty, nie warianty.
- `terakotowa_armia`/`palac_weiyang` — dwie RÓŻNE chińskie pozycje z różnych
  okresów (Terakotowa armia — dynastia Qin, Qin Shi Huang; Pałac Weiyang —
  dynastia Han) — zaznacz różnicę okresu/dynastii.
- `yerkapi` — brama/przejście w murach Hattusy (Imperium Hetyckie, Anatolia).
- `posag_peruna` — słowiański bóg Perun, ostrożnie z pewnością źródłową
  (źródła o słowiańskim pogaństwie są fragmentaryczne/pośrednie — kroniki
  chrześcijańskie, etnografia porównawcza), zaznacz to naturalnie.
- Zero duplikatów treści między tymi 9 cudami I względem już zintegrowanych
  10 z W1 (sprawdź `origin/main`, `gra/data/wonders.json`, pole `historia`).

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola żadnego cudu, NIE dotykaj
`parkowane_epoka4plus` ani `panstwa`. Waliduj `jq . gra/data/wonders.json`
przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/wonders.json` bez błędu składni.
2. Wszystkie 9 wskazanych cudów (po `id`) ma niepuste pole `historia`,
   4-6 zdań, zero identyfikatorów repo, zero mechaniki gry, zero duplikatów
   (sprawdź względem WSZYSTKICH 19 cudów, nie tylko tych 9).
3. Żaden INNY cud i żadne INNE pole tych 9 nie zostało zmienione. Tablice
   `parkowane_epoka4plus` i obiekt `panstwa` bez zmian.
4. Realny, żywy dowód (headless Chromium): karta DOWOLNEGO z tych 9 cudów
   pokazuje sekcję „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu +
   `entity-card-wonder-test.cjs` W PEŁNI zielony (134/134 — test już
   naprawiony na trwałe przez `P-KARTY-HISTORIA-TEST-CUDA-FIXTURE-REALNE-DANE-Q1`,
   nie ma dziś żadnych fixture'ów zakładających „wszystkie puste").
6. Po tym batchu WSZYSTKIE 19 aktywnych cudów mają niepuste pole `historia`
   (weryfikacja: `jq '[.cuda[] | select((.historia // "") == "")] | length'`
   na `gra/data/wonders.json` = 0) — zamyka CAŁY projekt `R-KARTY-HISTORIA-Q1`.

## ALLOWLISTA — nic poza tym
`gra/data/wonders.json` WYŁĄCZNIE (tylko klucz `cuda`, tylko dopisanie pola
`historia` do 9 wskazanych obiektów). Zakazane bezwzględnie: wszelkie inne
pliki w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-W2-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz fabrykowania nieistniejących miejsc dla `mundo_perdido`
(musi być realny Tikal/Majowie, NIE inkaskie/andyjskie stanowisko) i
`brama_narodow` (musi być realna Persepolis, nie zmyślone miejsce dopasowane
do listy cywilizacji gry).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only. Po integracji: CAŁY projekt
`R-KARTY-HISTORIA-Q1` (17/17 tematów) ZAMKNIĘTY — pełny deploy ROBOCZA.
