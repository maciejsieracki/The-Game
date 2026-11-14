STATUS: BLOCK (punkt 1 nadal NIE zmierzony w stanie blokady; punkt 2 nie wykonany na żywo; zarzuty 1–4, 6–9 przyjęte, zarzut 10 przyjęty jako fakt, zarzut 5 przyjęty)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1 — obrona (Operator HAIKU), odpowiedź na raport Evaluatora 17ab436a3 (runda 1/5 → obrona)
GOAL: dowód w żywej grze (Chromium, bundle vite poza repo, ?civTest=1): (1) bramka „Zakończ turę” w turze ≥11 przy ujemnym skarbcu blokuje, title zawiera zasób/minus/dźwignie, klik nie kończy tury, po naprawie tura się kończy, tury 1–10 bez blokady, brak zakleszczenia; (2) okno „Umowa wymiany surowców” bez przeładowania, obie strony wypełnialne, podpowiedź przy pustej stronie, zrzuty przed/po.
BAZA: 17ab436a3 (gałąź wf-obrona-a-q1 od Evaluatora; kandydat bd13861c2 jest jego przodkiem). Kod gry NIE zmieniany (gra/src, gra/data bez zmian).
ZMIANY-COMMIT: nowy plik gra/tools/live-verify-wave-689-697-a-gate-v2.cjs (allowlista: gra/tools/live-verify-wave-689-697-a-*.cjs); evidence: runs/R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1/evidence/obrona-r2/ (wyniki JSON, stdout, zrzut resetu). Bundle zbudowany do scratchpada (vite build exit 0, 19.17 s, 102 MB poza repo). node_modules: symlink do worktree wf_5013b08f-b6e-2 (poza commitem). Commit tylko tych ścieżek (bez -A).
TESTY (liczby z surowego wyjścia):
- vite build --outDir <scratchpad>/dist-obr: exit 0, "✓ built in 19.17s".
- Pomiar v1 (live-verify-wave-689-697-a-gate.cjs, ponowiony): exit 0, P1a canEnd=true przy turze 5 (dosypka −200 000 cofnięta przed endTurn); P1b: sweep 400 kroków po 50 = łącznie 20 000 dosypek, canEnd cały czas true (brak blokady); P1c: po +1000 klik kończy turę 11→12. Wynik v1 NIE mierzy blokady (patrz BLOKADY/2).
- Pomiar v2 sweep, krok 5000, 400 kroków (2 000 000): brak blokady, brak przejścia canEnd (surowy stdout: sweep-stdout.txt).
- Pomiar v2 sweep, krok 500 (4 uruchomienia, seed 11): przejście canEnd true→false przy łącznej dosypce 147 000 / 142 000 / 137 000 / 132 000 (zmienne między uruchomieniami); w każdym przypadku w tej samej chwili: TURA 1, awaitingFirstCity=true (sweep4-result.json, result-sweep-seed11.json).
- Pomiar v2 sweep z dodatkową dosypką +50 000 na starcie: przejście przy 152 000 (sweep-pre50000-result.json). Przesunięcie progu ~+5…+15 tys., nie +50 tys. — próg nie jest stały.
- Kontrola „czy strona przeładowana”: znacznik window.__obrMarker ustawiony przed sweepem PRZETRWAŁ przejście (przeglądarka nie przeładowała strony; zmiana jest w obrębie tego samego dokumentu).
- Zrzut sweep-reset-turn1-skarbiec-minus77k.png (OBEJRZANY): HUD „Skarbiec −77K”, „TURA 1 · 4000 P.N.E.”, panel „ZAŁÓŻ MIASTO — kliknij podświetlony hex”, „Załóż miasto FREE (pierwsze miasto)”, przycisk „ZAKOŃCZ TURĘ” wyszarzony. To stan świeżej gry bez miasta, nie stan bramki.
- DOM w chwili przejścia (sweep-stdout / domHit): tekst „TURA 11 · 3500 P.N.E.” w jednej chwili z nakładką „Tworzenie świata · Standardowy · Kontynenty 9/9”. Nakładka generacji mapy pojawia się w trakcie trwającej partii — to wskazuje na ponowne uruchomienie nowej gry w tej samej stronie, nie na przeładowanie.
- Kryterium 1 — tooltip (title) w stanie blokady: NIE_ZMIERZONO (stan blokady nie został osiągnięty bez resetu gry).
- Kryterium 1 — klik nie kończy tury w blokadzie: NIE_ZMIERZONO (j.w.; w sweep klik nie był wykonany, bo blokada była artefaktem resetu).
- Kryterium 1 — tury 1–10 bez blokady przy tym samym deficycie: NIE_ZMIERZONO w tej rundzie (tryb check nie uruchomiony; v2 ma tryb --mode check, nieuruchomiony z powodu BLOKADY/2).
- Kryterium 1 — dźwignie (podatek, racje, rozwiązanie jednostki): NIE_ZMIERZONO (kod: gra/src/game/no-negative-stocks.ts decideEndTurnGate — blokada tylko gdy czyRuchNaprawczy, czyli dźwignie pokrywają brak; to fakt z kodu, nie pomiar).
- Kryterium 1 — naprawa i zakończenie tury: częściowo (v1 P1c, PASS tylko przy naprawie hakiem grantPlayerGold, a nie dźwignią UI).
- Kryterium 2 — okno wymiany: NIE_ZMIERZONO na żywo (nie wykonano w tej rundzie; jsdom 19/19 z raportu operatora nie jest dowodem live).
- LINT: git diff --check — do wykonania przed commitem (patrz sekcja NASTĘPNY KROK wykonane przy commicie).

BLOKADY:
1. Gra restartuje partię w tej samej stronie przy głębokim deficycie skarbca (poniżej ok. −77K w HUD, przejście przy dosypce 132–152 tys.). Po przejściu: TURA 1, brak miasta, nakładka „Tworzenie świata”, HUD Skarbiec −77K. Dopóki to trwa, bramka nie jest mierzalna. Przyczyna NIE ustalona: w kodzie nie znaleziono wywołania doStartGame poza kreatorem Nowa gra (main.ts 27109/27156) i przycisków victory/defeat (location.reload, main.ts 35370/45023). Nie jest to reload (znacznik przetrwał). Kandydat na defekt — patrz UWAGI-1. Nie naprawiano (zakaz zmian gra/src).
2. Hak grantPlayerGold dosypuje złoto do ps.skarbiec gracza (main.ts 31590); nie ma odczytu skarbca gracza poza HUD (snapshot zwraca tylko AI). Odczyt skarbca w pomiarze = tekst HUD, nie wartość liczbowa z gry. Przyjęte jako ograniczenie pomiaru.
3. Dźwignie UI (podatek, racje, rozwiązanie jednostki) nie są klikane — naprawa tylko hakiem. NIE_ZMIERZONO dla dźwigni.
4. Okno wymiany (punkt 2): brak haka otwarcia okna przez UI w tej rundzie; czas i dysk (po buildzie ~736–761 MB wolnego, poniżej progu 4 GB z dispatchu) ograniczyły zakres.
5. Dodatek 00-dispatch-DODATEK-claude.md dla A-Q1 nie istnieje (sprawdzone: git ls-tree origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 dla katalogu A-Q1 — tylko 00-dispatch.md; origin/main nie ma katalogu A-Q1). Przyjęte założenie: kryteria z 00-dispatch.md.

ODPOWIEDZI NA ZARZUTY EVALUATORA (17ab436a3):
| nr | zarzut | odpowiedź | dowód |
|---|---|---|---|
| 1 | P1b.title pusty, brak dowodu tooltipa | PRZYJMUJĘ. Nadal brak: title odczytany tylko w stanie resetu (title=""), nie w blokadzie | sweep-stdout.txt: blocked_button.title="" przy TURA 1 |
| 2 | pomiar nieważny, gra cofnęła się do TURA 1 | PRZYJMUJĘ. Potwierdzone 4 uruchomieniami; canEnd=false wynika z awaitingFirstCity, nie z bramki | sweep4-result.json: turn 1, awaitingFirstCity true |
| 3 | tury 1–10 — tylko P1a, skarbiec z grant | PRZYJMUJĘ. Tryb check (tury 1–10 przy tym samym T) nie został uruchomiony | v2 --mode check: niewykonany |
| 4 | BASELINE_TREASURY_T11=150000 wpisane z góry | PRZYJMUJĘ. W v2 usunięto stałą; sweep liczy łączną dosypkę, nie saldo | gra/tools/live-verify-wave-689-697-a-gate-v2.cjs (brak BASELINE) |
| 5 | dźwignie nie zmierzone; naprawa hakiem | PRZYJMUJĘ. Dźwignie NIE zmierzone; fakt z kodu: blokada tylko gdy dźwignie pokrywają brak (no-negative-stocks.ts decideEndTurnGate, linia ~450) | kod |
| 6 | punkt 2 nie wykonany live | PRZYJMUJĘ. NIE_ZMIERZONO w tej rundzie | brak plików punktu 2 |
| 7 | zrzuty pokazują TURA 1 / Załóż miasto | PRZYJMUJĘ. Zrzut blocked z v1 był stanem resetu; nowy zrzut sweep-reset-turn1-skarbiec-minus77k.png obejrzany i potwierdza ten sam stan | evidence/obrona-r2/*.png |
| 8 | raport podaje −18 600 i −101 500, evidence tylko 168 600 | PRZYJMUJĘ. Wartości −18 600 i −101 500 WYCOFUJĘ jako niepotwierdzone. Dla obrony r2 liczby są tylko z surowych wyjść w evidence/obrona-r2 | evidence/obrona-r2/*.json |
| 9 | UWAGI-1 bez diagnozy; możliwy artefakt harnessu | PRZYJMUJĘ, z ustaleniami: NIE jest reload strony (znacznik przetrwał); pojawia się nakładka „Tworzenie świata” i HUD Skarbiec −77K w świeżym stanie TURA 1. Przyczyny nie ustalono; może być defektem gry albo artefaktem harnessu — rozstrzyga orkiestrator (UWAGI-1). | sweep-reset-turn1-skarbiec-minus77k.png; log transitions z domHit |
| 10 | dodatek dla A-Q1 nie istnieje | PRZYJMUJĘ jako fakt (sprawdzone ls-tree i git show na origin/main i origin/claude). Założenie: kryteria z 00-dispatch.md | git ls-tree / git show (fatal: path does not exist) |
| 11 | twarda ścieżka /opt/node22/... i połykanie timeoutów | CZĘŚCIOWO PRZYJMUJĘ: v2 zachowuje fallback require('playwright') → /opt/node22/... (nie naprawione w tej rundzie); v2 nie połyka timeoutów przy starcie bez logu (fatal zapisywany) | gra/tools/live-verify-wave-689-697-a-gate-v2.cjs |

UWAGI-DLA-ORKIESTRATORA:
UWAGI-1 (KANDYDAT NA DEFEKT — NIE zweryfikowany co do przyczyny): w grze, przy dosypce ujemnej do skarbca gracza rzędu 132–152 tys. (w tej samej partii, bez zakończenia tury, z wyłączonym renderem), gra przechodzi do świeżego stanu „TURA 1 · 4000 P.N.E.” bez miasta gracza, z nakładką „Tworzenie świata” i HUD „Skarbiec −77K”. Nie jest to przeładowanie strony. Wymaga osobnego tematu R-WEB-* (diagnoza: czy restart ma źródło w grze, np. warunek utraty/restartu partii przy skarbcu < 0, czy artefakt haka grantPlayerGold). Zablokowało to punkt 1.
UWAGI-2: decideEndTurnGate blokuje tylko, gdy dźwignie pokrywają brak (kod). Zachowanie „brak zakleszczenia” jest więc z założenia kodu, nieze zmierzone live. Do potwierdzenia po rozwiązaniu UWAGI-1.
UWAGI-3: próg przejścia nie jest stały między uruchomieniami (147k/142k/137k/132k przy tym samym seedzie) — niedeterminizm w stanie partii wpływający na moment resetu; warto zgłosić, bo narusza założenie powtarzalności pomiaru.
UWAGI-4: nie wykonano punktu 2 ani trybu check; dispatch wymaga dysku ≥4 GB — wolne ~0,74–0,76 GB przy starcie.

RUNDY: 2/5 (obrona). Brak zmian w grze. Dalsza runda wymaga decyzji orkiestratora: najpierw UWAGI-1 (osobny temat), potem punkt 1 (check + blokada) i punkt 2.
NASTĘPNY KROK: (a) orkiestrator decyduje o osobnym tematie dla UWAGI-1; (b) po jego rozstrzygnięciu ponowić tryb check (tury 1–10 przy T) i sweep z odczytem przejść; (c) punkt 2 osobnym runnerem z oknem wymiany i porównaniem identyczności węzła DOM.
DEPLOY/PUSH: NIE WYKONANO (brak READY_FOR_DEPLOY; nie pushowano; commit tylko na gałęzi lokalnej wf-obrona-a-q1).
