# R-WEB-AUTOIMPROVE-BLOCKERS-AUDIT-Q1 — audyt bramek auto-ulepszen zywnosciowych (runda 1/5, Operator)

Baza: `4d1916f2c` (= `origin/main`). Audyt TYLKO DO ODCZYTU: zero zmian w `gra/src/**`, `gra/data/**`.
Narzedzie pomiarowe: `gra/tools/audit-autoimprove-blockers.cjs` (nowy plik, dozwolony). Log: `02-pomiary-symulacja.txt` (`EXIT=0`).
Dowody = `plik:linia` (stan `4d1916f2c`) albo wiersz pomiaru (ID z tabeli 3 i z logu). Czego nie zmierzono = `NIE_ZMIERZONO`.

Legenda klasy: ZAM = zamierzona (ECHO/decyzja), POD = podejrzana (konflikt z N1-N6), BLAD = blad (dowod).
N1 farma+trzoda+irygacja na jednym heksie | N2 trzoda bez zloza/zasobow | N3 kolejnosc przy rzekach: farma → wycinka+farma → trzoda → irygacja, potem poza rzeka wycinka+farmy | N4 "wolno wycinac las"+"tylko z obywatelami" razem | N5 wycinka przy rzece bez tartaku/obozu i minimum lasu | N6 trzoda i irygacja poza limitem % budzetu.

## 1. Wynik w skrocie (kryterium 2)

1. **Wspolna przyczyna nr 1 (BLAD systemowy, pomiar M-*, C1 vs D2)**: caly potok zywnosciowy z N3 (etapy wyrab→farma→trzoda→irygacja, `foodOnly`) wlacza sie TYLKO gdy `hasNonFoodResourceDeficit(resourceDeficitKeysForOwner)` jest falszem (`main.ts:35767-35772`, `auto-improvements.ts:556,701-702`). `resourceDeficitKeysForOwner` (`main.ts:20750-20767`) uzywa heurystyki handlu AI `detectPricedResourceDeficits` (`diplomacy-resource-trade-pick.ts:34-49`): KAZDY z 15 wycenionych surowcow (`diplomacy-value-catalog.ts:258-274`) ponizej 10 szt. (`econ-params.json:834`, `diplomacy-value-catalog.ts:276`) = "niedobor". Pomiar funkcji z kodu gry: start gry → 12 kluczy niedoboru, srodek gry → 7 (m.in. `zelazo`,`stal`,`braz`,`zloto`,`wegiel`), pusty dopiero gdy wszystkie 15 >= 10 (M-start, M-srodek-gry, M-bogaty). Wniosek: w realnej grze etapy sa praktycznie NIGDY aktywne dla gracza (poziom pewnosci: wysoki dla logiki, `NIE_ZMIERZONO` w zywej grze — brak realnego magazynu; patrz sekcja 6).
2. **Wspolna przyczyna nr 2 (BLAD, pomiar D2/D3/E1b/E2b/F1-F3)**: w sciezce bez etapow (czyli realnej) heks rzeka+las / las z obywatelem dostaje **tartak + oboz lowiecki zamiast wyrebu**; wyrab jest wtedy zablokowany na stale (straznik `auto-improvements.ts:1016`, farma niemozliwa na lesie `improvement-build.ts:387-390`). Lancuch: `hexPhasePriority` zawiera `tartak`/`oboz_lowiecki` nawet w `foodOnly` (`auto-improvements.ts:823-827`, lista `ULEPSZENIA_FOCUS_ZYWNOSC` L73-75 — mimo ze komentarz L77-112 mowi, ze tartak NIE jest zywnosciowy) → `lesneMinSpelnione` (L977-996) liczone RAZ przed petla heksow (stale) jest falszem, wiec krok wyrebu (L1011) nie rusza, a petla heksow (L1040-1074) stawia tartak (tura 1) i obóz (nast.) na KAZDYM obrabianym lesie, nie tylko `lesneMin`=1 sztuk. F1: `tartak=6, oboz=6, wyrab=0, farma=2` (8 obrabianych, 6 w lesie). F4 (te same dane, bez technologii Obrobka drewna/Lowiectwo): `wyrab=6, farma=8, bydlo=8`. Czyli to gate tartak/oboz blokuje scenariusz (c), nie brak technologii wyrebu.
3. **Scenariusze (a) i (b)**: w symulacji sciezka picker+executor NIE blokuje trzody po farmie ani irygacji przy rzece (A1-A4, A10, C1, D1, E*, G1, H1: farma, trzoda i irygacja na TYCH SAMYCH heksach, `executor-odrzuca={}` w kazdym przebiegu). Zmierzone realne blokady ograniczone do warunkow: (i) brak techu `Oswojenie zwierząt` w trybie etapow wiesza TAKZE irygacje (A6: `{farma:5}`), (ii) cywilizacja Nowego Swiata (Inkowie/Aztekowie): `main.ts` nie przekazuje `playerEra` do pickera → trzoda/owce NIGDY (A8 vs A9), (iii) starvation drogiej irygacji (60 Pracy) przez tanie farma/trzoda (G1 tura 15, G3 jedna sztuka w 40 turach; `continue` zamiast rezerwacji budzetu, `auto-improvements.ts:1047-1049`). **Zywa gra: NIE_ZMIERZONO** (zakaz `npm run dev/build` w `gra/`; brak buildu poza repo) — dane X potrzebne od wlasciciela w sekcji 6.

## 2. Zakres przegladu (jawnie)

PRZEJRZANE W CALOSCI: `gra/src/game/auto-improvements.ts` (1-1167), `gra/src/map/improvement-build.ts` (1-1569), `gra/src/game/improvement-tech.ts`, `gra/src/game/livestock-unlock.ts`, `gra/data/terrain-improvements.json` (415 linii), `gra/src/game/ai-resource-needs.ts` (1-138).
PRZEJRZANE FRAGMENTAMI: `gra/src/game/terrain-improvements.ts` (L100-125, 305-340, 433-470 — `normalizeImprovementKey`, `improvementKeysForHex`, `isImprovementAllowedForCiv`, `scaleTerrainImprovementWorkCost`); `gra/src/main.ts` (L3796-3799, 5763, 12265, 14461-14475, 15173-15183, 20750-20767, 24225-24300, 31062-31064, 34380-34440, 35640-35890, 38261-38380); `gra/src/game/ai.ts` (L2560-2735); `gra/src/game/cities.ts` (L202-229, 355-395, 790-799); `gra/src/game/turn-economy.ts` (L640-690 `workedHexCoordsForCity`); `gra/src/game/diplomacy-resource-trade-pick.ts` (L34-49); `gra/src/game/diplomacy-value-catalog.ts` (L258-282); `gra/data/tech.json` (wiersze Rolnictwo/Oswojenie zwierzat/Gospodarka wodna/Lowiectwo); `gra/data/econ-params.json` (L825-845).
PRZEJRZANE I ODRZUCONE JAKO NIEZWIAZANE: `gra/src/game/building-resource-gate.ts` (bramki BUDYNKOW, nie ulepszen terenu; `grep improvement|ulepsz|farma|bydlo` → 0 trafien w logice); `gra/src/game/improvement-build.ts` — plik NIE ISTNIEJE (jest `gra/src/map/improvement-build.ts`).
NIE PRZEJRZANE / NIE URUCHOMIONE: `resolveWorkedTiles`/`hexToWorkedTile` (uzyte jako czarna skrzynka przez bundlowane `workedHexCoordsForCity`), `pending-improvements.ts`, `relief-preserving-improvements.ts`, `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`, zapis/odczyt gry (`placedImprovements` w meta zapisu: `main.ts:32933-32998` tylko zlokalizowane, NIE_ZMIERZONO czy sa gubione), render/UI poza handlerami `main.ts:24225-24390`; istniejace testy `tools/ai2-heks-po-heksie-test.cjs`, `tools/ai-food-improvement-priority-stages-test.cjs`, `tools/ai-improvements-test.cjs` (NIE uruchamiane — wymagaja `npm install` w `gra/`).

## 3. Tabela bramek

Kolumny: ID | plik:linia | warunek odrzucenia | skutek | klasa | KONFLIKT Z N1-N6 | odrzuca scenariusz (a/b/c) — dowod

### 3.1 Wybor — `gra/src/game/auto-improvements.ts`

| ID | plik:linia | warunek odrzucenia | skutek | klasa | konflikt N | odrzuca? |
|---|---|---|---|---|---|---|
| P1 | auto-improvements.ts:445-447, 552 | `stagedCities.length===0 \|\| !territoryNodes` / `cities.length===0` | brak etapow / brak picka | ZAM | brak | NIE (A1) |
| P2 | :559-561, 675 | `pracaLeft <= reserve(30)` (`AUTO_ULEPSZENIA_PRACA_RESERVE` L172) | brak picka w tej turze | ZAM (R-AUTO-V2-Q4=B) | N6 (rezerwa dotyczy tez trzody/irygacji) | NIE przy duzej puli (A1); wplywa przy malej (G3) |
| P3 | :556, 701-702 | `deficitActive` (`hasNonFoodResourceDeficit` L191-194) → `foodOnly=false` | pelna lista typow zamiast zywnosciowej | BLAD (zrodlo sygnalu = heurystyka handlu, patrz E11) | N3 | TAK posrednio (c): D2 vs C1 |
| P4 | :423-455 (`stageLists`) | etapy globalne: wyrab(rzeka) → farma(WSZEDZIE) → trzoda → irygacja/tarasy → reszta | trzoda i irygacja czekaja na farmy calego panstwa, takze poza rzeka | POD | N3 (przy rzece trzoda+irygacja przed farmami poza rzeka) | NIE_ZMIERZONO (opoznienie; A1: trzoda t2, irygacja t3) |
| P5 | :477-495 (probe `earlierStageIsPending`) | etap z celem ale bez techu/budzetu → pozniejsze etapy czekaja | zakladnik technologii | POD | N1/N3 | TAK (b) w A6: brak `Oswojenie zwierząt` → `{farma:5}`, irygacja 0 mimo `Gospodarka wodna` |
| P6 | :500-506 | fallback ogolny tylko gdy `!earlierStageIsPending` | wyrab poza rzeka dopiero po wszystkich etapach | ZAM (komentarz L497-499) | N3 zgodne | NIE (A5/C5: wyrab poza rzeka nie wchodzi przez lesneMin, patrz P16) |
| P7 | :683-685 | `riverForestClearingOnly ? false : getSkipWyrab` | etap 0 ignoruje "wolno wycinac" | ZAM (zgodne z N4/N5) | brak | NIE (C2 = C1) |
| P8 | :729 (`effectiveCityCap`), 1049, 862-878 | `globalSpent + koszt > effectiveCityCap` | pulap % laczny takze dla trzody/irygacji | POD | N6 (nie wdrozone: brak wyjatku) | NIE blokuje, OPOZNIA (H1: pct 20 → farma+trzoda+irygacja po 3 turach jak H2); NIE_ZMIERZONO przy malej puli |
| P9 | :757-761, 773-778 | heks bez obywatela chyba ze zloze danego klucza | auto buduje tylko na obrabianych | ZAM (ECHO "Zasada 2") | N4 zgodne | NIE dla heksow obrabianych; las rzadko obrabiany (F-test: zbior pracy = N najlepszych plonowo, plain > las) — NIE_ZMIERZONO w realnej grze |
| P10 | :823-827 | `hexPhasePriority = basePriority \ {wyrab, posterunek, fort}` i przy `foodOnly` ∩ `ULEPSZENIA_FOCUS_ZYWNOSC` | lista zywnosciowa ZAWIERA `tartak`,`oboz_lowiecki` (L73-75) wbrew komentarzowi L77-112 | BLAD | N3/N5 | TAK (c): F1 |
| P11 | :828-830, 857-899 | `defensePriority=[]` gdy foodOnly; obrona wymaga `plonoweWPromieniu >= pop` | posterunek/fort poza zywnoscia | ZAM | brak | NIE |
| P12 | :934 | `wyrabWlaczony = !citySkipWyrab && 'wyrab'∈basePriority` | przelacznik "wolno wycinac las" OFF → brak wyrebu poza etapem 0 | ZAM (R4-Q2=C) | N4 zgodne | NIE (C2/D3 identyczne z ON → przelacznik nieskuteczny w sciezce bez etapow, patrz D2) |
| P13 | :949-959 (`rzekiDoZagospodarowania`) | wyrab poza rzeka dopiero gdy nie ma rzek do zagospodarowania | ZAM (ECHO 2026-08-27) | N3 zgodne | NIE |
| P14 | :966, 977-983 | `lesneWymagane` = tartak/oboz z `hexPhasePriority`, odblokowane technologicznie i cywilizacyjnie | wymog posiadania tartaku i obozu | POD | N5 (komentarz L984-988: "bramkuje KAZDY wyrab, takze na heksie z rzeka") | TAK (c) w sciezce bez etapow: D2/D3/E1b/E2b (tartak=oboz=2-3, wyrab=0) |
| P15 | :989-996 | `lesneMinSpelnione` liczone RAZ przed petla (stale w obrebie wywolania) | wszystkie obrabiane lasy dostaja tartak mimo `lesneMin=ceil(pop/10)`=1 | BLAD (dowod F1: tartak=6=wszystkie obrabiane lasy, `lesneMin`=1) | N5 | TAK (c): F1/F2/F3 |
| P16 | :997-998 | `wolnoKarczowacPozaRzeka = !riverOnly && !rzeki && lesneMin` | wyrab poza rzeka zalezy od P14/P15 | POD | N3 ("potem poza rzeka wycinka+farmy") | TAK (c poza rzeka): C5/D5/F1 → wyrab=0 |
| P17 | :1009-1019 | KROK 0: `wyrabWlaczony && lesneMinSpelnione && (rzeka\|\|poza) && !scheduled && Las && (riverOnly \|\| forestLeft>=3) && !(tartak\|oboz na heksie) && hexAllowsKey` | wyrab nie rusza | czesciowo ZAM, czesciowo POD | N5 (L1011 lesneMin, L1015 prog lasu 3 poza etapem 0) | TAK w sciezce bez etapow (D2); NIE w etapie 0 (C1: t1 wyrab) |
| P18 | :1016 | heks z tartakiem/obozem nie idzie pod topor | ZAM (L1110-1114) ale samonapedzany przez P10/P15 | brak | TAK (c): po t1 tartak → heks stracony dla farmy na stale (F1) |
| P19 | :1023-1028 | tech/civ/koszt/cap/`qualifies('wyrab')` | ZAM | brak | NIE |
| P20 | :1036 | `continue` po wyrebie — reszta heksa po zniknieciu lasu | ZAM; opoznienie 1 tury (C1: wyrab t1, farma t2) | N3 zgodne | NIE |
| P21 | :1047-1051 | `koszt > pracaLeft` / `pracaLeft-koszt < reserve` / cap → `continue` (nie break) | tanie pozycje na kolejnych heksach zjadaja budzet drogiej irygacji (60) | POD | N6 | TAK posrednio (b) przy malym przychodzie: G1 irygacja t15, G3 1 szt./40 tur |
| P22 | :1061 | `workingPlaced` zawiera klucz → continue | straznik duplikatu | ZAM | N1 zgodne (rozne klucze) | NIE |
| P23 | :1064-1065 | `hexAllowsKey` / `qualifies` | patrz tabela 3.2 | — | — | — |
| P24 | :1088-1129 + `WYRAB_MIN_FOREST_IN_RADIUS=3` (L169, 1101) | FAZA 2 wylaczona przy `foodOnly`; prog 3 heksy lasu | wyrab poza rzeka tylko gdy lasu >= 3 | ZAM (TEMAT #8) | N5 (prog lasu 3) — ABC-3 | NIE_ZMIERZONO osobno |
| P25 | :646-657 | `playerEra` nie podawane → `state.playerEra ?? 1`; `tradeRouteKonUnlocked:false` | `isLivestockAllowed` Nowy Swiat era<3 → trzoda/owce nigdy | BLAD (patrz E5) | N2 | TAK (a) dla Inkow/Azteków: A8 `{farma:5, irygacja:5}`, A9 (era 3 podana) `bydlo:5` |
| P26 | :1139-1154 | sonda nadwyzki | brak picka | ZAM | brak | NIE |
| P27 | :73-75, 111-112 | dwa znaczenia jednego Setu (kolejnosc vs kontrakt lasu) | opisane w komentarzu L77-112 jako "BLOKADA do decyzji" | POD (otwarty dlug) | N3 | patrz P10 |

### 3.2 Kwalifikacja — `gra/src/map/improvement-build.ts`, `livestock-unlock.ts`, `improvement-tech.ts`, JSON

| ID | plik:linia | warunek odrzucenia | klasa | konflikt N | odrzuca? |
|---|---|---|---|---|---|
| Q1 | improvement-build.ts:363, 387-390, 1004-1008 | farma tylko Laka/Rownina i BEZ lasu, w terytorium | ZAM (ECHO 2026-08-27 FARMA-NIE-W-LESIE) | N3 zgodne (wymusza wyrab) | NIE |
| Q2 | :441-444 vs 450-464, 474-479, 622 | `bydlo`,`owce` w `FOREST_BLOCKED`; do `COEXIST` wpisana tylko `lama`; hint L495 "najpierw usun las" | POD: komentarze L427-432 i JSON mowia, ze ECHO 2026-08-27 odblokowalo wszystkie trzy | N2/N1 (nie dotyczy heksa farmy — farma nie stoi w lesie) | NIE (A1); ABC-2 |
| Q3 | :513-517, 679, 1024-1029 | owce tylko Wzgorza (otwarte/zalesione) lub zloze owiec | ZAM | brak | NIE (E1a `owce:1` na wzgorzu) |
| Q4 | :523, 808-838 (`canAddFoodLayer`) | SOLO: tarasy/owce/lama; farma+irygacja+bydlo dozwolone | ZAM (R-...-STACK-Q1 2026-09-07) | N1 ZGODNE | NIE (A1: 5/5/5 na tych samych heksach) |
| Q5 | :530-565, 575-602, 645-651 | sektory: foodteren(farma,tarasy) / hodowla(bydlo,owce,lama) / overlay(irygacja) | ZAM | N1 zgodne | NIE |
| Q6 | :742-747 `hasBlockingDepositForFarm=false`; :763-767, 770-805 | zloza nie blokuja farmy/irygacji; `depositAllowsPlayerImprovement(bydlo)` wymaga `ZlozeBydla` | ZAM (kod); dane STARE | N2 kod ZGODNY (`livestock-unlock.ts:174 return true`) | NIE (trzoda bez zloza w A1) |
| Q7 | :1009-1014, 962-970 | irygacja: FLAT_IRR, terytorium, `isRiverAdjacent` (rzeka na heksie lub sasiad) | ZAM (JSON warunek L39) | N3 zgodne | NIE (A1); przy braku rzeki zbioru NIE (A5: 24 irygacje tylko tam gdzie rzeka) |
| Q8 | :1018-1023, `livestock-unlock.ts:87-102, 162-175` | `isLivestockAllowed` (Nowy Swiat era<3; lama tylko Inkowie) + `isLivestockUnlockedForPlacement` (stadnina: zloze/50 koni/trasa; reszta true) | ZAM (decyzje 2a/3a) | N2 zgodne | TAK tylko Nowy Swiat (P25) |
| Q9 | :995, 999-1000 | `pendingUndoKeys`; `existing.includes(key)` | ZAM | brak | NIE |
| Q10 | :1097-1102 | wyrab: Las + terytorium + `!clearingHexKeys` (picker nie podaje `clearingHexKeys`) | ZAM | brak | NIE (executor odrzuca 0, L35797) |
| Q11 | :1103-1107, 1121-1124, 630-640 | tartak: las+TARTAK_TERENY; oboz: las + tartak NA TYM heksie | ZAM (ECHO oboz wymaga tartaku) | N5 (porzadkuje stawianie, nie blokuje wyrebu) | wspoltwórca P18 |
| Q12 | :206-214 (`FOREST_DEPENDENT`), 255-267 | tartak/oboz znikaja po wyrebie; farma-relikt w lesie usuwana | ZAM (ECHO 2026-09-07, 2026-08-27) | brak | NIE |
| Q13 | :1161-1162 | `terrainOk` → `computeImprovementBuildImpact !== null` | ZAM | brak | NIE |
| T1 | improvement-tech.ts:38-43, tech.json:138,148 | alias `Irygacja`→`Gospodarka wodna` | ZAM | brak | NIE (A1 z techem; A7 bez techu: `{farma:5,bydlo:5}`) |
| T2 | improvement-tech.ts:140-150; JSON tech: farma L24 Rolnictwo, bydlo L58 Oswojenie zwierzat, irygacja L41, tartak L208, oboz L168 | `req.every(t => set.has(t))` | ZAM | brak | A6/A7 pokazuja skutek brakow |
| T3 | terrain-improvements.ts:438-447; JSON `cywilizacje` (tarasy, lama) | civ gate | ZAM | brak | NIE dla farma/bydlo/irygacja (brak pola) |
| T4 | terrain-improvements.json:54-56, 72-74, 91-93, 22 | `warunek`/`uwaga` bydlo/owce/lama: "pierwsze pastwisko wymaga zloza" | STARE (dane) | N2 NIE wprowadzone do danych | NIE (dane nie sa czytane przez gate; tylko UI/civpedia) |

### 3.3 Wykonanie / UI / stan — `gra/src/main.ts`, `ai.ts`, `cities.ts`

| ID | plik:linia | warunek | klasa | konflikt | odrzuca? |
|---|---|---|---|---|---|
| E1 | main.ts:35713-35718; cities.ts:203 `DEFAULT_ULEPSZENIA_TRYB='reczny'` | `tryb==='auto'` per miasto i `pula > 30` | ZAM | brak | NIE_ZMIERZONO w zywej grze (wlasciciel potwierdza ze farmy powstaja → automat dziala) |
| E2 | main.ts:35734 vs 35776, 12265, 31062 | `unlockedTechSetForOwner(hOid)` (= `playerStateByHuman.get(hOid).zbadane`) vs `player.zbadane` | ZAM (ten sam obiekt dla fotela 0: `main.ts:12265`) | brak | NIE (0 odrzuc. `tech` w kazdym przebiegu); po wczytaniu zapisu NIE_ZMIERZONO |
| E3 | main.ts:35739-35740 | `skipWyrab:true`, `getSkipWyrab = !wolnoWycinacLas` | ZAM | N4 | patrz P7/P12 |
| E4 | main.ts:35744-35745, 20750-20767 | `demandDriven:true`, `resourceDeficitKeys` | BLAD (zrodlo sygnalu) | N3 | TAK posrednio (c) — M-*, D2 |
| E5 | main.ts:35727-35773 | brak `playerEra` w wywolaniu (AI przekazuje: ai.ts:2658) | BLAD | N2 | TAK (a) Nowy Swiat: A8 |
| E6 | main.ts:35767-35772 vs ai.ts:2678 | gracz: etapy tylko bez niedoboru; AI: `foodImprovementStages:true` zawsze | POD (rozjazd gracz/AI) | N3 | AI buduje wedlug etapow, gracz nie |
| E7 | main.ts:35758-35759, 35677 | `pracaAutoPercent` z polityki `ulepszeniaEmpireForOwner(0)` (zaszyty fotel 0, nie `hOid`) | POD (hotseat) | N6 | NIE_ZMIERZONO |
| E8 | main.ts:35776-35785 | executor: tech, civ, pula, rezerwa, heks, terytorium, `prevLayers` | ZAM | brak | NIE (`executor-odrzuca={}` w calym logu) |
| E9 | main.ts:35795-35817, 35832-35835, 34390-34440, 15173-15183 | wycinka: Las, brak `hexClearingStates`; tick wycinki PRZED pickerem; `finalizeHexClearing` zdejmuje Las | ZAM | N3 zgodne | NIE (wyrab t1 → farma t2) |
| E10 | main.ts:24233-24300 | UI: focus/onlyWorked/pct ustawiaja `tryb='auto'`; przelacznik "wolno wycinac" (L24286) NIE ustawia trybu | ZAM/uwaga | N4 | NIE_ZMIERZONO |
| E11 | ai-resource-needs.ts:93-138; diplomacy-resource-trade-pick.ts:34-49; diplomacy-value-catalog.ts:258-276 | zapas < 10 szt. dowolnego z 15 wycenionych surowcow = niedobor | BLAD semantyczny (heurystyka handlu uzyta jako sygnal budowy) | N3 | M-start/M-srodek-gry |
| E12 | ai.ts:2590, 2640, 2654-2658, 2665-2679; main.ts:38261-38380 | AI: `pracaAvailable > surplusGate`, techy `improvementTechs`, executor AI (tech, pula, terytorium, wycinka, `prevLayers`) | ZAM | brak | NIE_ZMIERZONO (AI nie byl w zakresie symulacji) |

Uwaga o liczbie: wiersze P1-P27, Q1-Q13, T1-T4, E1-E12 = 56 bramek.

## 4. Tabela pomiarow ("bramka → odrzuca scenariusz TAK/NIE/NIE_ZMIERZONO + dowod")

Parametry symulacji (`02-pomiary-symulacja.txt`): mapa syntetyczna 31x31, miasto (15,15), 40 tur, pula Pracy 5000 + 60/ture (G*: 40 + 25/10), `pracaAutoPercent`=100 (A11/H1: 33/20), rezerwa 30, picker wolany z TYMI SAMYMI opcjami co `main.ts:35727-35773` (w tym `foodImprovementStages` wg lambdy z L35767-35772), zbior pracy z realnego `workedHexCoordsForCity`, executor odwzorowany 1:1 z L35776-35855 + tick wycinki. Techy domyslnie: Rolnictwo, Oswojenie zwierzat, Gospodarka wodna, Lowiectwo, Obrobka drewna.

| bramka | (a) trzoda po farmie | (b) irygacja po techu | (c) wyrab rzeka+las i farma | dowod (ID → wynik) |
|---|---|---|---|---|
| picker, bez niedoboru, etapy ON, rownina+rzeka | NIE | NIE | — | A1 `farma 5, bydlo 5, irygacja 5` (t1/t2/t3) |
| jw., etapy OFF / demandDriven OFF | NIE | NIE | — | A2, A4 wszystko w t1 |
| jw., focus zywnosc | NIE | NIE | — | A3 |
| jw., pop 12; pct 33; onlyWorked OFF | NIE | NIE | — | A10 `12/12/9`, A11 `5/5/5`, A5 `91/91/24` |
| P5 zakladnik technologii | NIE | **TAK** (brak Oswojenia blokuje irygacje) | — | A6 `{farma:5}`; A7 (brak Gosp. wodnej) `{farma:5,bydlo:5}` |
| P25/E5 Nowy Swiat bez `playerEra` | **TAK** (Inkowie) | NIE | — | A8 `{farma:5,irygacja:5}`; A9 era 3 `bydlo:5` |
| P8 limit % (N6) | NIE (opoznia) | NIE (opoznia) | — | H1 vs H2 `8/8/7` w obu |
| P21 starvation 60 Pracy | NIE | **TAK** przy malym przychodzie | — | G1 irygacja t15; G3 (+10/ture) 1 szt. w 40 turach |
| etap 0 (wyrab rzeka) bez niedoboru | — | — | **NIE** | C1/C2 `wyrab 2` t1, `farma 5` t2, `bydlo 5` t3, `irygacja 5` t4 (takze przy "wolno wycinac" OFF = P7) |
| sciezka bez etapow rzeka+las (P3,P10,P14,P15,P17,P18) | — | — | **TAK** | C3/C4/D2/D3: `tartak 2, oboz 2, farma 3` (zamiast `wyrab 2, farma 5`); przelacznik "wolno wycinac" bez wplywu (D2=D3); D4 (bez tech tartaku/obozu) `wyrab 1, farma 4, bydlo 4, irygacja 4` |
| las poza rzeka, obrabiany (P10,P15,P16) | — | — | **TAK** | F1/F2/F3 `tartak 6, oboz 6, wyrab 0, farma 2, bydlo 2`; F4 (bez tech lesnych) `wyrab 6, farma 8, bydlo 8` |
| las poza rzeka, nieobrabiany | — | — | TAK w sensie P9/P16 (nie jest budowany, bo nie ma obywatela) | C5/C6/D5 `wyrab 0, farma 5, bydlo 5` (las poza zbiorem pracy) |
| mapa mieszana seed 1-3 | NIE | NIE | NIE bez niedoboru, TAK z niedoborem | E1a `wyrab 1, farma 5`; E1b `farma 4, tartak 1, oboz 1`; E2a `wyrab 3`; E2b `tartak 3, oboz 3, wyrab 0`; E3 las poza zbiorem pracy |
| E4/E11 niedobor surowca w realnej grze | — | — | TAK posrednio | M-start (12 kluczy), M-srodek-gry (7), M-bogaty (0) |
| E2 `player.zbadane` vs picker | NIE | NIE | NIE | `executor-odrzuca={}` we wszystkich 30+ przebiegach |
| E1 tryb/UI, E7, E12 (AI), zapis/odczyt | NIE_ZMIERZONO | NIE_ZMIERZONO | NIE_ZMIERZONO | brak zywej gry (patrz sekcja 6) |

Koszty zmierzone (K-*): farma 20, trzoda 20, irygacja 60, wyrab 2.5, tartak 25, oboz 18 Pracy.

## 5. Stare reguly sprzeczne z N1-N6 i miejsca niewdrozone

| N | stan w kodzie | miejsca STARE / NIEWDROZONE |
|---|---|---|
| N1 | WDROZONE: `canAddFoodLayer` (`improvement-build.ts:808-838`, STACK-Q1 2026-09-07), sektory L530-565 | JSON `bydlo.uwagi` L60 "+ farma lub solo" (nieaktualne); martwe `galleryComboEligible` L1254-1262 (tylko galeria) |
| N2 | WDROZONE w kodzie: `livestock-unlock.ts:174`, `qualifies` L1018-1023 | NIEWDROZONE W DANYCH: `terrain-improvements.json` L54 (`surowiecOdblokowany_uwaga bydlo` "dostep dopiero po postawieniu na zlozu trzody"), L56 (`bydlo.warunek` "pierwsze pastwisko wymaga zloza bydla"), L72, L74, L91-93 (owce/lama); `depositAllowsPlayerImprovement` L790-795 (uzywana tylko przez `hexAllowsKey` dla heksow nieobrabianych) |
| N3 | CZESCIOWO: etap 0 + hierarchia farma→bydlo→irygacja w `stageLists` (`auto-improvements.ts:449-455`) | NIEWDROZONE: (i) potok aktywny tylko bez "niedoboru" (E4/E11/P3); (ii) etapy globalne zamiast "najpierw rzeki" (P4); (iii) zakladnik technologii (P5); (iv) lista zywnosciowa z tartakiem/obozem (P10, L73-75); (v) `lesneMin` stale (P15) |
| N4 | WDROZONE tylko w etapie 0 (`auto-improvements.ts:683-685`) | Poza etapem 0 przelacznik OFF/ON bez wplywu na wynik (D2=D3) bo wygrywa P14-P18 |
| N5 | WDROZONE tylko w etapie 0 (`riverForestClearingOnly` obchodzi L1015; `lesneWymagane` pusta, bo `hexPhasePriority=[]`) — przypadkowo, nie z projektu | STARY komentarz i kod: `auto-improvements.ts:984-988` ("bramkuje KAZDY wyrab, takze na heksie z rzeka"), L1011 (`lesneMinSpelnione`), L1015 (prog 3), L169 |
| N6 | NIEWDROZONE: nigdzie wyjatek od `effectiveCityCap`/rezerwy dla bydlo/irygacja (`auto-improvements.ts:729, 1049`) | H1/H2, G3 |
| (poza N) | — | Testy pinujace stary stan (NIE uruchamiane): `tools/ai2-heks-po-heksie-test.cjs:370-374` ("minimum lesne miasta dotrzymane mimo wycinki: tartak/oboz nadal powstaja"), `tools/ai-food-improvement-priority-stages-test.cjs` (etapy), `tools/ai-improvements-test.cjs` test 7 (cytowany w komentarzach L768-770, L979-982) |

## 6. Co NIE zostalo zmierzone i jakich danych brak (kryterium 2, zywa gra)

Zywa gra w Chromium wymagalaby `npm run dev`/`build` w `gra/` (zakaz dispatchu); nie budowano kopii poza repo (poza budzetem rundy). Dlatego dla (a)/(b) w realnym zapisie wlasciciela: NIE_ZMIERZONO. Dane X do rozstrzygniecia (bez tego nie da sie wskazac jednej przyczyny (a)/(b)):
1. Lista `player.zbadane` w zapisie (czy jest `Oswojenie zwierząt` — A6; czy `Gospodarka wodna` — A7) oraz cywilizacja gracza (Inkowie/Aztekowie → A8).
2. Wartosc `resourceDeficitKeysForOwner(0)` w tej turze (konsola: wynik funkcji z `main.ts:20750`) — potwierdzi, ze etapy sa wylaczone.
3. Pula Pracy na koniec tury i przyrost netto po utrzymaniu ulepszen (G1/G3: irygacja 60 Pracy glodzona).
4. Rzeczywisty zbior pracy miasta (czy heks rzeka+las ma obywatela: `workedHexCoordsForCity`), `hex.rzeka`/`riverPaths` na heksach farm (irygacja wymaga `isRiverAdjacent`).
5. `city.ulepszeniaOverride`/`ulepszeniaTryb` per miasto w zapisie (E1/E10).
Rekomendowany odczyt w zywej grze (do tematu `R-WEB-AUTOIMPROVE-PRIORITY-Q1`): log jednej linii przed `pickAutoImprovements` (`deficit`, `foodImprovementStages(city)`, `unlockedTechs.has(...)`, liczba kandydatow na etap).

## 7. Pytania ABC dla wlasciciela (zadaje orkiestrator)

**ABC-1 — sygnal "niedobor surowca" a potok zywnosciowy.** STARA: `main.ts:35767-35772`, `auto-improvements.ts:556,701`, `ai-resource-needs.ts:93-138`, `diplomacy-resource-trade-pick.ts:34-49` (niedobor = dowolny z 15 wycenionych surowcow < 10 szt.; ECHO 2026-08-27 "poza zywnoscia tylko w miare potrzeby"). NOWA: N3 (potok wycinka→farma→trzoda→irygacja zawsze). Opcje: A) etapy zywnosciowe i `foodOnly` NIEZALEZNE od niedoboru; niedobor tylko dodaje surowce PO zywnosci; B) niedobor liczony tylko z surowcow potrzebnych do kolejki budynkow/jednostek (bez progu "zapas < 10"); C) zostaw jak jest. Rekomendacja: A (inaczej potok N3 w grze nie dziala, M-*).
**ABC-2 — trzoda/owce na lesie.** STARA: `improvement-build.ts:450-464, 495, 622` (blokada, "Aby zbudowac Trzode najpierw usun las"). NOWA: ECHO 2026-08-27 "odwracamy — wszystkie trzy" + `terrain-improvements.json:55-56` ("nakladka Lasu nie przeszkadza") + komentarze `improvement-build.ts:427-432`. Opcje: A) dopisz `bydlo`,`owce` do `FOREST_COEXIST` (zgodnie z ECHO i JSON); B) zostaw blokade, popraw JSON/komentarze/hint; C) bydlo po wycince, owce w lesie. Rekomendacja: A, ale nie jest przyczyna (a)-(c) (heks farmy nie ma lasu).
**ABC-3 — minimum lesne (tartak+oboz) i prog 3 heksow lasu poza rzeka.** STARA: `auto-improvements.ts:966-998, 1011, 1015, 1101, 169`. NOWA: N3 "potem poza rzeka wycinka+farmy", N5. Opcje: A) minimum lesne zostaje poza rzeka, ale liczone na biezaco w petli i tartak/oboz stawiane tylko do `lesneMin` sztuk (nie na kazdym obrabianym lesie), prog 3 zostaje; B) bez minimum lesnego i bez progu przy wyrebie pod farme; C) zostaw. Rekomendacja: A (zachowuje ECHO "las wokol miasta" i usuwa stale F1).
**ABC-4 — kolejnosc etapow wobec N3.** STARA: `auto-improvements.ts:449-455` (farmy calego panstwa przed trzoda/irygacja). NOWA: N3 (przy rzekach farma→wycinka+farma→trzoda→irygacja, dopiero potem poza rzeka). Opcje: A) etapy dwupoziomowe (najpierw heksy rzeczne wszystkie etapy, potem reszta); B) zostaw globalnie; C) per heks jak AI (farma+trzoda+irygacja na jednym heksie w jednym przejsciu, jak A2). Rekomendacja: A.
**ABC-5 — zakladnik technologii w etapach.** STARA: `auto-improvements.ts:477-495`. NOWA: N1/N3 (irygacja po wynalezieniu technologii). Opcje: A) etap bez odblokowanego typu nie blokuje kolejnych; B) zostaw; C) komunikat UI "czeka na technologie X". Rekomendacja: A (A6 dowodzi).
**ABC-6 — N6 (trzoda i irygacja poza limitem %).** STARA: `auto-improvements.ts:729, 862-878, 1049` + rezerwa 30 (L172). NOWA: N6. Opcje: A) bydlo/irygacja poza `effectiveCityCap`, rezerwa 30 zostaje, i rezerwacja budzetu na najdrozsza pozycje etapu (koniec starvation 60); B) tylko wylaczenie z capu; C) zostaw. Rekomendacja: A.

## 8. Rekomendacja dla `R-WEB-AUTOIMPROVE-PRIORITY-Q1` (Operator R5)

Zrodla blokad, od najwiekszego wplywu: (1) E4/E11/P3 sygnal niedoboru (ABC-1), (2) P10/P14/P15/P18 tartak+oboz zamiast wyrebu i stale `lesneMin` (ABC-3), (3) E5/P25 brak `playerEra` (BLAD bez pytania: przekazac `empireEpochForOwner(hOid)` jak `ai.ts:2658`), (4) P5 zakladnik technologii (ABC-5), (5) P21/P8 starvation i N6 (ABC-6), (6) P4 kolejnosc (ABC-4). Przed zmiana zaktualizowac testy pinujace stary stan (sekcja 5, ostatni wiersz).
