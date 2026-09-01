TEMAT:  R-KARTY-HISTORIA-I1-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 4/17 projektu `R-KARTY-HISTORIA-Q1` — bezpośredni skutek oryginalnego
zgłoszenia właściciela o karcie „Tarasy uprawne". Infrastruktura już
zintegrowana (`R-KARTY-HISTORIA-INFRA-Q1`). TEN temat to PIERWSZY z dwóch
batchy treści dla ULEPSZEŃ TERENU.

## GOAL
Dopisz pole `historia` (dokładnie ta nazwa, lowercase — konwencja pliku
`terrain-improvements.json`, zgodna z istniejącymi `uwagi`/
`cywilizacje_uwaga`) do KAŻDEGO z poniższych 11 ulepszeń w
`gra/data/terrain-improvements.json`:

1. Farma
2. Irygacja
3. Trzoda
4. Owce
5. Lama
6. Stadnina
7. Glinianka
8. Kamieniołom
9. Obóz łowiecki
10. Wyrąb
11. Tartak

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Dla KAŻDEGO z 11 ulepszeń powyżej napisz ~4-6 zdań prozy w polu `historia`:
- Treść: czym była ta praktyka/technika gospodarcza w REALNEJ historii, gdzie
  i kiedy była stosowana, jaką pełniła funkcję, ciekawostka wciągająca
  gracza w świat. Styl jak Civilopedia z serii Civilization.
- ZAKAZANE: suche fakty encyklopedyczne bez narracji, odniesienia do
  mechaniki TEJ gry (bonus surowca, wymagania terenowe — to już jest na
  karcie w innych wierszach), identyfikatory tematów/decyzji/osób z tego
  repozytorium, kopiowanie zdań 1:1 z Wikipedii.
- Dla ulepszeń bardzo ogólnych/powszechnych (np. „Farma", „Trzoda") napisz o
  ogólnym zjawisku udomowienia roślin/zwierząt w neolicie w RÓŻNYCH
  regionach świata (Żyzny Półksiężyc, Chiny, Mezoameryka, Andy — dopasuj do
  kontekstu gry, jeśli to widoczne z sąsiednich pól np. `Lama`=Andy),
  zamiast zmyślać jedno fałszywe miejsce/datę.

Przykład zaakceptowany przez właściciela (KALIBRACJA TONU I DŁUGOŚCI —
napisany DOKŁADNIE dla tej kategorii, „Tarasy uprawne", inne ulepszenie z
TEGO SAMEGO pliku, batch I2; NIE kopiuj treści, tylko styl/rejestr/
objętość — to jest wzorzec jakości do dorównania, nie do powtórzenia):
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
żadnego ulepszenia (`uwagi`, `cywilizacje_uwaga`, `tech_uwaga`, `warunek`,
itd. — te pola, WŁĄCZNIE z ich wyciekiem deweloperskim, są POZA zakresem
tego tematu, do przepisania w PRZYSZŁYM, osobnym kroku tego samego projektu)
— WYŁĄCZNIE dopisz nowe pole `historia` do tych 11 wpisów. Waliduj
`jq . gra/data/terrain-improvements.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/terrain-improvements.json` nie zwraca błędu składni.
2. Wszystkie 11 wskazanych ulepszeń ma niepuste pole `historia`, każde
   4-6 zdań, zero identyfikatorów/nazwisk z repozytorium, zero odniesień do
   mechaniki gry.
3. Żadne INNE ulepszenie (spoza tych 11) i żadne INNE pole tych 11 nie
   zostały zmienione — dowód: `git diff` pokazuje WYŁĄCZNIE dodane linie
   `"historia": "..."`.
4. Realny, żywy dowód (headless Chromium, build produkcyjny): karta
   DOWOLNEGO z tych 11 ulepszeń (np. Farma) pokazuje nową sekcję „Rys
   historyczny" z wpisaną treścią. Ulepszenie SPOZA tej listy (np. Tarasy
   uprawne — batch I2, jeszcze nie zrobiony) NIE pokazuje sekcji (poprawne).
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   `entity-card-historia-section-test.cjs`/`map-improvement-qualify-test.cjs`/
   `hodowla-las-test.cjs` bez regresu.

## ALLOWLISTA — nic poza tym
`gra/data/terrain-improvements.json` (WYŁĄCZNIE dodanie pola `historia` do
11 wskazanych wpisów). Zakazane bezwzględnie: wszelkie inne pliki w
`gra/data/**`, `gra/src/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-I1-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione na podstawie samego zapisu w JSON —
wymagany realny zrzut z żywej przeglądarki. Zakaz kopiowania tego samego
tekstu do kilku różnych ulepszeń. Zakaz „przy okazji" czyszczenia
`uwagi`/`warunek` tych 11 wpisów — to jest ŚWIADOMIE osobny, przyszły krok
(wymaga przepisania per-encja, poza zakresem tego tematu).

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
