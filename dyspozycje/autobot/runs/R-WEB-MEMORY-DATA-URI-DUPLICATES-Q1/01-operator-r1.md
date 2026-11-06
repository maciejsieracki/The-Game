STATUS: PASS
DOMAIN: GAME (WEB) — pamięć: dane osadzone (base64) trzymane wielokrotnie
TEMAT: R-WEB-MEMORY-DATA-URI-DUPLICATES-Q1
GOAL: ≥ 40 MB mniej pamięci po GC (t.1) bez zmiany brzmienia/wyglądu, offline jeden plik, reguły i AI bez zmian.
WYNIK GOAL: **−125,5 MB w t.1, −123,8 MB w t.50** (heap po GC, build produkcyjny). Audio = te same bajty (SHA-256),
obrazy piksel w piksel, mapa i menu 0 różnych pikseli, HTML +0,019%.

ZMIANY-COMMIT: `05ae1801e826a0e24f1c2cb53af6db2281d5487c` (kod + testy + dowody), raport: commit tego pliku (SHA w
wiadomości zwrotnej Operatora). Baza `ca289d8ce` (origin/main). PUSH NIE.
- `gra/vite.config.ts` — wtyczka `civ-binary-assets-out-of-js` (tylko `build`, dev bez zmian). Hak `load` dla `*.mp3`,
  `*.png`, `*.jpg|jpeg` (bez zapytania lub `?url`; `?raw`/`?inline` bez zmian) zwraca
  `export default civEmbeddedAssetUrl(<sha256-20>, <mime>)` zamiast literału `data:…;base64`. Base64 trafia do HTML jako
  `<script type="application/octet-stream" id="civ-asset-…">` zaraz po `<head>` (przed bundlem). Pomocnik (moduł wirtualny)
  przy ewaluacji modułu czyta tekst elementu, **usuwa element**, dekoduje base64 raz (`Uint8Array.fromBase64` albo `atob`)
  i zwraca `URL.createObjectURL(new Blob([bajty], {type}))`; cache po kluczu (identyczne pliki = jeden Blob, jeden URL
  współdzielony przez wszystkie odtworzenia i `<img>`). Na stercie JS nie zostaje żaden literał base64.
- Miejsca ładowania zasobów (BEZ zmian w kodzie, obsłużone przez wtyczkę): `src/audio/filePlayer.ts` (9×
  `import.meta.glob` mp3 → `HTMLAudioElement.src`), `src/ui/mainMenu.ts` i `src/ui/newGameFlow.ts` (`hero-*.png?url`),
  `src/ui/leaderPortraits.ts` (`import.meta.glob` portrety jpg). Zasoby źródłowe nietknięte.
- NOWE testy: `gra/tools/memory-datauri-duplicates-test.cjs`, `gra/tools/memory-datauri-menu-pixel-test.cjs`.
- Dowody: `memory-attribution.md` (tabele), `raw-{pre-ca289d8ce,post}-seed4242.jsonl`, `heapsnap-summary-{pre,post}-t1.json`,
  `menu-{pre,post}.json`, `gate-*.txt`.

POMIAR (szczegóły `memory-attribution.md`):
| | PRZED | PO | Δ |
|---|---|---|---|
| heap po GC t.1 | 213,7 MB | 88,3 MB | **−125,5** |
| heap po GC t.50 | 302,4 MB | 178,6 MB | **−123,8** |
| migawka t.1: ExternalStringData (źródło skryptu) | 77,1 | 8,6 | −68,5 |
| migawka t.1: (string) (literały base64) | 65,6 | 8,6 | −57,0 |
| menu: stringi base64 > 1 MB / > 100 KB | 2 / 61 (59,2 MiB) | 0 / 0 | |
| menu: PSS wszystkich procesów (informacyjnie) | 566,1 MiB | 493,7 MiB | −72,4 (renderer −120,6; przeglądarka +45,9 = Bloby) |
| `index.html` | 70 642 686 B | 70 656 215 B | +0,019% |
Atrybucja: 62 MB base64 było w stercie DWA razy (źródło skryptu + literał), stąd −125 MB, nie −62. Bufory
(`JSArrayBufferData` 15,6 MB) bez zmian — zdekodowane kopie audio/obrazów nie siedziały w JS.

TESTY (logi `gate-*.txt`, każdy z `EXIT=`):
- `memory-datauri-duplicates-test` (build PO) **14/14 PASS**: 0 literałów data:audio/png/jpeg w skryptach; 106 elementów
  przed bundlem; bajty każdego elementu i każdego blob: = SHA-256 pliku źródłowego (59 mp3, 2 png, 45 jpg); bundel czysty
  ASCII; 0 elementów w DOM po starcie; 59 audio: `loadedmetadata` + `decodeAudioData` bez błędów (łącznie 1750 s);
  47 obrazów: hash pikseli blob: == data: URI; obraz menu z blob:; 0 błędów konsoli; 0 stringów base64 > 1 MB.
  Kontrpróba na buildzie PRZED: 7 FAIL (`gate-memory-datauri-duplicates-test-PRE-baseline.txt`, wersja testu bez A6).
- `memory-datauri-menu-pixel-test` PRZED vs PO: **3/3**, 0/1 024 000 pikseli różnych (data: vs blob:).
- `memory-growth-visual-parity-test` (mapa `?playtest=mapa`) PRZED vs PO: **4/4**, 0 pikseli różnych.
- `muzyka-era-live-e2e-test` (realny build, zmiana epoki → playlisty plikowe, Audio): **13/0**.
- `*render*`: `capture-render-sync` 23/0, `unit-renderer-overlay-sync` 17/0; `ai-city-render-batch` EXIT=1 — ta sama
  asercja co w FALA 526 (test czyta tekst `main.ts`, którego nie zmieniam) — pre-istniejące.
- tsc `--noEmit` EXIT=0 (tsconfig obejmuje `src`; `vite.config.ts` poza zakresem tsc — sprawdzony transpilacją esbuild +
  `require`, eksporty `escapeNonAsciiForJs`/`CIV_EMBEDDED_ASSETS_RUNTIME` OK).
- logic **213/213**; ai-test **274/20** (md5 linii FAIL = FALA 526); `war-allin-capital-quick` hashe identyczne z FALA 526.
- `git diff --check` czysty.

BLOKADY: brak.
UWAGI / NIE_ZMIERZONO:
- Trajektoria gry PRZED vs PO rozjeżdża się od ~t.5 (±5 jednostek); oba przebiegi szły równolegle pod load 10–13.
  Powtarzalności PRZED-vs-PRZED NIE_ZMIERZONO. Logika nie jest zmieniana (hashe war-allin, ai-test identyczne); Δ pamięci
  stała ≈ −125 MB niezależnie od liczby jednostek.
- PSS i czas do menu (6,7 → 5,1 s) to pojedyncze próbki — informacyjnie.
- Bajty zasobów (≈ 43 MB) żyją teraz raz jako Blob w procesie przeglądarki (Chromium może je zrzucić na dysk). Leniwe
  dekodowanie per utwór nie dałoby zysku: base64 czekający w DOM to 1,33× bajtów.
- t.100 NIE_ZMIERZONO (dispatch wymaga t.1 i t.50).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) — weryfikacja: build poza repo, `memory-datauri-duplicates-test` na PO
i PRZED, menu/mapa piksel, odtworzenie dźwięku w grze, Gra-ROBOCZA z `file://`.
DEPLOY/PUSH: NIE WYKONANO
