STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-B-Q1
GOAL: REPIN UI partia UI-2-B (`P5-REPIN-UI-2.md` #5–#9): kopie bajtowe `aiOwnerProgressFrame`, `armyMergePanel`, `armySplitPanel`; porty DOM `unitReplacePicker` (`blockedReason`) i `siegeMapPanel` (`SiegePanelDto.milicjaRegen?`, bez „~”); harness web↔port w Chromium, mutacje, regresja na nakładce, rekalibracja wyceny.

ZMIANY/COMMIT (branch `operator/R-RUSTPORT-REPIN-UI-2-B-Q1` od `parity-v2` `2198eaf7e`; web `origin/main` = `86d510c66`, `git log 86d510c66..origin/main -- gra/src/ui` = pusto):
- `6d7d31ca6` kod: `src-tauri/frontend-v2/src/ui/{aiOwnerProgressFrame (NOWY),armyMergePanel,armySplitPanel}.ts` (kopie, numstat = web 156/55, 185/86), `{unitReplacePicker,siegeMapPanel}.ts` (+20/−2, +7/−1), `viewmodel/types.ts` (+5, tylko `milicjaRegen`), `tools/repin-ui2-manifest.json` (files 4→7 + NOWE `portDomRefs` 2), `tools/pin-manifest.json` (433→431), `tools/verify-repin-ui2-copies.mjs`, `tools/repin-ui2-overlay.mjs`, `tools/dom-harness/{run,mutate}-repin-ui2b.mjs`, `fixtures/repin_ui2b-web-vectors.json`, `run-level1a.mjs` (+7: estymator Milicji na nakładce), `package.json` (2 skrypty).
- `9f537dc9e` `dyspozycje/rust-port/p5/P5-REPIN-UI-2.md`: statusy #5–#9, §2b, rekalibracja §1a, kolejka §4.
- Ten raport: commit poniżej. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`.

TESTY (`src-tauri/frontend-v2`, `npm ci`; `node_modules` potem usunięty):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (`verify-pin-copies` 431/0; `verify-repin-ui2-copies` 7/0, git 7, `portDomRefs` 2/2).
- `run-repin-ui2b` (Chromium 141): 192 sceny × 2 okna (1280×720, 360×640), 1356 kroków, różnic=0, 14 PNG bajtowo równych (merge/split 20 i 45 jedn.), pokrycie 55/55, `pageerror`+`console.error`=0, EXIT=0.
- Weryfikator: dwa osobne `git archive` → ta sama fixtura (sha256 `cf0ed612…1dda4e`, `webVectorsSha256=7331844c…d504b9`); powtórzone po commicie.
- `mutate-repin-ui2b`: 37/37 wykrytych (4 wywołania). Pierwotna A3 była RÓWNOWAŻNA → zastąpiona.
- Regresja na nakładce: L0 3861/0, L1A 3618/0, L2 1784/0 (jsdom 354/console 150 jak baza), C4 1649/0 (75), cycles 6401/0, hud 927/0, newgame 1194/0, cityux 164/0. Czysty pin: L1A 70 różnic (oczekiwane: 58 „~”, 12 merge).
- `git diff --check` czysty. Cargo: nie dotyczy.

BLOKADY: brak. NIE_ZMIERZONO: GPU/natywne okno Tauri.
UWAGI: (1) ZAŁOŻENIA Z4/Z5 w §2b: `milicjaEst`/`milicjaRegen` to dane DTO (settery webu nieportowane), producent = P6. (2) Zrzuty PNG z `scrollbar-color: transparent`: kciuk paska (7 px) różnił się między przebiegami mimo tego samego DOM. (3) L1A `armyMergePanel` DOM_puste 12/12, bo modal montowany w `<html>`; pokrywa to run-repin-ui2b. (4) INFRA: współdzielony scratchpad wyczyściła równoległa sesja (katalogi odtworzone); dysk 98%. (5) Przerwana przez `timeout` mutacja zostawiła raz `unitReplacePicker.ts` zmutowany; przywróciłem plik przed testami i dodałem obsługę sygnałów.

RUNDY: 1/5 (wycena 2 rundy)
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-UI-2-B-Q1 r1; potem UI-2-C (C1 = #10+#12+#13).
DEPLOY/PUSH: NIE WYKONANO
