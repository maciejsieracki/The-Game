STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-2-PORT-LEVEL0-Q1
GOAL: Ocena adwersaryjna rundy 1 Operatora (commit `33e3c85a`): 15 modułów poziomu 0 z pinu `edb8fb56` w `src-tauri/frontend-v2/src/ui/` na DTO + kontroler MOCK + `StaticCatalogDto`, brama 0 importów logiki, harness DOM.
ROLA: Evaluator (Opus 5.5 medium), runda 1/5.

## Co sprawdzono (realnie, nie z raportu)

Odtworzenie w czystym katalogu (`git archive 33e3c85a` → scratch, poza repo; pin `git archive edb8fb56 gra/src gra/data gra/package-lock.json` → scratch):

| Bramka | Wynik Evaluatora |
|---|---|
| `npm ci` | EXIT=0 |
| `npx tsc --noEmit` | EXIT=0 |
| `npm run check` | EXIT=0; self-test 33 poz./15 neg./0 błędów; `plików=64 plików_z_trafieniami=0 trafień=0`; `verify-pin-copies plików=401 niezgodnych=0` |
| `npx vite build` | EXIT=0 (chunk `portLevel0-*.js` 213 kB) |
| harness `run.mjs --pin-dir` | EXIT=0, `modułów=15 przypadków=3861 różnic=0 jsdomErrors=0` |
| `mutate.mjs` | EXIT=0, `mutacji=14 niewykrytych=0` |
| Własne mutacje Evaluatora (poza `mutate.mjs`) | E1 tekst w PINIE `victoryScreen.ts` → 4 różnice; E2 CSS `border-radius` w v2 `saveLoadDialog.ts` → 4; E3 klasa `da-pn-rel-mod-balance` w v2 → 335; E4 `globalAlpha` mgły w PINIE `minimapHud.ts` → 2; po przywróceniu 0. Harness naprawdę ładuje obie strony i porównuje. |
| Kalibracja bramy na 15 plikach pinu | 33 trafienia / 15 plików (`CORE:data 9, game 11, units 3, map 6, render 2, three 1, EXT:buildInfo 1`) — zgodne z raportem |
| Brama — formy | próbka 8 form (`import(\n'…')` wieloliniowy, `export … from`, `import '…'`, `require`, `three/addons`, `import.meta.glob([...])`, `import type` przez `@/`, `gra/data/*.json?raw`) → 8/8 trafień; `vite.config.ts`/`tsconfig.json` bez aliasów do `gra/` |
| Diff modułów vs pin (`diff -u`, policzone samodzielnie) | 15/15 liczby `+/−` identyczne z §2 dokumentu; ręczny przegląd hunków 11 małych modułów + `saveLoadDialog`, `perfReport`, `unitMiniPreview`, `diplomacyAcceptanceBalance`: zmiany wyłącznie w importach i miejscach z kolumny „Zakres zmian”; markup/CSS/teksty bez zmian |
| Zasoby | 364 pliki `src/ui/icons/brand/**` + `src/assets/portrety/**`: SHA-1 blobów = blob pinu pod tą samą ścieżką, 364/364, 0 brakujących |
| Kopia `gra/data` | 0 blobów `edb8fb56:gra/data/**` w drzewie `frontend-v2` (porównanie SHA-1 wszystkich 441 plików) |
| MOCK | `mockCatalog.ts`: wartości z prefiksem/etykietą `MOCK`, `contentHash: 'MOCK-…'`, `source: 'MOCK'`; `main.ts` dokleja `mockTag` |
| Allowlista | `git diff --name-only b338830e 33e3c85a`: poza `src-tauri/frontend-v2/**` i `runs/R-RUSTPORT-P5-2-PORT-LEVEL0-Q1/**` wyłącznie `dyspozycje/rust-port/p5/P5-2-PORT-LEVEL0.md`; brak `node_modules`/`dist`/`gra/`/`tauri.conf.json` |
| Baza | rodzic `33e3c85a` = `b338830e`; `origin/rust-port/parity-v2` jest dziś `f1a1740c` — różnica nie dotyka `src-tauri/frontend-v2/` ani `dyspozycje/rust-port/p5/` (pusty `git diff --name-only`) |

`node_modules`/`dist` w katalogu scratch Evaluatora — usunięte po pracy; repo nietknięte poza tym plikiem.

## ZARZUTY

1. **Brak powiązania „reguła → pole DTO” z katalogiem P5-0 §6; nowe pola kontraktu nie są oznaczone jako rozszerzenia.** Dispatch i brief wymagają, by każda reguła trafiła do pola DTO z P5-0 §6. Tabela §4.1 `P5-2-PORT-LEVEL0.md` nie ma kolumny `P5-0 §6.x`, a znaczna część użytych pól **nie istnieje** w P5-0 §6 (`p50.md` §6.1, §6.6, §6.7, §6.13–§6.17): `StaticCatalogDto.unitCategoryNameOnly`, `constants.mapGenPhaseTotal`, `constants.mapGenPhaseLabels`, `labels.powerHudLabelPl`, `RelationDealDto.tradeFairMult/tradeParity`, `PnBalancePanelDto` (cały), `TreatyBalancePreviewDto` (cały), `ImprovementBuildImpactDto.newLabel`, `SaveSlotsDto.diskSlotPrefix`, `SaveSlotMetaDto` (P5-0: tylko nazwa), `PerfDiagnosticsDto`, komenda `allocate_save_slot`. Mogą być zasadne, ale dokument musi je wprost wskazać jako **rozszerzenie kontraktu P5-0 (propozycja, ZAŁOŻENIE)** z uzasadnieniem, a pola zgodne z P5-0 — z numerem sekcji. Bez tego nie da się sprawdzić, czy reguły nie zostały wymyślone. Naprawa: dodać kolumnę `P5-0 §` (albo „NOWE — rozszerzenie, Z#”) w §4.1 i §3, a nowe pola dopisać jako ZAŁOŻENIA w §8.

2. **Struktura dyplomacji odbiega od P5-0 §6.6, a w dokumencie nie jest to zapisane jako założenie.** P5-0 §6.6 przewiduje jeden `DiplomacyBasketPreviewDto` (zapytanie `diplomacy_preview_basket { mode: trade|gift|treaty, … }` z polem `treaty_pw: {my, their, bilateral, base}`), a w nim `accepted` z tej samej funkcji co bramka. Operator wprowadził dwa równoległe typy najwyższego poziomu — `TreatyBalancePreviewDto` (podgląd traktatu, z własnymi polami `accepted/basketFair/relOk`) oraz `PnBalancePanelDto` (wynik stołu negocjacji, „proponowane `diplomacy_table_balance`”) — i nigdzie w §8 nie zapisał tej decyzji. Naprawa: ZAŁOŻENIE w §8, które mówi, czy `TreatyBalancePreviewDto` to wariant `DiplomacyBasketPreviewDto` dla `mode=treaty`, czy osobne zapytanie, i które pola P5-0 (`treaty_pw.*`) zastępuje. Wymóg „ta sama funkcja Rust co bramka” trzeba powtórzyć także dla `PnBalancePanelDto.canAccept`.

3. **Wybór źródła odbiega od P5-0 i od wiersza w `PORTING-QUEUE.md`, a w §8 nie ma uzasadnienia.** Dotyczy dwóch modułów:
   - `mapLoadingOverlay.ts`: P5-0 §6.16 i `PORTING-QUEUE.md` (wiersz 13) wskazują `MapGenProgressEvent.total`. Implementacja dodaje do katalogu nowe pole `StaticCatalogDto.constants.mapGenPhaseTotal` (dokument §4.1 wspomina zdarzenie tylko w nawiasie).
   - `victoryScreen.ts`: P5-0 §6.13 i wiersz 15 wskazują `VictoryDto` (= `VictoryResult` + `prog_dominacji_pct`). Implementacja czyta `constants.progDominacjiPower` z §6.1, a `VictoryResultDto` nie zawiera `prog_dominacji_pct`.

   Naprawa: w obu przypadkach albo dostosować kod do P5-0, albo zapisać odstępstwo jako ZAŁOŻENIE i poprawić kolumnę „Zastąpienie” w `PORTING-QUEUE.md` dla wierszy 13 i 15.

## Uwagi (bez wpływu na werdykt)

- U1 `saveLoadDialog.ts` `renderListOnce`: jednym przebiegiem wywołuje `saves().list()` dwa razy (bezpośrednio i przez `summarizeSaveSlots`), a do tego `summarizeFsaSaveSlots` robi to samo — przy prawdziwym IPC to 2–3 rundy na jedno odświeżenie. Tylko wydajność, poprawność bez zmian.
- U2 `unitMiniPreview.ts:2` zachowuje nagłówek pinu „statyczny render z shared WebGL”, który w v2 jest już nieprawdziwy. Prostuje to akapit P5.2 tuż pod nim, więc to kosmetyka.
- U3 ZAŁOŻENIE Z2: nazwa jednostki spoza katalogu dostaje `'domyslny'`, a web klasyfikował po słowach kluczowych. To świadoma zmiana zachowania, zapisana w dokumencie. Do potwierdzenia przy porcie `techDiscoveryNotice.ts` i `cityPanel.ts:6403`.
- U4 W §4.2 (GRANICZNY) przejrzałem `renderPnBalancePanelHtml` i `verdictHtml`. Zawierają tylko porównania znaku i odwzorowanie flag DTO na klasę i tekst, bez arytmetyki PW. Klasyfikację akceptuję.
- U5 `git diff --check 33e3c85a^ 33e3c85a` zgłasza białe znaki tylko w `r1-logi/diffs/*.diff`, które `.gitattributes` w katalogu runu wyłącza z kontroli. Po tym wyłączeniu wynik jest czysty, akceptuję.

ZMIANY/COMMIT: ten plik (`02-evaluator-r1.md`) na `33e3c85a`, bez zmian kodu.
TESTY: jak w tabeli wyżej, wszystkie bramki EXIT=0; harness 3861/0; mutacje 14/14 i 4/4 własne wykryte.
BLOKADY: brak technicznych; zarzuty 1–3 dotyczą dokumentu i kontraktu.
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 odpowiada na zarzuty 1–3 (dokument §3/§4.1/§8 + `PORTING-QUEUE.md`, ewentualnie korekta `victoryScreen`/`mapLoadingOverlay`), potem ponownie Evaluator.
DEPLOY/PUSH: NIE WYKONANO
