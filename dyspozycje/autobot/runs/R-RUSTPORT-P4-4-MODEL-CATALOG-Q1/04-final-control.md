STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-4-MODEL-CATALOG-Q1
GOAL: Katalog modeli 3D do odtworzenia w Rust (inwentarz 100% plików Three.js, pokrycie danymi gry, helpery i graf zależności, wycena, paczki z kolejnością, ocena wizualna, D-MOD-n).
ROLA: Final Control (Opus 5.5 medium, wyjątek graficzny R-PROC-AUTOBOT.md §5a)

ZMIANY/COMMIT
- Oceniany stan: `c6a8eac4` (Operator r2) na `649c90be` (Evaluator r1) na `1a03f837` (Operator r1), baza `dc4cfdb4`.
- `git diff --name-only dc4cfdb4 c6a8eac4`: 22 pliki, wszystkie w allowliście (`dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-4-MODEL-CATALOG-Q1/**`); poza allowlistą 0. `git diff --check dc4cfdb4 c6a8eac4` czysty.
- Ten raport: commit na `c6a8eac4` (SHA w odpowiedzi FC do orkiestratora).

TESTY (samodzielnie, pin web `edb8fb56`, tylko git show/grep/ls-tree)
1. `git ls-tree -r --name-only edb8fb56 -- gra/src/render | wc -l` → 88; z importem three → 80; poza `render/` z three → 8 (battleScene, manualBattle, siegeWall, picker, main, perfTestPanel, unitMiniPreview, wonderpreview/main). Zgodne.
2. Suma `git grep -c ''` po 88 plikach `render/` = 59 319; po 8 plikach spoza = 62 722. Zgodne z §1.
3. `requestAnimationFrame` w `render/` → 1 trafienie `scene.ts:1477`. Zgodne z poprawionym §2.6.
4. `units.ts`: `^function getGeo` = 88, tokeny `getGeo*(` = 206 → 118 wywołań. Zgodne.
5. `manualBattle`: jedyne odwołania to README, komentarze (`main.ts:27157,28490`, `units.ts:1737`) i `gra/tools` (wzmianki tekstowe, nie import). 0 importerów. Zgodne.
6. `countSceneOverlayCandidates`: importowany tylko w `gra/tools/merge-decor-no-regress-test.cjs:21` i `gra/tools/scene-perf-diag.cjs:19`. Zgodne.
7. `tarasy-model.ts:106` → `: 0 | 3`, `:389` `buildTarasy(wariantWzgorza: 0 | 3)` → 2 warianty. Zgodne.
8. `kon-nowy-model` importują tylko `units.ts:34`, `styleResources.ts:11`, `ulepszenia-modele-p3a.ts:64` (p2/p3b nie). Zgodne z usunięciem fałszywej krawędzi.
9. Cykl: `improvements.ts:9` importuje `robloxImprovements`, `robloxImprovements.ts:6` importuje typ z `improvements`. Zgodne.
10. `picker` importują `main.ts:157`, `scene.ts:123`, `cities.ts:44`, `units.ts:28`, `battleScene.ts:105` — identycznie z 5 wierszami `EDGE … -> input/picker.ts` w `wyniki/graph.txt` i §3.1.
11. `units.json`: 75 rekordów, Epoka Kamień 10 / Brąz 40 / Żelazo 25; `jednostki-p2-inka` i `jednostki-p3-dystans` mają wyłącznie rekordy Brązu → paczka 6. Paczki 4/5/6/7 = 4/10/37/24 = 75 (`wyniki/pkg.txt`).
12. `units.ts:1576` (`khopesh warrior` → `buildKhopeshWarrior`) wyprzedza `:1750` (`iron khopesh`); komentarz `:1725-1745` potwierdza błąd EN. Zgodne z §2.1c/D-MOD-9.
13. `new (THREE.)?Mesh(` w `galera-model.ts` = 31, w `units.ts` = 342 — zgodne z wierszami inwentarza.
14. Odtwarzalność: skopiowane skrypty (`git archive c6a8eac4`) uruchomione `python3 -I -B run_all.py` z worktree → 8/8 rc 0; `diff -r` nowych `wyniki/` z zacommitowanymi → identyczne.

ORZECZENIA (zarzuty Evaluatora r1)
1. rAF fałszywy wynik — ODDAL (naprawione w r2, test 3).
2. getGeo 206 jako wywołania — ODDAL (naprawione, test 4).
3. Martwy kod manualBattle/countScene — ODDAL (naprawione: MRT, D-MOD-2, kolumna TOOLS; testy 5–6).
4. Pliki poza paczkami — ODDAL (naprawione: `pkg.py` INVENTORY 96 ASSIGNED 96 MISSING []; paczka 15-PREVIEWS).
5. Liczby modeli paczek 5–7 — ODDAL (naprawione: zmierzone `unitfiles.py`, test 11; Oszczepnik/Łucznik/Zwiadowca jawnie: routing w p4, geometria w p5).
6. Graf niepełny — ODDAL (naprawione: 206 krawędzi w `wyniki/graph.txt`, cykl opisany; testy 8–10).
7. Ścieżka EN — ODDAL (naprawione: §2.1c, 3 rozjazdy, D-MOD-9; test 12).
8. Tarasy NIE_ZMIERZONO — ODDAL (naprawione, test 7).
9. R2 miesza definicje — ODDAL (naprawione: rozdzielenie 482 + 21).
10. Brak skryptów — ODDAL (naprawione: 10 skryptów + wyniki w repo, odtworzone 1:1, test 14).
Uwaga Evaluatora (paczka 10 → 13) — przyjęta w r2. D-MOD-1..9 celowo dla właściciela, nie czynią tematu DECISION_REQUIRED.
Agregat: 0 × NAPRAW, 0 × DO DECYZJI → PASS.

BLOKADY: brak. Uwagi: (a) `rust-port/engine/data` nie istnieje — pokrycie z `gra/data/*.json` na pinie, opisane jawnie; (b) 8 pozycji NIE_ZMIERZONO (§7) jawnie oznaczonych; (c) brak osobnego raportu Evaluatora r2 — Final Control zweryfikował obronę bezpośrednio; (d) gałąź dokumentacyjna poszła do przodu (`a3079f47`), `dc4cfdb4` jest jej przodkiem — integracja przez cherry-pick.

RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (cherry-pick w kolejności `1a03f837`, `649c90be`, `c6a8eac4`, commit tego raportu na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`), potem READY_FOR_DEPLOY (dokumentacja).
DEPLOY/PUSH: NIE WYKONANO
