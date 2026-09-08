STATUS: OBRONA
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL: Odpowiedź Operatora na 2 zarzuty Evaluatora rundy 2 (`06-evaluator-runda2.md`), z osobnym
DOWODEM na każdy.

## Zarzut 1 — brak żywego dowodu na realnym `main.ts::commitBuildRequest` (punkt (c))

**PRZYJMUJĘ CZĘŚCIOWO.** Evaluator ma rację co do faktu: `stadnina-kon-koszt-test.cjs` woła
`deductBuildingStockCostAcrossCities` i warunek bramki równolegle, nie przez sam
`commitBuildRequest` (main.ts nie jest modułem — funkcja żyje jako domknięcie `boot()`, jak
słusznie zauważa Evaluator, z precedensem `ai-buduje-budynki-test.cjs`).

DOWÓD, że próba obejścia tego istniejącym mechanizmem NIE JEST możliwa bez naruszenia
allowlisty tej rundy:
- `main.ts` już ma hak testowy `window.__buildRequestTestDebug` (linia 22197) z metodą
  `applyBuildRequest: (req) => applyBuildRequest(req)` — to WOŁA realny `commitBuildRequest`
  (bo `applyBuildRequest` dla stadniny na pustym heksie nie wymaga modala potwierdzenia —
  `needsConfirm` fałszywy, więc leci prosto do `commitBuildRequest(req, impact)`). Ten hak
  JUŻ ISTNIEJE w main na potrzeby innego, wcześniej zamkniętego tematu
  (P-AI-PRZYCISK-BUDUJ-REGRES-OBYWATELE-Q1) — użycie go nie wymaga ŻADNEJ zmiany main.ts.
- PROBLEM: żeby ten hak dał żywy dowód punktu (c), trzeba w żywej grze podnieść magazyn 'kon'
  imperium do >=50 PRZED próbą budowy. Sprawdziłem: main.ts NIE eksponuje dziś żadnego
  settera magazynu 'kon' ani forsera złoża konia (`Nakladka.ZlozeKonia`) — analogicznego do
  istniejących `forceCopperDeposit`/`forceForestNoDeposit` w tym samym obiekcie (dla innych
  surowców/nakładek). Sam real-trade-route (handel 'kon', już potwierdzony rundą 1) wymaga
  dziesiątek tur i osobnej infrastruktury dyplomacji w headless Chromium — nieproporcjonalne
  do jednej bramki i nadal wymagałoby przynajmniej odczytu stanu z main.ts.
- Dodanie NOWEJ metody do `__buildRequestTestDebug` (np. `setCityKonStock`/
  `forceHorseDeposit`) to zmiana main.ts POZA trzema punktowymi zakresami z decyzji
  orkiestratora rundy 2 (12538-12539, 12921-12969, 4619/6860-6862) — R-PROC-AUTOBOT §14
  zakazuje Operatorowi samodzielnego rozszerzania allowlisty, niezależnie jak niewinny
  (test-only) byłby dodatek.

WNIOSEK: zarzut jest słuszny co do faktu, ale naprawa wymaga decyzji o rygorze/allowlist, nie
jest czymś, co mogłem zrobić w granicach tej rundy bez naruszenia bariery krytycznej. Zgadzam
się z Evaluatorem, że BLOKADY pkt 1 poprawnie kwalifikuje to jako wymagające decyzji, nie jako
coś do cichego pominięcia. PROPONUJĘ (do orkiestratora/właściciela, nie decyduję sam): wąski
DECISION_REQUIRED na rundę 3 — dopisać do allowlisty main.ts DOKŁADNIE dwie linie w istniejącym,
już-scalonym obiekcie `__buildRequestTestDebug` (setter magazynu + forcer złoża konia, wzorem
`forceCopperDeposit`/`forceForestNoDeposit` tamże), żeby `stadnina-kon-koszt-test.cjs` (lub
nowy `stadnina-kon-koszt-live-test.cjs`) mógł realnie wywołać `applyBuildRequest`→
`commitBuildRequest` w zbudowanej grze (vite build + headless Chromium), zamiast symulacji
równoległej. Do czasu tej decyzji uznaję punkt (c) za NIEZAMKNIĘTY na poziomie żywego dowodu
literalnie wymaganym przez REGUŁĘ PRZECIW SAMOOSZUKIWANIU — zgodnie z oceną Evaluatora.

## Zarzut 2 — nieautoryzowana regresja AI (`pickAutoImprovements`, poza allowlistą)

**PRZYJMUJĘ W CAŁOŚCI.** Świeży grep potwierdza dokładnie to, co pisze Evaluator:

```
gra/src/game/auto-improvements.ts:524:  const qualifies = buildImprovementQualifier(state);
```

`state` budowany wcześniej w tej funkcji NIE ustawia ani `horseStockAvailable` ani
`tradeRouteKonUnlocked` (potwierdzone: brak obu identyfikatorów w całym pliku
`auto-improvements.ts` poza samym importem `buildImprovementQualifier`). Po retirowaniu
Modelu B w `livestock-unlock.ts` (runda 2, w allowliście) `ImprovementBuildState` domyślnie
daje `horseStockAvailable ?? 0` i `!!state.tradeRouteKonUnlocked` = `false`
(`improvement-build.ts:931-932`) — więc dla AI `isLivestockUnlockedForPlacement('stadnina', …)`
zwraca `true` WYŁĄCZNIE gdy heks ma realne złoże konia. AI/automat miasta trwale traci
możliwość budowy stadniny poza złożem, niezależnie od pełnego magazynu imperium — dokładnie
jak opisuje Evaluator.

To NIE JEST coś, co mogę jednostronnie zakwalifikować jako "zamierzoną konsekwencję" — mój
własny raport (`05-operator-runda2.md`, BLOKADY pkt 2) już to opisał jako fakt, ale bez
autoryzacji orkiestratora/właściciela taka kwalifikacja jest przekroczeniem roli Operatora
(dokładnie zarzut Evaluatora). `auto-improvements.ts` nie jest w allowlist tej rundy — nie
mogę go naprawić teraz. Zgadzam się z Evaluatorem: wymaga wąskiego DECISION_REQUIRED do
orkiestratora/właściciela, z uwagi na udokumentowaną wysoką wagę projektu dla tej kategorii
błędu (bramka „AI stawia budynki", żądanie właściciela „żeby to już nigdy nie wróciło").
PROPONOWANE OPCJE do decyzji (nie wybieram sam):
  (a) rozszerzyć allowlistę o `auto-improvements.ts` w rundzie 3, wpiąć tam ten sam odczyt
      magazynu 'kon' (symetrycznie do main.ts) — najbliższy duchowi tego tematu (AI płaci
      tak samo jak gracz);
  (b) świadomie zaakceptować regresję AI (jako koszt bezpieczeństwa ekonomii) z jawnym
      podpisem właściciela;
  (c) cofnąć zmianę semantyki w `livestock-unlock.ts` do czasu, aż (a) będzie gotowe w tej
      samej fali.

## Podsumowanie

Oba zarzuty PRZYJĘTE. Żaden nie jest, w mojej ocenie, defektem kodu w zakresie allowlisty tej
rundy (main.ts diff: dokładnie dwa hunki, `git diff -- gra/src/main.ts`:
`@@ -12537,6 +12537,11 @@` i `@@ -12937,9 +12942,37 @@`, poza tym main.ts nietknięty —
potwierdzone świeżo, linie 4619/6860 poza diffem) — oba wymagają decyzji o rygorze dowodu /
rozszerzeniu allowlisty, nie cichej naprawy przeze mnie. Nie zmieniam kodu w tej Obronie.

TESTY: bez zmian względem `05-operator-runda2.md` (żadna linia kodu nie została tu
zmodyfikowana — Obrona to wyłącznie analiza + weryfikacja grepem/diffem).

BLOKADY:
1. Zarzut 1 — DECISION_REQUIRED: poziom rygoru dowodu dla punktu (c) / rozszerzenie
   allowlisty main.ts o setter testowy w `__buildRequestTestDebug`.
2. Zarzut 2 — DECISION_REQUIRED: `auto-improvements.ts` poza allowlistą, AI traci zdolność
   budowy stadniny poza złożem — wymaga decyzji orkiestratora/właściciela (opcje a/b/c wyżej).

RUNDY: 2/5
NASTĘPNY KROK: Final Control (Ścieżka A, Workflow) ocenia, czy oba DECISION_REQUIRED wymagają
przerwania do właściciela przed rundą 3, czy Final Control może sam rozstrzygnąć w granicach
R-PROC-AUTOBOT.
DEPLOY/PUSH: NIE WYKONANO
