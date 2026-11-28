STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-MATRIX-Q1 (obrona Operatora, runda 3/5; Operator SONNET po 2 nieudanych rundach HAIKU)
GOAL: odpowiedzieć na 7 zarzutów Evaluatora (d24774dc8) na kandydacie d14cfce23: PRZYJMUJĘ z poprawką albo ODRZUCAM z dowodem; brak dowodu = PRZYJMUJĘ. Dokończyć pomiary na maksimum (rivals=9, civTypes=14, barbarzyńcy Trudny).
ZMIANY/COMMIT:
- Kod gry: BRAK zmian w tej rundzie (`gra/src` bez zmian; poprawka aiCs* z dfae6298c pozostaje).
- Dokument: `dyspozycje/analizy/ZAPIS-WCZYTANIE-MACIERZ-2026-11-27.md` — sekcja 0 (r2) oznaczona ARCHIWUM, stary „stan wiążący” usunięty i zastąpiony odsyłaczem; nowa sekcja 0B (rewalidacja d14 + odpowiedzi na zarzuty 1–7).
- Dane: `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/r3d-*` (B-json dla max/4242 t3, t10 i bunt/4242 t10; READBACK-d14 z cfgUsed; AA-porównanie 9 tur; logi timeoutów i crasha Chromium).
- Commit: patrz sekcja „sha” w wyniku (tylko powyższe ścieżki, bez `git add -A`).
- SHA bazy: 286d594d3 (WIP) + merge 481e0ebf9; kandydat do obrony: d14cfce23 (kod gry dfae6298c).
TESTY (liczby z surowego wyjścia):
- Build: `vite build` do katalogu w scratchpadzie (bez `npm run build`), OK w 16,37 s.
- Macierz, rivals=9, civTypes=14, barbarzyńcy Trudny, normPP=inert (domyślne), rawDiff zapisany obok:
  - max/4242 zapis t3: B==A 6/6 (tury 4–9), pageErrors 0, rawDiff 0 w każdej turze — PASS
  - max/4242 zapis t10: B==A 6/6 (tury 11–16), pageErrors 0, rawDiff 0 w każdej turze — PASS
  - bunt/4242 zapis t10: B==A 6/6 (tury 11–16), pageErrors 0; rawDiff 1 w każdej turze: wyłącznie pole `podzialPracy` (jedno miasto), effPP 0 różnic — PASS (reprezentacja)
  - bunt/4242 zapis t3: Chromium „Target page, context or browser has been closed” w 4 próbach (1 próba + 3 ponowienia, limit z dispatchu) — NIE ZMIERZONO
- A==A' max/4242 (dwa niezależne biegi A, zapis t3 i t10): porównano 9 tur (t4–t9, t11–t13), bajt w bajt identyczne — 9 < 10, kryterium NIESPEŁNIONE.
- Bieg A max/7 (zapis t3,t10) przekroczył limit 590 s w turze 13; bieg A max/7 tylko z zapisem t10 przekroczył limit w turze 11; drugi bieg A max/4242 przekroczył w turze 13 — logi w `dane/r3d-LOG-*`.
- Dowód red→green na buildzie (z r3b, ten sam runner): bunt/7/t7 PRZED poprawką 0/6 (FAIL), PO poprawce 6/6 (PASS) — `dane/bunt-7-t7-B-PRZED-poprawka.json`, `dane/bunt-7-t7-B-PO-poprawce.json`.
- Bramki (z r3, zielone na d14 wg raportu Operatora; NIE powtórzone w tej rundzie): tsc 0; logic 213; tech-tree 20; research 33; unit-replace 21/21; combat 6/6; ai-test 297/0; early-grace-15 33/0; society-breakdown 56/0; ai-city-order-need-wiring 267/0; save-load-ai-cs-absorption 12/0; podzial-pracy-representation 5/0.
BLOKADY / NIE ZMIERZONO (jawnie):
- Na d14 NIE ZMIERZONO: max/7 t3 i t10; aionly 4242 i 7 (t3 i t10); bunt/7 (t3 i t10); bunt/4242 t3 (crash Chromium ×4).
- Przyczyna: bieg A do tury 16 trwa 9–12 min (20–50 s/turę przy obciążonej maszynie); dwa biegi A dla max/7 i jeden dla max/4242 przekroczyły limit 590 s narzędzia (tury 11–13). Runner nie wznawia biegu A; snapshot t10 dla max/7 nie powstał w kompletnej formie.
- Klik UI (menu pauzy → Wczytaj) ≥6 tur: NIE ZMIERZONO w tej rundzie. Wyniki r3b (5/5, 3/3) pochodzą z buildu sprzed tej rundy.
- Hipoteza artefaktu `Math.random` dla „dirty3”: NIE rozstrzygnięta.
- Render po wczytaniu (liczba miast/jednostek w scenie 3D): NIE ZMIERZONO; komórka `render-max-4242-t10-B` (verdict FAIL) nie jest ważnym dowodem.
- Dług: brak powtarzalnej bramki behawioralnej w repo dla poprawki aiCs* (wymaga przeglądarki).
ODPOWIEDZI NA ZARZUTY (d24774dc8):
1. A==A' ≥10 tur × 2 ziarna — PRZYJMUJĘ. max/4242: 9 tur identycznych; max/7: nie zmierzono na d14. Otwarte.
2. Klik UI ≥6 tur i hipoteza „dirty3” — PRZYJMUJĘ. Nie zmierzono w tej rundzie. Otwarte.
3. Macierz niepełna; komórki sprzed poprawki bez powtórzenia — PRZYJMUJĘ. Zmierzono na d14 3 z 12 komórek (max/4242 t3, t10; bunt/4242 t10). Dla bunt/4242/t10 brak regresji po zmianie formatu zapisu (B==A 6/6, rawDiff tylko podzialPracy). Pozostałe otwarte.
4. Test czerwony→zielony tylko tekstowy — PRZYJMUJĘ CZĘŚCIOWO. Dowód behawioralny: bunt/7/t7 0/6 PRZED, 6/6 PO (ten sam runner). Test `save-load-ai-cs-absorption-state-test.cjs` na mutacji linii przywracania (Evaluator, 20-evaluator): 11/1 FAIL. Brak bramki behawioralnej w repo — dług otwarty.
5. Render: liczba miast/jednostek niezmierzona; FAIL komórki — PRZYJMUJĘ. Nowy render na d14 NIE ZMIERZONO; komórka r3b nie jest dowodem.
6. Nieaktualne treści w dokumencie macierzy — PRZYJMUJĘ, poprawione (sekcja 0 → ARCHIWUM, odsyłacz do 0A/0B).
7. Normalizacja `podzialPracy` (inert) ukrywa różnice ekonomii — ODRZUCAM w zakresie zmierzonych komórek, z dowodem: bez normalizacji (rawDiff) max/4242 t3 i t10 mają 0 różnic w każdej turze; bunt/4242/t10 ma 1 różnicę w każdej turze (`podzialPracy`, martwe pole przy override=false) i 0 różnic w effPP oraz w pozostałych polach miast i jednostek przez 6 tur (`dane/r3d-READBACK-d14.txt`). Rozjazd r2 bunt/t10 (rivals=2) nie został odtworzony na maksimum. Ograniczenie: domyślna normalizacja runnera nadal pomija pole — przy nowych komórkach porównywać z `--norm-pp raw`.
RUNDY: 3/5 (obrona r3; poprzednie przerwanie restartem kontenera = INFRA, nie liczone)
NASTĘPNY KROK: kolejna runda Operatora (SONNET, uzasadnienie: 2 nieudane rundy HAIKU) z: (a) runnerem A wznawialnym po checkpointcie albo biegami A z zapisem t3 i k=10 (≤ 9 min na bieg), (b) pomiarem max/7 i A' max/4242 do 10 tur, (c) klikiem UI na max/4242 t3 z ≥6 turami i rozstrzygnięciem „dirty3”, (d) renderem po wczytaniu z odczytem stanu. Alternatywa dla właściciela: zawęzić macierz do maksimum na pozostałych komórkach albo zaakceptować status BLOCK do czasu lepszej infrastruktury (obciążenie maszyny: 4 rdzenie, tury 20–50 s).
DEPLOY/PUSH: NIE WYKONANO
