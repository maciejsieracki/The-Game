# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Evaluator, runda 3/5

**Uwaga proceduralna:** agent Evaluator zwrócił kompletną treść tego raportu przez
StructuredOutput, ale proces zakończył się przed zapisaniem/zacommitowaniem pliku na dysku.
Orkiestrator odtwarza ten raport z zarejestrowanej treści zwrotnej agenta, bez zmiany
choćby jednego znaku, i commituje w jego imieniu.

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa. Runda 3: Spichlerz/Spichlerz II mają być realnym, wysokim priorytetem tam, gdzie miasto faktycznie potrzebuje ich do przełamania sufitu populacji — bez osłabiania chronionego gate.

## Metoda weryfikacji
Worktree /home/user/wt-ai-produkcja, HEAD `be88681f` — bezpośredni potomek ratyfikacji #2 (`72a11dfc`, potwierdzone `merge-base --is-ancestor`), drzewo czyste. `git diff 72a11dfc HEAD`: zmiany wyłącznie `gra/src/game/ai.ts` (133 linie) + raport rundy 3 — zgodnie z allowlistą, zero `git add -A`. Odtworzyłem NIEZALEŻNIE 400-turową proxy-symulację (esbuild, `chooseCityProduction` w pętli, `canAfford` zawsze true, 3 miasta major AI, prawdziwy `buildings.json`) — własny skrypt, nie kopia Operatora. Uruchomiłem osobiście: `tsc --noEmit` (0 błędów), 5 bramek referencyjnych (213/213, 19/19, 33/33, 13/13, 6/6), całą rodzinę `ai-*.cjs` (37 plików, pominięty `ai-buduje-budynki-test.cjs` zgodnie z ustaleniem z rundy 1) — wszystkie liczby identyczne z raportem Operatora, w tym 4 przedistniejące czerwone (7/1, 21/1, 33/5, 291/4, bit-do-bitu te same). `ai-jednostki-tylko-zakup-test` 44/0 potwierdzone. `git status --short` czyste po całej weryfikacji.

## Ustalenia zgodne z raportem
(a) Własna symulacja potwierdza dokładnie: Spichlerz #1 (population:5, sufit bez Spichlerza), Spichlerz II #1 (population:8, Spichlerz I już stoi) — identyczne kolejności jak w tabelach Operatora, nie tylko formalny wyższy wynik. (c) Chroniony gate niezmieniony, wciąż mierzy prawdziwy scenariusz „jeszcze niezablokowane" — WEAK=8 potwierdzone niezależnie. (d) Akwedukt zweryfikowany, przesunięty o 1 pozycję, brak zmian potrzebnych. (e) `defensiveCopy` nietknięte — bonus zastosowany wyłącznie przy `!opts.defensiveCopy`, gate'y miast-państw zielone. (f) Zero regresji potwierdzone we wszystkich uruchomionych bramkach.

## Zarzut (patrz pole zarzuty)
Mechanizm `granaryPriorityBonus()` jest CELOWO, jawnie skalibrowany na progach populacji „normal" (5/8/12 — komentarz w kodzie wprost to przyznaje), ale te progi w realnej grze SKALUJĄ SIĘ z trudnością (`econ-params.json`: `akwedukt_prog_ludnosci` easy=6/normal=5/hard=4; `spichlerz_prog_ludnosci` płaskie 8 na wszystkich trudnościach). Funkcja nie przyjmuje ani nie czyta trudności (`opts.menuDifficulty` jest dostępne w tym samym zakresie co `opts.defensiveCopy`, ale nieużyte). Odtworzyłem to własną symulacją: podstawiając realny sufit `hard` (population start = 4, zamiast zaszytego 5) Spichlerz W OGÓLE nie wchodzi w 400 turach — sekwencja identyczna z PRZED (rundą 2, defekt sprzed naprawy). To znaczy: na trudności `hard` (realny, wybieralny tryb gry) naprawa tej rundy jest w praktyce bezskuteczna — dokładnie ten sam problem właściciela („miasta AI trwale zablokowane"), którego ta runda miała dotyczyć, przetrwa nienaruszony. Na `easy` błąd jest odwrotny i łagodniejszy (bonus STRONG odpala się jeden punkt populacji za wcześnie, przy realnym zapasie 5<6). To nie jest kosmetyka — przyczyna konfliktu z chronionym gate została naprawiona merytorycznie tylko dla jednej trudności, milcząco (nie zgłoszone w raporcie ani jako ograniczenie, ani jako DECISION_REQUIRED, w przeciwieństwie do analogicznego ograniczenia z rundy 2).

## TESTY (zbiorczo)
tsc 0/0. Bramki referencyjne 213/213, 19/19, 33/33, 13/13, 6/6. `ai-jednostki-tylko-zakup-test` 44/0. `ai-produkcja-pokrycie-katalogu-test` 6/0 (42/42). `ai-threat-mode-test` 12/0. `ai-production-priority-test` 9/0. Rodzina `ai-*` 37/37 plików uruchomionych, 4 przedistniejące czerwone identyczne (niepowiązane — handel/diplomacja). Własna 400-turowa proxy-symulacja (2 warianty: population=5 i population=4) — patrz tabela.

BLOKADY: jedna, patrz zarzuty — mechanizm difficulty-blind.
RUNDY: 3/5
NASTĘPNY KROK: Obrona Operatora na zarzut poniżej (czytać `opts.menuDifficulty`/przekazać rzeczywiste progi zamiast literałów `5`/`8`, analogicznie do `cityPopulationCap`), albo jawny DECISION_REQUIRED do właściciela jeśli uzna zakres tej rundy za ograniczony do trudności normal.
DEPLOY-PUSH: NIE WYKONANO

---

## TABELA: własna, niezależna 400-turowa proxy-symulacja (identyczna metoda co Operator, ale osobny skrypt) — porównanie population start=5 (sufit „normal" bez Spichlerza) vs population start=4 (realny sufit „hard")

| # | population=5 (jak w raporcie Operatora — potwierdzone) | population=4 (realny sufit „hard") |
|---|---|---|
| 1 | **spichlerz** | koszary |
| 2 | koszary | studnia |
| 3 | studnia | akwedukt |
| 4 | akwedukt | laznia_publiczna |
| 5 | laznia_publiczna | stolarnia |
| 6 | stolarnia | kamieniarski |
| 7 | kamieniarski | garncarnia |
| 8 | garncarnia | cegielnia |
| 9 | cegielnia | — (plateau: Wojownik) |

Przy population=4 spichlerz NIE pojawia się wcale w 400 turach (pozycja -1) — sekwencja identyczna z defektem sprzed tej rundy (raport Operatora, kolumna „PRZED runda 2").

## TABELA: własna weryfikacja scenariusza spichlerz_ii (population:8, Spichlerz I już w `built`) — potwierdzone identyczne z raportem Operatora
spichlerz_ii, koszary, studnia, akwedukt, laznia_publiczna, stolarnia, kamieniarski, garncarnia, cegielnia — spichlerz_ii na #1, zgodnie z zadaniem 2 dispatchu.
