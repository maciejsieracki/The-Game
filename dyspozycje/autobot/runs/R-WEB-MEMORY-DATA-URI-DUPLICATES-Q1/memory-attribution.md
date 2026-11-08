# R-WEB-MEMORY-DATA-URI-DUPLICATES-Q1 — pomiar (runda 1)

## Metoda
- Baza `ca289d8ce` (origin/main, FALA 526). PRZED = baza, PO = baza + wtyczka `civ-binary-assets-out-of-js` (`gra/vite.config.ts`).
- Kopie `gra/` poza repo (`/tmp/civ-mem3-copy-{pre,post}`), `memory-growth-rootcause-q1-measure.cjs --prepare` bez zmian,
  build produkcyjny (minifikacja) `vite build --outDir /tmp/civ-mem3-dist-*`. Seed 4242, Standardowy/kontynenty, mgła OFF,
  gracz tylko kończy turę, `performance.memory.usedJSHeapSize` po `gc()` (MB = 10^6 B, jak w FALA 526), migawki t.1
  streszczone (`memory-growth-heapsnap-summary.cjs`) i usunięte. Oba przebiegi równolegle (load 10–13).
- Menu (bez gry): `memory-datauri-duplicates-test.cjs` — heap po GC, migawka (stringi > 1 MB), PSS procesów (/proc).

## Zasoby osadzane (build PRZED: 62 685 124 znaków data URI w bundlu JS)
| rodzaj | plików (unikalnych) | bajty źródłowe | base64 w HTML |
|---|---|---|---|
| mp3 `src/audio/utwory/**` (bez `_wykluczone/`) | 59 | ≈ 42,3 MB | 56 469 265 |
| png `src/ui/assets/hero/` (menu, intro) | 2 | 4 214 674 | 5 619 612 |
| jpg `src/assets/portrety/` | 45 | ≈ 0,45 MB | 595 707 |
| svg (`?raw`, tekst) | bez zmian (małe, tekst w JS) | | |

## Gdzie było 62 MB (migawka t.1 PRZED → PO, MB)
| klasa | PRZED | PO | Δ | co to |
|---|---|---|---|---|
| `ExternalStringData` (źródło skryptu) | 77,1 | 8,6 | **−68,5** | bundel 70,6 mln znaków → 7,96 mln (base64 poza JS) |
| `(string)` | 65,6 | 8,6 | **−57,0** | literały `data:…;base64` (61 stringów > 100 KB = 59,2 MB w menu) |
| `JSArrayBufferData` | 15,6 | 15,6 | 0 | bez zmian (bajty zasobów nie siedzą w buforach JS) |
| suma migawki | 213,9 | 88,4 | **−125,5** | |
Czyli base64 był trzymany DWA razy w stercie (źródło + literał), łącznie ≈ 125 MB, nie 62.
Nie było kopii w HTMLAudioElement/HTMLImageElement/ImageBitmap/CanvasTexture po stronie JS (bufory bez zmian).

## Wynik — heap po GC w grze (MB)
| tura | PRZED | PO | Δ | jedn./miasta PRZED → PO |
|---|---|---|---|---|
| 1 | 213,7 | 88,3 | **−125,5** | 48/42 → 48/42 |
| 10 | 224,5 | 98,5 | −126,0 | 66/42 → 65/42 |
| 30 | 251,8 | 113,6 | −138,2 | 95/48 → 89/52 |
| 50 | 302,4 | 178,6 | **−123,8** | 376/75 → 368/77 |
Δ stała ≈ −125 MB przez całą grę (CDP `backingStorageSize` 92,9 → 24,2 MB w t.1). Trajektoria rozjeżdża się od ~t.5
(liczby jednostek ±5) — w FALA 526 była identyczna do t.35; powtarzalności PRZED-vs-PRZED pod obciążeniem NIE_ZMIERZONO
(oba przebiegi równolegle, ustawianie tur czasowe). Logika gry bez zmian: hashe `war-allin-capital-quick` = FALA 526.

## Menu główne (test bramki, po GC)
| miara | PRZED | PO | Δ |
|---|---|---|---|
| heap JS po GC | 145,4 MiB | 25,9 MiB | −119,5 |
| stringi base64 > 1 MB / > 100 KB | 2 (5,4 MiB) / 61 (59,2 MiB) | 0 / 0 | |
| PSS renderer | 302,8 MiB | 182,2 MiB | −120,6 |
| PSS proces przeglądarki | 96,2 MiB | 142,1 MiB | +45,9 (Bloby: bajty zasobów raz, binarnie) |
| PSS wszystkie procesy | 566,1 MiB | 493,7 MiB | **−72,4** |
| czas do menu (1 próbka, pod obciążeniem) | 6,7 s | 5,1 s | informacyjnie |
PSS jest informacyjny (jeden pomiar, obciążony kontener); bajty zasobów żyją teraz raz jako Blob w magazynie blobów.

## Rozmiar pliku
`index.html` 70 642 686 → 70 656 215 B (**+13 529 B, +0,019%**; opakowania `<script type="application/octet-stream" …>`).

## Kandydaci
| kandydat | wynik |
|---|---|
| base64 poza JS (elementy danych w HTML) → jedno dekodowanie do Blob, usunięcie elementu, blob: URL wspólny dla wszystkich odtworzeń | WDROŻONE, −125 MB stale |
| leniwe dekodowanie (dopiero przy pierwszym użyciu utworu) | NIE ROBIONE: wymaga zmiany API playlist (URL potrzebny synchronicznie przy ewaluacji modułu); niezdekodowany base64 w DOM kosztowałby 1,33× bajtów zamiast 1× w Blob — dekodowanie od razu jest tańsze pamięciowo |
| `decodeAudioData` do AudioBuffer | ODRZUCONE: PCM to ~10× więcej niż mp3; odtwarzanie zostaje na HTMLAudioElement (strumień) |
