# P5-REPIN-UI-2 — repin UI frontend-v2 do aktualnego weba (Faza U3, część A)

TEMAT: `R-RUSTPORT-REPIN-UI-2-A-Q1` · runda 1 (Operator), runda 2 = wycena §1a/§4 · baza `rust-port/parity-v2` `612ad455e`
Partia UI-2-B: `R-RUSTPORT-REPIN-UI-2-B-Q1` · runda 1 (Operator) · baza `parity-v2` `2198eaf7e` · §2b, §1a (rekalibracja), §4.
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
| 5 | `aiOwnerProgressFrame.ts` | +16/−0 | 0 | — | `:1+16` | ramka postępu tury AI | kopia bajtowa (main: 0 instrukcji `import`) | nowy `src/ui/aiOwnerProgressFrame.ts` | **ZROBIONE UI-2-B** |
| 6 | `armyMergePanel.ts` | +156/−55 | +128/−106 | PINBYTE | `:4+4 :12 :39 :45 :50 :54+12 :69 :74 :76+2 :80 :83+41 :125+6 :144 :147+2 …` | „Połączenie armii”: siatka 3×5, licznik „Na polu · Dołącza · Razem”, „▼ jeszcze N jednostek”, Enter/autofokus (`59d326396`) | kopia bajtowa (importy main: `formatPl`, `escapeOverlayStack`, `icons/brandAssets` — bez logiki) | `src/ui/armyMergePanel.ts` | **ZROBIONE UI-2-B** |
| 7 | `armySplitPanel.ts` | +185/−86 | +185/−86 | PINBYTE | `:2+3 :31 :35 :38+10 :50+6 :57 :59+20 :80+4 :86+17 :111 :130+3 :151+40 :192+15 :208+4 …` | „Rozdziel armię”: siatka 3×5, scroll, brandbook (`798ec59eb`) | kopia bajtowa (importuje typ z `armyMergePanel` → razem z #6) | `src/ui/armySplitPanel.ts` | **ZROBIONE UI-2-B** |
| 8 | `unitReplacePicker.ts` | +18/−2 | 0 | MOD | `:27+7 :162 :188+10` | wybór zamiany jednostki, `blockedReason` (`219456bae`) | port DOM | `src/ui/unitReplacePicker.ts` | **ZROBIONE UI-2-B** |
| 9 | `siegeMapPanel.ts` | +22/−3 | +22/−3 | MOD (DTO `SiegePanelDto`) | `:221+4 :271+4 :335+14` | „Milicja odnawia się: za N tur” + usunięte „~” (`4c8f4a2e7`) | port DOM + pole DTO `milicjaRegen` (producent Rust: P6) | `src/ui/siegeMapPanel.ts`, `viewmodel/types.ts` | **ZROBIONE UI-2-B** |
| 10 | `hud.ts` | +36/−24 | +28/−22 | MOD | `:28 :62 :553+3 :769+9 :784+4 :1093 :1097 :1105 :1111 :1120 :1121 :1134 :1157+2 :1168 …` | użycie `formatCompactNumber`/`exactCompactNote` w pasku zasobów (`62884e25f`) | port DOM (C3) | `src/ui/hud.ts` | **ZROBIONE UI-2-C** (§2c) |
| 11 | `empireDetailPanel.ts` | +124/−169 | +34/−8 | MOD | `:17 :31 :70 :72+6 :156+4 :357+10 :458 :460+9 :833+2 :1423+45 :2452+8 :2646 :2656 :2770 …` | panel imperium, skracanie liczb | port DOM (C3) | `src/ui/empireDetailPanel.ts` | **ZROBIONE UI-2-C** (§2c) |
| 12 | `empireDetailTypes.ts` | +6/−0 | +6/−0 | MOD | `:111+6` | typy panelu imperium | adapter typów | `src/ui/empireDetailTypes.ts` | **ZROBIONE UI-2-C** (§2c) |
| 13 | `armyStackHud.ts` | +43/−8 | 0 | MOD | `:29+2 :39+16 :135+5 :146+4 :202 :205+2 :208 :211+2 :306+7 :314+3` | HUD stosu armii | port DOM (import `game/unit-card-stats` → DTO) | `src/ui/armyStackHud.ts` | **ZROBIONE UI-2-C** (§2c) |
| 14 | `unitRecruitCard.ts` | +126/−38 | +4/−2 | MOD | `:9+2 :18+12 :31+23 :55+5 :61+5 :67+9 :113+2 :144 :163+26 :202+3 …` | karta rekrutacji, wspólna pula rekrutów (`65b031ac8`) | port DOM | `src/ui/unitRecruitCard.ts` | **ZROBIONE UI-2-C** (§2c) |
| 15 | `hexContextTooltip.ts` | +57/−51 | +57/−51 | MOD | `:135+7 :160+2 :177 :180+2 :184 :186+4 :194 :253 :260 :270 :282 :293+3 :439 :499+2 …` | tooltip heksu: produkcja ulepszeń przed plonami (`db8fabacc`) | port DOM (C2) | `src/ui/hexContextTooltip.ts` | **ZROBIONE UI-2-D** (`e0eef2b84`, §6) |
| 16 | `preBattle.ts` | +38/−7 | 0 | MOD | `:14 :155+4 :254+7 :717 :725+4 :820+7 :852+2 :878+3 …` | ekran przed bitwą | port DOM (C5) | `src/ui/preBattle.ts` | **ZROBIONE UI-2-D** (`e0eef2b84`, §6) |
| 17 | `buildModeHud.ts` | +26/−1 | +26/−1 | MOD | `:90+4 :215 :307+7 :612+9 :863+5` | HUD trybu budowy | port DOM | `src/ui/buildModeHud.ts` | **ZROBIONE UI-2-D** (`e0eef2b84`, §6) |
| 18 | `diploListHud.ts` | +44/−0 | 0 | MOD | `:39+3 :44+9 :180+2 :367+19 :512+4 :538+7` | lista dyplomacji | port DOM (import `game/diplomacy-display` → DTO) | `src/ui/diploListHud.ts` | **ZROBIONE UI-2-E** (§2E) |
| 19 | `diplomacyAudience.ts` | +4/−17 | 0 | MOD | `:4 :304 :1267 :1342 :1383 :1395 :1433 :2172 :2195 :2207` | audiencja | port DOM (C2) | `src/ui/diplomacyAudience.ts` | **ZROBIONE UI-2-E** (§2E) |
| 20 | `diplomacyNegotiationModal.ts` | +15/−0 | +13/−0 | MOD | `:14+2 :25+2 :103+10 :565` | negocjacje | port DOM | `src/ui/diplomacyNegotiationModal.ts` | **ZROBIONE UI-2-E** (§2E) |
| 21 | `diplomacyPanel.ts` | +19/−0 | +19/−0 | MOD | `:34+2 :220+16 :266` | panel dyplomacji | port DOM | `src/ui/diplomacyPanel.ts` | **ZROBIONE UI-2-E** (§2E) |
| 22 | `diplomacyTradeBasket.ts` | +295/−34 | +203/−19 | MOD | `:5 :20 :43 :71 :139+2 :158 :171+5 :206+2 :225+18 :360+2 :531+4 :632+2 :839+21 :874+6 …` | koszyk handlu | port DOM (C2) | `src/ui/diplomacyTradeBasket.ts` | **ZROBIONE UI-2-E** (§2E) |
| 23 | `newGameFlow.ts` | +283/−144 | +144/−95 | MOD | `:80 :176+6 :243+5 :250 :252+4 :258 :558 :565 :670+7 :687+5 :693+4 :700 :810 :854 …` | kreator nowej gry | port DOM (P5.7 r2) | `src/ui/newGameFlow.ts` | **ZROBIONE UI-2-F** (§6) |
| 24 | `entityCards/buildingAdapter.ts` | +3/−3 | 0 | MOD | `:68 :70 :279` | adapter karty budynku | adapter (importy `game/*` → DTO) | `src/ui/entityCards/buildingAdapter.ts` | **ZROBIONE UI-2-D** (`e0eef2b84`, §6) |
| 25 | `entityCards/improvementAdapter.ts` | +7/−1 | 0 | MOD | `:27 :160+6` | adapter karty ulepszenia | adapter | `src/ui/entityCards/improvementAdapter.ts` | **ZROBIONE UI-2-D** (`e0eef2b84`, §6) |
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
| 5 | `aiOwnerProgressFrame` | KB | 16 | 1 | 0 | 0,75 | B (zrobione) |
| 6 | `armyMergePanel` | KB + PNG | 211 | 25 | 0 | 4,5 | B (zrobione) |
| 7 | `armySplitPanel` | KB + PNG | 271 | 19 | 0 | 4 | B (zrobione) |
| 8 | `unitReplacePicker` | PD | 20 | 3 | 20 | 1,75 | B (zrobione) |
| 9 | `siegeMapPanel` | PD + DTO | 25 | 3 | 25 | 3 | B (zrobione) |
| 10 | `hud` | PD | 60 | 24 | 60 | 5,75 | C (zrobione) |
| 11 | `empireDetailPanel` | PD | 293 | 31 | 293 | 11,5 | C (zrobione) |
| 12 | `empireDetailTypes` | AD | 6 | 1 | 6 | 0,75 | C (zrobione) |
| 13 | `armyStackHud` | PD + DTO | 51 | 10 | 51 | 4,5 | C (zrobione) |
| 14 | `unitRecruitCard` | PD | 164 | 25 | 164 | 8 | C (zrobione) |
| 15 | `hexContextTooltip` | PD | 108 | 28 | 108 | 7,25 | D (zrobione) |
| 16 | `preBattle` | PD | 45 | 13 | 45 | 3,75 | D (zrobione) |
| 17 | `buildModeHud` | PD | 27 | 5 | 27 | 2,25 | D (zrobione) |
| 18 | `diploListHud` | PD + DTO | 44 | 6 | 44 | 3,75 | E |
| 19 | `diplomacyAudience` | PD | 21 | 10 | 21 | 3 | E |
| 20 | `diplomacyNegotiationModal` | PD | 15 | 4 | 15 | 2 | E |
| 21 | `diplomacyPanel` | PD | 19 | 3 | 19 | 1,75 | E |
| 22 | `diplomacyTradeBasket` | PD | 329 | 50 | 329 | 15 | E |
| 23 | `newGameFlow` | PD | 427 | 76 | 427 | 21 | F |
| 24 | `entityCards/buildingAdapter` | AD | 6 | 3 | 6 | 1 | D (zrobione) |
| 25 | `entityCards/improvementAdapter` | AD | 8 | 2 | 8 | 1 | D (zrobione) |
| 26 | `cityPanel` (bloki K) | K | 441 | 89 | 277 | 20 | G (r1: 6/25 DRIFT; r2: 25/25 + K03; §6.5, §7) |
| | **Razem** | | **2709** | | **1945** | **129,25** | |

**Rekalibracja po UI-2-B (r1 `R-RUSTPORT-REPIN-UI-2-B-Q1`).** Wycena B = 14 h / 45 LP / 2 rundy; zużyto **1 rundę**
(czas zegarowy sesji Operatora ≈ 2 h, 05:37–07:40 UTC 2026-11-04 — pomiar zegara, nie wysiłku), w tym jednorazowa
infrastruktura interakcji w przeglądarce (`run-repin-ui2b.mjs`: prawdziwe zdarzenia klawiatury/myszy, 2 okna, zrzuty
ustalone) i 37 mutacji. LP faktycznie napisane w porcie (`git diff --numstat`): #8 +20/−2 (wycena 20), #9 +7/−1 w panelu + 5 w DTO (wycena 25:
mniej, bo `militiaEstimator` webu NIE jest portowany — `milicjaEst` już przychodzi z DTO od P5.3). ZAŁOŻENIE Z3 (wzór
godzin) zostaje bez zmiany współczynników: dwie partie (A, B) zmieściły się w 1 rundzie każda przy wycenie 3 h i 14 h,
więc wzór jest zachowawczy dla klas KB/PD < 30 LP; nie zmniejszam go, bo partie C–G to głównie PD z dużym L (hud,
empireDetailPanel, diplomacyTradeBasket, newGameFlow), dla których A/B nie dają kalibracji.

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

## 2b. Partia UI-2-B (zrobiona w `R-RUSTPORT-REPIN-UI-2-B-Q1` r1)

Web bez nowych zmian UI: `git log 86d510c66..origin/main -- gra/src/ui` = pusto (`origin/main` = `86d510c66` w chwili
pomiaru, 2026-11-04) — kopie i odniesienia z tego samego SHA co UI-2-A.

| # | Plik | Klasa | Wynik |
|---|---|---|---|
| 5 | `src/ui/aiOwnerProgressFrame.ts` (NOWY, 629 B) | kopia bajtowa | manifest `files` |
| 6 | `src/ui/armyMergePanel.ts` (16 627 B) | kopia bajtowa | manifest `files`; usunięty z `pin-manifest.json` |
| 7 | `src/ui/armySplitPanel.ts` (13 495 B) | kopia bajtowa | manifest `files`; usunięty z `pin-manifest.json` (433 → 431) |
| 8 | `src/ui/unitReplacePicker.ts` | port DOM | `UnitReplaceOption.blockedReason?`; `affordable = o.affordable && !o.blockedReason` (web `:162`); tytuł/wiersz przyczyny (web `:188+10`) |
| 9 | `src/ui/siegeMapPanel.ts`, `src/viewmodel/types.ts` | port DOM + DTO | `SiegePanelDto.milicjaRegen?: number`; „Milicja przy szturmie: N” bez „~”; „Milicja odnawia się: za N turę/tury/tur” (odmiana jak web) |

ZAŁOŻENIE Z4 (UI-2-B): web liczy `milicjaEst` przez podpinany `setSiegePanelMilitiaEstimator` (`3853015fc`), a okres
odnowy przez `setSiegePanelMilitiaRegenLeft` (`4c8f4a2e7`). W porcie oba są DANYMI DTO od „Rust” (`milicjaEst` od P5.3,
`milicjaRegen` nowe, opcjonalne: brak = 0 jak web bez podpiętej funkcji); setterów nie portuję (byłaby to logika
w UI). Producent `milicjaRegen` i nowej reguły „Milicja = 1 mieszkaniec, tylko z Garnizonem” = P6 (silnik).
ZAŁOŻENIE Z5: `affordable` w DTO pickera zachowuje znaczenie „skarb ≥ dopłata” (kontrakt P5.5); `blockedReason` jest
osobnym polem, a UI łączy je jak web — Rust nie musi wliczać przyczyny do `affordable`.

Mechanika: `repin-ui2-manifest.json` — `files` 4 → 7 (kopie) oraz NOWE `portDomRefs` (2: wersje weba `unitReplacePicker`/
`siegeMapPanel`, sha256 źródła); `verify-repin-ui2-copies` sprawdza dodatkowo sha256 `portDomRefs` z gita/`--web-dir`
i rozłączność z oboma manifestami; `repin-ui2-overlay.mjs` wstawia do odniesienia także `portDomRefs`;
`run-level1a.mjs` na nakładce podpina estymator Milicji webu TYM SAMYM wzorem, którym „Rust” wypełnia `milicjaEst`
(na czystym pinie funkcji nie ma — zachowanie bez zmian). Czysty pin po repinie: L1A **70 różnic** (58 `siegeMapPanel`
= usunięte „~”, 12 `armyMergePanel` = nowy panel), na nakładce 0.

Harness `tools/dom-harness/run-repin-ui2b.mjs` (Chromium 141 headless, web z `git archive` vs port, ta sama przeglądarka):
192 sceny × 2 okna (1280×720, 360×640) = 1356 kroków: merge N ∈ {0,1,3,14,15,16,20,44,45} (przewijanie 60/dół/0,
klik „▼ jeszcze N”, Enter na liście, Enter na „Połącz”/„Zostaw osobno”, Escape, klik w tło, Tab/Shift+Tab), split
N ∈ {1,2,3,15,16,20,45} (strzałki/Home/End/Spacja, przewinięcie + klik pozycji, cel, „Rozdziel”, wszystkie zaznaczone,
Anuluj, tło, brak celów), picker (7 opcji × 3 skarbce, w tym `blockedReason` pusty/z HTML), siege (`milicjaRegen` ∈
{brak,0,1,2,3,4,5,11,12,13,14,15,21,22,24,25,102,112,114,122,−3,2,5} × Milicja {0,3,−2} × garnizon {0,40}, klawisze
1/2/3/Enter/Escape, `updateSiegeMapPanelTurn`) oraz `shouldYieldAiOwnerProgressFrame` (4 602 wejść). Stan kroku =
`outerHTML` panelu, aktywny element (autofokus), metryki przewijania, prostokąty, dziennik akcji. 14 zrzutów PNG
(merge/split 20 i 45, merge po „przewiń”, picker, siege, oba okna) — bajtowo równe. 55 asercji pokrycia na wynikach
webu. Ustalenie stanu: animacje kończone (`getAnimations().finish()`), przewinięcia stałe 3 klatki; zrzut ustalony
(2 kolejne równe) z `scrollbar-color: transparent` — zmierzone r1: kciuk nakładkowego paska listy (7 px) różnił się między
przebiegami przy tym samym DOM i `scrollTop` (rysowany poza DOM; reguła `scrollbar-color` paneli jest w kopiach bajtowych).
Fixtura `tools/dom-harness/fixtures/repin_ui2b-web-vectors.json` (38 948 B: sha256 każdego kroku + zrzutów;
`webVectorsSha256=7331844c02cc0ec8f3210c331f3ff0b9df5fe9f31e1c9afd85f3175a69d504b9`) — bajtowo ta sama z dwóch osobnych
`git archive` (sha256 pliku `cf0ed612…1dda4e`). Mutacje `mutate-repin-ui2b.mjs`: 37/37 wykrytych (A3 pierwotna
`startIndex >= ownerCount → >` okazała się RÓWNOWAŻNA i została zastąpiona).

Uwaga: `run-level1a.mjs` dla `armyMergePanel` ma `DOM_puste=12/12` — web od `ad932ea69` montuje modal w `<html>`
(nie w `<body>`), a stary harness czyta `body`; zachowanie DOM merge pokrywa `run-repin-ui2b` (asercja „montaż w <html>”).
GPU/natywne okno Tauri: NIE_ZMIERZONO.

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
| UI-2-B | #5 `aiOwnerProgressFrame`, #6 `armyMergePanel`, #7 `armySplitPanel` (kopie bajtowe), #8 `unitReplacePicker`, #9 `siegeMapPanel` (+ `SiegePanelDto.milicjaRegen?`) | kopie sha=manifest; harness merge/split: siatka 3×5, licznik, „▼ jeszcze N”, Enter — DOM web=port + zrzut PNG; milicja: N∈{0,1,2,4,5,12,22} pluralizacja = web | **ZROBIONE** (`R-RUSTPORT-REPIN-UI-2-B-Q1` r1, §2b): wycena 14 h / 45 LP / 2 rundy → zużyta 1 runda, LP 35 |
| UI-2-C — **ZROBIONE** (§2c) | #10 `hud`, #11 `empireDetailPanel`, #12 `empireDetailTypes`, #13 `armyStackHud`, #14 `unitRecruitCard` | harness HUD na DTO z wartościami ≥1000: tekst `20,9k`, `title` „Dokładnie: …” = web | 30,5 h / 574 LP / 4 rundy (#10 5,75 · #11 11,5 · #12 0,75 · #13 4,5 · #14 8) — zalecany podział na 2 tematy: C1 = #10+#12+#13 (11 h), C2 = #11+#14 (19,5 h) |
| UI-2-D | #15 `hexContextTooltip`, #16 `preBattle`, #17 `buildModeHud`, #24–25 adaptery kart | `run-cycles` na nakładce 0 różnic po repinie odniesienia | 15,25 h / 194 LP / 2 rundy (#15 7,25 · #16 3,75 · #17 2,25 · #24 1 · #25 1) |
| UI-2-E | #18–22 dyplomacja | `run-cycles` (C2) + nowe wektory koszyka | 25,5 h / 428 LP / 4 rundy (#18 3,75 · #19 3 · #20 2 · #21 1,75 · #22 15) — zalecany podział: E1 = #18–21 (10,5 h), E2 = #22 (15 h) |
| UI-2-F | #23 `newGameFlow` | `run-newgame` na nakładce 0 różnic | 21 h / 427 LP / 3 rundy (#23 21) |
| UI-2-G | #26 bloki K (25 DRIFT z §3 + K02–K04), kolejka rekrutacji ↑↓✕, kolejność wg epoki | per blok: marker przepięty na `86d510c66` (lub nowszy main), `verify-k0*-copies` EXIT 0 | 20 h / 277 LP (±LCS) / 3 rundy (25 bloków DRIFT · 0,5 h + 277/50 + 2 h markery K02–K04) |

Pozostało po UI-2-A: 126,25 h / 1945 LP (B–G). **Pozostało po UI-2-B: 112,25 h / 1900 LP ≈ 14 rund pracy wg Z3**
(16 przy zaokrąglaniu w górę per partia: C 4 · D 2 · E 4 · F 3 · G 3); kolejka: **UI-2-C** (zalecany podział C1 = #10+#12+#13,
C2 = #11+#14) → UI-2-D → UI-2-E (E1, E2) → UI-2-F → UI-2-G (wycena = ZAŁOŻENIE Z3, do rekalibracji po każdej partii —
w raporcie partii wpisać h zużyte vs wycena; B: 14 h wyceny → 1 runda / ≈ 2 h zegara). Temat > 2 rund wyceny dzielić na osobne ID, żeby nie zbliżać się do limitu 5 rund.

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
# UI-2-B
node tools/dom-harness/run-repin-ui2b.mjs --web-dir "$WEB" [--out fixtura.json] [--png-dir "$PNG"]
node tools/dom-harness/mutate-repin-ui2b.mjs --web-dir "$WEB" --from 0 --to 17   # i dalej 17–27, 27–31, 31–37 (< 10 min/wywołanie)
```

## 2c. Partia UI-2-C (R-RUSTPORT-REPIN-UI-2-C-Q1, runda 1)

Baza `rust-port/parity-v2` `2198eaf7e`; web `origin/main` = `86d510c66` (`git log 86d510c66..origin/main -- gra/src/ui` = 0
commitów w chwili pracy). Klasa wszystkich 5 plików = PORT DOM (żaden nie był w `pin-manifest.json` → brak wpisów do
usunięcia; brak kopii bajtowych → `repin-ui2-manifest.json` bez zmian).

Metoda portu (pomiar, nie ręczne przepisywanie): `diff -u` pin `edb8fb56` → main `86d510c66` każdego pliku nałożony
`patch` na plik v2 (v2 ≈ pin + adaptacje P5.x). Hunki nałożone automatycznie: hud 16/16, empireDetailTypes 1/1,
armyStackHud 5/5, empireDetailPanel 14/17, unitRecruitCard 7/9; 5 odrzuconych hunków przeniesione ręcznie
(importy `game/*` + `item.nazwa` → `item.label` + iloczyn obywateli liczony w v2 przez silnik). Różnica v2 ↔ main po
porcie (`diff | grep -c '^[<>]'`): hud 3 (most `armyStackHudSuppression`, jak przed), empireDetailTypes 72 (jak przed),
armyStackHud 5 (jak przed), unitRecruitCard 42 (było 39: +3 linie komentarza/`item.label`), empireDetailPanel 141
(było 128: +13 = kopia `taxForWorkAmount` i komentarz C-Z2).

ZAŁOŻENIA partii:
- **C-Z1** `taxForWorkAmount` (main `game/work-tax.ts:8-12`) — kopia 1:1 w `empireDetailPanel.ts` wyłącznie do PODGLĄDU
  „Zamiana Pracy na podatek”; stawkę (`getOwnerWorkTaxRate`) i samą zamianę (`onConvertOwnerWorkToTax`) daje silnik.
  Hooki `canConvertOwnerWorkToTax`/`getOwnerWorkTaxRate`/`previewOwnerWorkTaxEffect`/`onConvertOwnerWorkToTax` są w v2
  opcjonalne i NIEPODPIĘTE przez kontroler (blok nie renderuje się, dopóki producent nie poda `canConvert…` = true) —
  producent: P6 (`src/controller/**`, poza allowlistą).
- **C-Z2** Stawka obywateli wg epoki: panel czyta `resources[].citizenRatePerCitizen` (fallback stała katalogu) tylko do
  stopki; iloczyny `zuzycieObywateliPerTyp`/`zuzycieObywateliPerTurn` liczy silnik (P5.7) — producent musi użyć tej samej
  stawki epoki (P6). Harness gra „Rust” liczący `floor(ludki × stawka wiersza)`.
- **C-Z3** Rekrutacja w zakładce Armia: hooki `mountCityRecruitment`/`mountGeneralRecruitment`/
  `getRecruitFollowGeneralDefault`/`onRecruitFollowGeneralDefaultChange` zastępują `onPurchase` (usunięty w main);
  kontroler v2 ich nie podpina → sekcja pokazuje „Nie udało się załadować rekrutacji tego miasta.” jak web bez hooka
  (P6/UI-2-G: lista kart = `cityPanel` K06B).
- **C-Z4** `ArmyStackCard.commanderTitle` / `armyStackCardIdentity` — producent karty (główna pętla gry) w P6; UI gotowe.

Bramki (z `src-tauri/frontend-v2/`, `npm ci` na czas pracy):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (`verify-pin-copies` 433/0; `verify-repin-ui2-copies` 4/0 +
  `porty_nakładki=6` — NOWE addytywne sprawdzenie `tools/repin-ui2-overlay-ports/*.json` ze źródłem git).
- `tools/dom-harness/run-repin-ui2c.mjs` (NOWY): web `86d510c66` i port w Chromium 141 headless (pojedynczy wątek
  rastra — wielowątkowy dawał ±1 w kanale na pasku 2 px w scenie Armia przy identycznym DOM), 10 grup / 752 wektory
  (pasek HUD 515 stanów z granicami 999/1000/1001, 999 949/999 950, 2^53, nienumeryczny `zywnoscLabel`; tożsamość
  i roster dowódcy; karta rekrutacji 75 jednostek × 12 wariantów + interakcje; sekcja rekrutacji Armia; 53 przebiegi
  pełnego panelu imperium z zamianą Pracy, `confirm` tak/nie, stawką epoki 1,5), 8 zrzutów PNG (HUD+roster, wiersze
  rekrutacji, panel Praca, panel Armia × 1280×720 i 360×640): **różnic=0**, PNG bajtowo równe, `pageerror`+`console.error`=0.
- Niezależny weryfikator: 2 osobne `git archive 86d510c66` → `webVectorsSha256=d69070ce…a93df0` i plik fixtury
  `tools/dom-harness/fixtures/repin_ui2c-web-vectors.json` sha256 `adcacfbb…de9d0f` identyczne w obu.
- `tools/dom-harness/mutate-repin-ui2c.mjs` (NOWY): **45/45 mutacji wykrytych** (hud 12, panel 16, typy 1 przez `tsc`,
  roster 6, karta 10); wykrycie = EXIT 1 z pełnym przebiegiem harnessu (błąd składni ≠ wykrycie). Uwaga: #1–#35
  zmierzone przed dodaniem 12. wariantu karty rekrutacji (dodatkowe wektory tylko w grupach `recruit*`).
- Regresja starszych harnessów na nakładce `pin + UI-2-A + UI-2-C` (`repin-ui2-overlay.mjs` czyta teraz także
  `repin-ui2-overlay-ports/ui2c.json`: 5 plików `gra/src/ui` + `gra/src/game/work-tax.ts` z main): L0 3861/0, L1A 3618/0,
  L2 1784/0 (jsdomErrors 354 / consoleErrors 150 jak w A), C4 1649/0 (75), cycles 6401/0, hud **899**/0, newgame 1194/0,
  cityux 164/0. `hud` 927 → 899 przypadków: eksploracja klika mniej elementów, bo main usunął formularz masowej
  rekrutacji (select/liczba/przycisk, main `empireDetailPanel.ts:2775-2845`) — przyczyna = ZAŁOŻENIE, liczby zmierzone.
- GPU / natywne okno Tauri: NIE_ZMIERZONO.

Wycena po partii (rekalibracja Z3): wycena C = 30,5 h / 574 LP / 4 rundy; zużyto **1 rundę Operatora ≈ 2,2 h zegarowe**
(pierwsza zmiana pliku 05:59 → raport ~08:10), w tym harness/mutacje. Wniosek: dla PD, gdzie v2 ≈ pin (+ adaptacje),
koszt ≈ `0,5 + 0,05·H + L/200` h (nakładanie łatki pin→main + harness), a nie `1 + 0,15·H + L/50`. Pozostało po A + C
(B w toku): **95,75 h wg starego wzoru**; wg skalibrowanego wzoru dla pozostałych PD (#8, #9, #15–#23) ≈ 0,5·11 +
0,05·201 + 1080/200 ≈ **21 h** (bez adapterów #24–#25) + K (UI-2-G, 20 h, wzór K bez zmian) — do potwierdzenia na UI-2-B/D.

## 6. Partia UI-2-D (R-RUSTPORT-REPIN-UI-2-D-Q1 r1, kod `e0eef2b84`)

Baza: `rust-port/parity-v2` `2198eaf7e`; web = `origin/main` `86d510c66` (`git log 86d510c66..origin/main -- gra/src/ui` = pusto,
2026-11-04). Klasa wszystkich 5 plików = port DOM/adapter (żaden nie był w `pin-manifest.json` — nic do usunięcia).

| # | Plik portu | Hunki main przeniesione | Reguły (→ Rust/DTO) |
|---|---|---|---|
| 15 | `src/ui/hexContextTooltip.ts` | `:135-147` produkcja ulepszenia bez „magazyn państwa · bez 👤”; `:177-192` produkcja (klasa `cp-prod-line`) NAD „→ plony miasta”, gałąź bez produkcji; `formatHexMagazynSummary` usunięte; `:590-596` blok „Surowce z terenu (przy 👤)” tylko z terenu; `:602` nowa stopka; `:502` możliwe ulepszenia `→ {produkcja} · plony miasta`; `:691-772,913-919` stos: `commanderTitle` (Wódz/Generał: klasa `commander`, `data-commander`, `aria-label`/`title`, rola „★ …”, „Wybrana jednostka: Wódz — …”); `:881-883` CSS | `ownerEra` (`:253,270,282,293,439,549`) — `HexTooltipViewDto` liczy Rust z epoką gracza (ZAŁOŻENIE **UI2D-Z1**, komentarz w `viewmodel/types.ts`) |
| 16 | `src/ui/preBattle.ts` | `:155-158` opcje `automaticOnly`/`manualControlAllowed`; `:254-260` `automaticOnly` → `onAuto()` PO bramce kolejki odroczonych (FIFO); `:820-826,878-880,894,905,930` notka „Bez Wodza lub Generała…”; `:935-938` | chipy `effectiveCombatBonusChipTexts(bonusy, skład → civCombatUnitShapeFromCategory, {side, terrain: teren, isChargeRound: false})` (`:725-728`) — `PreBattleSide.bonusChips` z Rust (ZAŁOŻENIE **UI2D-Z2**) |
| 17 | `src/ui/buildModeHud.ts` | `:90-93` hooki `getUnspentBudgetWarning`/`onUnspentBudgetDisableFilter`; `:215` etykieta Zrównoważone; `:307-313` CSS `.civ-build-unspent`; `:612-620` wskaźnik (tylko tryb auto, `waitingHexes > 0`); `:863-866` klik → callback + render | warunek ostrzeżenia = kontroler/Rust (hook) |
| 24 | `src/ui/entityCards/buildingAdapter.ts` | `:68-70` `ownerId` (komentarz), `civBonusy?` w stanie karty | `workCost` = `buildingWorkCost(…, civBonusy, …)` (`:279`) — `BuildingCardStateDto.civBonusy?` (addytywnie) |
| 25 | `src/ui/entityCards/improvementAdapter.ts` | `:27,160-165` „Koszt (Praca)” skalowany | `scaleTerrainImprovementWorkCost(koszt_praca, epoka)` → `StaticCatalogDto.terrainImprovementWorkCost?[key]` (addytywnie; brak → surowe `koszt_praca`, ZAŁOŻENIE **UI2D-Z3**) |

Producent Rust nowych pól DTO (`terrainImprovementWorkCost`, `civBonusy`, epoka w `HexTooltipViewDto`, chipy wg składu/terenu):
NIE_ZMIERZONO — `src-tauri/src/**` poza allowlistą (kolejka P6). Hak `getUnspentBudgetWarning` i opcje `automaticOnly`/
`manualControlAllowed` — wołający (kontroler v2) jeszcze ich nie podaje; wartości domyślne = zachowanie pinu.

Weryfikacja:
- `tools/dom-harness/run-repin-ui2d.mjs` — web main i port w Chromium 141 (DTO liczone na stronie web funkcjami `game/**`
  main): 797 przypadków (tooltip heksa 440: 88 heksów × epoka {brak,1,2,3,4}; karta stosu 10; CSS 1; okno przed bitwą 147
  = 4 sytuacje × 7 zestawów opcji × {brak, deploy, auto, cancel, Enter} + kolejka odroczonych × 7; HUD budowy 15; karta
  budynku 160; karta ulepszenia 23 + 1 kopia wiersza), DOM po parsowaniu przeglądarki 0 różnic; 6 zrzutów PNG (3 sceny ×
  1280×720 / 360×640) bajtowo równe; znaczniki nowych hunków 16/16, usunięte teksty 0; asercje UI2D-Z3 2/2;
  `pageerror`/`console.error` 0. Fixtura `fixtures/repin_ui2d-web-vectors.json`: `webVectorsSha256=4f79e00e…a23b81d50`,
  plik sha256 `6b6fa408…158a51` — identyczne z dwóch osobnych `git archive` (niezależny weryfikator).
- `tools/dom-harness/mutate-repin-ui2d.mjs` — 32 mutacje (każda gałąź/tekst/CSS nowych hunków) na kopii `src/`: 32/32 wykryte.
- Starsze harnessy: `repin-ui2-overlay.mjs` podmienia też porty z sekcji `overlayPortsUI2D` manifestu (`hexContextTooltip`,
  `buildModeHud`, `buildingAdapter` — wersje main; `preBattle` i `improvementAdapter` poza nakładką: import reguł
  nieobecnych na pinie / pole DTO). `run-cycles.mjs` liczy DTO heksa z epoką, gdy odniesienie zawiera `ownerEra` (na czystym
  pinie bez zmian). Na nakładce: L0 3861/0, L1A 3618/0, L2 1784/0 (jsdomErrors 354, consoleErrors 150 = baza), C4 1649/0
  (75/0 = baza), cycles 6401/0, hud 927/0, newgame 1194/0, cityux 164/0, k05b 384/0.
- `verify-repin-ui2-copies` sprawdza dodatkowo odniesienia `overlayPorts*` (sha256 = `git show 86d510c66:…`, 3/3).
- r2 (Evaluator r1 Z1/Z2): mutacja H11 w `mutate-cycles.mjs` celowała w usunięte `formatHexMagazynSummary` (wzorzec 0×) →
  zastąpiona mutacją wiersza produkcji ulepszenia (`if (mag)` → `cp-prod-line`), dodana H14 (blok „Surowce z terenu
  (przy 👤)”); `mutate-c4.mjs`/`mutate-level2.mjs` dostały opcjonalne `--only` (porcje ≤ 570 s). Na nakładce:
  mutate-cycles 67/67, mutate-c4 20/20, mutate-level2 34/34 wykryte; run-cycles 6401/0.

Wycena po partii (ZAŁOŻENIE Z3): plan D = 15,25 h / 194 LP / 2 rundy; zużyto 1 rundę Operatora (+242/−51 linii w 11 plikach,
w tym reużywalna infrastruktura nakładki portów i harness Chromium dla portów DOM). Pozostało po A i D:
**111 h / 1751 LP ≈ 14 rund** (B, C, E, F, G; B i C w toku równolegle — ich zużycie wpiszą ich partie).

## 7. Partia UI-2-F — `newGameFlow.ts` (R-RUSTPORT-REPIN-UI-2-F-Q1, runda 1)

Baza `rust-port/parity-v2` `2198eaf7e`; web `86d510c66` (= `origin/main` 2026-11-04; `git log 86d510c66..origin/main -- gra/src/ui` = 0).
Pomiar: `diff -U0 edb8fb56 86d510c66 gra/src/ui/newGameFlow.ts` = 76 hunków, +283/−144 (zgodne z §1 #23).

**Metoda portu (zmierzona):** `diff3 -m port(2198eaf7e) × pin(edb8fb56) × web(86d510c66)` → 1 konflikt
(`appendCivMatrixCell`: `<summary>` weba + `cell.paramLabel` portu, rozstrzygnięty ręcznie). Wynik vs web = 10 hunków,
WYŁĄCZNIE adaptacje P5.7 r2 sprzed repinu (importy → `StaticCatalogDto`/`newGameQueries`, kopia jakości mapy,
`civAvailableAtEpoch`, pola `CivMatrixCellDto`, `summaryRows`) + 2 linie komentarza repinu. Powiązane pliki portu: brak
zmian — `CivMatrixProfileDto.parameterCount`, `NewGameParams.typSwiata` i zapytania istniały; nowe ustawienia
(`deals_end_turn_gate`, `player_epoch_war`) przychodzą danymi `StaticCatalogDto.uiParams` (producent Rust = P6; MOCK ma
pustą listę). Zmiany weba poza UI wpływające na kreator (P6, nie UI-2): `game/civ-matrix-semantic.ts` (+134 linie:
statusy pól, wyjątek Egiptu `walka_ruch_bitwa_proc`), `gra/data/ui-params.json` (2 nowe ustawienia), `data/loader.ts`
(typy opcjonalne bonusów).

Hunki weba przeniesione: domyślne „Zaawansowane opcje” (bitwy ręczne, tempa „normalny”, trudność miast-państw `normal`);
siatka kroku 4 = 12 pozycji w 2 kolumnach (udział lądu, trudność miast-państw, barbarzyńcy, warunki zwycięstwa, chatki,
wojna epoki w siatce głównej); Ziemia bez suwaka lądu + wiersz „szablon kontynentów (bez suwaka)”; przerysowanie po
zmianie typu świata; `dealsEndTurnGate`/`playerEpochWarEnabled` w `onStart`; glify ikon spoza `SETTING_SVG_KEYS`;
przełącznik „Pokaż/Ukryj parametry cywilizacji” (gracz i fotel 2, reset przy otwarciu); komórki macierzy jako
`<details>`; liczba wskaźników z danych; usunięte bonusy; fotel 2 z jednostką specjalną i profilem; start gry w pasku
nawigacji (`data-seat-ready`, `disabled`); „Zastosuj”; etykiety bitew; CSS (`overflow`, `.content` przewijane, `.nav`,
media 900px/760px, `.adv-close`).

**Mechanika:** `tools/repin-ui2f-ported.json` (NOWY, lista portów DOM przepiętych na web: plik weba + sha256
`dd158388…c4ae`/123949 B) — `repin-ui2-overlay.mjs` (dopisek addytywny) podmienia te pliki weba w odniesieniu pinu
(`repin-ui2*-ported.json`, jeden plik na partię — bez konfliktu z B–E). `repin-ui2-manifest.json`/`pin-manifest.json`:
bez zmian (`newGameFlow.ts` nie jest kopią bajtową ani wpisem pinu). `run-newgame.mjs`: 1 zmiana — „start” spada na
`.nav .nb.next[data-seat-ready]`, gdy brak `.sett-actions .start` (na pinie bez zmiany zachowania).

**Harness** `tools/dom-harness/run-repin-ui2f.mjs`: web i port w Chromium 141 (headless), 35 scenariuszy (kroki 1–5,
okno zaawansowane, fotel 2, prefs v4 z Ziemią, `getCivs`, pusty profil), porównanie DOM (body + `<style>` + geometria
przewijania) przy 1280×720 i 360×640, log `onStart`/`summaryRows`/`localStorage`, 24 zrzuty PNG × 2 viewporty (bajty
równe), COVER na stronie weba, asercja „11/11 zapytań silnika użytych”. Wynik: **różnic=0**, `pageerror`+`console.error`=0.
Fiksatura `fixtures/repin_ui2f-web-vectors.json` (sha256 `f976fa89…beae`, `webVectorsSha256=9f6a4de3…73fc`) —
identyczna z 2 osobnych katalogów `git archive 86d510c66`. Mutacje `mutate-repin-ui2f.mjs`: **34/34 + M00** (port sprzed
repinu, 225 różnic) wykryte; w r1 2 mutacje równoważne (M07 wartość początkowa nadpisywana w `showNewGameFlow`, M29 klucz
wiersza poza DOM) zastąpione, M33 wymagała nowego scenariusza `k3-pusty-profil`.

**Regresja na nakładce** (pin + 4 kopie UI-2-A + `newGameFlow.ts` weba): `run-newgame` 9 grup `--only-label`
(1993 przypadków kombinacji + 202 stałych/grupę) różnic=0, jsdomErrors=0; bez nakładki (czysty pin) różnice = oczekiwane
(184/184 w `dane/brak/s1`). L0 3861/0, L1A 3618/0, C4 1649/0 (jsdomErrors=75 jak baza), L2 1784/0 (jsdomErrors=354,
consoleErrors=150 jak baza; 1 z 3 przebiegów dał 1 różnicę niereprodukowalną — L2 nie importuje `newGameFlow.ts`;
obciążenie CPU równoległych worktree), cycles 6401/0, hud 927/0, cityux 164/0. GPU/natywne okno Tauri: NIE_ZMIERZONO.

**Wycena po partii:** wycena §1a = 21 h / 427 LP / 3 rundy; zużyto 1 rundę Operatora — LP faktycznie napisane ręcznie
≈ 4 (rozstrzygnięcie konfliktu), reszta przeniesiona `diff3`, koszt dominujący = harness/mutacje/regresja. Rekalibracja
ZAŁOŻENIA Z3 dla PD z małą liczbą adaptacji: `h ≈ 1 + 0,05·H + harness` zamiast `1 + 0,15·H + L/50`. Pozostało po A+F
(B–E, G w toku/kolejce): **105,25 h** wg dotychczasowego wzoru (126,25 − 21).

_(Numeracja sekcji UI-2-G zmieniona przy integracji: oryginalne §6→§8, §7→§9 — kolizja z §6 D i §7 F.)_

## 8. Partia UI-2-G — runda 1 (`R-RUSTPORT-REPIN-UI-2-G-Q1`)

Baza `rust-port/parity-v2` `2198eaf7e`; web `86d510c66` (`git log 86d510c66..origin/main -- gra/src` = 0 commitów w dniu
pracy, `origin/main` = `86d510c66`). Zakres r1 (ZAŁOŻENIE G-Z1): partie K z najmniejszym dryfem i bez nowych
delegatów kontrolera — **K01A, K01B, K05A, K06A** w całości (wszystkie markery plików przepięte), plus pomiar K02–K04.
K05B, K06B (kolejka rekrutacji ↑↓✕ `ff6ac152c`), K07B, K08B (pula rekrutów + `formatCompactNumber`), K08C, K08D, K08E,
K09C/K09D → r2–r3 (§8.5).

### 8.1 Mechanika repinu bloków K

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

### 8.2 Bloki z dryfem przepięte w r1 (6/25)

| Partia | Jednostka | pin → web | Zmiana webu | Uwagi portu |
|---|---|---|---|---|
| K01A | `formatBuildEtaLabel` | 879-888 → 923-933 | tylko komentarz następnej deklaracji | — |
| K01B | `queueItemCumulativeEta` | 889-911 → 934-963 | 4. param `buildingPracaPerTurn` (tempo budynków ≠ jednostek; ≤0 → null) | ręcznie (port `reguly().etaTurns`, typy `*K`) |
| K05A | `recruitManpowerCost` | 8050-8054 → 8125-8130 | `cfg.getManpowerMultipliers` (maxMult/costMult) | delegator + DTO 4 arg |
| K05A | `unitStockCostChipsHtml` | 8102-8124 → 8178-8202 | „(brak)” w chipie | — |
| K05A | `formatBuildingCatalogLockHint` | 8542-8576 → 8749-8786 | 4. param `brakZasobow` → „Brakuje: …” | wołający K06B `renderBuildList` jeszcze bez parametru (r2/r3) |
| K06A | `tileYieldLabel` | 9765-9783 → 10009-10028 | 2. param `ownerEra` → `wlascicielEra` (`8769854ff`) | ręcznie; reguła plonów = silnik (P6) |

### 8.3 K02–K04 (bez markerów) — pomiar

`tools/dom-harness/measure-repin-ui2g-k02k04-drift.mjs`: (a) po nazwie — 138 deklaracji, SAME 37, DRIFT 0, GONE 0,
PORT_ONLY 101 (nazwy portu bez odpowiednika w webie: typy DTO/adaptery K04b–d); (b) po odwołaniach `:A-B` w komentarzach
— 343 odwołania, REF_SAME 333, REF_DRIFT 10 (k03-cards 3, k03-model 3, k04c-zamoznosc 2, k04c-model 1, k04b-podzial 1;
to szerokie zakresy całych funkcji, np. `:314-606`, w których dryf leży w innych jednostkach — K08D/K08E/K05B; k04b-podzial
`:545-552` to najpewniej `cities.ts` — ZAŁOŻENIE G-Z3 przypisuje gołe odwołania do `cityPanel.ts`). Wniosek: K02–K04 nie wymagają
zmiany kodu z tytułu dryfu webu; REF_DRIFT przejrzeć przy repinie K05B/K08D/K08E (r2).

### 8.4 Testy r1

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

### 8.5 Przeliczenie wyceny UI-2-G (ZAŁOŻENIE Z3, rekalibracja)

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

## 9. Partia UI-2-G — runda 2, obrona (`R-RUSTPORT-REPIN-UI-2-G-Q1`)

Baza: commit Operatora r1 `d049f45a6` (kod `84d312c0c`). Web `86d510c66` = `origin/main` (bez nowych commitów `gra/src`).
Zakres r2 = cała reszta GOAL K01–K09 (zarzut Z1) + Z2–Z6 z oceny Evaluatora r1.

### 9.1 Bloki przepięte w r2

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

### 9.2 Bramki weryfikatorów i `npm run check` (Z3, Z4, Z5)

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

### 9.3 Harnessy i mutacje na webie (Z2, Z6)

- 37 harnessów `run-k01b…k09b` na webie: **36/37 EXIT 0**. Wyjątkiem jest `run-k02-styles`, którego przyczynę
  opisuje §9.1 (UI-2-C).
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

### 9.4 K09C/K09D i delegat produkcyjny (ZAŁOŻENIE G-Z8)

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

### 9.5 Wycena

r2 domyka całą resztę zakresu K01–K09: 19 DRIFT, 136 markerów, K03, 3 czerwone bramki z bazy oraz CONTENT w `check`.
Do zrobienia zostaje K09C/K09D w osobnym ID (wiring kontrolera wg §9.4, ok. 6–8 h, w tym P6). Pomiaru Chromium/PNG
dla bloków r2 nie zrobiono w tej rundzie. Na webie dowodem są harnessy jsdom pin-exec (36/37) i bramki CONTENT, a
`run-repin-ui2g` (r1, 9216/0, PNG =) przechodzi bez zmian.

## 10. Partia UI-2-E — dyplomacja #18–#22 (`R-RUSTPORT-REPIN-UI-2-E-Q1`, runda 1)

Baza `rust-port/parity-v2` `2198eaf7e`; web `origin/main` = `86d510c66` (`git log 86d510c66..origin/main -- gra/src/ui` = 0 commitów
w chwili pracy). Wszystkie 5 plików = klasa PD (port DOM, NIE kopie bajtowe): hunki webu `edb8fb56 → 86d510c66` nałożone
3-drożnie (`diff3 -m port pin main`) na port; konflikty (importy `game/*`, `basketPnOpts`/`toPnItems`, typ `lines` listy)
rozstrzygnięte adapterem DTO. Różnica plik webu ↔ port (linie `diff`), przed → po: `diploListHud` 15 → 15,
`diplomacyAudience` 197 → 195 (r2: usunięty martwy alias `CivBonusLiteDto as CivBonusLite` = web hunk `:4`; numstat portu +4/−17 = web), `diplomacyNegotiationModal` 25 → 25, `diplomacyPanel` 3 → 3, `diplomacyTradeBasket` 285 → 307
(+22 = adapter bramki miasta, pole `basketActionId` w `rulesCtx`, typ `renderBasketItemValueHtml`, komentarze).

Funkcje webu przeniesione: znacznik „Agresor (N)” (`diplomacyPanel` `agresorBadgeHtml`), wiersze „Wojny / Sojusze / Handel”
z „+N” i tooltipem (`diploListHud`), rozejm 5/10/15 tur (akcja '10', `rodzaj`/`turns`, `proposalActionIdFromPayload`),
oddanie miasta w pokoju/wasalizacji (picker + formularz „Dodaj”, pozycja `'miasto'`), wymiana cykliczna max 30 tur
+ „Bezterminowo” (`exchangeDurationTurns`), `formatCompactQty` → `formatCompactNumber` (UI-2-A), audiencja bez bonusów
cywilizacji (`getCivBonusy` usunięte z konfiguracji).

Kontrakt DTO (addytywnie, `viewmodel/types.ts`): `BasketItemTyp |= 'miasto'`; `BasketItemDto.cityPn?/cityWeight?/cityLabel?`;
`BasketRulesCtxDto.basketActionId?` (= web `basketPnOpts.actionId`); `StaticCatalogDto.constants.miastoAkcjeDozwolone?`
(= `MIASTO_AKCJE_DOZWOLONE`). ZAŁOŻENIE E-Z1: bramka `diplomacyMiastoAkcjaDozwolona` = odczyt listy z katalogu (brak pola =
pusta lista = brak pozycji 'miasto', fail-safe jak web bez actionId); producent Rust (wycena miasta, `cityPn` w opcjach
`miastoOptions`, actionId w `diplomacySumPn`) = P6. ZAŁOŻENIE E-Z2: `diploListEntryFromRelation` przyjmuje nowe pola
`warPartnerNames/alliancePartnerNames/dealPartnerNames` obok `lines` (P5.5) — producent nazw partnerów = kontroler/Rust (P6).

Harnessy partii (z `src-tauri/frontend-v2/`):
- `tools/dom-harness/run-repin-ui2e.mjs` — Chromium 141 (Playwright), web z `git archive` vs port, wspólny kod
  `repin-ui2e-scenes.mjs`, „Rust” = `repin-ui2e-rust.mjs` (funkcje `game/*` webu): 5 modułów, 6 funkcji / 183 wektory,
  15 scen × 2 viewporty (1280×720, 360×640) = 30 zrzutów: DOM równy, PNG bajtowo równy (próg 0), `pageerror`/`console.error` = 0.
  r2 (zarzut Z2): + `diplomacyAudience.ts` — sceny `audiencja` (pełny stan, pakt) i `audiencja-wojna` (miasto-państwo, wojna);
  stan → DTO „Rust” `audienceState` (formuła `run-repin-ui2e-cycles` §7), `getCivBonusy` podany z niepustą listą — web i port
  bez `.da-bonus` na kartach; sceny w osobnym przebiegu po scenach r1 (styl audiencji w `<head>` nie zmienia ich DOM —
  26 scen r1 bajtowo jak w fixturze r1). Fixtura `tools/dom-harness/fixtures/repin_ui2e-web-vectors.json`
  (sha256 `5d2c839b…be05`), `webFixtureSha256=fb54360d7b6df6444e8ad8e67220d54dbdc0f56d260c7450cc5a1054fb719381`,
  `webPngSha256=01e76bc7…872c` — identyczne z 2 osobnych katalogów `git archive 86d510c66` (niezależny weryfikator).
- `tools/dom-harness/run-repin-ui2e-cycles.mjs` — pochodna `run-cycles.mjs` z odniesieniem = web main (jsdom, eksploracja):
  audiencja 224, negocjacje 171, koszyk 8940 przypadków; łącznie 9335, różnic 0, jsdomErrors 0, consoleErrors 0.
- `tools/dom-harness/mutate-repin-ui2e.mjs` — 67 mutacji (DP 6, LH 8, NM 2, AU 2, TB 49) — 67/67 wykrytych (przebieg w częściach
  `--from/--to`; TB12 `'rozejm'→'pokoj'` byłaby równoważna: web `diplomacy-war-gates.ts:11` — mutowano na `'handel'`).
  r2 (zarzut Z1): klasyfikacja ścisła — WYKRYTA tylko przy EXIT 1 harnessu ORAZ jego dowodzie różnicy na stdout
  (`różnic=N≥1` / `STOP_ON_DIFF`); EXIT 2, EXIT 1 bez dowodu, inny kod = BŁĄD; przekroczenie limitu = TIMEOUT (osobny status);
  EXIT mutatora 2 przy ≥ 1 BŁĄD/TIMEOUT. Przed serią przypadek KONTROLNY bez mutacji (Chromium + jsdom modułów zakresu = EXIT 0,
  `różnic=0`), opcjonalny znacznik kontroli kluczowany sha256 treści wejść (`--control-stamp-dir`). `run-repin-ui2e*.mjs`:
  `uncaughtException`/`unhandledRejection` i błąd `mkdtemp` = EXIT 2 (reprodukcja Evaluatora `--tmp-dir` nieistniejący:
  oba harnessy EXIT 2, mutator „KONTROLA NIEZALICZONA”, EXIT 2, 0 mutacji uruchomionych). Wynik r2 (wejścia sha256
  `06266578e3b8b791…`): 67/67 WYKRYTA; po drodze 2 × BŁĄD infra (`page.goto` — przeglądarka zamknięta / timeout 30 s przy
  load ≈ 10) i 1 × TIMEOUT jsdom (TB37) — każda ponowiona pojedynczo na tych samych wejściach → WYKRYTA (TB37: jsdom
  `koszyk#17(treaty,5,pelny):klik#64`; TB47: `koszyk#38(trade,14,pelny):klik#10`). AU1/AU2 wykrywane teraz w Chromium.

Nakładka starszych harnessów: `repin-ui2-manifest.json` + klucz `overlayPd` (4 pliki PD z sha256 webu: `diploListHud`,
`diplomacyPanel`, `diplomacyNegotiationModal`, `diplomacyAudience`), `repin-ui2-overlay.mjs` podmienia je w odniesieniu
(r2, zarzut Z4: zmiana czysto addytywna — istniejąca końcowa linia logu bez zmian, licznik PD w nowej linii).
Regresja na nakładce: L0 3861/0, L1A 3618/0, L2 1784/0 (jsdomErrors 354 / consoleErrors 150 = jak przed), C4 1649/0 (75),
hud 927/0, newgame 1194/0, cityux 164/0, UI-2-A 2292/0, `run-cycles` moduły spoza E (hexContextTooltip, sidePanelHud,
sidePanelEventFilter, preBattle) i `diplomacyNegotiationModal` 0. ZAŁOŻENIE E-Z3: `run-cycles` dla `diplomacyTradeBasket.ts`
(i 31 przypadków `diplomacyAudience.ts` otwierających koszyk — przykłady: CSS `.cdb-duration-indefinite`) porównuje z pinem,
którego `diplomacyTradeBasket.ts` wymaga `game/diplomacy-value-catalog` z main (nie da się podmienić w nakładce bez kaskady
`game/*`) — odniesieniem dla tych modułów jest `run-repin-ui2e-cycles.mjs` (web main, 0 różnic).

GPU / natywne okno Tauri: NIE_ZMIERZONO. Wycena (ZAŁOŻENIE Z3): UI-2-E 25,5 h / 428 LP wyceniane na 4 rundy — zużyta 1 runda
(łącznie z jednorazową infrastrukturą harnessu dyplomacji); pozostało po A+E: 126,25 − 25,5 = **100,75 h** (B, C, D, F, G).
Rekalibracja: klasa PD z czystym `diff3` (bez konfliktów w 3/5 plików) kosztuje istotnie mniej niż `L/50` — do weryfikacji na UI-2-C/F.

## 11. REPIN UI-3 — web `86d510c66 → 9b019a7d8` (FALA 509–532), `R-RUSTPORT-REPIN-WEB-UI-3-Q1`

Baza `rust-port/parity-v2` `b520768b0`; web `origin/main` = `9b019a7d89090c7491a4c2ad75278a7a60d42a90` (2026-11-07).
Pomiar: `git diff --numstat 86d510c66 9b019a7d8 -- gra/src/ui` = 24 pliki, +1389/−408, 66 commitów dotykających `gra/src/ui`.
H = `git diff -U0 … | grep -c '^@@'`; v2 = stan pliku na bazie (`BYTE86` = bajtowo równy web `86d510c66`, `MOD` = port, `—` = brak).

### 11.1 Pomiar i klasyfikacja (24 pliki)

| Plik | +/− | H | v2 | Klasa | Status |
|---|---|---|---|---|---|
| `armyMergePanel` | +9/−3 | 7 | BYTE86 | KB | **UI-3-A r1** |
| `armyMergePickPanel` | +7/−4 | 5 | BYTE86 | KB | **UI-3-A r1** |
| `armySplitPanel` | +10/−4 | 5 | BYTE86 | KB | **UI-3-A r1** |
| `armyStackLabel` (NOWY) | +35/−0 | 1 | — | AD (import `game/stack-leader`) | **UI-3-A r1** |
| `gamePauseMenu` | +20/−0 | 4 | BYTE86 | KB | **UI-3-A r1** |
| `hudChip6c` | +43/−2 | 6 | BYTE86 | KB | **UI-3-A r1** |
| `sidePanelEventTabs` (NOWY) | +98/−0 | 1 | — | KB | **UI-3-A r1** |
| `sidePanelEventFilter` | +41/−15 | 6 | BYTE86 | KB | **UI-3-A r1** |
| `sidePanelHud` | +84/−31 | 15 | BYTE86 | KB | **UI-3-A r1** |
| `empireRecruitPanel` (NOWY) | +192/−0 | 1 | — | KB (0 importów) | **UI-3-A r1** |
| `worldOverlayLayer` (NOWY) | +8/−0 | 1 | — | KB (0 importów) | **UI-3-A r1** |
| `icons/brand/building-icon-map.json` + `bld-emporion.svg` (NOWY) | +1 / +1 | 1 / 1 | PIN / — | KB | **UI-3-A r1** |
| `armyStackHud` | +5/−1 | 3 | MOD | PD | UI-3-B (r2) |
| `siegeMapPanel` | +14/−2 | 3 | MOD | PD + DTO | UI-3-B (r2) |
| `unitRecruitCard` | +15/−4 | 5 | MOD | PD | UI-3-B (r2) |
| `newGameFlow` | +7/−0 | 4 | MOD | PD | UI-3-B (r2) |
| `empireDetailTypes` | +4/−4 | 3 | MOD | AD | UI-3-B (r2) |
| `empireDetailPanel` | +72/−25 | 23 | MOD | PD | UI-3-C (r3) |
| `hexContextTooltip` | +85/−75 | 20 | MOD | PD (używa `armyStackLabel`) | UI-3-C (r3) |
| `buildModeHud` | +23/−88 | 15 | MOD | PD (`game/auto-build-gate`) | UI-3-C (r3) |
| `minimapHud` | +114/−36 | 14 | MOD | PD (`updateViewport`, `game/visibility`) | UI-3-D (r3–r4) |
| `hud` | +350/−70 | 50 | MOD | PD (baner 3+3 brutto/netto) | UI-3-D (r4) |
| `cityPanel` | +151/−44 | 52 | bloki K | K | UI-3-E (r4–r5) |

Klasa KB = plik v2 był bajtowo równy webowi `86d510c66`, a wersja `9b019a7d8` importuje wyłącznie moduły UI obecne w v2
(sprawdzone: `formatPl.signedPl`, `escapeOverlayStack`, `icons/*` bez zmian `86d→9b0`). Wycena reszty wg rekalibracji §2c
(`0,5 + 0,05·H + L/200` h + harness): B ≈ 4 h, C ≈ 6 h, D ≈ 8 h, E (K) ≈ 10 h — ZAŁOŻENIE **U3-Z4**, do potwierdzenia w r2.

### 11.2 Mechanika (addytywnie względem UI-2)

- `tools/repin-ui3-manifest.json` (NOWY): `pin` = `9b019a7d8`, `files` (12 kopii bajtowych), `adapters` (1), `overlayDeps`
  (`gra/src/game/stack-leader.ts` — tylko do odniesienia nakładki; pin `edb8fb56` go nie ma).
- `tools/verify-repin-ui3-copies.mjs` (NOWY, w `npm run check`): SHA, DISJ (z `pin-manifest`, wszystkimi sekcjami
  `repin-ui2-manifest`, `repin-ui2-overlay-ports/*`, `repin-ui2*-ported`), GIT (kopia = `git show 9b019a7d8:…`), ADAPTER
  (plik bez bloków `// pin-adapter 9b019a7d8 <źródło>:A-B` = web bez usuniętego importu; każdy blok = źródło A..B bez `export `), DEPS.
- ZAŁOŻENIE **U3-Z1**: wpisy przeniesione — z `pin-manifest.json` usunięte 5 (`gamePauseMenu`, `armyMergePickPanel`,
  `sidePanelHud`, `sidePanelEventFilter`, `building-icon-map.json`; 431 → 426), z `repin-ui2-manifest.json` `files` usunięte 3
  (`armyMergePanel`, `armySplitPanel`, `hudChip6c`; 7 → 4). Inaczej dwie bramki wymagałyby dwóch różnych treści jednego pliku.
- ZAŁOŻENIE **U3-Z2** (adapter `armyStackLabel`): web importuje `isNonCombatTypeName`/`sortNonCombatLast` z `game/stack-leader`
  (+ `CIVILIAN_TYPE_IDS` z `units/setup`) — czyste funkcje bez stanu, skopiowane bajtowo jako deklaracje lokalne. Gdy kontroler v2
  zacznie przekazywać flagę „niebojowa” w DTO, adapter można zastąpić polem DTO (P6). Pozostała treść = web bajt w bajt.
- `tools/repin-ui2-overlay.mjs`: NOWY argument `--web3-dir` (wymagany, gdy istnieje manifest UI-3) — w odniesieniu pinu wersje
  `9b019a7d8` plików UI-3 (+ `overlayDeps`). ZAŁOŻENIE **U3-Z3**: harnessy UI-2 z `--web-dir` (`run-repin-ui2a…g`) po UI-3
  uruchamiać z katalogiem `WEB86U3` = `repin-ui2-overlay.mjs --pin-dir $WEB86 --web-dir $WEB86 --web3-dir $WEB3` (web 86d + pliki
  UI-3): `run-repin-ui2c` na czystym `$WEB86` daje 2 różnice PIX (scena HUD montuje panel boczny 86d z chipem „Inne cyw.”, port — zakładki).
- `run-cycles.mjs`, `run-repin-ui2e-cycles.mjs`: blok `sidePanelEventFilter` porównuje NOWE API (zakładki), gdy obie strony je mają;
  przy mieszanych rewizjach (r2, Evaluator r1 Z3) — RÓŻNICA `API filtra` liczona do `różnic` (EXIT=1), nie pominięcie.
  `mutate-cycles.mjs` S2 celuje w nowy filtr zakładki (S1, S2 wykryte).

### 11.3 Testy r1 (Chromium 141 headless `/opt/pw-browsers/chromium-1194`, Playwright `/opt/node-tools`)

- `run-repin-ui3a.mjs`: 33 sceny × 2 okna (1280×720, 360×640), 360 kroków (prawdziwe kliknięcia/klawisze, `fill`), wektory
  funkcji (`armyStackLabel`, `chip6cHtml` 192 warianty + `formatGrossNet`, `eventTabOf` na 70+ wpisach, filtry, ikony, z-index);
  24 PNG web = port bajtowo; różnic=0, pageerror+console.error=0, asercji pokrycia 56/56. Fixtura
  `fixtures/repin_ui3a-web-vectors.json`; niezależny weryfikator: drugi, osobny `git archive origin/main` → fixtura bajtowo identyczna.
- `mutate-repin-ui3a.mjs`: 52/52 wykrytych (#30 i #32 przeżyły w pierwszym przebiegu → dodano wektory: licznik `wazne=1`
  i słowo z `armiy`; #27–#37 i #50–#51 zmierzone ponownie po zmianie korpusu). `verify-repin-ui3-copies`: 8/8 sztucznych naruszeń wykrytych.
- Regresja (baza `b520768b0` + nakładka pin+UI-2 vs temat + nakładka pin+UI-2+UI-3): L0 3861/0 = 3861/0, L1A 3618/0 =,
  L2 1784/0 (354/150) =, C4 1649/0 (75) =, hud 899/0 → 909/0 (+10 przypadków: przyciski zakładek panelu), cityux 164/0 =,
  `run-cycles` 1623 różnic = 1623 (te same moduły: `diplomacyTradeBasket` 1592 + `diplomacyAudience` 31 — ZAŁOŻENIE E-Z3; sidePanel* 0),
  UI-2-A 2292/0, UI-2-B 1356/0, UI-2-C 752/0 (WEB86U3), UI-2-D 797/0, UI-2-E 183/0, UI-2-E-cycles 9335/0, UI-2-G 9216/0.
  `run-newgame`/UI-2-F: NIE_ZMIERZONO (`newGameFlow` i jego zależności bez zmian w UI-3-A). Regresję uruchomiono przed
  dodaniem `worldOverlayLayer.ts` (plik nieimportowany przez żaden moduł v2).
- Zmierzone zachowanie weba (identyczne w porcie): klik „Rekrutuj” zaraz po edycji pola liczby nie składa zamówienia (blur →
  `change` → render podmienia przycisk przed `click`). Do zgłoszenia dla weba — poza zakresem portu.
- Hooki nowych paneli (`onAutoBuildToggle`, `toggleEmpireRecruitPanel`, zakładki) gotowe w UI; kontroler v2 ich nie podpina — P6
  (`src/controller/**` poza allowlistą). GPU / natywne okno Tauri: NIE_ZMIERZONO.

### 11.4 Komendy

```bash
git archive 9b019a7d89090c7491a4c2ad75278a7a60d42a90 gra/src gra/data | tar -x -C "$WEB3"
node tools/verify-repin-ui3-copies.mjs [--web-dir "$WEB3"]
node tools/dom-harness/run-repin-ui3a.mjs --web-dir "$WEB3" [--out fixtura.json] [--png-dir "$PNG"]
node tools/dom-harness/mutate-repin-ui3a.mjs --web-dir "$WEB3" --from 0 --to 26   # i 26–52 (< 10 min/wywołanie)
node tools/repin-ui2-overlay.mjs --pin-dir "$PIN" --web-dir "$WEB86" --web3-dir "$WEB3" --out "$PINOV"
node tools/repin-ui2-overlay.mjs --pin-dir "$WEB86" --web-dir "$WEB86" --web3-dir "$WEB3" --out "$WEB86U3"
```

### 11.5 Runda 2 — obrona (Evaluator r1: FAIL, Z1–Z4)

- Z1/Z2 PRZYJĘTE: GOAL = 24 pliki; zrobione 13 (partia A). Status r1 `PASS-WITH-NOTES` był błędny — GOAL niepełny = `FAIL`,
  temat wraca z tym samym ID; partie B–E (11 plików, §11.1) w kolejnych rundach albo — decyzja orkiestratora — osobne ID.
- Z3 PRZYJĘTE: `run-cycles.mjs` — gałąź POMINIĘTE zastąpiona przypadkiem `API filtra (rozbieżne rewizje…)` liczonym do `różnic`.
  Dowód: czysty pin `edb8fb56` (bez nakładki) `--only sidePanelEventFilter.ts` → `różnic=1`, EXIT=1 (pin: `filterSidePanelEvents`,
  v2: `filterSidePanelEventsByTab,…`); nakładka `--web3-dir` → 44/0, EXIT=0. `run-repin-ui2e-cycles.mjs`: moduł nie jest tam
  pakowany (domyślne `--only` = 3 moduły dyplomacji), blok był martwy, a `--only sidePanelEventFilter.ts` dawał `modułów=0`, EXIT=0;
  teraz blok wchodzi do raportu → EXIT=1 (jawnie: moduł poza zakresem tego harnessu). Domyślny przebieg bez zmian (9335/0).
- Z4 PRZYJĘTE: regresja na kodzie końcowym (`src/` = `e2879257f`, w tym `worldOverlayLayer.ts`; narzędzia z poprawką Z3):
  L0 3861/0, L1A 3618/0, L2 1784/0 (354/150), C4 1649/0 (75), hud 909/0, cityux 164/0, newgame 2195/0 (wcześniej NIE_ZMIERZONO;
  `newGameFlow` → `icons/brandAssets` → `building-icon-map.json` zależy od pliku UI-3), `run-cycles` 6442 przypadków / 1623 różnic
  (te same moduły: `diplomacyTradeBasket` 1592 + `diplomacyAudience` 31, E-Z3; sidePanel* 0); UI-2-A 2292/0, B 1356/0, C 752/0,
  D 797/0, E 183/0, E-cycles 9335/0, F 35 scen/0, G 9216/0 (WEB86U3); UI-3-A 33×2 scen, 360 kroków, PIX 0, 56/56; `mutate-cycles
  --only S1,S2` 2/2.

### 11.6 Partia UI-3-D — `minimapHud` + `hud` (`R-RUSTPORT-REPIN-WEB-UI-3-D-Q1`, runda 1)

Baza `rust-port/parity-v2` `dde5e9034`; web `9b019a7d8`. Klasa **PORT-D** (nowa sekcja `ui3d` w `tools/repin-ui3-manifest.json`):
plik portu = web `9b019a7d8` + jawna lista edycji `edits[]` (każda `web` dokładnie raz, w kolejności) bajt w bajt.

| Plik | web 86d→9b0 | v2 przed (vs web 86d) | Edycje portu (vs web 9b0) |
|---|---|---|---|
| `minimapHud.ts` | +114/−36, H=14 | 2 linie (`staticCatalog().constants.fogExploredBrightness` zamiast `game/visibility`) | te same 2 linie |
| `hud.ts` | +350/−70, H=50 | most P5.7 (`registerArmyStackHudSuppression`, 3 linie) | most P5.7 (2 edycje) + adapter `game/frame-memo` (blok `// pin-adapter 9b019a7d8 gra/src/game/frame-memo.ts:37-67`: `StateFrame`, `createStateFrame`) |

- Wszystkie nowe pola `HudState` są opcjonalne (`pracaPrognoza`, `surowceNiedoborLabels`, `surowceBrutto/Netto/Bilans`), `HudConfig.onOpenEmpireRecruit?`
  opcjonalny → `tsc` bez zmian kontrolera. Hooki kontrolera v2 (`updateMinimapViewport` z pętli kamery, nowe pola stanu, „Rekrutacja”) — P6, poza zakresem.
- `tools/verify-repin-ui3-copies.mjs` (addytywnie, blok PORT-D): SHA, DUP, DISJ, źródło weba (sha), web+edycje = port, bloki `pin-adapter`
  = źródło A..B bez `export`, liczba markerów, `ui3d.overlayDeps` (`gra/src/game/frame-memo.ts`). `tools/repin-ui2-overlay.mjs` (addytywnie):
  w odniesieniu wersje weba `9b019a7d8` plików `ui3d.portDom` + `ui3d.overlayDeps`.
- ZAŁOŻENIE **U3D-Z1**: wpis `gra/src/ui/hud.ts` (86d) usunięty z `repin-ui2-overlay-ports/ui2c.json` (DISJ; odniesienie hud = 9b0 z `ui3d`).
  `minimapHud.ts` nie był w żadnym manifeście (porównywany z pinem `edb8fb56`, P5.2) — teraz odniesienie = web 9b0 przez nakładkę.
- ZAŁOŻENIE **U3D-Z2**: adapter `frame-memo` (czysty pomocnik bez stanu gry/DOM) zamiast DTO — jak `armyStackLabel` (U3-Z2).
- ZAŁOŻENIE **U3D-Z3**: mutacje `mutate-repin-ui2c.mjs` H5, H6, H11 celują w kod usunięty przez web (`cn()` Handel/Skarbiec, baner 3+3) —
  nieaktualne (wzorzec 0×); zastępują je H10/H11/H21 `mutate-repin-ui3d.mjs`. Pozostałe wzorce hud/minimapy w starszych mutatorach: 1×.

Testy (Chromium 141 headless, `/opt/pw-browsers/chromium-1194`): `run-repin-ui3d.mjs` 10 scen × 2 okna (1280×720, 360×640), 282 kroki
(prawdziwe kliknięcia chipów, „Rekrutacja”, klik minimapy; `updateViewport`/`updateMinimapViewport`, `markMinimapDirty`, `setMapHudChromeSuppressed`),
DOM `.civ-hud` + minimapy, `toDataURL` canvasu, liczniki `getState()`/`drawImage`, wektory `renderBarD1B`/niedoborów/`sameMinimapViewport`;
18 PNG web = port bajtowo; pageerror+console.error 0; asercje pokrycia 40/40. Fixtura `fixtures/repin_ui3d-web-vectors.json`
(sha256 `3ae0e991…`) bajtowo identyczna z dwóch osobnych `git archive`. `mutate-repin-ui3d.mjs` 32/32; sztuczne naruszenia bramki 8/8.
Niedeterminizm zrzutu (hover po kliknięciach poprzedniej sceny) usunięty: kursor na środek okna przed sceną.

```bash
node tools/dom-harness/run-repin-ui3d.mjs --web-dir "$WEB3" [--out fixtura.json] [--png-dir "$PNG"]
node tools/dom-harness/mutate-repin-ui3d.mjs --web-dir "$WEB3" --from 0 --to 11   # i 11–22, 22–32 (< 10 min/wywołanie)
```

#### 11.6.1 Runda 1 — obrona (Evaluator r1: PASS-WITH-NOTES, Z1–Z3)

- Z1 PRZYJĘTE: `mutate-repin-ui2c.mjs` dostał tryby `wycofana` (H5, H6, H11 — wzorzec MUSI wystąpić 0×; gdy kod wróci → EXIT 2)
  i `przeniesiona` (H4, H12 — wzorzec 1×, ale zmierzone: na kodzie 9b0 harness ui2c ich nie rozróżnia, EXIT=0/różnic=0).
  H4/H12 przeniesione do `mutate-repin-ui3d.mjs` jako H23/H24; H23 wymagała nowego wektora `SHORT_CASES`
  (`zywnoscLabel` nienumeryczne + `zywnoscWplywMiast: 1250` → nota „Dokładnie:” rozróżnia `undefined` od 0) → fixtura ui3d
  ma nowy sha256 (PNG bez zmian). `--dry-run`: kontrola samych wzorców (aktywne 1×, wycofane 0×) bez przeglądarki.
- Z2 PRZYJĘTE: `tools/selftest-verify-repin-ui3d.mjs --web-dir "$WEB3"` — przypadek KONTROLNY (EXIT 0) + 10 sztucznych naruszeń
  (N1 blok adaptera, N2 bajt poza adapterem, N3 rewizja markera, N4 liczba markerów, N5 edycja 0× w webie, N6 webSha256,
  N7 DISJ `ui2c.json`, N8 DUP, N9 DEPS(ui3d), N10 SHA/rozmiar); każde wymaga EXIT 1 i komunikatu właściwej reguły.
  Repo nie jest modyfikowane (osobne kopie w `--tmp-dir`).
- Z3 (informacyjny): konflikty z `parity-v2` zostają orkiestratorowi (dispatch); stan zmierzony w raporcie obrony.

```bash
node tools/selftest-verify-repin-ui3d.mjs --web-dir "$WEB3" [--tmp-dir <dir>]
node tools/dom-harness/mutate-repin-ui2c.mjs --web-dir "$WEB86U3" --dry-run        # wzorce, bez przeglądarki
node tools/dom-harness/mutate-repin-ui2c.mjs --web-dir "$WEB86U3" --from 1 --to 22  # i 23–31, 32–40, 41–45
node tools/dom-harness/mutate-repin-ui3d.mjs --web-dir "$WEB3" --from 32 --to 34    # H23/H24
```
