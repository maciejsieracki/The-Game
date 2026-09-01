TEMAT:  R-KARTY-HISTORIA-T1-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 3/17 projektu `R-KARTY-HISTORIA-Q1`. Infrastruktura już zintegrowana
(`R-KARTY-HISTORIA-INFRA-Q1`) — karty encji mają teraz sekcję „Rys
historyczny", renderowaną automatycznie gdy pole źródłowe w danych jest
niepuste. TEN temat to PIERWSZY z trzech batchy treści dla TECHNOLOGII.

## GOAL
Dopisz pole `Historia` (dokładnie ta nazwa, Capitalized — konwencja pliku
`tech.json`, zgodna z istniejącymi `Uwagi`/`Technologia`) do KAŻDEJ z
poniższych 11 technologii w `gra/data/tech.json` (tablica `technologie`,
dopasuj po polu `Technologia`):

1. Obróbka drewna
2. Garncarstwo
3. Murarstwo
4. Rolnictwo
5. Łowiectwo
6. Łucznictwo
7. Oswojenie zwierząt
8. Mistycyzm
9. Wymiana
10. Gospodarka wodna
11. Koło

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Dla KAŻDEJ z 11 technologii powyżej napisz ~4-6 zdań prozy w polu
`Historia`:
- Treść: czym był ten wynalazek/odkrycie w REALNEJ historii ludzkości, kiedy
  i gdzie (w przybliżeniu) pojawił się po raz pierwszy, jak zmienił życie
  ludzi/gospodarkę/wojskowość, ciekawostka wciągająca gracza w świat. Styl
  jak Civilopedia z serii Civilization — przystępny, ale rzeczowy.
- ZAKAZANE: suche fakty encyklopedyczne bez narracji, odniesienia do
  mechaniki TEJ gry (co odblokowuje, koszt badań — to już jest na karcie w
  innych wierszach, NIE powtarzaj), identyfikatory tematów/decyzji/osób z
  tego repozytorium, kopiowanie zdań 1:1 z Wikipedii (parafrazuj własnymi
  słowami).
- Technologie tak fundamentalne i rozproszone geograficznie jak
  „Obróbka drewna"/„Łowiectwo"/„Oswojenie zwierząt" nie mają jednego miejsca
  /daty powstania — napisz o tym wprost (niezależne wynalezienie w wielu
  miejscach świata w epoce kamienia/neolitu), zamiast zmyślać jedną
  fałszywą datę/miejsce.

Przykład zaakceptowany przez właściciela (KALIBRACJA TONU I DŁUGOŚCI —
napisany dla „Tarasów uprawnych", ulepszenia terenu, nie technologii; NIE
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
żadnej technologii (Technologia, Koszt, Uwagi, wymagania, itd.) — WYŁĄCZNIE
dopisz nowe pole `Historia` do tych 11 wpisów. Waliduj `jq . gra/data/tech.json`
przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/tech.json` nie zwraca błędu składni.
2. Wszystkie 11 wskazanych technologii ma niepuste pole `Historia`, każde
   4-6 zdań, zero identyfikatorów/nazwisk z repozytorium, zero odniesień do
   mechaniki gry.
3. Żadna INNA technologia (spoza tych 11) i żadne INNE pole tych 11 nie
   zostały zmienione — dowód: `git diff` pokazuje WYŁĄCZNIE dodane linie
   `"Historia": "..."`.
4. Realny, żywy dowód (headless Chromium, build produkcyjny): karta DOWOLNEJ
   z tych 11 technologii (np. Rolnictwo) pokazuje nową sekcję „Rys
   historyczny" z wpisaną treścią, na końcu karty. Technologia SPOZA tej
   listy NIE pokazuje sekcji (poprawne, nie regres).
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   `entity-card-historia-section-test.cjs`/`tech-tree-test.cjs`/
   `research-test.cjs` bez regresu (liczba technologii/struktura drzewa
   badań MUSI pozostać identyczna — dopisujesz tylko jedno pole tekstowe).

## ALLOWLISTA — nic poza tym
`gra/data/tech.json` (WYŁĄCZNIE dodanie pola `Historia` do 11 wskazanych
wpisów w tablicy `technologie`). Zakazane bezwzględnie: wszelkie inne pliki
w `gra/data/**`, `gra/src/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-T1-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione na podstawie samego zapisu w JSON —
wymagany realny zrzut z żywej przeglądarki. Zakaz kopiowania tego samego
tekstu (parafrazy jednego szablonu) do kilku różnych technologii. Zakaz
przypadkowej zmiany struktury drzewa badań (kolejność, `wymagania`,
`Poziom`) — dopisujesz WYŁĄCZNIE nowe pole tekstowe.

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
