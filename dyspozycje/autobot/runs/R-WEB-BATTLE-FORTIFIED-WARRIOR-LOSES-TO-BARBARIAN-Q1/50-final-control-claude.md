STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1
GOAL: ustalić na DANYCH, dlaczego Wojownik barbarzyńców wygrywa z Wojownikiem gracza w KAŻDYM kierunku ataku (zgłoszenie właściciela, potwierdzona regresja: "wcześniej nie było miejsca z czymś takim"), i naprawić defekt albo, gdy to zamierzona reguła, zwrócić DECISION_REQUIRED z pomiarem ścieżki, którą gracz faktycznie widzi.
ZMIANY/COMMIT: kandydat c643b861a0b21549adbde4febd21e3b4562eb53c jest potomkiem bazy 52a13c39d (git merge-base --is-ancestor: OK). Diff vs baza = 2 pliki, +158 linii: wyłącznie raporty 10-operator-claude.md i 30-obrona-claude.md. Zero zmian w gra/. Allowlista zachowana. integration_sha: brak do integracji (FAIL, brak kodu). Ten raport: commit na gałęzi worktree FC (nie pushowany).
TESTY: tsc --noEmit i 5 bramek referencyjnych NIE_WYKONANO przez FC: diff kandydata vs baza nie dotyka gra/, więc wyniki są z definicji identyczne jak na bazie; worktree nie ma gra/node_modules (wolne 7,7 GB, npm ci pominięty jako bezcelowy dla diffu tylko-dokumentacyjnego). Liczb z Evaluatora nie cytuję jako własnych. Sprawdzone samodzielnie (czytanie kodu): battleScene.ts:9060-9160 (_singleBlow) — w kodzie liczb walki sceny nie ma gałęzi barbarzyńcy (atkIsBarbarian/_attackerIsBarbarian tylko sygnet/podsumowanie, linie 2803, 3053, 10629); fort wpięty wyłącznie w Obronę (9107-9111); w 'pewne' (9138-9142) hitPct=100, roll=0, czyli obrona działa tylko przez pancerz; szarza = firstBlow pary (9072-9077). barbarians.ts: unitTypeId 'Wojownik' bez mnożników. hit-mode.ts:21 domyślnie 'losowe', nowe gry dostają 'pewne' (wg raportów: newGameFlow.ts:272, ae600d5ed).
BLOKADY: scena i ścieżka "Pomiń" (computeInstantResult) NIE zmierzone po dwóch rundach; przypisanie atakującego/obrońcy w bitwie z mapy NIE zmierzone; księga modyfikatorów realnej ścieżki (civ, weteran, epoka, teren, morale, trudność) NIE zmierzona.

## Werdykt per zarzut (Evaluator, 7)

1. Brak bisectu: ODDAL. Obrona wykonała bisect resolveCombat na 68 commitach (1461c0dfa..eb68e66d8): 'losowe' bez zmian, jedyny skok = ae600d5ed (tryb 'pewne': 200/0/0). Zastrzeżenie: bisect nie obejmuje sceny (patrz 3).
2. Wniosek 'pewne' nie tłumaczy "barbarzyńca wygrywa niezależnie od kierunku": NAPRAW. Dla identycznych jednostek wygrywa atakujący, więc przy ataku gracza powinien wygrywać gracz. Zgłoszenie właściciela pozostaje NIEWYJAŚNIONE, a raport kończy się DECISION_REQUIRED mimo że sam stwierdza, że kierunek nie jest odtworzony. DECISION_REQUIRED jest dopuszczalne dopiero, gdy objaw wynika z zamierzonych reguł; tu objaw (dwukierunkowość) nie wynika z żadnej zmierzonej reguły.
3. Zła ścieżka pomiaru (resolveCombat zamiast sceny/Pomiń): NAPRAW. To jest sedno. Gracz widzi scenę (_singleBlow) i "Pomiń"; operator i obrona dwukrotnie zostawili je NIE_ZMIERZONO, choć dispatch (DODATEK 2) wprost wskazywał funkcje do bezpośredniego wywołania (_singleBlow / computeInstantResult, wzorzec gra/tools/manual-battle-rng-determinism-test.cjs z FALI 704). Brak tego pomiaru uniemożliwia rozstrzygnięcie H3/H4/H6 w ścieżce rzeczywistej.
4. Błędne "pierwsze uderzenie" (szarza R1): ODDAL. Obrona przyjęła korektę i podparła ją sondą (bez szarzy 'pewne' = 0/0/200). Opcja D z r1 jest wycofana. Uwaga: w scenie kolejność istnieje (atak, potem kontratak), więc H5 dla sceny pozostaje do zmierzenia (część zarzutu 3).
5. Brak macierzy 3x3 i księgi modyfikatorów: NAPRAW (częściowo). Obrona słusznie zauważa, że w resolveCombat owner nie jest wejściem (tautologia), ale to właśnie dowodzi, że macierz trzeba zmierzyć na ścieżce, gdzie owner wchodzi (scena: attackerCivBonusy/defenderCivBonusy, battleUnitDifficultyCombatMult, runtimeToBattleUnit w main.ts: pancerzBonusFrac, parametryBonusFrac, weteran). Dyspozycja DODATEK 1 wymagała tego jako METODY OBOWIĄZKOWEJ.
6. Rozbieżność AUTO vs ręczne (H3): DO DECYZJI CZŁOWIEKA (realna decyzja produktowa: czy AUTO ma modelować fazę strzelecką; Wojownik vs Łucznik 100% vs 0% w 'pewne'). Do rejestru jako obserwacja, nie blokuje samodzielnie.
7. Drobne (pomiar poza repo, bramki NIE_WYKONANO): ODDAL jako przyjęte; powtarzalność wymaga wprowadzenia sondy do repo (gra/tools/fortified-warrior-vs-barb-sim.cjs, objęte allowlistą DODATKU 1). Wchodzi w naprawę zarzutu 3.

Liczba zarzutów NAPRAW: 3 (2, 3, 5) => FAIL.

## Ocena merytoryczna (co jest już ustalone, a co nie)
- USTALONE (zmierzone przez Obronę, spójne z czytaniem kodu przez FC): w resolveCombat nie ma ukrytego bonusu barbarzyńcy; Wojownik gracza i barbarzyńcy mają te same statystyki (4/4/22/2); jedyna zmiana wyniku w oknie regresji to wprowadzenie trybu 'pewne' (ae600d5ed), w którym atakujący wygrywa 100% (obrona nie wpływa na trafienie, fort bez skutku), a szarza R1 jest jedynym źródłem asymetrii. To zgadza się z "wcześniej nie było" i jest najlepszą hipotezą, ale dotyczy kierunku "atakujący wygrywa", nie "barbarzyńca wygrywa".
- NIEUSTALONE: czemu gracz-atakujący miałby przegrywać z barbarzyńcą. Kandydaci do pomiaru na scenie: kto jest 'atk' w BattleScene przy ataku gracza na obóz/jednostkę barbarzyńców; czy kontratak/okno szarży po stronie barbarzyńcy wychodzi pierwsze (c3ebc5440 sufit tempa do wzwarcia); przewaga liczebna/formacja barbarzyńców; fortyfikacja barbarzyńców w obozie (flaga fortifiedInField po stronie AI); ścieżka "Pomiń".

## NASTĘPNY KROK (runda 3/5, ten sam ID)
Operator r3 z konkretnym zadaniem pomiarowym, bez zmiany balansu:
 (a) sonda sceny: wywołać _singleBlow / computeInstantResult bezpośrednio (wzorzec manual-battle-rng-determinism-test.cjs), Wojownik vs Wojownik, oba kierunki, 'losowe' i 'pewne', fort on/off, civ gracza vs civ AI vs barbarzyńca, >=200 powtórzeń na komórkę; zapisać jako gra/tools/fortified-warrior-vs-barb-sim.cjs;
 (b) prześledzić w main.ts, kto otrzymuje rolę atakującego w bitwie, gdy gracz atakuje barbarzyńcę (i odwrotnie), oraz skąd pochodzą mnożniki wejściowe sceny (attackerCivBonusy, DifficultyCombatMult, weteran) dla owner barbarzyńcy;
 (c) księga modyfikatorów dla 4 pierwszych komórek z wartości zmierzonych, nie wnioskowanych;
 (d) dopiero z wynikiem: albo najmniejsza poprawka + test czerwony na bazie + mutacja, albo DECISION_REQUIRED z liczbami sceny.
Model: dwie rundy Haiku bez rozstrzygnięcia (r1 DECISION_REQUIRED, r2 Obrona DECISION_REQUIRED, bez kodu) spełniają regułę CLAUDE.md zasada 2 dla Sonneta na Operatorze r3, o ile orkiestrator zapisze to uzasadnienie w dispatchu (sonda sceny wymaga zrozumienia BattleScene bez DOM); decyzja po stronie orkiestratora.

## UWAGI-DLA-ORKIESTRATORA
- Nie pytać właściciela o opcje A-E, zanim nie ma pomiaru sceny: opcje r1/r2 dotyczą resolveCombat i nie adresują zgłoszenia "w obu kierunkach".
- Niezależnie od wyniku r3 warto rozważyć osobne ABC: czy w trybie 'pewne' (domyślnym dla nowych gier) deterministyczny wygrany atakujący przy równych jednostkach jest pożądany (opcje A/B/C z raportu Obrony). To decyzja produktowa właściciela.
- Obserwacja: dispatch 00-dispatch.md tematu nie istnieje w origin/main (git show zwraca brak ścieżki); istnieje tylko DODATEK w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0. Dispatch ma być zapisany i wypchnięty przed Workflow (CLAUDE.md zasada 6).

RUNDY: 3/5 do wykonania (FC po rundzie 2; FAIL wraca do Operatora tego samego ID)
DEPLOY/PUSH: NIE WYKONANO
