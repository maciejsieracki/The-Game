STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar na żywo, bez zmian w gra/src i gra/data)
TEMAT: R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1
GOAL: runda 2/5, punkt 3 dispatchu (straty zwycięzcy: tryb ręczny vs AUTO vs skip, na tej samej parze, ≥3 ziarna w trybie „losowe”). Baza: d5323fadf (origin/main), detached w worktree wf_ed85d031-35c-1.

ZMIANY-COMMIT:
- Ten raport (commit operatora, git add <ścieżka>).
- Nowy harness (NIE zacommitowany, zgodnie z poleceniem „commituj tylko raport"): gra/tools/live-verify-w18-w24-manual-losses-r2-manual.cjs.
- Dowód JSON (NIE zacommitowany): dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1/evidence/w3-manual-auto-skip-r2.json (12 wpisów, klucze runs["<id>|<tryb>"]).
- Brak zmian w gra/src, gra/data, gra-robocza, WERSJE.md. Brak git add -A.
- Lokalnie (poza commitem): gra/node_modules (npm ci), build w scratchpad (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/dist-r2). Sprzątanie po stronie orkiestratora.

TESTY (liczby z surowego wyjścia):
- Build: npx vite build --outDir <scratchpad>/dist-r2 → "✓ built in 42.38s", index.html 14 849 094 B (bez npm run build).
- Pomiar: 12 przebiegów = 4 konfiguracje (P1 pewne s1; P2 losowe s1; P3 losowe s2; P4 losowe s3) × 3 tryby (manual / auto / skip). Wszystkie 12 zakończone, errors=[] w każdym wpisie (poza wpisami błędu infrastruktury, które powtórzono do skutku).
- Wyniki (atakujący = Rzym 28, obrońca = Grecja 28; „zwycięzca" = strony, która wygrała):

| para | tryb trafień | ziarno | tryb bitwy | zwycięzca | straty zwycięzcy | straty przegranego | rundy |
|---|---|---|---|---|---|---|---|
| 1:1 mieszana 28 vs 28 | pewne | 1 | RĘCZNY (klik Start + Spacja) | obrońca | 16/28 | 28/28 (atak) | 15 |
| 1:1 mieszana 28 vs 28 | pewne | 1 | AUTO (klawisz R) | atakujący | 11/28 | 28/28 (obrona) | 19 |
| 1:1 mieszana 28 vs 28 | pewne | 1 | skip (Pomiń) | atakujący | 10/28 | 28/28 (obrona) | 19 |
| 1:1 mieszana 28 vs 28 | losowe | 1 | RĘCZNY | obrońca | 18/28 | 28/28 (atak) | 17 |
| 1:1 mieszana 28 vs 28 | losowe | 1 | AUTO | atakujący | 10/28 | 28/28 (obrona) | 29 |
| 1:1 mieszana 28 vs 28 | losowe | 1 | skip | atakujący | 13/28 | 28/28 (obrona) | 30 |
| 1:1 mieszana 28 vs 28 | losowe | 2 | RĘCZNY | atakujący | 10/28 | 28/28 (obrona) | 30 |
| 1:1 mieszana 28 vs 28 | losowe | 2 | AUTO | obrońca | 11/28 | 28/28 (atak) | 16 |
| 1:1 mieszana 28 vs 28 | losowe | 2 | skip | obrońca | 12/28 | 28/28 (atak) | 18 |
| 1:1 mieszana 28 vs 28 | losowe | 3 | RĘCZNY | obrońca | 14/28 | 28/28 (atak) | 20 |
| 1:1 mieszana 28 vs 28 | losowe | 3 | AUTO | atakujący | 4/28 | 28/28 (obrona) | 26 |
| 1:1 mieszana 28 vs 28 | losowe | 3 | skip | atakujący | 3/28 | 28/28 (obrona) | 27 |

- Kontrola spójności z rundą 1 (ta sama maszyna, te same ziarna i presety): P1 skip 10/28 r19 i auto 11/28 r19 oraz P2 auto 10/28 r29 i skip 13/28 r30 są IDENTYCZNE z wynikami r1 (evidence/w3-straty-zwyciezcy-seeds123.json). Pomiar jest powtarzalny między rundami dla trybów AUTO/skip.
- Bramki referencyjne (ta sama gałąź, bez zmian w kodzie): tsc --noEmit exit 0 (wykonane w r1 na tym samym kodzie, NIE ZMIERZONO ponownie w tej rundzie — brak zmian kodu, nie uruchamiano ponownie).

OBSERWACJE (dane, bez oceny balansu):
1. Dla każdego z 4 ziaren zwycięska strona w trybie RĘCZNYM różni się od AUTO/skip (P1: obrona vs atak; P2: obrona vs atak; P3: atak vs obrona; P4: obrona vs atak). Przyczyna jest prawdopodobnie w samym driverze (patrz BLOKADY 1): w trybie ręcznym po pierwszej Spacji walka przechodzi dalej bez rozkazów jednostek.
2. W przebiegach RĘCZNYCH po pierwszej Spacji `_battleAwaitingOrders` = false i runda rośnie bez dalszego wejścia (trace: round 0→1, sp 0, space=1). Driver wykonał 1 naciśnięcie Spacji w każdym przebiegu ręcznym (pole actions.spacePresses = 1).
3. Wynik ręczny NIE jest pomiarem sterowania gracza: nie wydano żadnych rozkazów jednostkom. To pomiar „start ręczny bez rozkazów".
4. Zakres „niezależności ziaren": w trybie „losowe" ziarna 1, 2, 3 dają różne wyniki (AUTO: 10/11/4 strat zwycięzcy). Wynik r1 („ziarna 1–3 identyczne") dotyczył trybu „pewne" i jest zgodny z dispatchem (pewne = deterministyczne).

BLOKADY (jawnie):
1. NIE ZMIERZONO — ręczne sterowanie jednostkami (klik po kliku, rozkazy Taktyka/Strategia na płótnie). Wykonano tylko podejście 1 („prosty sterownik": klik „Start walki" + Spacja). Podejście 2 (battle-manual-full-roster-pointer-live-test.cjs) NIE wykonano — brak czasu w tej rundzie; harness wymaga współrzędnych jednostek na płótnie. Stan do wznowienia: po deploy phase („Start walki" #deploy-toolbar-start) i pierwszym kliku, zatrzymanie = brak rozkazów jednostek (krok: wybór jednostki na płótnie, selektor: płótno bitwy, bez logu błędu).
2. NIE ZMIERZONO — pary inne niż 1:1 mieszana 28 vs 28. Presety ?playtest=bitwa-duza mają stały skład 10 Hastati + 10 Łucznik + 8 Konnica vs 10 Falanga + 10 Łucznik + 8 Konnica (src/game/playtestWalkaMapy.ts). Pary 10 vs 10 „wręcz vs wręcz" i „dystans vs wręcz" wymagają własnego rosteru, a bez zmiany gra/src nie ma takiego presetu. Brak też pomiaru stosunków sił innych niż 1:1.
3. Odstępstwa od dispatchu w wykonaniu (wszystkie zapisane w JSON, pole actions):
   - skip: przycisk Pomiń nie został znaleziony po tekście (page.locator button /Pomi/); użyto metody bs.skip() (actions.skipClick = "fallback-metoda"). Przebiegi skip NIE są więc czystym kliknięciem.
   - AUTO: przełączenie klawiszem R (prawdziwe wejście klawiatury), ale prędkość 8× ustawiano metodą _setSpeedIdx(3). Tryb ręczny: tylko klik Start + Spacja.
   - Ziarno trybu trafień ustawiono hakiem __civSetHitMode (tryb czytany tylko pośrednio; dowodem jest różnica P1 pewne vs P2 losowe na ziarnie 1).
4. Infrastruktura (powtórzenia, nie błędy wyniku): P3 manual — pierwsza próba przerwana po 420 s (timeout pętli pompowania klatek, bez wyniku), druga próba zakończona poprawnie. P4 — dwie próby przerwane przez zamknięcie przeglądarki ("Target page, context or browser has been closed"), trzecia próba zakończona poprawnie (P4 manual/auto/skip). Wyniki w JSON pochodzą wyłącznie z przebiegów bez błędu.
5. Punkt 1 (W18) i punkt 2 (W24) nie były w tym zakresie mierzone ponownie (zgodnie z DODATKIEM: W18 zamknięty w FC r4; W24 PASS w r1, wynik zachowany).

RUNDY: 2/5 w tym ID (poprzednio: runda 1, DECISION_REQUIRED, bez pomiaru punktu 3 w pełnej postaci).

NASTĘPNY KROK (decyzja orkiestratora):
(a) zacommitować (lub odrzucić) evidence/w3-manual-auto-skip-r2.json i gra/tools/live-verify-w18-w24-manual-losses-r2-manual.cjs — według poleceń orkiestratora zostały niezacommitowane;
(b) jeśli właściciel chce ręcznego sterowania jednostkami w pomiarze: osobny temat z pointer-driverem (battle-manual-full-roster-pointer-live-test.cjs jako wzorzec) i z rosterem 10 vs 10 — wymaga decyzji o zmianie presetu w src (poza zakresem LIVE-VERIFY);
(c) zamknąć ID jako PASS-WITH-NOTES po akceptacji powyższych ograniczeń.

UWAGI-DLA-ORKIESTRATORA:
1. Wynik „ręczny" w tym pomiarze jest artefaktem driver-a bez rozkazów (patrz OBSERVACJE 1–3). Nie interpretować jako błąd balansu ani jako wynik gracza.
2. Skip i AUTO powtarzają się bit-w-bit z rundą 1 (P1, P2) — dobry sygnał powtarzalności tych trybów.
3. Dla pełnego pomiaru ręcznego potrzebny klik-po-klik (BLOKADA 1) — koszt: osobny temat z harness pointer; sugerowany priorytet: niski, dopóki właściciel nie zdecyduje o pomiarze ręcznym jako priorytecie.
4. Dysk/worktree: node_modules w gra/ i dist-r2 w scratchpad zostają do sprzątania orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
