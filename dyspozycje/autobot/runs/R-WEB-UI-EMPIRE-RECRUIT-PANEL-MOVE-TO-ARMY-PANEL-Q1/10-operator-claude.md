STATUS: PASS-WITH-NOTES (Operator, runda 1/5; czeka na Evaluatora i Final Control)
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1
GOAL: Panel „Rekrutacja — cała cywilizacja” przeniesiony do panelu armii (część Rekrutacja, na samej górze, przed wodzem); przycisk REKRUTACJA usunięty z górnego paska; osobne okno usunięte; zachowanie liczników/koszyka/generała bez zmian logiki.
BAZA: 50f607fe3 (origin/main, „Rejestr: FALA 731”).

ZMIANY-COMMIT: SHA commita z kodem i raportem podany w polu sha odpowiedzi Operatora (commit na gałęzi roboczej worktree, bez pusha).
Pliki kodu:
- gra/src/ui/empireRecruitPanel.ts — okno modalne zamienione na sekcję osadzalną (`[data-erp-root]`). Usunięte: toggleEmpireRecruitPanel, closeEmpireRecruitPanel, isEmpireRecruitPanelOpen, przycisk „Zamknij”, sticky-nagłówek. Dodane: configureEmpireRecruitPanel, mountEmpireRecruitSection, resetEmpireRecruitDrafts. Logika rekrutacji (onOrder, orderAll, syncAffordability, generałowie) NIEZMIENIONA.
- gra/src/ui/empireDetailPanel.ts — w renderMassRecruitmentSection host `<div id="civ-empire-recruit-panel" data-erp-root>` na samej górze części Rekrutacja, przed blokiem „Wódz / Generał”; blok wodza przeniesiony wyżej, liczniki/Skarbiec/„Rekrutuj wszystko” (miasta) pod nim. mountMassRecruitmentControls montuje sekcję przez hak mountEmpireRecruit. hideEmpireDetailPanel zeruje liczniki (zasada R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1 zachowana).
- gra/src/ui/hud.ts — usunięty przycisk `data-act="empire-recruit"` (REKRUTACJA), pole cfg onOpenEmpireRecruit i obsługa akcji. Brak skrótu klawiszowego do tego okna (grep: brak).
- gra/src/main.ts — wiring: configureEmpireRecruitPanel(empireRecruitPanelCfg()) i mountEmpireRecruit; funkcja toggleEmpireRecruitFromHud zastąpiona empireRecruitPanelCfg(); hak testowy toggleViaHud zastąpiony openArmyRecruitSection / closeArmyRecruitSection.

Testy:
- NOWY gra/tools/empire-recruit-in-army-panel-test.cjs (live, realny build vite do katalogu poza repo, Chromium): L1 brak REKRUTACJA w HUD; L2–L4 sekcja w panelu armii, przed wodzem, zaraz pod nagłówkiem Rekrutacja; L5–L9 lista, „+”/„−”, „Rekrutuj wszystkie” w sekcji; L10 zamknięcie zeruje liczniki; L11–L12 1024×640 bez poziomego przewijania dokumentu, sekcja bez własnego przewijania; L13 zero pageerror.
  WYNIK NA ZMIANIE: 13 passed, 0 failed.
  CZERWONY NA BAZIE (50f607fe3, ten sam test skopiowany do wyciągu bazy): L1 FAIL (przycisk REKRUTACJA obecny: rightText=["Rekrutacja","Civpedia","Menu"]), potem wyjątek `openArmyRecruitSection is not a function` — test czerwony, brak przejścia dalszych kroków.

Zaktualizowane istniejące testy (każdy: dlaczego):
- tools/empire-recruit-panel-real-render-test.cjs — brak przycisku „Zamknij” (zastąpiony wywołaniem resetEmpireRecruitDrafts + usunięciem hosta); asercja „reset sesji” sprawdza opróżnienie sekcji zamiast braku okna. WYNIK: 29 passed, 0 failed.
- tools/empire-recruit-affordability-test.cjs — toggleEmpireRecruitPanel → helper __openErp (configure + mount w hoście #civ-empire-recruit-panel). WYNIK: 17 passed, 0 failed.
- tools/army-auto-recruit-general-ui-test.cjs — ten sam helper. WYNIK: 11 passed, 0 failed.
- tools/empire-recruit-all-test.cjs — ten sam helper; eksport resetEmpireRecruitPanelSession w __api; asercja „jeden górny przycisk” sprawdza .erp-all zamiast usuniętego .erp-stick. WYNIK: 31 passed, 0 failed.
- tools/empire-recruit-panel-no-inner-scroll-test.cjs — okno było własnym przewijanym kontenerem; teraz host siedzi w zewnętrznym kontenerze #outer-army (imitacja .civ-emp-body). Asercje „zewnętrzny panel przewijalny” przeniesione na kontener armii; sticky-„Rekrutuj wszystkie” zastąpione sprawdzeniem, że przycisk jest w sekcji. WYNIK: 18 passed, 0 failed.
- tools/empire-recruit-live-test.cjs (live, realna gra) — L15: przycisk HUD musi być NIEOBECNY; otwarcie przez openArmyRecruitSection; L20 (pozycja przycisku HUD) usunięta; L21 dotyczy sekcji; L22 zamknięcie = brak klasy .open. WYNIK: 23 passed, 0 failed.
- tools/empire-recruit-all-live-test.cjs (live) — otwarcie/zamknięcie przez hooki zamiast klikania przycisku HUD i toggleViaHud. NIE_ZMIERZONO (nie uruchomiono).
- tools/army-auto-recruit-general-live-test.cjs (live) — otwarcie hookiem, zamknięcie przez closeArmyRecruitSection. NIE_ZMIERZONO.
- tools/map-controls-behind-panels-live-test.cjs (live) — akcja otwarcia „rekrutacja-imperium” przez hook. NIE_ZMIERZONO.
- tools/live-verify-w18-w24-manual-losses-w18.cjs — NIE zmieniony (szuka tekstu „Rekrutacja — cała cywilizacja”, który nadal istnieje w tytule sekcji). NIE_ZMIERZONO.
- tools/hud-*.cjs i left-banner-chip-grid-clip-test.cjs przekazują nieużywany klucz onOpenEmpireRecruit — zostawione (niegroźne); PASS: hud-topbar-one-row 140/0, hud-panels-below-banner 130/0, hud-topbar-layout-a 144/0, left-banner-chip-grid-clip 204/0.

BRAMKI REFERENCYJNE (uruchomione z gra/, surowe wyjście):
- TypeScript: `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, bez komunikatów (0 błędów).
- Logika: `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- Drzewo technologii: `node tools/tech-tree-test.cjs` → `20 pass, 0 fail`, exit 0.
- Badania: `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0.
- Wymiana jednostek: `node tools/unit-replace-test.cjs` → exit 0 (komunikat `[OK] cross-type melee matrix passes ...`; skrypt nie drukuje licznika).
- Walka: `node tools/combat-test.cjs` → `All sanity checks passed.`, exit 0.
- Moc jednostek: `node tools/unit-power-test.cjs` → `6 pass, 0 fail`, exit 0.
- `git diff --check` → czysto (exit 0) przed ostatnią drobną zmianą komentarzy w hud.ts; powtórzone przy commicie.
- Mgła-inwariant, generator mapy, AI-buduje-budynki: NIE uruchomiono (poza zakresem zmian UI; kod gry poza panelem rekrutacji nie zmieniony w logice).

Wiki/Civpedia: przeszukano src/data/wikiBundle.json i docs — brak opisów przycisku REKRUTACJA ani okna „Rekrutacja — cała cywilizacja”. Regeneracja wikiBundle NIEPOTRZEBNA (nic do zsynchronizowania).

Zrzuty Chromium (realna gra, build vite):
- dyspozycje/autobot/runs/R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1/armia-rekrutacja-na-gorze.png — panel armii: sekcja „Rekrutacja — cała cywilizacja” na samej górze części Rekrutacja, pod nią „Generał rekrutujący” (wódz) i licznik koszyka.
- .../gorny-pasek-bez-rekrutacji.png — górny pasek bez przycisku REKRUTACJA (w tym widoku prawy klaster przykryty panelem armii; brak przycisku potwierdzony w DOM testem L1).
- .../armia-rekrutacja-wasko-1024x640.png — wąskie okno 1024×640.

BLOKADY / NIE_ZMIERZONO:
- NIE_ZMIERZONO: 4 zaktualizowane testy live (empire-recruit-all-live, army-auto-recruit-general-live, map-controls-behind-panels-live, live-verify-w18-w24) — nie uruchomiono (koszt ~2 min build każdy; tylko edycja selektorów/hooków).
- NIE_ZMIERZONO: widok 360 px (telefon) w przeglądarce — zbadano 1024×640 i 1280×800.
- NIE_ZMIERZONO: czy po zdarzeniu aktualizacji gry (przebudowa body panelu armii) pole liczby traci fokus podczas pisania — przebudowa DOM panelu armii następuje przy każdym odświeżeniu (jak dotąd dla kart miast); liczniki zostają (stan w module), ale nie mierzono ergonomii.
- Brak blokad technicznych.

DECYZJE / ZAŁOŻENIA (do potwierdzenia przez orkiestratora):
1. Kolejność w części Rekrutacja: nagłówek → sekcja rekrutacji całej cywilizacji → blok „Wódz / Generał” → (przeniesione pod wodza) liczniki „W KOLEJCE/UKOŃCZONE”, checkbox „Idź do wodza”, Skarbiec, „Rekrutuj wszystko” (miasta). Dispatch wymagał „najpierw rekrutacja całej cywilizacji, pod nią wódz” — tak zrobiono; blok liczników został przesunięty pod wodza, żeby nie wciskać się między sekcje.
2. Zamknięcie: w panelu armii nie ma już przycisku „Zamknij” dla tej sekcji (zamknięcie = zamknięcie panelu armii, które zeruje liczniki przez hideEmpireDetailPanel → resetEmpireRecruitDrafts). Reguła R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1 zachowana.
3. Skrót klawiszowy: nie istniał; brak przekierowania.
4. Dwa przyciski „Rekrutuj wszystk…” w jednej części (sekcja cywilizacji: „Rekrutuj wszystkie”; sekcja miast: „Rekrutuj wszystko”). Nazwy różnią się jedną literą — ABC dla właściciela, czy zmienić etykietę (poza zakresem tego tematu, nie zmieniano).
5. Zachowanie przy zamknięciu/otwarciu: stan koszyka żyje w module do zamknięcia panelu armii (jak dawniej przy oknie) — bez pogorszenia.

UWAGI-DLA-ORKIESTRATORA:
- Commit zawiera wyłącznie allowlistę tematu (gra/src/ui/empireRecruitPanel.ts, gra/src/ui/empireDetailPanel.ts, gra/src/ui/hud.ts, gra/src/main.ts, gra/tools/* wymienione wyżej, dyspozycje/.../R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1/**). Nie dotykano WERSJE.md, gra-robocza/, rust-port/, gra-robocza.
- Pliki zrzutów w starszych runach (R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1, R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1) nadpisane przez stare testy zostały przywrócone do wersji z bazy (git checkout).
- Build: wyłącznie `node ./node_modules/vite/bin/vite.js build --outDir <katalog poza repo> --emptyOutDir`; brak `npm run build/dev`.
- Operator nie integruje, nie deployuje, nie pushuje na main.

NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja zakresu allowlisty, czerwonego testu na bazie (dowód powyżej), 4 niezmierzonych testów live; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
