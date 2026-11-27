# ZAPIS-WCZYTANIE-MACIERZ — pomiar macierzy po FALI 932 (R-WEB-SAVE-LOAD-MATRIX-Q1, runda 1, Operator HAIKU)

**Baza:** origin/main `ebaa23b03` (kod 4bd55c32, FALA 932). Żadnych zmian w kodzie w tej rundzie: B==A we wszystkich zmierzonych komórkach, więc poprawki nie wdrażano (zgodnie z pkt 5 dispatchu).
**Zakres:** WYŁĄCZNIE konfiguracje maksymalne (Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny, kultura AI trudny, barbarzyńcy normalny/włączeni); `default` nie mierzony.
**Metoda:** `gra/tools/save-load-continuity-live.cjs` (tryb A = ciągła gra z zapisem w punkcie; tryb B = świeża gra tego samego ziarna + wczytanie zapisu ścieżką `loadJsonAsPauseLoad` → produkcyjne `loadGameFromSlot(slot, true)`). Porównanie per tura na znormalizowanym `__detHarness.full()`, 6 tur po wczytaniu.
**Bunt** = cfg `bunt` (max + bunt stolicy AI w 1. turze po zapisie).

## 1. Macierz (12 komórek = {max, bunt, aionly} × {4242, 7} × {t3, t10})

| Konfiguracja | Ziarno | Zapis po | B==A (tury po wczytaniu) | mapDiffers | Błędy strony | Źródło wyniku |
|---|---|---|---|---|---|---|
| max | 4242 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-max-4242-t3.json` |
| max | 4242 | t10 | 6/6 (t11–t16) | true | 0 | poprzednia runda (r3/r4, ten sam kod); NIE przemierzono w tej rundzie |
| max | 7 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-max-7-t3.json` |
| max | 7 | t10 | 6/6 (t11–t16) | true | 0 | ten przebieg: `dane/B-max-7-t10.json` |
| bunt | 4242 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-bunt-4242-t3.json` |
| bunt | 7 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-bunt-7-t3.json` (drugie podejście, patrz §4) |
| aionly | 4242 | t3 | **NIE ZMIERZONO** | — | — | — |
| aionly | 4242 | t10 | **NIE ZMIERZONO** | — | — | — |
| aionly | 7 | t3 | 6/6 (t4–t9) | true | 0 | poprzednia runda (r4, ten sam kod) |
| aionly | 7 | t10 | **NIE ZMIERZONO** | — | — | — |
| bunt | 4242 | t10 | **NIE ZMIERZONO** | — | — | — |
| bunt | 7 | t10 | **NIE ZMIERZONO** | — | — | — |

**Wynik:** 7 z 12 komórek ma B==A 6/6 (5 w tej rundzie, 2 z poprzedniej, na tym samym kodzie). Zero rozjazdów. Pozostałe 5 komórek: NIE ZMIERZONO (brak czasu w tej rundzie, patrz §5).

`mapDiffers = true` we wszystkich pięciu biegach tej rundzie: żywa mapa po zapisie różniła się od zapisu, więc decyzja `liveMapDiffersFromSave` w `loadGameFromSlot` odbudowała mapę. To jest ścieżka naprawy z FALI 932; wynik 6/6 jest więc dowodem, że poprawka działa także w cfg `bunt` i na ziarnie 7.

## 2. Punkt 1 dispatchu (macierz) — stan

Zrobione: 5 komórek w tej rundzie + 2 z poprzedniej (max/4242/t10, aionly/7/t3). Nie zrobione: bunt/4242/t10, bunt/7/t10, aionly/4242/t3, aionly/4242/t10, aionly/7/t10 — każda komórka t10 wymaga ok. 16 tur gry (ok. 9–10 min na jeden bieg A, plus bieg B), a t3 ok. 9 tur. Przy limicie 590 s na wywołanie Bash każdy bieg trzeba było dzielić na osobne wywołania.

## 3. Punkt 2 (klik UI w menu pauzy) — NIE ZMIERZONO

Nie napisano jeszcze harnessu klikającego menu pauzy („Wczytaj” → wybór slotu). Obecny test używa haka `loadJsonAsPauseLoad`, który woła produkcyjne `loadGameFromSlot`, ale nie przechodzi przez UI. Pozostaje: nowy skrypt z klikaniem, osobna runda.

## 4. Incydenty (bez wpływu na wynik)

- **max/7 (bieg A z zapisami t3 i t10 w jednym przebiegu):** Chromium zamknęło stronę w turze 16 (`Target page, context or browser has been closed`), po 9 min 45 s. Dlatego t10 powtórzono w osobnym biegu A (`--saves 10`, 16 tur, 8 min 57 s, bez błędu); ten bieg daje komórkę max/7/t10. Bieg B t10 zakończony bez błędów.
- **bunt/7/t3 (bieg B):** pierwsze uruchomienie zakończyło się błędem `Target page ... has been closed` (SIGSEGV Chromium, bez segmentu wyniku). Ponowione z tym samym stanem A: PASS 6/6. Dwa podejścia do jednej komórki, wynik z drugiego.
- **max/7 stan częściowy:** `STATE-A-max-7-t3-partial-z-t10-crash.json` to stan z przerwanego biegu A (zawiera pełny punkt t3 i częściowy t10). Użyty do biegu B t3; bieg B t10 użył osobnego stanu `STATE-A-max-7-t10.json`.

## 5. Punkty 3 i 4 dispatchu — NIE ZMIERZONO

- **A==A' (determinizm ciągły, digest bajt w bajt przez ≥10 tur, max/4242 i max/7):** nie uruchomiono. Wymaga dwóch niezależnych biegów A po ≥10 turach na każdym ziarnie (ok. 2 × 9–12 min na ziarno). Nie zrobione w tej rundzie.
- **Render po wczytaniu (hexCount, brak [Error] w konsoli, liczba miast/jednostek widocznych, zrzut do dane/):** nie zmierzono. Bieg testowy działa bez renderu sceny (swiftshader, bez oceny wizualnej); zrzut ekranu nie był wykonywany.

## 6. Bramki

Brak zmian w kodzie w tej rundzie. Wykonano: `npx tsc --noEmit` w `gra/` — exit 0 (build vite do katalogu w scratchpadzie, nie w repo; `npm run build` nie uruchamiano). Pozostałe bramki (logic 213, ai-test 297/0 itd.) nie były potrzebne, bo nie zmieniano `gra/src`.

## 7. Kandydaci do decyzji orkiestratora (poza zakresem)

Brak nowych kandydatów błędu gry w tej rundzie. Obserwacja metodyczna: bieg B wymaga ok. 5–8 min i bywa przerywany przez SIGSEGV Chromium (2 przypadki w tej rundzie); bieg A t10 zbliża się do limitu wywołania narzędzia. Dla dalszych komórek warto rozważyć zapis kilku punktów w jednym biegu A (jeden przebieg zamiast dwóch) — wymaga zmiany skryptu, więc poza tą rundą.

## Dane

`dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/` — pliki wyników `B-*.json` (5 biegów tej rundy, z polami `verdict`, `pageErrors`, `segments[].turns[]`) i stany `STATE-A-*.json` (punkty zapisu i zrzuty kanoniczne).
