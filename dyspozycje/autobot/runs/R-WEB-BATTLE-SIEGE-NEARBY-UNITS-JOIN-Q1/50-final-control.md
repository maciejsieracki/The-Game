# R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1 — Final Control (2026-11-10)

**Werdykt: FAIL — etap 8/11 pozostaje otwarty. Integracja niegotowa.** Kandydat: `8784fdd49c5eadb432ebb0e8e23359740bd7d9b5` (`/tmp/codex-siege-nearby-609`, `codex/siege-nearby-609`). Brak zarzutów Evaluatora nie zamyka dwóch rozbieżności względem `00-dispatch.md`: zmieniono plik poza zatwierdzoną allowlistą i nie ma wymaganego wpisu LEDGER dla tego tematu.

## Kontrola etapu 8

- **GOAL i ID:** zgodne w `00`, `10` i `20`. Zmiana rozszerza składy oblężniczych bitew na formalnych sojuszników uczestniczących w wojnie i zachowuje strony neutralne poza bitwą.
- **Zarzuty/obrona:** `20-evaluator.md` nie zgłasza zarzutów; obrona nie była wymagana. Ocenę kompletności i zakresu zweryfikowałem bezpośrednio na kandydacie.
- **Zakres:** większość diffu odpowiada zakresowi. `gra/src/game/diplomacy-siege-war-gate.ts` nie należy do dispatchowej allowlisty `gra/src/game/siege*.ts` ani do szczegółowej allowlisty w `10`. Evaluator uzasadnia helper formalnej wojny/sojuszu jako najwęższe wspólne miejsce, ale uzasadnienie nie zmienia zatwierdzonej allowlisty. To wymaga autoryzowanego rozszerzenia zakresu albo korekty Operatora w tej samej rundzie przed integracją.
- **LEDGER:** `00-dispatch.md` wymaga „Wpis LEDGER (REPIN Rust oblężenie P3+)”. W `dyspozycje/rust-port/LEDGER.md` widnieje ogólna kolejka oblężenia P3–P5, ale nie wpis wiążący tę konkretną funkcję do parytetu Rust P3+. `10` wyłącza rejestr/ledger z allowlisty, co tworzy sprzeczność dispatchu. Właściciel/orkiestrator powinien rozstrzygnąć ją i dodać wymagany wpis poza zmianami kodu produktu albo jawnie skorygować kryterium.
- **Testy i typy:** bezpośrednio uruchomiony `battle-siege-nearby-units-join-test.cjs` — **14/14 PASS**; `npm run typecheck -- --pretty false` — **PASS**. `git diff --check 2b0f49da4..HEAD` — **PASS**. Status kandydata wskazuje tylko nieśledzony raport `20-evaluator.md` poza commitem.
- **Brak regresji / ścieżki:** raport Evaluatora opisuje pozytywne przebiegi regresji dla limitu 500, odwodów, garnizonu/oblężenia, sortii, AI i oblężenia bez szturmu. Test skupiony bezpośrednio potwierdza podział ścieżek oraz członkostwo stron i konteksty właściciela.

## Przeglądarka

`/usr/bin/chromium` jest zainstalowany, lecz istniejący test `siege-blockade-no-recruit-reinforce-test.cjs` jawnie wskazuje `/opt/pw-browsers/chromium`; to różnica ścieżki środowiska. Nowy test składu oblężenia jest źródłowy i nie ma scenariusza live. Wynik live pozostaje **NIE_ZMIERZONO** — nie przypisuję mu PASS. Ta luka sama w sobie **nie blokuje** integracji tej nie-wizualnej zmiany logiki rosteru: dispatch uzależnia Chromium od dostępności, a bezwarunkowa bramka przeglądarkowa z `R-PROC-AUTOBOT.md` §9 poz. 6a dotyczy tematów wizualnych/UX. Nie wolno jednak opisywać wyniku browser jako PASS.

## Decyzja

Nie ma podstaw do integracji obecnego kandydata w ramach zatwierdzonego zakresu. Do ponownego Final Control potrzebne jest rozstrzygnięcie sprzeczności allowlisty/LEDGER oraz kandydat zgodny z zatwierdzonym zakresem. Po ich usunięciu zielone testy i typecheck są dobrym dowodem gotowości kodu; pomiar przeglądarkowy nie jest dodatkowym warunkiem dla tej ścieżki.
