STATUS: DECISION_REQUIRED (kod gry bez zmian wzgledem 7f58632ed; dopisane testy/pomiary; nadal otwarte: punkt (e) DODATKU 2 oraz tolerancja taktyczna vs auto z DODATKU 3(iii) -- patrz ZARZUT 2)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1
GOAL: bitwa nie konczy sie na zalamaniu morale; uciekinierzy sa celami, gina w poscigu albo opuszczaja plansze na krawedzi SWOJEJ strony; po bitwie brak routed na polu; parytet AUTO=SKIP zachowany.
BAZA: 7f58632ed82c545e8eeb3fb2cc7501eae8fff48f (kandydat operatora). Zmiany tej rundy dotycza WYLACZNIE gra/tools/*, evidence/ i tego raportu; gra/src/** nie zmienione (git diff 7f58632ed -- gra/src = pusty, po mutacjach plik przywrocony z kopii).

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (DODATEK 4 pkt 1: brak pomiaru strat zwyciezcy vs przegranego) -- PRZYJMUJE (pomiar dopisany; wniosek nizej)
Poprawka: gra/tools/battle-rout-pursuit-browser-entry.ts liczy teraz hpStart/hpEnd/hpLostPct per strona (zabici = 0 HP) oraz HP ocalalych z auto-rozstrzygniecia; measure ma ROUT_MODES (skip,watch,instant). Surowe wyjscia: evidence/obrona-before-hp.json (PRZED = kod 1a42785d4, te same pliki entry/measure), evidence/obrona-after-hp-s01.json, -s2-skip-watch-auto.json, -s3.json (PO = 7f58632ed). Seedy 1,2. Skrot (z=zabici jednostki, u=uciekli, hp%=utrata HP strony; WYGRANY = strona zwyciezska):
PRZED (origin/main), tryb skip (taktyczna AUTO):
| scenariusz | seed | zwyciezca: zabici / hp% | przegrany: zabici / uciekli / routed-na-polu / hp% | auto-rozstrz.: zwyciezca hp% ; przegrany |
| wrecz 12v12 | 1 | def 0 / 26% | atk 0 / 0 / 7 / 45% | (auto: wygrywa ATK, 10 zyje, hp-70%; def 0 zyje) |
| wrecz 12v12 | 2 | def 0 / 24% | atk 0 / 0 / 7 / 48% | (auto: ATK wygrywa, 6 zyje, 89%) |
| strzelcy+wrecz vs wrecz | 1 | def 0 / 14% | atk 1 / 0 / 13 / 28% | def 8 zyje, 70%; atk 0 zyje |
| strzelcy+wrecz vs wrecz | 2 | def 0 / 10% | atk 2 / 0 / 12 / 41% | def 9 zyje, 72% |
| konnica vs piechota | 1 | atk 0 / 3% | def 4 / 0 / 5 / 29% | atk 8 zyje, 3%; def 0 zyje (100%) |
| konnica vs piechota | 2 | atk 0 / 6% | def 4 / 0 / 5 / 29% | atk 4%; def 0 zyje |
| przewaga 2:1 | 1 | atk 0 / 18% | def 0 / 0 / 7 / 40% | atk 20 zyje, 42%; def 0 zyje |
| przewaga 2:1 | 2 | atk 0 / 19% | def 0 / 0 / 7 / 34% | atk 43%; def 0 zyje |
PO (7f58632ed), tryb skip:
| wrecz 12v12 | 1 | def 0 / 23% | atk 0 / 12 / 0 / 45% | (jw. -- bez zmian) |
| wrecz 12v12 | 2 | def 0 / 32% | atk 0 / 12 / 0 / 46% | |
| strzelcy+wrecz vs wrecz | 1 | def 0 / 17% | atk 2 / 12 / 0 / 40% | |
| strzelcy+wrecz vs wrecz | 2 | def 0 / 11% | atk 2 / 12 / 0 / 46% | |
| konnica vs piechota | 1 | atk 0 / 3% | def 8 / 6 / 0 / 57% | |
| konnica vs piechota | 2 | atk 0 / 3% | def 9 / 5 / 0 / 64% | |
| przewaga 2:1 | 1 | atk 0 / 16% | def 0 / 10 / 0 / 43% | |
| przewaga 2:1 | 2 | atk 0 / 16% | def 1 / 9 / 0 / 54% | |
Wniosek (liczby, nie opis): w taktycznej AUTO/skip ZWYCIEZCA nie traci ANI JEDNEJ jednostki w zadnym z 8 przebiegow PRZED ani PO (zabici 0), traci 3-32% HP; to jest mniejsze niz straty HP przegranego (40-64% przy tym, ze uciekinierzy z HP zachowanym zanizaja te wartosc). Skargi wlasciciela (wygrany traci 4 jednostki z 37, przeciwnik prawie bez strat) NIE ODTWORZONO w tych 4 scenariuszach; przyczyna kandydatka, nie udowodniona: (a) zrzuty wlasciciela to bitwa mieszana ~37 jednostek z roznymi statami (nie mierzono, brak skladu); (b) PRZED przegrany routowal sie i "przezywal" jako routed/uciekinier z HP, wiec w oknie wyniku wygladal na nieuszkodzonego -- PO uciekinierzy gina (konnica: 8-9 z 14) albo znikaja z planszy (liczeni jako "uciekli"), co zmniejsza te asymetrie, ale nie ja eliminuje (wrecz/2:1: 0-1 zabitych, 9-12 uciekli -- patrz punkt (e)). Zwyciezca w auto-rozstrzygnieciu traci wiecej HP (42-89%) niz w taktycznej (3-32%): auto jest wzorcem wlasciciela. Tryb RECZNY: NIE_ZMIERZONO (wymaga sterowania gracza; AI-ścieżki obu trybow ta sama petla ticków). Brak zmiany MORALE_*/statów (zakaz kryterium 3).

### Zarzut 2 (DODATEK 3 (ii)/(iii): tolerancja niezapisana liczba) -- PRZYJMUJE (liczby dopisane; skutek: DECISION_REQUIRED)
Blad bezwzgledny taktyczna(PO, skip) vs auto-rozstrzygniecie (te same skladu i seed), przegrany: 
| scenariusz | zabici przegranego: taktyczna / auto | uciekli (taktyczna) | blad bezwzgledny zabitych |
| wrecz 12v12 s1/s2 | 0 / zwycieza ATK (auto: def 12 zabitych) -- ZWYCIEZCA RUZNY (taktyczna: obroncy) | 12 | 12 (100%) + inny zwyciezca (PRE-EXISTING: tak samo PRZED) |
| strzelcy+wrecz vs wrecz s1/s2 | 2 / 14 | 12 | 12 (86%) |
| konnica vs piechota s1/s2 | 8-9 / 14 | 5-6 | 5-6 (36-43%) |
| przewaga 2:1 s1/s2 | 0-1 / 10 | 9-10 | 9-10 (90-100%) |
Tolerancja: zapisana jako pomiar -- 36-100% bledu zabitych, tylko konnica jest najblizsza; nie ma "tolerancji", ktora by pokryla wrecz/2:1. Zgodnie z DODATKIEM 3(iii) NIE zmieniam sciezki auto-rozstrzygniecia ani kodu bitwy taktycznej i zglaszam DECISION_REQUIRED (ponizej). Przyczyna: uciekinierzy dobiegajacy do krawedzi sa liczeni jako "uciekli" (przezyli), a w auto nie ma ucieczki (anihilacja). Nowy, niezalezny fakt: wrecz 12v12 -- taktyczna i auto wskazuja innych zwyciezcow w obu seedach, ale to istnialo PRZED zmiana (tabela PRZED), nie jest regresja.

### Zarzut 3 (parytet AUTO=SKIP w poscigu nieudowodniony) -- ODRZUCAM roznice jako artefakt pomiaru; DOWOD PARYTETU DODANY
Roznica skip vs watch w pomiarze Evaluatora (tura 8 vs 9, ataki na routed 6 vs 2) pochodzi z NIEDETERMINISTYCZNEGO zegara harnessu pomiarowego (prawdziwe rAF + swiftshader, tylko Math.random z ziarnem), nie z logiki: ponowny przebieg tego samego seed 2 w trybie skip dal inny wynik niz w pierwszym (przebieg A: skip T8, 6 zabitych, 3 zabitych-jako-routed; przebieg B: skip T9, 9 zabitych, 5 -- identyczny z watch), evidence/obrona-after-hp-s2-skip-watch-auto.json (B) oraz /tmp (A). Dowod parytetu w DETERMINISTYCZNYM harnessie: rozszerzylem istniejacy battle-skip-equals-auto-resolve-test.cjs (zegar fake, rAF kolejkowany, ta sama petla gry) o liczniki poscigu i asercje B6: "ataki na routed > 0 i SKIP == AUTO (ataki na routed, zabici jako routed)". Wynik (surowe): `node tools/battle-skip-equals-auto-resolve-test.cjs` z WSKIP_SEEDS=1,2,3,7 WSKIP_NO_D=1: PASS B4 (SKIP==AUTO: zwyciezca, straty, HP, tura) i PASS B6 dla seedow 1,2,3,7; "38 ok, 0 fail; CZESC B: DONE"; czasy wirtualne auto/skip: 73440/73440, 84368/84320, 72240/72240, 68096/68080 ms (tury 23/26/23/21 identyczne). Dodatkowo dla seeda 1 pelne logi bitwy skip i AUTO sa bajt-w-bajt identyczne (cmp), a log zawiera 37 linii zalamania/ucieczki -- scena bitwa-duza (28v28) realnie przechodzi przez rout i poscig (B6: ataki na routed > 0). Zalecenie: pomiar tury/ataków w measure.cjs traktowac jako orientacyjny (jitter klatek), parytet rozstrzyga test deterministyczny.

### Zarzut 4 (pliki poza allowlista *-test.cjs) -- PRZYJMUJE jako formalne odstepstwo, do akceptacji orkiestratora
battle-rout-pursuit-measure.cjs i battle-rout-pursuit-browser-entry.{ts,html} to narzedzia pomiarowe wymagane przez ZADANIE (A)/(C) i DODATKI 3-4 (pomiar przed/po); nie wchodza do bundla gry (gra/tools/, wejscie tylko przez Vite dev dla testu), nie zmieniaja kodu gry. Nie da sie ich uniknac bez utraty tabel. Nie zmieniam nazw, aby nie psuc spojnosci z evidence; prosze o akceptacje lub przeniesienie.

### Zarzut 5 (slabosc testu regresyjnego) -- PRZYJMUJE (naprawione)
Progi byly na krawedzi jittera (killedWhileRouted 3-5; def zabitych 6-9) i jedyny scenariusz zabijajacy to konnica seed 1. Poprawki w battle-routed-pursued-destroyed-test.cjs: dodany przypadek "konnica goni piechote (seed 2)"; progi z marginesem (killedWhileRouted >= 2, def zabitych >= 5; po zmianie min. 3 i 6, mutacja 0-1 i 4); w scenariuszu piechoty 2:1 dodano "ataki na routed >= 10" (po zmianie 22-24, przed 0). Wynik: 30 PASS, 0 FAIL. MUTACJA 1 (przywrocony `!u.routed` w _enemiesOf, battleScene.ts l.8305): 22 PASS, 8 FAIL (ataki na routed 0 w 3 przypadkach, killedWhileRouted 1/0, def zabitych 4/4, piechota ataki 0). MUTACJA 2 (`_pursuitPending` zwraca false): 25 PASS, 5 FAIL (runda konca = runda zalamania [2,2],[2,2],[8,8]; dobiegniecie do krawedzi [0,0]; ataki piechoty 8 < 10). Po mutacjach plik battleScene.ts przywrocony (git diff 7f58632ed -- gra/src pusty).

### Zarzut 6 (obszary niezmierzone) -- CZESCIOWO PRZYJMUJE, bez zmian kodu
- Oblezenie z wylomem w nowej logice konca bitwy: NIE_ZMIERZONO ponownie (poza zakresem czasowym tej rundy; battle-skip-siege-parity-test 17/0 z raportu operatora). Dlug do osobnego tematu.
- "Kotek i myszka" w wielokrotnych starciach: NIE_ZMIERZONO (wymaga petli swiata; poza allowlista); miara zastepcza: liczba ocalalych przegranego na koniec bitwy: PRZED 5-13 stojacych routed/aktywnych na polu, PO 0 routed na polu, 9-12 "uciekli" (wrecz/2:1) albo 5-6 (konnica); to dalej podlega istniejacemu odwrotowi 2 heksy (zatwierdzonemu przez wlasciciela).
- Sufit PURSUIT_MAX_ROUNDS=30 nie jest cwiczony: zgadzam sie; w pomiarach tury konca 9-18, wiec sufit nie zadzialal. Nie dodaje testu sufitu (wymagalby sztucznego scenariusza, ktory nie dowodzi balansu); zostaje jako parametr zapisany w raporcie operatora.
- Zalozenie `_routWholeArmy` (zalamanie morale armii => rout wszystkich, poza neverRout): to INTERPRETACJA DODATKU 2(a); prosze o potwierdzenie wlasciciela w pytaniu ABC nizej.

## DECISION_REQUIRED (pytanie ABC do wlasciciela, krotko; po polsku)
1. Piechota wrecz o rownej predkosci nie dogania uciekajacej piechoty (jednostka w aktywacji: ruch ALBO cios). Wrecz/2:1: 0-1 zabitych, 9-12 uciekli. Opcje: A (rekomendacja) -- w poscigu jednostka moze w tej samej aktywacji ruszyc i uderzyc zroutowanego wroga; B -- premia szarzy w poscigu tylko dla konnicy/rydwanow; C -- zostawic (taktyczna != auto, auto pozostaje anihilacja).
2. Czy "zalamanie morale armii => rout wszystkich jednostek" (interpretacja DODATKU 2(a)) jest poprawne?
3. Czy skrocic sufit poscigu (30 tur) po wdrozeniu A?
4. Tolerancja taktyczna vs auto: obecnie blad 36-100% zabitych przegranego (tabela w zarzucie 2) -- czy cel to zgodnosc zabitych+uciekli (uciekli traktowani jak zabici w auto), czy zmiana auto-rozstrzygniecia (nie ruszano)?

## TESTY (surowe, ta runda)
- `npx tsc --noEmit` (gra/): exit 0, 0 linii bledow.
- battle-routed-pursued-destroyed-test.cjs: 30 PASS, 0 FAIL (konnica s1/s2, 2:1).
- battle-skip-equals-auto-resolve-test.cjs (WSKIP_SEEDS=1,2,3,7 WSKIP_NO_D=1): 38 ok, 0 fail, B4+B6 PASS dla 4 seedow.
- Mutacja 1: 8 FAIL; mutacja 2: 5 FAIL (patrz zarzut 5).
- Nie powtarzane (gra/src bez zmian wzgledem kandydata; wyniki Evaluatora/operatora wazne): 5 bramek referencyjnych (logic 213/213, tech-tree 20/0, research 33/33, unit-replace 21/21, combat 6/6) i pozostale testy bitew/morale/oblezen -- NIE_ZMIERZONO w tej rundzie.
- Zrzuty z Chromium (okno wyniku, poscig): evidence/okno-wyniku-po-zmianie.png, poscig-uciekinierzy-scigani.png (z rundy 1, bez zmian).

BLOKADY: DECISION_REQUIRED (pkt 1-4 wyzej).
ZMIANY/COMMIT: gra/tools/battle-rout-pursuit-browser-entry.ts, battle-rout-pursuit-measure.cjs, battle-routed-pursued-destroyed-test.cjs, battle-skip-equals-auto-resolve-test.cjs + evidence/obrona-*.json + ten raport. SHA w polu sha wyniku.
RUNDY: 2/5 (r1 operator, r2 obrona)
NASTEPNY KROK: Evaluator (te same ID) po decyzji ABC; dlug Rust REPIN walki/rout/koniec bitwy -- wskazany, rust-port nie ruszany.
DEPLOY/PUSH: NIE WYKONANO
