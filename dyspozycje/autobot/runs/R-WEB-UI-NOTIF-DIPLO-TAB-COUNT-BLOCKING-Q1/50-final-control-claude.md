STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1
GOAL: licznik zakładki „Dyplomacja" wlicza blokujące propozycje diplo, lista zakładki pokazuje te karty; bez zmian pozostałych liczników i kart blokujących nie-diplo.
ZMIANY/COMMIT: kandydat 27548a1466ae772aec2e4a126074fcebcc23b351 (kod a09b926dc; baza 501f78c08 jest jego przodkiem — `merge-base --is-ancestor` OK; origin/main db7084ea9 zawiera bazę; pliki kandydata nie nakładają się na zmiany main od bazy w sidePanel*). Allowlista: gra/src/ui/sidePanelEventFilter.ts, gra/src/ui/sidePanelHud.ts, gra/tools/notif-diplo-tab-count-blocking-test.cjs, runs/<ID>/** — zgodna, brak plików spoza listy. Ten raport: commit nad 27548a146.

TESTY (surowe wyjścia, w moim worktree, gra/ po `npm ci --ignore-scripts`):
- tsc --noEmit: exit 0
- notif-diplo-tab-count-blocking-test: 25 OK, 0 FAIL, exit 0; na bazie (src/ui z 501f78c08): exit 1, FAIL „tabSourceEventsOf nie jest wyeksportowane" (czerwony)
- logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/0; unit-replace-test 21/21; combat-test 6/6 (wszystkie exit 0)
- sidepanel-event-tabs-classify-test: PASS; sidepanel-diplo-dismiss-real-render-test (Chromium, build vite): 35 pass, 0 fail
- git diff --check 501f78c08..kandydat: czysto
- LIVE Chromium (własny skrypt scratch, build vite kandydata, ?playtest=mapa, seed: diplo blocking + enemy blocking): start: zakładki „Dyplomacja 1 / Ważne 0 / Inne 0", nagłówek „2 wymagają decyzji"; po kliknięciu „Dyplomacja": lista zawiera kopię karty (`sp-no-link sp-mirror`, bez ✕) obok oryginału blokującego (z ✕) nad zakładkami; karta enemy nie liczona; pageerror: brak. Zrzut: scratchpad/diplo-tab.png (nie obejrzany wizualnie; dowód z DOM). Nie jest to scenariusz war/T17 z pełną propozycją AI (seed zdarzeń, nie realna propozycja).

ZARZUTY:
1. (test nie obejmuje okablowania HUD) — ODDAL/zaakceptowane: rachunek przeniesiony do czystej sidePanelTabModelOf, test sekcja (7); mutacja starego okablowania obrony: 3 FAIL. Pozostałe ryzyko: HUD mógłby ominąć model (moja mutacja bezpośrednia w hud.ts nie jest łapana przez test czysty) — pokryte live w Chromium (dowód wyżej). Nota, nie NAPRAW.
2. (brak live) — ODDAL: live Chromium wykonany przeze mnie (wyżej), liczba i lista zgodne; T17 war pełny NIE_ZMIERZONO.
3. (dublowanie karty, nagłówek) — ODDAL: dublowanie to opcja 1 dispatchu (zachowuje widoczność decyzji); kopia bez ✕ i bez Escape (tabMirror), nagłówek „N wymaga decyzji" liczy tylko blokujące; „N informacyjnych" nie liczy kopii — zamierzone, bez decyzji produktowej.
Brak zarzutu NAPRAW.

BLOKADY: brak. NOTY: (a) duplikat data-id (oryginał + kopia) w DOM — przy akcjach po data-id selektory biorą pierwszy; zaobserwowano brak błędów; (b) scenariusz war/T17 z realną propozycją AI NIE_ZMIERZONO; (c) przy braku wpisów informacyjnych zakładka domyślna to „Inne" (jak dotąd), licznik Dyplomacja=1 widoczny.
UWAGI-DLA-ORKIESTRATORA: integrować przez merge/cherry-pick 27548a146 (+ ten raport) na aktualny main db7084ea9; dispatch 00-dispatch.md jest tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 i w commitach kandydata. Sprzątanie: gra/node_modules i gra/dist-sp-diplo-dismiss-test w worktree FC (ignorowane przez git).
RUNDY: FC 1 (z 5).
NASTĘPNY KROK: integracja orkiestratora, bramki na wyniku merge, deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
