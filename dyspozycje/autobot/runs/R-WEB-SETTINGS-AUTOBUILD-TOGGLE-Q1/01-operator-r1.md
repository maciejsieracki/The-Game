STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1
GOAL: opcja „Automatyzacja budowy” (gracz; budynki + ulepszenia terenu), domyślnie WYŁĄCZONA, w głównych ustawieniach; AI bez zmian.
ZMIANY/COMMIT: dbfc45311 (baza origin/main 80919e2ae; scalenie na świeżym origin/main = integracja orkiestratora)
RUNDY: 1/5

## Pomiar PRZED
- Ustawienia: kreator nowej gry krok 4 — główna siatka `newGameFlow.ts` (`renderSettingRows`, `ui-params.json nowa_gra.ustawienia`), „Zaawansowane” = `advRowFromSett`/modal. Zapis ustawień: prefs kreatora (idx per klucz) + `meta` zapisu gry (wzorzec `dealsEndTurnGate`). Menu główne „Ustawienia” (`mainMenu.ts`) = tylko dźwięk/język — nie miejsce na opcję rozgrywki.
- Miejsca auto-budowy GRACZA (main.ts): `tryAutoEnqueueBuild` (wołany z `onBudowaPriorytetChange`, 8404, 8437, 8476, EOT 37111 i po ukończeniu 37182), Zarządca ⚙ `autoManageCity`→`enqueue` (EOT), `cityHasActionableProduction`, auto-ulepszenia terenu (`autoImpCities` → `pickAutoImprovements`, EOT pętla po fotelach). AI używa tych samych funkcji (`isMajorAiOwner`, miasta-państwa) — stąd bramka per owner, nie globalna.
- UI: `cityPanel.ts` (`appendBudowaToolbarProfiles`: profile typów, Zrównoważone, Lista, Zarządca ⚙), `buildModeHud.ts` (blok „Automatyzacja ulepszeń terenu”).

## Zmiany
- NOWY `game/auto-build-gate.ts`: `isAutoBuildAllowedForOwner(owner, humanOwnerIds, enabled)` (AI → zawsze true), `AUTO_BUILD_ENABLED_DEFAULT=false`, odczyt z zapisu/parametrów, stała podpowiedź „Włącz automatyzację budowy w Ustawieniach”.
- `main.ts`: stan `autoBuildEnabled`, `isAutoBuildAllowedFor()`/`isPlayerAutoBuildEnabled()`; bramka w 5 miejscach silnika (enqueue, enqueue Zarządcy, auto-budowa EOT, po ukończeniu, filtr `autoImpCities`) + `cityHasActionableProduction`; start gry (`params.autoBuildEnabled`, brak = false), zapis `meta.autoBuildEnabled`, wczytanie (brak pola = false); przełącznik w menu gry (`gamePauseMenu.ts`) — dodany, bo stare zapisy ładują się z OFF i bez tego nie byłoby jak włączyć opcji w trwającej grze; hak `?civTest=1` `setAutoBuild`.
- UI: nowa karta „Automatyzacja budowy” (Wyłączona domyślnie) w GŁÓWNEJ siatce kreatora (`ui-params.json`, `newGameFlow.ts`); `cityPanel.ts` — przyciski auto wyszarzone + podpowiedź, Zarządca ⚙ wyszarzony; `buildModeHud.ts` — blok auto-ulepszeń zastąpiony podpowiedzią.
- Tryby auto zapisane w mieście NIE są kasowane (tylko nie wykonywane). `auto-improvements.ts`, `ai.ts` — bez zmian (picker wspólny z AI; bramka tylko na wywołaniu gracza).

## TESTY (logi `gate-*.txt` w katalogu runu)
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- NOWY `autobuild-toggle-test.cjs`: 36/0. Mutacje: domyślnie true → 2 FAIL; brak bramki auto-ulepszeń → FAIL; brak bramki enqueue → FAIL; zapis „brak pola=true” → FAIL (wszystkie łapane).
- Testy zaktualizowane Z UZASADNIENIEM (siatka kroku 4 ma teraz 13 kart zamiast 12 — celowa zmiana układu): `newgame-sett-grid-layout` 74/0, `newgame-settings-layout-reposition` PASS, `newgame-menu-reorder-layout` PASS (6 konfiguracji), `newgame-defaults` 61/0 (z `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`; tabela domyślnych + „Automatyzacja budowy: Wyłączona”).
- Regresje bez zmian: auto-improve-no-item-cap 15/0, auto-improve-q3 41/0, auto-improvements 46/0, auto-manage 45/45, auto-manage-ulepszenia-fallback 11/11, autoimprove-live-hooks 37/0, river-forest-clear-no-citizen unit 17/0, river-forest-first 12/0, autoimprove-stages-q1 299/0, budowa-lista-szablony 11/0, build-mode-hud-affordability 7/0, simple-food-rule 36/0, ulepszenia-praca-percent 28/0, production-overflow 213/0, autowyzywienie-stan-przycisku 90/0, diplomacy-sensible-deals-main-guard 22/0, build-panel-ulepszenia-scroll 43/0, ai-test 274/20 (= baza).
- `ai4-popyt-obywatele-test`: 18 FAIL, IDENTYCZNIE na bazie origin/main (dług testowy po NO-TOGGLES, nie z tej zmiany).
- Dowód Chromium (bundle vite poza repo; `live-verify-autobuild-toggle*.cjs`, `gate-live-10-tur.txt`, `evidence/`): kreator — wiersz „Automatyzacja budowy”, wartość „Wyłączona”, w głównych ustawieniach (zrzuty 01, 01b). Nowa gra, polityka auto ustawiona na Zrównoważone/100% Pracy + 3000 Pracy, 10 tur OFF: 0 ulepszeń terenu, pusta kolejka, 0 budynków (mimo `budowaTryb=zrownowazone`). Po włączeniu: tura 12 — 11 ulepszeń, Pałac w kolejce i zbudowany, potem Spichlerz, Garncarnia; ulepszeń 31. Werdykt: defaultOff/offNoImprovements/offNoQueue/offNoNewBuildings/onDoesSomething = true. Panel miasta OFF: 7 przycisków wyszarzonych + podpowiedź (zrzut 04), ON: aktywne (07); przełącznik w menu gry OFF→ON (05, 06).

## BLOKADY / NIE_ZMIERZONO
- `autoimprove-irrigation-after-farms-test`: przekroczył 540 s (2×), nieukończony; picker nietknięty — NIE_ZMIERZONO, do powtórzenia osobno.
- `ai-buduje-budynki-test` (parytet AI; bardzo wolny, mutacje): przerwany po części; zmierzone: AI po wczytaniu/starcie nadal buduje (pokrycie 14/14 miast dużego AI ma ≥1 budynek, tryb miast AI „zrownowazone”). Pełny wynik NIE_ZMIERZONO; baza też przekracza 400 s.
- Wizualnie: 13. karta jest samotna w 7. rzędzie siatki (poniżej 1000 px wymaga przewinięcia — test przewijania PASS); komunikat podpowiedzi w pasku profili budowy nakłada się na ikony (czytelny, kosmetyka do oceny Evaluatora). `buildModeHud` po przełączeniu w menu gry odświeża się przy ponownym otwarciu panelu (nie weryfikowano na żywo).
- Baza 80919e2ae; przed integracją scalić na świeżym origin/main (inne tematy dotykają main.ts/cityPanel.ts).

NASTĘPNY KROK: Evaluator (runda 1), następnie Obrona/Final Control; integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
