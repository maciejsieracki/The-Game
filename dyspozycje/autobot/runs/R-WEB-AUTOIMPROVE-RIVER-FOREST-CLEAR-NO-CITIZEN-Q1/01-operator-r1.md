STATUS: PASS-WITH-NOTES (wdrożone + przetestowane; 2 otwarte ryzyka produktowe w BLOKADY — spadek ulepszeń surowcowych AI oraz niski odsetek auto-przydziału obywatela po wycince)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTOIMPROVE-RIVER-FOREST-CLEAR-NO-CITIZEN-Q1
GOAL: wycinka lasu przy rzece (Łąka/Równina) także BEZ obywatela (decyzja właściciela ABC odp. B + dopisek 2026-11-05), bez głodzenia innych ulepszeń; pomiar, czy auto-rozdział sam obsadza wycięte pole (zad. 6).

ZMIANY/COMMIT: baza origin/main c9103e161. SHA: patrz końcówka pliku (commit z jawnym `git add`, bez push).
- `gra/src/game/auto-improvements.ts`: wyjątek w `hexAllowsKey` tylko dla `wyrab` (rzeka wg `isHexNearRiver`/`onRiverHex`, `isFarmBaseTerrain` = Łąka/Równina, profil Żywność/Zrównoważony + AI) i tylko w NOWYM, OSTATNIM kroku `pickAutoImprovements` (flaga `riverClearNoCitizenPass`, po deficycie/KROK 0/E1–E6/zapasowej/fort/drogach/pozostałych profilach). Warunki: żaden wcześniejszy cel nie czeka na Pracę (`earlierStageIsPending`/`fallbackIsPending`/`fortIsPending`/deficit pending); limit `RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY=2` na miasto/przebieg; podłoga puli `RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR=60`. Farma/irygacja/trzoda nadal tylko z obywatelem; heks po wycince zostaje czysty. `ai.ts`, `main.ts`, `improvement-build.ts` NIE ruszane.
- Nowe: `gra/tools/autoimprove-river-forest-clear-no-citizen-q1-unit-test.cjs` (11 asercji), `gra/tools/autoimprove-river-forest-clear-no-citizen-q1-test.cjs` (pomiar Chromium, tryb ASSERT=1).
- Zaktualizowane testy (kontrakt „0 wycinek bez obywatela” → nowa reguła rzeczna; farma po wycince nadal wymaga obywatela): ai-food-only-worked-hexes, simple-food-rule-no-toggles, autoimprove-river-forest-first-q1 (pkt 5: wycinka bez obywatela jest OSTATNIA), auto-improve-q3, autoclear-river-forest-priority, autoimprove-irrigation-after-farms.

TESTY (logi `gate-*.txt`, każdy z `EXIT=`):
- tsc EXIT=0. Nowy unit 11 OK. RED na bazie (src origin/main): 5 OK/6 FAIL. Mutacje (`gate-mutations.txt`): przywrócenie wymogu obywatela 5 FAIL; wycinka na Wzgórzach 1 FAIL; zdjęcie limitu 1 FAIL; wyjątek w etapach (bez „ostatniego kroku”) 3 FAIL.
- Regresje EXIT=0: ai-food-only-worked-hexes (69/0), simple-food-rule-no-toggles, autoimprove-river-forest-first-q1 (12/0), autoclear-river-forest-priority, auto-improve-q3, autoimprove-stages-q1, autoimprove-irrigation-after-farms (42/0), auto-improve-no-item-cap, auto-improvements, ai-improvements, farma-*, oboz-lowiecki-wymaga-tartaku, sawmill-*, tartak-* (w tym real-render 8/0). `ai-test` 274/20 = identycznie jak baza.
- Determinizm: hashe `war-allin-capital-quick` (30 tur, 8 scenariuszy) identyczne baza vs zmiana.
- Czas decyzji pickera (AFW_MEASURE, 2 ziarna×40 tur): AI 30.5→25.6 ms/turę, gracz 29.4→27.2 (bez wzrostu). endTurn w Chromium (13→9–12 s) zaburzony obciążeniem maszyny — NIE_ZMIERZONO rzetelnie.

POMIAR PRZED→PO (Chromium `?civTest=1`, realny endTurn, 30 tur, mapa Malenki, 2 miasta gracza, obywatele AUTO, Praca 100000/100%; `evidence/`, `tabela-po-after2.txt`):
- Gracz, las+rzeka+Łąka/Równina wycięty: s7 Żyw. 0→45, Zrów. 0→49; s42 Żyw. 0→38 (przebieg ubity timeoutem w t.29), Zrów. 0→74; s18 Żyw. 5→66, Zrów. 4→68. Pierwsza decyzja w turze 1 (pole znika po turze wycinki → widoczne w t.2). Rzeczny las w terytorium po 30 turach: 38–64→0.
- Farmy/irygacja/trzoda (gracz): s7 Żyw. 9/10/9→11/12/11; s18 Żyw. 24/23/23→29/22/27; s7 Zrów. 11/12/11→13/14/13; s42 Zrów. 11/11/11→17/12/14; s18 Zrów. 23/22/22→35/18/21. Tartak gracza bez zmian (1→1, 6→6, reszta 0). Drewno (stan) NIE_ZMIERZONO (brak haka).
- Limit: bez limitu (N=4/miasto) 5–12 wycinek/turę/gracz i ~300 wycinek AI/30 tur; N=2 + podłoga 60 dają 2–4/turę gracza.
- ZAD. 6 (auto-przydział po wycince, gracz, 30 tur): s7 4.4%/4.1%, s42 18.4%/8.1%, s18 18.2%/29.4% pól obsadzonych; opóźnienie śr. 1.3–22 tur. AI: 20–34% (opóźn. śr. 3–7 tur). Zał. właściciela „system sam przydzieli” NIE potwierdzone.

BLOKADY:
1. AI: mimo „ostatniego kroku”, limitu 2 i podłogi 60 spada liczba ulepszeń surowcowych AI (ziarna 7/42 Zrów., po podłodze): kamieniolom 116→53, 74→46; tartak 14→6, 19→9; kopalnie 13→4; farma 77→93, irygacja 21→35. Szum bazy (powtórka): kamieniolom 106/97, 70/53. Przed podłogą było gorzej (116→7, 74→0). Przyczyna (wyjadanie skumulowanej puli AI ~750 Pracy/30 tur vs inna trajektoria) NIE rozstrzygnięta. Opcje: wyłączyć dla AI (wymaga flagi z `ai.ts`, poza allowlistą), podnieść podłogę, N=1. Decyzja orkiestratora/właściciela.
2. Zad. 6, przyczyna do zgłoszenia (hipoteza, wyniki per-pole NIE_ZMIERZONO): auto-rozdział to `assignWorkedTiles` — sortowanie po sumie plonów × wagi + tie-break dystans (`okolica.ts:307-308`, `compareScoredOkolicaTiles`), wołane z `resolveWorkedTiles` (`okolica.ts:338`) przez `turn-economy.ts:656/693`. Czyste pole po wycince ma tylko plon bazowy, a farmy powstają wyłącznie na polach obywateli → pola z ulepszeniami wygrywają ranking (błędne koło). Nie zmieniałem rozdziału (poza allowlistą).
3. N=2 i podłoga 60 dobrane z pomiaru, nie dostrojone dalej. Metryki gracza z builda przed podłogą (after2; przy puli 100000 podłoga bez wpływu — nie potwierdzone osobnym przebiegiem); po podłodze przebiegi tylko s7/s42 Zrów.
4. Test Chromium z ASSERT=1 nie uruchomiony (RED/GREEN = przebiegi before/after tym samym skryptem: pierwsza wycinka null→t.2).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (kontrola zakresu `auto-improvements.ts`, zawężenie testów, ryzyka 1–2) → Obrona → Final Control; decyzja właściciela w pkt 1–2.
DEPLOY/PUSH: NIE WYKONANO
