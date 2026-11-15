STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-AI-BALANCE-FROM-TURN1-Q1
GOAL: Równoważenie skarbca/spichlerza AI od tury 1 (NNS_AI_BALANCE_TURN_MIN = 1); gracz bez zmian (wyjątek 1–10 i NNS_WOLNE_TURY = 10 zostają).
RUNDA: obrona r1 (odpowiedź na zarzuty Evaluatora c3ebc4d0a). Baza: d189cd7bd.

ZMIANY/COMMIT:
- d189cd7bd (kod operatora, bez zmian w tej rundzie): gra/src/game/no-negative-stocks.ts, gra/tools/no-negative-stocks-c2-test.cjs, gra/tools/no-negative-stocks-ai-from-turn1-test.cjs (nowy), dyspozycje/.../10-operator-claude.md.
- bf1ebfbcc (obrona, zarzut 4): gra/tools/no-negative-stocks-headless-measure.cjs (komentarze progu 11 -> 1; NNS_FREE_TURNS 10 -> 0 jako próg kryterium „od tury 1”; komunikat braku wpisu bez „tura < 11”), gra/tools/no-negative-stocks-c3-turn-test.cjs (komentarze l.6 i l.70). Tylko te 2 pliki.
- Brak zmian w gra/src/main.ts w tej rundzie (zarzut 3 przyjęty jako dług, patrz niżej).

ODPOWIEDZI NA ZARZUTY:
1. Pomiar headless przed/po — PRZYJMUJĘ CZĘŚCIOWO (wykonany, niepełny).
   Zbudowano dwa bundle vite poza repo (scratchpad): PO = worktree bf1ebfbcc (gra/, node_modules z npm ci), PRZED = git archive b0311c92f gra (node_modules dowiązane). Pomiar: gra/tools/no-negative-stocks-headless-measure.cjs, --turns 30, --modes on, ziarno 11, realny bundle w headless Chromium (/opt/pw-browsers/chromium-1194), 13 głównych AI (ownersMajor). Surowe wyniki: meas-before/cell-on-11.json (PRZED) i meas-after/cell-on-11.json (PO), oba done:true.
   Wyniki, ziarno 11, tury 1–30, cywilizacje główne (cs=false):
     - naruszenia (skarbiec<0 lub spichlerz surowy<0 lub głód), T1–10: PRZED 70, PO 0
     - naruszenia, T11–30: PRZED 48, PO 5
     - min skarbiec T10: PRZED -155, PO 0; min spichlerz T10: PRZED -33, PO 0
     - min skarbiec T20: PRZED -199, PO 5
     - miasta AI T30 (posortowane): PRZED 5,6,7,7,7,7,8,8,8,8,9,10,10 (mediana 8); PO 4,6,6,7,7,8,8,8,8,8,8,10,11 (mediana 8)
     - jednostki AI T30 (suma): PRZED 60, PO 60
     - eliminacje (wpisy w eliminated): PRZED 26, PO 26 (ta sama lista, głównie miasta-państwa)
   Mediana liczby miast AI w T30 nie spadła (próg z dispatchu: spadek >1 — nie wystąpił). Skarbiec min w T30 nie jest ujemny w obu wariantach.
   NIE_ZMIERZONO: ziarno 22 — dwie próby w buildzie PO (wznowienia tym samym poleceniem) zakończone błędem „świat nie wygenerowany w limicie” (cell-on-22.json done:false). Brak wyniku PRZED dla 22. Ziarno 33 — nie uruchomiono. Tryb „off” (mutacja pomiarowa) — nie uruchomiono.

2. Weryfikacja live (Chromium, 10 tur z AI) — NIE_ZMIERZONO jako osobny run UI.
   Pomiar powyżej używa realnego bundle w Chromium z realnym „Zakończ turę” (30 tur, ziarno 11), więc ujemne stany AI w T1–10 są zmierzone (0 naruszeń w PO). Nie wykonano osobnego runu z interfejsem gracza (live-verify-*.cjs).

3. Pokrycie main.ts (T1–10) — PRZYJMUJĘ jako lukę, NIE NAPRAWIONO w tej rundzie.
   no-negative-stocks-c3-turn-test startuje od tury 12, a nowy test sprawdza czyste funkcje; integracja nnsAiPreTickBalance w T1–10 nie ma testu regresji. Empirycznie pokryta przez pomiar ziarna 11 (T1–10: 0 naruszeń PO). Rozszerzenie c3-turn-test do startu od T1 wymaga bundla i kilkunastu minut na ziarno; poza czasem tej rundy. Rekomendacja: dług testowy osobnym tematem (decyzja orkiestratora).

4. Stale komentarze progu 11 — PRZYJMUJĘ, NAPRAWIONO w bf1ebfbcc.
   Zmienione: headless-measure (nagłówek „od tury 1”, NNS_FREE_TURNS = 0 z komentarzem, komunikat braku wpisu, komentarz w summarize); c3-turn-test l.6 i l.70. Pozostałe trafienia „tury 11” w no-negative-stocks-endturn-test.cjs, no-negative-stocks-test.cjs i end-turn-gate-levers-test.cjs dotyczą BRAMKI GRACZA (NNS_WOLNE_TURY = 10, blokada od 11) i są poprawne — nie zmieniane.

5. Dług REPIN Rust progu równoważenia AI — ODRZUCAM jako zadanie operatora: zgodnie z dispatchem to zadanie orkiestratora. Nic nie założono (zakaz tworzenia sesji/zadań).

TESTY (uruchomione w tej rundzie w worktree):
- node tools/no-negative-stocks-c2-test.cjs -> 44 passed, 0 failed
- node tools/no-negative-stocks-ai-from-turn1-test.cjs -> 27 passed, 0 failed
- git diff --check b0311c92f HEAD -> czysto
- Pomiar: patrz wyżej (cell-on-11 PRZED/PO).
- Nie uruchomiono ponownie tsc ani pełnego zestawu bramek w tej rundzie (zmiany obrony to komentarze i stała w narzędziu .cjs; kod gry nie zmieniony od d189cd7bd). Bramki referencyjne były zielone w raporcie Evaluatora.
- c3-turn-test (wymaga --dist) nie uruchomiony w tej rundzie.

BLOKADY:
- Ziarno 22 i 33 pomiaru; tryb off; live z UI; test regresji T1–10 w main.ts (zarzut 3).

RUNDY: obrona 1/5.
NASTĘPNY KROK: Evaluator r2 — ocena bf1ebfbcc (zarzut 4 zamknięty), pomiar częściowy (ziarno 11) i decyzja o luce zarzutu 3 (dług testowy vs wymóg przed FC).
UWAGI-DLA-ORKIESTRATORA:
- Pomiar ziarna 22 kończy się „świat nie wygenerowany w limicie” (runner headless, nie kod tematu). Zalecenie: osobny temat dla runnera przed kolejnymi pomiarami.
- 26 eliminacji miast-państw w obu wariantach (ziarno 11, T22) — obserwacja poza zakresem; warto odnotować w rejestrze.
- Dług Rust REPIN progu równoważenia AI (zarzut 5) — do założenia przez orkiestratora.
- Nie założono żadnych sesji/zadań/triggerów (zakaz).
DEPLOY/PUSH: NIE WYKONANO
