# R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1 — Final Control (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1
GOAL: „Zakończ turę” zablokowane przy prognozie skarbca/spichlerza < 0 (od tury 11), gdy istnieje ruch naprawczy; dźwignie + stały tooltip z liczbami; brak zakleszczenia.
ZMIANY/COMMIT: kandydat 242d51289962f00b03242c149b06300c5be367ed (potomek bazy 85f7961b1 — `git merge-base --is-ancestor` OK). Diff vs baza: no-negative-stocks.ts, main.ts (gate + refreshLiveEmpireRatesUnsafe + wiązanie), bottomBarHud.ts, hud.ts, test levers, raporty 10/30. Zakres zgodny z allowlistą (UI przycisku i HUD dopuszczone przez dispatch). integration_sha = 242d51289962f00b03242c149b06300c5be367ed (kod; raport FC dochodzi jako osobny commit).

TESTY (surowe, na 242d51289, npm ci w worktree):
- tsc --noEmit: rc=0
- levers 25/0; endturn 19/0; no-negative-stocks-test 25/0; projection 49/0; ai 8/0; c2 43/0
- Mutacja: podatek w decideEndTurnGate zerowany => levers 20/5 (czerwone), przywrócone.
- „5 bramek referencyjnych” (R-PROC-AUTOBOT §Bramki) i c3-turn-test/Chromium: NIE_ZMIERZONO (build/dev w gra/ zakazany dispatchem; nie obchodzono).

ZARZUTY:
1 (dźwignia kolejki) — DO DECYZJI CZŁOWIEKA: prognoza gracza (_nnsHumanForecast) nie zawiera pozycji kolejki (zakupy jednostek natychmiastowe ze skarbca, budowa zużywa Pracę/surowce), więc wycofanie pozycji nie zmienia salda po turze. ZAŁOŻENIE: przesłanka pkt 1(b) dispatchu jest błędna; nie wdrażać bez ABC (usunąć (b) albo zdefiniować model).
2 (Chromium) — ODDAL: NIE_ZMIERZONO; zalecany live-verify po deployu na ROBOCZĄ.
3 — ODDAL: mutacja logiki udowodniona; wiring main.ts pokryty asercją regex.
4 — ODDAL: ryzyko rozjazdu gracz/AI niskie; wspólny helper poza allowlistą (dług).
5 — ODDAL: racje są też w AI; przywracanie w finally.
6 — NAPRAWIONE w 28f8a258e.
7 — ODDAL: strona bezpieczna (brak zakleszczenia).
8 — NAPRAWIONE (testy g, h).
Żaden zarzut nie wymaga NAPRAW.

BLOKADY: brak techniczny. Otwarte: Chromium/live (NIE_ZMIERZONO), pkt 1(b) do ABC.
RUNDY: 1/5 (FC)
NASTĘPNY KROK: integracja orkiestratora; live-verify po deployu; ABC właściciela ws. dźwigni kolejki.

UWAGI-DLA-ORKIESTRATORA: dispatch istnieje tylko w f734ed0e6 (brak na origin/main i brak DODATKU). Dług: wspólny helper projekcji gracz/AI.
DEPLOY/PUSH: NIE WYKONANO
