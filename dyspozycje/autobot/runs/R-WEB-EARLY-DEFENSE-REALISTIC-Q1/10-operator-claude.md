STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-REALISTIC-Q1
GOAL: zmierzyć przeżywalność pierwszych 20 tur przy grze rozsądnego gracza na maksimum (seedy 4242 i 7; P0 kontrola, P1 budowa jednostki obronnej realną ścieżką UI, P2/P3).
ZMIANY/COMMIT: baza 478e6795d (detach). Zmienione: gra/tools/realdef-live.cjs (runner P0/P1, bez forceFortLive, bez hooków zmieniających stan), dyspozycje/analizy/OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27.md (inwentarz obrony startu, P0, P1 niewiarygodne), dane dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/dane-r2-p0-p1.jsonl i dane-r2-testy-kontrolne.jsonl, ten raport. Zero zmian w gra/src, gra/data, WERSJE.md, manifeście, rust-port.
TESTY:
- P0 pasywny, bez fortu, seed 4242, 6 przebiegów x 20 tur: 6/6 utrata jedynego miasta, tury 8, 8, 8, 9, 9, 9 (mediana 8,5), zdobywca barbarzyńcy (owner -1).
- P0 pasywny, bez fortu, seed 7, 6 przebiegów x 20 tur: 5/6 utrata, tury 8, 9, 10, 13, 14; 1 przebieg przeżył do tury 20.
- P0 razem: 11/12 utrata (92%). Fisher dwustronny P0-bez-fortu vs DEFEAT r2 (34/37): p = 1,0 (brak różnicy).
- P1 realna ścieżka UI (panel miasta → zakładka „Jednostki do rekrutacji” → przycisk najtańszej jednostki wojskowej): seed 4242 n=8, seed 7 n=4; 0 zakupów we wszystkich przebiegach; utrata miasta w turach 5–7. NIEWIARYGODNE: harness zniekształca ekonomię i moment utraty (patrz BLOKADY 2), P1 NIE zmierzone jako polityka gracza. Wymagane ≥20 na ziarno: NIE spełnione.
- P2 (bitwy ręczne) i P3 (mury): NIE ZMIERZONO.
- Inwentarz obrony startu (tura 1, real UI, seed 4242): zero jednostek wojskowych do kupienia (Skarb 0 wobec 12; Drewno 0 wobec 13); Oszczepnik (12 Pieniądz, 13 Drewno, bez technologii) osiągalny w ekonomii bez panelu w turze 7 (Skarb 13, seed 4242); miasto ginie w turach 8–9 (seed 4242). Czas produkcji jednostki: NIE ZMIERZONO. Mury (80 Drewna + 80 Kamienia) i Koszary (40 + 40): poza zasięgiem w turach 1–7 wg danych.
- Bramki (na bazie 478e6795d, kod gry nietknięty): tsc --noEmit exit 0; logic-test LOGIC OK (213/213); ai-test 297 passed, 0 failed.
- Readback ustawień: `__settingsLive.getSettings()` zapisany w linii `start` każdego przebiegu (pole settingsReadback).
BLOKADY:
1. P1 jako pomiar gracza jest niemożliwy w tym harnessie bez zmiany harnessu lub decyzji o źródle zniekształcenia. Dowody: (a) przy otwartym panelu miasta Skarb rośnie +1/turę zamiast +2/turę (seed 4242; linie [Ekonomia] Tura 2: P0 ¤=3 Praca=3, P1 ¤=2 Praca=2); (b) utrata miasta w P1 ma owner null (miasto znika z listy, licznik tury w gateInfo wraca do 1), w P0 owner -1 (zdobyte); (c) same opóźnienia czasu rzeczywistego (1,6 s/turę) w przebiegu kontrolnym P0 (seed 7, r22) dały utratę miasta w turze 1 z owner null. Przyczyna NIE ZMIERZONA (efekt otwarcia panelu, reset stanu zależny od czasu, czy coś trzeciego).
2. P2 i P3 zależą od P1: NIE ZMIERZONO.
3. Czas produkcji jednostki po zakupie, drewno w ekonomii bez panelu i wpływ podatku (suwaki „Handel”) na Skarb: NIE ZMIERZONO.
4. Generał / panel armii (inwentarz d): NIE ZMIERZONO w tej rundzie.
RUNDY: 2/5. Brak kolejnej rundy bez decyzji orkiestratora: wymagane wskazanie, czy harness ma zostać przepisany na tryb bez zależności od czasu rzeczywistego (np. sterowanie endTurn bez bezczynności) i czy otwarcie panelu miasta w turze 1 ma być traktowane jako zachowanie gracza.
DECYZJA WYMAGANA (orkiestrator, bez pytania właściciela): czy zaakceptować P0 (bez fortu) jako jedyny wiarygodny pomiar tej rundy, czy zlecić osobny temat na przyczynę zniekształcenia P1 (efekt otwarcia panelu na ekonomię i moment utraty miasta). Dla decyzji o balansie (do właściciela, jeśli dotyczy): najtańsza jednostka obronna w ekonomii bez panelu pojawia się w turze 7 (seed 4242) — tuż przed/na granicy utraty miasta w turach 8–9 — zanim doliczony zostanie czas produkcji; czy to za mało czasu, zależy od czasu budowy (NIE ZMIERZONO).
UWAGI-DLA-ORKIESTRATORA:
- Przycisk „Wróć na mapę” (civ-v-exit-map-btn) w panelu miasta: w wersji pilotażowej (z kliknięciem) stan gry kończył się bez miast. Po usunięciu kliknięcia P1 nadal traci miasto wcześniej. Czy to błąd gry (UX/stan sesji), czy artefakt haka — NIE ZMIERZONO; warto sprawdzić osobno (ponieważ dotyczy realnego przycisku gry).
- Sygnał do sprawdzenia w grze (poza zakresem tego tematu): otwarcie panelu miasta w turze 1 zmienia dochód Skarbu (¤) i Pracę z +2 na +1 przy seedzie 4242 — możliwy błąd lub zamierzony efekt (Podział pracy przy otwarciu panelu). Nie jest to potwierdzone.
- Metryka barbNearAtLoss = 0 w danych P0 (cityThreatProbe, foreignNear r=3): słaba metryka, nie rozstrzyga.
- Wymuszony fort (forceFortLive) nie wpływa na wynik pasywnego gracza (92% bez fortu vs 92% z fortem w DEFEAT r2).
- Nie użyto: forceFortLive, __siegeBlockTestDebug.tryPurchase (skarb 999999), prepareEndTurnGate (skarb 5000). Brak nowych haków w gra/src.
- Logi *.txt nie są commitowane (poza runnerem i danymi JSONL).
NASTĘPNY KROK: decyzja orkiestratora wg „DECYZJA WYMAGANA”. Po decyzji: P1 na czystym harnessie (≥20 na ziarno), P2/P3 jeśli P1 da obrońcę przed ok. t10, pomiar czasu produkcji i drewna w ekonomii bez panelu.
DEPLOY/PUSH: NIE WYKONANO
