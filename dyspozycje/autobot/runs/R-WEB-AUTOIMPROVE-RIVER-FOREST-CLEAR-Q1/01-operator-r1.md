STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTOIMPROVE-RIVER-FOREST-CLEAR-Q1
GOAL: wycinka lasu na polach obywateli (takze przy rzece) pod farmy wg profilu automatu: Zywnosc i Zrownowazony (+AI) — z zachowaniem (a)-(d)
ZMIANY/COMMIT: f4ef94523 (baza origin/main 6983bbb4d, po IRRIGATION-NOT-BUILT-Q1). Pliki: gra/src/game/auto-improvements.ts (nowy eksport `skipWyrabForFocus`), gra/src/main.ts (tylko `getSkipWyrab` + import), NOWE gra/tools/autoimprove-river-forest-clear-q1-test.cjs, gra/tools/river-forest-clear-measure.cjs. Commit raportu: patrz SHA w odpowiedzi.

## Przyczyna (zmierzona, nie domysl)
`DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = false` (cities.ts:226) -> main.ts `getSkipWyrab: !wolnoWycinacLas` dla KAZDEGO profilu -> picker usuwal `wyrab` z listy (auto-improvements.ts `prioritiesForUlepszeniaFocus`/`citySkipWyrab`). Przy ustawieniach domyslnych Zywnosc i Zrownowazony NIE wycinaly nic. Etapy E1-E6, budzet (pula 33%), `lesneMin`, filtr obywateli, U-5 — NIE sa przyczyna (przy przelaczniku WL: wszystkie pola wyciete, rowniez przy skapej puli 3/ture). AI nie ma przelacznika (`skipWyrab:false`) — wycina poprawnie.

## Pomiar PRZED vs PO (`river-forest-clear-measure.cjs`: generateMap + workedHexCoordsForCity + prawdziwy picker/decideAITurn; 5 ziaren x 100 tur, 3 miasta, las 90% w r=4, przelacznik gracza WYL = domyslny, pula Praca 12/ture/miasto, 33%)
| profil | PRZED wycieto (rzeka) / pol z lasem przy rzece nietknietych | PO wycieto (rzeka) / nietknietych | farmy PRZED->PO | irygacja |
| Zywnosc | 0 (0) / 12 | 13 (12) / 0 | 41->54 | 41->54 |
| Zrownowazony | 0 / 12 | 13 (12) / 0 | 41->54 | 41->54 |
| Zrown.+deficyt drewna | 0 / 12 | 13 (12) / 0 | 41->54 | 41->54 |
| Surowce | 0 / 12 | 0 / 12 (bez zmian — przelacznik rzadzi) | 0 | 0 |
| AI | 13 (12) / 0 | 13 (12) / 0 (bez zmian) | 54 | 54 |
Powod niewyciecia PRZED (zdarzenia `onDecision`): 12/12 "wycinka wylaczona" (citySkipWyrab). Tartak gracza przy deficycie drewna: 0 PRZED i 0 PO (bez regresji; AI 53 bez zmian). "PO ai+deficyt drewna": NIE_ZMIERZONO (przebieg przerwany; kod AI niezmieniony, wiersz PRZED=53).

## Naprawa (ZAŁOZENIE operatora — do potwierdzenia przez wlasciciela)
`skipWyrabForFocus(focus, wolno)`: Zywnosc/Zrownowazony -> wycinka ZAWSZE dozwolona (to czesc profilu: wycinka pod farmy, E2 przy rzece, E5 poza); Surowce/Infrastruktura -> `!wolno`. Picker nadal: tylko pola obywateli (a), tylko teren pod farme, nie tyka lasu z tartakiem/obozem (c), brak awaryjnego tartaku/jezior (d), `lesneMin` i zabezpieczenia drewna nietkniete; las przy rzece dostaje farme (b). Kolejnosc priorytetu profilu (Zywnosc vs Zrownowazony) bez zmian: etapowa E1-E6 (rzeka przed reszta).
Konsekwencja: przelacznik "Wolno wycinac las" przestaje wplywac na Zywnosc/Zrownowazony (zostaje dla Surowce/Infrastruktura). Etykieta/tooltip UI (buildModeHud.ts) poza allowlista — NIE zmieniona (do decyzji orkiestratora). Alternatywa (A): zmienic domyslny przelacznik na WL (cities.ts, poza allowlista) — nie wybrana, bo nie naprawia zapisow z jawnie WYL.

## TESTY
- Nowy `autoimprove-river-forest-clear-q1-test.cjs`: PO 28/28; RED na zrodle PRZED 9 OK/14 FAIL; mutacja M2 (helper bez Zrownowazony) 22/6 FAIL (czerwona); M3 (main.ts bez helpera) 27/1 FAIL (czerwona).
- Regresje PO zielone: ai-food-only-worked-hexes 81/0, ai-improvements 56/0, auto-improve-no-item-cap 15/0, auto-improve-q3 48/0, auto-improvements 46/0, autoclear-priority-q1 60/0, autoclear-river-forest-priority 18/0, autoimprove-irrigation-after-farms 43/0 (test dlugi, >120 s), autoimprove-stages-q1 302/0, city-clears-forest 18/0, city-orderstate-restore-clear 9/0, farma-lesie-usun-istniejace 143/0, farma-nie-w-lesie 138/0, oboz-lowiecki-wymaga-tartaku 16/0, sawmill-hill-relief 8, sawmill-quarry-50-economy 7/0, tartak-glinianka-rate-Q1 1281/0, wycinka-drewno-cap 15/0. Zadnego istniejacego testu nie trzeba bylo zmieniac.
- Identyczna porazka PRZED i PO (pre-existing, nie od tej zmiany): tartak-oboz-wyscig-race-test (TypeError commitPlayerPick), autoimprove-live-hooks-test 36/1 (main.ts importuje installCivTestHooks).
- tsc --noEmit: EXIT=0. Logi: gate-*.txt w tym katalogu (jedna linia EXIT=).

## BLOKADY / UWAGI
- NIE_URUCHOMIONO (wymagaja bundla/przegladarki): autoclear-priority-live, city-clears-forest-live, wyrab-wycinka-nazwa-live, tartak-wzgorze-las-real-render. Brak weryfikacji w przegladarce (zmiana logiczna, nie wizualna).
- INCYDENT: `farma-cofnij-nieaktualny-wpis-test.cjs` sam uruchomil `vite build` (do wlasnego dist) — przerwany po starcie, katalog usuniety; zadnych sladow w git. Test pominiety.
- Model symulacji: wycinka natychmiastowa (dane: 1 tura), pola obywateli z realnej `workedHexCoordsForCity`, nie zywa gra.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (potwierdzic ZAŁOZENIE: przelacznik nie dotyczy Zywnosc/Zrownowazony; ewent. decyzja o etykiecie UI)
DEPLOY/PUSH: NIE WYKONANO
