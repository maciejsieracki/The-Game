# DO-KANONU — pakiety promocyjne dla mastera Cursora

Prowadzi: MASTER (Cowork). Cel: Cursor przed KAŻDĄ promocją robocza→kanon czyta
wyłącznie ten plik — wie, CO wchodzi, skąd, i czy Maciej to zaakceptował.
Wpisy dopisywane na końcu po każdym publishu zaakceptowanym playtestem Macieja.
Format wpisu: data · md5/stempel bundla · co weszło (funkcjonalnie) · zmienione
pliki src · status testów · decyzja Macieja.

---

## PAKIET #0 — 2026-07-06 ~04:00 (W PRZYGOTOWANIU — NIE PROMOWAĆ Z TEGO WPISU)

UWAGA: promocja wykonana przez Cursora ~03:55 poszła z bundlem ze stemplem
„CIV-BUILD-STAMP-PENDING" (deploy sprzed korekty). Po poprawce integratora
i playteście Macieja ten wpis zostanie uzupełniony o właściwy md5/stempel —
wtedy POWTÓRZYĆ promocję (nadpisać kanon poprawnym bundlem).

Zawartość funkcjonalna (już w roboczej, czeka na stempel + playtest):
- Rzeki DOMKNIĘTE: każda główna z ujściem do morza (bezUjscia=0), zero sierocych
  delt (pruneOrphanRiverPaths), ciągłe biegi, dopływy domknięte do nurtów,
  zakaz pierścieni; testy małe 20/20 + standard PASS, determinizm zachowany
  (hash 4284176530 / 682095284).
- Wcześniej w tym bundlu (z 22:37): pasek ładowania + generacja w tle (C1/C2),
  plony i tryby auto miasta (B0.9), panel Test wydajności + kalibracja (Batch 7),
  mgła dirty-set (A5), powerPreference (H1), stare fixy mapy (B0.1-B0.6).
- Zmienione pliki src (komplet w gra-robocza\srcKopiaMaster, zlustrowane do gra/src
  przez Cursora ~02:45): map/gen-helpers.ts, map/generator.ts, render/scene.ts,
  render/mapRenderStyle.ts, main.ts, ui/mapLoadingOverlay.ts, ui/perfTestPanel.ts,
  perf/hardwareProfile.ts, buildInfo.ts, map/genWorker.ts, map/mapGenAsync.ts.
- Decyzja Macieja: OCZEKUJE (playtest po poprawce stempla).

STATUS: **ZASTĄPIONY przez PAKIET #1** (2026-07-06 20:17). Nie promować z tego wpisu.

---

## PAKIET #1 — 2026-07-06 20:17 ✅ PROMOWANY

**Decyzja Macieja:** robocza przetestowana, na GitHubie (HEAD bad0c7f), promocja do kanonu.
**Źródło robocza:** stempel wewn. `2026-07-06 18:10 · d744cd7956fb` · plik md5 `7856d3451a0cb3963bd3c50c032f5ad5`
**Kanon po promocji:** stempel `KANON · 7856d345 · 2026-07-06 20:17` · `gra-kanon/Gra-KANON.html`
**Finalna:** `Gra-FINALNA.html` (ten sam md5)

Zawartość funkcjonalna (playtest Macieja 2026-07-06, rejestr bugów pusty):
- Rzeki render wodospad + całość mapy C3/B0.6/B0.9/A5/H1/Batch7
- UX: emoji→SVG (mapa, HUD, panel budowy imp-*), port W4 miasto, siatka rostera 6 kol.
- KONTRAKT #8 ikony jednostek w stosie/panelu
- Obwódki właściciela jednostek, tonięcie wzgórza, zaznaczenie, duże bitwy arena
- Balans walki Macieja (Excel): HP×2, dystans×0.5, Falanga=40, 26 jedn. PL0 uzupełnione
- Countery po polu `Typ` (counterTyp w combat.ts + battleScene.ts)

Sync źródeł (Cursor przed promocją bundle):
- `gra-robocza/srcKopiaMaster` → `gra/src` (61 plików)
- `gra-robocza/data — kopia/units.json` (+ terrain-movement/yields) → `gra/data`

Bramki: tsc=0 · smoke OK · combat 6/6
Skrypt: `gra/tools/publish-kanon-snapshot.ps1`
STATUS: **ZAMKNIĘTY**
CZEKAM-NA: Maciej — opcjonalny test kanonu (`gra-kanon/START.html` Ctrl+F5)
