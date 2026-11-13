STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-NEWGAME-ADV-APPLY-BTN-Q1
GOAL: Przycisk stopki „Zaawansowane opcje” ma nazywać się „Zastosuj” i być aktywny; klik zapisuje wartości i zamyka okno.
ZMIANY/COMMIT: d05ef33a2 (kod + test + bramki + zrzuty), commit raportu w kolejnym SHA. Allowlista: gra/src/ui/newGameFlow.ts (CSS l.1111-1113 `.adv-close` + hover/focus; stopka l.1922 etykieta „Zastosuj”, type=button; handler `hideAdvancedModal` bez zmian), gra/tools/newgame-adv-apply-btn-test.cjs (nowy), runs/R-WEB-NEWGAME-ADV-APPLY-BTN-Q1/**. Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, main.ts.
DIAGNOZA (a, Chromium, bundle z 5ab3d58e2): klik „Zamknij” zamyka okno, zapisuje `civ-new-game-prefs-v1` (advanced), wartość po ponownym otwarciu zachowana; przycisk nie jest disabled, pointer-events=auto, elementFromPoint trafia w przycisk; brak błędów JS (w 1280x720, 1280x600, 853x480@DPR1.5). PRZYCZYNA „nie działa” = wizualna: przezroczyste tło, szary tekst i obramowanie (`.adv-close`, stary l.1111) — przycisk wygląda na nieaktywny. Uwaga: emulacja zoomu przez CSS `zoom` na html przesuwa stopkę poza viewport (vh nie jest skalowane) — to artefakt emulacji, nie błąd; właściwą emulację 150% zrobiono przez DPR 1.5.
TESTY:
- tsc --noEmit: PASS (EXIT=0), gate-tsc.txt
- newgame-adv-apply-btn-test.cjs: 42 OK / 0 FAIL na 3 konfiguracjach (1280x720@100, 1280x600@100, 1280x720@150); gate-newgame-apply-btn.txt
- mutacja (etykieta Zastosuj→Zamknij w kopii bundla): 6 FAIL, EXIT=1 — test pada
- newgame-settings-layout-reposition-test: PASS (gate-layout-reposition.txt; wymagany PLAYWRIGHT_CHROMIUM_EXECUTABLE, bo test ma zahardkodowane /usr/bin/chromium)
- zrzuty obejrzane: evidence/adv-zastosuj-1280x720-150.png (przycisk „ZASTOSUJ”, złoty, widoczny)
BLOKADY:
- newgame-adv-tooltip-test: NIE ZMIERZONO (test sam buduje bundle; SIGKILL/OOM dwukrotnie, maszyna współdzielona; gate-adv-tooltip.txt).
- Bramki bazowe (newgame-bottom-navigation, diplo-truce-r1 30, diplomacy 148, war-era-counter 82) NIE ZMIERZONO — brak pamięci/miejsca na dysku w trakcie; nie przed, nie po zmianie.
- Mutacja handlera (usunięcie listenera) NIE ZMIERZONO; wykonano tylko mutację etykiety.
- Zrzut 100% nie był oglądany (nadpisany przez run mutacji, odtworzony w kolejnym runie; Evaluator powinien obejrzeć).
ZAŁOŻENIA:
- „Zastosuj” = zapis + zamknięcie (istniejąca ścieżka). Okno nie ma obsługi Escape (brak w kodzie) — nie dodawano.
- Klik w tło zachowuje dotychczasowe zachowanie (zamknięcie + zapis).
- Testy miasta-panstwa / battle-mode używają selektora klasy `.adv-close` (nie etykiety) — nie wymagały zmian; nie uruchamiane.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5): niezależny przegląd i powtórzenie bramek NIE ZMIERZONO (adv-tooltip, bazowe) w czystym środowisku; obejrzeć oba zrzuty; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
