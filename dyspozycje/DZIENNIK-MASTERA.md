# REJESTR PRZEPLYWOW — tablica kontrolna mastera
JEDNO miejsce ze stanem WSZYSTKICH otwartych watkow cross-lane. Master trzyma na biezaco.
Zasada przeplywu: dzialy NIE gadaja wprost (brak pelnego obrazu) -> zapytanie do mastera (lub Maciej) -> master routuje do wlasciwych dzialow, zbiera odpowiedzi, oddaje dalej. Kazdy watek = 1 wiersz tu.
Status: ROBIA / GOTOWE-do-wpiecia / BLOK(czeka na X) / WPIETE. Aktualizacja: 2026-06-25.

| # | Watek | Wlasciciel(e) | Status | Czeka na | Nastepny krok |
|---|---|---|---|---|---|
| 1 | NAUKA = pula STEROWANA PRZEZ GRACZA (1a): gracz wybiera CEL + kieruje pula; BRAK auto-zakupu. AI przeciwnicy wybieraja wlasne tech (bez zmian) | EKONOMIA (wybor celu+akumulacja+UI) + master(research.ts) | ROBI | research.ts: usun auto-zakup gracza, dodaj cel gracza (master, nast. batch) | EKONOMIA mechanika wyboru celu |
| 2 | Dostep surowcow = boolean (zloze+ulepszenie w zasiegu + przetworczy budynek) | MAPA+EKONOMIA+DANE | ROBIA | — | pole dostepu + zasiegi |
| 3 | Zasiegi terytorium (miasto r5->10->15, posterunek +5, fort +10) | EKONOMIA(liczby)+MAPA(egzekwuje) | ROBIA | — | wartosci do terrain-improvements.json |
| 4 | Bonusy obrony struktur (mur+200/fort+100/posterunek+50, obozowanie) | UNITS(walka)+EKONOMIA(maMur+budynek Mury)+silnik | ROBIA | budynek 'Mury' (MIASTO) | wpiecie do combat/siege (silnik) |
| 5 | Mnoznik Handel->Pieniadz (baza 2, per-cyw) + Mennica | EKONOMIA(mechanika+buildings)+CYWILIZACJE(per-cyw) | ROBIA | — | Mennica pole mnoznik; wartosci per-cyw |
| 6 | Widok glowny / HUD w grze | MAPA(gotowe)+silnik | BLOK | Maciej: akceptacja ukladu (6B) + isInTerritory(EKONOMIA) | po akceptacji -> wpiecie |
| 7 | Plaster EKONOMIA(miasto)+UI (splitPraca/kup-za-Pieniadz/gate terytorialny) | silnik | GOTOWE-do-wpiecia | Maciej: "idz" | wpiac + sedzia + kanon |
| 8 | Wealth | EKONOMIA(szkielet)+silnik | BLOK | Maciej: W1-W6 | po decyzji -> modul + wpiecie |
| 9 | Ulepszenia terenu + posterunki (render gotowy) | MAPA(gotowe)+EKONOMIA(bonusy)+silnik | BLOK | Maciej: akceptacja listy/wartosci | po akceptacji -> wpiecie |
| 10| AI: archetypy 7->9 + harness testowy + heurystyka nauki | CYWILIZACJE | ROBIA | — | harness + wartosci startowe |
| 11| Bitwa->kanon (10A) + UX bitwy | UNITS+silnik | BLOK | Maciej: UX Q2-Q7 | po UX -> scal do kanonu |
| 12| Nowe jednostki render + oblezenie wg epok (Taran=Kamien/machiny=Braz/Katapulta=Zelazo) | UNITS | ROBIA | — | modele + epoki w units.json |

## KANON: Gra-podglad.html (ostatni: md5 de34582b, v0.1 sandbox grywalny: mapa+ruch+zakladanie-z-mapy+ekonomia+AI rywale+bitwa)

## DECYZJE MACIEJA wymagane (odblokowuja): 6 (widok glowny), 7 (idz na plaster), 8 (Wealth W1-6), 9 (lista ulepszen), 11 (UX bitwy Q2-7).

## ROZSTRZYGNIECIA 2026-06-25 (Maciej ABC)
- #1 ZDROWIE: pelny model (EKONOMIA) — ROBI. #2 PODZIAL: Praca osobno; Skarbiec+Wealth+Badania=1 kubelek %; Praca->Pieniadz po Walucie — ROBI EKONOMIA. #3 podatek baza 10%, default 70/20/10, warstwa rozwoju->CYWILIZACJE(notatka). #4B konwersja wioska->miasto NIE w v0.1. #5A mnoznik 2 (1.7-2.4 per-cyw). #6 ulepszenia -> EKONOMIA eksportuje Excel do decyzji Macieja. #7A HUD+granica C -> MASTER wepnie. #8B nazwy miast TAK + podglad miast Brazu (MAPA). #9A Wealth szkielet baza -> ROBI EKONOMIA. #10B bitwa po kolei -> master pyta Q po Q.
- KOLEJKA SILNIKA (technika, master, 1 batch gated): plaster EKONOMIA+UI, wpiecie AI (ai-wpiecie.md), research.ts (pula), auto-manage.ts, HUD+granica C, bonusy obrony (mur/fort/posterunek).
- PYTANIE do wszystkich: czy uzywaja subagentow na Sonecie (koszty) — czekam na 5 odpowiedzi.

## INTEGRACJA 2026-06-25 (batch silnika, Sonnet) — WYNIK
Kanon md5 de34582b -> 50b3114f (opublikowany). Bramka 19 testow ZIELONA (logic 163/163, combat 6/6, barbarians 53, diplomacy 98, ai 88, wealth 25, converters 30, auto-manage 26, found-from-village 24, happiness 38, okolica 16, split-output 46, wire-ekonomia 23, upkeep 51, culture-religion 43, research green, smoke/battle-smoke ok).
WPIETE: B nauka=wspolna pula (research.ts, chooseAIResearch per AI), D autoManageCity (toggle w cityPanel), E bonusy obrony (structureDefenseBonusFor + structMult w combat, dla atakow AI i barbarzyncow). A (AI+victory+barbarzyncy) juz byl wpiety. C splitPraca czesciowo (gate terytorialny odlozony). F granica C odlozona w batchu (ale Maciej JUZ zaakceptowal 7A -> do wpiecia w kolejnej rundzie).
NAPRAWIONE dehydratacje: diplomacy.ts (TIER_NAMES/relationTier), tools/diplomacy-test.cjs.

## INTEGRACJA 2026-06-25 (batch 2 + audyt) — WYNIK
Kanon md5 50b3114f -> 90695efc (995 KB, opublikowany, bit-identyczny z buildem). AUDYT ADVERSARIAL: PASS — czysty build, 762/762 testow jednostkowych (17 suite) + smoke/battle-smoke, wszystkie 4 nowe wpiecia ZYWE (nie martwy kod).
WPIETE batch2: spreadReligion per-tura (szerzenie wiary w zasiegu), dyplomacja per-tura (aiDiplomacyStance + get/setDiploRelation; efekt na relacje = bezczynny w v0.1, swiadomie), ATAK Z MAPY (klik wroga w zasiegu hex=1, ruchLeft>0 -> resolveCombat -> wynik na mape), SAVE/LOAD (Ctrl+S autosave / Ctrl+L wczytaj). Produkcja/kultura/porzadek juz byly wpiete (G/H SKIPPED).
DEFER (technika, dispatch do MAPA): L granica C + M bramka terytorialna — `isInTerritory` zyje w MAPA lane (mainview), nie eksportowana. Dispatch zlozony do MAPA (eksport callbacku); zasiegi 5/10/15 juz zdecydowane.
NOTA: AI civType = stub 'Grecy' dla wszystkich; realne typy po wpieciu rostera per-wlasciciel (czeka na format startowego rozmieszczenia: CYWILIZACJE pkt3 <- MAPA).

## RAPORT DLA MACIEJA — co zrobione gdy Cie nie bylo (2026-06-25)
GRA jest teraz wyraznie grywalniejsza w jednym kanonie (Gra-podglad.html, dwuklik):
- mapa + ruch + zakladanie miast + ekonomia per-tura + produkcja + kultura/religia + porzadek,
- AI rywale graja (ruch/zakladanie/atak/budowa) + barbarzyncy + warunki zwyciestwa,
- NAUKA = wspolna pula (kup tech gdy pula>=koszt), AI wybiera tech,
- NOWE: realny ATAK Z MAPY (nie tylko test pod T), SAVE/LOAD (Ctrl+S/Ctrl+L), szerzenie religii, dyplomacja tyka co ture, auto-zarzadca miasta (toggle), bonusy obrony (mur/fort/posterunek) w walce.
- Wszystko zielone (762/762), kanon zweryfikowany niezaleznie.
CZEKA NA CIEBIE: 10 ABC z gameplayu (zdrowie/podzial/podatek/ulepszenia-Excel/Wealth/bitwa-po-kolei/miasta Brazu) + odpowiedzi dzialow na pytanie o subagentow.

## [2026-06-25] GRANICA: oblezenie/walka MAPA<->UNITS
Punkt styku = PLANSZA WALKI. MAPA: jednostki+ruch+pozycjonowanie+oblezenie-na-mapie+tryb obozowania(stan) DO planszy walki. UNITS: od planszy walki (przed-bitwa + resolveCombat z bonusami obrony + taktyczna bitwa). Handoff: MAPA->UNITS kontekst walki; UNITS->MAPA wynik. Bonusy obrony: wartosci=EKONOMIA(dane), obecnosc/stan=MAPA, zastosowanie=UNITS. (Spojne z juz wpietym structureDefenseBonusFor: silnik karmi UNITS danymi struktur z MAPY.)

## [2026-06-25] KOREKTA GRANICY MAPA<->UNITS (ostateczna)
Ruch jednostki po mapie = MAPA. OBLEZENIE (od momentu rozpoczecia) + walka = UNITS. Handoff: start oblezenia/ataku -> MAPA przekazuje kontekst -> UNITS rozgrywa -> wynik na mape. (Superseduje wczesniejszy wpis dajacy MAPIE 'oblezenie jako zachowanie na mapie'.)

## [2026-06-25] ZACZYTANIE — nowe ze skrzynki
- MAPA: zakladanie miast z mapy (tryb Budowa) GOTOWE; kontrakt canFoundCity(withinTerritory=isInTerritory MAPA)+dystans>=5. SILNIK: wpiac akcje 'zaloz miasto' w petli (zamiast Osadnika) + isInTerritory -> nast. batch.
- RUCH: MAPA+UNITS dogadane (reguly=UNITS, wykonanie=MAPA+SILNIK, bazowy koszt terenu=MAPA). POTWIERDZONE. Spec UNITS _model-ruchu-mapa.md -> MAPA implementuje.
- UI->EKONOMIA: 2 handoffy o okolicy (zasieg/plony/hak/render/scope) -> EKONOMIA odpowiada.
- DO MACIEJA (ABC): 4 otwarte decyzje modelu ruchu (min.1 pole / ZoC / stack / zaokretowanie).
- SILNIK KOLEJKA (nast. batch): research player-directed, isInTerritory+bramka teryt., akcja zaloz-miasto, granica C.

## [2026-06-25] MODEL RUCHU — decyzje Macieja (1-2; czekam na 3-4 przed pelnym relay)
1C: min.1 pole — jednostka z resztka pkt ruchu zawsze wejdzie >=1 pole PRZEJEZDNE (nawet gdy koszt > reszty pkt); WYJATEK: pola nieprzejezdne (gory/morze, koszt 99) — tam nie.
2 (custom, nie ABC): BRAK ZoC (ruch nieblokowany adjacencja). Zamiast tego REAKCJA PRZECIWNIKA: gdy jednostka gracza wejdzie na pole sasiadujace z wrogiem, AI wroga wybiera (a) wywolac BITWE albo (b) WYCOFAC sie bez bitwy. Przejscie obok mozliwe; przeciwnik ma opcje walka/ucieczka.
  Rozbicie implementacji (technika, do rozdania po 1-4): trigger adjacency = MAPA/SILNIK; decyzja fight/flee = CYWILIZACJE (AI na mapie); bitwa = UNITS; odwrot = MAPA.

## [2026-06-25] MODEL RUCHU — decyzja #3 (stacking/armia, custom)
3 (custom, nie ABC): STACKING BEZ LIMITU — wiele jednostek/armii na 1 heksie (nawet 50).
- Wejscie na zajety heks -> OKNO WYBORU: "polacz armie" albo "nie lacz" (stoja osobno w tym samym miejscu). Gracz decyduje.
- WALKA ZBIOROWA: jesli ktos ZAATAKUJE ten heks -> WSZYSTKIE jednostki z heksa przystepuja do bitwy; jesli jedna jednostka z heksa ATAKUJE przeciwnika -> tez WSZYSTKIE jednostki z tego heksa ida do bitwy.
- Rozbicie (technika, relay po #4): stacking na mapie = MAPA; model armii + merge + sklad bitwy zbiorowej = UNITS (ma juz mechanike merge); okno "polacz/nie lacz" = UI.

## [2026-06-25] MODEL RUCHU/ARMII — ROZDANE w dol (1C,2,3,4)
UNITS: reguly ruchu(1C), bitwa przy 2, model armii+merge+sklad bitwy zbiorowej(3), zaokretowanie(4 robocze A). MAPA: wykonanie 1C, brak ZoC + hook reakcji + odwrot + stacking/render(3). CYWILIZACJE: heurystyka fight/flee(2). UI: okno 'polacz/nie lacz'(3).
SILNIK (master, nast. batch): wpiecie hooka reakcji (adjacency->fight/flee->bitwa/odwrot) + skladu bitwy zbiorowej z heksa + (juz w kolejce) research player-directed, isInTerritory+bramka, akcja zaloz-miasto, granica C.
#4 zaokretowanie = robocze A (po Zeglarstwie) — do potwierdzenia/zmiany Macieja.

## [2026-06-25] NOWY WATEK: ZARZADZANIE ARMIA (transfer/split/merge; wzorzec Total War)
Wlasciciele: UNITS (model: transfer/split/mergeWounded/remove + co z pustym generalem) + UI (panel transferu: L-klik A -> P-klik B -> drag&drop kart; M / Ctrl+M scalanie rannych; podzial; karta jednostki). UI: mockup -> akceptacja Macieja -> impl. Rozszerza okno #3.
OTWARTE (do Macieja, ABC): posilki — czy osobne SASIEDNIE armie wchodza do bitwy razem (skoro ZoC usuniety), czy wspolna walka tylko na TYM SAMYM heksie.

## [2026-06-25] POSILKI rozstrzygniete (B doprecyzowane): zasieg 1 heks
Bitwa: strona ATAK = heks atakujacego + armie sojusznicze <=1 heks od niego; strona OBRONA = heks broniacego + armie sojusznicze <=1 heks od niego. (Zastepuje wczesniejsze 'wspolna walka tylko ten sam heks' — teraz +sasiedztwo 1.) Wlasciciele: UNITS sklad bitwy, MAPA lista heksow<=1, CYWILIZACJE heurystyka dolaczania AI. SILNIK wpina zbieranie skladu przy starcie bitwy (kolejka batcha).

## [2026-06-25] NOWY WATEK: OBLEZENIE NA MAPIE (UNITS rozpisalo)
UNITS: model+panel+parametry (atrycja 8% maxHP/ture garnizonu, prog upadku 30-40% HP, kapitulacja 1 tura po wyzerowaniu zapasow, mur +200%). 
SILNIK(ja): TURA OBLEZENIA (magazyn -= pop+garnizon, -8% atrycja, warunek upadku, 1 machina/ture, przejscie do szturmu) -> kolejka batcha.
EKONOMIA: pole zapasow (City.magazynZywnosci) + flaga 'oblegane' (dochod pol=0). Routowane.
PARAMETRY do ew. strojenia Macieja (na razie domyslne UNITS): atrycja 8%/ture, prog upadku 30-40%, koszt/tempo machin.

## [2026-06-25] BATCH 3 (Sonnet) — WYNIK
Kanon 90695efc -> 7ac1345c (~1003KB). NAUKA STEROWANA GRACZEM wpieta: playerResearchTargetId + setPlayerResearchTarget + getResearchState + window haki (__civ_setResearchTarget/getResearchState/getAvailableTechs); domyslny cel=pierwsza dostepna; AI bez zmian. Bramka: logic 180/180 (+17 testow nauki, +naprawione 7 pre-existing kosztow tech), research 33, ai 113, combat 6, oblezenie 27 — ZIELONO.
#1 NAUKA: ENGINE DONE; zostaje UI picker (haki podane).
#3 walka zbiorowa DEFERRED -> poprosilem UNITS o kontrakt multi-unit (1v1 dzis).
CZEKA na kontrakty (zrobie pozniej): isInTerritory(MAPA)->bramka+zaloz-miasto+granica C; oblezenie tura(EKONOMIA flaga+zapasy); #2 reakcja(CYWILIZACJE heurystyka); posilki 1-heks(MAPA); #3 multi-unit(UNITS).

## [2026-06-25] ODSWIEZENIE — duze odblokowania
- MAPA: isInTerritory wyeksportowane (map/territory.ts) -> ODBLOKOWANE: bramka teryt.+akcja zaloz-miasto (SILNIK), granica C (MAPA renderuje). Prototyp RUCH.html gotowy (SILNIK wepnie traversal+pkt+mgle).
- EKONOMIA: kontrakt zapasow oblezenia oddany (wire-ekonomia 23/0) -> ODBLOKOWANE: tura oblezenia (SILNIK). + budzet-AI oddany do CYWILIZACJE (pkt5 zamkniety). + model-nauki-gracza potwierdzony (juz wpiety w batch3).
- UI: haki okolicy + scope v0.1 (statyczny overlay). Potwierdzilem B(jedno zrodlo)+A(tylko zaznaczone) do MAPA/UI.
- CYWILIZACJE: civs.json bonusy[]+mnoznik, tech.json koszty (PROPOZYCJA Macieja), T1-T4 ABC + 4 pyt. balansu (do Macieja). Technicznie: enum->roster9, dead flag, self-check repoint.
SILNIK BATCH 4 (odblokowane): bramka teryt.+zaloz-miasto, tura oblezenia; (potem) traversal ruchu, reakcja(stub->CYW heurystyka), posilki/#3(UNITS kontrakt).

## [2026-06-25] BATCH 4 (Sonnet) — WYNIK
Kanon 7ac1345c -> 9faa7ebf. N1 bramka terytorialna zakladania (isInTerritory, klawisz B; 1. miasto bez bramki) DONE. N2 akcja zaloz-miasto z mapy (klawisz B + bramka) DONE; pelny UX trybu Budowy = MAPA mainview (osobno). N3 tura oblezenia PARTIAL: glod+atrycja 8%+kapitulacja DONE; DEFERRED start(flaga oblegane), panel+machiny, przejecie po kapitulacji, HP-per-garnizon -> UNITS/UI. Bramka ZIELONA (logic 180, oblezenie 27, wire-ekonomia 23, combat 6, ai 132, research 33).
ZOSTAJE: UNITS dostarcz kontrakt STARTU oblezenia + HP garnizonu + kolejka machin -> silnik dopina.

## [2026-06-25] UI dostarczylo: picker badan + okno polacz-armie
- PICKER BADAN: configureSciencePicker({getAvailableTechs,getCurrentTarget,getSciencePool,onSelectTarget}) + showSciencePicker(0) + przycisk 'Nauka'. Do podlaczenia pod haki silnika (__civ_setResearchTarget/getResearchState/getAvailableTechs). TECHNICZNE, ODBLOKOWANE -> wpiecie przez SILNIK (audyt czy kod pickera w grafie kanonu czy preview).
- OKNO POLACZ-ARMIE: showArmyStackPrompt({onMerge,onKeep}). Czeka na kontrakt merge/stacking od UNITS (wtedy silnik wywola przy wejsciu na zajety heks). Pelny panel transferu = osobny task #170/#178 (makieta UI/Makieta-panel-armii.html).

## [2026-06-25] PICKER BADAN wpiety -> nauka grywalnka komplet
Kanon 9faa7ebf -> 1b5e704a. sciencePicker.ts (orphan UI) wpiety w main.ts + przycisk 'Nauka' HUD -> haki silnika. Nauka sterowana graczem = end-to-end (silnik+UI). Bramka 180/180 zielona.
ZOSTAJE (czeka na dzialy): okno polacz-armie (UNITS merge kontrakt), reakcja fight/flee (CYWILIZACJE heurystyka), multi-unit/posilki (UNITS kontrakt), start oblezenia+HP garnizonu+machiny (UNITS), traversal ruchu z prototypu (MAPA), granica C render (MAPA).

## [2026-06-25] EKRAN STARTU wpiety + kanon 100% zielony
Kanon 1b5e704a -> b7a574ad (start) -> 8e180b7a (fix testow). 
EKRAN STARTU: mainMenu.ts+newGameFlow.ts (orphany UI) wpiete -> MENU -> Nowa Gra: wybor CYW (9) + EPOKA (Kamien/Braz) + TRUDNOSC (Easy/Normal/Hard) + rozmiar mapy/rywale/predkosc -> START (aplikuje cyw+trudnosc; koniec zakutego 'normal'). Continue=loadFromLocal.
Bramka 18 suite 100% ZIELONO + smoke/battle-smoke.
2 'regresje' = zmiany ZRODEL dzialow: EKONOMIA suwak nauka 60->20 (decyzja 70/20/10); okolica zasieg STEPPED->LINIOWY ('Decyzja Naster'). Testy zaktualizowane (intended).
DEFERRED startu: bonusy cyw (TypCywilizacji->walka/ekonomia) niewpiete; rozmiar mapy zbierany ale generator stale wymiary+seed; Wyjdz=no-op.
FLAGA: zasieg okolicy stepped->liniowy oznaczony 'Decyzja Naster' — potwierdzic czy decyzja Macieja (gdyby dzial wymyslil, cofnac).

## [2026-06-25] ESKALACJA: kaskada ZELAZA po dzialach (czeka na decyzje #1 Macieja)
EKONOMIA: tech.json Zelazo + 11 budynkow (buildings.json 26 wpisow) + Budynki.xlsx. UNITS: rename Legionista->Hastati +Triari (Epoka=Zelazo), zlecony edit main.ts L1138/1165/1195 + rebuild. MAPA: kontekst oblezenia + posilki gotowe; rekomenduje SILNIK wepnij RUCH+zakladanie (territory.ts gotowe).
WSTRZYMANE do decyzji #1 (Zelazo w v0.1? A/B/C): rename Hastati/Triari + rebuild + dalsza kaskada. NIE przebudowuje kanonu z Zelazem do potwierdzenia. Kanon stoi na 8e180b7a (Kamien+Braz, zielony, grywalny).
GOTOWE-do-wpiecia gdy limit wroci: RUCH (prototyp MAPA) + pelne zakladanie miast (territory.ts), niezalezne od Zelaza.

## [2026-06-25] DECYZJA: zasieg miasta = POPULACJA (1:1), ujednolicony okolica+terytorium
radius=pop (pop2->r2, pop5->r5, pop8->r8...; cap 15). Okolica robocza (EKONOMIA okolica.ts, juz min(pop,cap)) = terytorium miasta na mapie (MAPA territory.ts cityTerritoryRadius galaz-miasto -> cityRangeForPopulation). Fort+10/posterunek+5 stale. Granica rysowana LINIA (wizual, osobne) zostaje. ZASTEPUJE schodkowy 5/10/15. Wlasc: EKONOMIA(formula/cap), MAPA(territory.ts+linia).

## [2026-06-25] WLASNOSC: START GRY = MASTER (Maciej: A)
Start/inicjalizacja gry = MASTER (applyMenuParams/doStartGame: nacja gracza, trudnosc->systemy, tempo->nauka, mapa->generator). Dostawcy: UI (ekrany), CYWILIZACJE (nacje/roster+archetypy+bonusy), EKONOMIA (param ekonomii per trudnosc). 
BATCH 07be82c8 wpial: tempo gry, AI dyplomacja (decideAIDiplomacy+respekt+tick), zasieg=populacja. 
DALEJ (master, teraz): aplikacja wybranej NACJI w runtime (player.civType+bonusy z civs.json; AI: civType+archetyp zamiast 'grecy'). Iron Age dalej WSTRZYMANY (czeka 1A/B/C).

## [2026-06-25] BATCH 5a0f886c (nacja wplywa) + nowe
WPIETE (kanon 07be82c8->5a0f886c): wybor nacji wplywa na gre — gracz: civType+civBonusy (attached, realizacja=lane'y); AI: aiOwnerCivMap (rozne nacje) + archetyp + ARCHETYPE_AGGRESSION (Zulusi0.9..Chinczycy0.2). Bramka 180/180+smoke zielono.
NOWE ze skrzynki: MAPA clusters.ts (format rozmieszczenia -> CYWILIZACJE routed). UNITS usunelo Robotnika (ulepszenia z mapy) -> prosi usun odwolania w main.ts/setup (GATED na decyzji Macieja).
DECYZJE MACIEJA KUMULUJA SIE: #1 Zelazo (1A/B/C), Robotnik usuniety? (+Zwiadowca zostaje?). Tuning: cluster min_dist 9 vs 5 (niepilne).
DEFERRED z batcha: realizacja civBonusy w systemach (lane'y), mnoznikHandelPieniadz (EKONOMIA), nazwyKlastra na mapie (MAPA), Sumerowie/Babilon (fix routed).

## [2026-06-25] ZAWIESZONE przez Macieja: Zelazo (1A/B/C) + Robotnik
Obie decyzje PARKED. Kaskada ZAMROZONA w obecnym stanie: EKONOMIA nie rozszerza Zelaza; UNITS nie dorabia jedn. Zelaza, NIE usuwa Robotnika (status quo), rename Hastati/Triari wstrzymany. Master NIE surfacuje tych decyzji do odwieszenia. Test gra na kanonie 5a0f886c (Kamien+Braz + Zelazo-tech juz w danych). Odblokuje gdy Maciej powie "odwies".

## [2026-06-25] ZAMROZENIE ODWOLANE (Maciej: nie zamrazamy) -> decyzje Zelazo+Robotnik wracaja jako 1ABC/2ABC do Macieja

## [2026-06-25] DECYZJA: Warsztat oblezniczy -> odblokowuje machiny (Taran/Katapulta/Wieza)
Budynek 'Warsztat oblezniczy' = prereq budowy machin. EKONOMIA: warsztat nadaje maWarsztatOblezniczy + dostepny od epoki najwczesniejszej machiny (Taran=Kamien). UNITS: machiny wymagaja maWarsztatOblezniczy. Uwaga: Katapulta + (jesli warsztat=budynek Zelaza) czesc tej reguly zalezy od decyzji #1 (Zelazo) — wciaz otwartej.

## [2026-06-25] KOREKTA machin oblez. (Maciej): Warsztat=tylko Katapulta; Taran+Wieza=in-siege
Warsztat oblezniczy (Zelazo) -> buduje TYLKO Katapulty (prereq maWarsztatOblezniczy). Taran + Wieza oblezicza -> budowane PRZY OBLEZENIU (in-siege, kolejka 1/ture w turze oblezenia), bez warsztatu, od swoich epok. DECOUPLING: Taran/Wieza NIEZALEZNE od decyzji #1 (Zelazo); tylko Katapulta+Warsztat gated na #1. Silnik: tura oblezenia juz ma '1 machina/ture' = tu buduje Taran/Wieza. Superseduje poprzednia regule warsztatu.

## [2026-06-25] KOREKTA epok machin (Maciej): Katapulta=Sredniowiecze (nie Zelazo)
Taran=Kamien(in-siege), Wieza=Braz(in-siege), Katapulta=SREDNIOWIECZE (w Warsztacie oblezniczym, dobudowywana do armii). Warsztat przeniesiony z Zelaza na Sredniowiecze (poza v0.1) -> EKONOMIA zmniejsza zestaw Zelaza. v0.1 OBLEZENIE KOMPLETNE: Taran+Wieza in-siege, bez warsztatu/Katapulty. Decyzja #1 (Zelazo) JUZ NIE dotyczy machin oblezniczych.

## [2026-06-25] DECYZJE MACIEJA: 1A ZELAZO GO + 2A ROBOTNIK USUNIETY
1A: Zelazo wchodzi (3 epoki). EKONOMIA(budynki~10+surowce zelazo/stal), UNITS(jedn. Zelaza Hastati/Triari), MAPA/DANE(surowce na mapie), MASTER(rename Hastati main.ts + rebuild), CYWILIZACJE(swiadome).
2A: Robotnik USUNIETY -> ulepszenia=akcja z mapy. UNITS(usun+spec akcji), MAPA(front 'Buduj ulepszenie'), MASTER(usun odwolania Robotnika main.ts/setup + wepnij akcje pozniej). Zwiadowca zostaje.
ENGINE BATCH teraz: rename Legionista->Hastati/Triari + usun odwolania Robotnika (anty-crash) + rebuild.

## [2026-06-25] ENGINE BATCH 1A/2A — WYNIK
Kanon 5a0f886c -> 0dbf75d8. Z1 rename Legionista->Hastati (lookup main.ts) DONE. Z2 Robotnik usuniety (anty-crash, brak aktywnych refs; martwy kod zostaje; gra startuje z miecznikiem, Zwiadowca zostaje) DONE. Naprawione dehydracje: buildings.json null-byte, testBattle.ts uciety.
Bramka zielona OPROCZ koszary-gate-test (lazaret.epokaWejscia=5 vs test 4) = dane EKONOMII (pre-existing) -> routed do EKONOMII (fix epoki + rebuild).
ZOSTAJE: akcja 'buduj ulepszenie z mapy' (MAPA front + master akcja) zamiast Robotnika; EKONOMIA dokancza Zelazo (surowce zelazo/stal, budynki); fix lazaret.

## [2026-06-25] DECYZJE ZAMKNIETE (koniec pytan): GENERATOR + EKSPANSJA + ZASADA
ZASADA: wszystkie wybory gracza z menu nowej gry stosowane w swiecie.
- Rozmiary: 1000/2000/5000/10000/20000 (Malenki..Ogromny). Typ: gracz wybiera (kontynenty/pangea/wyspy, wszystkie zaimplementowane). Losowy seed co gre. Wydajnosc: instanced dla duzych (MAPA).
- Ekspansja: terytorium NIE blokuje zakladania (≥5 pol od miast) — master luzuje bramke (1B).
Generator buduje MAPA; master wpina menu->generator + init + luzuje bramke + losowy seed (teraz).

## [2026-06-26] BATCH TOP-7 (Sonnet) — WYNIK
Kanon 342bef78 -> 2276ec0f. WPIETE: P1a sciencePicker nowe API (zbadane widoczne), P1b walutaOdkryta+flagi budynkow, P2 rozmiar mapy+rywale z menu (typ DEFERRED->MAPA), P3a HUD +Praca/Kultura, P3b overlay konca gry (+Nowa gra), P5 diplomacyPanel+notyfikacje, P6 save/load pelniejszy (cityProd/cityBuilt/aiResearchDone/diploRelations). P4 PARTIAL: atak z mapy -> preBattle (Pole bitwy=fallback auto; pelna scena DEFERRED->UNITS kontrakt). Bramka zielona poza pre-existing koszary-gate(lazaret).
Dzialy poinformowane: UI/EKONOMIA/MAPA/UNITS. DEFERRED: typ mapy+pelny generator(MAPA), BattleScene z mapy(UNITS kontrakt), pelny hud.ts.

## [2026-06-26] DECYZJA MACIEJA: Waluta x2 na CALA pule Handlu (nie tylko Skarbiec)
x2 po Walucie -> cala pula Handel->Pieniadz (Skarbiec+Badania+Wealth). Rozdane EKONOMII. Praca->Pieniadz z nadwyzki = wg rekomendacji EKONOMII.

## [2026-06-26] DECYZJA MACIEJA: Lazaret=Sredniowiecze (przyszlosc) -> #1 koszary-gate NIE wpinamy teraz
koszary-gate-test (asercja lazaret.epokaWejscia) = ZNANY OCZEKIWANY CZERWONY (przyszly budynek Sredniowiecza), NIE regresja. Subagenty: traktowac jako baseline-red, publikowac mimo niego. Lazaret zostaje na przyszlosc, nic nie ruszamy.
