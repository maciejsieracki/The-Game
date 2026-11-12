STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1
GOAL: liczniki rekrutacji trzymane przy otwartym panelu, zerowane po zamknięciu (Zamknij/Esc/tło); + dodatek właściciela: machiny oblężnicze bez zbadanej technologii niewidoczne.

DZISIEJSZE ZACHOWANIE (przed zmianą, z kodu):
- Panel zbiorczy (empireRecruitPanel.ts): `drafts` przeżywały zamknięcie (komentarz i test "liczniki przeżywają zamknięcie panelu"); zerował je tylko reset sesji (nowa gra/wczytanie).
- Sekcja Armia panelu imperium (cityPanel.ts armyRecruitDrafts + localStorage): szkice przeżywały zamknięcie panelu i odświeżenie strony; zerowane tylko po "Rekrutuj wszystko" (reszta) lub resecie sesji.
- Odświeżenia przy otwartym panelu nie ruszały liczników (zachowane).

ZMIANY (poza allowlistą dispatchu: main.ts i siege-engine-build.ts, uzasadnione dodatkiem właściciela):
- ui/empireRecruitPanel.ts: closeEmpireRecruitPanel() czyści drafts (Zamknij i toggle HUD).
- ui/cityPanel.ts: export clearArmyRecruitDraftsOnPanelClose() (pamięć + localStorage + wyłączenie przycisków).
- ui/empireDetailPanel.ts: hideEmpireDetailPanel() wywołuje go; Zamknij, Esc (overlay) i klik w tło idą tą jedną funkcją.
- game/siege-engine-build.ts + main.ts: isSiegeEngineTechUnlocked / visibleSiegeEngineOptions; lista "Zbuduj machinę w oblężeniu" pokazuje tylko machiny z odblokowaną technologią (reszta nieobecna, nie wyszarzona). Logika budowy (technology_locked) bez zmian.
- Testy: empire-recruit-panel-real-render (+4 sprawdzenia, zmieniona asercja), empire-mass-recruitment (+3), siege-engines-built-during-siege (+5).

TESTY (surowe wyjście):
- tsc --noEmit: exit 0
- empire-recruit-panel-real-render (Chromium): 29 passed, 0 failed; mutant no-reset-on-close: 3 FAIL
- empire-mass-recruitment: 48/0; mutant (usunięcie wywołania w hideEmpireDetailPanel): 1 FAIL
- empire-recruit-panel-no-inner-scroll 17/0; ui-resource-chip-no-raw-html 9/0; army-recruitment-concentration 30/0; recruit-card-quantity-real-render 25/0
- siege-engines-built-during-siege 33/0
- logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6
- Zrzut: panel-zbiorczy-przed-zamknieciem.png (w tym katalogu)

BLOKADY / ZAŁOŻENIA:
- Oryginalny 00-dispatch.md nie istnieje na origin/main; użyto DODATKU.
- Panel zbiorczy nie ma Esc/tła (tylko Zamknij/toggle HUD).
- Szkice w karcie miasta (recruitQuantityDrafts, domyślnie 1) są osobne, niewspółdzielone z panelami Armii; nie ruszane.
- "Na początku tylko Taran": Taran wymaga technologii Obróbka drewna (units.json); widoczność wynika z technologii. Czy gracz ma ją na starcie gry: NIE_ZMIERZONO.
- Pełny klik Esc/tło w panelu imperium w Chromium: NIE_ZMIERZONO (bramka źródłowa + test funkcji).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
