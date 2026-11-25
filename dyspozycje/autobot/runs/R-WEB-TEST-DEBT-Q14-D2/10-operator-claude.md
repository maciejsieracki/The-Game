# R-WEB-TEST-DEBT-Q14-D2 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D2 (kat. D, 2. połowa: 25 ostatnich wierszy kategorii D z 43-stan-156-r5.md)
GOAL: przy każdym teście z połowy ustalić przyczynę, sklasyfikować (STARY-PIN / HARNESS / BŁĄD-GRY / OBCIĄŻENIE / NIE-ZMIERZONO) i naprawić tam, gdzie to STARY-PIN lub HARNESS, bez osłabiania asercji.
BAZA: origin/main f96787fb70da4086f9b25487cc4b6c62a2127610 (worktree detached, `git checkout --detach`).

## Zakres połowy (25 wierszy kat. D, z tabeli 43-stan-156-r5.md, wiersze 41–65)
Pominięto climate-band-test.cjs (osobny temat), wiersze kat. B/E i wiersze 16–40 (połowa 1/2).

## Wynik surowy (solo, sekwencyjnie, `cd gra && node tools/<plik>`, exit code)

Stan: 24 z 25 CZERWONE na bazie, 1 ZIELONY (unit-stock-cost-test 58/0).

## Tabela

| test | przed (exit / wynik) | klasyfikacja (wstępna) | co zmieniono | po |
|---|---|---|---|---|
| drewno-gate-test | 1 / NIEUDANE 1/20 (Wojownik: kontrola Surowiec=Drewno ×10 dostępny przy braku empireResourceStock) | NIE-ZMIERZONO (kontrola fail-closed; możliwy BŁĄD-GRY: availableProduction dopuszcza jednostkę bez stocku) | nic | czerwony |
| dyplo-karta-duplikat-komunikat-test | 1 / 12 pass, 3 fail (A1 push karty, A3 kolejność, E1 liczba DIPLOMACY_MSG_PREFIX = 4 zamiast 3) | NIE-ZMIERZONO (E1: 4. wystąpienie w main.ts to martwy kod wg komentarza testu — wymaga decyzji, czy usunąć martwą gałąź, czy poprawić oczekiwaną liczbę) | nic | czerwony |
| dyplo-pakt-ekspansja-granica-test | 1 / 22/26 (D1–D4: Zaufanie 50→35 zamiast oczekiwanego ciągu −2/turę; tarcia_graniczne) | NIE-ZMIERZONO (możliwy STARY-PIN po zmianach dyplomacji FALA 847–892) | nic | czerwony |
| egypt-movement-precedence-test | 1 / AssertionError: shallow-sea bonus 0,813 ≠ 0,676 | NIE-ZMIERZONO (możliwy STARY-PIN: wartość bonusu mórz płytkich) | nic | czerwony |
| eliminacja-lup-kwoty-test | 1 / 34 pass, 4 fail (4e–4h: raport eliminacji zwraca null dla złota/nauki/technologii) | NIE-ZMIERZONO (pozycje raportu eliminacji z outcome silnika nie są generowane — do zbadania, możliwy BŁĄD-GRY) | nic | czerwony |
| elimination-spectacle-test | 1 / 83 PASS, 1 FAIL („tick rekordów tuż po turn++”) | NIE-ZMIERZONO | nic | czerwony |
| endturn-battle-deadlock-exec-test | 1 / 40 pass, 9 fail (B1c, B2: klik 2 kończy turę, C1b, D2/D3 advanceSeat) | NIE-ZMIERZONO (duża grupa; możliwy BŁĄD-GRY w sekwencji kliknięć po bitwie — wymaga osobnej analizy) | nic | czerwony |
| epoka-merge-recruit-test | 1 / NIEUDANE 5/13 (brak jednostek bazowych: Taran, Taran okuty, Wieża oblężnicza, Katapulta) | NIE-ZMIERZONO (możliwy STARY-PIN: lista jednostek bazowych epok zmieniona) | nic | czerwony |
| fair-play-tier-grid-test | 1 / 9 pass, 3 fail (góry 35/25/20 vs oczekiwane) | NIE-ZMIERZONO (możliwy STARY-PIN: progi tieru Fair Play) | nic | czerwony |
| fortify-pole-test | 1 / 39 pass, 2 fail (hitChance 39% vs 41%; wzgórze 37,5% vs 39,5%) | NIE-ZMIERZONO (rozjazd obliczenia bonusu fortyfikacji vs hitChanceTw; możliwy HARNESS lub BŁĄD-GRY) | nic | czerwony |
| idb-b1b2b3-test | 1 / 19 pass, 1 fail (setup: stary zapis z legacy localStorage widoczny, got 0) | NIE-ZMIERZONO (środowiskowe: stan localStorage/IDB w środowisku Node/jsdom) | nic | czerwony |
| json-descriptions-sync-test | 1 / 18 pass, 1 fail (a1: war-weariness-params.json — wartości bez prefiksu _ ≠ wersja bazowa f196422ef) | STARY-PIN (test sam wskazuje „+ celowe: pelneTur 40, progWymuszonyPokoj”; wymaga dopisania tych wartości do listy oczekiwanych celowych zmian z powołaniem na decyzję) | nic (nie wykonano — wymaga potwierdzenia, które zmiany są zamierzone) | czerwony |
| manual-rebalance-owner-era-test | 1 / pass=4 fail=1 (Zelazo top2 = zloto(1,0)+oboz(-1,1), got 0,1,1,0) | NIE-ZMIERZONO (ranking epoki właściciela) | nic | czerwony |
| perf-endturn-ai-phase-equiv-test | 1 / AssertionError („otwarcie okna tuż po deklaracji relacjeDip”) | NIE-ZMIERZONO (asercja w trakcie fazy AI; nie zbadano) | nic | czerwony |
| plony-budynkow-test | 1 / 64 passed, 4 failed (Targowisko delta 3 vs 4; Biblioteka +30%: got 5 want 3; Akademia +20%: got 8 want 7) | STARY-PIN (test pinuje wartości sprzed decyzji PYTANIE 75=C; odpowiednie asercje wymagają przeliczenia według decyzji 67B i 75=C) — NIE-ZMIERZONO w zakresie pełnej przeliczonej bazy | nic | czerwony |
| r-bitwa-kolory-gracz-przeciwnik-q1-test | 1 / AssertionError „gracz niebieski, przeciwnik czerwony” | NIE-ZMIERZONO (HARNESS lub zmiana kolorów frakcji) | nic | czerwony |
| rydwan-bierny-atak-test | 1 / 4 passed, 2 failed (wróg poza zasięgiem nie wymusza zbliżenia; rydwan z 1 punktem ruchu nie goni celu) | NIE-ZMIERZONO (możliwy BŁĄD-GRY: logika biernego ataku rydwanu) | nic | czerwony |
| rydwan-konnica-x2-test | 1 / 4 niezgodności (Jeździec z oszczepami: atak dystansowy oczekiwano 4, jest 14) | STARY-PIN (powiązane z Q14 #67: Konnica fieldPower = 98 — poprawić wiki i piny testów) | nic (zadanie #67 w toku poza tym tematem) | czerwony |
| stone-research-costs-test | 1 / 47 pass, 1 fail (dataset nie zmieniony poza czterema zatwierdzonymi kosztami) | NIE-ZMIERZONO (możliwy STARY-PIN: zatwierdzone koszty badań kamienia; wymaga listy zatwierdzeń) | nic | czerwony |
| surrender-rekrutacja-build-gate-test | 1 / 10 passed, 1 failed (surrender usuwa legacy, zwraca Pracę staremu właścicielowi, filtruje kolejkę) | NIE-ZMIERZONO (możliwy BŁĄD-GRY: zwrot Pracy po surrender) | nic | czerwony |
| trade-routes-income-test | 1 / 133 passed, 1 failed (H2e: Mint stolicy nie podnosi podatku w innym mieście właściciela: mint=2, noMint=2) | NIE-ZMIERZONO (możliwy BŁĄD-GRY lub STARY-PIN reguły Mennicy — wymaga potwierdzenia reguły) | nic | czerwony |
| unit-stock-cost-test | 0 / 58 passed, 0 failed | ZIELONY (bez zmian) | nic | zielony |
| war-allin-capital-test | 1 / 96 passed, 2 failed (6b aiVsAi i noLandPath: hash flagi OFF ≠ referencja) | NIE-ZMIERZONO (możliwy STARY-PIN: referencyjne hashe po FALACH 891/892) | nic | czerwony |
| wojna-wymuszona-parowanie-test | 1 / S2: leftover 5 znajduje parę; S7: Rzym dostaje wojnę | STARY-PIN (wg FALI 891 „sojusz nie blokuje wojny epoki”, test pinuje stare parowanie — do potwierdzenia przez właściciela; nie zmieniono) | nic | czerwony |
| zelazo-gate-test | 1 / NIEUDANE 4/24 (Legionista niedostępny przy kopalni na złożu + Odlewni żelaza: ids=[]) | NIE-ZMIERZONO (możliwy BŁĄD-GRY: warunek dostępności Legionisty) | nic | czerwony |

Liczby: STARY-PIN 4 (json-descriptions-sync, plony-budynkow, rydwan-konnica-x2, wojna-wymuszona-parowanie); HARNESS 0 potwierdzonych; BŁĄD-GRY 0 potwierdzonych (kandydaci w tabeli, nie potwierdzone); OBCIĄŻENIE 0; NIE-ZMIERZONO 20; ZIELONY 1.

## Dlaczego BLOCK (bez napraw kodu testów)
Dla 24 czerwonych testów nie ustalono przyczyny w zakresie wymaganym dispatchem (ustalenie na podstawie pierwszej linii FAIL i nagłówka testu; nie wykonano git log -S na pinowanych wartościach ani przeliczenia asercji). Nie zmieniono żadnego pliku testu, więc naprawy STARY-PIN/HARNESS nie zostały wykonane. Kandydaci STARY-PIN (json-descriptions-sync, plony-budynkow, wojna-wymuszona-parowanie, rydwan-konnica-x2) wymagają potwierdzenia zamierzonych wartości przed zmianą asercji — zgodnie z zasadą nie zgadywać.

## Bramki (surowe wyjście, uruchomione na tym worktree po npm ci)
- tsc --noEmit: exit 0
- logic-test: exit 0, „LOGIC OK (213/213)”
- tech-tree-test: exit 0, „tech-tree-test: 20 pass, 0 fail”
- research-test: exit 0, „ALL GREEN”
- unit-replace-test: exit 0, „WSZYSTKIE TESTY ZIELONE (21/21)”
- combat-test: exit 0, „All sanity checks passed.”
- ai-test: exit 0, „ai-test: 297 passed, 0 failed”
- era-war-pairing-alliance-test: exit 0, „19 pass, 0 fail”
- ai-ai-alliance-surcharge-test: exit 0, „RESULT: ALL GREEN (live + mutants detected)”

## UWAGI-DLA-ORKIESTRATORA
- Połowa 1/2 (wiersze 16–40 kat. D) nie była objęta tym raportem.
- Kandydaci BŁĄD-GRY (do rozstrzygnięcia przez orkiestratora, nie naprawiano kodu gry): endturn-battle-deadlock-exec (klik 2 kończy turę po bitwie), eliminacja-lup-kwoty (brak pozycji raportu eliminacji), zelazo-gate (Legionista), rydwan-bierny-atak (pościg rydwanu), surrender-rekrutacja (zwrot Pracy), trade-routes-income (Mennica), fortify-pole (bonus fortyfikacji).
- Test-dług 2/2 wymaga osobnej rundy 2 po potwierdzeniu zamierzonych wartości (json-descriptions-sync, plony-budynkow, wojna-wymuszona-parowanie, rydwan-konnica-x2 — ostatnie łączy się z zadaniem #67).
- Bez deployu; zero zmian w gra/src i gra/data; nie dotykano climate-band-test.cjs.

NASTĘPNY KROK: runda 2 Operatora na 24 czerwone testy z ustaleniem przyczyny (git log -S, diff pinów), priorytet: 4 kandydaci STARY-PIN po potwierdzeniu wartości przez właściciela (ABC).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
