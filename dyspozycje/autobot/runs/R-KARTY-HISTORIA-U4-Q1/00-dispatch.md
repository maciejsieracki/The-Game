TEMAT:  R-KARTY-HISTORIA-U4-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 13/17 projektu `R-KARTY-HISTORIA-Q1`. CZWARTY z sześciu batchy treści
dla JEDNOSTEK (U1+U2+U3 już zintegrowane, 39/75).

## GOAL
Dopisz pole `Historia` (Capitalized, konwencja `units.json`) do KAŻDEJ z
poniższych 13 jednostek w `gra/data/units.json`:

1. Łucznik akadyjski
2. Gaesatae
3. Soldurii
4. Rydwan celtycki
5. Wojownik germański
6. Berserker germański
7. Taran
8. Taran okuty
9. Katapulta
10. Wieża oblężnicza
11. Wojownik tyrreński
12. Wojownik szekelesz
13. Konnica lancowa asyryjska

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-U1-Q1`/`U2-Q1`/`U3-Q1`:
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- Gaesatae/Soldurii/Rydwan celtycki/Wojownik germański/Berserker germański/
  Konnica lancowa asyryjska mają już rozbudowane opisy historyczne w polu
  `Uwagi`/w komentarzach kodu modeli 3D (z wcześniejszego projektu
  `R-ZELAZO-MODELE-BRAKUJACE-Q1`/`R-ZELAZO-AUDYT-POZOSTALE-Q1`) — PRZECZYTAJ
  je dla faktografii, ale NAPISZ WŁASNY, nowy tekst w stylu Civilopedii do
  pola `Historia` (nie kopiuj 1:1 z `Uwagi` ani z kodu).
- Machiny oblężnicze (Taran/Taran okuty/Katapulta/Wieża oblężnicza) — cztery
  RÓŻNE typy uzbrojenia oblężniczego, każdy z odrębną historią użycia
  (staranowanie bram vs rzut pociskami vs szturm przez mur) — odrębne teksty,
  nie warianty jednego opisu.
- Wojownik tyrreński/Wojownik szekelesz — ludy związane ze zjawiskiem Ludów
  Morza / wczesnożelaznej Anatolii-Egei, opisz w tym kontekście, nie jako
  jednolite państwa.
- Sprawdź już zintegrowane `U1-Q1`/`U2-Q1`/`U3-Q1` w `origin/main` — spójność
  tonu.

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola żadnej jednostki (Atak/Obrona/
Koszt/Uwagi nietknięte). Waliduj `jq . gra/data/units.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/units.json` bez błędu składni.
2. Wszystkie 13 wskazanych jednostek ma niepuste pole `Historia`, 4-6 zdań,
   zero identyfikatorów repo, zero mechaniki gry, zero duplikatów (w tym
   między 4 machinami oblężniczymi).
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
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-U4-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz kopiowania tekstu między jednostkami tej samej rodziny
(4 machiny oblężnicze, 2 jednostki germańskie) i zakaz kopiowania 1:1
istniejącego pola `Uwagi`/komentarzy modeli 3D do pola `Historia`.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
