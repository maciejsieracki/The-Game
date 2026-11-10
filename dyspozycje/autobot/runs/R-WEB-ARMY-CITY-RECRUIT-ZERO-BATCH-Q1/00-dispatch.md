# R-WEB-ARMY-CITY-RECRUIT-ZERO-BATCH-Q1
STATUS: REGISTERED — 1/11
DOMAIN: GAME/UI
MODEL: Operator/Evaluator/Final Control gpt-6-luna high, osobno i sekwencyjnie.
GOAL: W panelu Armia, sekcja rekrutacji pogrupowana miastami (screenshot Ateny/Sparta), domyślna ilość każdej pozycji 0. Gracz ustawia plusami ilości per miasto i typ; jeden przycisk „Rekrutuj wszystko” zamawia dokładnie te ilości w tych miastach, bez klikania każdego wiersza. Dwa równoważne przyciski u góry i dołu całej listy. Osobny panel HUD Rekrutacja pozostaje bez zmian na wyraźne polecenie właściciela.
Wymagania: zachować istniejące koszty/technologie/rekrutów/kolejki/callbacki, nie redystrybuować zamówień do innych miast. Wyłączyć globalne akcje przy samych zerach; nie rekrutować pozycji 0. Po częściowym sukcesie odjąć przyjęte ilości, pozostawić niezrealizowane z jasnym komunikatem; nie gubić wyborów po odświeżeniu lub zakupie innej pozycji. Odrębne miasto nie może nadpisywać ilości tego samego typu w innym mieście. Pojedyncze przyciski nadal działają. Zero dotyczy wyłącznie tego widoku, bez niezamierzonej zmiany zwykłego panelu miasta.
ALLOWLIST: ten run; początkowo rozpoznanie gra/src/ui/empireDetailPanel.ts, unitRecruitCard.ts, cityPanel.ts, main.ts i istniejących typów/adapterów. Przed kodem dopisać konkretną minimalną allowlistę i plan. Brak zmian danych/balansu. Uwzględnić najnowsze zatwierdzone poprawki odmiany językowej.
TESTY: rzeczywiste renderery + dwa miasta, różne typy, 0 początkowo, plusy/zmiana ręczna, przyciski oba, dokładne callbacki city/type/quantity, budżet częściowy, odświeżenie bez utraty draftów, pojedynczy zakup oraz zwykły panel miasta bez regresji. Typecheck. Chromium widoczność/klikalność w granicach ekranu przy150%, jeśli dostępne; /usr/bin/chromium, file:// blokowane — HTTP/page.setContent, nie obchodź blokady. Jeden ciężki Chromium naraz.
Cel11/11: Operator→Evaluator→warunkowaObrona→FinalControl→main→Robocza→push/readback→cleanup. Bez samodzielnego deployu/operatorpush; commit kandydata tylko własne pliki.

## Operator scope amendment — 2026-11-10

Latest owner clarification: in the separate “Rekrutacja — cała cywilizacja” panel retain only the top global button and remove its bottom duplicate. The Army panel still has equivalent global buttons above and below its city list. Do not remove the separate panel or its recruitment function.

**Minimal allowlist before implementation**
- `gra/src/ui/empireDetailPanel.ts` — Army city-group draft quantities, global top/bottom actions, exact per-city/type submissions and partial-result handling.
- `gra/src/ui/cityPanel.ts` — integration only if needed to pass the Army-specific draft/callback behavior to the shared city recruitment cards; preserve ordinary city-panel default quantity 1 and existing submission behavior.
- `gra/src/ui/unitRecruitCard.ts` — only if the shared card needs a scoped Army-only quantity/default/stepper hook; preserve normal city and HUD defaults.
- `gra/src/ui/empireRecruitPanel.ts` — remove only the lower duplicate global action; retain the upper action and all panel functionality.
- `gra/src/main.ts` — only the existing Empire/Army recruitment callback adapter, if required to preserve exact requested city/type/quantity and accepted-quantity results.
- `gra/tools/empire-recruit-all-test.cjs` — minimally change expected global-button count from 2 to 1 and assert the remaining button is the top action; preserve all other assertions.
- `gra/tools/<Army city recruitment real-render test>` — add/extend actual-renderer coverage for two cities/different types, zero initial drafts, exact quantities/city callbacks, both Army global buttons, per-city/type isolation, reset/partial accepted quantity, re-render/refresh persistence, one-at-a-time purchase, and ordinary city-panel default quantity 1. Use the existing relevant real-render gate if present; add one file only if none exists.
- `dyspozycje/autobot/runs/R-WEB-ARMY-CITY-RECRUIT-ZERO-BATCH-Q1/00-dispatch.md` and `10-operator.md` — scope and operator report.

No balance/data changes. Keep the separate HUD Rekrutacja behavior unchanged. Preserve existing costs, technology/recruit eligibility, queues, and cost callback path. Draft identity must include city and unit type. Global actions must be disabled for all-zero drafts, submit only positive selected amounts to their selected cities, subtract accepted quantities only, and leave any unaccepted quantities visible with a clear message. Persist drafts across refresh and the submission/re-render path. Out of scope: unrelated UI/code cleanup, gameplay rules, recruitment prices/data, AI behavior, and changes to the ordinary City panel's default quantity.

**Implementation/check plan:** inspect the existing draft/persistence and callback path; make a per-city/per-type Army-only draft path that feeds existing city recruitment callbacks without changing the ordinary City/HUD path; remove just the lower civilization-wide duplicate; add actual-render tests for the listed scenarios; run focused recruitment gates and TypeScript check. If Chromium is available, run the actual renderer via HTTP/page content at 150% zoom and check both Army buttons' visibility/clickability. Do not use `file://` or run more than one heavy Chromium process. Operator does not integrate, deploy, or push.
