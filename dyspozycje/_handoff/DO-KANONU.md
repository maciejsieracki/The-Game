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

STATUS: OTWARTY
CZEKAM-NA: integrator (stempel) → playtest Macieja → MASTER uzupełnia wpis → Cursor promuje
