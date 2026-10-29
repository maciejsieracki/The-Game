STATUS: PASS-WITH-NOTES (partia 2 `title` zrobiona; temat NIE zamknięty: partie 3-4, wiring i bundle pinu NIE_ZROBIONE)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1
GOAL: Partia 2 K08B (blok 7 `appendSectionTitleWithDetails` + helper `resolveDetailSideHint`) z harnessem i bramką kopii, baza backup/k08b-p1-79c9c093 (79c9c093).
ZMIANY/COMMIT: kod+harness+logi+dossier: 3ba62c6a (pełny SHA 3ba62c6ace6d4c05c4b0914172e55ea5e3cff86a). Allowlista: `src/ui/cityPanel/k08b-title.ts` (NOWY, generowany), `tools/dom-harness/{k08b-subs,gen-k08b-port,verify-k08b-copies}.mjs` (opcja `--batch`), `tools/dom-harness/{run,mutate}-k08b-title.mjs` (NOWE), `PORTING-QUEUE.md` (dopisek), `dyspozycje/rust-port/p5/P5-8-K08B.md` (§7c), `runs/R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1/**`. Zero zmian w `gra/**`, `.rs`, `package.json`, `WERSJE.md`, rust-port. Brak `git add -A`.
TESTY:
- `gen-k08b-port.mjs --batch title`: 2 bloki -> k08b-title.ts.
- `verify-k08b-copies.mjs --batch title`: TEXT 2, SUBS 7, COVER 2, EXPORT 2, ORPHAN 0, fails 0, EXIT 0.
- `verify-k08b-copies.mjs --batch rail`: 6 bloków, ORPHAN 0, EXIT 0.
- `run-k08b-title.mjs --pin-dir <PIN>`: 34/34 porównań zgodnych (12 kotwic PIN-ANCHOR w pinie edb8fb56, struktura DOM, kontrakt attachInteractiveDetail), EXIT 0. Realne `el` z k01b-dom i katalog statyczny; `ui/hoverDetailDock` = rejestrator wywołań (NIE_ZMIERZONO: realne dokowanie).
- `mutate-k08b-title.mjs`: 11/11 ZABITA, nieoczekiwane 0, EXIT 0. Uwaga: mutacja `head-no-append` kończy harness EXIT 2 (błąd harnessu), nie EXIT 1.
- `run-k08b-rail.mjs --pin-dir <PIN>` (regresja): 87 porównań, 0 różnic, EXIT 0.
- `npm ci` 0; `npm run check` 0 (self-test OK, trafienia 0, pin-copies 435 niezgodnych=0); `npm run typecheck` 0.
- Logi: `runs/R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1/r2-logi-title/*.txt`.
BLOKADY:
- Partie 3-4: 18 jednostek DOM z §3 (`renderBuildingsOwned`, `renderMagazyn`, `renderReligia`, `renderPurchasableUnits`, karty `buildTopBar*`, `wireTopBarStatDetails`, zakładki, `paintCityPanelSections`, `showCityPanel`/`hideCityPanel`).
- Wiring `setK08aDeps`, `setK05bHost`, `setK06bDeps` w `controller/`: NIE_ZROBIONE (adapter nie napisany w tej rundzie).
- Harness wykonujący funkcje pinu (bundle pinu z wiringiem): NIE_ZROBIONE; `title` testowany kontraktem i kotwicami.
- Przeglądarka/CSS: NIE_ZMIERZONO. `cargo clippy/test`: NIE_ZMIERZONO (brak gdk-3.0, INFRA).
- Założenie (bez pytania ABC): `appendSectionTitleWithDetails` nie jest w liście §3, więc jest dodatkowym blokiem partii 2 jako blokera pozostałych jednostek; liczba 18 z §3 nie zmienia się.
RUNDY: 2/5
NASTĘPNY KROK: Operator-obrona/Evaluator; następnie partia 3 (`renderBuildingsOwned`, `renderPurchasableUnits`, `renderMagazyn`) wg P5-8-K08B.md §3 i §7c.
DEPLOY/PUSH: NIE WYKONANO

Commit: 3ba62c6ace6d4c05c4b0914172e55ea5e3cff86a (ten raport dołączony w commicie następnym).
