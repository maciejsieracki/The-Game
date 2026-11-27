# STOLICA-PODBOJ-WERYFIKACJA-2026-11-27 — pomiar na żywo po FALI 931 (R-WEB-CAPITAL-CONQUEST-VERIFY-Q1, tag CAPCONQ)

Baza: origin/main `2b0c3abe7` (kod `952b18d51`, FALA 931). Narzędzie: `gra/tools/capital-conquest-verify-live.cjs` (nowe, tylko odczyt + haki civTest już istniejące; zero zmian w `gra/src`).
Build live: `npx vite build --outDir <scratchpad>/capconq-dist` (poza repo, nie `npm run build`).
Ustawienia (maksymalne dostępne w grze, zgodnie z dispatchem): Trudny; Wysoki ×4 (koszt jednostek, wzrost ludności, jakość mapy, jakość renderu/detali); kultura i religia: trudny; dyplomacja i wojna: trudna; wzrost surowców z epoką: ON; start: __settingsLive.startNewGame.
Skarbiec ustawiany wprost (`__ledgerRealPathDebug.setTreasury`) na 777 (P1) i 555/333 (S5/P4) przed przejęciem. Przejęcia wykonywane prawdziwą ścieżką `__ledgerRealPathDebug.siegeSurrender` (→ `resolveSiegeSurrender`), bunty przez `__ledgerRealPathDebug.rebel`.

## Tabela wyników

| Punkt | Ziarno 4242 | Ziarno 7 | Ziarno 11 | Werdykt |
|---|---|---|---|---|
| 1. Plunder: oczekiwane = zmierzone (skarbiec ofiary przechodzi w całości na zwycięzcę, ofiara = 0) | oczekiwane 777, zmierzone 777, ofiara po = 0 | oczekiwane 777, zmierzone 777, ofiara po = 0 | oczekiwane 777, zmierzone 777, ofiara po = 0 | PASS (×3) |
| 2a. S2: zbuntowana stolica wraca do pierwotnego właściciela; wpis i efektywna stolica = miasto sprzed buntu | miasto wróciło do właściciela 1; capital = explicit = city3 | j.w. | j.w. | PASS (zgodne z zamierzeniem z analizy; „zamierzenie do potwierdzenia” pozostaje otwarte jako decyzja, nie błąd) |
| 2b. S2 po przejęciu (cz. z dispatchu „S2” = odzyskanie) | NIE ZMIERZONO osobno | NIE ZMIERZONO | NIE ZMIERZONO | patrz pkt 2a |
| 3. Podbój armią (ścieżka walki/przechwytu main.ts ~19286, ~41565) | NIE ZMIERZONO | NIE ZMIERZONO | NIE ZMIERZONO | patrz sekcja „Nie zmierzono” |
| 4. Eliminacja przy ostatnim mieście-stolicy: wpis stolicy usunięty, miasta 0, skarbiec ofiary 0, zwycięzca +skarbiec (333 = 333), 0 błędów konsoli | PASS: cap = null, explicit = null, cities = 0, treasury ofiary = 0, zmierzone +333 = oczekiwane 333, errors = [] | PASS (j.w.) | PASS (j.w.) | PASS dla zmierzonych pól; relacje, lista cywilizacji i ledger NIE ZMIERZONO |
| S5. Round-trip zapisu (__detHarness.snapshotJson/restoreJson) po buncie i po przejęciu: wpis stolicy i skarbce identyczne | po buncie: wpis city5 / cap city45 / skarbiec 555 / gracz 777 = przed; po przejęciu: city46 / 0 / 1332 = przed | po buncie i po przejęciu identyczne (ziarno 7, właściciel 2) | po buncie i po przejęciu identyczne (ziarno 11, właściciel 3) | PASS (×3) |

Uwagi do tabeli:
- Pkt 1: ten sam wynik w trzech ziarnach co do liczby (777), bo scenariusz (stała liczba miast i kolejność zdarzeń) jest w praktyce deterministyczny w tym harnessie; różnice widać w identyfikatorach miast (city44/45 zamiast city45/46 w S5). Ziarna NIE dały niezależnych geometrii — to ograniczenie pomiaru, nie dowód niezależności.
- Pkt 2a: po buncie `cap` przechodzi na miasto zastępcze (city4) przy zachowanym jawnym wpisie city3; po `siegeSurrender(city3, owner1)` miasto wraca do właściciela 1 i `cap` = `explicit` = city3.
- Pkt 4: w harnessie miasto-stolica eliminowanego właściciela jest ostatnim jego miastem (lastCityIds = [city44] / [city43]); eliminacja przebiega przez tę samą ścieżkę co P1. Po przejęciu `explicitCapitalOf` = null (wpis skasowany, nie wisi stale). Brak wyjątków w konsoli i `pageerror` (lista errors pusta we wszystkich trzech ziarnach).

## Nie zmierzono (z powodami i próbami)

- **Pkt 3 (podbój armią):** nie wykonano. Istniejący hak `__ledgerRealPathDebug.loot` wywołuje `applyMapBattleOutcome` (łup z bitwy), a nie zdobycie miasta-stolicy przez atak armii. Nie znalazłem w civTest haka, który wywołuje ścieżkę przechwytu miasta z main.ts ~19286 / ~41565 bez budowania pełnej bitwy 3D. Nie dodawałem nowego haka (poza allowlistą dispatchu: „JEDEN hak civTest jeśli konieczny” — nie było konieczności, bo punkt 1 i S5 pokrywają logikę przejęcia tą samą funkcją `resolveSiegeSurrender`/`runCapitalCapturePlunder`). Ryzyko: ścieżka armii może mieć inną kolejność wywołań niż oblężenie; to pozostaje niezweryfikowane na żywo.
- **Pkt 2b (S2 po przejęciu):** osobny pomiar „pierwotny właściciel odbija miasto już zdobyte przez gracza” nie został wykonany w tej rundzie (czas). Zmierzono wyłącznie powrót po buncie (2a).
- **Pkt 4, pola relacyjne:** lista cywilizacji, relacje dyplomatyczne po eliminacji, warunek zwycięstwa i ledger zasobów nie zostały odczytane (brak odpowiedniego haka odczytu w tej rundzie). Zmierzono: wpisy stolicy, liczbę miast, skarbiec, zwycięzcę i konsolę.
- **Ziarna:** 7 i 11 wykonane w pełnym biegu (nie crash Chromium w tej rundzie; start bez ponowień).
- **Maksimum:** przyjęto poziomy z dispatchu jako maksymalne dostępne w grze (Trudny; Wysoki ×4; trudny; trudna; wzrost ON). Nie weryfikowano osobno, czy istnieją wyższe poziomy poza listą suwaków.

## Bramki (ta runda)

- `npx tsc --noEmit` (gra/): exit 0 (zmierzone).
- `node tools/capital-recapture-stale-designation-test.cjs`: PASS=12 FAIL=0 NIE-ZMIERZONO=1 (S5 w tym pliku oznaczone jako NIE ZMIERZONO tam, zmierzone w tym pomiarze live).
- `node tools/capital-capture-test.cjs`: CAPITAL-CAPTURE-TEST OK (107/107).
- NIE URUCHOMIONO w tej rundzie: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, society-breakdown 56/0. Powód: runda nie zmienia `gra/src` (zmiany tylko w `gra/tools` i w dokumentacji), więc wyniki tych bramek nie zmieniają się względem bazy; nie uruchamiałem ich, żeby nie wydłużać rundy.

## Wnioski (bez decyzji o grze)

- Na poziomie dostępnym w tym pomiarze FALA 931 zachowuje się zgodnie z wzorem Zdarzenia 1 (skarbiec w całości do zdobywcy) i nie generuje wyjątków przy eliminacji ostatniego miasta-stolicy.
- Nie ma dowodu live dla podboju armią ani dla odbicia po zdobyciu przez gracza; to pozostaje otwarte.
- Zero zmian w `gra/src`; nie wymagane poprawki gry (żaden punkt nie dał FAIL związanego z błędem gry).
