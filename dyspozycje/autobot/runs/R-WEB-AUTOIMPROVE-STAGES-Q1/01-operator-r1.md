STATUS: PASS-WITH-NOTES (zmiana kodu zakonczona i zielona; trzy pytania ABC nieblokujace, patrz BLOKADY)
DOMAIN: GAME (WEB — `gra/`, NIE port Rust)
TEMAT: R-WEB-AUTOIMPROVE-STAGES-Q1
GOAL: (RUNDA 5/5 dispatchu: brak limitu w niedoborze + doprecyzowanie wlasciciela) w K2 (gracz „Zrownowazone") i K3 (AI) krok „brakujacy surowiec" bez limitu liczby ulepszen; tartak/oboz nigdy na heksie rzeka+las; wycinka tylko pod farmy; drogi dopiero gdy nie ma kandydata dla zywnosci ani surowca.
Nota: plik nazwany `01-operator-r1.md` na polecenie workflow (stara tresc R4 przeniesiona `git mv` do `01-operator-r1-archiwum-r4.md`). „Runda 1/5" w zadaniu workflow = licznik wywolania; zakres = RUNDA 5/5 dispatchu (ostatnia, po niej brak kolejnej rundy tego ID).

ZMIANY/COMMIT
Baza: `origin/main` 9e54b96f8. Allowlista: `gra/src/game/auto-improvements.ts`, `gra/tools/autoimprove-stages-q1-test.cjs`, `dyspozycje/autobot/runs/R-WEB-AUTOIMPROVE-STAGES-Q1/**`. ZERO zmian: `main.ts`, `ai.ts`, `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, JSON-y.
Kod (plik:linia po zmianie, `auto-improvements.ts`):
 1. Usuniety `limitForestKeysToMinimum` (opcja `PickAutoImprovementsOpts`, 6 wywolan w `pickAutoImprovements`, destrukturyzacja pickera, test `haveForest >= lesneMin` w `keyBlockedOnHex`). K2/K3 maja BRAK limitu tartakow/obozow: tartak powstaje na kazdym dostepnym lesie (z obywatelem wg `getResourcePassOnlyWorked`/`getOnlyWorked`) dopoki trwa niedobor drewna i jest Praca (`keyBlockedOnHex` ~1349-1356).
 2. NOWA REGULA (decyzja R5 e): `keyBlockedOnHex`: `demandActive && (tartak|oboz_lowiecki) && riverHexKeys.has(hexKey)` -> zablokowane. Tartak tylko na lesie BEZ rzeki; obozu na rzece+las nie ma (wymaga tartaku na heksie). Dotyczy tez kroku „brakujacy surowiec" (`demandDriven` przechodzi przez `after()`), wiec rowniez przy trwajacym niedoborze drewna.
 3. `lesneWymagane` (~1322): w K2/K3 puste (`!demandActive`) — minimum lesne `ceil(pop/10)` nie jest juz wymaganiem wycinki. Profile „surowce"/„infrastruktura"/wywolania bez `demandDriven` BEZ zmian (zachowanie bazy).
 4. Wycinka TYLKO pod farmy (decyzja R5 b; K1/K2/K3): nowe `wyrabTylkoPodFarme = demandActive || focus==='zywnosc'` i `wyrabMaSens` (~1218-1228) — wyrab tylko na heksie, gdzie farma jest mozliwa po wycince (`isFarmBaseTerrain(teren, Brak)` = Laka/Rownina, improvement-build.ts:387). Las na Wzgorzach/Gorach NIE jest karczowany (farma tam niemozliwa — wyrab nie „na zapas"). Wplyw: `riverKrok0Ok` (E2 i KROK 0) oraz warunek wycinki poza rzeka (E5/KROK 0). Przed R5 las na Wzgorzach byl wycinany bez celu (czerwony test).
 5. Drogi (decyzja R5 3): bez zmiany kodu krokow — usuniecie limitu powoduje, ze probe `deficitIsPending` widzi wszystkie lasy z kandydatem, wiec drogi startuja DOPIERO po ostatnim tartaku/zywnosci (test (r5-drogi)). „Drogi po limicie tartakow" (R4, zalozenie Z3) przestaje istniec — limitu nie ma.
 6. Komentarze (FOOD_STAGES E6, JEDEN_NA_ILU_OBYWATELI, `keyBlockedOnHex`) zaktualizowane: stare ECHO „1 na 10 obywateli" = nieaktualne w K2/K3.
 7. Heks z tartakiem/obozem nie jest wycinany (strazniki `riverKrok0Ok`, KROK 0, FAZA 2 — bez zmian, przetestowane w (c)).

TABELA LIMITOW (zadanie R5 pkt 4: kazdy znaleziony limit, zrodlo, status)
 L1 `limitForestKeysToMinimum` + `lesneMin=ceil(pop/10)` w `keyBlockedOnHex` (stare ~1359-1365; ECHO wlasciciela 2026-08-27 „jeden tartak i obóz na 10 obywateli") — USUNIETE (K2/K3).
 L2 `lesneWymagane`/`lesneMinSpelnione` (bramka wycinki poza rzeka, ~1322-1340) — WYLACZONE w K2/K3; zostaje dla „surowce"/„infrastruktura". Zmierzone: mutacja M4 rownowazna (E5 pokrywa wycinke poza rzeka wczesniej) — czyszczenie bez zmiany zachowania.
 L3 `FOOD_STAGE_MAX_ITEMS_PER_CITY=3` (auto-improvements.ts ~482; intencja „nie 15 heksow naraz", R-AI-WYRAB-PRZY-RZECE-FARMY-Q1) — dotyczy WYLACZNIE etapow zywnosci E1-E6; krok „brakujacy surowiec" go nie uzywa (nie ma pulapu 3 w deficycie). ZOSTAJE (to nie limit niedoboru).
 L4 `defenseCap=ceil(pop/10)` (FAZA 0 obrona, ~1164) — w K2/K3 FAZA 0 zamknieta (R4); nie dotyczy niedoboru; profil „infrastruktura" bez zmian.
 L5 `maxItemsPerCity` — AI: usuniety w R3 (D=B); gracz: brak. Brak limitu.
 L6 `WYRAB_MIN_FOREST_IN_RADIUS=3` — tylko wycinka poza rzeka w profilach niestagowanych; nie dotyczy tartaku; E5 zwolniony (ABC-3=B).
 L7 Limit % puli Pracy (`pracaBudgetPercent`/`imperiumBudgetCap`) i rezerwa 30 — dziala TAK SAMO w kroku niedoboru (ustawienie gracza). NIE ZMIENIONE -> pytanie ABC-R5-3.
 L8 Straznik „jedna warstwa danego klucza na heksie" (duplikat) — naturalny, nie jest limitem liczby.
 L9 Prog niedoboru „<10 szt." — bez zmian (decyzja C z R3).

TABELA KONTEKSTOW
 K1 gracz „Zywnosc": brak odwolan do niedoborow i zero tartaku/obozu (bez zmian); zmiana R5: wycinka tylko Laka/Rownina (`wyrabTylkoPodFarme`, focus==='zywnosc'). Testy (r5-wyrab) [K1]. Zgodne.
 K2 gracz „Zrownowazone" i K3 AI: ta sama funkcja; niedobor drewna -> tartak na wszystkich lasach BEZ rzeki, bez limitu; rzeka+las -> wyrab->farma, nigdy tartak/obóz; niedobor zaspokojony -> koniec tartakow, powrot do zywnosci; bez niedoboru 0 tartakow; drogi na koncu. Parytet K2=K3 (identyczne sekwencje) w (r5-parytet). Zgodne.

TESTY (logi w katalogu runu, kazdy gate z jedna linia `EXIT=`)
tsc: PASS (`gate-r5-tsc.txt`, EXIT=0).
Bramki PO (gate-r5-*.txt, wszystkie EXIT=0): autoimprove-stages-q1 218/0 (baza R4 184/0; usunieta stara asercja (k2) limitu ceil(pop/10) — pkt zastapiony R5, +34 asercje netto), wyrab-rzeka-krok0 3/0, wyrab-rzeka-r2 10/0, wyrab-rzeka-d1 2/0, auto-improvements 46/0, ai-improvements 53/0, ai-food-improvement-priority-stages 13/0, ai2-heks-po-heksie 37/0, hodowla-las 113/0, ai4-popyt-obywatele 55/0, ai-ulepszenia-malo-budowane 13/0, spichlerz-hud-params-parity 66/0, city-clears-forest 18/0, fort-outpost-hard-territory 80/0, diplomacy 148/0, war-era-counter 82/0, unit-owner-emblem-ring-civ-color 15/0.
Czerwony PRZED: nowy test na zrodle bazowym 9e54b96f8 -> 192 passed / 26 failed (`red-przed-r5-9e54b96f8-autoimprove-stages-q1-test.txt`): tartaki 2 zamiast 6 [K2,K3]; tartak i oboz na rzece+las przy niedoborze drewna; brak tartaku na lesie bez rzeki (3/3); wycinka lasu na Wzgorzach [K1,K2,K3]; tartakow przed drogami 2 != 6.
Zmiany oczekiwan w istniejacych testach: tylko `autoimprove-stages-q1-test.cjs` (k2): stara asercja „tartaki w granicach 1..ceil(pop/10)" (autoimprove-stages-q1-test.cjs, poprzednio ~l.343-351) zastapiona dwiema przeciwnymi — uzasadnienie: decyzja wlasciciela R5 „Te ustalenia sa juz kompletnie nieaktualne". Zadna inna bramka nie zmienila oczekiwan (ai4-popyt 55/0 i ai2 37/0 zielone bez edycji).
Nowe testy (autoimprove-stages-q1-test.cjs): (k2) brak limitu / zaspokojenie / brak niedoboru [K2,K3]; (r5-river) tartak/oboz nie na rzece+las, tartak na lesie bez rzeki, tylko-rzeka => tartak 0 i niedobor zostaje, wyrab+farma ida; (r5-wyrab) wycinka tylko pod farme [K1,K2,K3], las na Wzgorzach nietkniety, rzeka+las na Wzgorzach bez wyrebu i tartaku; (r5-drogi) droga dopiero po ostatnim tartaku/zywnosci; (r5-parytet) K2=K3.
Mutacje (`mutacje-r5-autoimprove-stages-q1.txt`): M1 przywrocony limit ceil(pop/10) ZABITA (10 failed); M2 usunieta regula rzeki ZABITA (10); M3 usuniety `wyrabTylkoPodFarme` ZABITA (8); M4 przywrocone `lesneWymagane` PRZEZYLA — ROWNOWAZNA (opis w pliku i w L2).
POMIAR AI (5 ziaren 7,99,512,4242,1337 x 40 tur, 3 miasta, pop 6; `ai4-popyt-obywatele-measure.cjs`; PRZED = `pomiar-r5-przed-9e54b96f8-ai4-measure.txt`, PO = `pomiar-r5-po-ai4-measure.txt`):
 A bez niedoboru: bez zmian (228 rozkazow; tartak 0; droga 28; wyrab 18).
 B stale niedobor drewna: rozkazy 238 -> 371; tartak 13 -> 128 (15 miast, ok. 8,5/miasto), oboz 9 -> 34; zywnosc 182 -> 204; wyrab 15 -> 11; drogi 28 -> 28 (dopiero po tartakach).
 C niedobor w t10-19: rozkazy 248 -> 376; tartak 14 -> 121 (wszystkie w t10-t14, potem 0 = stop po zaspokojeniu), po oknie powrot do zywnosci; wyrab 18 -> 18.
 Spadek wyrebu w B (15 -> 11): tartaki zajmuja lasy na rowninie, ktore bez nich bylyby wycinane pod farmy (patrz ABC-R5-1).
 AI-GRACZA profile bez `demandDriven` (surowce/infrastruktura/zywnosc/zrownowazone): tabela 4 profili bez zmian (384/98/549/440 wzgl. R4, identyczne PRZED i PO).
NIE_ZMIERZONO: przebieg Chromium/realnej petli tury `main.ts` w R5 (zmiana nie dotyka `main.ts`/`ai.ts`; sciezka gracza `main.ts` wola ten sam produkcyjny `pickAutoImprovements`; weryfikacja = symulacja tura po turze produkcyjnym pickerem i `decideAITurn`, nie zywe UI).

BLOKADY
 - Brak blokad technicznych. Zalozenia jawne: (Z1) „tartak na rzece nie, niedobor zostaje" — gdy nie ma lasu bez rzeki, niedobor drewna trwa, a drogi startuja po wyczerpaniu kandydatow (`deficitIsPending` fałsz) — nie ma nieskonczonego blokowania drog; (Z2) wycinka pod farmy rozumiana jako „Laka/Rownina z lasem" (`isFarmBaseTerrain`) — farma na Wzgorzach jest niemozliwa wg R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1.
 - PYTANIE ABC-R5-1 (K2 gracz „Zrownowazone" i K3 AI): pierwszenstwo farmy przed tartakiem na lesach poza rzeka. Zmierzone PO: krok „brakujacy surowiec" idzie PRZED etapami, wiec tartak zajmuje las na rowninie, ktory etap E5 wycialby pod farme (wyrab 15 -> 11 w scenariuszu B). Wlasciciel: „nie ruszaj lasow potrzebnych pod farmy". A = zostaw (stan wdrozony; niedobor wazniejszy; tartaki tylko dopoki trwa niedobor); B = tartak na lesie poza rzeka tylko tam, gdzie farma niemozliwa (Wzgorza/Gory) albo po wyczerpaniu lasow pod farmy; C = tartak na lesie rowninnym dopiero gdy niedobor trwa dluzej niz N tur. Rekomendacja: A (jest to jawne „gdy niedobor": las jest obfity, lasu jest wiecej niz miasto zajmie farmami), kontekst K2/K3.
 - PYTANIE ABC-R5-2 (profile „surowce"/„infrastruktura" gracza — NIE K1/K2/K3): stara regula FOREST_COEXIST (auto-improvements.ts ~1440-1451, R-AI-WYRAB-PRZY-RZECE-FARMY-Q1) dopuszcza tartak/oboz na rzece+las, gdy krok 0 wycinki nie jest dopuszczony. Nowa regula R5 dotyczy tylko K2/K3. A = zostaw w „surowce"/„infrastruktura" (jawny wybor gracza; stan wdrozony; rekomendacja); B = zastosuj regule tez tam.
 - PYTANIE ABC-R5-3 (K2/K3): limit % puli Pracy (`pracaBudgetPercent`, ustawienie gracza/imperium) i rezerwa 30 obowiazuja tez w kroku niedoboru; wlasciciel: „zadnego limitu w sytuacji niedoboru". A = zostaw (to polityka budzetu, nie limit liczby; stan wdrozony); B = zwolnij krok „brakujacy surowiec" z limitu % (jak E3/E4 w Q2=B), zostaje rezerwa 30 i sama Praca; C = zwolnij takze rezerwe. Rekomendacja: B (spojne z Q2=B) — wymaga decyzji, bo zmienia budzet gracza.
 - Informacja do Evaluatora: M4 rownowazna (patrz L2); komentarz-historia w `auto-improvements.ts` ~110-122 (ULEPSZENIA_ZYWNOSCIOWE) bez zmian (poza zakresem).

RUNDY: 1/5 (licznik workflow); zakres = RUNDA 5/5 dispatchu. Zuzyte: 1. Ostatni werdykt: brak (pierwszy raport Operatora tego przebiegu). Decyzja wymagana: nieblokujaca (ABC-R5-1..3).
NASTEPNY KROK: Evaluator (to samo ID) — niezalezny przebieg bramek gate-r5-*, mutacji i przeglad usunietej asercji (k2); potem Obrona/Final Control; integracja orkiestratora; READY_FOR_DEPLOY dopiero po niej.
DEPLOY/PUSH: NIE WYKONANO
COMMIT SHA: patrz ostatnia linia pliku (uzupelnione po commicie) i `git log -1`.
