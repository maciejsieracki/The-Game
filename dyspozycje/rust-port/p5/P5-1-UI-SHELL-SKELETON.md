# P5.1 — Szkielet frontendu Tauri `src-tauri/frontend-v2/` (UI-Q1=A: kopia paneli weba + Vite)

**Temat:** `R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5 + **2/5 (Obrona po FAIL Evaluatora r1 — §11)**
**Baza kodu:** `origin/rust-port/parity-v2` @ `8761c6c3` (detached). **Pin web:** `edb8fb56` (wyłącznie `git show` / `git archive` do scratch poza repo; zero buildu i zero `npm` w `gra/`).
**Dokumenty wejściowe** (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:…`): `p5/P5-0-VIEWMODEL-CATALOG.md` (całość), `p4/P4-5-UI-SHELL-AUDIT.md` (§4, §5), `p4/P4-5B-MAP-UI-SEAM.md` (§3.1, §4.1, §4.3, §5.2, §5.3, §11), `p2/P2-5-COMMANDS.md` (§1, §9), `LEDGER.md:134,141`; kod: `src-tauri/frontend/main.js:1-5,718-764`, `src-tauri/tauri.conf.json`, `src-tauri/src/lib.rs:28-55`, `rust-port/engine/src/bridge.rs:20-130`.
**Legenda:** `NIE_ZMIERZONO` = nie sprawdzone, nie wnioskuję; **ZAŁOŻENIE** = luka rozstrzygnięta rozsądną wartością domyślną (do rewizji).

## 0. Wynik w skrócie

| Kryterium binarne (dispatch) | Stan | Dowód |
|---|---|---|
| `src-tauri/frontend-v2/` istnieje | TAK | drzewo §1 |
| `npm ci` EXIT=0 | TAK | `r1-logi/01-npm-ci.log` |
| `npx tsc --noEmit` 0 błędów, EXIT=0 | TAK | `r1-logi/02-tsc.log` |
| `npm run check` 0 naruszeń, EXIT=0 | TAK | r2: `r2-logi/03-check.log` (self-test 33+15+1, cele `src,index.html,vite.config.ts`, `trafień=0`, `niezgodnych=0`); r1: `r1-logi/03-check.log` |
| `vite build` (tylko w `frontend-v2/`) EXIT=0 | TAK | `r1-logi/04-vite-build.log` |
| Kopie bajtowo zgodne z pinem | TAK, 39/39, **0 wyjątków** | §3 (tabela), `r1-logi/07-sha256-vs-git-show.log` |
| `PORTING-QUEUE.md` kompletna (49 modułów P5-0 + zależności) | TAK: 49 BEZPOŚREDNICH + 34 PRZECHODNICH = 83 | `src-tauri/frontend-v2/PORTING-QUEUE.md` |
| Zero zmian poza allowlistą; `git diff --check` czysty | TAK | §7 |

Brama wykrywa to, co ma wykrywać: na pinie `gra/src/ui` daje **220** trafień CORE w **49** plikach — dokładnie kalibracja P5-0 §9 pkt 1 (r2 po rozszerzeniu bramy nadal 220: `r2-logi/05-gate-calibration-pin.log`); mutacje r1 (wstrzyknięty `../data/loader`, inline `import('../game/…')`, `export … from '../../game/…'`; zmiana 1 bajtu kopii) i r2 (wieloliniowe `import(`/`from`, `'../game'` bez segmentu, `util`, `buildInfo`, `index.html` `src=` i inline module, `import.meta.glob`) dają EXIT=1 — każda osobno (`r2-logi/06-gate-mutation.log`, 11/11 + kontrola bez mutacji EXIT=0).

## 1. Struktura

```text
src-tauri/frontend-v2/
├── index.html                 KOPIA 1:1 gra/index.html (wejście /src/main.ts, #app)
├── tsconfig.json              KOPIA 1:1 gra/tsconfig.json (strict, noUncheckedIndexedAccess, verbatimModuleSyntax, include: src)
├── package.json               NOWY: devDependencies typescript 5.9.3, vite 5.4.21 (wersje = gra/package-lock.json @ edb8fb56); skrypty typecheck/check/build
├── package-lock.json          NOWY (npm install → npm ci)
├── vite.config.ts             NOWY: base './', outDir dist
├── .gitignore                 node_modules/, dist/
├── .gitattributes             `src/ui/techIcons.ts -whitespace` (ZAŁOŻENIE P5.1-Z9)
├── PORTING-QUEUE.md           83 moduły nieprzeniesione: kolejność, poziomy, cykle, DTO
├── tools/
│   ├── check-no-logic-imports.mjs   brama P5-0 §9 (poprawiony regex) + --self-test + --core-only
│   ├── verify-pin-copies.mjs        sha256 drzewa vs manifest
│   └── pin-manifest.json            39 wpisów: ścieżka, `edb8fb56:<ścieżka>`, sha256, bajty
└── src/
    ├── vite-env.d.ts          KOPIA 1:1 gra/src/vite-env.d.ts (deklaracje `*?raw` dla brandTokenVars/scienceOwlIcon)
    ├── main.ts                NOWY: punkt wejścia — tokeny marki, kontroler z atrapą, etykieta MOCK
    ├── ui/                    34 KOPIE 1:1 (+ icons/brand/tokens.css, icons/brand/tier1/res-science-24.svg)
    ├── viewmodel/types.ts     NOWY: typy DTO P5-0 §5–§6.17 + komunikaty granicy P4-5B (tylko typy)
    └── controller/            NOWY: commands.ts (typy komend), transport.ts (Tauri `invoke`/`listen`), mock.ts (MOCK), index.ts (API kontrolera)
```

`src-tauri/frontend/` (stary smoke) — **nietknięty** (D-UI-8). `tauri.conf.json` (`frontendDist: "frontend"`) — **nietknięty**.

## 2. Wybór plików do skopiowania (metoda i liczby)

1. `git archive edb8fb56 gra` → scratch poza repo; `r1-pomiar/graph.py` parsuje wszystkie `import … from`, `import '…'`, `export … from`, `import('…')`, `new URL('…')` w `gra/src/**/*.ts` i rozwiązuje ścieżki względne (w tym zasoby `?raw`).
2. `r1-pomiar/closure.py`: zbiór BEZPOŚREDNI = pliki `src/ui/**` z importem `game|map|units|battle|render|data` (`gra/src/data` i `gra/data`), `three` albo dowolnego modułu spoza `ui/` (`types`, `audio`, `perf`, `buildInfo`) → **49 plików, zbiór identyczny z P5-0 §3** (`queue.py`: „direct not in P5-0 table []”, „p50 not direct []”). Następnie skażenie przechodnie po importach `ui → ui`: **34 PRZECHODNIE**, **34 CZYSTE**. `closure.py` potwierdza, że CZYSTE importują wyłącznie CZYSTE (`cycles.py`: „clean deps on clean only: True”).
3. **ZAŁOŻENIE P5.1-Z1:** „niezależny od logiki” = czysty w domknięciu przechodnim. Kopia pliku z 0 bezpośrednich importów, który importuje np. `icons/brandAssets.ts` (→ `units/unitCategory`, `src/data/**`), wymagałaby albo skopiowania modułu z logiką (łamie P5.13 i bramę), albo zmiany bajtów kopii (łamie zgodność z pinem). 34 PRZECHODNIE są więc w kolejce, nie w kopii.
4. Zasoby: z CZYSTYCH tylko 2 importują pliki nie-TS — `brandTokenVars.ts:7` (`./icons/brand/tokens.css?raw`) i `icons/scienceOwlIcon.ts:6` (`./brand/tier1/res-science-24.svg?raw`); oba skopiowane. Żaden CZYSTY nie używa `import.meta.glob`/`new URL` (`grep -rn "import\.meta\|new URL("` po `src/ui` kopii → 0 trafień). Pozostałe zasoby `ui/**` (4 CSS, 2 PNG, 307 SVG, 8 JSON na pinie) należą do modułów z kolejki (`PORTING-QUEUE.md`, akapit „Wskazówka planistyczna”).
5. HTML: `gra/index.html` skopiowany 1:1 — jego `<script type="module" src="/src/main.ts">` wskazuje nowy `src/main.ts`; Vite przepisuje na `./assets/index-*.js` (`dist/index.html:37`). Style globalne poza `index.html` i `tokens.css`: brak w zbiorze CZYSTYM (style paneli są w TS, np. `sideListHud.css.ts`).
6. **Dane `data/**` — NIE kopiowane** (D-UI-4, rozstrzygnięcie orkiestratora; ZAŁOŻENIE P5.1-Z2 niżej).

Skopiowane moduły CZYSTE (34): `aiCivPicker`, `armyStackPrompt`, `brandTokenVars`, `buildStampToggle`, `buildingHoverTooltip`, `civElimNotice`, `empireBalance`, `empireMiastaTable`, `empirePanelSectionMap`, `entityCards/civpediaOpenGate`, `entityCards/slug`, `entityCards/types`, `escapeOverlayStack`, `formatPl`, `hoverDetailDock`, `hudLayout`, `hudPanelDismiss`, `hudTitleTooltip`, `icons/scienceOwlIcon`, `icons/scienceProgressRing`, `mapUnitCursor`, `markdownLite`, `minimapLayout`, `naukaLabel`, `resourceColors`, `scienceHubSnapshotLogic`, `sideListHud.css`, `sidePanelLayout`, `techIcons`, `treasuryBalanceFormat`, `triumphCityStateNotice`, `turnTransitionOverlay`, `unitCtxDockDiploGate`, `wonderCompletedNotice` (`.ts`).

## 3. Tabela kopii: sha256 kopii vs `git show edb8fb56:<ścieżka>`

Wygenerowana `r1-pomiar/shatable.py` (dla każdego wpisu manifestu: `git -C <worktree> show <pin>:<ścieżka>` → sha256, oraz sha256 pliku w drzewie). Log: `r1-logi/07-sha256-vs-git-show.log` (`files=39 mismatches=0`, `EXIT=0`). **Wyjątki (pliki zmienione względem pinu): brak.** Pliki NOWE (nie kopie): `package.json`, `package-lock.json`, `vite.config.ts`, `.gitignore`, `.gitattributes`, `PORTING-QUEUE.md`, `tools/*`, `src/main.ts`, `src/viewmodel/types.ts`, `src/controller/*.ts`.

| # | Plik w `src-tauri/frontend-v2/` | Źródło (`git show`) | Bajty | sha256 kopii | sha256 pinu | Zgodny |
|---:|---|---|---:|---|---|---|
| 1 | `index.html` | `edb8fb56:gra/index.html` | 1812 | `25c1cfcdb9198b2b7a7ccd57a5e3ac4065939fc5bbd4194b91234bd1d18f01c2` | `25c1cfcdb9198b2b7a7ccd57a5e3ac4065939fc5bbd4194b91234bd1d18f01c2` | TAK |
| 2 | `src/ui/aiCivPicker.ts` | `edb8fb56:gra/src/ui/aiCivPicker.ts` | 3539 | `24827022c974d8dd997a9a7436659e56e62c7ddf60216513190b818febfd7245` | `24827022c974d8dd997a9a7436659e56e62c7ddf60216513190b818febfd7245` | TAK |
| 3 | `src/ui/armyStackPrompt.ts` | `edb8fb56:gra/src/ui/armyStackPrompt.ts` | 6627 | `7cc2c169b2a265eb7b3ce64c81e3c02fde266bc48f2f1efa4c1576ab1e3aac56` | `7cc2c169b2a265eb7b3ce64c81e3c02fde266bc48f2f1efa4c1576ab1e3aac56` | TAK |
| 4 | `src/ui/brandTokenVars.ts` | `edb8fb56:gra/src/ui/brandTokenVars.ts` | 3805 | `11df3dee110c54d4cab72742182c360089d21f53b2dd119bf755b273236cb9c9` | `11df3dee110c54d4cab72742182c360089d21f53b2dd119bf755b273236cb9c9` | TAK |
| 5 | `src/ui/buildStampToggle.ts` | `edb8fb56:gra/src/ui/buildStampToggle.ts` | 2916 | `79d154a3370e13dac7c1bcd4f7bf9a934d8150ac6955dc7c3b0a48f7bd857a49` | `79d154a3370e13dac7c1bcd4f7bf9a934d8150ac6955dc7c3b0a48f7bd857a49` | TAK |
| 6 | `src/ui/buildingHoverTooltip.ts` | `edb8fb56:gra/src/ui/buildingHoverTooltip.ts` | 239 | `02b77dd20d42fbba10c426bec282aa2a3c5f277baf07f8a7c14b684a2a00b315` | `02b77dd20d42fbba10c426bec282aa2a3c5f277baf07f8a7c14b684a2a00b315` | TAK |
| 7 | `src/ui/civElimNotice.ts` | `edb8fb56:gra/src/ui/civElimNotice.ts` | 6349 | `52cdf7674498e894ab5174f81bbad07e70c2bb7423e7dc5efe202c1e8263505c` | `52cdf7674498e894ab5174f81bbad07e70c2bb7423e7dc5efe202c1e8263505c` | TAK |
| 8 | `src/ui/empireBalance.ts` | `edb8fb56:gra/src/ui/empireBalance.ts` | 4668 | `18d5170114f4cc992645cbd435e31a4ab4a7ec561fbd10d0cce6d68afa288ba3` | `18d5170114f4cc992645cbd435e31a4ab4a7ec561fbd10d0cce6d68afa288ba3` | TAK |
| 9 | `src/ui/empireMiastaTable.ts` | `edb8fb56:gra/src/ui/empireMiastaTable.ts` | 6550 | `b4eb5ff0665ed08d8caa0bf2ac6669ae490cf1b96779d90d2b66b2cbe614ec21` | `b4eb5ff0665ed08d8caa0bf2ac6669ae490cf1b96779d90d2b66b2cbe614ec21` | TAK |
| 10 | `src/ui/empirePanelSectionMap.ts` | `edb8fb56:gra/src/ui/empirePanelSectionMap.ts` | 9456 | `0ed29bdb871326613f6add9357213fecb6f98389e564786cd7e1a3e3e44c413c` | `0ed29bdb871326613f6add9357213fecb6f98389e564786cd7e1a3e3e44c413c` | TAK |
| 11 | `src/ui/entityCards/civpediaOpenGate.ts` | `edb8fb56:gra/src/ui/entityCards/civpediaOpenGate.ts` | 3626 | `d0054c9ea90540b811070f2fcbd51f8ecfe23c7c81ced8978d8c7cd14a2d6ea0` | `d0054c9ea90540b811070f2fcbd51f8ecfe23c7c81ced8978d8c7cd14a2d6ea0` | TAK |
| 12 | `src/ui/entityCards/slug.ts` | `edb8fb56:gra/src/ui/entityCards/slug.ts` | 2717 | `727eed9f1f7378a71362d4a715c8a63220dcf87158703ba51289c77ceaeb9b8c` | `727eed9f1f7378a71362d4a715c8a63220dcf87158703ba51289c77ceaeb9b8c` | TAK |
| 13 | `src/ui/entityCards/types.ts` | `edb8fb56:gra/src/ui/entityCards/types.ts` | 11191 | `3cd01b861ed7d8168445503c734eec186d62f04cca766a0d1f667ff3a6c89d81` | `3cd01b861ed7d8168445503c734eec186d62f04cca766a0d1f667ff3a6c89d81` | TAK |
| 14 | `src/ui/escapeOverlayStack.ts` | `edb8fb56:gra/src/ui/escapeOverlayStack.ts` | 4042 | `cebedfac5c316a428300014758a151b8585b3f07f52d9566072e72147eefd0aa` | `cebedfac5c316a428300014758a151b8585b3f07f52d9566072e72147eefd0aa` | TAK |
| 15 | `src/ui/formatPl.ts` | `edb8fb56:gra/src/ui/formatPl.ts` | 2938 | `e76cfe23efc9da1c5d4050e2f239e810e164b36b93115cd32db37d1b23649b0f` | `e76cfe23efc9da1c5d4050e2f239e810e164b36b93115cd32db37d1b23649b0f` | TAK |
| 16 | `src/ui/hoverDetailDock.ts` | `edb8fb56:gra/src/ui/hoverDetailDock.ts` | 11821 | `a3d67b463e34f803e67e359a6730597348a1e0552ba331477b83d69a301690c7` | `a3d67b463e34f803e67e359a6730597348a1e0552ba331477b83d69a301690c7` | TAK |
| 17 | `src/ui/hudLayout.ts` | `edb8fb56:gra/src/ui/hudLayout.ts` | 3310 | `28d0b26b3f8db0170bfd3f2fe601057a8310fef02de07f57bf35d1ab33bb1b12` | `28d0b26b3f8db0170bfd3f2fe601057a8310fef02de07f57bf35d1ab33bb1b12` | TAK |
| 18 | `src/ui/hudPanelDismiss.ts` | `edb8fb56:gra/src/ui/hudPanelDismiss.ts` | 1122 | `8ce6b9f1bcf89f99877c1772179c370785429c975c824afe083e057337795d55` | `8ce6b9f1bcf89f99877c1772179c370785429c975c824afe083e057337795d55` | TAK |
| 19 | `src/ui/hudTitleTooltip.ts` | `edb8fb56:gra/src/ui/hudTitleTooltip.ts` | 10294 | `08d6fee8e646ae21a351a7106a12f3fbbd3a02cec9ddb62c81134d7a562ef557` | `08d6fee8e646ae21a351a7106a12f3fbbd3a02cec9ddb62c81134d7a562ef557` | TAK |
| 20 | `src/ui/icons/brand/tier1/res-science-24.svg` | `edb8fb56:gra/src/ui/icons/brand/tier1/res-science-24.svg` | 490 | `acad6c665118046bea09093343ef2b40af05494858aa63c8810092fee03e8625` | `acad6c665118046bea09093343ef2b40af05494858aa63c8810092fee03e8625` | TAK |
| 21 | `src/ui/icons/brand/tokens.css` | `edb8fb56:gra/src/ui/icons/brand/tokens.css` | 4348 | `71ffe744d894783d14b53e393096ee482007dc84ed6ec928bc55a78f5eeff706` | `71ffe744d894783d14b53e393096ee482007dc84ed6ec928bc55a78f5eeff706` | TAK |
| 22 | `src/ui/icons/scienceOwlIcon.ts` | `edb8fb56:gra/src/ui/icons/scienceOwlIcon.ts` | 1291 | `1e2337e4a3edd98e69b3228ca4d4a480679964c86247e31d6c1255591aa658b6` | `1e2337e4a3edd98e69b3228ca4d4a480679964c86247e31d6c1255591aa658b6` | TAK |
| 23 | `src/ui/icons/scienceProgressRing.ts` | `edb8fb56:gra/src/ui/icons/scienceProgressRing.ts` | 1138 | `9be680850340c0aa4391b01ea378780682b75edbafab9ef8ceb378b063ccacbe` | `9be680850340c0aa4391b01ea378780682b75edbafab9ef8ceb378b063ccacbe` | TAK |
| 24 | `src/ui/mapUnitCursor.ts` | `edb8fb56:gra/src/ui/mapUnitCursor.ts` | 4120 | `45ff8208a7dabd7843c6a46ec1e651120440fe692832be7b89b2c79d8825df1e` | `45ff8208a7dabd7843c6a46ec1e651120440fe692832be7b89b2c79d8825df1e` | TAK |
| 25 | `src/ui/markdownLite.ts` | `edb8fb56:gra/src/ui/markdownLite.ts` | 3205 | `d62eb8c57c07eef36afbe36dff9ec0b37e158378109b647a3f27982814fcb7b9` | `d62eb8c57c07eef36afbe36dff9ec0b37e158378109b647a3f27982814fcb7b9` | TAK |
| 26 | `src/ui/minimapLayout.ts` | `edb8fb56:gra/src/ui/minimapLayout.ts` | 4963 | `2d1ce4ef608e639a1ad3b48432661dbea42665ec21ebacfbd6c28585211d9c96` | `2d1ce4ef608e639a1ad3b48432661dbea42665ec21ebacfbd6c28585211d9c96` | TAK |
| 27 | `src/ui/naukaLabel.ts` | `edb8fb56:gra/src/ui/naukaLabel.ts` | 546 | `080daba99c142687db33852504ac274c65e9dc5424892721974e2d19d04db8b1` | `080daba99c142687db33852504ac274c65e9dc5424892721974e2d19d04db8b1` | TAK |
| 28 | `src/ui/resourceColors.ts` | `edb8fb56:gra/src/ui/resourceColors.ts` | 5429 | `257bf5674faccdcdeaa9ddf53282af23521789a371aa3e6b54b71f0436ba8b5b` | `257bf5674faccdcdeaa9ddf53282af23521789a371aa3e6b54b71f0436ba8b5b` | TAK |
| 29 | `src/ui/scienceHubSnapshotLogic.ts` | `edb8fb56:gra/src/ui/scienceHubSnapshotLogic.ts` | 4284 | `15c93dfb0280640e57b3a085df0ee36b7486489d9e09e1faad70f786a09e4675` | `15c93dfb0280640e57b3a085df0ee36b7486489d9e09e1faad70f786a09e4675` | TAK |
| 30 | `src/ui/sideListHud.css.ts` | `edb8fb56:gra/src/ui/sideListHud.css.ts` | 9050 | `7ff6f34493faf1421853c3635ae4d43f47bc651a8737e06a6b9bcb7f0d31d1e8` | `7ff6f34493faf1421853c3635ae4d43f47bc651a8737e06a6b9bcb7f0d31d1e8` | TAK |
| 31 | `src/ui/sidePanelLayout.ts` | `edb8fb56:gra/src/ui/sidePanelLayout.ts` | 1669 | `7bb606522f4f5f7b0cc5147aecd86dc82e351352d5cd05886d69ee2d7926448d` | `7bb606522f4f5f7b0cc5147aecd86dc82e351352d5cd05886d69ee2d7926448d` | TAK |
| 32 | `src/ui/techIcons.ts` | `edb8fb56:gra/src/ui/techIcons.ts` | 14188 | `23d39e124e9f4366ac22e1496446f6ccc1935915b5617477686ad73a37c0e08c` | `23d39e124e9f4366ac22e1496446f6ccc1935915b5617477686ad73a37c0e08c` | TAK |
| 33 | `src/ui/treasuryBalanceFormat.ts` | `edb8fb56:gra/src/ui/treasuryBalanceFormat.ts` | 453 | `640e93f7a37cec554e7f88282b8fd0c86c79e74b3297b6d5704a223b2cb0d56e` | `640e93f7a37cec554e7f88282b8fd0c86c79e74b3297b6d5704a223b2cb0d56e` | TAK |
| 34 | `src/ui/triumphCityStateNotice.ts` | `edb8fb56:gra/src/ui/triumphCityStateNotice.ts` | 6489 | `54e417848187effed531b92c181b3c3ee1992afb718000cb0239b88a0d90b62d` | `54e417848187effed531b92c181b3c3ee1992afb718000cb0239b88a0d90b62d` | TAK |
| 35 | `src/ui/turnTransitionOverlay.ts` | `edb8fb56:gra/src/ui/turnTransitionOverlay.ts` | 4567 | `0959dc1b2661ee98b9cb58ff5e37934e44876270470c9057fbe31ba7a5142bef` | `0959dc1b2661ee98b9cb58ff5e37934e44876270470c9057fbe31ba7a5142bef` | TAK |
| 36 | `src/ui/unitCtxDockDiploGate.ts` | `edb8fb56:gra/src/ui/unitCtxDockDiploGate.ts` | 909 | `fcf4c9b4c627cf1715c2bc15b689492f1067203b03da4efadcde27928baf98dd` | `fcf4c9b4c627cf1715c2bc15b689492f1067203b03da4efadcde27928baf98dd` | TAK |
| 37 | `src/ui/wonderCompletedNotice.ts` | `edb8fb56:gra/src/ui/wonderCompletedNotice.ts` | 6325 | `901c56d5597d26d5ed9b12cba0f94bee76d8ebe9a2e69462c5188036334e8fa9` | `901c56d5597d26d5ed9b12cba0f94bee76d8ebe9a2e69462c5188036334e8fa9` | TAK |
| 38 | `src/vite-env.d.ts` | `edb8fb56:gra/src/vite-env.d.ts` | 614 | `d2f6540c0d9381d5e52325991d22d3c8975bd4d8ba486fd1f5d4a9643945669d` | `d2f6540c0d9381d5e52325991d22d3c8975bd4d8ba486fd1f5d4a9643945669d` | TAK |
| 39 | `tsconfig.json` | `edb8fb56:gra/tsconfig.json` | 461 | `ecbd969da3afc489083e354e018fdd12046432c0a644895391d0bf9937d38ad5` | `ecbd969da3afc489083e354e018fdd12046432c0a644895391d0bf9937d38ad5` | TAK |

## 4. Model widoku `src/viewmodel/types.ts`

- Wyłącznie `export type` / `export interface` (zero wartości, zero funkcji, zero importów). Nazwy typów 1:1 z P5-0 §6.0 — wszystkie 33 typy najwyższego poziomu: `StaticCatalogDto`, `CityPanelDto`, `CityRefDto`, `CityGrowthDto`, `CityRevoltDto`, `CityProductionDto`, `ProductionItemDto`, `BuildOptionDto`, `RecruitOptionDto`, `EmpireHudDto`, `EmpireDetailDto`, `DiplomacyBasketPreviewDto`, `TradeableItemsDto`, `DiplomacyAudienceDto`, `DealDisplayDto`, `DiploListDto`, `HexContextDto`, `ImprovementBuildImpactDto`, `UnitCardDto`, `ArmyStackDto`, `ResearchViewDto`, `NewGameOptionsDto`, `StartPreviewDto`, `EntityCardDto`, `SiegePanelDto`, `PreBattleDto`, `BattleSummaryDto`, `VictoryDto`, `MinimapDto`, `SaveSlotsDto`, `MapGenProgressEvent`, `HoverEvent`, `PerfReportDto`; plus nagłówek transportu `ViewRevision`/`ViewKey` (P5-0 Z6) i komunikaty granicy P4-5B (`HitRegions`, `CityPanelGeometry`, `UiState`, `MapClick`/`MapHit`, `HoverChanged`/`VeteranTip` — tylko typy, zgodnie z dispatchem).
- **ZAŁOŻENIE P5.1-Z3 (nazewnictwo):** pola w camelCase (P5-0 Z5: `serde(rename_all = "camelCase")`), np. `pct_per_turn` → `pctPerTurn`. Pola, których P5-0 nie rozpisał (odwołanie do typu web 1:1 — P5-0 §10 pkt 7/9: `UnitCardCombatDisplay`, `PostBattleSummaryData`, `MapSiegeContext`, `EraGateInfo`, `RebelState`, …), mają typ `NieZmierzonoDto = Readonly<Record<string, unknown>>` z komentarzem — do doprecyzowania w temacie portującym konsumenta.

## 5. Kontroler `src/controller/`

- `commands.ts`: `EngineCommand` = 6 wariantów istniejących dziś (`bridge.rs:26-45`, `tag = "kind"`, snake_case): `create_session`, `add_player`, `select_unit`, `move_unit`, `advance_turn`, `get_state`; koperta `BridgeRequest {contractVersion, requestId, command}` (`bridge.rs:49-54`), `BridgeResponse` (`:91-96`), `BridgeErrorCode` (`:122-129`), zdarzenie `state_changed` (`:100-110`); stałe `engine_command` (`lib.rs:28-29`) i `engine_state_changed` (jak `frontend/main.js:2-3`). `ProposedCommand` = mutacje/IO z P5-0 §7 i P2-5 §9 pkt 14 (`enqueue_build`, `dequeue_build`, `promote_build`, `move_build`, `city_set_paused`, `recruit_cancel`, `set_trade_split`, `set_labor_split`, `set_ration_level`, `list_saves`, `save_game`, `load_game`, `delete_save`, `camera_focus`, `get_view`) — **brak w silniku**, tylko kształt. `owner: PlayerId` jawnie w komendach (P2-5 §9 pkt 17).
- **ZAŁOŻENIE P5.1-Z4:** forma komend (D-CMD-1: osobne komendy Tauri vs warianty jednej) nierozstrzygnięta — w szkielecie warianty z `kind` w jednej `engine_command`, jak dziś. Zmiana formy dotyczy tylko `controller/index.ts:send`.
- `transport.ts`: interfejs `Transport {source, invoke, listen}`; `createTauriTransport()` używa `window.__TAURI__.core.invoke` / `.event.listen` (bez zależności `@tauri-apps/api`, jak `frontend/main.js:5,722,756`; `withGlobalTauri: true` w `tauri.conf.json`). **Nieużywany domyślnie.**
- `mock.ts`: `createMockTransport()` — **atrapa z etykietą MOCK**: `source: 'MOCK'`, każda odpowiedź ma `mock: 'MOCK'`, fikstury `MOCK_CITY` (`name: 'MOCK-Stolica'`) i `MOCK_GROWTH` to stałe (nic nie liczy); `advance_turn` tylko podbija licznik fikstury i emituje `engine_state_changed`, by sprawdzić ścieżkę zdarzenia.
- `index.ts`: `createController(transport)` → `send(command)`, `getView(key)` (= `get_view`, P5-0 Z6), `onStateChanged(handler)`.
- `main.ts`: `ensureBrandRootTokens()` (kopia `brandTokenVars.ts:110`), kontroler z atrapą, plakietka `MOCK` (`data-source="MOCK"`), linie z danymi fikstury z dopiskiem `[MOCK]`, przycisk „Koniec tury (MOCK)”. Formatowanie liczby kopią `formatPl.ts:42` (`formatLiczbaPl`) — czyste formatowanie (P5-0 Z1), nie reguła.

## 6. Brama „zero logiki w frontendzie” (`npm run check`)

`npm run check` = `check-no-logic-imports.mjs --self-test` → `check-no-logic-imports.mjs src` → `verify-pin-copies.mjs` (każdy krok musi dać EXIT 0).

1. **Regex P5-0 §9 pkt 1 z poprawkami.** Wykrywane formy specyfikatora: `from '…'`, `import '…'` (efekt uboczny), `import('…')` (dynamiczny i inline-typ `import('../game/…').T`), `export … from '…'`, `require('…')`, cudzysłowy `'`, `"`, `` ` ``; **r2:** także `import.meta.glob(…)` (wzorzec lub tablica wzorców), `new URL('…', import.meta.url)`, a w plikach `.html` atrybuty `src=`/`href=`. **r2: skan CAŁEGO tekstu pliku** (nie linii) — wieloliniowe `import(\n '…')` i `from\n '…'` są łapane, numer linii = linia specyfikatora. Naruszenie **CORE**: ścieżka względna (`./`, `../`), alias `@/` albo ścieżka od korzenia (`/src/…`, r2) z **segmentem katalogu** `game|map|units|battle|render|data` (łapie `../data/loader` i `../../data/*.json`), **r2:** albo kończąca się takim katalogiem (`'../game'`, `'@/data'` → `index`; tylko gdy segment stoi bezpośrednio po `./`/`../`/`@/`/`/src/` i NIE rozwiązuje się na dysku do pliku obok importującego — `entityCards/types.ts` ← `'./types'` to plik, `'../types'` to katalog), albo pakiet `three`/`three/…`. **EXT** (ZAŁOŻENIA P5.1-Z6, Z10): także `types|audio|perf|input|oblezenie|wonderpreview|util` (r2: `util`) — katalogi `gra/src/**` ze stanem/silnikiem/narzędziami gry — oraz moduł `buildInfo` (r2; `gra/src/buildInfo.ts`, zbiór bezpośredni P5-0 §3: `perfReport.ts:4`). **Cele `npm run check` (r2):** `src`, `index.html`, `vite.config.ts` (wcześniej tylko `src`). Różnica względem regexu P5-0: `(\.\./)+` → dowolny segment ścieżki względnej (łapie też `./game/…` z poziomu `src/`), dodany `import '…'` i `require`.
2. **Kalibracja na pinie** (r1: `r1-logi/05-gate-calibration-pin.log`; r2: `r2-logi/05-gate-calibration-pin.log`): `--core-only` na `gra/src/ui` @ `edb8fb56` → `plików_z_trafieniami=49 trafień=220` (game 148 = 142 + 6 inline, data 41, map 13, render 8, units 6, three 2, battle 2) = **P5-0 §9 pkt 1: 220** — w r2 bez zmian (pin nie ma wieloliniowych importów logiki ani `'../game'` bez segmentu). Z EXT: r1 230 (+ types 7, audio 2, perf 1), **r2 231** (+ `buildInfo` 1: `perfReport.ts:4`), nadal 49 plików. Kontrola fałszywych trafień r2: pierwsza wersja reguły „ostatni segment” dała 238/51 (7 × `entityCards/*` → `'./types'` = plik `entityCards/types.ts`) — stąd rozstrzyganie plik/katalog na dysku (pkt 1); po poprawce 231/49.
3. **Self-test** (`--self-test`): r1 15 pozytywnych + 8 negatywnych; **r2: 33 pozytywne** (r1 + wieloliniowe `import(`/`from`/inline-typ, `'../game'`, `'../../map'`, `export * from './units'`, `'@/data'`, `'../util/norm-pl-label'`, `'../buildInfo'`, `'../../buildInfo.ts'`, `import.meta.glob` wzorzec i tablica, `new URL`, 3 próbki HTML: `<script src="/src/game/…">`, inline `<script type="module">import … from "./game/x"`, `<link href="../data/…">`, 2 próbki na dysku: `'../types'` = katalog, `'../game'` bez pliku) **+ 15 negatywnych** (r1 + `./gameplayHints`, `./minimap`, `./utilities`, `./ui/sideListHud.css`, HTML `src="/src/main.ts"`, `href="https://…/game/x"`, plik `'./types'` na dysku) **+ 1 test numeru linii** → `błędów: 0` (`r2-logi/03-check.log`).
4. **Mutacje** — r2 (`r2-logi/06-gate-mutation.log`, skrypt `r2-pomiar/gates.sh`): każda na świeżej kopii `src`+`index.html`, osobno: R2-M1 wieloliniowe `import(\n '../game/x')` → `formatPl.ts:67 [CORE:game]`; R2-M2 `'../game'` → `[CORE:game]`; R2-M3 `'../util/norm-pl-label'` → `[EXT:util]`; R2-M4 `'../buildInfo'` → `[EXT:buildInfo]`; R2-M5 `index.html` `<script src="/src/game/boot.ts">` → `index.html:43 [CORE:game]`; R2-M6 `index.html` inline module `from '/src/data/loader.ts'` → `index.html:44 [CORE:data]`; R2-M7 wieloliniowe `from\n '../../gra/src/data/loader'` → `main.ts:62 [CORE:data]`; R2-M8 `import.meta.glob('./units/**/*.json')` → `[CORE:units]`; R1-M1..M3 (regresja) → trafione; każda **EXIT=1**; kopia bez mutacji EXIT=0; +1 bajt `naukaLabel.ts` → `niezgodnych=1` EXIT=1, po przywróceniu EXIT=0. r1 (`r1-logi/06-gate-mutation.log`): kopia `src` + `import { loadGameData } from '../data/loader'` i `type E = import('../game/research').EraGateInfo` w `ui/formatPl.ts` + nowy `controller/leak.ts` z `export { x } from '../../game/production'` → `trafień=3`, **EXIT=1**. Zmiana 1 bajtu `ui/naukaLabel.ts` → `verify-pin-copies` `niezgodnych=1`, **EXIT=1**; po przywróceniu EXIT=0.
5. **Reguły bez importu (P5-0 §9 pkt 3) — przegląd ręczny zbioru CZYSTEGO (34 moduły TS), linia po linii (r2).** Brama 1 ich nie wykrywa. Metoda: przeczytany w całości każdy z 34 plików `src/ui/**/*.ts` w `frontend-v2` (= bajty pinu, §3); literały CSS/SVG przejrzane pod kątem wyrażeń `${…}` (tylko stałe układu i kolorów). Kryterium **REGUŁA**: kod rozstrzyga o legalności akcji, dostępności lub limicie albo liczy wartość pochodną gry z surowego stanu. **GRANICZNY**: agregacja, priorytet albo klucz danych zależny od semantyki gry, bez rozstrzygania legalności. **CZYSTY**: układ, DOM, formatowanie, tekst, stan UI. `tokens.css` i `res-science-24.svg` to zasoby, CZYSTE. Wynik: **3 REGUŁA + 6 GRANICZNY + 25 CZYSTY = 34**. Wszystkie skopiowane 1:1 (warunek bajtowej zgodności, §3). Z wyjątkiem `brandTokenVars`, `resourceColors` i `formatPl` są **nieużywane** w `frontend-v2` (`vite build`: 12 modułów). Gdy kod P5.x zaimportuje któryś moduł REGUŁA lub GRANICZNY, regułę trzeba zastąpić wskazanym polem DTO.

| # | Moduł (`src/ui/…`) | Wynik | Plik:linia — co liczy | Docelowe DTO (P5-0 §6) / decyzja |
|---:|---|---|---|---|
| 1 | `aiCivPicker.ts` | **REGUŁA** | `:22-25` limit przeciwników = `floor(civ_types_count) − 1` (min 0); `:31-36` kandydaci = pula epoki bez nacji gracza; `:49-65` sanityzacja wyboru (tylko id z puli, bez duplikatów, limit, „pierwsze N w kolejności zaznaczenia”); `:74-76` blokada karty po osiągnięciu limitu. Nagłówek `:1-14` sam nazywa to logiką i formułami wydzielonymi z `newGameFlow.ts` | `NewGameOptionsDto`: proponowane pola `aiCivCap: number` i `aiCivCandidateIds: CivId[]` (per wybrana epoka/nacja); sanityzacja listy przeciwników po stronie silnika przy `create_session` (`StartGameParams`); UI tylko wyłącza karty wg `aiCivCap` |
| 2 | `scienceHubSnapshotLogic.ts` | **REGUŁA** | `:53,56-70` numer epoki gracza → etykieta (`EPOCH_ORDER`, `round(era) − 1`, przycięcie); `:89-92` cel badań dopisywany do dostępnych, gdy niezbadany; `:103-118` lista „Możesz wybrać” = dostępne z bieżącej epoki; `:121-134` podgląd max 4 zablokowanych (`locked`); `:114,129` koszt przez wstrzyknięty `costFor` | `ResearchViewDto.techs[].state`/`effectiveCost`/`epoka` (§6.9) + proponowane `ResearchViewDto.hubEpoch: string` |
| 3 | `mapUnitCursor.ts` | **REGUŁA** | `:75-116` `resolveMapUnitCursor` rozstrzyga legalną akcję pod kursorem: atak, gdy `ruchLeft > 0` i wróg widoczny (fallback `dist ≤ 1` bez mgły, `:85-89`); atak na obce miasto tylko w sąsiedztwie `dist ≤ 1` (`:92-96`); wejście do własnego miasta, scalenie z własną jednostką lub ruch wg `reachable` (`:99-112`). Stałe kursorów `:7-52` to prezentacja | proponowane `HexContextDto.cursorAction: 'attack' \| 'enter_city' \| 'merge' \| 'move' \| 'none'` (albo to samo pole w `HoverChanged`, P4-5B); UI mapuje tylko enum → `CURSOR_MAP_*` |
| 4 | `empireMiastaTable.ts` | GRANICZNY | `:74-87` suma rekordów surowców (pomija `≤ 0`); `:119-143` wiersz podsumowania: sumy kolumn i **średnia** `wzrostProcent` zaokrąglona (`:138`). Nagłówek `:14-19`: agregacja liczb już policzonych przez silnik. Kolumny i widoczność `:45-65` to prezentacja | proponowane `EmpireDetailDto.citiesSummary` (sumy i średnią wzrostu liczy silnik): to wartość widoczna dla gracza, ma być identyczna z Rust |
| 5 | `sideListHud.css.ts` | GRANICZNY | `:115-126` `armyStatusBadge`: kolejność priorytetu 4 stanów armii (garnizon > ufortyfikowana > uśpiona > auto-eksploracja). Wg `:108-112` stany wzajemnie się wykluczają, ale priorytet rozstrzyga UI. `:131-134` `pctClamped` i `:141-145` próg HP 30 % to prezentacja | proponowane `ArmyStackDto.cards[].status` (enum z silnika); próg koloru HP zostaje w UI |
| 6 | `empirePanelSectionMap.ts` | GRANICZNY | `:121-126` widoczność suwaków wg modelu ekonomii („Nauka finansowana % podatku”, `:106-113`); `:24-96` i `:129-150` to routing zakładek, bez liczenia wartości | zostaje w UI (routing). Jeśli silnik zmieni model finansowania nauki, potrzebne będzie pole widoczności w `EmpireDetailDto` (dziś bez nowego pola) |
| 7 | `entityCards/slug.ts` | GRANICZNY | `:30-49` `slugify`: normalizacja nazw do identyfikatorów encji, które muszą zgadzać się z id silnika (nagłówek `:5-11` opisuje dryf względem `research.ts:199`) | `EntityCardDto.id` = kanoniczne id z silnika (§6.11); `slugify` tylko jako klucz hasła CivPedii |
| 8 | `techIcons.ts` | GRANICZNY (dane) | `:14-47` mapa ikon kluczowana polską nazwą technologii z `gra/data/tech.json` (`:13`); `:55-76` podmiana rozmiaru to prezentacja | klucz po `TechId` ze `StaticCatalogDto.tech` (przy porcie modułów badań) |
| 9 | `triumphCityStateNotice.ts` | GRANICZNY (tekst) | `:81-92` treść odtwarza sens `buildTriumphCityStateUnificationMessage()` z `game/triumph-city-state.ts` (komentarz `:13-16`); dane wejściowe przychodzą gotowe | dziś prezentacja; przy porcie tekst lub klucz komunikatu z silnika w zdarzeniu triumfu |
| 10–34 | `armyStackPrompt.ts`, `brandTokenVars.ts`, `buildStampToggle.ts`, `buildingHoverTooltip.ts`, `civElimNotice.ts`, `empireBalance.ts`, `escapeOverlayStack.ts`, `formatPl.ts`, `hoverDetailDock.ts`, `hudLayout.ts`, `hudPanelDismiss.ts`, `hudTitleTooltip.ts`, `markdownLite.ts`, `minimapLayout.ts`, `naukaLabel.ts`, `resourceColors.ts`, `sidePanelLayout.ts`, `treasuryBalanceFormat.ts`, `turnTransitionOverlay.ts`, `unitCtxDockDiploGate.ts`, `wonderCompletedNotice.ts`, `entityCards/civpediaOpenGate.ts`, `entityCards/types.ts`, `icons/scienceOwlIcon.ts`, `icons/scienceProgressRing.ts` (25) | CZYSTY | układ i geometria (`hudLayout`, `minimapLayout`, `sidePanelLayout`), DOM, modale, tooltipy, stos Escape, tokeny i kolory, formatowanie liczb i odmiana (`formatPl:42-63`, `treasuryBalanceFormat:8-12`: zaokrąglenie tylko do wyświetlenia), przycięcia pasków (`turnTransitionOverlay:97`, `scienceProgressRing:16`). Uwagi: w `armyStackPrompt` scalenie wykonuje wywołujący (`onMerge`/`onKeep`, `:24-28`); `empireBalance` tylko wyświetla `getBalance()` (`:74`); `entityCards/types:180-186` ma `EntityCardCtx.gameData: unknown` (bez importu `data/loader`) | brak |

Ten sam wynik (pozycje 1–9) jest w akapicie „Reguły wpisane bez importu” w `PORTING-QUEUE.md`.

## 7. Allowlista, Git, sprzątanie

- Zmienione/dodane ścieżki wyłącznie: `src-tauri/frontend-v2/**`, `dyspozycje/rust-port/p5/P5-1-UI-SHELL-SKELETON.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/**` (`r1-logi/08-git.log`: `git status --porcelain`, `git diff --cached --stat`, `git diff --cached --check`).
- `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**` — bez zmian (ten sam log: `git diff --cached --name-only -- <ścieżki zakazane>` → puste).
- `git diff --cached --check`: pierwsze wywołanie zgłosiło `src-tauri/frontend-v2/src/ui/techIcons.ts:77: new blank line at EOF.` — to bajty pinu (`edb8fb56:gra/src/ui/techIcons.ts` kończy się `}\n\n`), których nie wolno zmienić (§3). Rozwiązanie: `.gitattributes` z `src/ui/techIcons.ts -whitespace` (ZAŁOŻENIE P5.1-Z9); po nim `git diff --cached --check` → EXIT=0 (`r1-logi/08-git.log`), sha256 bez zmian.
- `node_modules/` i `dist/` usunięte po bramach (`.gitignore` w `frontend-v2/` je wyklucza); `package-lock.json` w commicie.
- Commit z jawnym `git add <ścieżki>` (bez `-A`), bez push. Logi `r1-logi/*.log` są objęte `*.log` w `.gitignore:20` (`git check-ignore -v`), więc dodane jawnie `git add -f <8 ścieżek>` (precedens: 5 plików `.log` już śledzonych w `dyspozycje/autobot/runs/`); skrypt `r1-pomiar/gitlog.sh`. `00-dispatch.md` dołączony jako kopia bajtowa z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (żeby `runs/<ID>/` był kompletny na gałęzi kodu).

## 8. ZAŁOŻENIA

| ID | Treść | Gdzie |
|---|---|---|
| D-UI-4 (orkiestrator, tymczasowe) | JSON statyczny wolno czytać w webview tylko jako ten sam plik (kopia bajtowo identyczna z `rust-port/engine/data/`), bez własnej logiki; **w tej rundzie danych nie kopiuję** | §2 pkt 6 |
| D-UI-8 (orkiestrator, tymczasowe) | `src-tauri/frontend/` zostaje jako smoke do końca P5; `tauri.conf.json` bez zmian (przełączenie `frontendDist` = osobny temat) | §1 |
| P5.1-Z1 | „niezależny od logiki” = czysty w domknięciu przechodnim (34), nie tylko bezpośrednio (68) | §2 pkt 3 |
| P5.1-Z2 | Brama dopuszcza w przyszłości wyjątek D-UI-4 tylko przez jawną listę plików + test hash (P5-0 §9 pkt 2) — dziś lista pusta, więc każdy `data/` = naruszenie | §6 pkt 1 |
| P5.1-Z3 | Pola DTO w camelCase; nierozpisane typy web jako `NieZmierzonoDto` | §4 |
| P5.1-Z4 | Komendy jako warianty `kind` w `engine_command` (D-CMD-1 otwarte) | §5 |
| P5.1-Z5 | `gra/index.html`, `gra/tsconfig.json`, `gra/src/vite-env.d.ts` kopiowane 1:1 (warunek „plik skopiowany bajtowo identyczny”); własny jest tylko `src/main.ts` | §1, §3 |
| P5.1-Z6 | Brama rozszerzona o katalogi EXT (`types|audio|perf|input|oblezenie|wonderpreview`); `--core-only` odtwarza dokładnie regex P5-0 | §6 pkt 1–2 |
| P5.1-Z7 | Wersje narzędzi = `gra/package-lock.json` @ `edb8fb56` (`typescript` 5.9.3, `vite` 5.4.21), przypięte dokładnie; bez `@tauri-apps/api` (globalny `window.__TAURI__`) | §1, §5 |
| P5.1-Z8 | `PORTING-QUEUE.md` w `src-tauri/frontend-v2/` (dispatch nie podaje ścieżki); kolejność = poziomy grafu po zwinięciu cykli, nie priorytet produktowy | `PORTING-QUEUE.md` |
| P5.1-Z9 | Kopia bajtowa ma pierwszeństwo przed `git diff --check`: zamiast usuwać pustą linię EOF w `techIcons.ts`, wyłączam dla tego jednego pliku atrybut `whitespace` | §7 |
| P5.1-Z10 (r2) | EXT obejmuje też `util` i moduł `buildInfo` (moduły `gra/src/` spoza `ui/`, P5-0 §3 / §2 pkt 2); reguła „ostatni segment = katalog logiki” działa tylko bezpośrednio po `./`/`../`/`@/`/`/src/` i gdy specyfikator nie rozwiązuje się na dysku do pliku — brak pliku = traktowany jako katalog (bezpieczny nadmiar). Moduł `gra/src/main.ts` NIE jest w EXT, bo `frontend-v2/src/main.ts` to własny punkt wejścia (`index.html:40`) | §6 pkt 1 |
| P5.1-Z11 (r2) | Pola DTO dla reguł z §6 pkt 5 (`aiCivCap`, `aiCivCandidateIds`, `hubEpoch`, `cursorAction`, `citiesSummary`, `cards[].status`) to **propozycje** — `viewmodel/types.ts` nie jest rozszerzany ponad P5-0 §6 w tym temacie (nazewnictwo 1:1 z P5-0); dopisanie do katalogu P5-0 przy temacie portującym konsumenta | §6 pkt 5 |

## 9. `NIE_ZMIERZONO`

1. ~~Reguły gry wpisane bez importu w 34 skopiowanych plikach~~ — **r2: ZMIERZONE** (pełny przegląd 34 plików, §6 pkt 5). Nadal NIE_ZMIERZONO: reguły bez importu w 83 modułach kolejki poza 3 pozycjami z P5-0 (przegląd przy porcie każdego modułu).
2. **Renderowanie** w przeglądarce/webview: nie uruchamiałem serwera dev (zakaz) ani okna Tauri (brak okna/GPU). Nie twierdzę, że szkielet „działa w oknie Tauri”. Zmierzone tylko: `tsc` 0 błędów, `vite build` EXIT 0, `dist/index.html:37` wskazuje `./assets/index-CbORj_XS.js`, w bundlu są napisy `MOCK`/`MOCK-Stolica`.
3. 32 z 34 skopiowanych modułów nie są osiągalne z `main.ts` → sprawdzone `tsc` (`include: src`), ale nie zbundlowane ani wykonane (`vite build`: 12 modułów).
4. Zgodność kształtów `viewmodel/types.ts` z przyszłymi `struct` Rust — brak strony Rust; test serde (round-trip JSON) do tematu implementującego DTO.
5. Zgodność koperty `BridgeRequest` w `controller` z `bridge.rs` sprawdzona czytaniem kodu (`bridge.rs:49-54`, `frontend/main.js:722-728`), nie wywołaniem.
6. Kształt `PlayableState`/`StartGameParams` w TS — nie odwzorowany (typ `unknown`/`Record`).
7. Wpływ `import.meta.glob` (`brandAssets.ts:23`, `leaderPortraits.ts:172`) na build `frontend-v2` po przeniesieniu modułów kolejki — do tematu portującego `brandAssets.ts`.

## 10. Surowe logi bram (`dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/r1-logi/`)

Skrypt: `r1-pomiar/gates.sh` (każdy krok kończy się `echo "EXIT=$?"`).

| Log | Komenda | Wynik |
|---|---|---|
| `01-npm-ci.log` | `npm ci --no-audit --no-fund` (po `rm -rf node_modules dist`; node v22.22.0, npm 10.9.4) | `added 13 packages`, `EXIT=0` |
| `02-tsc.log` | `npx tsc --noEmit` | brak wyjścia, `EXIT=0` |
| `03-check.log` | `npm run check` | `self-test: 15 pozytywnych, 8 negatywnych, błędów: 0` · `katalog=src plików=41 plików_z_trafieniami=0 trafień=0` · `verify-pin-copies: pin=edb8fb56 plików=39 niezgodnych=0` · `EXIT=0` |
| `04-vite-build.log` | `npx vite build` | `✓ 12 modules transformed`, `dist/index.html 1.83 kB`, `dist/assets/index-CbORj_XS.js 10.08 kB`, `EXIT=0` |
| `05-gate-calibration-pin.log` | brama na `<pin>/gra/src/ui` (`--core-only` i pełna) | `plików_z_trafieniami=49 trafień=220 (tylko CORE)`; pełna `trafień=230`; `EXIT=1` (oczekiwane — pin łamie P5.13) |
| `06-gate-mutation.log` | mutacje §6 pkt 4 | `trafień=3` `EXIT=1`; `niezgodnych=1` `EXIT=1`; po przywróceniu `EXIT=0` |
| `07-sha256-vs-git-show.log` | `python3 -I r1-pomiar/shatable.py` | `files=39 mismatches=0`, `EXIT=0` |
| `08-git.log` | `git status`, `git diff --cached --stat/--check`, ścieżki zakazane | §7 |

Odtworzenie wyboru plików i kolejki: `git archive edb8fb56 gra | tar -x -C <scratch>/pin`; `python3 -I graph.py <scratch>/pin/gra graph.json`; `python3 -I closure.py graph.json closure.json`; `python3 -I cycles.py closure.json`; `python3 -I copy_pin.py <worktree> closure.json`; `python3 -I queue.py graph.json closure.json P5-0-VIEWMODEL-CATALOG.md <scratch>/pin/gra queue-table.md` (pliki w `r1-pomiar/`; `closure.json` dołączony).

## 11. Runda 2: Obrona (odpowiedź na FAIL Evaluatora r1)

Stan odtworzony z commita Operatora r1 `f6db0040` (worktree `wf_bcb1b0ee-f7d-3`, gałąź `p51-r2`). Raport rundy: `dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/02-operator-r2.md`.

| Zarzut / uwaga | Odpowiedź | Dowód |
|---|---|---|
| 1. Brak pełnego przeglądu reguł bez importu (34 pliki); pominięty `aiCivPicker.ts:22-25,48-60`; `empireMiastaTable.ts:138` | **PRZYJMUJĘ** | §6 pkt 5: tabela 34 plików (3 REGUŁA, 6 GRANICZNY, 25 CZYSTY) z plik:linia i DTO; akapit „Reguły wpisane bez importu” w `PORTING-QUEUE.md`; §9 pkt 1 |
| 2. Brama pomija formy importu (wieloliniowe `import(`, `'../game'`, `util`/`buildInfo`, `index.html`) | **PRZYJMUJĘ** | `tools/check-no-logic-imports.mjs`: skan całego tekstu, ostatni segment, EXT `util` i `buildInfo`, HTML `src=`/`href=`, `import.meta.glob`, `new URL`. `check` w `package.json` skanuje `src index.html vite.config.ts`. Self-test 33+15+1; mutacje R2-M1..M8 dają EXIT=1 (`r2-logi/06-gate-mutation.log`); kalibracja nadal 220 (`r2-logi/05-gate-calibration-pin.log`) |
| (a) `commands.ts` `rawPercent` vs snake_case pól wariantów w `bridge.rs` | **PRZYJMUJĘ** | `src/controller/commands.ts:49` → `raw_percent`. Pola wariantów `kind` są w snake_case jak `unit_id` w `bridge.rs`; koperta `BridgeRequest` zostaje w camelCase |
| (b) `.gitattributes` `-whitespace` dla `techIcons.ts` (Z9) | bez zmian, orkiestrator powinien to świadomie potwierdzić | §7, §8 Z9 |

Bramy r2 (`r2-logi/`, skrypt `r2-pomiar/gates.sh`): `npm ci` EXIT=0, `npx tsc --noEmit` EXIT=0, `npm run check` EXIT=0, `npx vite build` EXIT=0 (12 modułów). Po bramach `node_modules` i `dist` usunięte.
