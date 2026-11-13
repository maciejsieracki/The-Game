STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — HUD górny baner
TEMAT: R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1
GOAL: stały układ 3+3 (Skarbiec·Praca·Spichlerz / Handel·Nauka·Surowce), brutto i netto w każdej komórce, netto = realna zmiana po endTurn.
ZMIANY/COMMIT: obrona na bazie commitu Operatora 900690a1d (baza main 01fdd771f); SHA commitu obrony w odpowiedzi końcowej. Push nie wykonano.

ODPOWIEDZI NA ZARZUTY
1. Praca (C) — PRZYJMUJĘ. Przyczyna zmierzona: HUD pokazywał saldo OSTATNIEGO ticka, a tick liczy też nadwyżkę z ukończonego budynku i mnożnik trudności, których podgląd nie zna. `main.ts`: nowa prognoza `_livePracaForecast` (te same czyste funkcje co tick: `pracaImperialPoolGain`, `advanceProduction`; odświeżana też tuż po końcu tury) -> `HudState.pracaPrognoza`; komórka Praca pokazuje prognozę. `_lastPracaRate` i silnik bez zmian. Twarda asercja przywrócona: live HUD vs zmiana puli = 10/10, 28/28, 35/35. Granica: prognoza nie obejmuje auto-ulepszeń gracza ani Cudów na mapie (zależą od puli w ticku) — jawnie w tooltipie.
2. Spichlerz — PRZYJMUJĘ. Hak `?civTest=1` `__hudGrossNetTestDebug.setFoodReserve` (main.ts, poza „tylko HUD", zgłaszam; zero wpływu bez parametru). Zapas 600, netto −44: zmiana −44 == netto, 2 próby. NIE_ZMIERZONO: scenariusz z DODATNIM netto Spichlerza (sandbox nie ma nadwyżki).
3. Surowce — PRZYJMUJĘ. Komórka pokazuje teraz sumę brutto i sumę netto (ta sama wielkość); deficyt pojedynczego surowca = czerwony chip + ⚠ + tooltip („Najgorszy bilans", lista per surowiec). Live: każdy nieobcięty surowiec zmienił się o swoje netto (Glina +18 = +18), suma zmian == Σ max(netto, −zapas) (18 == 18, 3 tury). Zapas nie schodzi poniżej 0, więc surowce z zapasem 0 (Drewno, Kamień, Żelazo) są raportowane jako obcięte. Pokrycie nieobciętych = tylko Glina w sandboksie.
4. Panel imperium — PRZYJMUJĘ. `empireDetailPanel.ts`: linia „Brutto → netto" w Spichlerzu, Surowcach, Handlu i Nauce (te same pola HudState). Live: panel == komórka HUD we wszystkich 4. Skarbiec i Praca miały już oba. Dodano opcjonalny parametr `economy` (2 funkcje); test źródłowy `spichlerz-deficyt-scalenie` zaktualizowany o nową sygnaturę (uzasadnienie w teście).
5. Ikony ≤900 px — PRZYJMUJĘ. Medaliony zostają (14 px), zmienia się tylko skala (komórka 78 px). Test: ikony widoczne przy 1280/1024/800/640, brak przycięcia przy 1,2M, pozycje identyczne dla małych i dużych liczb. Mutant „ikony ukryte" wykryty. Okno 640 px: układ 3+3 stabilny, ale baner (276 px) nakłada się na medalion Mocy (x=200) — to poza wymogami 1280/1024/800; NIE rozwiązane tutaj.
6. Raport — PRZYJMUJĘ. Ten raport ≤700 słów; SHA w odpowiedzi końcowej (nie da się go wpisać w plik własnego commitu).
7. Regresje — PRZYJMUJĘ. Porównałem 85 testów (nie 47) PRZED/PO wg kodu i treści linii FAIL (`gate-regresje-r2-PRZED-vs-PO.txt`): 22 czerwone identycznie, identyczne komunikaty. Operator r1 pominął jedną nową czerwień (`rateWarn` w spichlerz-deficyt-scalenie) — naprawiona komentarzem (zachowanie zachowane przez `hudFoodShortage`). Moja pierwsza wersja zepsuła `praca-pula-rate-parity` (kotwica okna tekstu) — blok przeniesiony, zielony. Timeouty solo: sidepanel-hud-deadzone i hud-tooltip-body-mounted-panels zielone PRZED i PO; horse-resource-terrain timeout w obu (generator mapy, bez związku z HUD); hotseat-etap6c-lastpraca-per-fotel kod 2 w obu (środowiskowy: brak przycisku startu). Brak nowych czerwieni.

TESTY
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Nowy test (A+M+B): 1221 ok, 0 fail, EXIT=0 (gate-hud-topbar-grid-gross-net.txt). 7/7 mutantów wykrytych (m.in. netto Surowców = najgorszy, Praca z ostatniej tury, ikony ukryte).
- Zrzuty PO r2: zrzut-PO-r2-*.png (≤49 KB). Build vite poza repo.

BLOKADY: brak blokujących. Notatki: pkt 2 (dodatnie netto Spichlerza), pkt 3 (pokrycie tylko Glina), pkt 5 (640 px vs Moc), hak testowy w main.ts. Lista kolejnych (bez zmian): karta miasta, tooltipy Kultura/Religia/Obywatele, prawy baner.
RUNDY: obrona 1/5 (runda 2 procesu)
NASTĘPNY KROK: Evaluator, potem Final Control; REPIN Rust (HUD baner) notuje orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
