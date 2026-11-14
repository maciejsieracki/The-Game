# DODATEK 1 (runda 2/5) — R-WEB-UI-CITY-EMPTY-QUEUE-WORK-TO-POOL-HINT-Q1
BAZA: kandydat 288b5a798d5b1fb81966fb238fc302afe6a887ba (gałąź web-wip/R-WEB-UI-CITY-EMPTY-QUEUE-WORK-TO-POOL-HINT-Q1).
FC FAIL r1: wadliwa asercja „0% Budynki, pusta kolejka, komunikat nieobecny" w gra/tools/city-empty-queue-work-to-pool-hint-real-render-test.cjs — minimum podziału to 50% (cities.ts:433), setSplit(0) przycina do 50%, więc komunikat słusznie jest widoczny. Kod UI (cityPanel.ts) POPRAWNY — NIE ZMIENIAĆ.
NAPRAW: usunąć lub poprawić tę asercję (np. sprawdzić, że przy minimum 50% komunikat jest widoczny); oczekiwany wynik 15/0 albo 16/0. Uruchomić test w Chromium z node_modules (npm ci wg procedury), mutacja nadal czerwieni, tsc, 5 bramek. Zarzuty 2–3 Evaluatora oddalone.
Zakaz zmian silnika i cityPanel.ts. Dispatch bazowy: 00-dispatch.md (tylko na gałęzi docs).
