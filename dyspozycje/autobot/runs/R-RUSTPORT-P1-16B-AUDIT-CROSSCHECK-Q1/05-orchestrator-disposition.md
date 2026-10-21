STATUS: LIMIT-5-EXCEEDED (rozstrzygnięte częściowo przez orkiestratora — zarzut 5/STOLICE nie wymaga
nowej decyzji właściciela, zarzut 4/PARYTET-AI #9 wymaga dalszej pracy, nie decyzji)
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1

Final Control rundy 5 zgłosił DO_DECYZJI_WŁAŚCICIELA dla dwóch punktów. Sprawdziłem oba jako
orkiestrator przed eskalacją do właściciela:

**Zarzut 5 (STOLICE — „decyzja ABC" jako jedna z 5 nierozstrzygniętych pozycji):** Final Control
cytuje notatkę Operatora „decyzja otwarta; PYTANIA-OTWARTE.md nieczytany w r4" (§9.4 wiersz
„Opcja ABC MAP-UX-CLUSTER-LABEL"). Sprawdziłem `dyspozycje/PYTANIA-OTWARTE.md` wprost: pozycja
`MAP-UX-CLUSTER-LABEL-Q1` ma status **ZASTĄPIONE → paczka ABC-PACZKA-2026-08-06-KOLEJKA [3/5]**,
i ta paczka jest oznaczona **„✅ ZDEPLOYOWANE FALA 296 `a37f7123`"** (linia 318 pliku, odpowiedź
B+C, display 27/27, badge 31/31). To NIE jest otwarte pytanie — Operator po prostu nie przeczytał
pliku w rundzie 4, jak sam przyznał. Rozstrzygnięcie: `P1.16c-STOLICE` NIE wymaga świeżego pytania
ABC do właściciela — wymaga wyłącznie potwierdzenia, że zachowanie na pinie `edb8fb56` zgadza się
z już wdrożoną decyzją B+C (fakt do zweryfikowania przez Operatora, nie decyzja produktowa).
Pozostałe 4 pozycje STOLICE (luzowanie 3 hex, menu 4/5/7, testy, chip) to zwykła dalsza praca
audytowa, nie decyzja.

**Zarzut 4 (PARYTET-AI #9 — czy produkcja jednostek pobiera surowiec z puli):** Final Control
słusznie wskazał, że dowód Operatora (`koszt_surowce=0` w `units.json`) jest za słaby — trzeba
przeczytać ciało `buildingStockCost()`, czego nie zrobiono. To jest brakująca PRACA (jedno
dodatkowe czytanie kodu), nie decyzja produktowa wymagająca właściciela — żadna z dwóch możliwych
odpowiedzi (pobiera / nie pobiera z puli) nie jest kwestią gustu, to fakt w kodzie do ustalenia.

**Decyzja orkiestratora:** żaden z dwóch punktów nie wymaga pytania do właściciela. Zamykam
R-RUSTPORT-P1-16B jako LIMIT-5-EXCEEDED z podziałem (zgodnie z rekomendacją Final Control w
04-final-control.md), ale usuwam blokadę ABC dla P1.16c-STOLICE — może być dispatchowany od razu,
tak jak pozostałe 3 nowe tematy, SEKWENCYJNIE (ten sam plik `P1-16-EDGE-CASES.md`):
1. `P1.16c-KODU-A` (AUDYT-KODU 10 pozycji + WERYFIKACJA-53, pokrywające się)
2. `P1.16c-PARYTET-AI` (8 pozycji, w tym #9 — doczytać `buildingStockCost()`)
3. `P1.16c-STOLICE` (5 pozycji, w tym weryfikacja zgodności z już wdrożonym B+C FALA 296)
4. `P1.16c-CIVPEDIA-OPISY` (3 hasła Civpedii + lista Karawanseraju + ustalenie faktycznej liczby
   nieprzeliczonych wierszy OPISY, 69 nie 79)

NASTĘPNY KROK: dispatch `P1.16c-KODU-A` teraz (pierwszy w kolejce sekwencyjnej); pozostałe trzy
czekają na zamknięcie poprzedniego, każdy jako osobne wywołanie Workflow.
DEPLOY/PUSH: NIE WYKONANO
