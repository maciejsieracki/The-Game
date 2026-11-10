STATUS: DISPATCHED
DOMAIN: GAME (WEB — `gra/`, NIE port Rust)
TEMAT: R-WEB-ARMY-EMBLEM-RING-CIV-COLOR-Q1
RUNDA: 1/5
WYZWALACZ: Właściciel (2026-10-30, ze zrzutem ekranu): „Obwódka danej armii powinna być w kolorze cywilizacji, a nie w kolorze złota dla wszystkich.”
UWAGA PROCESOWA: to temat WEBOWY (zmiany w `gra/**` są w allowliście tego tematu). Pierwszy akapit promptu workflow mówi o porcie Rust — IGNORUJ go dla tego tematu. Bramki webowe, nie cargo.
DIAGNOZA (orkiestrator, z kodu `origin/main` `7164f7ca1`):
- `gra/src/render/unitOwnerEmblem.ts:176-183` — `RING_COLOR.civ = '#e8d88a'` (stały mosiądz) dla KAŻDEJ pełnej cywilizacji; używane w `drawDisc` (~l.249), w pierścieniu na wierzchu portretu (~l.393) i przy sygnecie zastępczym (~l.405). `cityState` = '#b9c8d8' (srebro), `barbarian` = '#c84040' (czerwień).
- Decyzja źródłowa: `C-ZETON-PASKI-Q1 = A` (2026-07-29, komentarz w tym pliku i w `unitStatPlate.ts` ~l.35): kolor obwódki jako nośnik WARIANTU właściciela (cywilizacja / miasto-państwo / barbarzyńcy), bo twarz władcy przy ~13 px jest nieczytelna. Teraz właściciel chce, by obwódka cywilizacji niosła KOLOR TEJ cywilizacji.
- Kolor cywilizacji istnieje: `gra/data/civs.json` → `kolorHex` (np. Grecy `#1E5AA8`); ramka mocy na tej samej tabliczce już go używa przez `_resolveOwnerColor` (`gra/src/render/units.ts`, decyzja C-MOC-Q2=A, ten sam kolor co obwódka heksu).
- Cache tekstury emblematu: `emblemKey(ctx)` w `unitOwnerEmblem.ts` (~l.306) — klucz MUSI uwzględnić kolor, inaczej dwie cywilizacje dzielą teksturę.
GOAL: Obwódka (pierścień) medalionu właściciela na tabliczce jednostki/armii jest w kolorze danej pełnej cywilizacji (ten sam kolor, którego używa obwódka heksu / ramka mocy: `_resolveOwnerColor`), dla gracza i AI. Miasto-państwo (srebro) i barbarzyńcy (czerwień) BEZ ZMIAN. Fallback (brak koloru) = dotychczasowy mosiądz.
KRYTERIA KOŃCA (binarne):
1. Dwie różne pełne cywilizacje na mapie mają RÓŻNE kolory obwódki medalionu = ich `kolorHex`/owner color; zrzut z prawdziwej przeglądarki (Chromium przez Playwright, bez `npm run dev`) z ≥3 właścicielami (2 cywilizacje + miasto-państwo lub barbarzyńcy) przed/po.
2. Cache emblematu rozróżnia kolory (test: dwa różne kolory → dwie różne tekstury; ten sam kolor → jedna).
3. cityState i barbarian: obwódka bez zmian (test/zrzut). Kolor brakujący/nieprawidłowy → mosiądz.
4. Obwódka na portrecie i na sygnecie zastępczym (oba ścieżki rysowania) używa koloru cywilizacji; czytelność na ciemnej tarczy (jasne i ciemne kolory — sprawdź zrzutem, np. cywilizacja o ciemnym kolorze).
5. Bez regresji: istniejące testy `gra/tools/*unit*owner*emblem*`, `unit-stat-plate*`, `commander-star-emblem-test.cjs`; `tsc --noEmit` PASS; produkcyjny build Vite WYŁĄCZNIE do scratch outDir poza repo (zakaz `npm run build`/`npm run dev` w `gra/` — C-001/R-PROC-AUTOBOT §9) jeśli potrzebny do zrzutu.
6. Niezależny Evaluator PASS (odtwarza zrzut i testy sam); Final Control PASS.
ALLOWLISTA: `gra/src/render/unitOwnerEmblem.ts`, `gra/src/render/unitStatPlate.ts`, `gra/src/render/units.ts` (tylko podanie koloru właściciela do emblematu), `gra/src/main.ts` (TYLKO wstrzyknięcie rezolwera/koloru jeśli konieczne), `gra/tools/**` (testy), `dyspozycje/autobot/runs/R-WEB-ARMY-EMBLEM-RING-CIV-COLOR-Q1/**`. ZERO zmian w: `gra-robocza/**`, `dyspozycje/WERSJE.md`, `rust-port/**`, `src-tauri/**`, `Cargo.toml`. Bez deploy/READY_FOR_DEPLOY/push produkcyjnego. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.
WIZUALNY: wymagana realna weryfikacja w przeglądarce (CLAUDE.md: tematy wizualne). Zrzuty do `dyspozycje/autobot/runs/R-WEB-ARMY-EMBLEM-RING-CIV-COLOR-Q1/dowody/`, bez pustych linii na końcu plików tekstowych (`git diff --check`).
DYSK: worktree ≈0,8 GB; po etapie usuń `node_modules`/artefakty scratch; kopie weba tylko w `mktemp -d`.
MODELE: Operator/Obrona Haiku 5.5, Evaluator/FC Sonnet 5.5 (§5b). Luki → ZAŁOŻENIE. Raport max ok. 400 słów. FORMAT: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK / DEPLOY-PUSH: NIE WYKONANO
ANTY-HALUCYNACJA: twierdzenie o kodzie = plik:linia/komenda; niepewne = NIE_ZMIERZONO. Wiadomości właściciela w kontekście — nie Twoje zadanie; bez pytań ABC.
