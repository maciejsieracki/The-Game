# R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1 — raport Operatora (runda 2/5, po FC FAIL r1)

STATUS: PASS-WITH-NOTES (pomiar wykonany w Chromium; wiersz C nie zmierzony; decyzje K1–K4 dla właściciela)
DOMAIN: GAME (bramka „Zakończ turę” NNS po wczytaniu zapisu; TYLKO diagnoza, zero zmian w gra/src, gra/data)
TEMAT: R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1
GOAL: ustalić przyczynę braku prognozy NNS w świeżej turze 1 (zarzut 2 Evaluatora r1), zmierzyć wiersze B i C tabeli (zarzut 3), zachować narzędzie i dowody r1.
BAZA: `85e190d125b528f364c0762e9e1e61651d5f66ac` (origin/main + obrona r1). Ta runda: commit z raportem i narzędziami nad bazą.
ŚRODOWISKO: `npm ci` w worktree (gra/), bundle `vite build --outDir` poza repo (scratchpad), Chromium `/usr/bin/chromium` (playwright). Load średnio 5,45 na starcie (dispatch wymaga < 3) — NIE ZMIERZONO wpływu na czasy, wyniki logiczne bez zmian.

## ZMIANY/COMMIT
- Allowlista: `gra/tools/nns-gate-r2-measure.cjs` (nowy, pomiar B/C), `gra/tools/nns-gate-r2-h2-probe.cjs` (nowy, test H2), `runs/R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1/10-operator-claude.md` i `evidence/r2-*`. Narzędzie r1 `gra/tools/nns-gate-after-load-repro.cjs` bez zmian (użyte ponownie jako wiersz A).
- `git diff --name-only 85e190d..HEAD` dotyczy wyłącznie allowlisty; zero zmian w `gra/src`, `gra/data`, WERSJE.md, manifeście.
- Haka civTest w src NIE dodawano (zgodnie z dispatchem); test H2 wykonano istniejącym hakiem `__nnsMeasureDebug.forceGateRecompute()` (markCityStateDirty + updateHud).

## TESTY (surowe liczby)
- `tsc --noEmit -p .` → exit 0, wyjście puste (`evidence/r2-tsc.out`, 0 linii).
- Bramki referencyjne (exit 0): logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0 / TOTAL: 33`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`.
- Dowód mutacyjny: NIE DOTYCZY (brak zmiany kodu gry).

## 1. PRZYCZYNA BRAKU PROGNOZY W ŚWIEŻEJ TURZE 1 (zarzut 2) — ustalona dla scenariusza playtest
**Pomiar (H2, `evidence/r2-H2-playtest-forceGateRecompute.json`):** świeża gra `?playtest=mapa`, tura 1: odczyt bramki (dwa wywołania) → `prognoza: null`, `bramkaBlokuje: false`. Po `__nnsMeasureDebug.forceGateRecompute()` (= `markCityStateDirty()` + `updateHud()`, bez nowego haka): `prognoza: {tura: 1, spichlerzPo: -48, skarbiecPo: 4907}`, `bramkaBlokuje: true`, komunikat „Spichlerz państwa: zabraknie 46”. Ta wartość jest identyczna z wartością po `loadSlot` (r2-A, E1/E2b). Wniosek: cache nie był przeliczony, a nie że wczytanie zmienia prognozę.

**Mechanizm (kod, `gra/src/main.ts`):**
- `refreshLiveEmpireRates` (~23068–23080): zwraca od razu, gdy `empireEconDirty` = false; w przeciwnym razie zeruje flagę PRZED `refreshLiveEmpireRatesUnsafe`.
- `refreshLiveEmpireRatesUnsafe` (~23085–23090): przy 0 miastach gracza ustawia `_nnsHumanForecast = null` i wraca bez przeliczenia.
- Scenariusz `playtest=mapa` dokłada miasto gracza przez `cities.push(c)` (~48994) i w tym oknie (48980–49060) NIE ma żadnego `markCityStateDirty()` ani `updateHud()`. Flaga została więc wyzerowana wcześniej (przez wywołanie przy zerze miast), a po dodaniu miasta cache dalej jest null do pierwszego realnego triggera (koniec tury, `markCityStateDirty` ~46825).
- Które wcześniejsze wywołanie wyzerowało flagę: NIE USTALONO (nie prześledzono wszystkich wywołań podczas inicjalizacji sceny).

**Kontrola ścieżki normalnej (newgame, bez wczytania, `evidence/r2-B-newgame-play-do-tury20.json` → `t1_start` oraz KONTROLA w H2):** `startGame` + `foundFirstCity` → w tej samej turze 1 prognoza JEST: `spichlerzPo: -4`, `skarbiecPo: -2`, `bramkaBlokuje: true` („Skarbiec: zabraknie 2”). Zakładanie miasta przez `foundCityAt` przechodzi przez `markCityStateDirty()` (~17118), więc cache jest liczony od razu. Anomalia null w t1 dotyczy więc tylko scenariusza playtest, nie normalnego startu.

**Wniosek przyczynowy:** w scenariuszu playtest prognoza tury 1 nie jest liczona przy założeniu miasta (brak dirty po `cities.push`). Blokada „Zakończ turę” pojawia się dopiero po pierwszym triggerze (wczytanie albo koniec tury). To NIE jest defekt wczytania. Defekt (brak przeliczenia po dodaniu miasta) dotyczy wyłącznie ścieżki testowej playtest.

## 2. TABELA ZAPISÓW (zarzut 3)
Odczyt bramki = `nnsDiag()` dwukrotnie (pierwsze wywołanie przelicza cache, drugie czyta wynik). Liczby z JSON-ów w `evidence/`.

| Zapis | Tura | „Zakończ turę” po wczytaniu | Warunek blokady i liczby | To samo bez wczytania |
|---|---|---|---|---|
| A — playtest=mapa, wczytany w TEJ SAMEJ stronie (`r2-A`, E1) | 1 | NIE (endTurn 1→1, `przeszedl: false`) | `bramkaBlokuje: true`; `spichlerzObecny 0`, `spichlerzPo -48`, `skarbiecPo 4907` | świeża strona przed wczytaniem (E0/E2a): gate false, prognoza **null** (artefakt cache). Po wymuszeniu przeliczenia (H2): gate true, `spichlerzPo -48` = ta sama wartość co po wczytaniu |
| A — wczytany w NOWEJ stronie tego samego kontekstu (`r2-A`, E2b) | 1 | NIE (1→1) | identycznie: `spichlerzPo -48` | jw. |
| B — newgame seed 4242, tura 20, 1 miasto gracza (`r2-B-newgame-play`, `r2-B-newgame-load`) | 20 | TAK (20→21, `r2-B-newgame-load` `po_wczytaniu_endTurn`) | po wczytaniu: `bramkaBlokuje: false`, `skarbiecPo 174`, `spichlerzObecny 219`, `spichlerzPo 221` | sesja ciągła do t20 (bez wczytania): `bramkaBlokuje: false`, `skarbiecPo 174`, `spichlerzPo 221` — IDENTYCZNIE |
| C — kampania / większa gra (≥2 miasta gracza) | — | NIE ZMIERZONO | — | — |

Uwagi do wiersza B:
- Przebieg: harness `ai-economy-measure-run.cjs` (start `newgame`, seed 4242) do t10 (zapis slotu), wznowienie do t20 (zapis `ai-econ-s4242`); to ten zapis sprzed pomiaru „po wczytaniu” był użyty do `r2-B-newgame-load`. Ciągła sesja `nns-gate-r2-measure.cjs play` (własny zapis `nns-r2-s4242-t20`) dała tę samą prognozę w t20 (liczby jak w tabeli).
- Interwencja harnessu: w t1 bramka blokowała (`skarbiec 0`, prognoza −2/−4) → dosypka 200 złota + 200 żywności; od t2 bramka nieaktywna (zaznaczone w `log`). Brak dosypek po t1.
- Wiersz B osiągnął tylko 1 miasto gracza (nie „kilka”). Pomiar wykonany, ale nie spełnia opisu „kilka miast”.
- `r2-B-newgame-play` w t2 raportuje `przeszedl: true` tylko po czekaniu na `isEndTurnInProgress() == false` (poprawka w narzędziu: wcześniej endTurn wywoływany w trakcie przetwarzania tury był odrzucany jako `endTurnInProgress`).

**Wiersz C: NIE ZMIERZONO.** Powód: seed 4242 daje 1 miasto gracza w t20; brak w `civTest` haka do założenia drugiego miasta gracza (`foundFirstCity` działa tylko dla pierwszego). Nie zgadywano wyniku dla kampanii.

**Zarzut 3 (jakość odczytu):** w `r1` wiersz `E3b` (t2 bez wczytania) miał `bramkaBlokuje: true` przy `prognozaCache: null` (`evidence/r2-A-repro-playtest-tura1.json`, `E3b_P3_t2_bez_wczytania`), a komunikat gry podaje „zabraknie 46”. Przyczynę niespójności odczytu (pole `forecast` jest czytane przed przeliczeniem w `nnsDiag`, `main.ts` ~31187) NIE USTALONO do końca; blokada w t2 jest realna (komunikat), wartość pola `forecast` w tym wierszu nie jest wiarygodna.

## 3. KLASYFIKACJA ZJAWISK
- **Realny defekt wczytania (wczytany zapis daje inną prognozę niż świeża gra w tym samym stanie): NIE** — zmierzone: A (wczytanie = wymuszone przeliczenie, −48), B (wczytanie = ciągła sesja, 221/174). NIE ZMIERZONO dla C.
- **Artefakt testowy:** null cache w świeżej t1 `playtest=mapa` (brak dirty po `cities.push`), ujawniany dopiero przez wczytanie lub koniec tury. Zmierzone.
- **Realny warunek blokady w normalnej nowej grze:** tura 1 przy zerowym skarbcu i spichlerzu daje prognozę −2/−4 i blokadę „Zakończ turę” już na starcie (KONTROLA, bez wczytania). To jest pytanie produktowe (K4), nie defekt kodu.

## 4. KANDYDACI NAPRAWY (BEZ IMPLEMENTACJI; decyzja właściciela)
- **K1 (test/scenariusz, najmniejsze ryzyko):** w ścieżce startu playtest po `cities.push` (~48994; podobne dodanie w ~48743 do potwierdzenia przy implementacji) dopisać `markCityStateDirty()` — usuwa null w świeżej t1 playtest. Nie zmienia reguł gry; zmienia tylko scenariusz testowy.
- **K2 (defensywnie):** po `loadSlot`/`doLoadGame` i po `startGame` wywołać `markCityStateDirty()` — zapewnia przeliczenie cache, niezależnie od ścieżki. Nie zmienia wyniku zmierzonego w B (już przeliczony).
- **K3 (ochrona kolejności):** w `refreshLiveEmpireRates` zerować `empireEconDirty` dopiero po udanym `refreshLiveEmpireRatesUnsafe` (dziś flaga jest zerowana przed wywołaniem; przy 0 miastach funkcja nie ustawia dirty). Zmiana zachowania ograniczona do przypadku zerowych miast.
- **K4 (decyzja produktowa, blokuje właściwe zachowanie):** czy tura 1 nowej gry ma blokować „Zakończ turę” przy prognozie −2 skarbca / −4 spichlerza (stan startowy zerowy)? Dziś TAK w normalnym starcie, a w playtest ujawnia się dopiero po wymuszeniu/wczytaniu. Bez decyzji właściciela nie zmieniać reguł.
- Higiena narzędzi testowych: `nnsDiag` powinien czytać `forecast` po przeliczeniu (poprawka w hakach civTest, nie w logice gry) — dotyczy odczytów testowych, nie graczy.

**Rekomendacja Operatora:** nie zmieniać reguł bramki. Jeśli właściciel zatwierdzi: K1 + K2 (naprawa śladu testowego i pewności cache po wczytaniu). Decyzja K4 do właściciela przed jakąkolwiek zmianą wartości startowej.

## UWAGI-DLA-ORKIESTRATORA
- Narzędzia: `gra/tools/nns-gate-r2-measure.cjs` (tryby `play` i `load`, wznawialny slot) i `gra/tools/nns-gate-r2-h2-probe.cjs` (test H2 + kontrola newgame). Obie z `node --check` OK; uruchomienia wykonane w tej rundzie.
- Nie zakładano sesji, zadań, harmonogramów; nie wysyłano wiadomości do innych agentów.
- Build vite i `node_modules` tylko w worktree/scratchpad; po pracy usunięte (patrz sekcja sprzątania w raporcie końcowym).

## BLOKADY
- Wiersz C NIE ZMIERZONO (brak narzędzia do ≥2 miast gracza w civTest).
- Przyczyna wcześniejszego wyzerowania flagi `empireEconDirty` w scenariuszu playtest: NIE USTALONO (nie prześledzono wszystkich wywołań przy inicjalizacji).
- Niespójność odczytu `forecast` w E3b (r1): NIE USTALONO.

## RUNDY
Operator, runda 2/5 (dispatch DODATEK 3: zadania 1–3).

## NASTĘPNY KROK
Final Control: ocena zgodności z kryteriami (tabela ≥3 zapisów: A, B mierzone; C NIE ZMIERZONO z uzasadnieniem; wniosek TAK/NIE: defekt wczytania NIE). Decyzje właściciela: K4 (produktowa) oraz zgoda na K1/K2 jako osobny temat.

DEPLOY/PUSH: NIE WYKONANO
