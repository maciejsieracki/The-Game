STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-MATRIX-Q1
GOAL: Dopełnić macierz zapis/wczytanie na MAKSIMUM (B==A ≥6 tur po wczytaniu), ścieżka UI, A==A' (≥10 tur ×2 ziarna), spójność renderu; poprawka tylko po odtworzeniu B≠A.
ZMIANY/COMMIT: brak zmian w kodzie gry (gra/src nietknięte). Dodane: dyspozycje/analizy/ZAPIS-WCZYTANIE-MACIERZ-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/** (wyniki B-*.json, stany STATE-A-*.json). SHA: patrz sekcja DEPLOY/PUSH i wpis git w czubku pracy.
BAZA: origin/main ebaa23b03 (kod 4bd55c32, FALA 932).

TESTY:
- Macierz max-family (cfg max/bunt/aionly, ziarna 4242/7, zapis t3/t10) — 7 z 12 komórek B==A 6/6, zero rozjazdów, pageErrors 0 w każdym biegu, mapDiffers=true (odbudowa mapy z zapisu zadziałała):
  - max/4242/t3 6/6 (ten przebieg)
  - max/4242/t10 6/6 (poprzednia runda, ten sam kod — NIE przemierzono)
  - max/7/t3 6/6 (ten przebieg)
  - max/7/t10 6/6 (ten przebieg)
  - bunt/4242/t3 6/6 (ten przebieg)
  - bunt/7/t3 6/6 (ten przebieg, po jednym ponowieniu po SIGSEGV Chromium przy B)
  - aionly/7/t3 6/6 (poprzednia runda, ten sam kod)
- NIE ZMIERZONO: aionly/4242/t3, aionly/4242/t10, aionly/7/t10, bunt/4242/t10, bunt/7/t10 (brak czasu w rundzie: każda komórka t10 to ok. 16 tur gry).
- Ścieżka UI (klik „Wczytaj” w menu pauzy): NIE ZMIERZONO — nie napisano harnessu klikającego; używany hak loadJsonAsPauseLoad woła produkcyjne loadGameFromSlot.
- A==A' (determinizm ciągły, digest ≥10 tur, max/4242 i max/7): NIE ZMIERZONO.
- Render po wczytaniu (hexCount, [Error] w konsoli, liczba miast/jednostek, zrzut do dane/): NIE ZMIERZONO.
- Bramki: npx tsc --noEmit w gra/ — exit 0. Pozostałe bramki nieuruchomione (brak zmian w gra/src).
- Build: vite build do katalogu w scratchpadzie (npm run build nie uruchamiano).

BLOKADY:
- Czas: każda komórka wymaga 5–10 min na bieg (B) lub 9–10 min (A t10); tool limit 590 s wymusza dzielenie biegów.
- Chromium SIGSEGV/zamknięcie strony: 2 przypadki w tej rundzie (max/7 A t3+t10 w jednym biegu w turze 16; bunt/7 B przy pierwszym podejściu). Oba obejście: osobny bieg A dla t10; ponowienie B.
- Procesowe: jedno połączone wywołanie (A i B w jednym Bash) przekroczyło 590 s i zostało automatycznie przeniesione w tło przez narzędzie. Nie uruchomiłem drugiej kopii; wynik zebrany przez odpytanie pliku wyjściowego. Bez kolejnych przypadków. Naruszenie zasady run_in_background odnotowane wprost (nie była to decyzja świadoma).
- Brak luk wymagających założenia.

RUNDY: 1/5
NASTĘPNY KROK: Runda 2 (ten sam ID, dopisek do 00-dispatch.md przez orkiestratora): (a) pięć NIE ZMIERZONYCH komórek macierzy (t10 wymagają osobnych biegów A); (b) harness klikania menu pauzy (2 komórki max/4242/t3 i max/7/t3); (c) A==A' ≥10 tur na max/4242 i max/7; (d) render po wczytaniu na max/4242/t10 z zrzutem do dane/. Rekomendacja orkiestratora: dla tego tematu zlecić osobną rundę na czas (4–5 wywołań), a nie jedną sesję.
DEPLOY/PUSH: NIE WYKONANO
