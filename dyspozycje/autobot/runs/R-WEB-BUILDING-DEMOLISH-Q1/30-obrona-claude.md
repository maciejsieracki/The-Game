# R-WEB-BUILDING-DEMOLISH-Q1 — obrona Operatora, RUNDA 2/5 (HAIKU 5.5)

STATUS: PASS-WITH-NOTES (kod bez zmian w tej rundzie; zarzuty 1–3 rozstrzygnięte z dowodem; luka końca tury pozostaje NIE ZMIERZONO)
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-DEMOLISH-Q1 (WYBURZ, #175; odp. 22C + 28a)
GOAL: gracz wyburza każdy swój budynek z panelu miasta za połowę surowców (w dół); Pieniądz i Praca nie wracają; Mennica wg reguł właściciela; AI bez zmian.
BAZA/KANDYDAT: 792b294119c4b7582105005123cd616ab8f99cd1 (kod funkcji 3a00fd6ca, bez zmian). Runda 2 nie zmienia gra/.
ZMIANY-COMMIT: tylko ten plik (`30-obrona-claude.md`, runda 2 na górze; runda 1 zachowana niżej).

## Odpowiedzi na zarzuty Evaluatora (b53c8d1ea)

1. Ekonomia po wyburzeniu Mennicy — ODRZUCAM część logiczną z DOWODEM; żywy koniec tury pozostaje NIE ZMIERZONO.
   - Ekonomia liczy bonus przez `ownersWithMennica(cities, builtByCity)`: `gra/src/game/turn-economy.ts` l.2228 i l.2871 (na każdy tick). Funkcja (l.298–307) zwraca właściciela tylko gdy `builtByCity` stolicy zawiera `mennica`. Wyburzenie czyści tę listę, więc bonus znika.
   - `gra/tools/building-demolish-test.cjs` sekcja [7]: przed wyburzeniem właściciel 1 ma bonus, po `demolishBuilding(st,'stolica','mennica')` bonus znika. Wynik: 36 pass / 0 fail.
   - Mennica poza stolicą nie daje bonusu (ta sama bramka): mint-orphan 28/0, mint-capital-only 8/0.
   - NIE ZMIERZONO: koniec tury w przeglądarce i odczyt HUD po turze.

2. Zrzut 02 bez okna potwierdzenia — ODRZUCAM z DOWODEM. Okno to natywny `window.confirm`; treść przechwycona w `zrzuty/wyburz-live.json` (`dialogsAll`): „Wyburzyć „Pałac”? / Zwrot surowców: brak (połowa kosztu, w dół). / Pieniądz i Praca nie wracają. Efekty budynku znikną od następnej tury.” Ograniczenie zrzutu headless, nie błąd gry.

3. Zwrot liczony z `buildingStockCost` na danych bazowych — ODRZUCAM z DOWODEM.
   - Płatność i zwrot używają tej samej funkcji i danych: budowa `gra/src/ui/cityPanel.ts` l.6360–6363 (`buildingStockCostForItem` → `buildingStockCost(def)`); zwrot `gra/src/game/building-demolish.ts` (`paidStockCostForBuilding` → `buildingStockCost(cur)`).
   - `buildingStockCost` (`gra/src/game/building-stock-cost.ts`) przyjmuje tylko definicję budynku, bez argumentu ustawienia. Mnożniki: stała `R_STAWKI_FALA2_MULT = 2` (`gra/src/game/r-stawki-strojenie.ts` l.9) i era `buildingEraCostMultiplier(epokaWejscia)`.
   - Przeszukanie `gra/src` nie znalazło ustawienia „koszt ulepszeń wg epoki”. Jedyne ustawienie z epoką (`newGameFlow.ts` l.1880, „Wzrost surowców z epoką”) dotyczy produkcji, nie kosztu budowy.
   - Wniosek: zwrot = floor(zapłacone/2). Żywej zmiany ustawień nie testowano (NIE ZMIERZONO), ale brak ścieżki, którą ustawienie zmieniałoby koszt między budową a wyburzeniem.

## Bramki (liczby z surowego wyjścia; worktree na 792b29411; `gra/node_modules` z `npm ci --ignore-scripts`)
- `tsc --noEmit`: exit 0
- `tools/building-demolish-test.cjs`: RESULT 36 pass / 0 fail
- `tools/mint-orphan-test.cjs`: 28 PASS / 0 FAIL
- `tools/mint-capital-only-test.cjs`: 8 PASS / 0 FAIL
- `tools/logic-test.cjs`: LOGIC OK (213/213)
- `tools/tech-tree-test.cjs`: 20 pass, 0 fail
- `tools/research-test.cjs`: ALL GREEN (33/0)
- `tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21)
- `tools/combat-test.cjs`: All sanity checks passed (6/6)
- `tools/ai-test.cjs`: ai-test: 297 passed, 0 failed

Uwaga: w tej rundzie nie powtórzono live w Chromium (kod bez zmian; zrzuty i JSON z rundy 2 Operatora pozostają w `zrzuty/`).

## BLOKADY
- Techniczne: brak.
- Decyzyjne: wyjątki strukturalne wg odp. 28a — bez wyjątków; zakaz podczas oblężenia to runda 3 (#181). Bez zmian w tej rundzie.

RUNDY: 2/5 (runda 1: Operator → FC PASS-WITH-NOTES; runda 2: obrona przed zarzutami Evaluatora)
NASTĘPNY KROK: Final Control (rozstrzygnięcie zarzutów 1–3; luka końca tury w NIE ZMIERZONO)
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: Nie tworzono sesji ani zadań (zakaz). `gra/node_modules` usunięto po testach. Zarzut 1 (koniec tury) to jedyna żywa luka; orkiestrator decyduje, czy ją domknąć przed deployem.

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-DEMOLISH-Q1 (WYBURZ, #175; odp. 22C właściciela)
GOAL: gracz może wyburzyć każdy swój budynek z panelu miasta za zwrotem połowy surowców (zaokrąglenie w dół); Mennica wg reguł właściciela; AI bez zmian.
ZMIANY-COMMIT: baza f2c332c1d (kandydat); runda obrony 1 (Operator Haiku). Zmienione pliki:
  - gra/src/game/building-demolish.ts: wydzielona czysta funkcja refundFromPaidCost(paid) (połowa w dół + pominięcie wpisów 0); demolishRefundFor deleguje do niej. Zachowanie w grze bez zmian (koszty i tak parzyste).
  - gra/tools/building-demolish-test.cjs: eksport refundFromPaidCost; nowa sekcja [9] (51 -> 25, 3 -> 1, 1 -> pominięte, mieszane, pusty).
  - gra/src/main.ts: wcięcie hooka onDemolishBuilding w drugim configureCityPanel poprawione z 6 na 8 spacji (tylko białe znaki i komentarz).
  SHA: patrz sekcja „sha” w StructuredOutput (czubek commita obrony).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
  1. (zaokrąglenie w dół nieprzetestowane) PRZYJMUJĘ. Dowód: mutacja Math.floor -> Math.ceil w refundFromPaidCost daje 4 FAIL (51 drewna -> 26; 3 kamienia -> 2; 1 cegły -> 1; mieszane -> 26). Poprawka: reguła wydzielona do refundFromPaidCost i testowana na nieparzystych wartościach. Uwaga: w danych gry zaokrąglenie nie jest widoczne, bo koszty są zawsze parzyste (FALA2 ×2; mnożnik ery 1/2/4), więc mutacja na samych danych przechodziła z przyczyny strukturalnej, nie z braku uwagi.
  2. (brak asercji pomijania zerowych wpisów) PRZYJMUJĘ. Dowód: mutacja usuwająca if (half > 0) daje 2 FAIL (cegla: 0 w zwrocie; mieszane -> {drewno:25,kamien:0,cegla:0}). Asercja dodana w sekcji [9].
  3. (wcięcie hooka) PRZYJMUJĘ. Poprawione w gra/src/main.ts (drugi blok, 8 spacji).
  4. (wyjątki strukturalne: Ratusz/cuda/mury w oblężeniu/Palac) PRZYJMUJĘ jako DECISION_REQUIRED, BEZ zmiany kodu w tej rundzie. Dispatch zakazuje rozstrzygania tego przez Operatora. Skutki do oceny właściciela: Palac wpływa na hasPalac (conquest-stability), korupcję (economy.ts) i ulepszenia (building-upgrades.ts); wyburzenie Palacu nie ma dziś blokady. Wymaga odpowiedzi właściciela (wariant A: wszystko wyburzalne; wariant B: Palac i cuda zablokowane), zanim zostanie dodana blokada.
  5. (UI niezweryfikowane na żywo) PRZYJMUJĘ jako NIE ZMIERZONO. Zrzutu z przeglądarki nie wykonano w tej rundzie (brak live buildu do /tmp; zakres rundy: poprawki zarzutów 1–3). Test [8] nadal jest wyłącznie źródłowy (dopasowanie tekstu).

TESTY (surowe wyniki z tej rundy):
  - node tools/building-demolish-test.cjs: RESULT: 36 pass / 0 fail
  - mutacja Math.floor -> Math.ceil (building-demolish.ts): 32 pass / 4 fail (czerwona, wykryta)
  - mutacja usunięcia if (half > 0): 34 pass / 2 fail (czerwona, wykryta)
  - po przywróceniu pliku: 36 pass / 0 fail
  - cd gra && node node_modules/typescript/bin/tsc --noEmit -p . : exit 0
  - node tools/mint-orphan-test.cjs: 28 PASS / 0 FAIL
  - node tools/mint-capital-only-test.cjs: 8 PASS / 0 FAIL
  - NIE ZMIERZONO: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0 (nie uruchamiano w tej rundzie; zmiana obejmuje tylko czysty moduł wyburzania i wcięcie w main.ts).
  - Środowisko: w worktree wykonano npm ci --ignore-scripts w gra/ (tylko zależności, bez npm run build/dev). node_modules usunięto po pracy.

BLOKADY: brak wpływu na kod poza pytaniem o wyjątki strukturalne (pkt 4) i live UI (pkt 5), oba opisane wyżej.

RUNDY: 1/5 (obrona). Werdykt Evaluatora: zarzuty 1–5 jak w dispatchu.

NASTĘPNY KROK: Evaluator ponownie na SHA obrony; decyzja właściciela o wyjątkach strukturalnych (DECISION_REQUIRED) przed domknięciem; live w przeglądarce do wykonania przed deployem.

DEPLOY/PUSH: NIE WYKONANO
