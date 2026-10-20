# P1.5 — Ekran wyboru cywilizacji (żywy Chromium)

**Temat:** R-RUSTPORT-P1-5-CIV-SELECTION-Q1 · **Runda:** 1/5 · **Pin:** `main` = `edb8fb56`

## 1. Metoda i dowody

- Izolacja: świeży klon repo w scratchpadzie, `git checkout edb8fb56`, `npm ci` w `gra/` (71 pakietów).
- Vite bezpośrednio: `node ./node_modules/vite/bin/vite.js --port 5181 --strictPort` (PID 24202), `predev` pominięty.
- `git status gra/data` = 0 linii przed zrzutami i po ich wykonaniu (klon i oryginalne repo).
- Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, viewport 1600×900, Playwright z `gra/node_modules`.
- Ścieżka: menu → „Rozpocznij grę" → „Rozpocznij konfigurację →" (krok 1) → krok 2 Epoka → „Dalej →" → krok 3 Cywilizacja.
- Proces ubity: PID 24202 zakończony (`kill -0` nie znajduje procesu), port 5181 zwraca brak odpowiedzi.

## 2. Epoki i liczba cywilizacji (krok 2, DOM)

| Epoka | Badge w UI | Zrzut |
|---|---|---|
| Epoka Kamienia (domyślna) | 8 cyw. | `screenshots/P1-5-civ-selection-01-kamien.png` (8 kart) |
| Epoka Brazu | 14 cyw. | `screenshots/P1-5-civ-selection-03-braz.png` (14 kart); lista 14 nazw w `evidence-dom-measure.json` (DOM, `cardNames`) |
| Epoka Zelaza | 15 cyw. | `screenshots/P1-5-civ-selection-02-zelazo.png` (15 kart) |

Zgodność z danymi: `gra/data/civs.json` ma 15 cywilizacji; liczby 8 / 14 / 15 zgadzają się z regułą `civAvailableAtEpoch` (`epokiStartowe` ≤ wybrana epoka). Pełne 15 widać tylko w Epoce Żelaza — to zachowanie zamierzone, nie ukryta pozycja.

## 3. Widoczne pozycje (zrzut 02, Epoka Żelaza)

15 kart z nazwą (wielkimi literami): Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie, Harappa, Hetyci, Słowianie, Babilonia, Asyria, Fenicjanie.

- Siatka kart (4-4-4-3) mieści się w pierwszych 900 px: ostatnia karta kończy się na y=715 (`lastCardBottom`, Epoka Żelaza i Brązu). To jest cały zakres twierdzenia.
- Cały ekran NIE mieści się w 900 px bez przewijania: kolumna szczegółów (`.detail`) ma 5386 px wysokości, a przewijanie odbywa się WEWNĄTRZ kontenera `.civ-newgame.hero-flow` (`overflow: auto`, scrollHeight 5731, clientHeight 900). `document.documentElement.scrollHeight` = 900, więc przewijanie strony jest puste, a przewijany jest kontener. Pomiar: `runs/R-RUSTPORT-P1-5-CIV-SELECTION-Q1/evidence-dom-measure.json` (pola `measure`).
- Zablokowanych kart: 0 (w DOM żadna karta nie ma klasy `lock`/`disabled`).
- Karta pokazuje wyłącznie medalion i nazwę; bonusy/opis widać dopiero w panelu szczegółów.
- Panel szczegółów po kliknięciu (zrzut 01, Rzymianie): cechy i bonusy (6 punktów), religia, typ, jednostka specjalna (Legion (Legionista)), blok „Start w klastrze typu" (stolica, rywale, obce typy na mapie).

## 4. Mechanizm wyboru

- Klik w kartę ustawia wybór: w Epoce Żelaza kliknięcie „Grecy" zmieniło panel szczegółów z „Rzymianie" na „Grecy" (`click.before` / `click.after`), a jedyną zaznaczoną kartą jest „Grecy" (`click.selectedCards`). Dowód: `evidence-dom-measure.json` (pole `click`) oraz `screenshots/P1-5-civ-selection-04-klik-grecy.png`.
- Potwierdzenie to przycisk „Dalej →" (aktywny po wybraniu cywilizacji); „← Wstecz" wraca do kroku 2.
- Wybór jest zapisywany w `localStorage` (klucz `civ-new-game-prefs-v1`).

## 5. Odniesienie do źródła

- `gra/src/ui/newGameFlow.ts`: `renderCivStep` (ok. l. 1356–1412), `civAvailableAtEpoch` (ok. l. 580), nawigacja `render()` z przyciskami `.nb.next`/`.nb.back` (ok. l. 2284).
- Dane: `gra/data/civs.json` (15 pozycji, pole `epokaWejscia`/`epokiStartowe`).

## 6. Anomalie

- W konsoli przeglądarki pojawia się 1× `404 (Not Found)` tylko w przebiegu startującym od Epoki Kamienia (pozostałe przebiegi: 0 wpisów). Listener odpowiedzi HTTP nie zarejestrował zasobu ze statusem ≥400, więc URL nie jest ustalony. Hipoteza do sprawdzenia w P1.16: `/favicon.ico` (na tym serwerze `curl` zwraca 404), ale nie potwierdzona w przeglądarce. Nie blokuje ekranu.
- Brak rozbieżności między liczbą na zrzutach (15 w Epoce Żelaza, 8 w Kamienia) a `civs.json`.
