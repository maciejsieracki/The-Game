STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-C-Q1
GOAL: Przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany weba `86d510c66 → 9b019a7d8` dla `empireDetailPanel`, `hexContextTooltip`, `buildModeHud` (w tym przełącznik automatyzacji budowy).

ZMIANY/COMMIT: oceniane `4306ccbc9` (kod) + `653c34690` (raport Operatora), baza `dde5e9034`. Evaluator: tylko ten plik.
- `git diff --name-only dde5e9034 653c34690`: 28 plików, wszystkie w allowliście (3 × `src/ui/*`, `tools/**`, `package.json` +2 skrypty, `P5-REPIN-UI-2.md` §11.6, `runs/…/**`). Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`. `git diff --check` czysto.
- Zmiany wspólnych plików addytywne (nowa pętla `portDom*` w nakładce i weryfikatorze, nowa sekcja manifestu). Usunięte wpisy (`overlayPortsUI2D` −2, `ui2c.json` −1) zgodne z dispatchem (plik przeniesiony do manifestu UI-3).

TESTY (odtworzone niezależnie, worktree `wf_8a6c69dd-10f-2`, detached `653c34690`, Chromium 141):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (`check-no-logic-imports` 0 trafień; UI-3 portDom 3/3, źródło 3, niezgodnych 0).
- Odniesienie WEB86U3 zbudowane od zera (`git archive` 86d/9b + `repin-ui2-overlay.mjs`, niezgodnych 0).
- `run-repin-ui3c`: 696 przypadków, 12 PNG web = port, MARKERS 19/19, asercji 14/14, błędów strony 0, różnic 0, EXIT 0. Fixtura bajtowo = `tools/dom-harness/fixtures/repin_ui3c-web-vectors.json` (sha256 `02fb1180…`); 12 PNG bajtowo = PNG w `runs/…/png/`.
- Pełny web 9b: różnic 4, wszystkie `emp`, „Spichlerz Królewski” vs „Spichlerz II” = zmiana `empireDetailTypes.ts` 86d→9b (partia UI-3-B). Potwierdza U3C-Z5.
- `mutate-repin-ui3c` 0–13, 13–26, 26–39: 39/39 wykrytych; `git status` po mutacjach czysty.
- Regresja na końcowym kodzie: UI-2-D 797/0 (MARKERS 16/16 + 1 NIE_DOTYCZY), UI-2-C 752/0, `run-cycles` 6442/1623 (tylko `diplomacyTradeBasket` 1592 + `diplomacyAudience` 31 = E-Z3; `hexContextTooltip` 931/0), hud 909/0, L0 3861/0, L2 1778/0 (`mainMenu` 0, `buildModeHud` 132/0 — potwierdza niestabilność różnicy z raportu Operatora).
- NIE_ZMIERZONO przez Evaluatora: L1A, C4, cityux, UI-2-A/B/E/E-cycles/F/G, UI-3-A, `run-newgame`, GPU/okno Tauri (przyjęte z raportu Operatora).

ZARZUTY: brak.

UWAGI (nieblokujące):
1. `run-repin-ui2d.mjs`: znacznik `LOG:onUnspentBudgetDisableFilter` staje się NIE_DOTYCZY, gdy web nie ma „Wyłącz filtr”. To osłabienie warunkowe, zależne od treści weba, jawne w logu i zgodne z usunięciem przycisku w 9b. Akceptowalne.
2. Hak `isAutoBuildEnabled` nie jest podpięty w kontrolerze v2 (P6, poza zakresem). Bez haka domyślnie `true`, jak w webie, więc w Tauri blok automatyzacji pokazuje się bez względu na przełącznik w `gamePauseMenu` do czasu P6.
3. DTO „Rust” w harnessie liczą funkcje weba 9b. Reguły po stronie Rust (deduplikacja surowców, `hexHasHorseDeposit`, `isHexNearRiver`) nie są zweryfikowane (U3C-Z2/Z5, poza allowlistą).
4. L2: jsdomErrors=354 i consoleErrors=150 nie są liczone jako różnice; nie porównałem ich z bazą `dde5e9034`.
5. `run-cycles.mjs` `riverMap.hexes = {}`: identyczne wejście dla obu stron, bez osłabienia.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control R-RUSTPORT-REPIN-WEB-UI-3-C-Q1 r1.
DEPLOY/PUSH: NIE WYKONANO
