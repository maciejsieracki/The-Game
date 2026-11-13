STATUS: BLOCK (kod i testy gotowe; brak pomiaru w realnej grze PRZED/PO oraz regresji real-render z buildem vite)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1
GOAL: Panel WYDARZENIA: zamiast chipa "Inne cyw." trzy zakładki Dyplomacja / Ważne / Inne; przycisk "Zamknij wszystkie informacyjne" nad zakładkami; usunięcie komunikatów zbędnych (nowy szlak, wycinka, auto-ulepszenia, "Dotarło do celu") u źródła; logika gry bez zmian.

ZMIANY/COMMIT:
- Kod: 28ad61e50 (baza: origin/main 80919e2ae, detached).
- gra/src/ui/sidePanelEventTabs.ts (NOWY): eventTabOf(ev) -> dyplomacja | wazne | inne; defaultSidePanelTab. Kolejność reguł: (1) kind diplo / origin other-civs / tytuł "Dyplomacja" -> dyplomacja; (2) blocking, kind enemy, lub tekst o magazynie/kapitulacji/oblężeniu/braku/głodzie/armii/buncie/stratach -> wazne; (3) reszta -> inne.
- gra/src/ui/sidePanelEventFilter.ts: filterSidePanelEventsByTab (zastępuje filtr chipa).
- gra/src/ui/sidePanelHud.ts: stan activeTab (domyślnie wynika z zawartości, dopóki gracz nie kliknie); karty blokujące zawsze na górze, zakładki filtrują tylko informacyjne; licznik zakładek; przycisk "Zamknij wszystkie informacyjne" nad zakładkami; CSS .sp-tabs/.sp-tab; chip usunięty.
- gra/src/main.ts (tylko emisja): usunięto pętlę "Nowy szlak handlowy" (toast + karta + kotwica), toast "Wycinka: +N Drewna" (zapis drewna z capem zostaje), toasty "Auto ulepszenie(ia)" (sygnał o nadwyżce Pracy zostaje), toast "Dotarło do celu" (delete marszu zostaje). Zerwanie szlaku ("Szlak handlowy zerwany") NIE usunięte -> zakładka Inne.
- Testy: NOWY gra/tools/sidepanel-notification-tabs-test.cjs (28/28); zaktualizowane z uzasadnieniem: sidepanel-events-toolbar-test (20/20), wycinka-drewno-cap-test (13/13), trade-routes-hud-filter-test (58/58; dodano stampEventTurn do harnessu, bo pushOnce go wołał), wyrab-wycinka-nazwa-live-test [3], sidepanel-hud-deadzone-test sekcja B (klik zakładki zamiast chipa; nieuruchomiony, patrz BLOKADY).
- Zrzuty harnessu (prawdziwy createSidePanelHud w Chromium, bez zmian w repo): zrzut-zakladka-wazne.png, zrzut-zakladka-inne.png, zrzut-zakladka-dyplomacja.png w tym katalogu (~40 KB każdy). Układ potwierdzony: przycisk nad zakładkami, liczniki 2/2/3, blokująca karta na górze.

TESTY:
- tsc --noEmit (gra/): EXIT=0.
- Zielone: sidepanel-notification-tabs-test, sidepanel-events-toolbar-test, wycinka-drewno-cap-test, trade-routes-hud-filter-test, eot-event-defer-test, eot-diplomacy-header-test, events-one-turn-lifetime-test, important-event-cards-test, important-event-cards-regression-test.
- Czerwone przed zmianą testu, zielone po aktualizacji: trade-routes (R2-K4/R2-D/R2-MARITIME, nowe trasy nie generują toastu), wyrab-wycinka [3], wycinka [1].
- Czerwone, NIE związane z tą zmianą: wyrab-wycinka-nazwa-live-test [11] (sanity liczy 3 dozwolone frazy "wyrąb", w HEAD src jest 1; moje zmiany nie dotykają tekstu z "wyrąb"); sidepanel-event-header-wydarzenie-real-render-test (TypeError w assertReport, real-render na buildzie vite).
- Niewykonane z powodu środowiska (timeout 200 s / Target closed w fallbacku chromium-1194): sidepanel-blocking-card-cutoff-real-render, sidepanel-diplo-dismiss-real-render, sidepanel-hud-deadzone (sekcja B zaktualizowana, nieuruchomiona), eot-*/end-turn-* live. Nie wykonano npm run build/dev.
- Mutacje: nie wykonano osobnego zestawu; strażnik tekstowy w sidepanel-notification-tabs-test (main.ts nie zawiera usuniętych komunikatów) działa jako bramka regresji.
- RED/GREEN: testy klasyfikacji napisano po kodzie (nie RED-first).

BLOKADY:
1. NIE_ZMIERZONO: pomiar "ZMIERZ PRZED" (2 ziarna x >=30 tur w grze, tabela wg typu/źródła) nie został wykonany. Nie wiem więc, ile komunikatów per tura trafiało do panelu przed zmianą.
2. NIE_ZMIERZONO: weryfikacja PO w realnej grze (2 ziarna x 30 tur, zero usuniętych komunikatów w panelu) nie wykonana.
3. Regresje real-render (vite build) nie uruchomione do zielonego wyniku.
4. Brak osobnych mutacji dla eventTabOf.

DECYZJE ZAŁOŻONE (do potwierdzenia przez orkiestratora, nie pytania ABC):
- "Zamknij wszystkie informacyjne" zamyka informacyjne We WSZYSTKICH zakładkach (jak dotąd), nie tylko w aktywnej. Etykieta bez zmian.
- Karty blokujące (decyzje, bunt, produkcja pusta, dyplomacja-decyzja) widoczne zawsze ponad zakładkami; zakładka Dyplomacja nie pokazuje blokujących kart dyplomacji w liście (są na górze).
- Szlak "zerwany" -> Inne (nie usunięty), bo to informacja o utracie, nie o nowym szlaku; do decyzji właściciela.
- "Automat ulepszeń: nadwyżka budżetu Pracy…" (tip) zostaje i trafia do Inne.
- Zakładka domyślna: Ważne gdy są wpisy, inaczej Dyplomacja, inaczej Inne; po kliknięciu gracza wybór zostaje w sesji (nie w save).
- Fixture "Nowy szlak handlowy" w sidepanel-event-przekierowania-real-render-test zostaje (seed bezpośrednio do renderu, nie przez silnik).
- eot-event-defer.ts: bez zmian w kodzie (komentarze nadal wspominają chip "Inne cyw.").

NASTĘPNY KROK: (1) pomiar PRZED/PO na dwóch ziarnach w Chromium (nohup, log JSONL poza repo) i tabela źródeł; (2) build vite poza repo (tylko Chromium) i uruchomienie sidepanel-*-real-render-test; (3) Evaluator + Final Control; dopiero potem integracja.

DEPLOY/PUSH: NIE WYKONANO
