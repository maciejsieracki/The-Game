# 60-dowody-tabela — R-WEB-DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1 (r3)
Baza kodu: 61c7b64cb + c306578e0 (praca poprzednika, przejrzana i uruchomiona) + commit r3. Numery wierszy: gra/src/main.ts.

## A. Sciezki, ktorymi wojna gracz<->AI konczy sie pokojem (stan PO naprawie)
| # | Sciezka | Warunek | Miasta przechodza? | Okno / "Wazne" | Dowod |
|---|---|---|---|---|---|
| 1 | Pokoj wymuszony 100% (`runWarWearinessTick` war-weariness.ts ~264-290; `tickAiAiWarWeariness` main.ts 38930) | zmeczenie 100% (wiek wojny 40), para gracz<->glowne AI | wg forcedPlan (moze byc "bez wymiany miast") | TAK: showForcedPeaceModal + wpis "Pokoj wymuszony" w warEventLog | live S2: pokoj + okno "Rozumiem" + wpis |
| 2 | `offer_accepted` w ticku zmeczenia (war-weariness.ts ~342-350) | cena pokryta lub 0 (bramka relacji) przy zmeczeniu <100% | wg ceny | BRAK (cichy) - dla pary z graczem WYLACZONE przez `isPlayerPair` (war-weariness.ts, main.ts ~38963) | live S1: wojna 12 tur, szczyt 0.30, status "wojna" bez klikniecia; mutant M4 (bez isPlayerPair) -> pokoj po cichu (evidence/live-table-mutant-M4-no-isPlayerPair.json) |
| 3 | `tickAiAiPeaceRequests` main.ts 38852 / `aiAiForcedPeacePairEligible` 38773 | `isForcedPeaceEligiblePair`: aIsHuman/bIsHuman -> para z czlowiekiem NIEkwalifikowana | n/d | n/d | odczyt kodu; NIE ZMIERZONO osobno na zywo |
| 4 | Koniec rozejmu `tickTruceExpiries` main.ts 13006 -> truceEndPorts.finalizePeace | AI przyjela pokoj staly po rozejmie | nie | po naprawie wpis "Rozejm przeszedl w pokoj" w "Wazne" (main.ts ~12915, Z7); okna brak (gracz sam zainicjowal rozejm) | odczyt kodu; NIE ZMIERZONO na zywo (brak hooka konca rozejmu ze zgoda AI) |
| 5 | AI rozstrzyga wpis gracza: `resolvePendingNegotiationsForOwner` 21662 -> `applyProposalOutcome` 25943 -> `finalizePeaceTreatyBetween` 12710 | gracz sam zlozyl propozycje pokoju | wg oferty | odpowiedz AI w UI (zwykly przeplyw) | live S5 (rozstrzygniecie bez TypeError) |
| 6 | Gracz przyjmuje oferte AI: `handleNegotiationAccept` 21708 / pakiet 21865 | klik gracza | wg oferty | zwykle UI | kod; wymaga klikniecia |
| 7 | AI->gracz wstawienie wpisu: `enqueueNegotiationFromAiCmdImpl` 21138 | AI wystawia oferte | n/d - tylko wstawia wpis na stol | n/d | hipoteza "pokoj przy powstaniu oferty" NIE potwierdzona w kodzie |
| 8 | `tickAiAiPeaceRequests` main.ts 38852 -> `runAiAiPeaceTick` z `aiAiForcedPeacePairEligible` 38773 -> `isForcedPeaceEligiblePair` diplomacy-ai-forced-peace.ts:121-122 | para AI<->AI z żądaniem pokoju; `if (p.aIsHuman \|\| p.bIsHuman) return false` | n/d | n/d | wyklucza pary z graczem (kod, r4). NIE ZMIERZONO na żywo osobno |
| 9 | Akceptacja oferty pokoju ze stołu przez AI: `resolvePendingNegotiationsForOwner` main.ts ~21662 -> `applyProposalOutcome` 25953 -> gałąź `pokoj` main.ts 26145 -> `finalizePeaceTreatyBetween` | gracz złożył propozycję, AI rozstrzyga (odpowiedź przy kolejnej turze) | TAK (wg oferty) | r4: wpis "Pokój zawarty: <kto>" w "Ważne" (`logPeaceVazne`, main.ts 25942/26149, dedup tura+para) + toast 4 s; wcześniej tylko toast | NIE ZMIERZONO na żywo (brak hooka akceptacji AI); tsc 0 |
| 10 | Rozejm ze stołu zaakceptowany przez AI: gałąź `rozejm` main.ts ~26152-26160 | gracz złożył rozejm, AI zaakceptowała | TAK (wg oferty) | r4: wpis "Rozejm zawarty: <kto>" w "Ważne" (`logPeaceVazne`) + toast | NIE ZMIERZONO na żywo |
| 11 | Koniec rozejmu -> pokój stały: `finalizePeace` wrapper w buildTruce deps (main.ts ~12920) | rozejm wygasł, AI przyjęła pokój | wg zasad rozejmu | r4: wpis "Rozejm przeszedł w pokój" w "Ważne" (main.ts ~12917, Z7) | odczyt kodu; NIE ZMIERZONO na żywo |
| L1 | Lista audiencji `buildPendingNegotiationRows` main.ts 22111 (filtr `negotiationStillValid`) | to nie zmienia stanu pokoju; ukrywa martwe oferty | n/d | r4: filtr dostaje `isAtPeace` (main.ts 22123) - wcześniej pole nieustawione = reguła nie działała w liście | tsc 0 (pole wymagane); NIE ZMIERZONO na żywo |
| L2 | Akceptacja AI/gracza `handleNegotiationAccept` main.ts ~21715 (`isAtPeace` z `isPairAtStablePeace`) | klik gracza | n/d | n/d | gałąź bez osobnego testu (luka, odnotowana w 30-obrona) |

Wniosek: przyczyna "pokoj bez miast" = sciezka #2 (tick zmeczenia obejmowal pary z graczem po 10. turze wojny, cena 0, finalize bez okna). Dowod zywy: mutant M4 zawiera pokoj, wersja naprawiona nie. NIE UDOWODNIONO, ze to byla jedyna sciezka w grze wlasciciela (zrzut 1e: Zaufanie 20 = pokoj przeszedl przez finalizePeaceTreatyBetween - zgodne z #2).

## B. Tabela tur (live; Chromium+xvfb; evidence/live-table-r3-final.json)
| Scen. | Tura | Wiek wojny / zmeczenie | Stan | Oferty zalezne od wojny | Komunikaty |
|---|---|---|---|---|---|
| S1 | 2 | 12 tur / szczyt 0.30 | wojna (bez klikania) | 0 | brak |
| S2 | 2 | wiek 40 (100%) | pokoj | - | "Pokoj wymuszony: Grecy" + okno modalne |
| S3 | - | - | pokoj | 2 -> 0 po `pruneInvalidNegotiations` | podpowiedz "propozycja wygasla" |
| S4 | - | - | pokoj | 3 (2x pokoj + rozejm z miastem AI) -> 0 po `finalizePeaceTreatyBetween` | - |
| S5 | 2 | - | pokoj (rozejm do t.7) | 2 -> 0, zero pageerror | - |

## C. Mutacje (test behawioralny w Chromium; zrodlo przywrocone z kopii)
| Mutant | Zmiana | Wynik |
|---|---|---|
| M1 | usuniety `purgeWarDependentNegotiations` z finalizePeaceTreatyBetween | CZERWONY: S4 (zostaja 3), S5 (2); PASS=10 FAIL=2 |
| M2 | usuniete `isAtPeace` z `buildNegotiationWorldCtx` | CZERWONY: S3 (2 wpisy), S4; PASS=10 FAIL=2 |
| M3 | przywrocona indeksowa petla odwrotna w `resolvePendingNegotiationsForOwner` (Z5) | CZERWONY: TypeError "reading 'awaitingOwnerId'" |
| M4 | brak `isPlayerPair` w ticku (test statyczny T3 + live) | CZERWONY: pokoj po cichu przy 28% |
Luka: usuniecie `isAtPeace` tylko z main.ts ~21718 (sciezka akceptacji `handleNegotiationAccept`) nie jest wykrywane - brak osobnego testu.

## D. Diagnoza 2b/1e (tylko opis; naprawa poza zakresem r3)
- "Przyjmij" wyszarzone przy prezencie AI i bilansie +98 PW: tekst "Nie mozna przyjac - warunki niespelnione" pochodzi z `verdictHtml` gra/src/ui/diplomacyAcceptanceBalance.ts ~529 (galaz isIncomingBasketTradePanel && canAccept===false && net>=0; tekst ogolny). `canAccept = (blockReason == null)` ~408; blockReason ustawiany m.in. ~404 ("Bilans PW ujemny", pomijane dla uiActionId '10'=pokoj) i wczesniejszymi warunkami tej funkcji. KTORY blockReason zadzialal w zrzucie 1e: NIE ZMIERZONO.
- Po naprawie wpis "Dar/prezent" z miastami powstaly jako actionId pokoj/rozejm jest czyszczony po pokoju (S4). Dar o innym actionId NIE jest czyszczony - NIE ZMIERZONO, czy zrzut 1d byl takiego typu.
- Pusta "Umowa wymiany surowcow" i nawarstwianie ofert AI -> DIPLO-5; blokada 10 tur / kierunek platnosci -> DIPLO-4.
