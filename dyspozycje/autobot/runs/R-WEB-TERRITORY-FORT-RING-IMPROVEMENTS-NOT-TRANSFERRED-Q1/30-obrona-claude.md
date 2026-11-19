STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1
GOAL: heks z ulepszeniem wlasciciela fortu w pierscieniu nie przechodzi pod nowe miasto innej cywilizacji (ABC C, 2026-11-19); runda 3 = obrona kandydata 36a0e2709 po zarzutach Evaluatora (8 pkt).
ZMIANY/COMMIT: baza 36a0e2709 (kandydat rundy 2). Kod obrony: f3abd919f. Allowlista uzyta: gra/src/main.ts, gra/src/map/territory.ts, gra/src/map/improvement-build.ts, gra/tools/city-founding-no-fort-takeover-test.cjs, gra/tools/territory-improvement-owner-test.cjs (nowy). fort-territory.ts bez zmian w tej rundzie. Ten raport: commit osobny (sprawdz `git log -1`).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE i POPRAWIONE. Predykat nie jest juz podpinany przez heks samego fortu: fortRingHasOwnImprovement (map/territory.ts) pomija dq=dr=0 i liczy tylko ulepszenia NALEZACE do wlasciciela fortu. Test OWN-2a/2c. Pomiar (mikro-benchmark, esbuild+node, poza repo, 400k lookupow, 31 wezlow): A = fort bez wlasnego ulepszenia w pierscieniu (predykat niepodpiety, indeks zakresowy) 25.9 ms; C = fort z wlasnym ulepszeniem w pierscieniu (predykat podpiety, bez indeksu) 126.1 ms; C/A = 4.9x. Wynik A to zwykla gra z fortem bez wlasnych ulepszen w pierscieniu (indeks dziala). Narzut ~5x pozostaje TYLKO w grach, gdzie fort ma wlasne ulepszenie w swoim pierscieniu: NIE ZOPTYMALIZOWANE (DODATEK pkt 4 wymagalby <=10%: NIE SPELNIONE w tym przypadku). Pomiar w realnej grze: NIE ZMIERZONO.
2. PRZYJMUJE i POPRAWIONE (test): OWN-3a..3f testuja prawdziwy kod fortRingBuildBlockReason (territory.ts). Mutacja (blokada -> return null) = OWN-3a FAIL (33 passed, 1 failed), przywrocone. Ograniczenie: sam qualifies() w improvement-build.ts nie ma testu wykonawczego (createQualifier nieeksportowany, brak fixtury stanu); pokryte tylko regexem OWN-7d i logika w helperze. Pelnego testu qualifies(): NIE ZROBIONE.
3. PRZYJMUJE i POPRAWIONE: improvedByFortOwner przeniesiony do territory.ts jako fortRingShield(ownerByHex, hasLayers). Testy na prawdziwym kodzie: OWN-1a..1d (ulepszenie starego miasta nie chroni), OWN-5 (dwa forty), OWN-6 (mutacja predykatu = false -> miasto AI).
4. PRZYJMUJE i POPRAWIONE (test): nowy gra/tools/territory-improvement-owner-test.cjs (34 passed, 0 failed): resolveImprovementOwners - zapis ma pierwszenstwo (OWN-4a/b), stary zapis = przyblizenie territoryOwnerAt (OWN-4d), brak wpisu gdy poza zasiegiem (OWN-4e), NaN/undefined odrzucone (OWN-4f), wszystkie wartosci skonczone (OWN-4h). Round-trip prawdziwego pliku zapisu (serializacja meta.improvementOwners w main.ts): NIE ZMIERZONO (test tylko guard RF-18a/OWN-7b).
5. PRZYJMUJE: Chromium NIE ZMIERZONO w tej rundzie. Nie uruchomiono bundla ani przegladarki (scenariusz fort gracza + stadnina + miasto AI, przed/po). OTWARTE dla FC: wymagany pomiar z zywego Chromium przed READY_FOR_DEPLOY.
6. PRZYJMUJE i POPRAWIONE: applyBuildRequest (main.ts) wola teraz fortRingBuildBlockReason(req.q, req.r, 0, buildAllTerritoryNodes()) i pokazuje powod (showHintMessage); guard OWN-7c. Uwaga: gracz i tak przechodzi przez assertPlayerTerritoryForBuild (wymaga wlasnego terytorium, owner 0). AI i autopilot: kwalifikacja przez buildImprovementQualifier (auto-improvements.ts:1420, playerOwnerIdNum: ownerId) - blokada w qualifies(). Sciezka AI apply (main.ts ~48132) nie ma osobnej bramki poza kwalifikatorem: NIE ZWERYFIKOWANE osobno.
7. PRZYJMUJE jako OGRANICZENIE (nie poprawiane w tej rundzie, poza zakresem tematu): setPlacedLayersOwned zachowuje PIERWSZEGO wlasciciela i nie aktualizuje go przy zdobyciu miasta/fortu. Skutek: ulepszenie po zmianie wlasciciela terytorium nadal nalezy do pierwszego budujacego. Brak testu. Do decyzji orkiestratora.
8. PRZYJMUJE i POPRAWIONE, z ODSTEPSTWEM OD DODATKU pkt 3 (wyjasnienie): blokada zostala przeliczona. Predykat chroni TYLKO ulepszenia NALEZACE do wlasciciela fortu, wiec przeskok ulepszenia nastepuje wylacznie dla budujacego B, ktory ma wlasny fort/posterunek, gdy heks w jego pierscieniu nalezy do innego (miasta lub fortu) - wtedy blokada zwraca powod. Poprzednia wersja blokowala strone przeciwna (budujacy bez fortu w cudzym pierscieniu, gdzie przeskoku nie ma) i blokowala heks nalezacy do wlasciciela fortu. Nowa regula: fortRingBuildBlockReason = pierscien WLASNEGO fortu AND territoryOwnerAt(heks) nie jest null i != budujacy. Powod po polsku: FORT_RING_BUILD_BLOCK_REASON (eksport territory.ts). Podpiete do applyBuildRequest (komunikat) i qualifies() (false). Pokrycie testami: OWN-3a..3f. Do oceny przez FC, czy odchylenie od literalnego brzmienia DODATKU pkt 3 jest akceptowalne.

ZMIANY W KODZIE (skrot):
- territory.ts: FORT_RING_BUILD_BLOCK_REASON, fortRingShield, fortRingHasOwnImprovement (bez srodka fortu), fortRingBuildBlockReason, resolveImprovementOwners (eksport).
- main.ts: improvedByFortOwner = fortRingShield(...); buildAllTerritoryNodes podpina per fort fortRingHasOwnImprovement(f, improvementOwnerByHex); usunieta lokalna fortRingHasImprovement i stale FORT_TERRITORY_RADIUS/OUTPOST_TERRITORY_RADIUS; wczytanie przez resolveImprovementOwners; applyBuildRequest - blokada.
- improvement-build.ts: qualifies() - hasOwnFort + fortRingBuildBlockReason (zamiast inForeignFortRing).
- city-founding-no-fort-takeover-test.cjs: RF-18b regex na nowa sygnature.

TESTY (surowe wyniki, po commicie f3abd919f):
- tsc --noEmit (gra/): exit 0 (brak wyjscia)
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed (exit 0)
- city-founding-no-fort-takeover-test: 54 passed, 0 failed
- fort-outpost-hard-territory-test: 92 passed, 0 failed
- fort-strazniaca-zasieg-zakladania-test: 82 passed, 0 failed
- ai-territory-race-test: WYNIK 29 OK / 0 FAIL
- territory-improvement-owner-test (NOWY): 34 passed, 0 failed
- mutacja blokady (fortRingBuildBlockReason -> return null): territory-improvement-owner-test 33 passed, 1 failed (OWN-3a) - czerwony; przywrocone (git diff pusty dla territory.ts).
- git diff --check: czysto
- npm ci --ignore-scripts w gra/ wykonane (worktree bez node_modules), bez build/dev.

BLOKADY:
1. CHROMIUM NIE ZMIERZONO (pkt 5) - wymagany przed READY_FOR_DEPLOY.
2. Pomiar w realnej grze wydajnosci (pkt 1) NIE ZMIERZONO; narzut 4.9x przy wlasnym ulepszeniu w pierscieniu NIE ZOPTYMALIZOWANY.
3. Test wykonawczy qualifies() NIE ZROBIONY (pkt 2).
4. Round-trip zapisu prawdziwej gry NIE ZMIERZONO (pkt 4).
5. Odchylenie od literalnego DODATKU pkt 3 (pkt 8) - decyzja FC/orkiestratora.
6. Ograniczenie pierwszego wlasciciela ulepszenia (pkt 7) - poza tematem.

RUNDY: 3/5 (r1 FC BLOCK; r2 FC BLOCK; r3 = ta obrona)
NASTEPNY KROK: FC rundy 3: (a) pomiar Chromium (scenariusz fort gracza + stadnina + miasto AI, przed/po, surowi wlasciciele), (b) ocena odchylenia pkt 8, (c) decyzja o ograniczeniu pkt 7.
UWAGI-DLA-ORKIESTRATORA: brak nowych sesji/zadan/harmonogramow. Generated: gra/tools/.territory-owner-*.{ts,cjs} (nieskomitowane, ignorowane). Bench: poza repo (scratchpad).
DEPLOY/PUSH: NIE WYKONANO
