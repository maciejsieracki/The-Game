# R-WEB-ARMY-SPLIT-ENEMY-CITY-BLOCK-Q1 — dispatch (zgłoszenie właściciela 2026-11-12)

GAME. Baza: aeb52465e845d29acb5f7b628370789af399d673 (origin/main).

GOAL: przy rozdzielaniu armii (panel armySplitPanel) i przy ruchu wydzielonego pod-stosu NIE może wejść na heks zajęty przez obcą jednostkę ani na miasto przeciwnika. Obecnie część armii wpada do miasta przeciwnika (lub na heks wroga) bez zajęcia — to błąd.

KRYTERIA KOŃCA (binarne):
1. Heks z miastem przeciwnika (i każdym obcym miastem) nie jest celem rozdzielenia ani ruchu pod-stosu.
2. Heks zajęty przez obcą jednostkę nie jest celem rozdzielenia.
3. Własne miasto i własne jednostki zachowują dotychczasowe zachowanie.
4. Test regresyjny w gra/tools: odtwarza sytuację (armia pod miastem przeciwnika, próba rozdzielenia na heks miasta/wroga) i sprawdza blokadę; mutacja (usunięcie blokady) czerwieni test.
5. tsc --noEmit zielone; bramki referencyjne (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test) zielone; dowód w realnej grze (Chromium) przed zamknięciem.

ALLOWLISTA: gra/src/game/armyMerge.ts (cel rozdzielenia, ok. linii 683), gra/src/ui/armySplitPanel.ts, gra/src/main.ts (tylko miejsce wywołania walidacji celu, bez innych zmian), nowy gra/tools/army-split-enemy-city-block-test.cjs. ZAKAZ: wszystko poza allowlistą, gra/data/*.json, dyspozycje/WERSJE.md, git add -A.

IZOLACJA: worktree na izolowanej gałęzi, baza aeb52465e845d29acb5f7b628370789af399d673.

ZAKAZ BEZWZGLĘDNY: npm run build / npm run dev w gra/ (kanon C-001). Dozwolone: node ./node_modules/typescript/bin/tsc --noEmit; node tools/*-test.cjs.

PLAN TESTÓW: tsc; nowy test regresyjny (mutacja wykrywana); 5 bramek referencyjnych; dowód w Chromium przy wolnym dysku.

PROCEDURA NAPRAWCZA: FAIL → ten sam ID, runda N+1, max 5.
