# Kamera po wczytaniu zapisu (R-WEB-LOAD-CAMERA-Q1, LOADCAM) — 2026-11-28

## Stan wiążący

- **Przyczyna (ustalona kodem):** po wczytaniu zapisu wymagającego przebudowy mapy kamera startuje z dystansem
  ok. 316 zamiast 22. Mechanizm: `buildScene` ustawia kamerę sceny na `center + camDist`
  (`gra/src/render/scene.ts`, ok. l. 3107–3108), a `regenerateWorldForLoad` tworzy
  `new CameraController(camera, canvas, center, ...)` (`gra/src/main.ts`, ok. l. 51116). Konstruktor
  (`gra/src/render/camera.ts`, ok. l. 122) liczy `dist = offset.length()` z pozycji kamery sceny do celu,
  więc dystans to odległość od nowej kamery do środka mapy — na dużej mapie ok. 316. Zapis nie zawiera kamery,
  a `restoreGameFromSave` nie dotyka kamery.
- **Pomiar przed poprawką (dane z SAVEMAT r4, commit `ad1c64734`, plik
  `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/r4-B-cam-probe.json`):** `cameraBeforeLoad`
  dist 22, `cameraAfterLoad` dist 316.06, `mapDiffers: true`, cfg max, seed 4242, zapis t10, wczytanie hakiem `pause`.
- **Poprawka:** w `loadGameFromSlot` (`gra/src/main.ts`) flaga `regeneratedMapForLoad` ustawiana z wyniku
  `regenerateWorldForLoad`; po `restoreGameFromSave` i walidacji, tylko gdy mapa była przebudowana, kamera
  ustawiana `camCtrl.focusAt(x, z, 22)` na stolicy gracza (`capitalCityIdForOwner(ME())`, ta sama zasada
  stolicy co w bramkach gry; fallback na najstarsze miasto gracza), czyli tak jak po założeniu stolicy w nowej grze.
  Gdy gracz nie ma miasta, `focusAt` nie jest wywoływany (kamera zostaje na domyślnym widoku sceny).
  Zapis nie dostał żadnego nowego pola — format zapisu bez zmian. Stary zapis wczytuje się identycznie
  (ta sama ścieżka kodu, bez nowych pól). Ścieżka bez przebudowy mapy nie zmieniła się.
- **Ograniczenie:** poprawka ustawia widok na stolicę gracza, nie na widok sprzed zapisu (zapis nie
  przechowuje kamery; wariant zastępczy z dispatchu). Gdy gracz nie ma miasta, kamera zostaje na domyślnym widoku sceny (bez zmian).
- **Dlaczego nie `playerStartHexFor`:** mapa `playerStartHexByOwner` nie jest odtwarzana z zapisu
  (ustawiana tylko przy nowej grze, `main.ts` ok. l. 11812 i 35121), więc po wczytaniu może być nieaktualna.

## Pomiary

| Test | Wynik |
|---|---|
| `gra/tools/load-camera-test.cjs` (statyczny, mutacje) | PASS: 7 sprawdzeń bazowych (T0–T6) + 7 mutacji (M1–M7 wraz z M5b), wszystkie mutacje czerwone |
| `tsc --noEmit` (runda obrony, npm ci --ignore-scripts) | exit 0 |
| logic-test | 213/213 |
| tech-tree-test | 20 pass / 0 fail |
| research-test | 33 / 0 |
| unit-replace-test | 21/21 |
| combat-test | 6/6 |
| ai-test | 297 passed / 0 failed |
| save-load-ai-cs-absorption-state-test | 27 PASS / 0 FAIL |
| save-load-ai-state-fields-test | 29 PASS / 0 FAIL |
| save-load-ledger-history-test | 4 / 0 |
| save-load-player-owned-city-test | PASS |
| save-load-sort-test | 4/4 |
| save-load-budowa-priorytet-on-load-test | 6 PASS / 0 FAIL |
| save-load-roundtrip-state-drift-test | warstwa statyczna OK; warstwa dynamiczna: NIE ZMIERZONO (patrz niżej) |

## NIE ZMIERZONO

- **Test live (Chromium, kamera po wczytaniu, sonda przed/po, zrzut ekranu):** NIE ZMIERZONO w tej rundzie.
  Powód: harness `save-load-continuity-live.cjs` w bazie `2b019d3e3` nie ma opcji `--probe-camera`
  (jest dopiero w `ad1c64734`), a pełny bieg w segmentach ≤590 s z trzema zapisami/wczytaniami hakiem i klikiem
  nie został wykonany w tej rundzie. Oczekiwany wynik do potwierdzenia: dystans po wczytaniu ok. 22 (±10%).
- **Warstwa dynamiczna `save-load-roundtrip-state-drift-test.cjs`:** NIE ZMIERZONO. W rundzie 1 bieg dał FAIL (2):
  SIGSEGV Chromium w sub-runie `ai-economy-measure-run.cjs` (openGame), bez wyniku; ponowienia do 3 razy nie wykonano.
  W rundzie obrony (2) też NIE uruchamiano tej warstwy (brak wyniku do podania). Wynik zostaje NIE ZMIERZONO.
