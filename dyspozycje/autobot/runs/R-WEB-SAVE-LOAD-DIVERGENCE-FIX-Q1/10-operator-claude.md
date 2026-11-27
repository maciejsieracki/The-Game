STATUS: PASS-WITH-NOTES
DOMAIN: GAME (integralność zapisu, priorytet 1)
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX)
GOAL: znaleźć przyczynę B != A po wczytaniu zapisu i naprawić (B == A co najmniej 6 tur po wczytaniu; 4 konfiguracje × 2 ziarna × 2 punkty zapisu).
BAZA: 87a8d6e81bfad8c9bc0305270dc4f342fcbfd214 (origin/main). Operator SONNET (po 2 nieudanych rundach Haiku, zgodnie z dispatchem). Runda 3/5.

## PRZYCZYNA (znaleziona, z dowodem)
Wczytanie z menu pauzy tej samej gry (ten sam seed/rozmiar/typ) nie odtwarza mapy z zapisu: `loadNeedsMapRebuild` = false, zostaje ŻYWA mapa
razem ze zmianami po zapisie. `restoreGameFromSave` nie dotyka `map` (mapę odbudowuje tylko `loadGameFromSlot` → `regenerateWorldForLoad`).
Dowód: zrzut `map.hexes` A@t3 vs świeża sesja po `restoreJson` — 2 heksy z różnym `nakladka` (115,79 i 35,80: A `brak`, F `las`); `buildGameMapFromSnapshot(zapis.mapSnapshot)` = mapa A@t3 (0 różnic);
Proxy na `surowce.drewno` pokazał w F dodatkowy wpływ drewna z lasu (`computeWorkedMagazynYieldsByCity`, pole z plonem 15) → inne zużycie/pula/rekrutacja. Z `restoreJsonAsPauseLoad` (heksy z `mapSnapshot`) B == A.
Szczegóły: dyspozycje/analizy/ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA-2026-11-27.md (stan wiążący na górze).

## ZMIANY/COMMIT
- gra/src/main.ts: `liveMapDiffersFromSave` (porównanie serializacji żywej mapy z `mapSnapshot`), `loadGameFromSlot`: `mustRebuildMap ||= fromInGamePause && loadParams && liveMapDiffersFromSave(saved)`;
  hak civTest `__detHarness.restoreJsonAsPauseLoad` (ta sama decyzja, podmiana heksów in place). Zero nowych pól zapisu, zero zmian logiki gry poza ścieżką wczytania.
- gra/tools/save-load-continuity-live.cjs (nowy): tryby A/B, normalizacja, `--restore plain` (mutacja), `--expect diff`, `--legacy 1`.
- dyspozycje/analizy/ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA-2026-11-27.md, dane/r3-*.json (wyniki), ten raport.
- Commit kodu: 207d3436a (main.ts + test); commit końcowy (test legacy + dokumenty + dane + raport): patrz pole sha w odpowiedzi workflow.
- Diagnostyka (Proxy na drewno, log w turn-economy, hak rawCities/rawMapJson) była tylko w worktree i NIE jest w commitach.
- Nie integrować `diag-savefix-r2-main.patch` (eksperymentalny z r2).

## TESTY (cfg max = maksymalne ustawienia nowej gry; K=6; surowe wyjścia w dane/)
- B == A (pause-load z mapą): max/4242/zapis t3: 6/6 OK; max/7/t3: 6/6 OK; default/4242/t3: 6/6 OK; max/4242/t10 (t11–t16): 6/6 OK. pageErrors 0.
- Mutacja czerwona (`--restore plain`, max/4242/t3): 6/6 tur ROZJAZD (t4 drewno city25 8 vs 50, pula 3,9 vs 3,6375), tryb `--expect diff` PASS.
- Zgodność wsteczna (`--legacy 1`, zapis bez mapSnapshot): wczytanie bez błędu, rebuild=false, t4 wykonana, pageErrors 0 — PASS.
- Bramki: tsc 0 błędów; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0; society-breakdown 56/0; culture-religion-level 108/0;
  ai-plus10-culture 72/0; ai-plus10-matrix 190/0; ai-city-rebellion-gate 37/0; ai-city-rebellion-news 24/0; diplo-world-news 67/0; ai-plus10-live-roundtrip 4/4 (realne persist+loadGameFromSlot);
  determinism-save-load-resume-test PASS; save-load-sort 4/4; save-load-ledger-history 4/0; save-load-budowa-priorytet-on-load 6/0; save-load-player-owned-city-test PASS.
- Koszt porównania mapy (Node, 20160 heksów): 36–61 ms.

## BLOKADY
- Brak blokad technicznych. Chromium nie padł (0 SIGSEGV w tej rundzie).

## NIE ZMIERZONO
- Macierz dispatchu: zmierzono 4 z 16 komórek (4 konfiguracje × 2 ziarna × 2 punkty); brak aionly, bunt, seed 7 t10 i pozostałych. Powód: jedna para A+B ≈ 9–12 min przy obciążonej maszynie (load ~11 na 4 rdzeniach), limit narzędzia ~10 min/wywołanie.
- Pełna ścieżka UI z przebudową sceny 3D po nowej decyzji (w harnessie zastąpiona podmianą heksów in place); render/meshe po wczytaniu z pauzy; czas porównania w przeglądarce.
- „wiring 267/0” z dispatchu: nie rozpoznano, który test to jest (nie znaleziono pliku o tej nazwie/wyniku); nie uruchomiono.
- ai-test 297/0 „bit-w-bit” sprawdzony tylko wynikiem 297/0; determinizm ciągły A==A' potwierdzony pośrednio (dwie sesje A dały identyczne snapshoty poza polem savedAt; nie osobnym testem).

## UWAGI-DLA-ORKIESTRATORA
- Kandydat BŁĄD-GRY (realny): „Wczytaj” z pauzy po dłuższej grze (ten sam seed) zostawiało mapę z późniejszych tur. Poprawka wymaga FALI po FC; zmiana dotyka ścieżki wczytania (gra/src), nie balansu.
- Maszyna: load average ~11 na 4 rdzeniach w trakcie runda; scratchpad bywa sprzątany przez inny proces (skrypt pomocniczy zniknął w trakcie) — wyniki trzymane w /tmp/savefix-out (poza repo, do sprzątania).
- Przy dalszej weryfikacji macierzy: uruchamiać `save-load-continuity-live.cjs --mode A` i `--mode B` jako osobne wywołania (A ze `--saves 3` ≈ 5–6 min; `--saves 10` ≈ 8 min).
- Dist robocze (vite) w /tmp/savefix-distA/B/C do usunięcia po integracji (usunięte przez Operatora na końcu rundy).

## RUNDY
3/5

## NASTĘPNY KROK
Evaluator → Obrona → Final Control (ten sam ID). Dla FC: uruchomić `--mode A/B` dla brakujących komórek macierzy (min. aionly lub bunt oraz seed 7 t10) i `--restore plain --expect diff` jako kontrolę mutacji.

## DEPLOY/PUSH: NIE WYKONANO
