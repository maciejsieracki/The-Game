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
| 26 | `cityPanel.ts` | +341/−100 | +86/−31 | — (bloki K01–K09 w `src/ui/cityPanel/*.ts`) | `:82 :108+2 :164 :234 :245 :268 :283 :551+10 :567+2 :597+2 :630+24 :775 :834 :929+3 …` | kolejka rekrutacji w panelu (↑↓✕, `ff6ac152c`), kolejność rekrutacji wg epoki (`6f61f1d70`), skracanie liczb (`62884e25f`) | K (bloki kopii z markerami) | `src/ui/cityPanel/k0*.ts` | §3 + UI-2-G |

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
| 26 | `cityPanel` (bloki K) | K | 441 | 89 | 277 | 20 | G |
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
| UI-2-C | #10 `hud`, #11 `empireDetailPanel`, #12 `empireDetailTypes`, #13 `armyStackHud`, #14 `unitRecruitCard` | harness HUD na DTO z wartościami ≥1000: tekst `20,9k`, `title` „Dokładnie: …” = web | 30,5 h / 574 LP / 4 rundy (#10 5,75 · #11 11,5 · #12 0,75 · #13 4,5 · #14 8) — zalecany podział na 2 tematy: C1 = #10+#12+#13 (11 h), C2 = #11+#14 (19,5 h) |
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
