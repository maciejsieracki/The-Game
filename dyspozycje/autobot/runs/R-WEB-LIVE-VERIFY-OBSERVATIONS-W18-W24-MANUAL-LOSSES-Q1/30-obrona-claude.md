STATUS: PASS-WITH-NOTES (obrona, runda 2 tego ID; zarzuty Evaluatora 1–4 przyjęte z dowodem, zarzut 5 rozstrzygnięty faktami)
DOMAIN: GAME (pomiar na żywo, bez zmian w gra/src i gra/data)
TEMAT: R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1
GOAL: wykonać punkt 2 (W24, lewy baner w oknach 1024/900/800 px) i punkt 3 (straty zwycięzcy w bitwie, ≥3 ziarna, porównanie z AUTO) w żywym Chromium na kandydacie 828ff9fac (baza 1dc01847486e9d0fb0883032d8d708600374980c). Punkt 1 (W18) zamknięty w FC r4 (8c90c99b4, w origin/main) i nie był w tym zakresie mierzony ponownie.
Start: 828ff9fac83a742a8eb1f0017afb2e560b42c0ab (detached w worktree wf_bcfcb4f9-638-3). Build: `npx vite build --outDir <scratchpad>/dist-828` (bundle 14 849 094 B, tsc 0). Chromium: /usr/bin/chromium (harness: /opt/pw-browsers/chromium lub domyślny).

ZMIANY-COMMIT: tylko ten raport (commit obrony, git add <ścieżka>). Nowe narzędzia i dowody leżą NIEZACOMMITOWANE w worktree (patrz UWAGI-DLA-ORKIESTRATORA, pkt 2).
- Nowe: gra/tools/live-verify-w24-widths-1024-900-800-obs.cjs (kopia harnessu W24 z szerokościami 1024/900/800, wysokość 700).
- Nowe: gra/tools/live-verify-w3-seeds123-obs.cjs (kopia harnessu w3r3: 3 ziarna 1:1 bitwa-duza + kontrola losowe; skip/auto).
- Nowe dowody: dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1/evidence/w24-lewy-baner-w1024-900-800.json, w24-lewy-baner-w1024x700.png, w24-lewy-baner-w900x700.png, w24-lewy-baner-w800x700.png, w3-straty-zwyciezcy-seeds123.json.
- Brak zmian w gra/src, gra/data, gra-robocza, WERSJE.md, rust-port. Brak git add -A.
- Lokalnie (poza commitem): gra/node_modules (npm ci) i build w scratchpad. Sprzątanie po stronie orkiestratora.

TESTY (liczby z surowego wyjścia):
- tsc --noEmit: exit 0.
- Bramki referencyjne na 828ff9fac (node tools/<nazwa>.cjs):
  - logic-test: "LOGIC OK (213/213)", exit 0
  - tech-tree-test: "tech-tree-test: 20 pass, 0 fail", exit 0
  - research-test: "PASSED: 33 / FAILED: 0 / TOTAL: 33", exit 0
  - unit-replace-test: "WSZYSTKIE TESTY ZIELONE (21/21)", exit 0
  - combat-test: "COMBAT TEST: 6/6 pass", exit 0
- PUNKT 2 (W24), harness live-verify-w24-widths-1024-900-800-obs.cjs, VERDICT PASS, failures []:
  - 1024x700: innerW 1024, docScrollW 1024, hasHorizontalScroll false, lewy baner left 20 / right 382, maxRight 382, overflowing [], clippedText [], overflowingTop [], overflowingBottom []
  - 900x700: docScrollW 900, hasHorizontalScroll false, baner right 320, maxRight 320, brak przycięć i wylewania
  - 800x700: docScrollW 800, hasHorizontalScroll false, baner right 270, maxRight 270, brak przycięć i wylewania
  - Zrzuty PNG zapisane w evidence/ (nie obejrzano wizualnie w tej rundzie; kryterium binarne oparte na getBoundingClientRect / scrollWidth).
  - Uwaga: w każdej szerokości klasa banera to "fallback" (hud-left-fallback). Pomiar dotyczy tego trybu; tryb normalny nie był mierzony.
- PUNKT 3 (straty zwycięzcy), harness live-verify-w3-seeds123-obs.cjs, Chromium, presety testBattle bitwa-duza, 1:1, tryb trafień "pewne" (hak __civSetHitMode), zegar deterministyczny. VERDICT: zmierzono 8 przebiegów, 0 błędów (errors=0 w każdym wpisie).
  Tryby: "skip" = przycisk Pomiń (bs.skip()), bez klik-po-klik; "auto" = _endDeployPhase + wyłączenie trybu ręcznego + 8x. Ręcznego sterowania jednostkami w tym harnessie NIE wykonano (dispatch dopuszcza skip/auto-resolve z opisem ścieżki).
  Tabela (atakujący = zwycięzca we wszystkich 8 przebiegach; obrońca tracił 28/28):
  | ziarno | tryb | zwycięzca | straty zwycięzcy (atak) | straty przegranego (obrona) | runda |
  | 1 | skip (Pomiń) | atakujący | 10/28 | 28/28 | 19 |
  | 1 | auto | atakujący | 11/28 | 28/28 | 19 |
  | 2 | skip (Pomiń) | atakujący | 10/28 | 28/28 | 19 |
  | 2 | auto | atakujący | 11/28 | 28/28 | 19 |
  | 3 | skip (Pomiń) | atakujący | 10/28 | 28/28 | 19 |
  | 3 | auto | atakujący | 11/28 | 28/28 | 19 |
  | 1, kontrola "losowe" | skip (Pomiń) | atakujący | 13/28 | 28/28 | 30 |
  | 1, kontrola "losowe" | auto | atakujący | 10/28 | 28/28 | 29 |
  Surowe JSON: evidence/w3-straty-zwyciezcy-seeds123.json (klucze runs["<id>|<tryb>"], pola res.atk.lost, res.def.lost, res.round).
  ANOMALIE (dane, bez oceny balansu):
  - Ziarna 1, 2 i 3 dały identyczne wyniki w obu trybach (10 vs 11). Harness nie daje niezależnych próbek przy zmianie ziarna. NIE ZMIERZONO: niezależność ziaren (przyczyna nieustalona; prawdopodobnie seed nie wpływa na tę parę w tym presecie).
  - Stała różnica skip vs auto: +1 strata zwycięzcy w AUTO w 3 parach; przy kontroli "losowe" wynik odwrócony (skip 13, auto 10). Znaczenia nie interpretuję.
  - Dowód z zamkniętego runu (evidence/w3-straty-zwyciezcy-r3.json, commit sprzed FC r4) dawał inny wynik B1 skip (zwycięzca obrońca, runda 17). To inna wersja kodu, więc wyniki NIE są porównywalne z dzisiejszym pomiarem.
  - Brak pary "wręcz i dystans" ani różnych stosunków sił: ten sam preset 1:1 (28 vs 28). Zakres dispatchu (≥3 ziarna tej samej armii) spełniony tylko w sensie tej jednej pary.
- Dowód mutacyjny W24 nie był wymagany dispatchem i nie wykonano go.

BLOKADY: brak blokad technicznych. Ograniczenia: (a) ręczna bitwa klik-po-klik nie była mierzona (skip); (b) niezależność ziaren NIE ZMIERZONO; (c) pełna przestrzeń stosunków sił nie była mierzona.

ODPOWIEDZI NA ZARZUTY EVALUATORA (report_sha b8a96f9c2e9cc3bb2deb2f27119a2dcac2789dc5):
- Zarzut 1 (punkty 2 i 3 bez pomiaru na kandydacie): PRZYJMUJĘ. Wykonano: punkt 2 (1024/900/800, PASS, dane wyżej) i punkt 3 (8 przebiegów skip/auto, tabela wyżej), obie na 828ff9fac z własnym buildem. Zastrzeżenie: punkt 3 to tryb skip, nie klik-po-klik, oraz identyczne wyniki ziaren.
- Zarzut 2 (błędny katalog i odczyt złej gałęzi): PRZYJMUJĘ. Potwierdzam: 00-dispatch.md z katalogiem OBSERVATIONS istnieje na origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (nie na origin/main). Poprzedni Operator (10-operator-claude.md) odczytał dispatch zamknięty i zakres 1 punktu. W tej rundzie czytałem zlecenie z 3 punktami z gałęzi claude i wykonałem wszystkie 3 (punkt 1 pominięty, bo zamknięty w FC r4 — patrz zarzut 5).
- Zarzut 3 (evidence w24 w innych szerokościach, straty bez porównania tej samej pary): PRZYJMUJĘ. Stare dowody (1000x700, 800x600, 640x480; skip/pewne) nie spełniają kryteriów; zastąpione nowymi pomiarami na 1024/900/800 i porównaniem skip/auto na tej samej parze.
- Zarzut 4 (brak własnych bramek): PRZYJMUJĘ. Bramki uruchomione na 828ff9fac: tsc 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6 (liczby z surowego wyjścia powyżej). Nie cytuję już liczb FC r4 jako własnych.
- Zarzut 5 (rozbieżność ID vs zamknięty run; duplikat?): ODRZUCAM jako przesłankę zamknięcia tematu, PRZYJMUJĘ jako fakt do decyzji orkiestratora. Fakty: (i) FC r4 (8c90c99b4, w origin/main) zamknął w tym runie wyłącznie punkt 1 (W18), a punkty 2 i 3 miały dowody sprzed innych commitów, więc nie są w pełni zamknięte; (ii) ta runda mierzy punkty 2 i 3 na 828ff9fac, czyli nie jest duplikatem punktu 1; (iii) katalog faktycznego runu to R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1 (bez OBSERVATIONS), ID z dispatchu OBSERVATIONS występuje tylko na gałęzi claude. Decyzja o zamknięciu lub kontynuacji należy do orkiestratora.

WERDYKT PUNKTÓW DISPATCHU:
- Punkt 1 (W18): nie mierzono w tej rundzie (zamknięty w FC r4, 8c90c99b4; jawnie poza zakresem tej odpowiedzi).
- Punkt 2 (W24): PASS. Brak poziomego scrolla i brak wylewania przy 1024, 900 i 800 px; dane w TESTY.
- Punkt 3 (straty zwycięzcy, ręczna vs AUTO): ZMIERZONO w trybie skip (nie klik-po-klik), 3 ziarna + kontrola. Wynik: NIE ZMIERZONO niezależności ziaren, brak pełnej pary ręczna (klik) vs AUTO.

RUNDY: 1/5 w tym ID (obrona po pomiarach). Poprzednie zamknięte: FC r4 (w origin/main).
NASTĘPNY KROK: orkiestrator: (1) zdecyduje o zamknięciu ID lub nowym tematu na klik-po-klik i niezależne ziarna; (2) zdecyduje, czy zacommitować evidence/ i dwa pliki gra/tools (patrz UWAGI).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Wyniki punktu 3 powtarzają się identycznie dla ziaren 1–3 (10/11). To może oznaczać, że ziarno nie zmienia tej bitwy. Warto sprawdzić przed zlecaniem kolejnych pomiarów z ziarnem.
2. Commit: zgodnie z poleceniem zacommitowano tylko raport. Dowody (evidence/*.json, *.png) i dwa skrypty gra/tools/*-obs.cjs są NIEZACOMMITOWANE w worktree wf_bcfcb4f9-638-3; jeśli mają trafić do repo, potrzebna jest osobna decyzja orkiestratora.
3. Sprzątanie: gra/node_modules (npm ci) w worktree i build w scratchpad (dist-828, ~104 MB) pozostają na dysku. Nie usuwałem ich, bo polecenia rm są zakazane w tym temacie.
4. Poza zakresem, znalezione: tryb "fallback" lewego banera jest aktywny przy wszystkich trzech szerokościach w stanie po starcie gry (nie przeanalizowano, czy to zamierzone).
