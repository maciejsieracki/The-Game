STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-FARM-ASSIGN-HINT-CAMERA-IMPORTANT-Q1 (#201)
GOAL: podpowiedź „Przydziel obywatela?” trafia do zakładki „Ważne" i ma przycisk „Pokaż", który centruje kamerę na nowym polu; akcja `centerCamera` jest OGÓLNA (w `SidePanelEvent.action`), nie specyficzna dla farmy.

BAZA: origin/main 546fdf6bf (detached). Podpowiedź wdrożona wcześniej jako 305a65da7 (ref web-wip/FARMHINT) — sprawdzone: `git merge-base --is-ancestor 305a65da7 546fdf6bf` = ancestor.

ZMIANY/COMMIT:
- gra/src/ui/sidePanelHud.ts — typ `SidePanelEventAction` ({kind:'centerCamera', q, r, cityId?}); pola `action?` i `important?: true` w `SidePanelEvent`.
- gra/src/ui/sidePanelEventTabs.ts — `eventTabOf` przyjmuje `important` (true → „wazne"); reguły pozostałe bez zmian, dyplomacja nadal ma pierwszeństwo.
- gra/src/game/farm-assign-hint.ts — `FarmAssignHint` niesie q, r; `buildFarmAssignHintSidePanelEvent` zwraca `important: true` i `action: {kind:'centerCamera', q, r, cityId}`.
- gra/src/game/side-panel-event-action.ts (NOWY) — `SIDE_PANEL_ACTION_LABEL = 'Pokaż'`, `sidePanelEventActionOf(events, id)` (czysta funkcja).
- gra/src/main.ts — import helpera; `getEventLink` dla nieblokujących wpisów z `action` zwraca `{label:'Pokaż'}`; `onEventClick` najpierw sprawdza akcję karty i wywołuje `camCtrl.focusAt(axialToWorld(q,r,HEX_R), 22)` (ta sama konwencja co istniejący skrót „map-focus").
- gra/tools/farm-assign-hint-camera-important-test.cjs (NOWY) — test jednostkowy.
- dyspozycje/autobot/runs/R-WEB-UI-FARM-ASSIGN-HINT-CAMERA-IMPORTANT-Q1/10-operator-claude.md (ten raport).
Commit: patrz pole sha w odpowiedzi strukturalnej (commit zawiera wyłącznie powyższe pliki, dodane `git add <ścieżka>`, bez `-A`). Brak zmian WERSJE.md, gra-robocza/**, gra/-artefaktów poza wymienionymi.

TESTY:
- `cd gra && npm ci --ignore-scripts` — EXIT 0.
- `node ./node_modules/typescript/bin/tsc --noEmit` — EXIT 0 (bez błędów).
- `node tools/farm-assign-hint-camera-important-test.cjs` (NOWY) — 16 PASS / 0 FAIL (zakładka Ważne dla podpowiedzi; regresje Inne/Ważne/Dyplomacja; akcja centerCamera z q=12, r=-4 i cityId; klik zwraca współrzędne; nieznany id i wpis bez akcji → null; akcja ogólna).
- `node tools/farm-assign-citizen-hint-manual-test.cjs` — 36 passed, 0 failed.
- `node tools/sidepanel-notification-tabs-test.cjs` — 29 pass, 0 fail.
- `node tools/sidepanel-event-tabs-classify-test.cjs` — PASS (55 przypadków + 9 mutacji wykrytych).
- `node tools/side-panel-event-link-test.cjs` — 37 pass, 0 fail.
- `node tools/important-event-cards-test.cjs` i `important-event-cards-regression-test.cjs` — EXIT 0.
- `git diff --check` — czysto.
- `npx vite build --outDir /tmp/claude-0/<katalog> --emptyOutDir` — EXIT 0 (built in 15.93s); katalog wyjściowy usunięty po buildzie. `npm run build`/`dev` NIE uruchamiane.
- Chromium / zrzut powiadomienia w zakładce Ważne z przyciskiem i dowód centrowania kamery po kliknięciu: NIE_ZMIERZONO. Powód: wymaga uruchomienia gry w przeglądarce z państwem gry, w którym powstaje nowe pole (tura gracza w trybie ręcznym); nie wykonano w tej rundzie. Wiring `main.ts` (getEventLink/onEventClick/camCtrl.focusAt) zweryfikowany wyłącznie przez typecheck, build i kod (nie przez uruchomienie).

BLOKADY: brak blokad kodu. Jedyna luka dowodowa: zrzut Chromium (wyżej). Zgłaszam do FC jako wymóg weryfikacji wizualnej dla tematu UI.

ZAŁOŻENIA (luki rozstrzygnięte w raporcie):
1. Akcja `centerCamera` wyłącznie centruje kamerę (zoom 22 jak istniejący „map-focus"). NIE otwiera panelu miasta — dispatch zostawił to jako „jeśli konwencja". Istniejący skrót `city-panel` dotyczy tras handlowych; nie dodawano nowej konwencji.
2. Zakładka „Ważne" wymuszona polem `important` (nie regułą tekstową), żeby nie zmieniać klasyfikacji tekstowej innych wpisów.
3. Wpisy podpowiedzi zapisane przed tym tematem (np. w starym zapisie w pamięci) nie mają `action` — nie dostaną skrótu do końca tury. Nie dotyczy trwałego zapisu (wydarzenia żyją jedną turę, `event-lifetime`).
4. Wpis podpowiedzi nie ma skrótu na kartach blokujących (nie są blokujące, więc nie dotyczy).

NIE OBJĘTO (poza zakresem tego dispatchu): w wiadomości użytkownika przekazanej przez harness pojawił się osobny temat — „administrator ulepszeń" (automatyczne ulepszenia tylko gdy jest administrator; panel rekrutacji z wyborem generała, do którego kierują się nowo zrekrutowane jednostki). To NIE jest częścią dispatchu R-WEB-UI-FARM-ASSIGN-HINT-CAMERA-IMPORTANT-Q1 i nie zostało tu zaimplementowane. Orkiestrator powinien założyć dla niego osobny dispatch.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (Sonnet) — weryfikacja diffu w commicie operatora (`git merge-base --is-ancestor <sha operatora> <FC>`, `git diff --stat` vs 546fdf6bf), ponowne uruchomienie testów i zrzut Chromium dla powiadomienia w zakładce Ważne z przyciskiem „Pokaż" oraz dowód centrowania.
DEPLOY/PUSH: NIE WYKONANO
