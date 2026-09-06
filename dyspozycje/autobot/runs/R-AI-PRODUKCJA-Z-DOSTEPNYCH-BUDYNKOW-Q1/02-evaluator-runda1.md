# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Evaluator, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa, zero zaszytych id budynków jako źródła kandydatów.

## Weryfikacja niezależna — metoda

Guard izolacji potwierdzony: HEAD `705e54fc` jest bezpośrednim potomkiem bazy
`918e5993` (drzewo czyste, brak rozbieżności — HEAD po prostu awansował o commit
Operatora, zgodnie z sekwencją pracy). Odtworzono grepem literały id budynków w
`ai.ts`, uruchomiono nową bramkę pokrycia, 5 bramek referencyjnych, całą rodzinę
`ai-*.cjs` (39 plików) oraz porównano zastane czerwone z bazą `918e5993` (osobny
worktree tymczasowy, usunięty po weryfikacji). Jedna mutacja poboczna
(`docs/decyzje/AI-BALANS-STEP2-SMOKE.md`, SHA-stamp z własnego uruchomienia
`ai-balans-step2-smoke.cjs`) cofnięta kopią pliku z `HEAD`, nie przez `git checkout`.

## Zarzuty

Patrz pole `zarzuty` (7 pozycji, ponumerowane). Skrót: (1) niekompletne ujawnienie
kryterium 1 — co najmniej 8 dodatkowych zaszytych id budynków
(`cegielnia`/`odlewnia_brazu`/`odlewnia_zelaza`/`wielka_odlewnia` w
CONVERTER_FOR_RESOURCE wewnątrz ciała funkcji ok. l.1744-1775;
`stolarnia`/`garncarnia`/`kamieniarski`/`kuznia`/+duplikaty w
AI_BUILDING_FOR_DEFICIT, wołane z wnętrza funkcji) działa jako realne źródło
NOWYCH kandydatów (`candidates.push` z literałem), nieujęte w raporcie obok
5 ujawnionych wyjątków — narusza GOAL wprost (nowy konwerter surowca nadal
wymaga linii w `ai.ts`). (2) Kryterium 4 (symulacja 150 tur PRZED/PO) całkowicie
nieobecne — brak tabeli, brak liczb, jedyny wymagany dowód działania w grze
nie dostarczony. (3) Kryterium 3 bez wymaganego "śladu z symulacji" — same
twierdzenia prozą; dodatkowo komentarz w `ai.ts` (~l.1289) odwołuje się do
nieistniejącej "tabeli PRZED/PO w raporcie Operatora". (4)-(6) DECISION_REQUIRED
#1-#3 Operatora są poprawnie ujawnione, ale kryteria 1/2/3 pozostają formalnie
niespełnione do rozstrzygnięcia właściciela. (7) `ai-buduje-budynki-test.cjs`
(42/0 oczekiwane, wymieniony explicite w dispatchu) niezweryfikowany — nie
ukończył się ani u Operatora, ani w niezależnej próbie tej rundy (test z
definicji trwa dziesiątki minut: 3× `vite build` + headless Chromium).

## Zweryfikowane niezależnie jako ZGODNE z raportem

- Katalog: 42 budynki (nie 41) — rozbieżność RECON potwierdzona.
- tsc --noEmit: zielone.
- 5 bramek referencyjnych: 213/213, 19/19, 33/33, 13/13, 6/6 — potwierdzone.
- Rodzina `ai-*.cjs` (39 plików, poza `ai-buduje-budynki-test`): identyczny wzorzec
  zielony/czerwony jak w raporcie; 4 czerwone w `ai-test.cjs`
  (zaproponuj_handel) + `ai-balans-step3-test` (7/8) + `ai-praca-split-parity-test`
  (21/22) + `ai-slider-test` (33/38) potwierdzone jako IDENTYCZNE na bazie
  `918e5993` sprzed tematu — pre-istniejące, niezwiązane, jak twierdzi Operator.
- Miasta-państwa: `ai-mp-military-cap-test` (18/18), `ai-mp-rekrutacja-build-gate-test`
  (21/21), `cs-military-cap-wiring-test` (13/13), `city-state-prod-audit-test`
  (17/17) — zielone, kryterium 5 potwierdzone.
- Kryterium 6: stary `infraOrder` (7 id, w tym `garnizon`) usunięty w całości
  z `ai.ts` — potwierdzone grepem/diffem.
- Allowlista: brak zmian w `gra/data/**`, `gra/src/main.ts`, `docs/decyzje/**`
  (poza mutacją poboczną cofniętą), `dyspozycje/WERSJE.md` — potwierdzone diffem.

## Tabela pokrycia (odtworzona niezależnie, bramka `ai-produkcja-pokrycie-katalogu-test.cjs`)

| Zakres | Wynik |
|---|---|
| Major AI, pełny katalog | 39 / 42 (brak: mury, fort, baszta) |
| Major AI, bez wyjątku P-AI-008 | 39 / 39 |
| Miasto-państwo (defensiveCopy) | 42 / 42 |
| Katalog łącznie (z danych, buildings.json.length) | 42 |

## Tabela symulacji 150 tur PRZED/PO

BRAK — nie dostarczona przez Operatora (kryterium 4 nieobecne w raporcie
runda 1). Nic do zweryfikowania; patrz zarzut #2.

RUNDY: 1/5
NASTĘPNY KROK: Runda 2 na tej samej gałęzi — Operator: (a) usuwa lub ujawnia
i uzasadnia WSZYSTKIE literały budynków w `chooseCityProduction` i funkcjach
przez nią wołanych (nie tylko 5 già zgłoszonych), (b) dostarcza tabelę symulacji
150 tur PRZED/PO (kryterium 4), (c) dostarcza ślad symulacji dla kolejności
wczesnej gry (kryterium 3) i usuwa fałszywe odwołanie w komentarzu kodu do
nieistniejącej tabeli, (d) kończy weryfikację `ai-buduje-budynki-test.cjs`.
Właściciel: rozstrzygnięcie DECISION_REQUIRED #1-#3 Operatora.
DEPLOY/PUSH: NIE WYKONANO
