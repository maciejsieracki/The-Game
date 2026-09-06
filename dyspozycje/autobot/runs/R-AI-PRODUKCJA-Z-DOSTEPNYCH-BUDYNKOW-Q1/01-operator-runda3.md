# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Operator, runda 3/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa. Runda 3: Spichlerz/Spichlerz II muszą być REALNYM, wysokim priorytetem (nie kosmetyką) tam, gdzie miasto faktycznie potrzebuje ich, żeby przełamać sufit populacji — bez osłabiania chronionego gate.

## Przyczyna i naprawa (zadanie 1-2 dispatchu)

Przyczyna, dla której podniesienie płaskiego bonusu Spichlerza >8 psuło
`ai-jednostki-tylko-zakup-test` (44/0→41/3): scenariusz B tego gate'u to 3 miasta
major AI z `population: 4`, sufit populacji BEZ Spichlerza (economy.ts
`cityPopulationCap`, "normal") = 5. Miasto ma jeszcze 1 punkt zapasu do wzrostu —
to jest DOKŁADNIE gałąź, w której Spichlerz NIE powinien przebijać jednostek.
Fixture nie jest przestarzały (opcja a odrzucona) — trafia w prawdziwy przypadek
"jeszcze nie zablokowane" (opcja b, potwierdzona).

Naprawa: płaski `AI_MAJOR_SPICHLERZ_PRIORITY_BONUS=8` zastąpiony funkcją
`granaryPriorityBonus(city, built)` (ai.ts): liczy aktualny sufit populacji
miasta z tych samych progów co `economy.ts::cityPopulationCap` (bez budynku=5,
ze Spichlerzem/Spichlerzem II bez Akweduktu=8, z Akweduktem=∞-dla-tego-celu) i
zwraca SILNY bonus (+110, ranga Koszar) gdy `population >= sufit` (miasto
realnie zablokowane — problem właściciela wprost), albo SŁABY (+8, dawna
bezpieczna wartość, niezmieniona) gdy miasto ma jeszcze zapas. Ta sama funkcja
obsługuje `spichlerz_ii` (zadanie 2) z progiem 8 zamiast 5, gdy Spichlerz I już
stoi. Miasto z Akwedukt = 0 (cap już 12, Spichlerz przestał być wąskim gardłem).

## Dowód: chroniony gate nietknięty

`ai-jednostki-tylko-zakup-test.cjs`: scenariusz B ma population=4 < 5 →
`granaryPriorityBonus` zwraca WEAK=8 (identycznie jak przed rundą), przez
wszystkie 40 tur (population w tym harnessie jest stałe, bez symulacji
wzrostu) — wynik: **44/0, bez zmian**, mimo że STRONG=110 (znacznie ponad
dawną barierę 8) jest teraz w kodzie. Gate nie wymagał aktualizacji — problem
był w mechanizmie (stała), nie w teście.

## Zadanie 3 — Akwedukt zweryfikowany własnym pomiarem

Własna 400-turowa proxy-symulacja (patrz tabela niżej, metoda identyczna do
Final Control rund 1-2: `chooseCityProduction` w pętli, bez `canAfford`, 3
miasta major AI, esbuild+`buildings.json` prawdziwe): Akwedukt wchodzi jako
3. budynek PRZED zmianą i 4. PO zmianie (przesunięty o jedno miejsce przez
Spichlerza, wciąż w pierwszej dziesiątce) — **potwierdzone, zero zmian
Akweduktu wymagane**.

## Testy

`tsc --noEmit`: 0 błędów. 5 bramek referencyjnych: logic 213/213, tech-tree
19/19, research 33/33, unit-replace 13/13, combat 6/6. Cała rodzina `ai-*.cjs`
(pominięty tylko `ai-buduje-budynki-test.cjs`, Vite/Chromium, niezwiązane —
ustalone w rundzie 1): chroniony gate `ai-jednostki-tylko-zakup-test` 44/0.
`ai-produkcja-pokrycie-katalogu-test` 6/6 (42/42 katalog). `ai-threat-mode-test`
12/12 (Mury nadal wygrywają pod zagrożeniem/na granicy mimo silniejszego
Spichlerza — margines starczył, zweryfikowane realnym uruchomieniem, nie
rachunkiem). `ai-production-priority-test` 9/9. 4 przedistniejące czerwone,
identyczne z rundą 2 (potwierdzone bit-do-bitu, niezwiązane z tym tematem —
diplomacja/trade, nie produkcja budynków): `ai-balans-step3-test` 7/1,
`ai-praca-split-parity-test` 21/1, `ai-slider-test` 33/5, `ai-test` 291/4 (4
FAIL to `zaproponuj_handel`/T2S-b/T10b — handel, nie spichlerz). Uboczny efekt
`ai-balans-step2-smoke.cjs` (regeneruje `docs/decyzje/AI-BALANS-STEP2-SMOKE.md`)
cofnięty `git checkout --` natychmiast, drzewo czyste.

## BLOKADY

Brak nowych. Kryterium 4 (150 tur w realnym silniku) — nadal odroczone do
nocnego przebiegu i playtestu właściciela, bez zmian, zgodnie z ratyfikacją.

RUNDY: 3/5
NASTĘPNY KROK: Evaluator rundy 3.
DEPLOY/PUSH: NIE WYKONANO

---

## TABELA: proxy-symulacja 400 tur, PRZED/PO (3 miasta major AI, mid-game,
`population: 5` — sufit BEZ Spichlerza, konfiguracja identyczna z
`ai-produkcja-pokrycie-katalogu-test.cjs` — bez `canAfford`, esbuild + prawdziwy
`buildings.json`; metoda identyczna z Final Control rund 1-2)

Plateau na jednostkach po wyczerpaniu tego samego zestawu budynków w obu
wariantach (mechanizm damping majorEarly, poza zakresem tej rundy — patrz
komentarz `GROUP_BUILDING_BASE` w ai.ts) — jedyna różnica to SKŁAD i KOLEJNOŚĆ
budynków w oknie plateau.

| # | PRZED (runda 2, bonus płaski 8) | PO (runda 3, bonus warunkowy) |
|---|---|---|
| 1 | koszary | **spichlerz** |
| 2 | studnia | koszary |
| 3 | akwedukt | studnia |
| 4 | laznia_publiczna | akwedukt |
| 5 | stolarnia | laznia_publiczna |
| 6 | kamieniarski | stolarnia |
| 7 | garncarnia | kamieniarski |
| 8 | cegielnia | garncarnia |
| 9 | — (plateau: Wojownik/Łucznik) | cegielnia |
| 10+ | — (plateau: Wojownik/Łucznik) | — (plateau: Wojownik/Łucznik) |

**Spichlerz: z "nigdy" (nieobecny w 400 turach, runda 2) na #1** — przed
koszarami. Zgodne z zadaniem 1 dispatchu ("jeden z pierwszych... analogiczny
do koszary/biblioteka"), nie tylko formalny wyższy wynik.

## TABELA: spichlerz_ii (Epoka 2), scenariusz dedykowany (3 miasta mid-phase,
Spichlerz I już stoi, `population: 8` — sufit ze Spichlerzem I bez Akweduktu,
bez Akweduktu w `built`)

| # | PRZED (runda 2 — brak wyjątku spichlerz_ii) | PO (runda 3) |
|---|---|---|
| 1 | koszary | **spichlerz_ii** |
| 2 | akwedukt | koszary |
| 3 | laznia_publiczna | akwedukt |
| 4 | stolarnia | laznia_publiczna |
| 5 | kamieniarski | stolarnia |
| 6 | cegielnia | kamieniarski |
| 7 | — (plateau) | cegielnia |

**Spichlerz II: z nieobecnego na #1**, natychmiast gdy dostępny (miasto ma
Spichlerz I i jest już na jego suficie) — zadanie 2 dispatchu spełnione.
