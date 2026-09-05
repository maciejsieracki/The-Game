# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Obrona Operatora, runda 3 (§3c pkt 2)

STATUS: DECISION_REQUIRED (podtrzymany — zarzut 1 naprawiony, blokada R3-1 bez zmian)
DOMAIN: GAME
TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1
MODEL+EFFORT: Opus 5, effort high (Operator, drugie wywołanie, C-052)
GOAL: R3-1 — poszerzyć budżet szerokości nazwy do 0/15 przycięć i ZMIERZYĆ ryzyko
zachodzenia plakietki; R3-2 — `playerCapitalFromPool` czyta `miasta_cywilizacji[0]`.
Zgodny z sekcją „RUNDA 3 — RATYFIKACJA ORKIESTRATORA" w `00-dispatch.md`.
Baza potwierdzona `git log -1` przed pracą: `bbe93e30` na
`autobot/R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` (praca rundy 2 `1e87ec1c` utrzymana).

## OBRONA — zarzut 1 → **PRZYJMUJĘ**

**Zarzut:** komunikat asercji G4 (`gra/tools/mapa-etykieta-stolicy-test.cjs:369-371`) głosił
„(0/15 przyciętych)", a asercja liczyła wyłącznie `BASE − CROWN_W − PROD_W` (221 px),
pomijając `growthW` własnej stolicy gracza. Bramka mierzyła węższy stan niż deklarowała.

**Dowód z wytworu, że zarzut jest trafny** (nie zapewnienie — odczyt kodu + własny pomiar):

1. Kod: `gra/src/render/cityMapStatChip.ts:801` —
   `const maxNameW = CITY_NAME_BUDGET_BASE - prodW - growthW - crownW;`
   `growthW` jest **czwartym** odjemnikiem, którego G4 nie liczyła.
2. Zasięg slotu: `gra/src/render/cities.ts:820` —
   `const growth = isPlayerCity ? (options?.getCityGrowth?.(city) ?? null) : null;`
   czyli WZROST% dotyczy wyłącznie miast gracza; stolice AI (sedno R2/R3) mają konfigurację
   korona + glif, którą G4 mierzyła poprawnie — ale komunikat obejmował wszystkie 15.
3. Pomiar (ten sam żywy Chromium, `dowody/pomiar-plakietki-runda-3.cjs`, przebieg dzisiejszy):
   `Sloty: korona 19 px, glif produkcji 20 px, WZROST% (max) 51,7 px`;
   `stolica GRACZA: budzet 169,3 px -> przyciete: 1/15 [zulusi]`;
   `baza potrzebna, zeby i ta konfiguracja byla 0/15: 304,6 px`.
   Zarzut podał 42 px (`−10,5%`); mierzony jest **najszerszy** realny zapis
   (max z `−100,0%`, `−10,5%`, `+99,9%`) = 51,7 px — stąd 304,6, nie 295. Kierunek zarzutu
   bez zmian: 1/15, nie 0/15.

**Poprawka (w tej samej rundzie, w granicach allowlisty R3 — bramka z asercją):**
`gra/tools/mapa-etykieta-stolicy-test.cjs`

- G3 i G4: komunikaty doprecyzowane do faktycznie mierzonej konfiguracji — „stolica OBCA
  (korona + glif produkcji, **bez slotu WZROST%**) … 0/15 przyciętych **w TEJ konfiguracji,
  nie we wszystkich**". Asercje bez zmian — mierzyły prawdę, kłamał opis.
- Nowa **G6** dla trzeciej konfiguracji (własna stolica gracza z WZROST%): utrwala
  `304,6 px` jako bazę wymaganą do 0/15 również tam — czyli dokładnie tę liczbę, na której
  właściciel opiera wybór 260 vs ≈ 305. Bramka **nie** asertuje ani „mieści się", ani „nie
  mieści się" przy bazie 260: to jest otwarta decyzja właściciela (`decision-abc.md`), a
  asercja w którąkolwiek stronę albo czerwieniłaby dziś, albo utrwaliła defekt — ten sam
  błąd co stara E7. Stan faktyczny (169,3 px → 1/15) jest wypisywany jako nota w logu bramki.
- Nietautologiczność G6 (mutacja, cofnięta): `PROD_SLOT_W` 20→24 w
  `gra/src/render/cityMapStatChip.ts` → **44/1**, czerwienieje wyłącznie G6.
  Mutacja bazy 260→200 (kontrola G3/G4) → **43/2**. Drzewo `gra/src` przywrócone —
  `git status --short` czyste poza allowlistą.

**Czego zarzut nie zmienia:** wyboru bazy nie dokonuję sam — R3-1 zabrania („Nie wybieraj
sam kompromisu"), więc `CITY_NAME_BUDGET_BASE` pozostaje 260, a sprawa 260 vs ≈ 305 idzie
do właściciela w `decision-abc.md` bez zmian, teraz z bramką pilnującą tej liczby.

## POZYCJA DO DECYZJI CZŁOWIEKA (bez zmian od raportu 04)

Warunek twardy R3-1 „plakietka nie zachodzi na sąsiednie heksy" nie jest spełnialny przy
ŻADNYM budżecie, także po cofnięciu całego tematu (granica: 1,732 j. świata ≈ 160 px CSS,
mieści się pod nią 1 z 15 cywilizacji — `Tyr`). Drugi, rozłączny odczyt: 0/30 kolizji
plakietka-plakietka. To zależy od odczytu intencji warunku, nie od wytworu — `decision-abc.md`.

## ZMIANY/COMMIT

`gra/tools/mapa-etykieta-stolicy-test.cjs` (G3/G4 komunikaty + nowa G6 + nota),
`dyspozycje/autobot/runs/R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1/06-obrona-runda-3.md`.
Do commitu dołączony nieśledzony `05-evaluator-runda-3.md` (raport Evaluatora tej rundy,
ten sam katalog tematu) — żeby ślad obiegu nie został poza historią; jego treści nie zmieniam.
Nietknięte: `gra/src/**` (zero zmian wobec `bbe93e30`), `main.ts`, `docs/decyzje/**`,
dane JSON, `WERSJE.md`, `playbook.json`. `git diff --check` czysty.

## TESTY (uruchomione po poprawce)

`tsc --noEmit` zielone (5.9.3, symlink `gra/node_modules` zweryfikowany — C-029).
`mapa-etykieta-stolicy` **45/0** (było 44/0, +G6); `display-names` 27/0;
`city-names-pool` 12/0; `city-names-pools` 6/0; `civ-names` 6/0; `rozmiar-label` 13/0.
Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat OK.
Mutacje jak wyżej (44/1 i 43/2), obie cofnięte.

## BLOKADY

Techniczne: brak. Otwarte: decyzja właściciela — odczyt warunku twardego R3-1 oraz baza
260 vs ≈ 305 px (`decision-abc.md`).

RUNDY: 3/5 (obrona nie zwiększa licznika — §3c pkt 2)
NASTĘPNY KROK: Final Control jako sędzia — werdykt per zarzut (§3c pkt 3).
DEPLOY/PUSH: NIE WYKONANO
