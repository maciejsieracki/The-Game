TEMAT:  R-KARTY-HISTORIA-U1-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 5/17 projektu `R-KARTY-HISTORIA-Q1`. Infrastruktura już zintegrowana
(`R-KARTY-HISTORIA-INFRA-Q1`). TEN temat to PIERWSZY z sześciu batchy treści
dla JEDNOSTEK.

## GOAL
Dopisz pole `Historia` (dokładnie ta nazwa, Capitalized — konwencja pliku
`units.json`, zgodna z istniejącymi `Jednostka`/`Surowiec`) do KAŻDEJ z
poniższych 13 jednostek w `gra/data/units.json` (dopasuj po polu
`Jednostka`):

1. Wojownik
2. Procarz
3. Oszczepnik
4. Łucznik
5. Zwiadowca
6. Włócznik
7. Wojownik z mieczem i tarczą
8. Rydwan (woły)
9. Konnica
10. Galera
11. Falanga
12. Hieros Lochos (Święty Zastęp)
13. Hastati

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Dla KAŻDEJ z 13 jednostek powyżej napisz ~4-6 zdań prozy w polu `Historia`:
- Treść: czym była ta jednostka/formacja wojskowa w REALNEJ historii, jaka
  cywilizacja/okres ją używał, jakim uzbrojeniem/taktyką się wyróżniała,
  ciekawostka wciągająca gracza w świat. Styl jak Civilopedia z serii
  Civilization.
- ZAKAZANE: suche fakty encyklopedyczne bez narracji, odniesienia do
  mechaniki TEJ gry (Atak/Obrona/koszt/utrzymanie — to już jest na karcie w
  innych wierszach), identyfikatory tematów/decyzji/osób z tego
  repozytorium, kopiowanie zdań 1:1 z Wikipedii.
- Dla jednostek bardzo ogólnych/uniwersalnych (np. „Wojownik", „Zwiadowca",
  „Procarz") napisz o OGÓLNYM zjawisku wczesnej piechoty/rozpoznania w
  epoce kamienia w różnych regionach świata, zamiast zmyślać jedną
  fałszywą, konkretną formację. Dla jednostek z JASNYM historycznym
  pierwowzorem (np. „Falanga", „Hastati", „Hieros Lochos") opisz KONKRETNIE
  tę formację — grecką falangę hoplicką, rzymskich hastati z wczesnej
  legii manipularnej, Święty Zastęp Teb odpowiednio.

Przykład zaakceptowany przez właściciela (KALIBRACJA TONU I DŁUGOŚCI —
napisany dla „Tarasów uprawnych", ulepszenia terenu, nie jednostki; NIE
kopiuj treści, tylko styl/rejestr/objętość):
„Tarasy uprawne to system stopniowanych, murowanych poletek wykuwanych w
zboczach gór, praktykowany od tysięcy lat w Andach, Azji Południowo-
Wschodniej i na Bliskim Wschodzie. Najbardziej znane przykłady zostawili
Inkowie w Peru (m.in. Moray i doliny wokół Machu Picchu, XV wiek), którzy w
ten sposób zdobywali żyzną ziemię uprawną na stromym, górzystym terenie i
jednocześnie zapobiegali erozji gleby. Każdy poziom tarasu miał własny
mikroklimat, co pozwalało uprawiać różne rośliny na różnych wysokościach
tego samego zbocza. Budowa wymagała ogromnego nakładu pracy zbiorowej —
kamiennych murów oporowych, systemów drenażu i nawadniania — ale w zamian
dawała stabilne plony tam, gdzie płaska ziemia była rzadkością."

Format wpisu w JSON: pojedynczy string, bez znaczników HTML, bez podziału na
akapity, UTF-8 z polskimi znakami wprost. NIE zmieniaj żadnego innego pola
żadnej jednostki (Atak, Obrona, Koszt, Uwagi, Surowiec, itd. — pole `Uwagi`
tych jednostek, nawet jeśli zawiera wyciek deweloperski, jest POZA zakresem
tego tematu) — WYŁĄCZNIE dopisz nowe pole `Historia` do tych 13 wpisów.
Waliduj `jq . gra/data/units.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/units.json` nie zwraca błędu składni.
2. Wszystkie 13 wskazanych jednostek ma niepuste pole `Historia`, każde
   4-6 zdań, zero identyfikatorów/nazwisk z repozytorium, zero odniesień do
   mechaniki gry.
3. Żadna INNA jednostka (spoza tych 13) i żadne INNE pole tych 13 nie
   zostały zmienione — dowód: `git diff` pokazuje WYŁĄCZNIE dodane linie
   `"Historia": "..."`.
4. Realny, żywy dowód (headless Chromium, build produkcyjny): karta DOWOLNEJ
   z tych 13 jednostek (np. Falanga) pokazuje nową sekcję „Rys historyczny"
   z wpisaną treścią. Jednostka SPOZA tej listy NIE pokazuje sekcji
   (poprawne, nie regres).
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   `entity-card-historia-section-test.cjs`/`unit-replace-test.cjs`/
   `combat-test.cjs` bez regresu (statystyki bojowe MUSZĄ pozostać
   identyczne — dopisujesz tylko jedno pole tekstowe).

## ALLOWLISTA — nic poza tym
`gra/data/units.json` (WYŁĄCZNIE dodanie pola `Historia` do 13 wskazanych
wpisów). Zakazane bezwzględnie: wszelkie inne pliki w `gra/data/**`,
`gra/src/**`, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-U1-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione na podstawie samego zapisu w JSON —
wymagany realny zrzut z żywej przeglądarki. Zakaz kopiowania tego samego
tekstu do kilku różnych jednostek, NAWET jeśli są historycznie pokrewne
(np. Wojownik vs Wojownik z mieczem i tarczą — różny etap uzbrojenia,
różny tekst). Zakaz zmiany jakiejkolwiek wartości bojowej/kosztowej.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla żywego testu w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
