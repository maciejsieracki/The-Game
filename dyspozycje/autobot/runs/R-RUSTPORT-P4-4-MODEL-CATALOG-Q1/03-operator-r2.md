STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-4-MODEL-CATALOG-Q1
GOAL: Katalog modeli 3D do odtworzenia w Rust: inwentarz 100% plików Three.js, pokrycie danymi gry, helpery i graf zależności, wycena, paczki z kolejnością, ocena wizualna, lista D-MOD-n.
ROLA: Operator (obrona), runda 2/5, Opus 5.5 medium (wyjątek graficzny §5a).

ZMIANY-COMMIT:
- Stan odtworzony z commita Operatora `1a03f837` + raport Evaluatora `649c90be` (worktree wf_7f499719-17a-3), baza dokumentacyjna `dc4cfdb4`. Push NIE.
- `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` (poprawki niżej).
- NOWE w allowliście `dyspozycje/autobot/runs/R-RUSTPORT-P4-4-MODEL-CATALOG-Q1/**`: `skrypty/*.py` (10 plików), `wyniki/*.txt` (8 plików), ten raport.
- `gra/**`, `rust-port/**`, `src-tauri/**` bez zmian. Zero npm/buildu. Web wyłącznie z pinu `edb8fb56`.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. `git grep -n requestAnimationFrame edb8fb56 -- gra/src/render` → 1 trafienie `scene.ts:1477` (`c3NextFrame`, oddanie klatki przy porcjowanej budowie sceny, nie animacja). §2.6 poprawione, §1.2 ma wiersz rAF (`prim.py`: 1 (1) / 40 (5)).
2. PRZYJMUJĘ. `extra.py` → `GETGEO units.ts: tokeny 206 = definicje 88 + wywołania 118`; `kon-nowy-model.ts` 40 = 20 + 20. §2.1 poprawione.
3. PRZYJMUJĘ. Kolumna importerów wypełniona dla wszystkich 96 plików + nowa kolumna „importerzy spoza `gra/src`” (`inv.py`, `graph.py`). `battle/manualBattle.ts`: IN 0, TOOLS 0 → MRT. `countSceneOverlayCandidates.ts`: IN 0, TOOLS 2 (`gra/tools/merge-decor-no-regress-test.cjs`, `scene-perf-diag.cjs`) → MRT. Sumy kategorii przeliczone (59 319 / 62 722 bez zmian). Oba dopisane do D-MOD-2, usunięte z paczki 14.
4. PRZYJMUJĘ. §4.2 ma teraz jawny zakres plików dla 15 paczek + listę „poza paczkami” (P4.3: `scene`, `camera`, `picker`, `main`, `perfDebugOverlay`, `perfTestPanel`; D-MOD-2/7: 4 martwe). `pkg.py` → `INVENTORY 96 ASSIGNED 96 MISSING [] EXTRA []`. `jednostki-p1-rdzen` → paczka 4, `improvements` → 11, `bronzeCity` → 1 (typy), `stoneCity` → 9, `unitMiniPreview` i `wonderpreview/main` → nowa paczka 15.
5. PRZYJMUJĘ. Przydział zmierzony z importów `units.ts` (`unitfiles.py`, §2.1d): każdy plik modeli ma rekordy jednej epoki. `jednostki-p2-inka` i `-p3-dystans` (4 rekordy Brązu) → paczka 6. Oszczepnik/Łucznik/Zwiadowca: routing w paczce 4, geometria w `kamien-bazowe` → paczka 5. `pkg.py` → paczki 4/5/6/7 = 4/10/37/24 rekordów, razem 75. NIE_ZMIERZONO usunięte.
6. PRZYJMUJĘ. §3.2 to lista sąsiedztwa kompletna co do krawędzi, z kontrolą stopni wyjściowych wobec `graph.py` (`EDGES_TOTAL 206`, pełna lista `EDGE A -> B` w `wyniki/graph.txt`). Dodane `camera`, `perfDebugOverlay`, `siegeCampSync`, `picker`, `perfTestPanel`, 29 krawędzi z `main.ts`, krawędzie `cities/scene/units/battleScene → picker`. Fałszywa krawędź `p2/p3b → kon` usunięta (tylko `p3a`). Cykl `improvements ↔ robloxImprovements` opisany. `graph.py` jest w repo.
7. PRZYJMUJĘ. `route.py` symuluje teraz pełne `buildUnitModel` dla nazw PL i EN (kategoria z `categoryOf`). `EN_DIFF_COUNT 3`: Axe Warrior → `case 'topor'`, Harappan Gate Guard → `case 'wlocznik'` (`jednostki-p1-rdzen`), Iron Khopesh Warrior → `buildKhopeshWarrior` (model brązowy). Nowe §2.1c i D-MOD-9. Teza „luk brak” zawężona do ścieżki PL. Liczbę różnych builderów poprawiłem z 67 na 73 (r1 zwijała 4 super i 4 kategorie).
8. PRZYJMUJĘ. `tarasyWariantDlaHeksa(...): 0 | 3` (`tarasy-model.ts:106`), `buildTarasy(0 | 3)` (`:389`) → 2 warianty (`extra.py`). DEK: 34 warianty. Pozycja usunięta z §7.
9. PRZYJMUJĘ. R2 rozdzielone na „wywołania” i „definicje” (np. `wonderModels` 97 + 3). Suma 482 + 21. §0.2, §1.1, §2.3, §4.1 poprawione.
10. PRZYJMUJĘ. Skrypty są w repo (`skrypty/`), wyniki w `wyniki/`, a `run_all.py` odtwarza wszystko jedną komendą. Odwołania do `table.py`/`cov.py`/`ufn.py`/`routes.txt` zastąpione skryptami z repo. Przy okazji: „6 builderów `mapRenderStyle` bez wywołań” było liczbą bez skryptu; `uses.py` mierzy 5, poprawione.
Uwaga Evaluatora (zależność paczki 10 od 13) też PRZYJĘTA: kolumna „Zależy od” i kolejność w §4.2.

TESTY: kodu nie ma. Kontrole: `run_all.py` rc=0 dla 8 skryptów; `inv.py` RENDER_FILES 88 / OUTSIDE_THREE 8 / LOC 59 319 i 62 722; `pkg.py` 96/96; `git diff --check` czysty.
BLOKADY: brak. Uwagi: (a) `rust-port/engine/data` nadal nie istnieje, źródłem są `gra/data/*.json@edb8fb56`; (b) 8 pozycji NIE_ZMIERZONO (§7), w tym częstość ścieżki EN; (c) gałąź dokumentacyjna jest na `a5ba86f3` — rebase/integracja należy do orkiestratora.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator, runda 2 (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO
