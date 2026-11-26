# R-WEB-MAP-RIVER-TIERS-RECON-Q1 — obrona Operatora (runda 2)

STATUS: BLOCK
DOMAIN: GAME (recon, bez zmian kodu)
TEMAT: R-WEB-MAP-RIVER-TIERS-RECON-Q1
GOAL: dokument faktów pod zmianę generatora rzek (trzeci poziom + 2x źródeł), zero zmian w gra/**
ZMIANY/COMMIT: dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md (przepisany po korekcie) + ten raport; baza d355db889 (kandydat), kod bez zmian.

## Odpowiedzi na zarzuty z raportu Evaluatora (66f94ed4f)

1. **PRZYJMUJĘ.** Teza „domyślnie tylko main” była fałszywa. Dowód: `gra/src/map/riverGenSwitch.ts:73` zwraca `'main+medium'`; `generator.ts:493` `isRiverGenMainOnly()` jest prawdziwe tylko dla `main`. Dodatkowo runda 1 nie zauważyła, że dopływy (`tributary`) powstają przed bramką: `gen-helpers.ts:11861` i `11873`, bramka dopiero `gen-helpers.ts:11971`. Zmierzono: domyślnie `main`, `medium`, `tributary` na wszystkich 13 zmierzonych mapach, `short` na żadnej. Prawdziwa przyczyna braku widocznych rzek to filtr renderu `scene.ts:1539-1546` (stage 2 ukrywa `tributary`), co opisano w sekcji 0 dokumentu.

2. **PRZYJMUJĘ.** Pomiar wykonany częściowo: zainstalowano `gra/node_modules` (`npm ci --ignore-scripts`), zmierzono 13 z 15 map (5 ziaren × 84×60, 168×120; 240×168 seedy 1, 7, 42). Brakujące 240×168 seedy 99 i 2026 NIE ZMIERZONO: dysk `/` spadł do 0 MB (`Disk full`) w trakcie, a próg operatora to 4 GB. Wymówka „brak node_modules” była niezasadna i została usunięta z dokumentu. Czasy: pojedyncze przebiegi, duża wariancja (zaznaczono).

3. **PRZYJMUJĘ.** Liczby po zmianie (2x źródeł) NIE ZMIERZONO — wariant nie został wykonany, dokument to mówi wprost. Zmierzono liczbę źródeł `main` przed zmianą (40–47 / 120–137 / 188–213). Podwojenie „brak całkowitego boku” wyjaśnione w §4 (5/4 → 1,56×).

4. **PRZYJMUJĘ.** „25% szerokości” usunięte jako bez źródła. Szerokości z kodu: `scene.ts:1325-1328` (0,4 / 0,55 / 0,7 względem półszerokości main); spec §5 podaje 50% dla `tributary`. Wariant A wycofano jako oparty na błędnej tezie z zarzutu 1; zastąpiony wariantem A „pokazać short i/lub tributary domyślnie” z dopiskiem, że dopływy już są generowane.

5. **PRZYJMUJĘ.** Piny/hashe nie zbadane (NIE ZMIERZONO, zapisane). Przypisania testów do zmian (a)(b)(c) oznaczono jako hipotezę po nazwie; zawartości poza `river-path-adjacency-test.cjs:25-40` nie czytano. Nie zmieniono statusu tych pozycji na zweryfikowane.

6. **CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM Z DOWODEM.** Przeszukanie reguł uzupełniono słowami kluczowymi (AC-7, FALA 170 i monotonia nie były wcześniej w dokumencie), ale `docs/archiwum/**` i `docs/decyzje/**` NIE przeczytano w całości, co dokument teraz mówi. Dla N=15: `MAPA-RZEKI-SPEC.md:29` nazywa 15×15 siatką WODY fair play (odsyła do `MAPA-FAIR-PLAY-SIATKA.md`), a tabela §2 tego samego specu (`:32`) podaje N=15 jako tier rzek „Normalnie”. Kod dla siatki rzek (`newGameMapDefaults.ts:281-285`) daje 5 dla medium. Rozbieżność jest więc realna w dokumentacji (dokument miesza dwie siatki), ale czy dotyczy to wdrożenia 20:34 — NIE ROZSTRZYGNIĘTO, wymaga odczytu tego wdrożenia.

7. **PRZYJMUJĘ.** STATUS poprzedniej rundy (PASS-WITH-NOTES) był błędny, bo kryterium binarne nie było spełnione. Obecny STATUS: BLOCK (patrz BLOKADY).

## Dowody (surowe wyjścia, skrót)

- `gra/src/map/riverGenSwitch.ts:73` — `return 'main+medium';`
- `gra/src/map/gen-helpers.ts:11861` `pushTributary` → `riverKinds.push('tributary')`; `:11873` `pushMedium` → `push('medium')`; `:11971` `if (!isRiverGenFull()) { ... return }`.
- `gra/src/render/scene.ts:1539-1546` — stage ≥3 dodaje `short` i `tributary`.
- Pomiar default (node, bundle esbuild w scratchpadzie, bez zmian w repo): 13 map, wyniki w tabeli sekcji 3 dokumentu (np. 168×120 seed 42: main 120 / medium 42 / tributary 67 / short 0, czas 60 849 ms).
- `git status` po zakończeniu: czysto po przywróceniu dwóch śledzonych plików `gra/tools/.river-count-e.ts` i `gra/tools/.river-count.cjs`, które usunąłem przypadkowo przy czyszczeniu `node_modules` (przywrócono `git checkout --`).

## Co pozostało niezrobione

- Pomiar 240×168 seed 99 i 2026 (dysk).
- Odczyt `docs/archiwum/**` i `docs/decyzje/**` w całości pod kątem trzeciego poziomu.
- Liczby po wariancie 2x źródeł (wymaga zmiany kodu, poza tym tematem).
- Piny i testy: zawartość i wynik (poza nazwami).

TESTY: pomiar generatora 13/15 map (bundle esbuild, brak testów bramkowych); `npm run build`/`dev` nie uruchamiano; testy `gra/tools/*-test.cjs` NIE URUCHOMIONO.
BLOKADY: (a) dysk `/` 1,2 GB wolne po sprzątaniu, poniżej progu 4 GB, zostało usunięte `gra/node_modules`; (b) 2 z 15 map NIE ZMIERZONO; (c) pkt 1 i 6 częściowo; (d) decyzja ABC właściciela: czy „trzeci poziom” = `short` (A) czy nowy typ (B), oraz czy dopływy mają być widoczne domyślnie.
RUNDY: 2/5; ostatni werdykt Evaluatora: FAIL (7 zarzutów); decyzja wymagana: ABC wg sekcji 5 dokumentu.
NASTĘPNY KROK: po zwolnieniu dysku (>= 4 GB) dokończyć pomiar 240×168 seed 99 i 2026, przeszukać `docs/archiwum/**` i `docs/decyzje/**` pod kątem trzeciego poziomu, potem ponowna ocena Evaluatora. Pytanie ABC do właściciela (język dla gry) — po stronie orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: dysk `/` był chwilowo 0 MB (błąd `Disk full` przy zapisie w scratchpadzie), a `/tmp` jest na tym samym wolumenie — orkiestrator powinien zwolnić miejsce przed kolejnymi tematami z pomiarami. Nie tworzono sesji, zadań, triggerów ani nie użyto `run_in_background`.
