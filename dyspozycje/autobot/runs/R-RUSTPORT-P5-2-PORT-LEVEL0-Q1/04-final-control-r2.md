STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-2-PORT-LEVEL0-Q1
GOAL: Final Control rundy 2. Orzeczenie w sprawie zarzutów 1–3 Evaluatora r1 (`5b67dbb0`) wobec Obrony r2 (`27fbab38`) i samodzielne odtworzenie bramek.
ZMIANY/COMMIT: ten plik, commit na `27fbab38`. Kod bez zmian.

## Orzeczenia

| # | Zarzut | Orzeczenie | Dowód |
|---|---|---|---|
| 1 | Brak powiązania z P5-0 §6 i nieoznaczone rozszerzenia | **ODDAL (usunięty)** | `P5-2-PORT-LEVEL0.md`: kolumna sekcji P5-0 w §3 i §4.1, rejestr §3a (wiersze 100–117), ZAŁOŻENIA Z9–Z17 w §8. Każde pole z listy Evaluatora ma wiersz ROZSZ. i swoje Z. |
| 2 | Dyplomacja odbiega od §6.6 | **ODDAL (usunięty)** | `TreatyBalancePreviewDto` nie występuje już w `src/` ani w `tools/`. Traktat = `DiplomacyBasketPreviewDto` z `treatyPw` i `treatyGate` (`types.ts:494-536`). `PnBalancePanelDto` jest osobnym zapytaniem stołu negocjacji (Z10). Wymóg „`canAccept` liczy ta sama funkcja Rust co bramka” jest w `types.ts:475` i w Z10. |
| 3a | `mapLoadingOverlay` nie czyta `MapGenProgressEvent.total` | **ODDAL** | v2 `:230` `phaseTotal ?? staticCatalog().constants.mapGenPhaseTotal`, pin `:232` `phaseTotal ?? MAP_LOADING_PHASE_TOTAL`. Źródłem głównym jest parametr. Stała katalogu to tylko wartość zapasowa (Z11, Z16). |
| 3b | `victoryScreen` czyta stałą zamiast `VictoryDto` | **ODDAL** | P5-0 linia 206 (§6.1) wymienia `prog_dominacji_power` w `constants`. Linia 207 podaje `victoryScreen.ts` jako konsumenta. Pin czyta stałą modułu (`game/victory.ts:35`, `victoryScreen.ts:48`). Wybór źródła i warunek „jeden parametr w Rust” opisuje Z17. |
| 3c | Brak ZAŁOŻEŃ i nieaktualne wiersze 13 i 15 w PORTING-QUEUE | **ODDAL (usunięty)** | Z16 i Z17 są w §8, wiersze 13 i 15 zaktualizowane w `27fbab38`. |

Liczba NAPRAW: 0. Żadna pozycja nie wymaga decyzji człowieka.

## Bramki odtworzone samodzielnie (czysty katalog z `git archive 27fbab38`, poza repo)

- `npm ci`, `tsc --noEmit`, `npm run check` i `vite build` dały EXIT=0.
  - `npm run check`: self-test 33 pozytywnych i 15 negatywnych przypadków, 0 błędów.
  - 0 trafień na 64 plikach.
  - `verify-pin-copies`: 0 niezgodnych na 401.
- **Niezależny sha256 kopii vs pin** (`git archive edb8fb56 gra`, bez korzystania z manifestu): 401 z 401 plików ma identyczny sha256. Manifest zgadza się z plikami w 401 z 401.
- **Harness DOM** (`--pin-dir` = rozpakowany pin): 3861 przypadków, 0 różnic, EXIT=0. Dla `diplomacyAcceptanceBalance.ts`: 1245 przypadków, 0 różnic.
- **Mutacje Operatora:** 14/14 wykrytych, pliki przywrócone.
- **Mutacje Final Control** na zmienionym rendererze traktatu, obie wykryte; plik po teście identyczny z commitem (`cmp`):
  - FC1: `partnerPw = treatyPw.my`. 280 różnic, EXIT=1.
  - FC2: odwrócone `treatyGate.relOk`. 416 różnic, EXIT=1.
- `git diff --check b338830e 27fbab38`: EXIT=0.
- **Allowlista:** wszystkie zmiany od `b338830e` mieszczą się w `src-tauri/frontend-v2/**`, `P5-2-PORT-LEVEL0.md` i `runs/<ID>/**`. Plik `tauri.conf.json` nietknięty.
- `node_modules` i `dist` usunięte po bramkach.

## Integracja

- `origin/rust-port/parity-v2` = `e810d0d3`. `b338830e` jest jego przodkiem.
- Zmiany `b338830e..e810d0d3` nie dotykają `frontend-v2` ani `p5`.
- Sonda `git merge-tree --write-tree origin/rust-port/parity-v2 27fbab38` daje drzewo `01b13f5c` bez konfliktów.
- Kolejność integracji: `33e3c85a` → `5b67dbb0` → `27fbab38` → ten commit FC, scalone na `e810d0d3`.

## Uwagi bez wpływu na werdykt (dług dla kolejnych tematów)

- Ze strony Evaluatora: wielokrotne `list()` w `saveLoadDialog`, nieaktualny nagłówek w `unitMiniPreview.ts:2` i zmiana zachowania kategorii `'domyslny'` (Z2).
- NIE_ZMIERZONO: miniatura WebGL, piksele minimapy, zapisy FSA, okno Tauri, komendy Rust (na razie tylko atrapa MOCK).

TESTY: wyniki powyżej.
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora na `origin/rust-port/parity-v2`, potem READY_FOR_DEPLOY (wystawia orkiestrator).
DEPLOY/PUSH: NIE WYKONANO
