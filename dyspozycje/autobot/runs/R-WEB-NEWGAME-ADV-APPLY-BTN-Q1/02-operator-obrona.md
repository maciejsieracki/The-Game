STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-NEWGAME-ADV-APPLY-BTN-Q1
GOAL: Przycisk stopki „Zaawansowane opcje” ma nazywać się „Zastosuj” i być aktywny; klik zapisuje wartości i zamyka okno.
ZMIANY/COMMIT: Obrona Operatora (R1, odpowiedź na zarzuty Evaluatora). Kod bez zmian względem aee6ca12a (poprawka). Zmiany w tej rundzie: gra/tools/newgame-adv-apply-btn-test.cjs (macierz 6 konfiguracji, brak zahardkodowanej ścieżki Chromium, sprzątanie w finally), zrzuty evidence/ (6 plików), gate-*.txt (regenerowane, EXIT na pierwszej linii). SHA: patrz commit obrony (sekcja NASTĘPNY KROK). Allowlista: brak zmian w gra/src, gra-robocza, WERSJE.md, rust-port, src-tauri, main.ts.
SHA REFERENCJI: kod = aee6ca12a (fix), raport Operatora = 5a0b4a5fa, ocena = 921a0f594 (wip). d05ef33a2 (cytowany w 01-operator-r1.md) NIE jest przodkiem 921a0f594; to osobny commit z innej gałęzi worktree (wf_ed8b4729-45e-1). Oryginał 01-operator-r1.md nietknięty; korekta tutaj.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ (log). gate-newgame-apply-btn.txt regenerowany na 921a0f594: EXIT=0, 87 OK / 0 FAIL (6 konfiguracji + klik w tło). Stary log „42 OK” usunięty.
2. PRZYJMUJĘ (log). gate-adv-tooltip.txt regenerowany: EXIT=0, 31 pass / 0 fail. Dopisane gate-newgame-bottom-navigation.txt (270/0), gate-diplo-truce-r1.txt (30/0), gate-diplomacy.txt (148/0), gate-war-era-counter.txt (82/0), gate-layout-reposition.txt (PASS). NIE_ZMIERZONO: te bazowe liczby mierzono na 921a0f594 (z poprawką), nie na 5ab3d58e2 obok siebie; zgadzają się z liczbami referencyjnymi z dispatchu.
3. PRZYJMUJĘ (SHA). Poprawna referencja kodu: aee6ca12a (patrz wyżej).
4. PRZYJMUJĘ (dowód). Test zapisuje 6 zrzutów: evidence/adv-zastosuj-{1280x720,1280x600,853x480}-{100,150}.png. Obejrzałem adv-zastosuj-853x480-150.png: przycisk „ZASTOSUJ” złoty, widoczny, nieucięty. Pozostałe 5 do obejrzenia przez Evaluatora (NIE_ZMIERZONO przeze mnie).
5. PRZYJMUJĘ CZĘŚCIOWO. Realny bundle zbudowany: `vite build` do scratch, EXIT=0; index.html (singlefile) zawiera `Vo("button","adv-close","Zastosuj")`. Test nadal używa harnessu esbuild ze stubami (jak layout-reposition). Zasłonięcie przez elementy pełnej aplikacji (z-index, HUD) w pełnej grze: NIE_ZMIERZONO — ryzyko rezydualne.
6. PRZYJMUJĘ (poprawka). Usunięto fallback /usr/bin/chromium. Start: domyślny Chromium Playwrighta, a gdy podano, ścieżka z PLAYWRIGHT_CHROMIUM_EXECUTABLE. Cały przebieg w try/finally: zamknięcie przeglądarki i serwera HTTP nawet po FATAL; FATAL liczy się jako FAIL (brak wiszącego procesu).
7. PRZYJMUJĘ (log). Mutacja usunięcia addEventListener (kopia src w scratch, ADV_EVIDENCE_DIR przekierowany): gate-mutation-apply-btn-handler-removed.txt, EXIT=1, 63 OK / 12 FAIL. Mutacja etykiety (6 FAIL) z R1 pozostaje w 01-operator-r1.md.

RUNDY: 1/5 (obrona Operatora w rundzie 1; bez nowego FAIL)
BLOKADY: NIE_ZMIERZONO: pełna aplikacja w bundlu (zasłonięcie); newgame-sett-grid-layout-test (6/8 fail, według Evaluatora identycznie na bazie, nie przeze mnie zmierzone). Brak.
ZAŁOŻENIA: Escape nie istnieje w oknie (brak w kodzie) — nie dodawano. Klik w tło = zapis + zamknięcie, bez zmian.
NASTĘPNY KROK: Evaluator (Sonnet 5.5): odtworzyć bramki z commita obrony, obejrzeć 6 zrzutów, potwierdzić korektę SHA; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
