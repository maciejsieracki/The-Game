# R-WEB-IMPROVEMENT-STADNINA-DEPOSIT-ONLY-NO-FOREST-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-IMPROVEMENT-STADNINA-DEPOSIT-ONLY-NO-FOREST-Q1
GOAL: zakaz lasu dla stadniny przywrócony (decyzja właściciela 2026-11-19, ABC B). Stadnina nie stoi na heksie z Lasem; dotyczy gracza, autopilota i AI.
ZMIANY/COMMIT: patrz sekcja COMMIT na końcu (SHA w polu sha wyniku).
- `gra/src/map/improvement-build.ts`: `isStadninaBlockedOnForest` zwraca `true` dla stadniny na Lesie; `isImprovementBlockedOnForest` sprawdza ją przed listą wyjątków; `stadnina` wyjęta z `FOREST_COEXIST_IMPROVEMENT_KEYS`. Gate commitu (`computeImprovementBuildImpact`) i `qualifies()` blokują ją automatycznie.
- `gra/tools/hodowla-las-test.cjs`, `gra/tools/map-improvement-qualify-test.cjs`: asercje z 2026-09-03 odwrócone; „ŻYWY TEST GOAL 1” przepisany (Łąka+Las NIE, Łąka ze złożem konia TAK).
- Koszt, przychód, epoki i odkrycie Konia bez zmian.

TESTY (surowe wyniki):
- tsc --noEmit: exit 0
- logic-test: 213 PASS, 0 FAIL
- tech-tree: 20/0; research: 33/0; unit-replace: 21/21; combat: exit 0
- stadnina-early-eras-deposit-only: 35/0; auto-improvements: 46/0; ai-improvements: 56/0; ai-territory-race: 29 OK/0 FAIL
- map-improvement-qualify: 134/0 (baza 132/1)
- hodowla-las: 110/3 (baza 106/7). Trzy pozostałe asercje są czerwone z innego powodu (patrz BLOKADY).
- Mutacja (wyłączenie warunku lasu w `isStadninaBlockedOnForest`): map-improvement-qualify 132/2 — test łapie regresję. Kod przywrócony, `grep` potwierdza.
- Pomiar lasu (generateMap, inkowie, era 5, z zestawem technologii): seed 90210 stadnina na lesie 0 (poza lasem 2); 777: 0 (1); 31415: 0 (2). Seed 4242 w tym skrypcie nie ma złóż konia (0), więc pomiar NIE ZMIERZONO dla 4242.
- NIE ZMIERZONO: bieg dymny AI 45 tur seed 4242 w przeglądarce (wymaga bundla vite i Chromium; nie uruchomiono).

BLOKADY:
1. Allowlista: reguła stadniny żyje w `gra/src/map/improvement-build.ts`, a ten plik NIE jest na liście. Allowlista wymienia `improvement-qualify*.ts` / `map-improvement*.ts`, których nie ma. Zmiana została zrobiona w tym pliku, bo tylko tam jest kwalifikacja. Wymaga decyzji orkiestratora przed integracją.
2. Hodowla-las 3 czerwone asercje, nie z lasu: „GRACZ: stadnina NA golej Lace” (era-gate z R-WEB-STABLE-…-EARLY-ERAS-Q1, 2026-11-09) oraz dwie „AUTOMAT/AI runda 3” (stadnina poza złożem przy 50/500 koni). Były czerwone przed zmianą.
3. Opis w `gra/data/terrain-improvements.json` (`stadnina.uwagi`, `warunek`) nadal mówi „nakładka Lasu nie przeszkadza”. Plik nie jest na allowliście, więc nie zmieniałem go. Tekst dla gracza jest już nieprawdziwy.

ZAŁOŻENIA (luki w dispatchu):
- ZAŁOŻENIE A: stadnina poza złożem (era 3+ z odblokowanym Koniem, z 2026-11-09) ZOSTAJE. Dispatch mówi „WYŁĄCZNIE na złożu” i jednocześnie „zachowaj ograniczenia epok”. Zinterpretowałem decyzję jako zakaz lasu. Jeśli właściciel chce usunąć ścieżkę poza złożem, to osobna decyzja.

NASTĘPNY KROK: orkiestrator decyduje o allowliście (plik `improvement-build.ts`) i o ZAŁOŻENIU A; potem Evaluator i Final Control. Bieg dymny 45 tur, aktualizacja `data/terrain-improvements.json` i pomiar 4242 w przeglądarce są do zrobienia po decyzji.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: nic poza powyższym. W worktree zostały wygenerowane pliki testów (ignorowane przez git) i `node_modules` (npm ci --ignore-scripts).
