STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-STARVATION-SURRENDER-Q1
GOAL: Oblężenie w 2 etapach: zapasy (garnizon zdrowy) -> głód garnizonu (6/8/10% maxHP/turę od zera zapasów) -> poddanie gdy ΣHP/startMaxHP < 0,5 (decyzja właściciela 2026-11-05).
ZMIANY/COMMIT: baza origin/main 3aa1b3a2a; commit 7c23ea90ab61c5c227b0a073815b9784fabbcfd4 (SHA raportu dopisany w kolejnym commicie).
Pliki: NOWY gra/src/game/siege-starvation.ts (czysta `siegeStarvationState`); gra/src/game/siege-surrender-forecast.ts (nowa prognoza); gra/src/main.ts (import, blok N3, plakietka `siegeSurrenderBadgeFor`, 3x kasowanie pola); gra/src/game/cities.ts (pole `siegeStarveStartMaxHp?`); gra/src/game/siege-last-stand.ts (tylko komentarz); NOWY gra/tools/siege-starvation-test.cjs; zaktualizowany gra/tools/siege-surrender-forecast-test.cjs; logi gate-*.txt. Zero zmian w turn-economy.ts, army-starvation.ts, WERSJE.md, gra-robocza, rust-port, src-tauri, battle.

MECHANIZM (po zmianie):
- Etap 1: bez zmian (magazyn -= ludność + garnizon). Atrycja od 1. tury oblężenia WYŁĄCZONA.
- Tick, w którym magazyn spada do 0, zapisuje `city.siegeStarveStartMaxHp` (ΣmaxHP garnizonu), bez atrycji i bez poddania.
- Każdy kolejny tick: atrycja `glodWojskaHpFrac` (floor(maxHP*frac), min 1, jak dotąd), potem poddanie gdy ΣHP/start < 0,5 (ścisła nierówność, remis 50,0% trzyma się) albo garnizon pusty po starcie głodu.
- Bez garnizonu: dotychczasowa ścieżka flagi (tick zera -> pending, następny tick przejmuje).
- Pole kasowane przy rozpoczęciu/zdjęciu oblężenia (zasoby i HP zostają).

TESTY (logi gate-*.txt z `EXIT=`):
- tsc --noEmit: czysto (EXIT 0).
- siege-starvation-test (nowy): 54/54 (A jednostkowa, B przebieg N3 z realnym modułem + realnym applyArmyStarvationHpLoss, C prognoza==symulacja 1080 scenariuszy x 3 trudności, D stare zapisy, E strukturalna, F 6 mutacji zabitych: próg 0,4, atrycja od 1. ticka, flaga bez HP, <= zamiast <, pusty garnizon, ignorowanie pending). RED (SIEGE_STARV_MODULE=/nie/istnieje): fail=1.
- siege-surrender-forecast-test: 57/57 (zaktualizowany: symulacja B odwzorowuje głód garnizonu, A: mk(1,9,3)->8 zamiast 2 [garnizon 3: 1 tick zapasów + 7 głodu], licznik monotoniczny dla ścieżki bez garnizonu; naprawiono ścieżkę importu w mutacjach).
- oblezenie 27/27, oblezenie-remis-endsiege 271/271, oblezenie-siege-lifted-po-bitwie 16/16, siege-last-stand-sortie 71/71, siege-surrender-enter-city 32/32, siege-blockade-no-recruit-reinforce 57/57, siege-defenders 12/12, siege-ai 17/17, map-siege 6/6, city-siege-wall-rules 50/50, siege-manual-battle-behavior 40/40, empire-food-b5 34/34, war-allin-keep-barb-defense 8/8, war-allin-general-path-barb-defense 24/24.
- ai-test: 274 passed / 20 failed = punkt odniesienia (274/20), bez zmiany.
- glod-wojska-karencja-test: 29/10 fail — PRE-EXISTING (test importuje tylko empire-food/army-starvation/economy-upkeep, żaden niezmieniony przeze mnie plik nie jest dotknięty; moduły identyczne z origin/main). Nie mierzono na czystym main osobno (NIE_ZMIERZONO bezpośrednio, wniosek z identyczności modułów).
- siege-tower-breach-everywhere-test: ENOSPC (brak miejsca w /tmp) — NIE_ZMIERZONO.
- war-allin-capital-quick (hashe determinizmu): NIE_URUCHOMIONO (zmiana dotyka oblężeń; hashe mogą się zmienić — do weryfikacji przez Evaluatora).

PRZED/PO (scenariusz: 5 jednostek maxHP 100, magazyn 40, ludność 6; ticki = końce tur; replika N3 z realnymi modułami, NIE Chromium):
- Łatwy 6%: PRZED poddanie w ticku 5 (HP 470/440/410/380/350) | PO zero zapasów w ticku 4, poddanie w ticku 13 (HP 500x4, 470...230).
- Normalny 8%: PRZED 5 (460/420/380/340/300) | PO zero w 4, poddanie w 11 (500x4, 460...220).
- Trudny 10%: PRZED 5 (450/400/350/300/250) | PO zero w 4, poddanie w 10 (500x4, 450...200).
Czyli czas oblężenia = ceil(zapas/zużycie) + 9 / 7 / 6 ticków.

ZAŁOŻENIA/WYBORY (bez ABC):
1. Interpretacja „od tury, w której magazyn = 0": atrycja startuje w ticku PO ticku, który wyzerował magazyn (zgodnie z „zapas÷zużycie + 7" w dispatchu); tick zera tylko zapisuje start. Alternatywa (atrycja już w ticku zera) skraca oblężenie o 1 tick — zmiana jednej linii (`recordStart` -> atrycja).
2. Pole `siegeStarveStartMaxHp` dodane (opcjonalne); stary zapis z zerem zapasów: pierwszy tick zapisuje start z bieżących maxHP, HP liczone jak są.
3. Prognoza plakietki: dokładna symulacja per jednostka (realne HP) gdy lista jednostek dostępna, inaczej model ułamkowy n=floor(0,5/frac)+1. Tooltip w etapie głodu: „Głód garnizonu…". Założenie stałego garnizonu/zużycia.
4. `isLastTurn` w siege-last-stand.ts: tylko komentarz (wypad w każdej turze bez zmian; flaga pending dotyczy już tylko miasta bez garnizonu).
5. Jednostki cywilne w garnizonie pomijane (jak w applyArmyStarvationHpLoss).

BLOKADY: brak blokujących. NIE_ZMIERZONO: Chromium (live-test siege-surrender-forecast-live-test, pomiar na żywej mapie) — brak miejsca na dysku (1,5 GB wolnych; vite build + zrzuty) i zakaz `npm run build` w gra/; wymaga budowy poza repo przez Evaluatora/orkiestratora. war-allin-capital-quick, siege-tower-breach-everywhere (ENOSPC).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (te same ID): weryfikacja Chromium (hak ?civTest=1: oblężone miasto z garnizonem 5, magazyn 40) PRZED/PO dla 3 trudności, war-allin-capital-quick, siege-tower-breach; ocena założenia 1.
DEPLOY/PUSH: NIE WYKONANO
