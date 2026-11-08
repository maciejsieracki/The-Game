# OWNER-DECISION — R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922

## Kontekst

Temat `t_637c6d6e` (recovery r2 meta/roster) zamknął dwa otwarte pytania
(`meta_epoka_kamien/braz/zelazo`, `meta_tier_roster`) decyzją WARIANT C:
"reference-only, bez podłączenia do gry" — wdrożoną w komicie `d808a4c3`
(`civ-matrix-semantic.ts`, kategoria `REFERENCE_ONLY`).

## Nowa decyzja właściciela (2026-09-22, ten czat)

Właściciel, po wyjaśnieniu celu tych 4 parametrów (odczytanym z
`docs/decyzje/D-CYW-EPOKA-WEJSCIA-KASKADA.md` i
`docs/decyzje/D-cyw-roster-6-REZERWA.md`), **uchyla Wariant C**:

> "Okej, usuwamy te cztery parametry całkowicie z macierzy."

## Uzasadnienie (z rozmowy)

- `meta_epoka_kamien/braz/zelazo` — duplikat już działającego, kanonicznego
  mechanizmu `epokaWejscia` w `civs.json` / `civ-entry-epoch.ts`. Nigdy nie
  były i nie muszą być podłączone — istniejąca kaskada w pełni pokrywa tę
  funkcję.
- `meta_tier_roster` — relikt planu `D-cyw-roster-6-REZERWA.md` (lipiec 2026)
  rozróżniającego "Tier 1" (9 oryg. + Harappa/Hetyci/Słowianie) od "Tier 2
  rezerwa" (Babilonia/Asyria/Fenicjanie). Plan się zdezaktualizował — wszystkie
  15 cywilizacji są dziś aktywne w puli losowania (`D-ROSTER-Q3=B`,
  `civ-roster.ts`), więc podział tier 1/2 nie ma dziś zastosowania w kodzie.

## Działanie

Usunąć **całkowicie** 4 parametry z `gra/data/civ-matrix.json`:
`meta_epoka_kamien`, `meta_epoka_braz`, `meta_epoka_zelazo`, `meta_tier_roster`.

- Usunąć wpisy z `paramDefs` (4 definicje).
- Usunąć klucze z `params` każdego z 15 wierszy `cywilizacje[]` (60 komórek).
- Zaktualizować `_meta.kolumny` (113 → 109).
- Usunąć powiązane Sety/etykiety w `gra/src/game/civ-matrix-semantic.ts`
  (`REFERENCE_ONLY` Set i jego 2 gałęzie `statusLabel`/`statusReason`,
  komentarz "Owner decision 2026-09-22 (Wariant C...)" — zastąpić komentarzem
  odsyłającym do tej decyzji jako supersedującej).
- Zaktualizować testy referencyjne do tych 4 ID:
  `gra/tools/civ-matrix-semantic-labels-test.cjs`,
  `gra/tools/civ-matrix-meta-roster-wiring-test.cjs` — usunąć asercje dot.
  usuniętych parametrów; NIE usuwać testów dot. `meta_mnoznik_waluta`
  (piąty parametr meta, pozostaje WIRED_REAL_GAMEPLAY, poza zakresem).
- `_meta.source`, `formula_*` i inne top-level klucze `civ-matrix.json` bez zmian.

## Zakres NIE objęty tą decyzją

- `meta_mnoznik_waluta` — pozostaje nietknięty, wciąż WIRED_REAL_GAMEPLAY
  (`economy.ts civMatrixMnoznikHandelPieniadzRaw`).
- Żaden inny z 109 pozostałych parametrów.
- Brak zmian w `civs.json` (`epokaWejscia` zostaje jedynym źródłem prawdy
  dla epok, bez zmian).
- Brak commit/push/merge/deploy — evidence + kod w worktree, Final Control
  decyduje o gotowości do integracji przez osobną, workerless bramkę.
