STATUS: BLOCK (częściowo: punkty 1, 3 i 2-klik/dźwignia zmierzone na realnej ścieżce bez grantów; tytuł przycisku w blokadzie NIE_ZMIERZONO z anomalią do wyjaśnienia; punkt 5 (okno wymiany) NIE wykonany w tej rundzie; kod gry bez zmian)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1 — obrona na zarzuty Evaluatora (runda 3, odpowiedź Operatora r4)
GOAL: dowód w żywej grze (Chromium, bundle vite poza repo, ?civTest=1): bramka „Zakończ turę” (tytuł, klik, dźwignia, tury 1–10, brak zakleszczenia) oraz okno „Umowa wymiany surowców” (bez przeładowania węzła, obie strony, zrzuty).
BAZA: c0987bcec (kandydat r3, Operator Haiku). Zarzuty: report_sha 860b5f02e (eval-r3-claude-2).
ZMIANY-COMMIT: patrz sekcja ODPOWIEDZI — (1) usunięty gra/tools/live-verify-wave-689-697-a-gate-v3.cjs (ścieżka grantów); (2) nowy gra/tools/live-verify-wave-689-697-a-gate-v4.cjs (zero wywołań grantPlayerGold; tylko komentarz); (3) evidence/r4/ (surowe JSON + stdout + log builda). Kod gry gra/src i gra/data NIETKNIĘTE. SHA: patrz TESTY/SHA. Symlink gra/node_modules (poza commitem, gitignored).

## Odpowiedzi na zarzuty Evaluatora

| nr | zarzut | werdykt | dowód |
|---|---|---|---|
| 1 | v3 buduje deficyt grantPlayerGold (zakazana ścieżka) | PRZYJMUJĘ | v3 usunięty (git rm). v4 buduje deficyt wyłącznie realnie: miasto (refoundPlayerAnywhere), tura 11 (endTurn), jednostki utrzymania gracza (spawnAiUnits(0,n)). `grep -n grantPlayerGold gra/tools/live-verify-wave-689-697-a-gate-v4.cjs` → tylko 2 wiersze komentarza, zero wywołań. Wynik: result-v4-sweep-seed11.json pole grantCalls = 0 |
| 2 | pkt 1 (title, klik nie kończy tury, dźwignia kończy turę): NIE_ZMIERZONO | PRZYJMUJĘ częściowo | klik w blokadzie: tura 11 → 11 (PASS). Dźwignia = rozwiązanie 1 jednostki (hak disbandPlayerUnits): canEnd false → true, klik: tura 11 → 12 (PASS). Dźwignia podatku/racji: NIE_ZMIERZONO (brak ścieżki UI, nie zrobiono). Tytuł: patrz sekcja WYNIKI, punkt A (anomalia) |
| 3 | tury 1–10 z deficytem: nie uruchomiono | PRZYJMUJĘ, wykonane | tryb --check10 1: w każdej turze 1–10 dodane 2 jednostki utrzymania, canEnd = true (10 z 10), koniec tury 1→2 … 10→11. Deficyt podatkiem min. NIE użyty (tylko jednostki) |
| 4 | zakleszczenie: niezmierzone | PRZYJMUJĘ, częściowo zmierzone | przy skarbcu −430 w turze 11 (HUD „Skarbiec -430 +5 / −79”) canEnd = true, bez zakleszczenia; kod: decideEndTurnGate (gra/src/game/no-negative-stocks.ts) zwraca blokada false, gdy czyRuchNaprawczy nie pokrywa brakuje. Zgodne z pomiarem |
| 5 | okno wymiany: runner nie istnieje, brak zrzutów | PRZYJMUJĘ (nie wykonane) | Brak runnera gra/tools/live-verify-wave-689-697-a-trade.cjs. Nie wykonano w r4 (zakres r4 ograniczony do zarzutów 1–4, 6–8, 10). Otwarte na kolejną rundę — NIE jest to odrzucenie |
| 6 | reset do TURA 1: artefakt grantów niepotwierdzony | PRZYJMUJĘ jako obserwację | Reset nie wystąpił w żadnym przebiegu v4 (sweep: 2 uruchomienia, check10: 2 uruchomienia; tura 11 stabilna po −430 skarbca i 72 jednostkach). Hipoteza „artefakt grantów” pozostaje nieudowodniona, ale v4 już nie używa grantów |
| 7 | „wąskie okno” to hipoteza z kodu | PRZYJMUJĘ jako pomiar częściowy | Pomiar: blokada przy 2 jednostkach (dźwignia pokrywa brak), brak blokady przy −430 (dźwignia nie pokrywa). Zgodne z kodem decideEndTurnGate. Okno wąskie potwierdzone tylko dla tego scenariusza (seed 11, Maly, jedna dźwignia jednostkowa) |
| 8 | „brak haka do jednostek” nieścisłe | PRZYJMUJĘ (korekta) | Zgoda: haki istnieją (main.ts l.30334 foundPlayerCity, l.30339 addUnit(ownerId,q,r,civilian), l.30481 setFastMode). Użyto spawnAiUnits(0,n), bo działa dla ownera 0 (dowód: wiersz `typeId: Wojownik, upkeepEach: 4` w evidence/r4) |
| 9 | Sonnet po 2 rundach Haiku | NIE ROZSTRZYGAM | Decyzja modelu należy do orkiestratora. Fakt: DODATEK wskazuje r1 i r2 jako FAIL tego samego tematu; ta runda to r3 Haiku (r4 = odpowiedź na zarzuty, Haiku) |
| 10 | build exit 0 / 15.75 s bez logu | PRZYJMUJĘ, log dołączony | evidence/r4/build-vite-r4.log: „✓ built in 17.42s”, exit 0 (bundle w scratchpadzie, poza repo). Log r3 nie został zachowany — jego twierdzeń nie powtarzam |

## WYNIKI (liczby z surowego wyjścia, nie z pamięci)

Sweep (evidence/r4/sweep-v4-stdout.txt, result-v4-sweep-seed11.json), seed 11, mapa Maly, zero grantów:
- playerCitiesAfterFound = 1; reachedTurn = 11; turn11_awaitingFirstCity = false; turn11_canEndNatural = true
- transitions: [{units 0, canEnd true, turn 11}, {units 2, canEnd false, turn 11, upkeepEach 4, typeId Wojownik}]
- firstBlockedUnits = 2
- blocked_click: clicked true; turn 11 → 11 (klik NIE kończy tury)
- lever_unitsDisbanded = 1; lever_canEndAfter = true; lever_click: turn 11 → 12
- unitsAddedTotal = 2; errors = []; fatal = none

Check10 (evidence/r4/check10-v4-stdout.txt, result-v4-check10-seed11.json):
- tury 1–10: +2 jednostki/turę, canEnd true w każdej z 10 tur, tura 1→2 … 10→11
- tura 11: skarbiec −430 (HUD), canEnd true (brak blokady, bo brak > dźwignie)
- sweep po tym: 60 dodatkowych jednostek, canEnd true, transitions bez zmiany; errors = []

### Punkt A — ANOMALIA tytułu przycisku (NIE_ZMIERZONO, do wyjaśnienia)
W stanie zablokowanym (sweep, 2 jednostki) konsola potwierdza blokadę: `[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)`, a przycisk ma klasę `is-disabled` i `aria-disabled=true`. Atrybut `title` jest PUSTY: 6 odczytów co 1,5 s (9 s), po `resize`, po kliku na mapę. Nie ma żadnego węzła DOM z tekstem „Nie można zakończyć tury”. Kod (main.ts ~27486 → bottomBarHud.ts l.219) i decideEndTurnGate (komunikat niepusty przy blokadzie) sugerują, że tytuł powinien być. Możliwe wyjaśnienia, NIEROZSTRZYGNIĘTE: (a) HUD nie został przerysowany po zmianie stanu wywołanej hakiem (spawnAiUnits/disbandPlayerUnits nie wołają updateHud, a klik mapy też nie); (b) defekt renderu tytułu. Do wyjaśnienia w r5 przez zdarzenie gry, które wywołuje updateHud (np. realna rekrutacja), a nie przez hak. Do czasu tego: punkt „title” = NIE_ZMIERZONO.

## TESTY
- vite build (node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/r4/dist), exit 0, „✓ built in 17.42s” (evidence/r4/build-vite-r4.log)
- gra/tools/live-verify-wave-689-697-a-gate-v4.cjs: sweep (exit 0, errors []), check10 (exit 0, errors [])
- bramki referencyjne (tsc, logic, tech-tree, ...) NIE uruchamiane w tej rundzie: zmiany dotyczą wyłącznie narzędzi pomiarowych w gra/tools/ i dokumentacji; gra/src bez zmian (git diff c0987bcec -- gra/src: pusty)
- git diff --check: do uruchomienia przed commitem (patrz SHA)

## BLOKADY
1. Punkt 2 (tytuł w blokadzie): anomalia A — NIE_ZMIERZONO.
2. Punkt 2 (dźwignia podatku/racji przez UI): NIE_ZMIERZONO — brak ścieżki UI w tej rundzie.
3. Punkt 5 (okno wymiany): nie wykonano (brak runnera i zrzutów).
4. Wyłącznie jeden seed (11) i jeden rozmiar mapy (Maly). Brak powtórzeń.

## RUNDY
Odpowiedź obrony r4 (Operator Haiku). Bieżąca runda tematu: 4/5 wg dispatchu (r1, r2, r3 zapisane). Decyzja o Sonnet — orkiestrator (zarzut 9).

## UWAGI-DLA-ORKIESTRATORA
UWAGI-1: Kandydat do osobnego tematu R-WEB-*: tytuł przycisku „Zakończ turę” pusty w stanie zablokowanym (anomalia A). Jeśli potwierdzi się przy realnej rekrutacji/rozwiązaniu jednostki z UI — to defekt renderu, nie pomiaru. Nie naprawiam (zakaz zmian gra/src w tym temacie).
UWAGI-2: Okno wymiany (punkt 5) wymaga osobnego runnera i rundy; to zadanie nie zostało wykonane w r4.
UWAGI-3: Reset do TURA 1 z r1/r2 nie odtworzony w v4 (zob. zarzut 6).
UWAGI-4: Model: decyzja o Sonnet należy do orkiestratora (zarzut 9).

## NASTĘPNY KROK
Orkiestrator: (a) ocena odpowiedzi na zarzuty 1–10; (b) decyzja o rundzie 5 dla punktu 5 (okno wymiany) i dla anomalii A (wywołanie realnej akcji HUD).

## DEPLOY/PUSH
NIE WYKONANO (commit tematu lokalnie na gałęzi roboczej; push i integracja poza zakresem Operatora)
