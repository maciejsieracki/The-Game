# R-PRAWO-PRZEBUDOWA-SKALI-Q1 — Evaluator, runda 1/5

**Uwaga proceduralna:** agent Evaluator zwrócił kompletną treść tego raportu przez
StructuredOutput, ale proces zakończył się przed zapisaniem/zacommitowaniem pliku na dysku.
Orkiestrator odtwarza ten raport z zarejestrowanej treści zwrotnej agenta, bez zmiany
choćby jednego znaku, i commituje w jego imieniu.

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-PRAWO-PRZEBUDOWA-SKALI-Q1
GOAL: Przebudować skalę Prawa (D1-D7 właściciela) zgodnie z 00-dispatch.md — tabela
prawo_max_epoka per trudność, współczynnik populacji 0,04 płasko, cap 170, dwie kary
usunięte na stałe, nowa bramka, Garnizon-budynek wpięty w kalibrację z własnym id linii.

ZMIANY/COMMIT: Zweryfikowałem niezależnie stan worktree (HEAD 4884d59e, 025d899f jako
ancestor, drzewo czyste — zgodne z SS2b, brak rozbieżności). Dane w
gra/data/society-params.json (prawo_max_epoka, współczynnik, cap, kara-klucze usunięte,
prawo_garnizon_budynek_epoka) zgadzają się z 00-dispatch.md co do cyfry. D6 (bonus
osiedla) potwierdzony nietknięty przez `git diff 025d899f..HEAD`.

TESTY: Uruchomiłem samodzielnie: nowa bramka 134/0 OK; tsc --noEmit czyste; 5 bramek
referencyjnych zielone (213/19/33/13/6); rodzina Prawo/Porządek — 7 z 11 pozycji
raportu Operatora uruchomione i potwierdzone identyczne co do liczby (55/0, 53/0, 28/1,
25/0, 81/0, 3/0, 30/0); FAIL-e w conquest-stability/administracja-stolica/
budynek-garnizon/szczescie-przebudowa-skali potwierdzone jako PRE-ISTNIEJĄCE (uruchomione
w izolowanym worktree z bazy 025d899f — identyczne liczby FAIL przed tym tematem).
Przeliczyłem SAMODZIELNIE (niezależnie od bramki i od dispatchu) sumy budynków 53/85/121
wprost z JSON oraz wzór P=2+ln(budynki/prawMax)/ln1,04 dla normal — wyniki 9,17/8,84/11,00
zgadzają się z tabelą właściciela. Potwierdziłem w order.ts/society-breakdown.ts, że
PorPct ma własny cap 120 niezależny od prawo_pct_cap (D7 bezpieczny).

BLOKADY (zarzuty poniżej, bez werdyktu):

1. main.ts (~linia 29179-29215, poza allowlistą, realna pętla per-turowa
`evaluateOrderFromBreakdown` napędzająca `ordPct.porPct` → `updateRevoltGrace` /
`shouldTriggerRebellion`) NIGDY nie ustawia `hasGarnizonBudynek` — pole jest opcjonalne,
więc tsc milczy. Skutek: w REALNEJ ROZGRYWCE każde miasto traci bonus Prawa z budynku
Garnizon (25/35/47), mimo że `prawo_max_epoka` jest skalibrowane WŁAŚNIE z tym bonusem
(53/85/121). Tylko cityPanel.ts (allowlista) i bespoke harness testu 3i ustawiają to pole
poprawnie — parytet panel↔silnik zweryfikowany testem 3i NIE obejmuje prawdziwej ścieżki
main.ts. Nie zgłoszone jako DECISION_REQUIRED/BLOCK mimo że main.ts jest zakazane.

2. Kryterium 2: grep `prawo_kara_brak_garnizonu`/`prawo_kara_podboj_bez_garnizonu` w całym
repo daje trafienia POZA dokumentacją/dispatchem: gra/tools/.pt-layout-bundle.cjs:6494 i
gra/tools/.diag-playtest-bundle.cjs:8202 (stare bundle'e, niezmienione od 546f6a51,
pre-istniejące, poza allowlistą) — raport nie pokazuje pełnego grepa i nie wspomina o nich.

3. Kolizja nazewnicza „sufit 6 pozycji": dispatch wymaga asercji, że obie linie
(`garnizon`/`garnizon_budynek`) są widoczne RAZEM pod realnym cięciem `linesHtml(...,6,...)`
w orderPanel.ts, albo DECISION_REQUIRED. Test 3i sprawdza tylko obecność w surowej tablicy
`lines[]`, w scenariuszach max 5-liniowych (brak scenariusza stolicy z Pałacem, gdzie
realnie wychodzi 6 linii) — cięcie do 6 nigdy nie zostało faktycznie przetestowane.

4. Kryterium 6 ("wypisz listę wyznaczoną grepem i wynik każdej"): raport podaje 11
wyselekcjonowanych plików, nie reprodukowalny grep. Grep po zawartości (society-breakdown/
order/conquest-stability/post-capture-law) znajduje dodatkowe zależne testy nieujęte w
raporcie (athens-sparta-por, barb-city-behavior-test, building-happiness-test,
citizen-resource-upkeep-test, happiness-breakdown-test, r-wzrost-szczescie-dubel-...-test,
szczescie-zamoznosc-test, war-happiness-parity-test, rebel-city-notification-live-test,
rebel-protection-live-test) — szybkie zielone, dwa live-render nie skończyły się w
rozsądnym czasie podczas weryfikacji (nierozstrzygnięte).

RUNDY: 1/5
NASTĘPNY KROK: Obrona (Operator adresuje zarzuty 1-4, priorytet #1 — realny main.ts).
DEPLOY-PUSH: NIE WYKONANO
