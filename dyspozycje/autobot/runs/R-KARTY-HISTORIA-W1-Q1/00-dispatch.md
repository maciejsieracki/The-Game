TEMAT:  R-KARTY-HISTORIA-W1-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 17/17, OSTATNIA część projektu `R-KARTY-HISTORIA-Q1`. Mechanizm karty
cudów (`R-KARTY-HISTORIA-INFRA-CUDA-Q1`) już zintegrowany — teraz treść.
PIERWSZY z dwóch batchy dla cudów (19 aktywnych łącznie).

## GOAL
Dopisz pole `historia` (lowercase, konwencja spójna z `buildings.json`/
`terrain-improvements.json`) do KAŻDEGO z poniższych 10 obiektów w tablicy
`cuda` w `gra/data/wonders.json` (dopasuj po polu `id`):

1. `piramidy` (Piramidy)
2. `wielka_stela` (Wielka stela)
3. `wiszace_ogrody` (Wiszące ogrody)
4. `wyrocznia` (Wyrocznia)
5. `roquepertuse` (Roquepertuse)
6. `stupa_sanchi` (Stupa w Sanchi)
7. `petra` (Petra)
8. `hamonga` (Kamień Ha'amonga)
9. `kolos` (Kolos Rodyjski)
10. `osada_aschaffenburg` (Osada Aschaffenburg, hala dębowa)

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w poprzednich 16 tematach serii (budynki/technologie/
ulepszenia/jednostki):
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia — co to jest/było,
  gdzie, kiedy, jakie miało znaczenie kulturowe/historyczne.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- Niektóre cudy mają istniejące pole `uwagi` (krótka notatka datująca/
  materiałowa, np. „IV w. p.n.e.; potężne dębowe belki...") — PRZECZYTAJ dla
  faktografii, ale NAPISZ WŁASNY, nowy tekst prozą do pola `historia` (nie
  kopiuj 1:1 z `uwagi`).
- Kilka pozycji wymaga szczególnej ostrożności faktograficznej:
  - `roquepertuse` — celtyckie (galijskie) sanktuarium z Prowansji (portyk
    czaszkowy, posągi), NIE mylić z rzymskim/greckim kontekstem.
  - `hamonga` — Ha'amonga 'a Maui w Tonga, polinezyjska budowla trylitowa —
    OSTROŻNIE z pewnością: brak pisanych źródeł, opisz na podstawie tradycji
    ustnej i archeologii, zaznacz status legendy/hipotezy tam gdzie zasadne.
  - `stupa_sanchi` — buddyjska stupa w Indiach (dynastia Maurya/Aśoka), NIE
    mylić z innymi stupami w regionie.
  - `osada_aschaffenburg` — jeśli to fikcyjna/uproszczona nazwa gry bez
    jasnego jednego historycznego odpowiednika (sprawdź kontekst pola
    `cywilizacje`/`epokaWejscia` w danych), opisz najbliższy realny kontekst
    osadnictwa/budownictwa drewnianego danej kultury/okresu, zaznaczając to
    naturalnie — NIE fabrykuj konkretnego nieistniejącego miejsca jako
    faktu historycznego.
  - `wielka_stela` — w danych przypisana WYŁĄCZNIE do cywilizacji Zulu
    (`cywilizacje: ["zulusi"]`) — Zulu historycznie NIE są znani z wielkich
    kamiennych stel (to bardziej afrykańska tradycja Aksum/Etiopii). Jeśli po
    sprawdzeniu literatury nie znajdziesz jednoznacznego, konkretnego,
    realnego zuluskiego monumentu-steli, NIE fabrykuj jednego — opisz
    najbliższy realny kontekst kultury materialnej/upamiętniania Zulu
    (kopce/miejsca pamięci, tradycja ustna, ewentualnie faktyczne kamienne
    struktury jeśli istnieją), zaznaczając naturalnie że monumentalne stele
    kamienne to zjawisko rzadsze w tradycji Zulu niż np. w północno-
    wschodniej Afryce.
- Sprawdź pole `cywilizacje` każdego cudu w danych i pisz o WŁAŚCIWEJ
  cywilizacji/regionie, nie ogólnikowo.
- Zero duplikatów treści między tymi 10 cudami.

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola żadnego cudu, NIE dotykaj
`parkowane_epoka4plus` ani `panstwa`. Waliduj `jq . gra/data/wonders.json`
przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/wonders.json` bez błędu składni.
2. Wszystkie 10 wskazanych cudów (po `id`) ma niepuste pole `historia`,
   4-6 zdań, zero identyfikatorów repo, zero mechaniki gry, zero duplikatów.
3. Żaden INNY cud i żadne INNE pole tych 10 nie zostało zmienione. Tablice
   `parkowane_epoka4plus` i obiekt `panstwa` bez zmian.
4. Realny, żywy dowód (headless Chromium, `openEntityCard('wonder', id,
   {mode:'dialog'})` lub klik ikonki info w panelu budowy): karta DOWOLNEGO
   z tych 10 cudów pokazuje sekcję „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu +
   `entity-card-wonder-test.cjs` W PEŁNI zielony (134/134).

## ALLOWLISTA — nic poza tym
`gra/data/wonders.json` WYŁĄCZNIE (tylko klucz `cuda`, tylko dopisanie pola
`historia` do 10 wskazanych obiektów). Zakazane bezwzględnie: wszelkie inne
pliki w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-W1-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz kopiowania tekstu między cudami tej samej cywilizacji/
regionu. Zakaz fabrykowania konkretnych faktów historycznych dla pozycji o
niepewnym/legendarnym statusie (`hamonga`, ewentualnie `osada_aschaffenburg`)
— jawnie zaznacz niepewność tam, gdzie faktycznie istnieje w źródłach.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only, następnie dispatchuje W2 (ostatnie
9 cudów, zamyka CAŁY projekt `R-KARTY-HISTORIA-Q1`, 17/17 tematów).
