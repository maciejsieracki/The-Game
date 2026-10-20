# P1.3 — Ekran intro/start gry (żywy Chromium)

**Temat:** R-RUSTPORT-P1-3-INTRO-START-Q1 · **Runda:** 1/5 · **Pin:** `main` = `edb8fb56`

## 1. Metoda i dowody

- Scratch: klon repo, `git checkout edb8fb56`, `npm ci` w `gra/` (71 pakietów).
- Vite bezpośrednio: `node ./node_modules/vite/bin/vite.js --port 5180 --strictPort` (PID 7296), `predev` pominięty.
- `git status --short gra/data` = 0 linii przed zrzutem i po ubiciu serwera.
- Chromium `/opt/pw-browsers/chromium`, viewport 1600×900.
- Zrzut: `/home/user/The-Game/dyspozycje/rust-port/p1/screenshots/P1-3-intro-start.png` — 1 333 402 B, PNG 1600×900 RGB, widoczne menu.
- Dev server ubity (`kill 7296`), port 5180 zamknięty.

## 2. Widoczne na zrzucie

| Element | Przeznaczenie (źródło: `gra/src/ui/mainMenu.ts`, `gra/src/main.ts` ok. l. 22161–22210) |
|---|---|
| ROZPOCZNIJ GRĘ | Otwiera kreator nowej gry (`onNewGame`). |
| KONTYNUUJ — BRAK ZAPISÓW | Wczytuje ostatni zapis; nieaktywny, gdy zapisu brak. |
| KAMPANIA / MULTIPLAYER — WKRÓTCE | Placeholdery bez funkcji (toast „wkrótce”). |
| USTAWIENIA | Otwiera ekran `#cm-settings` (`showSettings`). |
| WIĘCEJ ▾ | Rozwija panel: Wczytaj grę, O grze, Test wydajności. |
| WYJDŹ | Próba zamknięcia karty; w przeglądarce może pokazać ekran pożegnalny. |
| THE GAME / WERSJA 0.9 / stopka „The Game · alfa 0.9” | Tekst statyczny z `data/ui-params.json`. |

## 3. Pozycje w panelu „Więcej” — poprawka

„Test wydajności” **nie jest bramkowany buildem**. `mainMenu.ts` (ok. l. 473–480) dodaje go bezwarunkowo, gdy `cfg.onPerfTest` jest podany; `main.ts` (l. 22207) podaje go zawsze; `perfTestPanel.ts` nie ma bramki DEV. Etykieta „dev” to tylko badge tekstowy. Pozycja jest więc widoczna we wszystkich buildach, nie tylko w dev.

## 4. Nieobserwowane w tej rundzie

- Zawartość HUD pod menu (chipy, CIVPEDIA, MENU, ZAKOŃCZ TURĘ, „TURA 1”) — nie sprawdzono w DOM ani na zrzucie.
- Zawartość ekranu Ustawienia (audio/wideo/UI) — nie zrzutowano ani nie zapisano DOM. Opis wyżej pochodzi wyłącznie z kodu.

## 5. Anomalie

- Konsola: 1 błąd `404 (Not Found)`. URL zasobu nie został zapisany w tej rundzie, więc nie jest zidentyfikowany. Nie blokuje menu. Do P1.16.
