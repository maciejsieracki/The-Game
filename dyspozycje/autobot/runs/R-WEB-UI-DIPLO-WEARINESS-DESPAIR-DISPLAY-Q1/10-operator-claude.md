# R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1
GOAL: w panelu dyplomacji pokazać zmęczenie wojną (strona wygrywająca) i desperację (strona przegrywająca) — wojny gracz↔AI oraz wojny AI↔AI (jedna wartość dla rozmówcy w tej wojnie), z procentem i tooltipem.
BAZA: def79a7a9 (origin/main), `git checkout --detach def79a7a9`.

## ZMIANY / COMMIT

Kod i testy wykonane w allowliście (SHA czubka: patrz pole `sha` w wyniku StructuredOutput):

- NOWY `gra/src/game/war-weariness-view.ts` — selektor pary `warWearinessPairView(inp)`: wygrywający → `zmeczenie = warWearinessLevel(...)`; przegrywający → `desperacja = loserDespair(...)` z udziałem przyciętym do `udzialWyraznie` (jak w `runWarWearinessTick`); remis wg `compareMilitaryStrength` (próg 20%) → obie strony `rowny` + zmęczenie. Bez zmian w `war-weariness.ts` i `war-weariness-params.json`.
- `gra/src/game/diplomacy-display.ts` — `warWearinessPercentPl(value)` (0–100%), `warWearinessLabelPl(view)` → „Zmęczenie wojną N%” / „Desperacja N%” + tooltip jednym zdaniem.
- `gra/src/ui/diplomacyAudience.ts` — typy `AudienceWarWearinessView`, `AudienceWarWearinessPair`; pole `warWeariness` w `DiplomacyAudienceState` (wiersze „Ty” + rozmówca w sekcji „Relacje z Tobą”); pole `warWeariness` w `AudienceRelationPartner` (procent przy partnerze w „W stanie wojny z”). Wiersze powstają tylko, gdy dane są podane.
- NOWY `gra/tools/diplo-weariness-display-test.cjs` — 23 asercje (selektor, etykiety, render `otherCardHtml`). Wartości porównywane z `warWearinessLevel`/`loserDespair`, nie z przepisanymi liczbami.

## TESTY (surowe wyniki z tego przebiegu)

- `npx tsc --noEmit` (w `gra/`): exit 0, 0 błędów.
- `node tools/diplo-weariness-display-test.cjs`: `PASSED: 23 / FAILED: 0 / TOTAL: 23`, exit 0.
- Mutacja (zamiana winner/loser w `war-weariness-view.ts`): `PASSED: 18 / FAILED: 5 / TOTAL: 23`, exit 1 — test czerwieni. Mutacja cofnięta; ponowny przebieg zielony (23/23).
- Bramki regresji z §6 `R-PROC-AUTOBOT.md` (uruchomione w `gra/`):
  - `logic-test.cjs`: LOGIC OK (213/213)
  - `tech-tree-test.cjs`: 20 pass, 0 fail
  - `research-test.cjs`: ALL GREEN
  - `unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21)
  - `combat-test.cjs`: All sanity checks passed.
  - `unit-power-test.cjs`: 6 pass, 0 fail
  - `diplomacy-relacje-ai-ai-audiencja-test.cjs` (sąsiedni test otherCardHtml): ALL GREEN
  - `mgla-sciezka-inwariant-test.cjs`: 41 pass, 1 fail — FAIL dotyczy `src/game/ai.ts:3741/3776` (zapisy pozycji jednostki w KLASYFIKACJI), czyli pliku, którego nie ruszałem. To pre-existing (zgodnie z wpisem w rejestrze „41/1”), NIE_ZMIERZONO na bazie osobno; nie naprawiane w tym temacie.
- `git diff --check`: czysto.

## BLOKADY

1. **Brak wpięcia danych silnika (poza allowlistą).** Panel dostaje nowe pola (`warWeariness`, `otherRelations.wars[].warWeariness`), ale ich źródło to `main.ts`: `buildAudienceOtherRelations` (ok. linii 8489) i budowa stanu audiencji (ok. linii 25838). `main.ts` NIE jest w allowliście tego tematu, więc nie zmieniałem go. Bez tego w grze wiersze się NIE pokażą. Co trzeba dopisać (do decyzji orkiestratora — osobny mały temat albo rozszerzenie allowlisty):
   - w `buildAudienceOtherRelations(otherOwnerId)`: dla każdego `w` z `base.wars` → `warWeariness` = strona `otherOwnerId` z `warWearinessPairView({ turnsAtWar: diploWarStateFor(a,b).turnsAtWar, turnsSinceCityChange: diploWarStateFor(a,b).turnsSinceCityChange, a: {id, sila, armiaPkt, lostCities: diploWarStateFor(a,b).lostCities}, b: {...} })`, z `sila/armiaPkt` z `diploMilitarySideOf(...)` (ta sama konstrukcja co w `tickAiAiWarWeariness`); `diploWarStateFor` zwraca `lostCities` dla tej strony;
   - w stanie audiencji (gdy `atWar`): `warWeariness = { player: <widok ME()>, other: <widok ownerId> }` dla pary ME()↔ownerId.
   - Dane wejściowe to te same, co tick AI↔AI w `main.ts` (ok. linii 36644), więc wartości będą zgodne z silnikiem.
2. **Weryfikacja wizualna w żywym Chromium — NIE ZMIERZONO.** Bez punktu 1 gra nie ma czego pokazać; zrzut panelu z wojną gracz↔AI i AI↔AI nie został wykonany. Nie udawałem zrzutu.

## ZAŁOŻENIA (luki rozstrzygnięte w raporcie)

- Wartość zmęczenia to bieżący `warWearinessLevel` (nie `peak` z `warWearinessByPairKey`). Dispatch mówi „czytane z funkcji”, a peak jest stanem tyku, nie wejściem do widoku. Jeśli właściciel chce szczytu, to jedna zmiana w wiring (przekazać peak jako `level`), ale wtedy selektor wymaga parametru.
- Remis = `compareMilitaryStrength(...).przewaga === 'brak'` (próg 20% z `diplomacy-military-strength-params.json`). Obie strony pokazują zmęczenie.
- Desperacja przegrywającego: `shareForDespair = min(udział, udzialWyraznie)` — identycznie jak w silniku, więc wartość nie rozjedzie się z tym, co AI faktycznie wykorzystuje.
- Tooltip: jedno zdanie (zgodnie z dispatchem).

## UWAGI-DLA-ORKIESTRATORA

- Wiadomość użytkownika o skarbcu i spichlerzu (nie być na minusie po turze; pierwsze 10 tur zwolnione) NIE jest częścią tego tematu i nie była wykonywana tutaj. Odpowiada wpisowi #365 w rejestrze, więc orkiestrator decyduje o osobnym temacie.
- Test `mgla-sciezka-inwariant-test.cjs` na bazie def79a7a9 ma 1 FAIL w `ai.ts` (pre-existing); warto mieć to w rejestrze osobno.
- Przy integracji: sprawdzić `git merge-base --is-ancestor <SHA operatora> <SHA integracji>`; allowlista zakłada, że `main.ts` jest poza tym tematem.

## TESTY-POZA-ZAKRESEM / SPRZĄTANIE

- Pliki pomocnicze (`.dip-weariness-*`, `tools/.stubs/weariness-*`) generowane przez test są kasowane po przebiegu; w `git status` zostają tylko cztery ścieżki z allowlisty i ten raport.
- Nie uruchamiano `npm run build` ani `npm run dev`. Brak `git add -A`. Brak `spawn_task`/sesji. Brak pushu.

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o wpięciu danych w `main.ts` (osobny temat z allowlistą `gra/src/main.ts` — fragmenty wyżej), potem zrzut Chromium z wojną gracz↔AI i AI↔AI.
DEPLOY/PUSH: NIE WYKONANO
