STATUS: PASS-WITH-NOTES
DOMAIN: GAME (render rzek, wygląd)
TEMAT: R-WEB-MAP-RIVER-RENDER-LEVELS-Q1 (RIVERS3A, odp. 14C część A)
GOAL: domyślnie widoczne trzy poziomy rzek (główne, średnie, trzeci poziom dopływów) o różnej grubości; zero zmian generatora map i pinów.
ZMIANY-COMMIT: baza kandydat 6c3e2b06b (origin/main 7148b2f4e). Zmiana tylko w gra/tools/river-render-levels-test.cjs (+16 linii: sekcje E i F, asercje źródłowe podpięcia szerokości i gałęzi batch). gra/src/render/scene.ts NIETKNIĘTE (git diff scene.ts pusty). gra/src/map/** nietknięte. SHA: patrz StructuredOutput.

## Odpowiedzi na zarzuty Evaluatora (1e5608eb2)

1. ODRZUCAM ODCHYLENIE OD 0,5 x MAIN Z DOWODEM; tributary zostaje 0,30 (stała). Dowód rachunkowy: main = 0,85–1,35 (min(1,35; 0,85+len·0,008)), więc 0,5 x main = 0,425–0,675. Medium po obniżce = max(0,35; 0,7·reguła) = 0,35 / 0,385 / 0,49. Przy 0,5 x main tributary (≥0,425) byłby grubszy lub równy medium przy len≥18 (0,49), co łamie wymóg ścisłej kolejności main > medium > tributary (commit RIVERS3A, asercja sekcji C). Ponieważ medium ma minimum 0,35, tributary musi być poniżej 0,35 dla każdej długości; 0,30 jest najbliższą wartością spełniającą ten warunek. Test sekcji C: len=20 → main 1,010 > medium 0,490 > tributary 0,300.
   Sprzeczność jest w samym dispatchu (tributary ≈0,5 x main vs medium ≈0,7 x dotychczasowa reguła vs wymóg main > medium > tributary). Czy podnieść tributary kosztem medium, to decyzja wyglądu: DO POTWIERDZENIA przez orkiestratora/właściciela (patrz UWAGI).

2. PRZYJMUJĘ, POPRAWIONE. Dodano sekcję E testu: (a) dokładnie jedno wywołanie `const widthMul = riverWidthMulForKind(kind, landLen);` w ciele renderLandRiversFromPaths, (b) brak zahardkodowanego `const widthMul = 0.x`, (c) `halfWidth = mainHalfWidth * widthMul`, (d) gałąź batch przekazuje halfWidth do pushRiverMesh. Mutacja zarzutu (`const widthMul = 0.7;` zamiast wywołania) → test CZERWONY: 16 OK / 2 FAIL (FAIL: "dokładnie jedno wywołanie" i "brak zahardkodowanego widthMul"). Po przywróceniu scene.ts (kopia) → 18 OK / 0 FAIL.

3. PRZYJMUJĘ, NIE POPRAWIONE w tej rundzie. Zrzut z żywego Chromium (1280x800, mapa 84x60 seed 1) NIE ZMIERZONO. Powód: start gry wymaga wieloetapowego kreatora (wzorzec: gra/tools/R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs, runWizardGrecyVsRzym); nie wykonano go w tej rundzie. Bramka wizualna (R-PROC-AUTOBOT §9) pozostaje OTWARTA: czytelność 0,30 na ekranie NIE ZMIERZONO. Wymagana przed READY_FOR_DEPLOY.

4. PRZYJMUJĘ, NIE ZMIERZONO. Koszt sceny/FPS przy domyślnym etapie 3 nie był mierzony (ten sam powód co pkt 3). Pomiar wymagany osobno.

5. PRZYJMUJĘ CZĘŚCIOWO, POPRAWIONE CZĘŚCIOWO. Dodano sekcję F: isMain wyznaczany wyłącznie przez kind === 'main'; tributary idzie gałęzią else (batchBucket). Nie dodano dedykowanej asercji mgły dla tributary: river-fog-visibility-test (31/0) pokrywa scalony batch medium/short/tributary; pełny scenariusz mgły per-tributary jest poza zakresem tej rundy. Nieblokujące (jak w zarzucie).

## TESTY (surowe wyniki z tej rundy, node_modules z npm ci w gra/)
- tsc --noEmit (node ./node_modules/typescript/bin/tsc -p tsconfig.json): EXIT 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- combat-test: All sanity checks passed. (EXIT 0)
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- ai-test: 297 passed, 0 failed
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- river-fog-visibility-test: 31 pass, 0 fail
- river-turn-window-test: 10 pass, 0 fail
- medium-river-test: 38 pass, 0 fail
- river-render-levels-test (po zmianie): WYNIK 18 OK / 0 FAIL (poprzednio 11/0)
- MUTACJA wiringu (widthMul = 0.7): 16 OK / 2 FAIL, czerwony; po przywróceniu 18/0
- Szerokości (kolejność ścisła): len=20 main 1,010 / medium 0,490 / tributary 0,300

## Wartości grubości (stan kodu, scene.ts bez zmian w tej rundzie)
- main: min(1,35; 0,85 + len·0,008) — bez zmian
- medium: max(0,35; 0,7 · (len<10 ? 0,4 : len<18 ? 0,55 : 0,7)) = 0,35 / 0,385 / 0,49
- tributary i short: 0,30 (stała)
- domyślny etap renderu: RIVER_RENDER_DEFAULT_STAGE = 3 (wcześniej 2; zmiana z Operatora r1, nie w tej rundzie)

## NIE ZMIERZONO
- Zrzut z żywego Chromium (1280x800, mapa 84x60 seed 1): NIE ZMIERZONO (powód w pkt 3).
- Wydajność/FPS przy etapie 3: NIE ZMIERZONO (pkt 4).

## BLOKADY
- Bramka wizualna (zrzut Chromium, czytelność 0,30) otwarta. Blokuje READY_FOR_DEPLOY, nie blokuje integracji testów.
- Decyzja wyglądu tributary 0,30 vs ~0,5 x main: wymaga potwierdzenia orkiestratora/właściciela (sprzeczność w dispatchu, pkt 1).

## UWAGI-DLA-ORKIESTRATORA
- Sprzeczność w dispatchu: tributary ≈0,5 x main nie da się pogodzić z medium ≈0,7 x dotychczasowa reguła i wymogiem main > medium > tributary. Operator utrzymał 0,30; do rozstrzygnięcia: czy dopuścić tributary wyżej (wtedy trzeba zmienić medium, co jest decyzją wyglądu).
- node_modules w gra/ zainstalowane na czas bramek (npm ci) i do usunięcia po commicie (gitignored).

RUNDY: 2/5 (runda obrony po Evaluatorze 1)
NASTĘPNY KROK: Final Control (Sonnet) na commit obrony; zrzut Chromium i pomiar FPS jako osobna bramka przed READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
