STATUS: INFRA (implementacja gotowa; bramki przeglądarkowe nie domknięte z powodu pamięci hosta)
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-NEWGAME-DEFAULTS-Q1
GOAL: Nowe domyślne ustawienia nowej gry (świeży profil): bitwy ręczna+auto, koszty budynków/jednostek, wzrost ludności, zasięg ruchu = Normalny; trudność miast-państw = Normalny (jawnie); udział lądu 30% dla Kontynenty/Pangea/Wyspy; Ziemia bez zmian i bez suwaka.
ZMIANY-COMMIT: 9c3d921db (kod + test + gate-*.txt + evidence/). Commit raportu: patrz odpowiedź orkiestratorowi.
- gra/src/ui/newGameFlow.ts: DEFAULT_ADVANCED (l.243-258); hint udziału lądu (l.~1717); hint trudności miast-państw; renderSettingRows l.1620 — ukrycie suwaka landFraction dla Ziemi.
- gra/src/map/newGameMapDefaults.ts: defaultLandFractionPercentForTyp -> 30 dla typów innych niż ziemia.
- gra/tools/newgame-defaults-test.cjs (nowy): świeży profil, 39 asercji, zrzuty dyspozycje/.../evidence/krok4-ustawienia-domyslne.png i zaawansowane-domyslne.png.
- gra/tools/ruch-swiata-tempo-test.cjs:189-193: oczekiwana wartość 'krotki' -> 'normalny' (decyzja właściciela; newGameFlow.ts:255).
- ui-params.json: BEZ ZMIAN — domyslny w nowa_gra.ustawienia już zgodny (trudność 1, rozmiar 2, typ 0, ofert 0, wojna epoki 0, chatki 0, jakość 1).
TESTY:
- tsc --noEmit: EXIT=0.
- newgame-defaults-test: 39 pass / 0 fail (nowy).
- newgame-adv-tooltip-test: 31/0 (przed i po).
- diplo-truce-r1 30/0; war-era-counter 82/0; diplomacy-acceptance-points 304/0 (przed i po; dispatch podaje „diplomacy 148" — NIE_ZMIERZONO, 304 to wynik pliku).
- pangea-land-fraction-test: EXIT=0 (3 seedy PASS) po zmianach.
- ruch-swiata-tempo-test: 33 zaliczone / 2 niezaliczone. Obie porażki (regex na main.ts:41676 `player.ruchSwiataPace = saved.gracz...` vs kod `ps.ruchSwiataPace = g.ruchSwiataPace`) dotyczą main.ts, którego nie zmieniałem — pre-existing.
- newgame-bottom-navigation-test: przed zmianą desktop OK, „mały ekran" Page crashed; po zmianie NIE ZMIERZONO (vite build ubity SIGKILL, exit 137).
- newgame-sett-grid-layout-test, battle-mode-choice-labels-test: NIE ZMIERZONO — build ubity SIGKILL (presja pamięci współdzielonej maszyny).
- Nie uruchomione: miasta-panstwa-wylaczone (wymaga PRE-tree git archive), land-sea-ratio (przerwany limit czasu), pozostałe testy z listy grep (auto-manage, barbarians, map-scale-menu, praca-*). Do zrobienia przez Evaluatora.
BLOKADY: brak weryfikacji bramek przeglądarkowych (nav, sett-grid, battle-labels) — pamięć hosta; pełen zestaw AI-sim/ekonomii nie przebiegł.
ZAŁOŻENIA (luki):
1. gen-helpers.ts:3254-3259 `defaultLandFractionForTyp` (pangea 0.60, wyspy 0.50, kontynenty 0.30) — poza allowlistą, NIE zmieniono. Ścieżka kreatora zawsze podaje landFraction (main.ts:40113), więc bez efektu w grze; efekt tylko dla wywołań bez opcji.
2. playerState.ts:150-153 (fallback 'niski'/'wysoki'/'krotki') — poza allowlistą, NIE zmieniono; kreator nadpisuje w main.ts:39773-39776.
3. Ukrycie suwaka dla Ziemi (renderSettingRows) — minimalna zmiana poza wymienionymi funkcjami; wymagana przez kryterium „test braku suwaka dla Ziemi".
4. Zapisane prefs (civ-new-game-prefs-v1) nie są nadpisywane — kod bez zmian (resetSettingsFromParams -> loadNewGamePrefs); nie ma osobnego testu tej ścieżki.
5. Mnożniki „Normalny" (koszty ×2, wzrost ×2 wolniej, zasięg ×3) — zostawione zgodnie z decyzją właściciela, bez zmian kodu silnika.
NASTĘPNY KROK: Evaluator — zmierzyć nav/sett-grid/battle-labels na hoście z większą pamięcią; uruchomić miasta-panstwa i land-sea-ratio; zdecydować o ZAŁOŻENIU 1-2.
DEPLOY/PUSH: NIE WYKONANO
