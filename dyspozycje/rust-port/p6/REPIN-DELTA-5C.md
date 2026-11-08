# REPIN-DELTA-5C — pomiar dryfu logiki weba dla pinów `edb8fb56` i `91dc998a` (r2)

**Temat:** `R-RUSTPORT-REPIN-DELTA-5C-Q1` · **Runda:** 2/5 (obrona) · **Rola:** Operator · **Domena:** PROCESS (dokumentacja, zero zmian kodu)
**Zamyka:** zalecany w `REPIN-DELTA-5.md` §8 poz. 7 („dodatkowy pomiar `git diff 91dc998a 4bbef081d -- gra/src/game gra/data --numstat` jako REPIN-DELTA-5C").
**Źródło zarzutów:** Evaluator r1 (odpowiedzi w §10). Tabele i sumy odtwarzalne skryptami z §11; surowe tabele hunków: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5C-Q1/hunki-edb8-4bbef.tsv` (703 wiersze) i `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5C-Q1/hunki-91dc-4bbef.tsv` (280 wierszy).

## 0. Zakres i relacja do DELTA-5

| Element | Wartość |
|---|---|
| Zakres A (główny) | `git diff -U0 edb8fb56 4bbef081d -- gra/src/game gra/data` → **78 plików, 703 hunki, +7572/−1725** (zgodne z `--shortstat`) |
| Zakres B (wymagany dispatchem) | `git diff -U0 91dc998a 4bbef081d -- gra/src/game gra/data` → **37 plików, 280 hunków, +3370/−371** (zgodne z `--shortstat`) |
| Asercja per plik | suma `+`/`−` z hunków = `git diff --numstat` dla każdego pliku: **0 rozbieżności** w obu zakresach |
| Piny w kodzie Rust | `git grep` na `c86c686bb` (parity-v2): **648 plików, 916 wystąpień** (zobacz §5) |
| Relacja do DELTA-5 | DELTA-5 mierzy `4bbef081d..59868d84f` (`origin/main`), zakresy są **rozłączne** z tym pomiarem — brak podwójnego liczenia |
| Ancestry (zmierzone) | `91dc998a` i `edb8fb56` są przodkami `dc8a3adc`; `dc8a3adc` jest przodkiem `4bbef081d`; `4bbef081d` jest przodkiem `origin/main` (`git merge-base --is-ancestor`) |

Podział zakresu A na podzakresy (hunki, pliki): `edb8fb56..91dc998a` = 467 hunków / 59 plików (+4241/−1393); `91dc998a..dc8a3adc` = 50 / 8 (+655/−35); `dc8a3adc..4bbef081d` = 252 / 32 (+2773/−394). Podzakresy NIE sumują się do zakresu netto per plik (ten sam plik może być zmieniany w kilku etapach); zakres netto jest miarą właściwą dla wektorów.

## 1. Metoda i klasy

**Jednostka:** blok `@@` z `git diff -U0`. **Linia:** numer w wersji `4bbef081d` (dla hunków czysto usuwających — `^del` = usunięcie po tej linii).

**Klasy (reguły treści, nie rozszerzenia):**
1. **DANE** — plik `*.json` w `gra/data` (zmiana wartości/kształtu danych).
2. **PERF-bez-wpływu** — każda zmieniona linia to pusta linia, komentarz (`//`, `/*`, `*`), albo `import`.
3. **UI** — co najmniej jedna zmieniona linia dotyka API DOM/prezentacji (`document.`, `innerHTML`, `classList`, `style.`, `createElement`, `querySelector`, `addEventListener`, `textContent`, `dataset`, `className`, `tooltip`, `modal`, `panel*`, `button`, `disabled`, `hidden`).
4. **LOGIKA** — pozostałe (domyślnie: wszystko, co zmienia wartości, warunki lub przepływ w `.ts`).

Reguły są heurystyczne: klasa to **sygnał do przeglądu**, nie dowód zachowania. Semantyczna ocena każdego hunka (czy zmienia wynik wektora) = **NIE_ZMIERZONO** (§8). Skrypt: `scratchpad/5c/classify.py` (nie w repo).

**Podsumowanie klas**

| Zakres | Hunki | L (LOGIKA) | D (DANE) | U (UI) | P (PERF) | typ: zmiana / dodanie / usunięcie |
|---|---:|---:|---:|---:|---:|---|
| A: edb8fb56..4bbef081d | 703 | 487 | 104 | 3 | 109 | 371 / 243 / 89 |
| B: 91dc998a..4bbef081d | 280 | 205 | 30 | 0 | 45 | 151 / 120 / 9 |
| A1: edb8fb56..91dc998a | 467 | 315 | 77 | 3 | 72 | — |
| A2: 91dc998a..dc8a3adc | 50 | 46 | 0 | 0 | 4 | — |
| A3: dc8a3adc..4bbef081d | 252 | 180 | 30 | 0 | 42 | — |

**Przypisanie do tematów kolejki:** tylko wg kolumny „Temat” w `REPIN-DELTA-5.md` §3 (ten sam słownik: T2=#2 EKONOMIA-F, T3=#3 AUTOIMPROVE, T4=#4 DYPLOMACJA-MULTIWAR, T6=#6 AI-ARMIA, T7=#7 OBLEZENIE-ZDOBYCZE, N1–N7=NOWY-1…7). Plik spoza tej tabeli (DELTA-5 mierzy inny zakres) = **nieprzypisany**: zakres A — 685/703 hunków, zakres B — 268/280. Przypisanie reszty wymaga allowlist z §0c `PLAN-PORT-RUST-TAURI-20261020.md` (NIE_ZMIERZONO w tej rundzie). Wcześniejsze etykiety tematów z r1 były niezweryfikowane i zostały usunięte.

## 2. Tabela hunków — zakres B (91dc998a..4bbef081d), wiersz na plik

Pełna lista: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5C-Q1/hunki-91dc-4bbef.tsv` (kolumny: zakres, plik, nr hunka, linia od, liczba, stara linia, typ, klasa, temat, podgląd).

| # | plik (gra/) | hunki | +/− | L/D/U/P | linie w 4bbef081d (od-do:klasa; ^del = czysta usunięcie po tej linii) |
|---:|---|---:|---|---|---|
| 1 | `src/game/ai.ts` | 46 | +327/−83 | 38/0/0/8 | 41:P, 69:P, 72-74:L, 410-415:L, 488:L, 2419:L, 2601:P, 2604:L, 2632^del:L, 2644-2645:L, 2655-2658:L, 2662-2665:L, 2684-2687:L, 2689-2695:L, 2769:P, 2772:L, 3929-3931:P, 3933-3934:L, 3943-3946:L, 3967:L, 3969:L, 3976-3979:P, 3981-4008:L, 4010-4012:L, 4015-4019:L, 4022-4026:L, 4041-4042:L, 4302-4303:L, 5079-5080:P, 5135-5146:L, 5186-5187:L, 5267-5295:L, 5337-5343:L, 5394-5455:L, 5458-5468:L, 5817-5823:L, 5838-5839:L, 5844:L, 5846-5847:L, 5859-5860:L, 5874-5935:L, 5951-5972:L, 5976-5977:L, 6089:L, 6146:P, 6148-6149:L |
| 2 | `src/game/auto-improvements.ts` | 37 | +821/−48 | 30/0/0/7 | 9:P, 12:P, 17:L, 75-92:L, 130:L, 171-180:P, 403-447:L, 480-758:L, 760-992:L, 1016-1022:L, 1031-1034:L, 1147-1174:L, 1177-1178:L, 1186-1192:P, 1194-1207:L, 1209-1217:L, 1229^del:L, 1307-1309:P, 1338-1341:L, 1358:L, 1360:L, 1473-1504:L, 1513-1520:L, 1524-1525:L, 1528-1535:L, 1538-1541:P, 1556-1560:L, 1562:L, 1581-1633:L, 1643-1644:P, 1646-1659:L, 1688-1694:L, 1707-1714:L, 1718-1719:L, 1743-1746:L, 1764:L, 1805:L |
| 3 | `src/game/diplomacy-proposals.ts` | 30 | +152/−19 | 27/0/0/3 | 28-29:P, 63:P, 93-95:L, 152-153:L, 189-199:L, 379-382:L, 392-395:L, 451-470:L, 733-734:L, 1059-1061:L, 1065-1067:L, 1072-1075:L, 1116-1119:L, 1165-1166:L, 1246-1252:L, 1262-1285:L, 1513:L, 1525:L, 1533-1535:L, 1892-1894:L, 1899-1902:L, 1954-1963:L, 1970-1989:L, 2099:L, 2159-2160:L, 2240:L, 2252:L, 2258-2264:L, 2612:P, 2614:L |
| 4 | `src/game/citizen-resource-upkeep.ts` | 26 | +84/−23 | 16/0/0/10 | 24-26:P, 41:P, 81:P, 83:P, 107-112:L, 136:P, 156-158:P, 161-164:P, 166:L, 168:L, 171:L, 173-196:L, 202-207:L, 234:L, 240-249:L, 252-254:L, 264-267:L, 285:P, 290:P, 309:L, 321-322:L, 337-339:L, 348:P, 401:L, 405-406:L, 409:L |
| 5 | `data/terrain-improvements.json` | 15 | +24/−24 | 0/15/0/0 | 8:D, 54-56:D, 60:D, 72-74:D, 78:D, 91:D, 93:D, 145-146:D, 203-204:D, 277-279:D, 281:D, 285:D, 401-402:D, 404:D, 409:D |
| 6 | `src/game/turn-economy.ts` | 15 | +30/−15 | 15/0/0/0 | 127-128:L, 131:L, 1356:L, 1358:L, 1367:L, 1374-1376:L, 1406:L, 1547-1551:L, 1567-1568:L, 1583:L, 1708-1711:L, 1797:L, 2477-2481:L, 2495:L, 2499:L |
| 7 | `src/game/warAllInCapital.ts` | 15 | +206/−14 | 13/0/0/2 | 28:P, 61-64:L, 74-199:L, 210-211:L, 223-227:L, 284:L, 288-289:L, 341-342:L, 364-365:P, 456:L, 470:L, 511:L, 513:L, 535-586:L, 846-850:L |
| 8 | `src/game/forced-war-common.ts` | 11 | +46/−6 | 10/0/0/1 | 12-16:P, 201-211:L, 213-218:L, 221-227:L, 307-313:L, 317:L, 339-340:L, 401:L, 468:L, 498-499:L, 501-503:L |
| 9 | `src/game/building-resource-gate.ts` | 10 | +59/−13 | 10/0/0/0 | 38-42:L, 330-373:L, 415-416:L, 424:L, 426:L, 429:L, 435:L, 438:L, 614-615:L, 627:L |
| 10 | `src/game/diplomacy.ts` | 8 | +192/−2 | 6/0/0/2 | 24-25:P, 35:P, 1108-1112:L, 1300-1305:L, 1337-1338:L, 1340:L, 1368-1370:L, 1785-1956:L |
| 11 | `src/game/diplomacy-pn-engine.ts` | 6 | +17/−1 | 6/0/0/0 | 35-36:L, 41:L, 90-95:L, 121-126:L, 233:L, 239:L |
| 12 | `src/game/diplomacy-value-catalog.ts` | 6 | +268/−2 | 6/0/0/0 | 26-27:L, 448-453:L, 479-493:L, 527-539:L, 546:L, 767-997:L |
| 13 | `src/game/victory.ts` | 6 | +28/−7 | 3/0/0/3 | 14-18:P, 95-97:P, 102-104:L, 208-221:L, 225:P, 247-248:L |
| 14 | `src/game/fort-territory.ts` | 5 | +136/−1 | 3/0/0/2 | 8-17:P, 36:P, 58-88:L, 103-142:L, 296-349:L |
| 15 | `src/game/forced-war-bronze.ts` | 4 | +4/−35 | 3/0/0/1 | 5^del:L, 92-95:P, 171^del:L, 183^del:L |
| 16 | `src/game/war-rules-multiwar.ts` | 4 | +145/−1 | 3/0/0/1 | 22:P, 24-27:L, 37-38:L, 163-300:L |
| 17 | `data/ai-params.json` | 3 | +3/−3 | 0/3/0/0 | 285:D, 290:D, 295:D |
| 18 | `data/econ-params.json` | 3 | +3/−3 | 0/3/0/0 | 388:D, 395:D, 402:D |
| 19 | `src/game/city-hex-clear.ts` | 3 | +21/−3 | 3/0/0/0 | 41-59:L, 65:L, 74:L |
| 20 | `src/game/forced-war-iron.ts` | 3 | +3/−27 | 2/0/0/1 | 5^del:L, 89-91:P, 214^del:L |
| 21 | `src/game/forced-war-stone.ts` | 3 | +3/−32 | 2/0/0/1 | 5^del:L, 28-30:P, 74^del:L |
| 22 | `data/citizen-resource-upkeep.json` | 2 | +4/−4 | 0/2/0/0 | 2:D, 10-12:D |
| 23 | `data/war-rules-params.json` | 2 | +4/−2 | 0/2/0/0 | 2:D, 6-8:D |
| 24 | `src/game/diplomacy-war-gates.ts` | 2 | +3/−1 | 1/0/0/1 | 10-11:L, 13:P |
| 25 | `src/game/save.ts` | 2 | +5/−0 | 2/0/0/0 | 428-430:L, 730-731:L |
| 26 | `src/game/terrain-improvements.ts` | 2 | +4/−0 | 0/0/0/2 | 204-206:P, 209:P |
| 27 | `data/diplomacy-acceptance-points.json` | 1 | +1/−0 | 0/1/0/0 | 5:D |
| 28 | `data/diplomacy-aggressor-params.json` | 1 | +16/−0 | 0/1/0/0 | 1-16:D |
| 29 | `data/diplomacy-war-peace-params.json` | 1 | +97/−0 | 0/1/0/0 | 1-97:D |
| 30 | `data/tech.json` | 1 | +1/−1 | 0/1/0/0 | 360:D |
| 31 | `data/ui-params.json` | 1 | +1/−1 | 0/1/0/0 | 178:D |
| 32 | `src/game/battle-mode.ts` | 1 | +14/−0 | 1/0/0/0 | 1-14:L |
| 33 | `src/game/diplomacy-peace-lock.ts` | 1 | +50/−0 | 1/0/0/0 | 58-107:L |
| 34 | `src/game/diplomacy-tick-war-brake.ts` | 1 | +23/−0 | 1/0/0/0 | 172-194:L |
| 35 | `src/game/diplomacy-war-peace-profile.ts` | 1 | +364/−0 | 1/0/0/0 | 1-364:L |
| 36 | `src/game/generalQuickFollow.ts` | 1 | +161/−0 | 1/0/0/0 | 1-161:L |
| 37 | `src/game/generals.ts` | 1 | +50/−0 | 1/0/0/0 | 54-103:L |

## 3. Tabela hunków — zakres A (edb8fb56..4bbef081d), wiersz na plik

Pełna lista: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5C-Q1/hunki-edb8-4bbef.tsv`.

| # | plik (gra/) | hunki | +/− | L/D/U/P | linie w 4bbef081d (od-do:klasa; ^del = czysta usunięcie po tej linii) |
|---:|---|---:|---|---|---|
| 1 | `src/game/ai.ts` | 85 | +732/−202 | 68/0/1/16 | 20-33:L, 35:P, 41:P, 69:P, 72-74:L, 85:P, 90:L, 92:P, 112-113:L, 186-190:L, 196-198:L, 410-415:L, 476-500:L, 633-634:L, 671^del:P, 695^del:L, 768^del:L, 783:P, 888-894:P, 901:L, 904-906:L, 909:L, 1287^del:L, 1342^del:P, 1356^del:L, 1650:L, 1669-1671:L, 1680^del:P, 1688-1691:U, 2004^del:L, 2128-2151:L, 2419:L, 2530:P, 2601:P, 2604:L, 2632^del:L, 2644-2645:L, 2655-2658:L, 2662-2665:L, 2684-2687:L, 2689-2695:L, 2769:P, 2772:L, 3007:L, 3020-3028:L, 3120:P, 3131-3132:L, 3140:L, 3200:L, 3238-3242:L, 3342-3347:L, 3384-3389:L, 3420:L, 3423-3424:L, 3440:L, 3511:L, 3513-3514:L, 3521-3586:L, 3904-3910:L, 3915-4069:L, 4262-4345:L, 4351^del:L, 4368:L, 4405-4408:L, 5079-5080:P, 5135-5146:L, 5186-5187:L, 5267-5295:L, 5337-5343:L, 5394-5455:L, 5458-5468:L, 5480-5481:L, 5817-5823:L, 5825-5827:L, 5838-5839:L, 5844:L, 5846-5847:L, 5850-5853:L, 5859-5860:L, 5874-5935:L, 5951-5972:L, 5976-5977:L, 6089:L, 6146:P, 6148-6149:L |
| 2 | `src/game/turn-economy.ts` | 66 | +125/−179 | 59/0/0/7 | 55^del:L, 74-75:P, 127-128:L, 131:L, 141-142:L, 144:L, 161:L, 176:L, 186-201:L, 228-231:L, 250^del:L, 310^del:L, 1052-1053:L, 1072:L, 1074-1076:P, 1156:P, 1356:L, 1358:L, 1367:L, 1374-1376:L, 1406:L, 1547-1551:L, 1567-1568:L, 1583:L, 1602:L, 1610:L, 1644:L, 1708-1711:L, 1797:L, 1864-1867:L, 1978^del:L, 1986^del:L, 2013-2014:P, 2019^del:L, 2023:L, 2040:L, 2045-2046:L, 2054:L, 2057:P, 2059-2063:L, 2090:L, 2092:L, 2145:L, 2147-2148:L, 2287-2290:L, 2477-2481:L, 2495:L, 2499:L, 2550^del:L, 2558^del:L, 2585-2586:P, 2591^del:L, 2595-2596:L, 2613:L, 2621-2622:L, 2630:L, 2639:P, 2641-2645:L, 2658-2659:L, 2684:L, 2686-2687:L, 2756:L, 2770:L, 2775:L, 2777:L, 2900-2908:L |
| 3 | `data/civs.json` | 60 | +180/−489 | 0/60/0/0 | 6^del:D, 8^del:D, 10-21:D, 28^del:D, 151^del:D, 153^del:D, 155-166:D, 173^del:D, 296^del:D, 298^del:D, 300-311:D, 318^del:D, 441^del:D, 443^del:D, 445-456:D, 463^del:D, 586^del:D, 588^del:D, 590-601:D, 608^del:D, 731^del:D, 733^del:D, 735-746:D, 753^del:D, 876^del:D, 878^del:D, 880-891:D, 898^del:D, 1021^del:D, 1023^del:D, 1025-1036:D, 1043^del:D, 1166^del:D, 1168^del:D, 1170-1181:D, 1188^del:D, 1311^del:D, 1313^del:D, 1315-1326:D, 1333^del:D, 1456^del:D, 1458^del:D, 1460-1471:D, 1478^del:D, 1601^del:D, 1603^del:D, 1605-1616:D, 1623^del:D, 1746^del:D, 1748^del:D, 1750-1761:D, 1768^del:D, 1891^del:D, 1893^del:D, 1895-1906:D, 1913^del:D, 2036^del:D, 2038^del:D, 2040-2051:D, 2058^del:D |
| 4 | `src/game/production.ts` | 44 | +216/−55 | 41/0/0/3 | 65:P, 129-130:L, 207-226:L, 420:L, 448-449:L, 488-503:L, 562-563:L, 583:L, 587-588:L, 608-625:L, 628:L, 630-631:L, 633-637:L, 640-656:L, 671-692:L, 735-761:L, 936:L, 983-985:L, 1027:L, 1031-1035:L, 1044-1045:P, 1049:L, 1063-1077:L, 1089:L, 1150:L, 1160:L, 1164:P, 1166:L, 1176-1183:L, 1197:L, 1215:L, 1273-1288:L, 1902:L, 1911:L, 1923:L, 1926-1928:L, 1985-1986:L, 2056-2057:L, 2060:L, 2075:L, 2077:L, 2137:L, 2140-2142:L, 2302:L |
| 5 | `src/game/economy.ts` | 41 | +116/−213 | 24/0/0/17 | 45:P, 149-152:P, 162^del:L, 237^del:L, 326:L, 332-333:P, 335:P, 644-646:P, 650-653:P, 656^del:L, 674-675:L, 703:P, 706-707:L, 709-710:L, 714-715:P, 727:L, 745-747:P, 749-751:P, 755:L, 759:L, 781:P, 783:L, 785:L, 794-795:P, 797-798:P, 800:P, 803:P, 862-864:P, 871:L, 875-877:L, 884-891:L, 898-907:L, 908^del:L, 910-919:L, 931-943:L, 945:P, 947:L, 963-966:L, 977-988:L, 1003-1006:L, 1017-1019:L |
| 6 | `src/game/auto-improvements.ts` | 38 | +824/−49 | 31/0/0/7 | 9:P, 12:P, 17:L, 59-61:L, 75-92:L, 130:L, 171-180:P, 403-447:L, 480-758:L, 760-992:L, 1016-1022:L, 1031-1034:L, 1147-1174:L, 1177-1178:L, 1186-1192:P, 1194-1207:L, 1209-1217:L, 1229^del:L, 1307-1309:P, 1338-1341:L, 1358:L, 1360:L, 1473-1504:L, 1513-1520:L, 1524-1525:L, 1528-1535:L, 1538-1541:P, 1556-1560:L, 1562:L, 1581-1633:L, 1643-1644:P, 1646-1659:L, 1688-1694:L, 1707-1714:L, 1718-1719:L, 1743-1746:L, 1764:L, 1805:L |
| 7 | `src/game/diplomacy-proposals.ts` | 34 | +157/−21 | 31/0/0/3 | 28-29:P, 63:P, 93-95:L, 152-153:L, 189-199:L, 379-382:L, 392-395:L, 451-470:L, 733-734:L, 1059-1061:L, 1065-1067:L, 1072-1075:L, 1116-1119:L, 1165-1166:L, 1246-1252:L, 1262-1285:L, 1513:L, 1525:L, 1533-1535:L, 1892-1894:L, 1899-1902:L, 1907:L, 1910:L, 1913:L, 1954-1963:L, 1970-1989:L, 2099:L, 2159-2160:L, 2240:L, 2252:L, 2258-2264:L, 2395-2396:L, 2612:P, 2614:L |
| 8 | `src/game/manpower.ts` | 32 | +80/−48 | 29/0/0/3 | 29:P, 289:L, 309-312:L, 313^del:L, 337-338:L, 342-347:L, 402-414:L, 416:L, 418:L, 421:P, 423:L, 425:L, 428:P, 430-456:L, 458-460:L, 465:L, 548:L, 551:L, 615:L, 621:L, 643:L, 645:L, 733:L, 735:L, 749:L, 752:L, 804:L, 806:L, 845:L, 847:L, 882:L, 884:L |
| 9 | `src/game/citizen-resource-upkeep.ts` | 26 | +84/−23 | 16/0/0/10 | 24-26:P, 41:P, 81:P, 83:P, 107-112:L, 136:P, 156-158:P, 161-164:P, 166:L, 168:L, 171:L, 173-196:L, 202-207:L, 234:L, 240-249:L, 252-254:L, 264-267:L, 285:P, 290:P, 309:L, 321-322:L, 337-339:L, 348:P, 401:L, 405-406:L, 409:L |
| 10 | `src/game/civ-bonuses.ts` | 25 | +106/−98 | 24/0/0/1 | 7:P, 21:L, 73:L, 98-111:L, 136^del:L, 142:L, 147^del:L, 158^del:L, 164:L, 166^del:L, 168^del:L, 177^del:L, 189-190:L, 194:L, 196-226:L, 255-283:L, 286-288:L, 290:L, 292-294:L, 297-299:L, 306:L, 309:L, 322-325:L, 335-341:L, 387:L |
| 11 | `src/game/forced-war-common.ts` | 18 | +144/−20 | 16/0/0/2 | 12-16:P, 20-22:P, 147-179:L, 201-211:L, 213-218:L, 221-227:L, 231-247:L, 268-269:L, 307-313:L, 316-317:L, 320-352:L, 354-356:L, 359-365:L, 401:L, 468:L, 498-499:L, 501-503:L, 520:L |
| 12 | `src/game/civ-ai-data.ts` | 17 | +32/−34 | 13/0/0/4 | 4^del:P, 37:P, 39:L, 50:L, 54:L, 67:L, 81-83:L, 112-121:L, 161-162:P, 166-167:L, 171:L, 177-180:L, 182:L, 186:P, 190:L, 198:L, 215:L |
| 13 | `data/terrain-improvements.json` | 15 | +24/−24 | 0/15/0/0 | 8:D, 54-56:D, 60:D, 72-74:D, 78:D, 91:D, 93:D, 145-146:D, 203-204:D, 277-279:D, 281:D, 285:D, 401-402:D, 404:D, 409:D |
| 14 | `src/game/culture-religion.ts` | 13 | +43/−21 | 5/0/0/8 | 7-8:P, 47-48:P, 120-121:L, 123^del:L, 339-345:L, 502-514:L, 1246-1247:P, 1263:P, 1265-1266:P, 1274-1275:P, 1303:P, 1306-1313:L, 1321:P |
| 15 | `src/game/civ-matrix-semantic.ts` | 11 | +91/−43 | 11/0/0/0 | 129-164:L, 201-236:L, 256-257:L, 259^del:L, 260^del:L, 266-268:L, 393:L, 409-411:L, 517-521:L, 526:L, 547-550:L |
| 16 | `data/econ-params.json` | 10 | +15/−15 | 0/10/0/0 | 276:D, 311:D, 332:D, 334-339:D, 388:D, 395:D, 402:D, 579:D, 581:D, 583:D |
| 17 | `src/game/building-resource-gate.ts` | 10 | +59/−13 | 10/0/0/0 | 38-42:L, 330-373:L, 415-416:L, 424:L, 426:L, 429:L, 435:L, 438:L, 614-615:L, 627:L |
| 18 | `src/game/population-growth-v85.ts` | 10 | +37/−6 | 9/0/0/1 | 20:P, 46-51:L, 216:L, 218-219:L, 287-295:L, 445-448:L, 494:L, 524:L, 537-544:L, 587-590:L |
| 19 | `src/game/ai-city-capture-executor.ts` | 8 | +31/−1 | 6/0/0/2 | 8:P, 15:L, 54-55:L, 64-70:L, 96:L, 114-115:P, 117-122:L, 126-136:L |
| 20 | `src/game/diplomacy.ts` | 8 | +192/−2 | 6/0/0/2 | 24-25:P, 35:P, 1108-1112:L, 1300-1305:L, 1337-1338:L, 1340:L, 1368-1370:L, 1785-1956:L |
| 21 | `src/game/barbarians.ts` | 6 | +49/−3 | 4/0/0/2 | 39-40:P, 745-748:P, 759:L, 1759:L, 1807-1845:L, 1880-1881:L |
| 22 | `src/game/diplomacy-pn-engine.ts` | 6 | +17/−1 | 6/0/0/0 | 35-36:L, 41:L, 90-95:L, 121-126:L, 233:L, 239:L |
| 23 | `src/game/diplomacy-value-catalog.ts` | 6 | +268/−2 | 6/0/0/0 | 26-27:L, 448-453:L, 479-493:L, 527-539:L, 546:L, 767-997:L |
| 24 | `src/game/terrain-improvements.ts` | 6 | +19/−7 | 2/0/0/4 | 70-72:P, 90-99:L, 107:P, 114:L, 204-206:P, 209:P |
| 25 | `src/game/victory.ts` | 6 | +28/−7 | 3/0/0/3 | 14-18:P, 95-97:P, 102-104:L, 208-221:L, 225:P, 247-248:L |
| 26 | `src/game/cluster-start.ts` | 5 | +35/−1 | 3/0/0/2 | 19:P, 21:P, 59-64:L, 380-405:L, 420:L |
| 27 | `src/game/fort-territory.ts` | 5 | +136/−1 | 3/0/0/2 | 8-17:P, 36:P, 58-88:L, 103-142:L, 296-349:L |
| 28 | `src/game/trade-routes.ts` | 5 | +42/−13 | 4/0/0/1 | 1618-1620:P, 1622-1628:L, 1632-1635:L, 1639-1656:L, 1658-1667:L |
| 29 | `data/units.json` | 4 | +4/−4 | 0/4/0/0 | 523:D, 528:D, 566:D, 576:D |
| 30 | `src/game/diplomacy-resource-trade-pick.ts` | 4 | +10/−2 | 4/0/0/0 | 81-86:L, 106:L, 134:L, 139-140:L |
| 31 | `src/game/forced-war-bronze.ts` | 4 | +5/−36 | 4/0/0/0 | 5^del:L, 92-96:L, 171^del:L, 183^del:L |
| 32 | `src/game/forced-war-iron.ts` | 4 | +9/−20 | 3/0/0/1 | 5^del:L, 37-40:P, 88-92:L, 214^del:L |
| 33 | `src/game/planned-march.ts` | 4 | +15/−4 | 4/0/0/0 | 19-20:L, 452-455:L, 460-462:L, 481-486:L |
| 34 | `data/ai-params.json` | 3 | +3/−3 | 0/3/0/0 | 285:D, 290:D, 295:D |
| 35 | `src/game/city-hex-clear.ts` | 3 | +21/−3 | 3/0/0/0 | 41-59:L, 65:L, 74:L |
| 36 | `src/game/forced-war-stone.ts` | 3 | +4/−33 | 3/0/0/0 | 5^del:L, 28-31:L, 74^del:L |
| 37 | `src/game/fsa-autosave.ts` | 3 | +55/−1 | 2/0/1/0 | 254:L, 449-497:U, 566-570:L |
| 38 | `src/game/order.ts` | 3 | +23/−2 | 1/0/0/2 | 4:P, 82:P, 161-181:L |
| 39 | `src/game/playerState.ts` | 3 | +1/−7 | 2/0/0/1 | 42:P, 133^del:L, 154^del:L |
| 40 | `data/citizen-resource-upkeep.json` | 2 | +4/−4 | 0/2/0/0 | 2:D, 10-12:D |
| 41 | `src/game/armyMerge.ts` | 2 | +3/−0 | 2/0/0/0 | 923-924:L, 952:L |
| 42 | `src/game/combat.ts` | 2 | +4/−2 | 2/0/0/0 | 920-921:L, 933-934:L |
| 43 | `src/game/diplomacy-ai-offer-balance.ts` | 2 | +24/−1 | 2/0/0/0 | 95-117:L, 291:L |
| 44 | `src/game/diplomacy-layers.ts` | 2 | +32/−0 | 1/0/0/1 | 11-12:P, 59-88:L |
| 45 | `src/game/diplomacy-peace-lock.ts` | 2 | +51/−1 | 1/0/0/1 | 10:P, 58-107:L |
| 46 | `src/game/diplomacy-war-gates.ts` | 2 | +3/−1 | 1/0/0/1 | 10-11:L, 13:P |
| 47 | `src/game/embarkation.ts` | 2 | +2/−2 | 1/0/0/1 | 22:P, 60:L |
| 48 | `src/game/relief-preserving-improvements.ts` | 2 | +5/−6 | 1/0/0/1 | 8-10:P, 23-24:L |
| 49 | `src/game/save.ts` | 2 | +11/−1 | 2/0/0/0 | 421-429:L, 730-731:L |
| 50 | `data/army-consolidation-params.json` | 1 | +17/−0 | 0/1/0/0 | 1-17:D |
| 51 | `data/diplomacy-acceptance-points.json` | 1 | +1/−0 | 0/1/0/0 | 5:D |
| 52 | `data/diplomacy-aggressor-params.json` | 1 | +16/−0 | 0/1/0/0 | 1-16:D |
| 53 | `data/diplomacy-tick-params.json` | 1 | +22/−0 | 0/1/0/0 | 1-22:D |
| 54 | `data/diplomacy-war-peace-params.json` | 1 | +97/−0 | 0/1/0/0 | 1-97:D |
| 55 | `data/tech.json` | 1 | +1/−1 | 0/1/0/0 | 360:D |
| 56 | `data/ui-params.json` | 1 | +26/−0 | 0/1/0/0 | 163-188:D |
| 57 | `data/war-allin-params.json` | 1 | +17/−0 | 0/1/0/0 | 1-17:D |
| 58 | `data/war-rules-params.json` | 1 | +11/−0 | 0/1/0/0 | 1-11:D |
| 59 | `src/game/ai-era-unit-promotion.ts` | 1 | +63/−0 | 1/0/0/0 | 1-63:L |
| 60 | `src/game/ai-general-war-campaign.ts` | 1 | +164/−0 | 1/0/0/0 | 1-164:L |
| 61 | `src/game/ai-move-range.ts` | 1 | +112/−0 | 1/0/0/0 | 1-112:L |
| 62 | `src/game/army-consolidation.ts` | 1 | +177/−0 | 1/0/0/0 | 1-177:L |
| 63 | `src/game/army-leadership.ts` | 1 | +63/−0 | 1/0/0/0 | 1-63:L |
| 64 | `src/game/battle-mode.ts` | 1 | +14/−0 | 1/0/0/0 | 1-14:L |
| 65 | `src/game/diplomacy-sensible-deals.config.json` | 1 | +6/−0 | 0/1/0/0 | 1-6:D |
| 66 | `src/game/diplomacy-sensible-deals.ts` | 1 | +170/−0 | 1/0/0/0 | 1-170:L |
| 67 | `src/game/diplomacy-tick-war-brake.ts` | 1 | +239/−0 | 1/0/0/0 | 1-239:L |
| 68 | `src/game/diplomacy-war-peace-profile.ts` | 1 | +364/−0 | 1/0/0/0 | 1-364:L |
| 69 | `src/game/dirtyRenderSync.ts` | 1 | +31/−0 | 1/0/0/0 | 1-31:L |
| 70 | `src/game/generalQuickFollow.ts` | 1 | +161/−0 | 1/0/0/0 | 1-161:L |
| 71 | `src/game/generals.ts` | 1 | +103/−0 | 1/0/0/0 | 1-103:L |
| 72 | `src/game/retained-side-panel-events.ts` | 1 | +26/−0 | 1/0/0/0 | 1-26:L |
| 73 | `src/game/save-presence.ts` | 1 | +118/−0 | 0/0/1/0 | 1-118:U |
| 74 | `src/game/society-breakdown.ts` | 1 | +33/−0 | 1/0/0/0 | 1076-1108:L |
| 75 | `src/game/war-rules-multiwar.ts` | 1 | +393/−0 | 1/0/0/0 | 1-393:L |
| 76 | `src/game/warAllInCapital.ts` | 1 | +859/−0 | 1/0/0/0 | 1-859:L |
| 77 | `src/game/wealth.ts` | 1 | +20/−0 | 1/0/0/0 | 58-77:L |
| 78 | `src/game/work-tax.ts` | 1 | +77/−0 | 1/0/0/0 | 1-77:L |

## 4. Wnioski dla kolejki (tylko to, co wynika z tabel)

- **Pliki z największą liczbą hunków w zakresie B:** patrz tabela §2 (posortowana wg liczby hunków). Wybrane: `ai.ts` 46 hunków (327/83 linii), `citizen-resource-upkeep.ts` 26 hunków (cytowany przez 9 plików Rust — §5).
- **Usunięcia czyste (`typ=usuniecie`) w B:** 9 hunków: `forced-war-bronze.ts` 3, `forced-war-iron.ts` 2, `forced-war-stone.ts` 2, `ai.ts` 1, `auto-improvements.ts` 1. Klasa LOGIKA wg treści; wpływ na wektor wymaga semantyki (NIE_ZMIERZONO).
- **Zmiany kształtu/wartości danych w B (DANE):** 30 hunków w 10 plikach JSON; `terrain-improvements.json` 15 hunków (24/24 linii), `ai-params.json` 3, `econ-params.json` 3, `citizen-resource-upkeep.json` 2, `war-rules-params.json` 2 (plik nieobecny w drzewie Rust, §5).
- **UI w zakresie B:** 0 hunków. W zakresie A: 3 hunki — `ai.ts:1688`, `fsa-autosave.ts:449`, `save-presence.ts:1` (klasa z reguł DOM, do przeglądu).

## 5. Piny w kodzie Rust (`c86c686bb`)

| Miara | Wartość | Komenda |
|---|---|---|
| Pliki z dowolnym pinem | **648** | `git grep -l -E "edb8fb56\|91dc998a" c86c686bb -- rust-port` |
| Wystąpienia | **916** | `git grep -c` (suma po plikach) |
| Pliki z `edb8fb56` / z `91dc998a` / z obydwoma | 507 / 158 / 17 | skrypt `pins.py` |
| Katalogi (pliki / wystąpienia) | engine/tests 310/398 · renderer/tests 79/163 · engine/src 66/144 · renderer/src 120/127 · engine/data 72/83 · assets 1/1 | `git grep -c` |

**Kandydaci do regeneracji** = plik Rust, który zawiera pin P **i** nazwę pliku źródła webu zmienionego w zakresie pinu P (dopasowanie po nazwie pliku w tym samym pliku Rust; **treść wektorów nie była czytana**). Łącznie **139** plików: 112 (`edb8fb56`), 19 (`91dc998a`), 8 (obydwa). Pełna lista z pełnymi nazwami źródeł: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5C-Q1/kandydaci-regeneracji.tsv`; wszystkie dopasowania: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5C-Q1/wektory-piny.tsv`.

| # | plik Rust (rust-port/) | pin kandydujący | źródła web zmienione w zakresie pinu |
|---:|---|---|---|
| 1 | `engine/data/derived/README.md` | edb8fb56 | units.json |
| 2 | `engine/data/derived/army-merge-params.json` | edb8fb56 | armyMerge.ts |
| 3 | `engine/data/derived/building-cost-params.json` | edb8fb56 | building-resource-gate.ts |
| 4 | `engine/data/derived/building-gold-upkeep.json` | edb8fb56 | production.ts |
| 5 | `engine/data/derived/building-work-costs.json` | edb8fb56 | production.ts |
| 6 | `engine/data/derived/building-work-states.json` | edb8fb56 | civ-bonuses.ts, civs.json, production.ts |
| 7 | `engine/data/derived/cities-params.json` | edb8fb56 | population-growth-v85.ts, wealth.ts |
| 8 | `engine/data/derived/city-hex-clear-rules.json` | edb8fb56 | city-hex-clear.ts |
| 9 | `engine/data/derived/civ-bonus-diacritics.json` | edb8fb56 | civ-bonuses.ts |
| 10 | `engine/data/derived/civ-bonus-rules.json` | edb8fb56 | civ-bonuses.ts |
| 11 | `engine/data/derived/civ-matrix-params.json` | edb8fb56 | civ-ai-data.ts |
| 12 | `engine/data/derived/civ-matrix-semantic.json` | 91dc998a | ai.ts, diplomacy.ts, turn-economy.ts |
| 13 | `engine/data/derived/combat-ai-multipliers.json` | edb8fb56 | ai.ts, combat.ts, embarkation.ts, terrain-improvements.json |
| 14 | `engine/data/derived/counter-multipliers.json` | edb8fb56 | combat.ts |
| 15 | `engine/data/derived/diplomacy-multipliers.json` | edb8fb56 | diplomacy-proposals.ts, diplomacy-value-catalog.ts, diplomacy.ts, economy.ts |
| 16 | `engine/data/derived/improvement-work.json` | edb8fb56 | terrain-improvements.json, terrain-improvements.ts |
| 17 | `engine/data/derived/locale-compare-ascii.json` | edb8fb56 | manpower.ts |
| 18 | `engine/data/derived/manpower-params.json` | edb8fb56 | manpower.ts |
| 19 | `engine/data/derived/player-state-params.json` | edb8fb56 | playerState.ts |
| 20 | `engine/data/derived/porzadek-params.json` | edb8fb56 | order.ts |
| 21 | `engine/data/derived/racje.json` | edb8fb56 | population-growth-v85.ts |
| 22 | `engine/data/derived/research-costs.json` | edb8fb56 | tech.json |
| 23 | `engine/data/derived/ruch-jednostek-params.json` | edb8fb56 | armyMerge.ts, embarkation.ts, planned-march.ts |
| 24 | `engine/data/derived/start-braz-access.json` | edb8fb56 | terrain-improvements.json, terrain-improvements.ts |
| 25 | `engine/data/derived/start-cluster-params.json` | edb8fb56 | cluster-start.ts, diplomacy-layers.ts |
| 26 | `engine/data/derived/storage-caps.json` | edb8fb56 | econ-params.json |
| 27 | `engine/data/derived/teren-ruch-reguly.json` | edb8fb56 | fort-territory.ts, terrain-improvements.json |
| 28 | `engine/data/derived/trade-multipliers.json` | edb8fb56 | civs.json, culture-religion.ts, economy.ts, trade-routes.ts |
| 29 | `engine/data/derived/ulepszenia-reguly.json` | edb8fb56 | terrain-improvements.json, terrain-improvements.ts |
| 30 | `engine/data/derived/unit-food.json` | edb8fb56;91dc998a | econ-params.json, units.json, econ-params.json |
| 31 | `engine/data/derived/unit-gold-costs.json` | edb8fb56 | production.ts, units.json |
| 32 | `engine/data/derived/unit-gold-states.json` | edb8fb56 | production.ts, units.json |
| 33 | `engine/data/derived/unit-stock-costs.json` | edb8fb56 | units.json |
| 34 | `engine/data/derived/wzrost-ludnosci-params.json` | edb8fb56 | building-resource-gate.ts, economy.ts, population-growth-v85.ts |
| 35 | `engine/src/data/civilizations.rs` | edb8fb56;91dc998a | civs.json, diplomacy-acceptance-points.json, diplomacy-acceptance-points.json |
| 36 | `engine/src/data/derived.rs` | edb8fb56;91dc998a | armyMerge.ts, building-resource-gate.ts, city-hex-clear.ts, civ-ai-data.ts, civ-bonuses.ts, civ-matrix-semantic.ts, economy.ts, manpower.ts, playerState.ts, population-growth-v85.ts, production.ts, units.json, war-allin-params.json, building-resource-gate.ts, city-hex-clear.ts |
| 37 | `engine/src/data/economy_society.rs` | edb8fb56;91dc998a | citizen-resource-upkeep.json, econ-params.json, citizen-resource-upkeep.json, econ-params.json |
| 38 | `engine/src/data/economy_society_part2.rs` | edb8fb56 | ai-params.json, ai.ts, ui-params.json |
| 39 | `engine/src/domain/building_costs.rs` | edb8fb56;91dc998a | building-resource-gate.ts, econ-params.json, production.ts, units.json, building-resource-gate.ts, econ-params.json |
| 40 | `engine/src/domain/city_growth.rs` | edb8fb56;91dc998a | barbarians.ts, building-resource-gate.ts, econ-params.json, economy.ts, population-growth-v85.ts, turn-economy.ts, wealth.ts, building-resource-gate.ts, econ-params.json, turn-economy.ts |
| 41 | `engine/src/domain/city_names.rs` | edb8fb56 | civs.json |
| 42 | `engine/src/domain/civ_matrix.rs` | edb8fb56 | civ-ai-data.ts, civ-matrix-semantic.ts, civs.json |
| 43 | `engine/src/domain/civ_names.rs` | edb8fb56 | civs.json |
| 44 | `engine/src/domain/combat.rs` | edb8fb56 | combat.ts |
| 45 | `engine/src/domain/diplomacy_tick_war_brake.rs` | 91dc998a | diplomacy-tick-war-brake.ts |
| 46 | `engine/src/domain/economy_city_params.rs` | 91dc998a | econ-params.json |
| 47 | `engine/src/domain/generals.rs` | edb8fb56 | generalQuickFollow.ts, generals.ts |
| 48 | `engine/src/domain/improvement_build.rs` | edb8fb56 | terrain-improvements.json |
| 49 | `engine/src/domain/improvements.rs` | 91dc998a | terrain-improvements.json, terrain-improvements.ts |
| 50 | `engine/src/domain/mapgen/cluster_compute.rs` | edb8fb56 | civs.json, cluster-start.ts |
| 51 | `engine/src/domain/pathfinding.rs` | edb8fb56 | armyMerge.ts, embarkation.ts, planned-march.ts |
| 52 | `engine/src/domain/player.rs` | edb8fb56 | playerState.ts |
| 53 | `engine/src/domain/recruitment.rs` | edb8fb56 | armyMerge.ts, civs.json, manpower.ts, population-growth-v85.ts, production.ts, units.json |
| 54 | `engine/src/domain/resource_access.rs` | 91dc998a | building-resource-gate.ts |
| 55 | `engine/src/domain/resource_production.rs` | 91dc998a | citizen-resource-upkeep.ts |
| 56 | `engine/src/domain/start_position.rs` | edb8fb56 | cluster-start.ts, diplomacy-layers.ts, terrain-improvements.json, terrain-improvements.ts |
| 57 | `engine/src/domain/state.rs` | edb8fb56 | city-hex-clear.ts, culture-religion.ts, population-growth-v85.ts, wealth.ts |
| 58 | `engine/src/domain/terrain.rs` | edb8fb56 | city-hex-clear.ts, economy.ts, fort-territory.ts, terrain-improvements.json, turn-economy.ts |
| 59 | `engine/src/domain/territory.rs` | edb8fb56 | culture-religion.ts, terrain-improvements.json |
| 60 | `engine/src/domain/turn_economy.rs` | 91dc998a | econ-params.json |
| 61 | `engine/tests/data_civilizations.rs` | edb8fb56;91dc998a | civs.json, diplomacy-acceptance-points.json, diplomacy-acceptance-points.json |
| 62 | `engine/tests/data_compliance.rs` | edb8fb56 | ai-params.json, citizen-resource-upkeep.json, civs.json, diplomacy-acceptance-points.json, econ-params.json, tech.json, terrain-improvements.json, ui-params.json, units.json |
| 63 | `engine/tests/data_economy_society.rs` | edb8fb56 | ai-params.json, citizen-resource-upkeep.json, econ-params.json, ui-params.json |
| 64 | `engine/tests/data_units_combat.rs` | edb8fb56 | units.json |
| 65 | `engine/tests/derived_values.rs` | edb8fb56 | diplomacy-proposals.ts, units.json |
| 66 | `engine/tests/diplomacy.rs` | edb8fb56 | diplomacy-proposals.ts, units.json |
| 67 | `engine/tests/p6_1_vectors/web-vectors.json` | edb8fb56 | barbarians.ts, society-breakdown.ts |
| 68 | `engine/tests/p6_1b_playerstate.rs` | edb8fb56 | playerState.ts, tech.json |
| 69 | `engine/tests/p6_1b_vectors/web-vectors.json` | edb8fb56 | playerState.ts, units.json |
| 70 | `engine/tests/p6_1c_vectors/braz.json` | edb8fb56 | terrain-improvements.ts |
| 71 | `engine/tests/p6_1c_vectors/cluster-start.json` | edb8fb56 | cluster-start.ts, diplomacy-layers.ts |
| 72 | `engine/tests/p6_1d_city_names.rs` | edb8fb56 | civs.json |
| 73 | `engine/tests/p6_1d_civ_bonuses.rs` | edb8fb56 | civ-bonuses.ts, civs.json, units.json |
| 74 | `engine/tests/p6_1d_vectors/web-vectors.json` | edb8fb56 | civ-bonuses.ts, civs.json |
| 75 | `engine/tests/p6_1e_civ_matrix.rs` | edb8fb56 | civ-ai-data.ts, civ-matrix-semantic.ts |
| 76 | `engine/tests/p6_1e_civ_names.rs` | edb8fb56 | civs.json |
| 77 | `engine/tests/p6_1e_js_compat.rs` | edb8fb56 | civ-matrix-semantic.ts |
| 78 | `engine/tests/p6_1e_vectors/web-vectors.json` | edb8fb56 | ai.ts, civ-ai-data.ts, civ-bonuses.ts, civ-matrix-semantic.ts, civs.json, cluster-start.ts, combat.ts, culture-religion.ts, diplomacy.ts, economy.ts, embarkation.ts, manpower.ts, order.ts, population-growth-v85.ts, production.ts, turn-economy.ts, wealth.ts |
| 79 | `engine/tests/p6_23_vectors/order.json` | edb8fb56 | order.ts |
| 80 | `engine/tests/p6_5a_display.rs` | edb8fb56 | armyMerge.ts |
| 81 | `engine/tests/p6_5a_ruch.rs` | edb8fb56 | armyMerge.ts |
| 82 | `engine/tests/p6_5a_stack.rs` | edb8fb56 | armyMerge.ts |
| 83 | `engine/tests/p6_5b_format.rs` | edb8fb56 | manpower.ts |
| 84 | `engine/tests/p6_5b_manpower.rs` | edb8fb56 | civs.json, manpower.ts |
| 85 | `engine/tests/p6_6a_hexclear.rs` | edb8fb56 | city-hex-clear.ts, economy.ts, turn-economy.ts |
| 86 | `engine/tests/p6_6a_visibility.rs` | edb8fb56 | units.json |
| 87 | `engine/tests/p6_7a_growth.rs` | edb8fb56 | econ-params.json, economy.ts, population-growth-v85.ts |
| 88 | `engine/tests/p6_7a_post_central.rs` | edb8fb56 | manpower.ts, population-growth-v85.ts |
| 89 | `engine/tests/p6_7a_vectors/common.rs` | edb8fb56 | econ-params.json |
| 90 | `engine/tests/p6_7b_cost.rs` | edb8fb56 | units.json |
| 91 | `engine/tests/p6_7b_gate.rs` | edb8fb56 | building-resource-gate.ts |
| 92 | `engine/tests/p6_7b_spichlerz.rs` | edb8fb56 | building-resource-gate.ts |
| 93 | `engine/tests/p6_8d_citizen_upkeep.rs` | edb8fb56;91dc998a | citizen-resource-upkeep.json, citizen-resource-upkeep.ts, citizen-resource-upkeep.json, citizen-resource-upkeep.ts |
| 94 | `engine/tests/p6_8d_vectors/citizen_upkeep.json` | 91dc998a | citizen-resource-upkeep.ts |
| 95 | `engine/tests/p6_8e_upkeep_p2.rs` | 91dc998a | econ-params.json |
| 96 | `engine/tests/p6_m10_vectors/web-vectors.json` | edb8fb56 | civs.json |
| 97 | `engine/tests/p6_repin_b3_route.rs` | 91dc998a | turn-economy.ts |
| 98 | `engine/tests/p6_repin_b3_vectors/route_cash.json` | 91dc998a | turn-economy.ts |
| 99 | `engine/tests/p6_repin_b3_vectors/route_cash_mod.json` | 91dc998a | turn-economy.ts |
| 100 | `engine/tests/p6_repin_b3_vectors/wealth_owner.json` | 91dc998a | turn-economy.ts |
| 101 | `engine/tests/p6_repin_b3_vectors/wealth_owner_mod.json` | 91dc998a | turn-economy.ts |
| 102 | `engine/tests/p6_repin_b3_wealth.rs` | 91dc998a | turn-economy.ts |
| 103 | `engine/tests/p6_repin_c_construction.rs` | 91dc998a | terrain-improvements.ts |
| 104 | `engine/tests/p6_repin_wojna_c_vectors/ai-move-range.json` | 91dc998a | diplomacy-tick-war-brake.ts |
| 105 | `engine/tests/p6_repin_wojna_c_vectors/diplomacy-tick-war-brake.json` | 91dc998a | diplomacy-tick-war-brake.ts |
| 106 | `engine/tests/p6_repin_wojna_c_war_brake.rs` | 91dc998a | diplomacy-tick-war-brake.ts |
| 107 | `engine/tests/recruitment.rs` | edb8fb56 | units.json |
| 108 | `engine/tests/terrain_movement_fix.rs` | edb8fb56 | trade-routes.ts |
| 109 | `renderer/src/battle/units.rs` | edb8fb56 | units.json |
| 110 | `renderer/src/cities/overlay/okolica.rs` | edb8fb56 | terrain-improvements.ts |
| 111 | `renderer/src/core/bronze.rs` | edb8fb56 | civs.json |
| 112 | `renderer/src/models/misc/mod.rs` | edb8fb56 | order.ts |
| 113 | `renderer/src/models/misc/territory.rs` | edb8fb56 | order.ts |
| 114 | `renderer/src/raster/atlas/keys.rs` | edb8fb56 | civs.json |
| 115 | `renderer/tests/battle3d_units.rs` | edb8fb56 | units.json |
| 116 | `renderer/tests/fixtures/battle3d/README.md` | edb8fb56 | units.json |
| 117 | `renderer/tests/fixtures/battle3d/gen_dynamics.ts` | edb8fb56 | units.json |
| 118 | `renderer/tests/fixtures/battle3d/gen_picking.ts` | edb8fb56 | units.json |
| 119 | `renderer/tests/fixtures/battle3d/gen_units.ts` | edb8fb56 | units.json |
| 120 | `renderer/tests/fixtures/cityoverlay/README.md` | edb8fb56 | terrain-improvements.ts |
| 121 | `renderer/tests/fixtures/misc/README.md` | edb8fb56 | order.ts |
| 122 | `renderer/tests/fixtures/misc/gen.ts` | edb8fb56 | order.ts |
| 123 | `renderer/tests/fixtures/pick/README.md` | edb8fb56 | terrain-improvements.ts |
| 124 | `renderer/tests/fixtures/pick/gen.ts` | edb8fb56 | terrain-improvements.ts |
| 125 | `renderer/tests/fixtures/terrain/README.md` | edb8fb56 | terrain-improvements.ts |
| 126 | `renderer/tests/fixtures/terrain/gen.ts` | edb8fb56 | terrain-improvements.ts |
| 127 | `renderer/tests/fixtures/text/gen.mjs` | edb8fb56 | units.json |
| 128 | `renderer/tests/fixtures/unit_core/README.md` | edb8fb56 | units.json |
| 129 | `renderer/tests/fixtures/unit_core/gen.ts` | edb8fb56 | units.json |
| 130 | `renderer/tests/fixtures/units_braz/README.md` | edb8fb56 | units.json |
| 131 | `renderer/tests/fixtures/units_braz/gen.ts` | edb8fb56 | units.json |
| 132 | `renderer/tests/fixtures/units_kamien/README.md` | edb8fb56 | units.json |
| 133 | `renderer/tests/fixtures/units_kamien/gen.ts` | edb8fb56 | units.json |
| 134 | `renderer/tests/fixtures/units_zelazo/README.md` | edb8fb56 | units.json |
| 135 | `renderer/tests/fixtures/units_zelazo/gen.ts` | edb8fb56 | units.json |
| 136 | `renderer/tests/repin3d_fixtures/README.md` | edb8fb56 | units.json |
| 137 | `renderer/tests/units_braz_web_parity.rs` | edb8fb56 | units.json |
| 138 | `renderer/tests/units_kamien_web_parity.rs` | edb8fb56 | units.json |
| 139 | `renderer/tests/units_zelazo_web_parity.rs` | edb8fb56 | units.json |

**Poprawki ścieżek z r1 (§5A):** `rust-port/engine/data/derived/ai-params.json` i `…/derived/war-rules-params.json` **nie istnieją** w `c86c686bb`; realne: `rust-port/engine/data/ai-params.json` (blob `372442b7`) i `rust-port/engine/data/econ-params.json` (blob `a3e8f337`; r1 błędnie napisał „brak osobnego pliku econ-params”). `rust-port/engine/data/citizen-resource-upkeep.json` (blob `41c47da9`) istnieje i pojawia się w kandydatach.

**Plik `war-rules-params.json`:** zmieniony w zakresie B (2 hunki, 4/2 linii) i nieobecny w drzewie Rust `c86c686bb` (`git ls-tree -r --name-only c86c686bb | grep -i war-rules` → pusto). To luka portu, nie błąd pinu.

**citizen-resource-upkeep (Evaluator Z7):** Rust cytuje ten temat w 9 plikach: `engine/data/citizen-resource-upkeep.json`, `engine/src/data/economy_society.rs`, `engine/src/data/loader.rs`, `engine/src/domain/resource_production.rs`, `engine/tests/data_compliance.rs`, `engine/tests/data_economy_society.rs`, `engine/tests/p6_8d_citizen_upkeep.rs`, `engine/tests/p6_8d_vectors/citizen_upkeep.json`, `engine/tests/p6_repin_ekonomia_e_citizen.rs` (`git grep -l -F citizen-resource-upkeep`). Web: `citizen-resource-upkeep.ts` ma 26 hunków (LOGIKA 16, PERF 10) w zakresie A i tyle samo w zakresie B (§2, §3); r1 błędnie napisał „brak cytowań”.

## 6. Relacja pinów (ancestry i nadpisania)

- Zakres netto (`pin..4bbef081d`) nie zawiera hunków cofniętych przed `4bbef081d`. Hunki zmienione wielokrotnie w zakresie widać tylko w wersji netto; atrybucja per commit = NIE_ZMIERZONO.
- Dla wektorów z pinem `91dc998a` właściwy dryf = zakres B (+ DELTA-5 po `4bbef081d`); dla `edb8fb56` = zakres A (+ DELTA-5). Wektory z pinem `edb8fb56` cytujące pliki zmienione tylko w A1 (`edb8fb56..91dc998a`) są w kandydatach jako pin `edb8fb56`.
- Pin `23dd158e9` (nie jest przodkiem `4bbef081d`) — poza zakresem tej rundy (NIE_ZMIERZONO, DELTA-5 §8 poz. 6).

## 7. Tematy kolejki (zakres A i B)

Patrz §1 („Przypisanie do tematów kolejki”): 18/703 i 12/280 hunków ma temat z DELTA-5 §3; reszta nieprzypisana (NIE_ZMIERZONO). Wektory przypisane do tematów: tylko przez kolumnę „temat” plików Rust z §5, nie przez treść.

## 8. NIE_ZMIERZONO (luki z powodem)

1. **Ocena semantyczna hunków** (czy zmiana zmienia wynik wektora): nie wykonana; klasy to reguły treści, nie wykonanie reguł gry.
2. **Treść wektorów** i ich `meta.pin`: nie czytano JSON; kandydaci = dopasowanie po nazwie pliku.
3. **Przypisanie do tematów #2–#8 poza DELTA-5 §3:** patrz §1 (685 + 268 hunków).
4. **Moduły Rust:** nie czytano ciał funkcji; `cargo` i build zakazane.
5. **Web:** nie uruchamiano gry, testów ani `npm`; zero zmian w `gra/**`.
6. **Pin `23dd158e9`** i zakresy `dc8a3adc` poza powyższym.

## 9. Zgodność z dispatchem

- Kryterium „tabela hunków plik:linia z klasą”: §2, §3 (pełne listy linii) + pliki TSV.
- Kryterium „lista wektorów z pinem i powodem”: §5 (139 kandydatów; powód = pin + zmieniony plik web).
- Kryterium „sumy zgodne z numstat”: 0 rozbieżności per plik (zakres A: 78 plików; zakres B: 37).
- Zero zmian w `gra/**`, `rust-port/**` (poza tym dokumentem), `src-tauri/**`, `WERSJE.md`.

## 10. Odpowiedzi na zarzuty Evaluatora r1

| Zarzut | Decyzja | Dowód |
|---|---|---|
| 1. LEDGER.md „nie istnieje” | PRZYJĘTY | `git ls-tree origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 dyspozycje/rust-port/LEDGER.md` → blob `cdc911af`; baza `c86c686bb` i `4cfc0bad1` go NIE mają. Dopisek wykonany na blobie z gałęzi dispatchu (commit w §12) |
| 2. REPIN-DELTA-5.md „nie istnieje” | PRZYJĘTY | `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/rust-port/p6/REPIN-DELTA-5.md` (626 linii, §8 poz. 7 = ten temat). r1 błędnie uznał brak |
| 3. Brak tabeli hunków plik:linia | PRZYJĘTY | §2, §3, pliki TSV z 703 i 280 wierszami |
| 4. Klasy tylko z rozszerzenia | PRZYJĘTY częściowo | klasy z treści (§1); semantyka NIE_ZMIERZONO (§8.1) |
| 5. „648 wystąpień” | PRZYJĘTY | 648 plików, 916 wystąpień (§5) |
| 6. Błędne ścieżki 5A | PRZYJĘTY | §5 poprawki; `derived/ai-params.json` nieistnieje |
| 7. citizen-resource-upkeep „brak cytowań” | PRZYJĘTY | 9 plików Rust (§5) |
| 8. Zmyślone tematy kolejki | PRZYJĘTY | usunięte; tylko słownik DELTA-5 §3 (§1, §7) |
| 9. Brak ancestry i rozdziału pinów | PRZYJĘTY częściowo | ancestry zmierzone (§0, §6); rozdział per commit = NIE_ZMIERZONO |

## 11. Odtwarzalność

- `git diff -U0 edb8fb56 4bbef081d -- gra/src/game gra/data` (=zakres A); `git diff -U0 91dc998a 4bbef081d -- gra/src/game gra/data` (=zakres B).
- `git diff --numstat` dla obu zakresów; `git diff --shortstat` (78/7572/1725; 37/3370/371).
- `git grep -l -E "edb8fb56|91dc998a" c86c686bb -- rust-port` (648); `git grep -c` (916).
- `git merge-base --is-ancestor 91dc998a dc8a3adc`; `… dc8a3adc 4bbef081d`; `… 4bbef081d origin/main`.

## 12. Commit

Commit tego rundy: SHA w raporcie `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5C-Q1/02-obrona-r2.md` (SHA nie może być w samym dokumencie).
