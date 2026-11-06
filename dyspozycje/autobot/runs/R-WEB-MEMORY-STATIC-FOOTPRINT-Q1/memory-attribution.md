# R-WEB-MEMORY-STATIC-FOOTPRINT-Q1 — pomiar pamięci (runda 1)

## Metoda
Harness `gra/tools/memory-growth-rootcause-q1-measure.cjs` bez zmian (kopia `gra/` poza repo + `--prepare`), build
**produkcyjny** (minifikacja jak w wydaniu) `vite build --outDir /tmp/civ-mem2-dist-*`, Chromium headless
(`--expose-gc`, swiftshader), seed 4242, Standardowy/kontynenty, mgła OFF, gracz tylko kończy turę. Pomiar co 5 tur
(`performance.memory` po `gc()` + CDP `Runtime.getHeapUsage`), zapis do pliku po każdym pomiarze. Migawki sterty
t.1 i t.100 streszczone (`memory-growth-heapsnap-summary.cjs`) i usunięte.
- PRZED: `ea9c14daf` (FALA 524) — `raw-pre-ea9c14daf-seed4242.jsonl`. Pierwszy przebieg PRZED padł w t.41
  (przeglądarka zamknięta z zewnątrz przy load 6–9, kontener współdzielony) — `raw-pre-run1-crash-t41.jsonl`, powtórzony.
- PO (wdrożone): `ea9c14daf` + bundle ASCII + wspólne geometrie — `raw-post-final-seed4242.jsonl`.
- WARIANT (odrzucony): jak PO + wspólne materiały — `raw-post-variant-materials-seed4242.jsonl`.

## Wynik (MB po GC)
| tura | PRZED | PO wdrożone | Δ | wariant +materiały | Δ | jedn./miasta PRZED → PO |
|---|---|---|---|---|---|---|
| 1 | 285,5 | 214,0 | **−71,5** | 212,2 | −73,3 | 48/42 → 48/42 |
| 30 | 316,4 | 240,1 | −76,3 | 236,5 | −80,0 | 95/45 → 95/45 |
| 40 | 344,4 | 262,5 | −81,9 | 256,6 | −87,7 | 183/62 → 180/62 |
| 50 | 375,1 | 300,0 | −75,1 | 287,3 | −87,8 | 356/73 → 376/73 |
| 100 | 428,9 | 354,0 | **−74,9** | 337,3 | −91,5 | 362/105 → **475**/105 |
| MB/turę t.1→100 | 1,45 | 1,41 | | 1,26 | | |
| MB/turę t.50→100 | 1,08 | 1,08 | | 1,00 | | |

Trajektoria gry identyczna do t.~35 (te same liczby jednostek i miast), potem rozjeżdża się (PO t.100: +113 jednostek,
31% więcej). To samo zjawisko opisała FALA 524; logika gry nie jest zmieniona (hashe `war-allin-capital-quick`
identyczne, ai-test te same 20 FAIL). Powtarzalności PRZED-vs-PRZED na 100 turach NIE_ZMIERZONO.

## Atrybucja (migawka t.100 PRZED → PO wdrożone, MB)
| klasa | PRZED | PO | Δ | źródło |
|---|---|---|---|---|
| `ExternalStringData` (źródło skryptu) | 147,9 | 78,1 | **−69,8** | bundle ASCII: 1 B/znak zamiast UTF-16 |
| `JSArrayBufferData` (bufory) | 66,2 | 58,6 | −7,6 | geometrie miast: 8,12 MB → 0,17 MB atrybutów (probe), mimo +113 jednostek |
| `Float32Array` (obiekty) | 2,7 | 0,8 | −2,0 | j.w. |
| `Object` | 11,8 | 9,4 | −2,3 | obiekty BufferGeometry/BufferAttribute |
| suma migawki | 430,7 | 354,1 | −76,6 | |

Liczniki sceny t.100 (probe): unikalne geometrie miast 9 359 → 191, jednostek 717 → 442 (przy 362 → 475 żetonach),
`renderer.info.memory.geometries` 2 573 → 943 (mniej buforów GPU). t.1 (stan identyczny): ExternalStringData
146,9 → 77,1 MB. W stanie porównywalnym (t.30–t.40, ta sama trajektoria) zysk geometrii to 6–12 MB i rośnie z liczbą miast.

## Kandydaci
| kandydat | wynik | MB |
|---|---|---|
| A bundle ASCII (`vite.config.ts`, wtyczka `ascii-only-js`) | WDROŻONE | −69,8 stale od t.1; HTML +0,47% (70 298 849 → 70 631 678 B) |
| B/C wspólne geometrie jednostek i miast (`render/geometryContentPool.ts`) | WDROŻONE | −5…−12 w t.30–40; w t.100 bufory −7,6 + obiekty ~−4 przy +31% jednostek; piksel w piksel 0 różnic |
| wspólne materiały jednostek i miast (pula po stanie, kopia przy zapisie przy przyciemnieniu) | ODRZUCONE | ok. −10 (7 500 materiałów × 1,3 KB; t.100 −16,6 MB więcej niż PO); **51 px różnicy** na 1,6 mln: three.js sortuje nieprzezroczyste obiekty po `material.id`, więc zmienia się wynik z-fightingu współpłaszczyznowych ścian |
| scalenie statycznych części modeli (mniej Object3D) | NIE ROBIONE | ~29 000 obiektów jednostek; animacje/picking na dzieciach — temat architektoniczny |
| literały base64 (audio/obrazy, 62 MB) trzymane drugi raz jako stringi | NIE ROBIONE | do −62 (stała); poza allowlistą (moduły zasobów) |
| materiał per heks ulepszeń/złóż (4 092 w t.100) | NIE ROBIONE | ~5; mgła przyciemnia `material.color` per heks |
