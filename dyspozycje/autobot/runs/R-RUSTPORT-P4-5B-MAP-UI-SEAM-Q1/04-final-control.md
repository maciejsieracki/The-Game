STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1
GOAL: Final Control dokumentu P4-5B (kontrakt granicy mapa(Rust) <-> UI(webview)) po FAIL Evaluatora r1 (`10dfd528`, 12 zarzutów) i Obronie Operatora r2 (`0d3ca962`). Orzeczenie na podstawie samodzielnie powtórzonych dowodów, nie deklaracji.
ZMIANY/COMMIT: ten plik (A) w worktree `wf_1b7cdb13-1cb-4`; łańcuch: `85fbdcce` <- `0ae5dfd5` (Operator r1) <- `0d3ca962` (Obrona r2) <- cherry-pick `10dfd528` (Evaluator r1, rodzic `0ae5dfd5`, tylko `02-evaluator-r1.md`) <- commit FC. Bez push.
RUNDY: 2/5 (Final Control po r2)
DEPLOY/PUSH: NIE WYKONANO

## Bramki (powtórzone samodzielnie)

| Bramka | Wynik |
|---|---|
| Commit Obrony istnieje | `git cat-file -t 0d3ca962` -> commit; rodzic `0ae5dfd5`, ten `85fbdcce` |
| Zakres allowlisty | `git diff --name-status 85fbdcce 0d3ca962` -> 9 plików A: `P4-5B-MAP-UI-SEAM.md` + `runs/R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1/**` (01, 03, logi-r2/01..06). Zero `gra/**`, `src-tauri/**`, `rust-port/**` |
| `git diff --check 85fbdcce 0d3ca962` | pusty wynik, czysto |
| Kompletność | 12/12 zarzutów ma odpowiedź w dokumencie (§1a, §3.1-§3.4, §4.1-§4.2, §5.3, §7, §8, §9, §10, §12, §13, §15, §16) i w `03-operator-r2-obrona.md` |
| Kolizja z gałęzią docelową | `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` = `88df6493` (dziecko `85fbdcce`), zmienia tylko `GOAL-RUST-PORT-20261020.md` i `LEDGER.md` -> brak wspólnych ścieżek |

## Orzeczenia per zarzut

| # | Zarzut | Dowód FC | Orzeczenie |
|---|---|---|---|
| 1 | brak surowych logów z EXIT | `logi-r2/01..06-*.txt` w `0d3ca962`; `01-projekcja.txt` kończy się `EXIT=0`, `02-viewoffset.txt` `EXIT=1 (brak trafień)` | ODDAL (zamknięty w r2) |
| 2 | brak macierzy R1-R16 | §1a: 16 wierszy, R1/R2/R11 wyłączone z uzasadnieniem, R10 częściowo z adresami | ODDAL |
| 3 | §7: 14 zamiast 17 | `git grep -n -E "\.project\(\|worldToClientPx\(\|worldToScreen\(\|hexCenterClientPx\(" edb8fb56 -- gra/src` -> **16** linii (battleScene 4, manualBattle 3, picker 2, main 7). Dokument r2 podaje 16 — poprawnie; liczba Evaluatora (17) też była błędna | ODDAL |
| 4 | §8 podział | `main.ts:2592-2648` @ `edb8fb56`: 22 pola, policzone ręcznie; klasyfikacja 13/3/1/5 zgodna z listą; `getCityGrowth` `:2647`, `getLevel` `:2600`, `isVisible` `:2617-2620` (panel + `cityFogVisible`) | ODDAL |
| 5 | PPM | `main.ts:26338-26343`: `mouseup` button 2 bez filtrów; `:26209-26221` `contextmenu` z filtrami `:26211-26212`. Kontrakt rozdziela `MapRightUp`/`MapContextMenu` (§3.2, §5.3), kolejność Z15 + NIE_ZMIERZONO pkt 13 | ODDAL |
| 6 | `PointerLeave` scala dwa zdarzenia | `camera.ts:213,233` (document `mouseleave`), `main.ts:26328-26335`, `:13085-13089` (canvas). `camera.rs:340-342` @ `69f432ba` `mouse_leave` zeruje `mouse_client`. Kontrakt: `WindowLeave` -> `mouse_leave`, `CanvasLeave` wewnętrzne bez kamery (Z13) | ODDAL |
| 7 | typy `MapInput`, `MapPick::Unit{index}` | §3.1 `MapInput{scene, over_ui, ev}`; §5.3 `MapHit::Unit{unit_id, hex}`; `pick/mod.rs:183` `UnitPickModel.id: String`, `:214-219` `index: usize` (indeks wycinka) | ODDAL |
| 8 | Z5 bez dowodu | `cityUxFrame.ts:185-217` @ `edb8fb56`: pasy `:193`, `:210`, półpłaszczyzna `:215`, operatory `<`/`<=` — `CityPanelGeometry` i predykat §4.2 odwzorowują je 1:1; twierdzenie r1 wycofane | ODDAL |
| 9 | NIE_ZMIERZONO pkt 9 / dźwięk | `minimap.ts:9` `import { worldToAxial, HEX_R } from '../render/hexutil'`; `minimap.ts:241`; `main.ts:14450-14456` `computeWaterView` -> `computeViewport` | ODDAL |
| 10 | testy nieprzypisane | §12 T1-T14 z tematami RR-T1/T8/T11/T12/T13, P5-0, P7; pokrywa scale_factor (T6), seq (T7), forwarding/pass_through (T8), leave/hover (T9), `HoverChanged` (T10), D-UI-9 (T11), W/z (T12), Fullscreen (T13) | ODDAL |
| 11 | brak reguły hovera | `git grep` w `main.ts`: `pickVeteranBadgeUnitIdAt(` `:26235`, `pickStatChipCityIdAt(` `:26253`, `pickMapTarget(` `:26271`, `:26369` (klik), def. `:1894` — zgodne z Z14 | ODDAL |
| 12 | `FullscreenChanged` bez źródła | `tauri-2.11.5/src/window/mod.rs:1502` `is_fullscreen`, `:1179` `on_window_event`; `tauri-runtime-2.11.3/src/window.rs:30-64` `WindowEvent` (8 wariantów, koniec `ThemeChanged` `:64`) | ODDAL |

Agregat: 12 x ODDAL, 0 x NAPRAW, 0 x DO DECYZJI CZŁOWIEKA -> **PASS**.

## Uwagi nieblokujące

- Nagłówek dokumentu (linia 9) podaje pin gałęzi dokumentacyjnej `85fbdcce`; po integracji gałąź jest na `88df6493`+. To opis bazy pracy, nie błąd merytoryczny.
- `01-operator-r1.md` zachowuje historyczny zakres `window.rs:30-85`; dokument r2 ma poprawne `:30-64`. Raport historyczny, bez zmiany.
- D-SEAM-1..5 pozostają dla właściciela przez orkiestratora (nie blokują PASS dokumentu projektowego).

## Kolejność integracji (dla orkiestratora)

Na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`88df6493`), jawnie, bez `-A`:
1. `0ae5dfd5` (Operator r1)
2. `10dfd528` (Evaluator r1) — w tym łańcuchu jako cherry-pick po Obronie; kolejność 1 -> 2 -> 3 też bezkonfliktowa (rozłączne pliki)
3. `0d3ca962` (Obrona r2)
4. commit FC (ten plik)

Najprościej: cherry-pick łańcucha `85fbdcce..<SHA FC>` z tego worktree na `88df6493` — ścieżki rozłączne z `88df6493`.

NASTĘPNY KROK: integracja orkiestratora (cherry-pick jak wyżej) -> READY_FOR_DEPLOY (wystawia orkiestrator); D-SEAM-1..5 do ABC przez orkiestratora.
