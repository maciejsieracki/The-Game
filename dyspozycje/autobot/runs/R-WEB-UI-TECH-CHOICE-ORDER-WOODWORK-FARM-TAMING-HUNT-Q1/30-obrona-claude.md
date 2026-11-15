# R-WEB-UI-TECH-CHOICE-ORDER-WOODWORK-FARM-TAMING-HUNT-Q1 — obrona Operatora wobec zarzutów Evaluatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-TECH-CHOICE-ORDER-WOODWORK-FARM-TAMING-HUNT-Q1
GOAL: w sekcji „Możesz wybrać” na starcie nowej gry cztery badania w kolejności: Obróbka drewna, Rolnictwo, Oswojenie zwierząt, Łowiectwo. Zmiana tylko kolejności wyświetlania listy wyboru (bez kosztów, wymagań, efektów, drzewka i AI).
BAZA: cde7cfcbb (origin/main). Kandydat: e9e532b436c198b21fe3e59e702c1eb1212c45dd (rodzic cde7cfcbb).
ZMIANY/COMMIT: ten plik raportu (commit obrony na bazie e9e532b43). Kod nie został zmieniony w tej rundzie. Kod kandydata e9e532b43 nie był modyfikowany.

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 (NIE_ZMIERZONO end-to-end, zrzut z harnessu, koszt 5 PN vs 40 PN) — PRZYJMUJĘ jako uwagę informacyjną, bez zmiany kodu
- Potwierdzenie: 10-operator-claude.md (sekcja BLOKADY w e9e532b43) zawiera wpis NIE_ZMIERZONO dla pełnej gry (start przez menu/kreator).
- Zrzut `mozesz-wybrac-po.png` pochodzi z harnessu, nie z pełnej gry. Koszt 5 PN w zrzucie wynika z tego, że `costFor` w harnessie jest tożsamościowe. Kod kosztów nie był zmieniany, więc nie wpływa to na GOAL.
- Nie uruchamiałem pełnej gry w tej rundzie. Brak dowodu end-to-end pozostaje otwarty i trafia do UWAG-DLA-ORKIESTRATORA.

### Zarzut 2 (na zrzucie brak „+ PLAN”, tylko „Karta”) — ODRZUCAM jako defekt kandydata; dowód:
- `git diff cde7cfcbb e9e532b43 -- gra/src/ui/scienceHubHud.ts` ma 0 linii (zmiana nie dotyka renderu).
- Przycisk „+ PLAN” powstaje wyłącznie w gałęzi `else if (!lockedRow && canEnqueue)` (scienceHubHud.ts:696 w e9e532b43).
- `canEnqueue = config.onEnqueue !== undefined || config.getPlan !== undefined` (scienceHubHud.ts:541). Harness montujący HUD nie podaje tych callbacków, więc przycisk nie jest renderowany. Jest to stan bazowy harnessu, a nie regresja.
- Kolejność w DOM na zrzucie pochodzi z `.sh-item:not(.locked) .sh-name` i zgadza się z oczekiwaną kolejnością (wynik z raportu Operatora 10-operator-claude.md, sekcja TESTY).

### Zarzut 3 (tabela w kodzie, nie w tech.json; brak wzmianki w docs/Civpedia; wikiBundle niezregenerowany) — PRZYJMUJĘ z dowodami
- Tabela w kodzie jest zgodna z dispatchem (dopuszczony wariant „tabela w jednym miejscu”): `HUB_START_TECH_ORDER` w scienceHubSnapshotLogic.ts.
- Dowód, że AI i drzewko nie są dotknięte:
  - `git grep -l 'scienceHubSnapshotLogic\|buildHubTechEntries' e9e532b43 -- gra/src/ai` → 0 trafień.
  - Użycia `buildHubTechEntries` w e9e532b43: sciencePicker.ts:29 (import) i :490 (wywołanie, hub); testy `science-hub-test.cjs` i `tech-choice-order-test.cjs`.
  - `recruit-list-order.ts` wspomina `scienceHubSnapshotLogic.ts` wyłącznie w komentarzu (linia 17), bez importu.
- Dokumenty: `git grep -c 'Możesz wybrać' e9e532b43 -- docs` → 0 trafień. Nie ma opisanej kolejności w docs/Civpedia, więc wikiBundle nie był regenerowany (zgodnie z dispatchem: „jeśli gdzieś opisana kolejność”).
- Wzmianka z dispatchu o `sortTechs`/`tech.json` nie ma zastosowania: w tech.json nie ma pola kolejności (potwierdzone w 10-operator-claude.md), a alfabetyczne sortowanie żyło w `buildHubTechEntries`.

## Stan bramek (liczby z raportów Operatora i Evaluatora; w tej rundzie nie uruchamiałem ich ponownie)
Źródło: 10-operator-claude.md (e9e532b43) i raport Evaluatora (af7f15aab).
- tsc --noEmit: EXIT=0 (Operator i Evaluator).
- logic-test: 213/213; tech-tree-test: 20/0; research-test: 33/0; unit-replace-test: 21/21; combat-test: 6/6; science-hub-test: 7/0; tech-choice-order-test (nowy): 9/0.
- Mutacja (baza): 6 pass / 3 fail, pierwsza kolejność Łowiectwo, Obróbka drewna, Oswojenie zwierząt, Rolnictwo.
- `git diff --check`: czysty.
- Nie zmieniano kodu w tej rundzie, więc wyniki nie wymagały ponownego uruchomienia.

## Uwagi informacyjne z tej obrony
- Dysk: w chwili pracy `df -h /` pokazywało 3.5G wolnego (92% użycia). Zgodnie z regułą orkiestratora (web wymaga ≥4 GB przed startem) orkiestrator powinien to rozważyć przed kolejnym etapem.
- Worktree Operatora miał zainstalowane `gra/node_modules` (npm ci --ignore-scripts, zgłoszone w 10-operator-claude.md). Do sprzątania po integracji.

BLOKADY:
- NIE_ZMIERZONO: pełna gra „nowa gra → panel badań” (zarzut 1, bez zmian w tej rundzie).
- Brak zmian kodu w obronie; kandydat e9e532b43 nie był modyfikowany.

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje obronę. Po FC PASS orkiestrator integruje kandydat e9e532b43 (sprawdzić `git merge-base --is-ancestor e9e532b43 <SHA integracji>`) i decyduje o deployu ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Zarzut 1 (pełna gra, end-to-end) nadal wymaga pomiaru; orkiestrator może zlecić osobny temat weryfikacji w pełnej grze, jeśli właściciel tego chce. Nie zakładam sesji (zakaz).
- Raport Evaluatora (af7f15aab) jest tylko lokalnie na gałęzi eval-tech-order, bez push. Obrona nie pushuje.
