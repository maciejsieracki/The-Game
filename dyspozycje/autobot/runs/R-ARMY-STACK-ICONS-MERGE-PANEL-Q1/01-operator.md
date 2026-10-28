# Operator — ikony stosu armii i panel łączenia

Status: **PASS** dla wskazanego wąskiego zakresu. Nie wykonano deployu ani pushu.

## Zakres przeglądu

- Ikony akcji Rozdziel/Połącz w `gra/src/ui/armyStackHud.ts`.
- Ograniczenie panelu łączenia do viewportu i przewijanie zawartości w `gra/src/ui/armyMergePanel.ts`.
- Regresje ikon i rzeczywistego renderu Chromium w testach `army-split-ruch-icons-test.cjs` i `army-merge-panel-scroll-real-render-test.cjs`.

## Ustalenia

- Ikona Rozdziel pokazuje rozwidlenie od wspólnego środka z grotami na zewnątrz; ikona Połącz ma groty skierowane ku wspólnemu środkowi. Są różne również kształtem, a nie tylko kierunkiem poziomych strzałek.
- Nakładka panelu ma 24 px wewnętrznego marginesu, a karta ma `max-height` ograniczone przez `100vh` i `100dvh`. Nagłówek, wynik i CTA pozostają widoczne; przewijana jest zawartość panelu.
- Test Chromium przy efektywnym viewportcie 600×413 CSS px i DPR 1.5 sprawdza dostępność obu CTA, osiągalność ostatniego wiersza istniejącej listy oraz wiersza przybywającej jednostki.
- Przy wąskim viewportcie layout układa sekcje pionowo. Dlatego przy przewinięciu na sam koniec widoczny jest wiersz przybywający, a ostatni wiersz istniejącego stosu jest osobno sprawdzany jako osiągalny w tym samym scrollu.

## Weryfikacja

- `node gra/tools/army-merge-panel-scroll-real-render-test.cjs` — **26/26 PASS**, w tym rzeczywisty render i kliknięcia CTA w Chromium.
- `node gra/tools/army-split-ruch-icons-test.cjs` — **7/7 PASS**.
- `git diff --check` dla wskazanych plików — PASS.

Nie stwierdziłem braków w tym zakresie. Poza zakresem pozostają emblematy właściciela, odznaka wodza/generała i BattleScene; ich nie zmieniałem ani nie oceniałem.
