TEMAT:  R-KARTY-HISTORIA-U5-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 14/17 projektu `R-KARTY-HISTORIA-Q1`. PIĄTY z sześciu batchy treści
dla JEDNOSTEK (U1+U2+U3+U4 już zintegrowane, 52/75).

## GOAL
Dopisz pole `Historia` (Capitalized, konwencja `units.json`) do KAŻDEJ z
poniższych 13 jednostek w `gra/data/units.json`:

1. Konnica łucznicza asyryjska
2. Łucznik asyryjski
3. Drużynnik
4. Jeździec z oszczepami
5. Strażnik bram Harappy
6. Piechota induska
7. Garnizon Harappy
8. Rydwan Kapadokijski
9. Piechota hetycka
10. Gwardia hetycka
11. Gwardia Ishtar
12. Wojownik babiloński
13. Piechota neobabilońska

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-U1-Q1`...`U4-Q1`:
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- Konnica łucznicza asyryjska/Drużynnik/Jeździec z oszczepami mają już
  rozbudowane opisy w polu `Uwagi`/komentarzach kodu modeli 3D (projekt
  `R-ZELAZO-MODELE-BRAKUJACE-Q1`/`R-ZELAZO-AUDYT-POZOSTALE-Q1`) — PRZECZYTAJ
  dla faktografii, ale NAPISZ WŁASNY tekst do pola `Historia`.
- Strażnik bram Harappy/Piechota induska/Garnizon Harappy — cywilizacja
  doliny Indusu (Harappa/Mohendżo-Daro), OSTROŻNIE z pewnością historyczną:
  źródła pisane tej cywilizacji pozostają nierozszyfrowane, więc opisuj
  uzbrojenie/organizację na podstawie archeologii (pieczęcie, fortyfikacje),
  nie fabrykuj politycznych/militarnych szczegółów bez podstaw.
- Rydwan Kapadokijski/Piechota hetycka/Gwardia hetycka — imperium Hetytów w
  Anatolii, kontekst bitwy pod Kadesz i rydwanów trzyosobowych, odrębny od
  Egiptu (już opisanego w U3).
- Gwardia Ishtar/Wojownik babiloński/Piechota neobabilońska — Babilonia w
  dwóch różnych okresach (starobabiloński vs neobabiloński, np. Nabuchodonozor
  II) — zaznacz różnicę okresu, nie traktuj jako jedno.
- Sprawdź już zintegrowane U1-U4 w `origin/main` — spójność tonu.

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola żadnej jednostki. Waliduj
`jq . gra/data/units.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/units.json` bez błędu składni.
2. Wszystkie 13 wskazanych jednostek ma niepuste pole `Historia`, 4-6 zdań,
   zero identyfikatorów repo, zero mechaniki gry, zero duplikatów (sprawdź
   względem WSZYSTKICH jednostek z polem Historia w pliku, nie tylko tych 13).
3. Żadna INNA jednostka i żadne INNE pole tych 13 nie zostały zmienione.
4. Realny, żywy dowód: karta DOWOLNEJ z tych 13 jednostek pokazuje sekcję
   „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych + unit-replace-test/
   combat-test bez regresu + `entity-card-historia-section-test.cjs` W
   PEŁNI zielony (31/31).

## ALLOWLISTA — nic poza tym
`gra/data/units.json` WYŁĄCZNIE. Zakazane bezwzględnie: wszelkie inne pliki
w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-U5-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz kopiowania tekstu między jednostkami tej samej
cywilizacji/rodziny (3 jednostki asyryjskie, 2 hetyckie, 2 babilońskie) i
zakaz kopiowania 1:1 istniejącego pola `Uwagi`/komentarzy modeli 3D.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
