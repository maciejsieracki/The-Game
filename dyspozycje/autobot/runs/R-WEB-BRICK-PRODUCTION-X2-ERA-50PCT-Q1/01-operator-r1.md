STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — ekonomia: produkcja cegły
TEMAT: R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1
GOAL: cegła ×2 w miastach + Cegielnia +50% bazy za epokę właściciela (mnożnik 1/1,5/2/2,5/3); tylko Cegielnia; gracz i AI tak samo.

## POMIAR PRZED (silnik + gra)
Silnik (`advanceCityEconomy`, era 1/2/3, wejścia obfite): produkcja = przepustowość 50 / 55 / 60 cegieł/turę; zużycie 2 glina + 1 drewno na cegłę.
Gra (headless Chromium, `brick-live-measure.cjs`, seed 7, era 2 wymuszona, 30 tur, 1 miasto z Cegielnią): 150 cykli / 30 tur = 5/turę, przepustowość 55 — **ograniczenie wejścia = DREWNO w 30/30 tur** (nie przepustowość, nie glina). Cegła w magazynie średnio 77,5, zero zablokowanych budynków (miasto bez kosztów cegły w kandydatach).
WNIOSEK: samo ×2 przepustowości NIE podwaja wyjścia. Dowód: wariant „baza 100” w tej samej grze dał nadal 150 cegieł/30 tur (przepustowość 1650→4500, wyjście bez zmian).

## WYBÓR (A/B)
- A: przepustowość 50→100. Podwaja cegłę tylko, gdy ogranicza przepustowość; zużycie gliny/drewna rośnie ×2. Nie działa w reżimie „drewno/wejście” (zmierzony). ODRZUCONE.
- B (WDROŻONE): `outputAmount` 1→2 (2 glina + 1 drewno → 2 cegły), baza przepustowości 50 bez zmian. Podwaja cegłę w KAŻDYM reżimie (wejście, przepustowość); zużycie gliny/drewna na turę BEZ zmian (te same cykle, te same wejścia na cykl); glina na cegłę 2→1, drewno 1→0,5 (świadoma zmiana proporcji receptury).
- Epoka: `CONVERTER_ERA_SCALING_PCT_BY_RECIPE = { cegielnia: 0.5 }` w `converterThroughputForEra` (jedna funkcja, gracz = AI); Garncarnia +10% bez zmian, Odlewnie płaskie. Mnożnik cykli: 1 / 1,5 / 2 / 2,5 / 3 (liniowo od bazy 50: 50/75/100/125/150 cykli → 100/150/200/250/300 cegieł).

## ZMIANY / COMMIT
SHA: e3544ed05 (kod+testy+raport; raport nie zawiera własnego SHA poza tą linią – poprawka w kolejnym commicie).
- gra/src/game/converters.ts (outputAmount 2, mapa PCT per receptura, komentarze)
- gra/data/econ-params.json (tylko tekst `opis` cegielni; wartości 50 bez zmian)
- gra/data/buildings.json (tylko `uwagi` Cegielni)
- UI: panel miasta (`converterProductionDisplayForBuilding`) i HUD (`empireConverterResourceRatesForOwner`) liczą z `outputAmount` i `converterThroughputForEra` — bez zmian kodu, auto-poprawne (test E). `ai.ts` nie ma własnych szacunków przepustowości cegły — bez zmian.
- Testy: NOWY gra/tools/brick-production-x2-test.cjs; zaktualizowane (stare liczby): converter-era-scaling-test.cjs (cegielnia era2/3, produkcja 100/200 zamiast 50/60, outputAmount), converters-test.cjs (2 asercje: 2 cykle ×2 = 4 cegły, było 2), hud-konwerter-dopasowanie-test.cjs (cegła 100 zamiast 50). Uzasadnienie: zmiana recepty i wzoru epoki z decyzji właściciela.
- dyspozycje/.../brick-live-measure.cjs (narzędzie pomiarowe od orkiestratora, dołączone jako dowód).

## TESTY (exit; wszystko foreground)
- brick-production-x2-test: 53/0 (RED na starym kodzie z definicji: brak eksportu mapy PCT i outputAmount 1; mutacje: stary wzór +10% ≠ nowy w epokach 2 i 3; stary outputAmount 1 daje 5 zamiast 10 cegieł przy 5 drewna).
- converter-era-scaling-test 96/0; converters-test 49/0; hud-konwerter-dopasowanie 20/0; citypanel-konwerter-produkcja 83/0; citizen-consumption-era-mult PASS; wire-ekonomia 37/0; building-stock-visibility 7/0; cyna-surowiec 78/0 (na wariancie przejściowym; po wariancie końcowym przebieg przekroczył limit czasu przy obciążeniu maszyny load≈24 — test nie zawiera odwołań do cegły/cegielni: NIE_ZMIERZONO po zmianie końcowej).
- Pozostałe FAIL identyczne jak baza origin/main (zmierzone przed zmianą): ekonomia-5x-inwariant 197/50, citizen-resource-upkeep 107/2, resource-usage-breakdown 98/2, mennica-magazyn 34/7, ai-major-economy (crash), eko-tech-paczka1 5/6, szczescie-przebudowa-skali 515/4 — zero nowych regresji (porównane listy FAIL).
- ai-test 274/20 (= baza). war-allin-capital-quick hash 655a1e48121dea93 = baza (determinizm bez zmian).
- tsc --noEmit: EXIT=0.

## POMIAR PO (gra) — NIE_ZMIERZONO w pełni
Wariant A w grze: 150 cegieł/30 tur (bez zmiany). Wariant B w grze: dwa przebiegi 20–30 tur przekroczyły limit/timeout `endTurn` (maszyna mocno obciążona, load≈24), jeden 12-turowy (seed 7, era 2) miał 0 cykli (drewno=0 — stan startowy gry niedeterministyczny między przebiegami, więc nieporównywalny z przebiegiem „PRZED”). Era 3 w grze: `endTurn timeout` już na turze 2 (przed zmianą; wymuszenie epoki 3 w narzędziu) — NIE_ZMIERZONO. Brak porównania „niedobór cegły zmniejszony” w żywej grze; dowód podwojenia tylko na poziomie silnika/testów (runConverter, advanceCityEconomy gracz era 2 = 150, AI era 3 = 200, panel).

## BLOKADY
1. Wzrost o 50%/epokę dotyczy CYKLI. W reżimie ograniczonym wejściem (drewno, jak zmierzone) wzrost epoki nie podnosi wyjścia, dopóki nie przybędzie drewna — x2 z outputAmount działa zawsze, bonus epoki tylko gdy cykli brakuje. Opcja C (do decyzji orkiestratora/właściciela): mnożnik epoki stosowany do wyjścia (zaokrąglanie, zmiana `runConverter`).
2. Dispatch podaje „epoka 3 = 1,5× epoki 2 (bazowo)”; przy liniowym 1/1,5/2 jest 2/1,5 = 1,33×. Wdrożono liniowo (zasada b); 1,5× między kolejnymi epokami oznaczałoby mnożnik złożony 1/1,5/2,25.
3. Rozjazd z interpretacją „(a) ×2 względem dzisiejszej”: dziś era 2 = 55, po zmianie 150 cegieł (2,7×) — wynika z połączenia ×2 i +50%/epokę.
4. Nowy stan salda: gracze/AI w erze 1 mają 100 cegieł/turę z Cegielni (było 50) — wpływ na budżet AI niezmierzony w żywej grze.

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (weryfikacja wariantu B, decyzja o opcji C i bonusie epoki przy wejściu-ograniczonym; ponowny pomiar żywy przy mniejszym obciążeniu).
## DEPLOY/PUSH: NIE WYKONANO
