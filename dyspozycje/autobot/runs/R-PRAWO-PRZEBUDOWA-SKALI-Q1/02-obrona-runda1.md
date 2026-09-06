STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-PRAWO-PRZEBUDOWA-SKALI-Q1
GOAL: Przebudować skalę Prawa (D1-D7 właściciela) — patrz 00-dispatch.md/01-operator.md.

ODPOWIEDŹ NA ZARZUTY EVALUATORA (runda 1, obrona):

**#1 hasGarnizonBudynek nieustawione w main.ts:29179-29215 — PRZYJMUJE, bez poprawki (blokada
allowlisty).** Potwierdzone grepem: `main.ts` ustawia `hasDomStarszyzny/hasDworZarzadcy/
hasPretorium/hasTrybunal/hasSad/palacTier/garnizonCount`, ale NIE `hasGarnizonBudynek` (pole
opcjonalne, `tsc` nie łapie). Realny skutek: żadne miasto nie dostaje +25/35/47 z budynku
Garnizon w rzeczywistej rozgrywce (rebelia/`revoltGrace` liczą bez niego), mimo że kalibracja
53/85/121 zakłada ten bonus. Test 3i rundy 1 sprawdzał WYŁĄCZNIE `cityPanel.ts` (który JEST
poprawny — `builtIds.includes('garnizon')`, linia 3150), nigdy `main.ts` — stąd rozjazd
niewidoczny. `main.ts` jest na liście "Zakazane bezwzględnie" tego tematu — jedyna poprawka
(jedna linia przy 29211) wymaga jego dotknięcia. Nie poprawiam poza allowlistą. Pełny opis
i rekomendacja w `decision-abc.md` (nowa sekcja DECISION_REQUIRED). To jest najpoważniejszy
z czterech zarzutów i eskaluję go formalnie do orkiestratora/właściciela.

**#2 dwa martwe bundle z literałami usuniętych kar — PRZYJMUJE ustalenie, ODRZUCAM że to
FAIL tematu.** Pełny grep repo potwierdza `.pt-layout-bundle.cjs:6494`,
`.diag-playtest-bundle.cjs:8202` ORAZ dodatkowo kilka zbudowanych plików HTML
(`Gra-FINALNA.html` i inne, wszystkie sprzed commitu `546f6a51`, poza allowlistą). Żaden
plik nie jest importowany/wołany przez aktywny kod czy bramkę (zweryfikowane grepem) — martwe
artefakty. Kryterium 2 czytane dosłownie nie jest w 100% spełnione tekstowo, ale funkcjonalnie
(kod ich nie czyta) tak. DECISION_REQUIRED wtórne w `decision-abc.md`: czy autoryzować
sprzątanie poza zakresem. Nie edytuję tych plików (poza allowlistą).

**#3 sufit sześciu pozycji nigdy nie przetestowany realnym cięciem — PRZYJMUJE, POPRAWIONE.**
Dodana sekcja 3j w `prawo-przebudowa-skali-test.cjs`: eksport `buildOrderSectionHtml` z
`orderPanel.ts` (import do testu, plik NIE edytowany), scenariusz stolicy (Palac III +
pretorium + trybunał + sąd + garnizon wojskowy + budynek Garnizon) daje dokładnie 6 linii
Prawa w silniku; HTML po REALNYM `linesHtml(...,6,pfx)` nadal zawiera obie etykiety
("Garnizon (N jedn.)" i "Garnizon (budynek)"). Kontrola negatywna (Tryb piąty): obniżenie pop
do 3 dodaje 7. linię ('osiedle') — HTML wtedy faktycznie zawiera znacznik obcięcia "…", dowód
że test mierzy realne cięcie, nie tautologię. 8 nowych asercji, wszystkie OK (134→142 OK,
0 FAIL). `tsc --noEmit` nadal czyste.

**#4 rodzina Prawa/Porządku niepełna (10 plików pominiętych) — PRZYJMUJE, POPRAWIONE.**
Uruchomione wszystkie 10 wskazanych plików: athens-sparta-por (skrypt ilustracyjny, exit 0,
bez asercji), barb-city-behavior-test 177/0, building-happiness-test 14/0,
citizen-resource-upkeep-test 109/0, happiness-breakdown-test 38/38, r-wzrost-szczescie-dubel
59/0, szczescie-zamoznosc-test 88/0, war-happiness-parity-test 21/0 — wszystkie zielone.
rebel-city-notification-live-test i rebel-protection-live-test: TIMEOUT potwierdzony
niezależnie (100s), oba używają Playwright/chromium (realny render przeglądarki) —
nie kończą się w tym środowisku niezależnie od zmian tego tematu (INFRA, pre-istniejące,
niepowiązane z plikami zmienionymi tu). Status: nierozstrzygnięty, zgodnie z zarzutem.

ZMIANY/COMMIT: gra/tools/prawo-przebudowa-skali-test.cjs (sekcja 3j dodana, +8 asercji) ·
dyspozycje/autobot/runs/R-PRAWO-PRZEBUDOWA-SKALI-Q1/decision-abc.md (2 nowe wpisy) ·
ten raport. Brak zmian w plikach silnika/danych — wszystkie 4 odpowiedzi dotyczą testu/
raportu/eskalacji, nie logiki D1-D7 (bez zmiany żadnej liczby właściciela).

TESTY: prawo-przebudowa-skali-test.cjs 142 OK/0 FAIL. tsc --noEmit: 0 błędów. 10 plików
rodziny z zarzutu #4: 8 zielone, 2 INFRA-timeout (Playwright, opisane wyżej).

BLOKADY: DECISION_REQUIRED #1 (hasGarnizonBudynek w main.ts, poza allowlistą — patrz
decision-abc.md) — to jest realna luka funkcjonalna, temat nie może być uznany za w pełni
zamknięty w rozgrywce bez tej jednej linii w main.ts. DECISION_REQUIRED #2 (dwa martwe
bundle + kilka HTML, poza allowlistą, wtórne). Dwa testy INFRA nierozstrzygnięte (#4).

RUNDY: 1/5 (ta odpowiedź to druga faza rundy 1 — obrona po Evaluatorze)

NASTĘPNY KROK: orkiestrator/właściciel — decyzja co do DECISION_REQUIRED #1 (osobny patch
main.ts albo rozszerzenie allowlisty), potem Final Control.

DEPLOY/PUSH: NIE WYKONANO
