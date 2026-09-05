# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Operator, runda 3

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1
MODEL+EFFORT: Opus 5, effort high (Operator) — C-052
GOAL: R3-1 — poszerzyć budżet szerokości nazwy tak, by 15 pierwszych miast cywilizacji
mieściło się bez wielokropka, i ZMIERZYĆ ryzyko zachodzenia plakietki; R3-2 —
`playerCapitalFromPool` czyta `miasta_cywilizacji[0]`. Praca rundy 2 (`1e87ec1c`) utrzymana.

## ZMIANY (baza `fb33fd0a`, allowlista)

- `gra/src/render/cityMapStatChip.ts` — nowa stała `CITY_NAME_BUDGET_BASE = 260`
  (dawny literał 200) + zaktualizowany komentarz sufitu `BADGE_MAX_TOTAL_SCALE`.
- `gra/src/game/city-names-pool.ts` — `playerCapitalFromPool` → `miasta_cywilizacji[0]`,
  stara ścieżka (`miasta_panstwa[0]` → `'Stolica'`) zostaje fallbackiem.
- `gra/src/game/civ-names.ts` — komentarz `playerStartCityName`.
- `gra/tools/mapa-etykieta-stolicy-test.cjs` — E7 przepisana + E7a–E7e + nowa sekcja (G).
- `dowody/pomiar-plakietki-runda-3.cjs`, `zrzut-mapy-runda-3.cjs`,
  `plakietka-przed-po-runda-3.cjs`, 5 PNG; `decision-abc.md` (C-054).
Nietknięte: `cluster-spawn.ts`, `render/cities.ts`, `display-names.ts`, dane JSON, `main.ts`.

## E7 — CO ZMIENIŁEM I DLACZEGO (obowiązek raportowania)

PRZED: `playerStartCityName(civs,'chinczycy',pools) === pools.chinczycy.miasta_panstwa[0]`
(= `Qin`), opis „ścieżka stolicy GRACZA nietknięta". PO: `=== miasta_cywilizacji[0]`
(= `Xi'an`). Stara utrwalała defekt — `Qin` to nazwa państwa i dynastii, nie miasta, czyli
dokładnie pomyłka zgłoszona przez właściciela dla AI, tylko po stronie gracza. Dołożone
E7a (nie `Qin`), E7b (`Kijów`, nie `Kiev`), E7c (15/15), E7d (parytet gracz/AI),
E7e (brak duplikatu w partii).

## TESTY

`tsc --noEmit` zielone. `mapa-etykieta-stolicy` **44/0**; `display-names` 27/0;
`city-names-pool` 12/0; `city-names-pools` 6/0; `civ-names` 6/0; `rozmiar-label` 13/0;
`danina-podatek-nazwa` 15/0; `diplomacy-display` 35/0; `unit-recruit-nazwa` 17/0;
`save-label` OK; `cluster-start-q2-smoke` 16/0. Referencyjne: logic 213/213, tech-tree 19/19,
research 33/33, unit-replace 13/13, combat 6/6. Parytet z rundą 2 na czerwonych:
`flaga-mp-nie-gasnie` 31/1, `miasta-panstwa-wylaczone` 52/3 — bez pogorszenia.
`cluster-start-test` — ponownie nie kończy się w 1800 s (jak w rundzie 2); asercja tej pracy
(`stolica gracza = Ateny`) jest w logu PASS, wszystkie FAIL-e są geometryczne (odstępy
heksów, łańcuch hubów), brak związku z nazwami; nie jest bramką referencyjną tematu.

Nietautologiczność: baza budżetu 260→200 → `mapa-etykieta-stolicy` 42/2 (G3, G4);
cofnięcie `playerCapitalFromPool` → 39/5 (E7, E7a–E7d). Obie mutacje cofnięte.

## POMIAR (żywy Chromium, prawdziwe `makeCityMapBadgeSprite`)

Przycięcia stolic, metoda rundy 2 (`700 22px Georgia`): budżet 181→241 px **1/15 → 0/15**;
budżet 161→221 px **1/15 → 0/15**. Cała pula: nazw dłuższych niż budżet 112/1500 → 25/1500.

## BLOKADA — dlaczego DECISION_REQUIRED

Warunek twardy „plakietka nie zachodzi na sąsiednie heksy" nie jest spełnialny przy ŻADNYM
budżecie, łącznie z cofnięciem tematu. Granica: plakietka wchodzi na sąsiedni heks powyżej
1,732 j. świata ≈ 160 px CSS, czyli przy nazwie ok. 56 px — mieści się pod nią **1 z 15**
cywilizacji (`Tyr`). Zulusi: 1,98 × odległości do sąsiada przed R3-1, 2,33 × po
(`dowody/plakietka-zulu-przed-po-runda3.png`). Drugi, rozłączny odczyt: plakietka nie dotyka
plakietki sąsiedniego miasta — minimalny odstęp miast 5 heksów = 8,66 j. wobec najszerszej
plakietki 4,04 j., **0/30 kolizji**; potwierdza to zrzut z żywej gry w układzie gęstym
(`dowody/mapa-uklad-gesty-runda3-zblizenie.png`: `XI'AN` z koroną, cztery miasta-państwa
w minimalnej odległości 5 heksów, żadna etykieta nie nachodzi na drugą; etykiety
miast-państw przy szerszym budżecie są mniej przycięte niż w rundzie 2). Wybór odczytu
należy do właściciela — szczegóły w `decision-abc.md`.

Sprawa poboczna do tej samej decyzji: WŁASNA stolica gracza ma trzeci slot (WZROST%) i przy
niej `uMgungundlovu` nadal się przycina (1/15); domknięcie wymaga bazy ≈ 305 px, sufit
tekstury (2048 px) przepuszcza do ≈ 369 — nie wybieram tego sam.

RUNDY: 3/5
NASTĘPNY KROK: decyzja właściciela (odczyt warunku twardego + baza 260 vs 305), potem
Evaluator i Final Control.
DEPLOY/PUSH: NIE WYKONANO
