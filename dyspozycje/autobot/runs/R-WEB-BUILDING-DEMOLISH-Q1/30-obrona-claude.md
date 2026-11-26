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
