TEMAT:  R-KARTY-HISTORIA-B1-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 2/17 projektu `R-KARTY-HISTORIA-Q1` (patrz REJESTR-PROSB-I-ZADAN.md,
sekcja „R-KARTY-HISTORIA-Q1: audyt treści i rys historyczny wszystkich
kart"). Infrastruktura już zintegrowana (`R-KARTY-HISTORIA-INFRA-Q1`) —
karty encji mają teraz sekcję „Rys historyczny", renderowaną automatycznie
przez wspólny system `entityCards`, gdy pole źródłowe w danych jest
niepuste. TEN temat to PIERWSZY z trzech batchy treści dla BUDYNKÓW.

## GOAL
Dopisz pole `historia` (dokładnie ta nazwa, lowercase — konwencja pliku
`buildings.json`, zgodna z istniejącymi `uwagi`/`wymagania`) do KAŻDEGO z
poniższych 14 budynków w `gra/data/buildings.json`:

1. stolarnia
2. kamieniarski
3. kuznia
4. odlewnia_brazu
5. odlewnia_zelaza
6. wielka_odlewnia
7. targowisko
8. port
9. port_wielki
10. spichlerz
11. spichlerz_ii
12. garncarnia
13. cegielnia
14. kamienne_kregi

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Dla KAŻDEGO z 14 budynków powyżej napisz ~4-6 zdań prozy w polu `historia`:
- Treść: co to jest w REALNEJ historii (nie w tej grze), kiedy i gdzie
  powstało/było używane, jaką pełniło funkcję społeczną/gospodarczą,
  ciekawostka wciągająca gracza w świat. Styl jak Civilopedia z serii
  Civilization — przystępny, ale rzeczowy, nie infantylny.
- ZAKAZANE: suche fakty encyklopedyczne bez narracji, odniesienia do
  mechaniki TEJ gry (koszt, bonus, wymagania — to już jest na karcie w
  innych wierszach, NIE powtarzaj), identyfikatory tematów/decyzji/osób z
  tego repozytorium, kopiowanie zdań 1:1 z Wikipedii (parafrazuj własnymi
  słowami, możesz siÄ™ tam wesprzeć jako źródłem faktów).
- Jeśli budynek nie ma jednoznacznego jednego historycznego pierwowzoru
  (np. abstrakcyjny twór growy), opisz najbliższy realny odpowiednik/
  kontekst cywilizacyjny (np. „kamienne kręgi" → megality typu Stonehenge/
  Göbekli Tepe), zaznaczając to naturalnie w tekście, bez udawania że to
  jeden konkretny, znany obiekt jeśli nim nie jest.

Przykład zaakceptowany przez właściciela (KALIBRACJA TONU I DŁUGOŚCI —
napisany dla INNEJ encji, ulepszenia terenu „Tarasy uprawne"; NIE kopiuj
treści, tylko styl/rejestr/objętość):
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
akapity (jeden zwarty blok tekstu), UTF-8 z polskimi znakami wprost (nie
`\uXXXX`). NIE zmieniaj żadnego innego pola żadnego budynku (nazwa, koszt,
wymagania, uwagi, techUnlock, itd.) — WYŁĄCZNIE dopisz nowe pole `historia`
do tych 14 wpisów. Zachowaj poprawność składniową JSON (waliduj `jq .
gra/data/buildings.json` przed commitem).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/buildings.json` nie zwraca błędu składni (JSON poprawny).
2. Wszystkie 14 wskazanych budynków ma niepuste pole `historia`, każde
   4-6 zdań, zero identyfikatorów/nazwisk z repozytorium, zero odniesień do
   mechaniki gry (koszt/bonus/wymagania).
3. Żaden INNY budynek (spoza tych 14) i żadne INNE pole tych 14 budynków
   nie zostały zmienione — dowód: `git diff` pokazuje WYŁĄCZNIE dodane
   linie `"historia": "..."`, zero usuniętych/zmienionych linii poza tym.
4. Realny, żywy dowód (headless Chromium, build produkcyjny): karta
   DOWOLNEGO z tych 14 budynków (np. Stolarnia) w panelu miasta pokazuje
   nową sekcję „Rys historyczny" z wpisaną treścią, na końcu karty, pod
   sekcjami mechanicznymi. Karta budynku SPOZA tej listy (np. dowolny z
   pozostałych 27) NIE pokazuje sekcji „Rys historyczny" (bo nie ma jeszcze
   pola — to poprawne, nie regres).
5. `tsc --noEmit` 0 błędów (zmiana jest czysto danymi, ale sprawdź na
   wszelki wypadek) + wszystkie 5 bramek referencyjnych bez regresu +
   `entity-card-historia-section-test.cjs` bez regresu.

## ALLOWLISTA — nic poza tym
`gra/data/buildings.json` (WYŁĄCZNIE dodanie pola `historia` do 14
wskazanych wpisów). Zakazane bezwzględnie: wszelkie inne pliki w
`gra/data/**`, `gra/src/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-B1-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione na podstawie samego zapisu w JSON —
wymagany realny zrzut z żywej przeglądarki pokazujący renderowaną sekcję z
FAKTYCZNIE wpisaną treścią (nie placeholder). Zakaz kopiowania tego samego
tekstu (parafrazy jednego szablonu) do kilku różnych budynków — każdy wpis
ma być unikalny i specyficzny dla DANEGO budynku, nawet jeśli kilka z nich
jest historycznie pokrewnych (np. odlewnia_brazu vs odlewnia_zelaza — różne
metale, różne epoki, różny tekst). Zakaz przekroczenia zakresu — jeśli
uznasz że jakiś INNY budynek też pilnie potrzebuje poprawki (np. literówka w
istniejącym polu), NIE poprawiaj go w tej rundzie — zgłoś w raporcie jako
obserwację dla przyszłego tematu.

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
