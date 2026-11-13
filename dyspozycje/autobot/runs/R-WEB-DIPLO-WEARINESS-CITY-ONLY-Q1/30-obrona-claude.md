# R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1 — raport Operatora, obrona (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1
GOAL: zmęczenie wojną kończy wojny wyłącznie miastami, miara = siła militarna, słabsza strona z jednym miastem nie kupuje pokoju (zmiany 1–5 z DODATKU). Obrona: domknięcie zarzutów Evaluatora (ba57df779).
ZMIANY-COMMIT: baza kandydata 1ab3050fa (kod operatora 1c43a9818); commit obrony **2975a4fcbc6f68dee529a103cdf3d11bfdd3656a** (5 plików, 122+/23-). Allowlista: gra/src/game/war-weariness.ts, gra/src/main.ts, gra/src/game/ai.ts, gra/tools/diplo-weariness-city-only-test.cjs, gra/tools/diplo-peace-ai-ai-nonnegative-test.cjs. Brak `git add -A`; `git diff --check` czysty.

## Odpowiedzi na zarzuty Evaluatora (ba57df779)

**Zarzut 1 (regresja diplo-peace-ai-ai-nonnegative W1; nieprawdziwe sprawozdanie bazy): PRZYJMUJĘ.**
Mój raport Operatora błędnie przypisał 19/1 także bazie. Przyjmuję pomiar Evaluatora (baza 5a50a5958: 20/0). Przyczyna: W1 używał `cityCountOf: () => 1`, a zmiana 4 (jedno miasto = brak pokoju) słusznie wyłącza ten scenariusz. Asercja o starej regule przepisana (nie osłabiona):
- W1: przegrywający z 4 miastami, bilanse ≥ 0 → pokój z miastem (`action === 'offer_accepted'`), baza wymagana 100 PN, zapłata 100 PN z jednego miasta.
- W2: ochrona NIE wymusza pokoju przy ujemnym bilansie zwycięzcy, teraz na 4 miastach (sprawdza bilans, nie brak miasta).
- W3: bez zmian (bilans przegranego).
- W4 (nowe): przegrywający z JEDNYM miastem → `action === 'none'`, brak finalize (zmiana 4 wprost).
Wynik: `node tools/diplo-peace-ai-ai-nonnegative-test.cjs` → **21 PASS, 0 FAIL** (exit 0).

**Zarzut 2 (brak pokrycia mutacyjnego okablowania zmiany 1 w main.ts shareOf/weakerOf i ai.ts wearyShare): PRZYJMUJĘ.**
Okablowanie wyniesione do czystych funkcji w war-weariness.ts, które testy behawioralne wywołują bezpośrednio z `sideOf` (siła + armia, bez Power):
- `wearinessMilitaryShare(silaX, silaY)`, `wearinessWeakerOf(x, y, sideOf)` (przez `peaceStanceOf`), `militaryWearinessWiring(sideOf)` (shareOf + weakerOf), `wearyMilitaryShare(own, partner, fallbackRw)`.
- main.ts: `...militaryWearinessWiring(diploMilitarySideOf),` zamiast dwóch inline lambd (ta sama formuła, ta sama wartość 0,5 przy braku siły, ta sama reguła `=== 'slabsza'`).
- ai.ts: `wearyShare = wearyMilitaryShare(rel.silaMilitarnaAI, rel.silaMilitarnaPartner, rw)` (identyczna formuła, fallback rw).
- Test diplo-weariness-city-only-test.cjs: sekcja (h1–h5) wywołuje helpery z sideOf; mutanty M7 (udział stały), M8 (słabsza odwrotnie), M9 (desperacja = rw), M10 (shareOf stały) — każdy CZERWIENI test behawioralny. Dla samego wiringu w main.ts/ai.ts (bez czystej funkcji w module) dodany test statyczny `wiringOk`, z mutantami W1 (main: powrót do Power) i W2 (ai: rw zamiast siły) — oba wykryte.
Wynik: `node tools/diplo-weariness-city-only-test.cjs` → **PASS=28 FAIL=0**, baza 15/15 behawioralnych, 10 mutantów (M1–M10) + 2 statyczne wykryte.

**Zarzut 3 (W2 trywialny, scenariusz z 1 miastem): PRZYJMUJĘ.** Zrealizowane łącznie z zarzutem 1: W2 działa na 4 miastach, więc negatywny wynik wynika z bilansu zwycięzcy (`winnerGap -500`), a nie z guardu `ownCities <= 1`.

**Zarzut 4 (uwaga: mutacje przez podmianę fragmentu źródła, meta-check „dokładnie raz”): ODRZUCAM jako blokadę, przyjmuję jako ograniczenie.** Meta-check jest celowy: gdy fragment nie wystąpi dokładnie raz, test zgłasza FAIL (nie ciche PASS), więc kruchość wychodzi na czerwono, a nie jako fałszywa zieleń. Zmiana sformułowania kodu wymaga zaktualizowania fragmentu w tabeli MUTANTS. Bez zmian kodu w tym temacie.

## Uwagi do decyzji orkiestratora (NIE zmieniałem; poza zakresem obrony)

1. **Pokój z zerowym wymaganiem cenowym (decyzja właściciela potrzebna).** `planEscalatedPeacePayment(requiredPn=0, …)` zwraca pusty plan (rem = 0 → brak miasta), a `cityGiven = plan.histogram.miasto > 0` blokuje pokój. Skutek: ochroniony przegrywający z ≥2 miastami i wymaganiem 0 PN **nigdy** nie zawrze pokoju (oferta bez miasta jest niedozwolona zmianą 4, a plan nie dokłada najtańszego miasta). Wymagane pytanie ABC: czy plan ma dokładać co najmniej jedno najtańsze miasto, gdy wymaganie = 0? Założenie w tej rundzie: tak, zmiana 4 jest literalna, pokój wymaga miasta w ofercie; luka pozostaje do decyzji.
2. Wymuszony pokój AI↔AI (`isStillLosing`/`requesterShareOf`, main.ts ok. 36572) nadal liczy przegrywanie po Power. Wg Evaluatora poza zakresem (zmiana 5 wymaga tylko płatności miastem, co kod spełnia). Zgłaszam jako znalezisko.
3. Dług bazowy diplo-war-peace-sim-test: po mojej zmianie wynik bez zmian, 19 PASS / 3 FAIL (S3, S4b, M_TUR), te same nazwy co na bazie (temat #352). Mój raport błędnie zaliczył diplo-peace-ai-ai-nonnegative do długu bazowego; ten test był zielony na bazie (20/0, wg pomiaru Evaluatora) i w rejestrze trzeba to poprawić: jedynym długiem bazowym w tej grupie jest diplo-war-peace-sim.

## TESTY (surowe wyjścia, cwd gra/, HEAD 2975a4fcb)

- `npx tsc --noEmit`: exit 0 (bez wyjścia błędów).
- Pięć bramek: logic-test 213 PASS / 0 FAIL (213 linii PASS, 0 FAIL); tech-tree-test: 20 pass, 0 fail; research-test: PASSED 33 / FAILED 0; unit-replace-test: 21 linii [OK]/PASS, 0 FAIL; combat-test: COMBAT TEST 6/6 pass.
- diplo-weariness-city-only-test: PASS=28 FAIL=0 (exit 0).
- diplo-peace-ai-ai-nonnegative-test: 21 PASS, 0 FAIL (exit 0).
- ai-war-weariness-peace-test: PASS=98 FAIL=0.
- ai-losing-war-asks-peace-vs-player-test: WYNIK 12 PASS / 0 FAIL.
- diplo-peace-weaker-seeks-city-only-test: 32 pass / 0 fail.
- diplo-peace-stance-wiring-test: 10 pass / 0 fail.
- diplo-peace-balance-accept-test: 32 pass / 0 fail.
- diplo-war-peace-main-guard-test: 35 pass / 0 fail.
- ai-test: 297 passed, 0 failed.
- diplomacy-test: 149 passed, 0 failed.
- diplo-war-peace-sim-test (dług bazowy, bez regresji): 19 pass / 3 fail (S3, S4b, M_TUR) — identyczne nazwy jak na bazie.

NIE_ZMIERZONO: test na żywo w grze (Chromium); ścieżka AI→gracz w ai.ts (blok zmęczenia, ok. 7034–7055) nie przeszła mutacji behawioralnej — pokryta tylko helperem `wearyMilitaryShare` i testem statycznym wiringu.

## BLOKADY

Brak blokad technicznych. node_modules w gra/ zainstalowany (`npm ci --ignore-scripts`, 71 pakietów), nie commitowany; worktree do sprzątnięcia przez orkiestratora.

## RUNDY

Operator obrona: runda 1 (odpowiedź na zarzuty Evaluatora r1, ba57df779). Kolejna ocena Evaluatora wymagana.

## NASTĘPNY KROK

Evaluator r2: sprawdzić commit 2975a4fcb (zarzuty 1–3 przyjęte, zarzut 4 jako ograniczenie); potem Final Control. Uwaga 1 (pokój przy wymaganiu 0) wymaga pytania ABC do właściciela przed integracją lub jawnej decyzji „bez zmian”.

DEPLOY/PUSH: NIE WYKONANO
