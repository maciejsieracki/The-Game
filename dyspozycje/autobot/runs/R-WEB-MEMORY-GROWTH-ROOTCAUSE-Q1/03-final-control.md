STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — pamięć
TEMAT: R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1
GOAL: ustalić przyczynę wzrostu pamięci, zwolnić to, co niepotrzebne, i wykazać efekt w t.50/60/100 bez zmiany reguł gry i AI.

## Orzeczenia

**Z1 (Evaluator R1: po odzyskaniu kontekstu WebGL meshe ulepszeń tracą mgłę): ODDAL. Naprawione w R2.**
- `rebuildImprovementMeshesAfterContextRestore` (gra/src/main.ts ok. 14866-14882) woła teraz na końcu `syncImprovementMeshFog(vis, explored)`. Zbiory heksów zwraca `improvementFogViewSets()`.
- Porównałem tę funkcję z `refreshFog` (main.ts:12467-12501). Gałęzie są te same: przy `fogOn || revealAllLand` używa `currentVisible()` i `fogExploredForRender()`, w przeciwnym razie `ALL_KEYS`, a w galerii nic nie robi.
- ZAŁOŻENIE Obrony przyjmuję: bez pełnego `refreshFog()`, bo ta funkcja zmienia stan gry (`updateDiplomaticDiscovery`, `addExplored`, edukacja weteranów), a samo `explored` nie zmienia się między tymi wywołaniami.
- Test B: między odzyskaniem kontekstu a asercjami F2 nie ma `refreshFog`, więc test sprawdza samą poprawkę. Log kontrolny Operatora na buildzie bez poprawki: 17 OK / 3 FAIL, EXIT=1. Test wykrywa wadę.

**Z-FC1 (moje ustalenie: `git diff --check` czerwony na R2): ODDAL. Usunąłem w tym commicie.**
- Plik `gate-r2-war-allin-capital-quick.txt` miał spacje na końcu 5 linii. Kod tego nie dotyczy.
- Usunąłem końcowe spacje w tym logu, tak samo jak w `gate-base-*`. Hashe bez zmian. Teraz `git diff --check origin/main HEAD` przechodzi.

## Sprawdzenie samodzielne (HEAD 21b832d0c, worktree FC)

| Bramka | Wynik |
|---|---|
| tsc `--noEmit` | 0 błędów, EXIT=0 |
| logic-test | LOGIC OK (213/213), EXIT=0 |
| memory-growth-merge-index-test | 24 OK / 0 FAIL, EXIT=0 |
| memory-growth-improvement-cpu-release-test (Chromium, vite build poza repo `/tmp/civ-memq1-fc-dist`) | 20 OK / 0 FAIL, EXIT=0; F2 po odzyskaniu: ukryty, przyciemniony 0,175, pełna jasność, 0 rozbieżności |
| war-allin-capital-quick | wszystkie 8 hashy identyczne z `gate-base-war-allin-capital-quick.txt` (porównanie diffem) |
| ai-test | nie powtarzałem. R2 nie zmienia nic poza renderem i hakami testowymi; wynik R1 274/20 z tym samym zestawem FAIL powtórzył Evaluator |

**Allowlista.** `git diff --name-only origin/main...HEAD` zawiera tylko pliki z dozwolonych ścieżek: `gra/src/main.ts`, `gra/src/render/mergeDecor.ts`, `gra/tools/memory-growth-*.cjs` (5 plików) i `dyspozycje/autobot/runs/R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1/**`. Nie ma plików `.heapsnapshot` ani zmian w `gra/data`, `WERSJE.md`, `rust-port` ani `src-tauri`. `origin/main` 2c4ac1a58 jest przodkiem HEAD.

## Uwagi (nieblokujące)

- **N1.** Do t.100 trajektoria PO ma mniej jednostek (409 wobec 439 w bazie). Po korekcie nachylenie wynosi ok. 0,85 MB/turę, czyli nadal co najmniej 2 razy mniej niż 2,05.
- **N2/N3.** Pozycje z listy „sprawdź w szczególności” są omówione tylko zbiorczo. Pełny pomiar 100 tur po R2: NIE_ZMIERZONO. Poprawka niczego nie alokuje.
- **N5.** Meshe ukryte mgłą trzymają kopię CPU do pierwszego renderu. Wpływ jest ograniczony.
- **Kandydaci poza allowlistą (do decyzji orkiestratora):**
  - bundle zapisany tylko w ASCII (`vite.config.ts`): −71 MB;
  - scalenie modeli jednostek i miast.
- **Sprzątanie:** usunąłem `/tmp/civ-memq1-fc-dist` i `gra/node_modules`. Katalog `/tmp/civ-memq1-r2` nie jest mój, zostawiam go orkiestratorowi.

## Integracja

- SHA do integracji: commit tego raportu, którego rodzicem jest 21b832d0c0ce2529d6bedc3fdc79c1240b7fc586. Łańcuch: da7e9a63a → 634f26c6f → 21b832d0c → FC.
- Temat dotyczy tylko weba (`gra/**`), więc najpierw trafia do `main`.
- `origin/rust-port/parity-v2` (b520768b0) nie jest zależnością. REPIN Rust ma iść dopiero po scaleniu do `main`, tak jak dla pozostałych tematów webowych.
- Przed integracją: rebase na świeży `origin/main`. Równolegle `main.ts` zmienia PERF-LATE-GAME-LAG-HUD-Q2.

BLOKADY: brak
RUNDY: 2/5 (Final Control)
NASTĘPNY KROK: integracja przez orkiestratora do `main`, potem READY_FOR_DEPLOY
DEPLOY/PUSH: NIE WYKONANO
