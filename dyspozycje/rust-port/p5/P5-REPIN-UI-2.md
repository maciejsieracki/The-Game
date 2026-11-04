# P5-REPIN-UI-2 — repin UI frontend-v2 do aktualnego weba (Faza U3, część A)

TEMAT: `R-RUSTPORT-REPIN-UI-2-A-Q1` · runda 1 (Operator), runda 2 = wycena §1a/§4 · baza `rust-port/parity-v2` `612ad455e`
Plan nadrzędny: `dyspozycje/rust-port/PLAN-AKTUALIZACJI-PORTU-DO-WEBA-20261030.md` §3 „UI”.

## 0. Punkty odniesienia (zmierzone)

| Nazwa | SHA | Źródło pomiaru |
|---|---|---|
| pin P5 (manifest kopii) | `edb8fb561` (2026-10-17) | `src-tauri/frontend-v2/tools/pin-manifest.json` pole `pin` |
| pin planu repinu | `dc8a3adc9` (2026-10-30) | dispatch; `git log -1 dc8a3adc` |
| web bieżący | `origin/main` = `86d510c667268880414d693532ca012c9310589e` | `git rev-parse origin/main` (2026-11-04) |
| commity `edb8fb56..origin/main` | 636 | `git rev-list --count` |

**Faktyczna ścieżka frontendu** (pomiar, nie `rust-port/frontend-v2`): `src-tauri/frontend-v2/` (TS + Vite, kontroler
MOCK/Tauri, harnessy `tools/dom-harness/`). ZAŁOŻENIE Z1: dispatch dopuszcza „odpowiednik ścieżki ustalony pomiarem”,
więc allowlista UI = `src-tauri/frontend-v2/**`; zakaz `src-tauri/**` z dispatchu dotyczy części natywnej
(`src-tauri/src/**`, `Cargo.*`, `tauri.conf*`) — tych plików nie zmieniono.

## 1. Pomiar dryfu plików UI (`gra/src/ui/**`, `edb8fb56 → 86d510c66`)

Wiersze `+/-` z `git diff --numstat`; „v2” = stan pliku w `src-tauri/frontend-v2/src/ui/` na bazie:
`PINBYTE` = bajtowo równy `edb8fb56` (w manifeście), `MOD` = port DOM/DTO (zmieniony względem pinu), `—` = brak pliku.
Hunki = początki zakresów po stronie `origin/main` (`git diff -U0`, `plik:linia+liczba`; „…” = dalsze hunki).

| # | Plik web | e→m | d→m | v2 | Hunki (main) | Funkcja webu (commit) | Klasa | Moduł port | Status / partia |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `formatCompactNumber.ts` | +77/−0 | +77/−0 | — → kopia | `:1+77` | skracanie liczb HUD `20860 → 20,9k` (`62884e25f`) | kopia bajtowa | `src/ui/formatCompactNumber.ts` | **ZROBIONE UI-2-A** |
| 2 | `recruitHudLabel.ts` | +5/−0 | 0 | — → kopia | `:1+5` | etykieta rekrutów „N (pełne)” | kopia bajtowa | `src/ui/recruitHudLabel.ts` | **ZROBIONE UI-2-A** |
| 3 | `hudChip6c.ts` | +6/−1 | +6/−1 | PINBYTE → main | `:30+3 :56+2 :59` | `exact` → `title`/`aria-label` (`62884e25f`) | kopia bajtowa | `src/ui/hudChip6c.ts` | **ZROBIONE UI-2-A** |
| 4 | `unitActionBarHtml.ts` | +11/−2 | 0 | PINBYTE → main | `:33+2 :37 :39 :135+8` | ikony split/merge, przycisk `general-follow` | kopia bajtowa | `src/ui/unitActionBarHtml.ts` | **ZROBIONE UI-2-A** |
| 5 | `aiOwnerProgressFrame.ts` | +16/−0 | 0 | — | `:1+16` | ramka postępu tury AI | kopia bajtowa (main: 0 instrukcji `import`) | nowy `src/ui/aiOwnerProgressFrame.ts` | UI-2-B |
| 6 | `armyMergePanel.ts` | +156/−55 | +128/−106 | PINBYTE | `:4+4 :12 :39 :45 :50 :54+12 :69 :74 :76+2 :80 :83+41 :125+6 :144 :147+2 …` | „Połączenie armii”: siatka 3×5, licznik „Na polu · Dołącza · Razem”, „▼ jeszcze N jednostek”, Enter/autofokus (`59d326396`) | kopia bajtowa (importy main: `formatPl`, `escapeOverlayStack`, `icons/brandAssets` — bez logiki) | `src/ui/armyMergePanel.ts` | UI-2-B |
| 7 | `armySplitPanel.ts` | +185/−86 | +185/−86 | PINBYTE | `:2+3 :31 :35 :38+10 :50+6 :57 :59+20 :80+4 :86+17 :111 :130+3 :151+40 :192+15 :208+4 …` | „Rozdziel armię”: siatka 3×5, scroll, brandbook (`798ec59eb`) | kopia bajtowa (importuje typ z `armyMergePanel` → razem z #6) | `src/ui/armySplitPanel.ts` | UI-2-B |
| 8 | `unitReplacePicker.ts` | +18/−2 | 0 | MOD | `:27+7 :162 :188+10` | wybór zamiany jednostki | port DOM | `src/ui/unitReplacePicker.ts` | UI-2-B |
| 9 | `siegeMapPanel.ts` | +22/−3 | +22/−3 | MOD (DTO `SiegePanelDto`) | `:221+4 :271+4 :335+14` | „Milicja odnawia się: za N tur” + usunięte „~” (`4c8f4a2e7`) | port DOM + pole DTO `milicjaRegen` (producent Rust: P6) | `src/ui/siegeMapPanel.ts`, `viewmodel/types.ts` | UI-2-B |
| 10 | `hud.ts` | +36/−24 | +28/−22 | MOD | `:28 :62 :553+3 :769+9 :784+4 :1093 :1097 :1105 :1111 :1120 :1121 :1134 :1157+2 :1168 …` | użycie `formatCompactNumber`/`exactCompactNote` w pasku zasobów (`62884e25f`) | port DOM (C3) | `src/ui/hud.ts` | UI-2-C (zależy od #1/#3 — gotowe) |
| 11 | `empireDetailPanel.ts` | +124/−169 | +34/−8 | MOD | `:17 :31 :70 :72+6 :156+4 :357+10 :458 :460+9 :833+2 :1423+45 :2452+8 :2646 :2656 :2770 …` | panel imperium, skracanie liczb | port DOM (C3) | `src/ui/empireDetailPanel.ts` | UI-2-C |
| 12 | `empireDetailTypes.ts` | +6/−0 | +6/−0 | MOD | `:111+6` | typy panelu imperium | adapter typów | `src/ui/empireDetailTypes.ts` | UI-2-C |
| 13 | `armyStackHud.ts` | +43/−8 | 0 | MOD | `:29+2 :39+16 :135+5 :146+4 :202 :205+2 :208 :211+2 :306+7 :314+3` | HUD stosu armii | port DOM (import `game/unit-card-stats` → DTO) | `src/ui/armyStackHud.ts` | UI-2-C |
| 14 | `unitRecruitCard.ts` | +126/−38 | +4/−2 | MOD | `:9+2 :18+12 :31+23 :55+5 :61+5 :67+9 :113+2 :144 :163+26 :202+3 …` | karta rekrutacji, wspólna pula rekrutów (`65b031ac8`) | port DOM | `src/ui/unitRecruitCard.ts` | UI-2-C |
| 15 | `hexContextTooltip.ts` | +57/−51 | +57/−51 | MOD | `:135+7 :160+2 :177 :180+2 :184 :186+4 :194 :253 :260 :270 :282 :293+3 :439 :499+2 …` | tooltip heksu: produkcja ulepszeń przed plonami (`db8fabacc`) | port DOM (C2) | `src/ui/hexContextTooltip.ts` | UI-2-D |
| 16 | `preBattle.ts` | +38/−7 | 0 | MOD | `:14 :155+4 :254+7 :717 :725+4 :820+7 :852+2 :878+3 …` | ekran przed bitwą | port DOM (C5) | `src/ui/preBattle.ts` | UI-2-D |
| 17 | `buildModeHud.ts` | +26/−1 | +26/−1 | MOD | `:90+4 :215 :307+7 :612+9 :863+5` | HUD trybu budowy | port DOM | `src/ui/buildModeHud.ts` | UI-2-D |
| 18 | `diploListHud.ts` | +44/−0 | 0 | MOD | `:39+3 :44+9 :180+2 :367+19 :512+4 :538+7` | lista dyplomacji | port DOM (import `game/diplomacy-display` → DTO) | `src/ui/diploListHud.ts` | UI-2-E |
| 19 | `diplomacyAudience.ts` | +4/−17 | 0 | MOD | `:4 :304 :1267 :1342 :1383 :1395 :1433 :2172 :2195 :2207` | audiencja | port DOM (C2) | `src/ui/diplomacyAudience.ts` | UI-2-E |
| 20 | `diplomacyNegotiationModal.ts` | +15/−0 | +13/−0 | MOD | `:14+2 :25+2 :103+10 :565` | negocjacje | port DOM | `src/ui/diplomacyNegotiationModal.ts` | UI-2-E |
| 21 | `diplomacyPanel.ts` | +19/−0 | +19/−0 | MOD | `:34+2 :220+16 :266` | panel dyplomacji | port DOM | `src/ui/diplomacyPanel.ts` | UI-2-E |
| 22 | `diplomacyTradeBasket.ts` | +295/−34 | +203/−19 | MOD | `:5 :20 :43 :71 :139+2 :158 :171+5 :206+2 :225+18 :360+2 :531+4 :632+2 :839+21 :874+6 …` | koszyk handlu | port DOM (C2) | `src/ui/diplomacyTradeBasket.ts` | UI-2-E |
| 23 | `newGameFlow.ts` | +283/−144 | +144/−95 | MOD | `:80 :176+6 :243+5 :250 :252+4 :258 :558 :565 :670+7 :687+5 :693+4 :700 :810 :854 …` | kreator nowej gry | port DOM (P5.7 r2) | `src/ui/newGameFlow.ts` | UI-2-F |
| 24 | `entityCards/buildingAdapter.ts` | +3/−3 | 0 | MOD | `:68 :70 :279` | adapter karty budynku | adapter (importy `game/*` → DTO) | `src/ui/entityCards/buildingAdapter.ts` | UI-2-D |
| 25 | `entityCards/improvementAdapter.ts` | +7/−1 | 0 | MOD | `:27 :160+6` | adapter karty ulepszenia | adapter | `src/ui/entityCards/improvementAdapter.ts` | UI-2-D |
| 26 | `cityPanel.ts` | +341/−100 | +86/−31 | — (bloki K01–K09 w `src/ui/cityPanel/*.ts`) | `:82 :108+2 :164 :234 :245 :268 :283 :551+10 :567+2 :597+2 :630+24 :775 :834 :929+3 …` | kolejka rekrutacji w panelu (↑↓✕, `ff6ac152c`), kolejność rekrutacji wg epoki (`6f61f1d70`), skracanie liczb (`62884e25f`) | K (bloki kopii z markerami) | `src/ui/cityPanel/k0*.ts` | **UI-2-G r2: K01A–K09A przepięte w całości (322 markery bloków, 25/25 DRIFT; K03 3 adaptacje DTO); K09C/K09D poza allowlistą → §7.4** |

### 1a. Wycena per plik (runda 2 — odpowiedź na zarzut Z1 Evaluatora r1)

Wejście wyceny jest **zmierzone**: `L = (+) + (−)` z `git diff --numstat edb8fb56 86d510c66 -- gra/src/ui/<plik>.ts`,
`H` = liczba hunków `git diff -U0 edb8fb56 86d510c66 -- gra/src/ui/<plik>.ts | grep -c '^@@'` (obie wartości
odtworzone w r2 dla 26/26 plików, zgodne z kolumną `e→m` tabeli §1). **Wzór wyceny jest ZAŁOŻENIEM Z3** (nie pomiarem
czasu), zależnym od klasy:

| Klasa | Linie portu do napisania `LP` | Godziny Operatora `h` (zaokr. do 0,25 h) | Uzasadnienie |
|---|---|---|---|
| kopia bajtowa (KB) | 0 | `0,5 + 0,1·H + L/400` (+1 h, gdy plik renderuje scenę wymagającą zrzutu PNG) | kopia + manifest stałe; koszt = wektory/mutacje na każdy hunk |
| port DOM (PD) | `L` | `1 + 0,15·H + L/50` (+1 h, gdy import `game/*` trzeba zastąpić polem DTO) | każda zmieniona linia webu = linia portu; harness web↔port + mutacja na hunk |
| adapter (AD) | `L` | `0,5 + 0,15·H + L/50` | jak PD bez nowej sceny DOM |
| K (bloki `cityPanel`) | `±` LCS z §3 (277) | `0,5·bloki DRIFT + ±/50 + 2 h` (markery K02–K04) | przepięcie markera + `verify-k0*-copies` na blok |

Runda pracy Operatora = ≤ 8 h (ZAŁOŻENIE Z3). Kalibracja na UI-2-A: wzór daje 3 h za 4 pliki; r1 zmieściła je w jednej
rundzie razem z jednorazową infrastrukturą (manifest, weryfikator, nakładka, harness, mutacje, pomiar §1/§3) — wzór
nie zawiera tej infrastruktury, bo kolejne partie ją reużywają.

| # | Plik | Klasa | L | H | LP | h | Partia |
|---|---|---|---|---|---|---|---|
| 1 | `formatCompactNumber` | KB | 77 | 1 | 0 | 0,75 | A (zrobione) |
| 2 | `recruitHudLabel` | KB | 5 | 1 | 0 | 0,5 | A (zrobione) |
| 3 | `hudChip6c` | KB | 7 | 3 | 0 | 0,75 | A (zrobione) |
| 4 | `unitActionBarHtml` | KB | 13 | 4 | 0 | 1 | A (zrobione) |
| 5 | `aiOwnerProgressFrame` | KB | 16 | 1 | 0 | 0,75 | B |
| 6 | `armyMergePanel` | KB + PNG | 211 | 25 | 0 | 4,5 | B |
| 7 | `armySplitPanel` | KB + PNG | 271 | 19 | 0 | 4 | B |
| 8 | `unitReplacePicker` | PD | 20 | 3 | 20 | 1,75 | B |
| 9 | `siegeMapPanel` | PD + DTO | 25 | 3 | 25 | 3 | B |
| 10 | `hud` | PD | 60 | 24 | 60 | 5,75 | C |
| 11 | `empireDetailPanel` | PD | 293 | 31 | 293 | 11,5 | C |
| 12 | `empireDetailTypes` | AD | 6 | 1 | 6 | 0,75 | C |
| 13 | `armyStackHud` | PD + DTO | 51 | 10 | 51 | 4,5 | C |
| 14 | `unitRecruitCard` | PD | 164 | 25 | 164 | 8 | C |
| 15 | `hexContextTooltip` | PD | 108 | 28 | 108 | 7,25 | D |
| 16 | `preBattle` | PD | 45 | 13 | 45 | 3,75 | D |
| 17 | `buildModeHud` | PD | 27 | 5 | 27 | 2,25 | D |
| 18 | `diploListHud` | PD + DTO | 44 | 6 | 44 | 3,75 | E |
| 19 | `diplomacyAudience` | PD | 21 | 10 | 21 | 3 | E |
| 20 | `diplomacyNegotiationModal` | PD | 15 | 4 | 15 | 2 | E |
| 21 | `diplomacyPanel` | PD | 19 | 3 | 19 | 1,75 | E |
| 22 | `diplomacyTradeBasket` | PD | 329 | 50 | 329 | 15 | E |
| 23 | `newGameFlow` | PD | 427 | 76 | 427 | 21 | F |
| 24 | `entityCards/buildingAdapter` | AD | 6 | 3 | 6 | 1 | D |
| 25 | `entityCards/improvementAdapter` | AD | 8 | 2 | 8 | 1 | D |
| 26 | `cityPanel` (bloki K) | K | 441 | 89 | 277 | 20 | G (r1: 6/25 DRIFT; r2: 25/25 + K03; §6.5, §7) |
| | **Razem** | | **2709** | | **1945** | **129,25** | |

Zmiany weba spoza `gra/src/ui/**` (tabela niżej) wycenia się w P6 (silnik/kontroler), nie w UI-2: „Ludność: −1” i
okres odnowy Milicji = producent DTO w Rust; kolejność rekrutacji wg epoki i odroczenie powiadomień = kontroler.

Zmiany weba 2026-11-03/04 spoza `gra/src/ui/**` (logika — NIE port UI; mapowanie na silnik `rust-port/engine` / P6):

| Funkcja webu | Plik:symbol (main) | Klasa | Uwagi |
|---|---|---|---|
| „Ludność: −1” w bilansie zdobycia | `gra/src/game/cities.ts:1212` `capturePopLossReportRow`; użycie `gra/src/main.ts` (`2a67f081e`) | logika + wiersz raportu | wiersz dociera do UI jako zwykły wiersz `buildCityCaptureReportRows` → panel zdobycia nie wymaga zmian UI; producent wiersza = silnik (P6) |
| Okres odnowy Milicji | `gra/src/game/siegeDefenders.ts` (+44, `4c8f4a2e7`) | logika | UI = wiersz #9 (UI-2-B), wartość z DTO |
| Kolejność rekrutacji wg epoki | `gra/src/game/recruit-list-order.ts` (NOWY, +69, `6f61f1d70`) | logika sortowania | silnik/kontroler podaje posortowaną listę; UI `cityPanel.ts` +5/−3 (UI-2-G) |
| Odroczenie powiadomień do początku tury | `gra/src/game/event-defer-queue.ts` (NOWY, +102), `gra/src/main.ts` +61/−17 (`c7328569e`) | logika orkiestracji | kontroler v2 (`src/controller/**`) — poza UI-2; temat P6 |

## 2. Partia UI-2-A (zrobiona w r1)

Pliki (kopie bajtowe z `86d510c66`, manifest `src-tauri/frontend-v2/tools/repin-ui2-manifest.json`):
`src/ui/formatCompactNumber.ts` (NOWY, 3730 B), `src/ui/recruitHudLabel.ts` (NOWY, 321 B),
`src/ui/hudChip6c.ts` (3473 B), `src/ui/unitActionBarHtml.ts` (10501 B).

Mechanika repinu:
- `tools/verify-repin-ui2-copies.mjs` (dopięty do `npm run check`): sha256+rozmiar = manifest, rozłączność z
  `pin-manifest.json` (2 wpisy `hudChip6c`/`unitActionBarHtml` usunięte stamtąd: 435 → 433), porównanie bajtowe
  z `git show <sha>:gra/…` albo `--web-dir`.
- `tools/repin-ui2-overlay.mjs`: odniesienie „pin `edb8fb56` + 4 pliki z main” dla starszych harnessów porównujących
  z pinem. Na czystym pinie `run-cycles` daje **4 różnice** — wyłącznie ścieżki SVG ikony `split`
  (`hexContextTooltip` → `unitActionBarHtml`, pin `M8 7 4 11l4 4` vs port `M12 12H4M7 9 4 12l3 3`); na nakładce 0.
- `tools/dom-harness/run-repin-ui2a.mjs`: moduły WEBU (z `git archive 86d510c66 gra/src`) i PORTU pakowane `build.mjs`,
  wykonane w Chromium 141 (headless, Playwright `/opt/node-tools`); 10 funkcji/stałych, 2292 wektory (granice
  999/1000/1001, 999 949/999 950, 999 950 000, NaN/±Inf/null/undefined/−0, 2^53, 600 liczb LCG), DOM po parsowaniu
  przeglądarki (54), zrzut PNG sceny (bajty równe). Wektory webu: `tools/dom-harness/fixtures/repin_ui2a-web-vectors.json`,
  `webVectorsSha256=81278334795da0d32c7b969ec4fdefd840040b9770e787f497dd229986a7495f` — identyczny z dwóch osobnych
  katalogów `git archive` (plik JSON sha256 `0719192d…de380` w obu).
- `tools/dom-harness/mutate-repin-ui2a.mjs`: 19 mutacji (każda gałąź: próg <1000, awans 1000k→M, „,0”, znak, U+2212,
  grupowanie NBSP, notatka „Dokładnie”, NaN, próg i `isSafeInteger` rekrutów, `exact` w title/aria/escape,
  `general-follow` aktywny/disabled/brak, ikony split/merge) — 19/19 wykrytych.

Render: kopie bajtowe → HTML identyczny; piksele: zrzut Chromium web vs port bajtowo równy (próg 0). GPU/natywne okno
Tauri: NIE_ZMIERZONO.

ZAŁOŻENIE Z2: `hud.ts` w v2 jeszcze NIE woła `formatCompactNumber`/`exact` (to hunki #10, UI-2-C) — partia A dostarcza
moduły i kontrakt bez zmiany zachowania istniejących paneli (harnessy L0/L1A/L2/C4/cycles/hud/newgame/cityux: 0 różnic na
nakładce; liczniki `jsdomErrors` L2=354/C4=75 i `consoleErrors` L2=150 identyczne jak na bazie przed zmianą).

## 3. Dryf bloków kopii K01–K09 względem `origin/main`

Narzędzia: `measure-k08d-drift.mjs`, `measure-k08e-drift.mjs`, `measure-k09a-drift.mjs` (istniejące) oraz NOWE
`tools/dom-harness/measure-repin-ui2-kblocks-drift.mjs` (wszystkie markery `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B`).
`verify-pin-copies`: pin=edb8fb56 plików=433 niezgodnych=0.

| Partia | Bloków | SAME | DRIFT (±linie LCS) | Zmienione symbole (pin → main) |
|---|---|---|---|---|
| K01A | 82 | 81 | 1 (±6) | `formatBuildEtaLabel` 879-888 → 923-932 |
| K01B | 50 | 49 | 1 (±14) | `queueItemCumulativeEta` 889-911 → 934-962 |
| K05A | 25 | 22 | 3 (±12) | `recruitManpowerCost`, `unitStockCostChipsHtml`, `formatBuildingCatalogLockHint` |
| K05B | 23 | 18 | 5 (±24) | `buildRecruitTabDetailCard`, `buildBuildingInfocard`, `buildBuildingDetailCardViaEntityCard`, `_legacyBuildBuildingDetailCard`, `buildBuildingBuildTabDetailCard` |
| K06A | 16 | 15 | 1 (±3) | `tileYieldLabel` |
| K06B | 21 | 13 | 8 (±135) | `appendOkolicaYieldLabel`, `renderWorkedPreview`(12), `appendPodzialPracyInfo`(14), `appendUnitRecruitCompactRow`(14), `appendRecruitmentQueue`(42), `appendBuildQueueSection`(9), `renderBuildList`(30), `appendOwnedBuildingRow`(10) |
| K07A | 8 | 8 | 0 | — |
| K07B | 23 | 22 | 1 (±7) | `renderProd` |
| K08A | 15 | 15 | 0 | — |
| K08B | 11 | 10 | 1 (±42) | `renderPurchasableUnits` |
| K08C | 3 | 2 | 1 (±4) | `buildPracaDetailCard` |
| K08D | 11 | 9 | 2 (±28) | `buildHandelDetailCard`(24), `buildWealthDetailCard`(4) — zgodne z `measure-k08d-drift` (2/11 ZMIENIONA) |
| K08E | 12 | 11 | 1 (±2) | `buildTopBarRekruciDetailCard` — `measure-k08e-drift`: DRIFT(1) (inna metryka: linie różne) |
| K09A | 9 | 9 | 0 | — zgodne z `measure-k09a-drift` (9/9 SAME) |
| **Razem** | **309** | **284** | **25** | |

K02–K04 (`k02-*.ts`, `k03-*.ts`, `k04*.ts`) nie mają markerów `:A-B` (porty DOM z odwołaniem `(:linia)` w komentarzu):
dryf NIE_ZMIERZONO tym narzędziem — do UI-2-G (dopisać markery albo pomiar po nazwie).
Kopie w porcie nadal równe pinowi `edb8fb56` (bramki `verify-k0*-copies` niezmienione); dryf ≠ repin — repin bloków K = UI-2-G.

## 4. Kolejka partii (mierzalne kryteria końca)

Każda partia: kopia bajtowa → wpis w `repin-ui2-manifest.json` + usunięcie z `pin-manifest.json`; port DOM → harness
web(Chromium) vs port 0 różnic + mutacje każdej gałęzi nowego hunku 100% wykryte; starsze harnessy na nakładce 0 różnic;
`tsc --noEmit` 0; `npm run check` EXIT 0; `git diff --check` czysty.

| Partia | Zakres (#§1) | Kryterium | Wycena (§1a: Σh / ΣLP / rundy ≤8 h) |
|---|---|---|---|
| UI-2-B | #5 `aiOwnerProgressFrame`, #6 `armyMergePanel`, #7 `armySplitPanel` (kopie bajtowe), #8 `unitReplacePicker`, #9 `siegeMapPanel` (+ `SiegePanelDto.milicjaRegen?`) | kopie sha=manifest; harness merge/split: siatka 3×5, licznik, „▼ jeszcze N”, Enter — DOM web=port + zrzut PNG; milicja: N∈{0,1,2,4,5,12,22} pluralizacja = web | 14 h / 45 LP / 2 rundy (#5 0,75 · #6 4,5 · #7 4 · #8 1,75 · #9 3) |
| UI-2-C | #10 `hud`, #11 `empireDetailPanel`, #12 `empireDetailTypes`, #13 `armyStackHud`, #14 `unitRecruitCard` | harness HUD na DTO z wartościami ≥1000: tekst `20,9k`, `title` „Dokładnie: …” = web | 30,5 h / 574 LP / 4 rundy (#10 5,75 · #11 11,5 · #12 0,75 · #13 4,5 · #14 8) — zalecany podział na 2 tematy: C1 = #10+#12+#13 (11 h), C2 = #11+#14 (19,5 h) |
| UI-2-D | #15 `hexContextTooltip`, #16 `preBattle`, #17 `buildModeHud`, #24–25 adaptery kart | `run-cycles` na nakładce 0 różnic po repinie odniesienia | 15,25 h / 194 LP / 2 rundy (#15 7,25 · #16 3,75 · #17 2,25 · #24 1 · #25 1) |
| UI-2-E | #18–22 dyplomacja | `run-cycles` (C2) + nowe wektory koszyka | 25,5 h / 428 LP / 4 rundy (#18 3,75 · #19 3 · #20 2 · #21 1,75 · #22 15) — zalecany podział: E1 = #18–21 (10,5 h), E2 = #22 (15 h) |
| UI-2-F | #23 `newGameFlow` | `run-newgame` na nakładce 0 różnic | 21 h / 427 LP / 3 rundy (#23 21) |
| UI-2-G | #26 bloki K (25 DRIFT z §3 + K02–K04), kolejka rekrutacji ↑↓✕, kolejność wg epoki | per blok: marker przepięty na `86d510c66` (lub nowszy main), `verify-k0*-copies` EXIT 0 | 20 h / 277 LP (±LCS) / 3 rundy (25 bloków DRIFT · 0,5 h + 277/50 + 2 h markery K02–K04) |

Pozostało po UI-2-A: **126,25 h / 1945 LP ≈ 16 rund pracy** (18 przy zaokrąglaniu w górę per partia jak w tabeli) (B–G; wycena = ZAŁOŻENIE Z3, do rekalibracji po każdej partii — w raporcie partii wpisać h zużyte vs wycena). Temat > 2 rund wyceny dzielić na osobne ID, żeby nie zbliżać się do limitu 5 rund.

Uwaga (Evaluator r1, notatka b): po repinie UI-2-A starsze harnessy (`run.mjs`, `run-cycles.mjs`, `run-level2.mjs`, `run-c4.mjs`, …) bez `--pin-dir <nakładka>` dają EXIT=1 (4 różnice ikony `split` w `run-cycles`) — każdą partię weryfikować na nakładce z `tools/repin-ui2-overlay.mjs` (komenda w §5).

## 5. Komendy (odtworzenie)

```bash
git archive 86d510c667268880414d693532ca012c9310589e gra/src gra/data | tar -x -C "$WEB"   # mktemp -d poza repo
git archive edb8fb56 gra/src gra/data | tar -x -C "$PIN"
cd src-tauri/frontend-v2 && npm ci
node tools/verify-repin-ui2-copies.mjs [--web-dir "$WEB"]
node tools/dom-harness/run-repin-ui2a.mjs --web-dir "$WEB" [--out vec.json]
node tools/dom-harness/mutate-repin-ui2a.mjs --web-dir "$WEB"
node tools/repin-ui2-overlay.mjs --pin-dir "$PIN" --web-dir "$WEB" --out "$PINOV"
node tools/dom-harness/run-cycles.mjs --pin-dir "$PINOV"     # (i pozostałe run-*.mjs)
node tools/dom-harness/measure-repin-ui2-kblocks-drift.mjs --pin-dir "$PIN" --cur-dir "$WEB"
```

## 6. Partia UI-2-G — runda 1 (`R-RUSTPORT-REPIN-UI-2-G-Q1`)

Baza `rust-port/parity-v2` `2198eaf7e`; web `86d510c66` (`git log 86d510c66..origin/main -- gra/src` = 0 commitów w dniu
pracy, `origin/main` = `86d510c66`). Zakres r1 (ZAŁOŻENIE G-Z1): partie K z najmniejszym dryfem i bez nowych
delegatów kontrolera — **K01A, K01B, K05A, K06A** w całości (wszystkie markery plików przepięte), plus pomiar K02–K04.
K05B, K06B (kolejka rekrutacji ↑↓✕ `ff6ac152c`), K07B, K08B (pula rekrutów + `formatCompactNumber`), K08C, K08D, K08E,
K09C/K09D → r2–r3 (§6.5).

### 6.1 Mechanika repinu bloków K

- Marker bloku: `// pin 86d510c66 gra/src/<plik>:A-B` (było `edb8fb56`); prefiks K01A-Z5 (`// kopia typu (…) pin …`)
  i adnotacje K01B (`:A-B (…)`) zachowane. Reguła rewizji: `tools/dom-harness/repin-ui2g-rev.mjs` (dozwolone
  `edb8fb56|86d510c66`, partia = jedna rewizja, mieszanie = FAIL) + wspólna mapa linii Myersa (`rangeMapper`).
- `tools/dom-harness/repin-ui2g-kblocks.mjs`: mapa pin→web (Myers O(ND); zgodna z `git diff`: 89 hunków, +341/−100,
  nałożenie hunków na pin = web), MOVED = renumeracja, DRIFT = nałożenie hunku na treść bloku portu; MANUAL (hunk
  w linii zmienionej przez port: K01B `reguly().etaTurns`, K06A sygnatura `HexK06`) przepięty ręcznie i sprawdzony
  weryfikatorem partii. Wynik r1: 176 bloków z `edb8fb56` → 170 MOVED, 4 DRIFT auto, 2 MANUAL (+10 markerów z adnotacją
  w drugim przebiegu).
- Weryfikatory partii przyjmują obie rewizje (`verify-k01b/k05a/k06a-copies.mjs`: `K_REV_RX`, `revProblem`);
  zakresy podstawień (`ALLOWED`, `SUBST`, `LINE_SUBS`) przeniesione mapą pin→web. Przepięte partie weryfikuje się
  z `--pin-dir <WEB 86d510c66>`; na pinie dają FAIL (kontrola negatywna, EXIT 1 ×3).
- `run-k01a.mjs`: `--sel-pin-dir <PIN>` — wybór S liczony z `pomiar-r2.json` na pinie i przeniesiony mapą na web
  (A/T/I/D/F na webie). `run-k06a-units.mjs`: stan modułu wyszukiwany po treści (był `slice(10158,10163)`).
- Manifest `tools/repin-ui2g-kblocks-manifest.json` (osobny plik — bez konfliktu z wpisami B–F w `repin-ui2-manifest.json`)
  + rozszerzenie `verify-repin-ui2-copies.mjs` (w `npm run check`): REV (rewizja + liczba markerów per plik) i RANGE
  (zakres istnieje w `git show 86d510c66:<plik>` i zawiera deklarację bloku; zmiany nazw K01B-Z1/K06A-Z6 jawnie
  w `renames`). Kontrola negatywna `--web-dir <PIN>`: 186 niezgodnych.
- Typy/delegatory poza blokami (nie kopie): K05A `getManpowerMultipliers?` w `K05aCfg`, 4. argument `costMult`
  `unitManpowerCostForType` (delegator, `setK05aFromDto`); K06A `wlascicielEra?` w `tileYield` deps; K06A `LINE_SUB`
  dla `pinnedGarrisonCityId: number` (K09B r2 `0a1761d80` — bramka K06A była czerwona już na bazie `2198eaf7e`).

### 6.2 Bloki z dryfem przepięte w r1 (6/25)

| Partia | Jednostka | pin → web | Zmiana webu | Uwagi portu |
|---|---|---|---|---|
| K01A | `formatBuildEtaLabel` | 879-888 → 923-933 | tylko komentarz następnej deklaracji | — |
| K01B | `queueItemCumulativeEta` | 889-911 → 934-963 | 4. param `buildingPracaPerTurn` (tempo budynków ≠ jednostek; ≤0 → null) | ręcznie (port `reguly().etaTurns`, typy `*K`) |
| K05A | `recruitManpowerCost` | 8050-8054 → 8125-8130 | `cfg.getManpowerMultipliers` (maxMult/costMult) | delegator + DTO 4 arg |
| K05A | `unitStockCostChipsHtml` | 8102-8124 → 8178-8202 | „(brak)” w chipie | — |
| K05A | `formatBuildingCatalogLockHint` | 8542-8576 → 8749-8786 | 4. param `brakZasobow` → „Brakuje: …” | wołający K06B `renderBuildList` jeszcze bez parametru (r2/r3) |
| K06A | `tileYieldLabel` | 9765-9783 → 10009-10028 | 2. param `ownerEra` → `wlascicielEra` (`8769854ff`) | ręcznie; reguła plonów = silnik (P6) |

### 6.3 K02–K04 (bez markerów) — pomiar

`tools/dom-harness/measure-repin-ui2g-k02k04-drift.mjs`: (a) po nazwie — 138 deklaracji, SAME 37, DRIFT 0, GONE 0,
PORT_ONLY 101 (nazwy portu bez odpowiednika w webie: typy DTO/adaptery K04b–d); (b) po odwołaniach `:A-B` w komentarzach
— 343 odwołania, REF_SAME 333, REF_DRIFT 10 (k03-cards 3, k03-model 3, k04c-zamoznosc 2, k04c-model 1, k04b-podzial 1;
to szerokie zakresy całych funkcji, np. `:314-606`, w których dryf leży w innych jednostkach — K08D/K08E/K05B; k04b-podzial
`:545-552` to najpewniej `cities.ts` — ZAŁOŻENIE G-Z3 przypisuje gołe odwołania do `cityPanel.ts`). Wniosek: K02–K04 nie wymagają
zmiany kodu z tytułu dryfu webu; REF_DRIFT przejrzeć przy repinie K05B/K08D/K08E (r2).

### 6.4 Testy r1

- `run-repin-ui2g.mjs` (Chromium 141 headless; moduł webu `cityPanel.ts` 86d510c66 w całości + port w tej samej stronie,
  reguły portu = silnik webu): 6 jednostek, 9216 wektorów, 0 różnic; HUNK 5/5 (web rozróżnia warianty każdego hunku);
  DOM 45 węzłów web = port; PNG 1280×720 i 360×640 web = port (bajtowo); `pageerror`+`console.error` = 0.
  Fixtura `tools/dom-harness/fixtures/repin_ui2g-web-vectors.json` (zapis zwarty: wartości + indeksy),
  `webVectorsSha256=2b5757608808e68001009cd34d8a92342b4c67dff20b632a8bb030da95781374`, plik sha256 `c26dc6c3…40437`
  identyczny z dwóch osobnych `git archive`.
- `mutate-repin-ui2g.mjs`: 16/16 wykrytych, 2 równoważne z uzasadnieniem (M2: `etaTurns` silnika zwraca null dla
  `!(praca>0)`; M9: koszt rekrutów liczony tylko z `costMult`).
- Partie na webie: `verify-k01b-copies` ZIELONE (58 bloków, 24 dozwolone), `verify-k05a-copies` OK, `verify-k06a-copies` OK;
  `run-k01a` ZIELONE (A,B,C,D,S,T,I,V,E,F; F 1098 przypadków), `run-k01b` ZIELONE (1689 przypadków), `run-k05a-units`
  4936/0, `run-k06a-units` 0 różnic; `mutate-k01a` 9/9, `mutate-k01b` 9/10 (D1 = tylko tsc, jak na bazie),
  `mutate-k05a-units` 83/83, `mutate-k06a-units` 29/29.
- Nieprzepięte partie na pinie (regresja): `run-k02…k09b` 34/34 EXIT 0; weryfikatory k05b/k07b/k08a/k08b/k08c/k08d/k08e OK,
  k06b/k07a/k09a czerwone **tak samo jak na bazie `2198eaf7e`** (zmierzone przed zmianami: K09B r2 typ id, K08B
  `getK07aScalePx`, hunki k09a-paint) — poza zakresem G r1, zgłoszone w raporcie.
- Starsze harnessy na nakładce `repin-ui2-overlay`: L0 3861/0, L1A 3618/0, L2 1784/0 (jsdomErrors 354, consoleErrors 150 —
  jak na bazie), C4 1649/0 (75/0), cycles 6401/0, hud 927/0, newgame 1194/0, cityux 164/0.
- `tsc --noEmit` 0; `npm run check` EXIT 0 (433/0, UI-2 4/0, kblocks 7 plików / 186 zakresów).

### 6.5 Przeliczenie wyceny UI-2-G (ZAŁOŻENIE Z3, rekalibracja)

Zużyte r1: 1 runda (≈ 8 h) na 6 DRIFT (±LCS 35) + 170 MOVED w 4 partiach + K02–K04 + infrastruktura jednorazowa
(narzędzie repinu, reguła rewizji, harness Chromium, manifest). Wzór §1a dla r1: 0,5·6 + 35/50 + 2 = 5,7 h ⇒ infrastruktura
≈ 2,3 h, plus ≈ 0,5 h/partię na przeniesienie zakresów w jej weryfikatorze/harnessach (obserwacja r1: K01A i K06A miały
zakresy zaszyte w kodzie).

| Pozostało | DRIFT | ±LCS | h (0,5·DRIFT + LCS/50 + 0,5/partię) | Runda |
|---|---|---|---|---|
| K07B, K08C, K08D, K08E, K05B | 10 | 65 | 5 + 1,3 + 2,5 = 8,8 | r2 |
| K06B (kolejka ↑↓✕ `ff6ac152c`, `renderBuildList` + `brakZasobow`), K08B (pula rekrutów `formatCompactNumber`), K07A/K08A/K09A (tylko MOVED) | 9 | 177 | 4,5 + 3,5 + 2,5 = 10,5 | r3 (+ ewent. r4) |
| K09C/K09D (podpięcie produkcyjne) | — | — | NIE_ZMIERZONO (zależy od wiringu P6) | po r3 |

UI-2-G: było 20 h / 3 rundy; teraz ≈ 8 h zużyte + 19,3 h pozostało ≈ 27 h / 3,5 rundy. Ryzyko limitu 5 rund tego ID:
zalecany osobny ID dla K06B+K08B (r3) i K09C/K09D.

Komendy r1 (z `src-tauri/frontend-v2/`, katalogi `git archive` poza repo):

```bash
node tools/dom-harness/repin-ui2g-kblocks.mjs --pin-dir "$PIN" --web-dir "$WEB" --files k05a-fundament.ts,…   # podgląd; --write zapisuje
node tools/dom-harness/verify-k01b-copies.mjs --pin-dir "$WEB"   # (i verify-k05a/k06a)
node tools/dom-harness/run-k01a.mjs --pin-dir "$WEB" --sel-pin-dir "$PIN"
node tools/dom-harness/run-k01b.mjs --pin-dir "$WEB"; node tools/dom-harness/run-k05a-units.mjs --pin-dir "$WEB"; node tools/dom-harness/run-k06a-units.mjs --pin-dir "$WEB"
node tools/dom-harness/run-repin-ui2g.mjs --web-dir "$WEB" [--out vec.json] [--png-dir <dir>]
node tools/dom-harness/mutate-repin-ui2g.mjs --web-dir "$WEB" [--only M1,…]
node tools/dom-harness/measure-repin-ui2g-k02k04-drift.mjs --pin-dir "$PIN" --cur-dir "$WEB"
node tools/verify-repin-ui2-copies.mjs [--web-dir "$WEB"]
```

## 7. Partia UI-2-G — runda 2, obrona (`R-RUSTPORT-REPIN-UI-2-G-Q1`)

Baza: commit Operatora r1 `d049f45a6` (kod `84d312c0c`). Web `86d510c66` = `origin/main` (bez nowych commitów `gra/src`).
Zakres r2 = cała reszta GOAL K01–K09 (zarzut Z1) + Z2–Z6 z oceny Evaluatora r1.

### 7.1 Bloki przepięte w r2

- `repin-ui2g-kblocks.mjs --write` dla 30 plików z markerami `edb8fb56`. Wynik: 136 bloków, z czego 117 MOVED, 14 DRIFT
  nałożonych automatycznie i 5 MANUAL. Teraz 37 plików i **322 markery bloków, wszystkie `86d510c66`**. Zostało tylko
  6 wzmianek `edb8fb56` w komentarzach nagłówków, które nie są markerami.
- DRIFT 19/19, razem z r1 **25/25**:
  - K05B: `buildBuildingInfocard`, `buildBuildingDetailCardViaEntityCard`, `_legacyBuildBuildingDetailCard`,
    `buildBuildingBuildTabDetailCard` (MANUAL), `buildRecruitTabDetailCard`;
  - K06B: `appendPodzialPracyInfo`, `appendUnitRecruitCompactRow` (MANUAL), `appendRecruitmentQueue`
    (z nowymi `cancelRecruitmentQueueItem` i `moveRecruitmentQueueItemBy`, ↑↓✕ `ff6ac152c`), `appendBuildQueueSection`,
    `renderBuildList` (MANUAL), `appendOwnedBuildingRow`, blok garnizonu 10030-10067 oraz placeholder `renderWorkedPreview`
    (MANUAL: sam marker, K06B-Z7);
  - K07B: blok 8633-8742;
  - K08B: `renderPurchasableUnits` (MANUAL);
  - K08C: `buildPracaDetailCard`;
  - K08D: `buildHandelDetailCard`, `buildWealthDetailCard`;
  - K08E: `buildTopBarRekruciDetailCard`.
  Bloki MANUAL to bajtowa treść webu plus te same podstawienia portu co w pinie
  (`export`, `(x: any)`). Przenosi je narzędzie `rb` z kontrolą „podstawienie trafia w web”.
- K03 (adaptacje DTO bez markerów, wskazane przez `run-k03-units` na webie):
  - `buildTopBarRekruciDetailCardK`: tekst regeneracji;
  - `buildHandelDetailCardK`: 6 tekstów formuł i algorytmu webu;
  - `bindRecruitQueueDragReorderK`: 4. parametr `onMutated?` po `rerender()`;
  - `K03_RETIRED.line` = 655/669.
- K02 i K04: bez zmian kodu, bo harnessy na webie są zielone. Czerwony jest tylko `run-k02-styles`, a jego różnica CSS
  pochodzi z `UNIT_RECRUIT_CARD_CSS` w #14 `unitRecruitCard.ts`, które należy do partii UI-2-C. Dowód: po podmianie
  tylko tego pliku na wersję pinu harness daje 14/0.
- Nowe nazwy webu wołane przez przepięte bloki dostają delegaty (reguły gry → silnik, P5.13):
  - `buildingWorkPerTurnForCity`: K05B `rules` oraz `dep` w K06B i K07B;
  - `unitRecruitmentCapacityForCity`, `buildingRequirementChips`, `loadSpichlerzDrainParams`: K06B;
  - `rushCostModifierForCity`: K07B;
  - `recruitPanelPurchasableUnits`, `empireRekruciTotal`: K08B.
  Do tego `cfg.getManpowerMultipliers` w `K05bCfg`. `formatCompactNumber` i `formatFullNumber` K08B importuje
  z kopii UI-2-A. Pole `civBonusy` stanu karty budynku obsługuje lokalny typ K05B (ZAŁOŻENIE G-Z7: pole w
  `BuildingCardCityState` dodaje UI-2-D #24, bez edycji cudzego pliku).

### 7.2 Bramki weryfikatorów i `npm run check` (Z3, Z4, Z5)

- Weryfikatory k01b, k05a, k05b, k06a, k06b, k07a, k07b, k08a, k08b, k08c, k08d (5 batchy), k08e (4 batche) i k09a:
  **20/20 EXIT 0 na webie i 20/20 EXIT 1 na pinie** (kontrola negatywna).
- Zakresy jednostek z zamrożonych logów (`wybrane.json` K07A/K08A, `k06b-ranges.json`) przenosi zamrożona mapa
  `tools/dom-harness/repin-ui2g-rangemap.json` (133 zakresy). Zakres bez wpisu kończy się FAIL, nie zgadywaniem.
- Z3: k06b, k07a i k09a były czerwone na bazie `2198eaf7e`. Wszystkie trzy przyczyny pochodzą z partii przed UI-2-G
  i każda jest wprost przypisana do swojego tematu w `why`/komentarzu:
  - K06B: `LINE_SUB pinGarrisonPanel(cityId: number)`, K09B r2 `0a1761d80`;
  - K07A: `LOCAL_NAMES getK07aScalePx`, K08B r1 `82049d69b`;
  - K09A: `k09a-subs.mjs` wygenerowane `--gen`, jedyna różnica hunków to `pinnedGarrisonCityId !== city.id` (K09B r2);
  - przy okazji mutant `paint.noGarrisonClear`, który na bazie był INVALID.
- Z4: wpis K06A `pinnedGarrisonCityId` należy do tej samej klasy co trzy wpisy K09B r2 wyżej.
  `why: 'K09B-r2 typ id miasta (DTO number)'` przypisuje go do K09B, a nie do UI-2-G. Tolerancja nie rośnie: port nie
  zmienił się od `0a1761d80`, a nowy wpis tylko opisuje tę zmianę.
- Z5: `verify-repin-ui2-copies.mjs` (w `npm run check`) ma nowy krok **CONTENT**.
  - Uruchamia 21 bramek treści z `contentGates` manifestu (`run-k01a` z pinem i 20 weryfikatorów) na
    `git archive 86d510c66 gra/src gra/data` w katalogu tymczasowym, który potem usuwa.
  - `--no-git` bez `--web-dir` oznacza jawne „CONTENT POMINIĘTE”.
  - Kontrola negatywna: 4 mutacje treści bloków K w czterech partiach. `npm run check` dał EXIT 1 z
    `KBLOK CONTENT` w 4/4 przypadkach, a plik po każdej próbie wrócił bajtowo do oryginału.
  - `--web-dir <PIN>`: 20/20 bramek CONTENT FAIL.

### 7.3 Harnessy i mutacje na webie (Z2, Z6)

- 37 harnessów `run-k01b…k09b` na webie: **36/37 EXIT 0**. Wyjątkiem jest `run-k02-styles`, którego przyczynę
  opisuje §7.1 (UI-2-C).
- Wybrane liczby:
  - k05a 4936/0, k05b 384/0, k06a 1323/0, k06b 28/0, k07a 5296/0, k07b 335/0;
  - k08b-rail 87/0, k08c-owned-purchase 24/24, k08d-handel 36/36;
  - k09a-pin 69/69, k09b-wiring 36/36.
- Harnessy z liczbami linii zaszytymi w kodzie dostały zakresy webu. K02 i K07A wyznaczają je z rewizji wejścia
  (sha1 bloba).
- Kotwice tekstów zmienionych w webie przepisano na tekst webu:
  - `k08c-praca`: Targowisko i konwersja na podatek;
  - `k08d-handel`: płaski `×2` zamiast mnożnika cywilizacji.
- Mutacje na webie:
  - k05b 93/93 (survivor `jedn-rekrut-costmult` zabity po poprawie fixture `costMult`);
  - k05b-dto 8/8, k06b, k07a, k07b-units i k07b-copies: survived 0;
  - k08a i k08b-rail: 22 zabite + 1 równoważna; k08b-title 11/11, k08c-podzial 10/10, k08c-wiring 14/14;
  - k08d-handel 6/6 + 11/11, k08d-religia 10/10, k08d-wealth 16/16, k08d-wiring 21/21;
  - k08e 12/12 + 15/15, k09a 42/42 (1 NIE_ZMIERZONO), k09b 28/28.
- Z2 na ścieżce wywołań panelu:
  - `renderBuildList` (K06B) przekazuje `brakZasobow` do `formatBuildingCatalogLockHint`, czyli robi to samo
    wywołanie co web; sprawdzają to TEXT i run-k06b (log argumentów pin = port);
  - `buildRecruitTabDetailCard` i `recruitManpowerCost` czytają `cfg.getManpowerMultipliers` (harness k05b: wariant
    z `costMult` ≠ `maxMult`);
  - pula rekrutów `71,7k` z pełną wartością w `aria-label` jest sprawdzona w `run-k08c-owned-purchase-pin`.
- Z6: `pinFile` w JSON harnessów k06a, k06b, k07a i k07b liczy `pinFileLabel(PIN_DIR)` z sha1 bloba
  `cityPanel.ts` (`repin-ui2g-rev.mjs`). Na webie wypisuje `(86d510c66)`, na innej treści `nieznana (blob …)`.

### 7.4 K09C/K09D i delegat produkcyjny (ZAŁOŻENIE G-Z8)

`showCityPanelFromDto` (`controller/cityPanelWiring.ts`) ma 0 wywołań w `src/` (zmierzone `grep`). Ścieżka produkcyjna
panelu K nie jest jeszcze podpięta, a jej podpięcie to właśnie K09C/K09D. Kontroler (`src/controller/**`) i silnik
(`src-tauri/src/**`) leżą **poza allowlistą** tego ID, która obejmuje `src/ui/**`, `viewmodel/types.ts` i `tools/**`.
K09C/K09D nie da się więc zrobić w tym temacie bez rozszerzenia allowlisty. Zostaje jawny delegat do osobnego ID,
które zalecał już Operator r1.

**Luka wiringu** jest zmierzona w `run-k08c-owned-purchase-pin` (`wiring.gap`) i domknięta atrapami testowymi
w harnessach. Kontroler i silnik muszą dostarczyć:

| Nazwa | Gdzie | Właściciel |
|---|---|---|
| `recruitPanelPurchasableUnits`, `empireRekruciTotal` | `setK06bDeps` (K08B) | K09C (`k08cWiring`) + P6 `purchasableUnits{showStockGatedUnits}`, `sortRecruitListByEra` |
| `buildingWorkPerTurnForCity`, `unitRecruitmentCapacityForCity`, `rushCostModifierForCity` | K06B/K07B `dep`, K05B `rules` | K09C + P6 (`civMatrixParam`) |
| `buildingRequirementChips`, `loadSpichlerzDrainParams` | K06B `dep` | K09C (+ P6 parametry Spichlerza) |
| `cfg.getManpowerMultipliers` (`maxMult`, `costMult`) | K05A/K05B `cfg` | K09C + P6 (macierz Manpower) |
| `cfg.getEpoch` → `tileYieldLabel(hex, wlascicielEra)` | K06A/K06B | K09C + P6 (reguła plonów ulepszeń wg epoki, `8769854ff`) |
| `civBonusy` w `BuildingCardCityState` | entity card | UI-2-D #24 |

### 7.5 Wycena

r2 domyka całą resztę zakresu K01–K09: 19 DRIFT, 136 markerów, K03, 3 czerwone bramki z bazy oraz CONTENT w `check`.
Do zrobienia zostaje K09C/K09D w osobnym ID (wiring kontrolera wg §7.4, ok. 6–8 h, w tym P6). Pomiaru Chromium/PNG
dla bloków r2 nie zrobiono w tej rundzie. Na webie dowodem są harnessy jsdom pin-exec (36/37) i bramki CONTENT, a
`run-repin-ui2g` (r1, 9216/0, PNG =) przechodzi bez zmian.
