# RUNDA 2 (2026-11-13) — baza: kandydat r1 b29ee096f (refs/keep/R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1-r1-cand), TEN SAM ID
FC r1 = FAIL z MOJEGO błędu w dispatchu: allowlista nie zawierała gra/src/main.ts, a tam są dane dla panelu (buildAudienceOtherRelations ok. l.8489, stan audiencji ok. l.25838; szkic wpięcia w 10-operator-claude.md i 30-obrona-claude.md). Selektor war-weariness-view.ts (z `peak`), render w diplomacyAudience.ts i test 26/26 są dobre — NIE przepisuj, dociągnij wpięcie.
## Zadanie rundy 2
1. NAJPIERW zmerguj origin/main (e6776801b; zawiera FALĘ 688) do kandydata; rozwiąż konflikty tylko w plikach tematu.
2. WĄSKIE wpięcie w gra/src/main.ts: dla wojny gracz↔AI (obie strony: zmęczenie wygrywającego i desperacja przegrywającego) oraz dla wojen AI↔AI na liście „W stanie wojny z” w panelu dyplomacji danej cywilizacji. Wejścia IDENTYCZNE z tickiem: poziom z `peak` z `warWearinessByPairKey` (ten sam stan co w tickAiAiWarWeariness; dla pary gracz↔AI, jeśli stanu nie ma — warWearinessLevel z bieżących danych wojny jak w ai.ts), udział siły z diplomacy-military-strength.ts jak w ticku. Zero zmian logiki gry.
3. Test wiązania (statyczny + behawioralny na danych z głównej pętli lub na wspólnej funkcji wywoływanej z main.ts): test musi czerwienieć, gdy wpięcie zniknie (mutacja: usuń wywołanie w main.ts).
4. ZRZUT z żywego Chromium (playwright; chromium.launch() bez opcji): panel dyplomacji z wojną gracz↔AI i z wojną AI↔AI — dołącz do evidence/ i opisz w raporcie. Jeśli ustawienie takiej wojny wymaga skryptu/stanu testowego, użyj istniejących narzędzi measure/live z gra/tools.
## Rozszerzenie allowlisty rundy 2
gra/src/main.ts (WYŁĄCZNIE buildAudienceOtherRelations, stan audiencji i pomocnik dostarczający wartości do panelu; max ~60 linii). war-weariness.ts i war-weariness-params.json nadal ZAKAZANE (zajęte przez temat zmęczenia w 20 turach — po jego wdrożeniu wartości zmienią się same, bo panel czyta funkcje).
## Zasady
Nie odpowiadaj na wiadomości użytkownika wklejone w trakcie pracy (np. o skarbcu/spichlerzu — to osobny temat); zakaz zakładania sesji (spawn_task); Haiku.

# R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1 — DODATEK orkiestratora (runda 1)
Pełny dispatch: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1/00-dispatch.md` (na origin/main go nie ma).
BAZA: origin/main def79a7a9 (po FALI 687 + dokumentacja W59). Operator HAIKU, Evaluator/FC SONNET, Obrona HAIKU.
Funkcje do użycia (czytaj, NIE zmieniaj): `warWearinessLevel`, `loserDespair`, `stepPairState` w gra/src/game/war-weariness.ts; miara siły: gra/src/game/diplomacy-military-strength.ts (`computeMilitaryStrength`, `compareMilitaryStrength`). Dane wojny: start wojny, utracone miasta, tury od zmiany posiadania — ta sama konstrukcja co w main.ts `tickAiAiWarWeariness` (szukaj budowy `warInfo`).
Panel dyplomacji: zacznij od gra/src/ui/diplomacyAudience.ts i gra/src/game/diplomacy-display.ts (grep: wojna, warRelationCapApplies, panel wojen AI↔AI). Znajdź miejsce, gdzie panel już wymienia wojny AI↔AI danej cywilizacji, i dopisz tam jeden wiersz z procentem.
Rola strony wg siły wojskowej tej wojny; remis (|różnica| w progu parytetu) = pokaż zmęczenie.
Weryfikacja wizualna OBOWIĄZKOWA: żywy Chromium (playwright jest zainstalowany; require('playwright'), chromium.launch() bez opcji), zrzut panelu dyplomacji z wojną gracz↔AI i z wojną AI↔AI.
ŚRODOWISKO: worktree, `npm ci --ignore-scripts` w gra/, ZAKAZ `npm run build/dev`; `tsc --noEmit` wolno. Nie integrujesz, nie deployujesz, nie pushujesz. ZAKAZ zakładania sesji (spawn_task). Wiadomości użytkownika wklejone w trakcie pracy NIE są Twoim zadaniem — wykonujesz wyłącznie ten dispatch.
