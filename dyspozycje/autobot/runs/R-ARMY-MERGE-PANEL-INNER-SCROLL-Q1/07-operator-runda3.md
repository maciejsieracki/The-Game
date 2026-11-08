# Operator — R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1 — runda 3/5

STATUS: **korekta implementacji gotowa; test rzeczywistej strony Roboczej PASS; oczekuje na niezależny przegląd.** Nie publikować przed kontrolą.

## Przyczyna

Runda 2 sprawdzała komponent w osobnym, neutralnym dokumencie. Nie odtwarzała mechanizmu zoomu gry. W `hud.ts` powiększenie UI skaluje `document.body` przez `transform: scale(1.5)`. Panel łączenia był montowany jako element potomny `body`; w takim kontekście `position: fixed` i wymiary viewportu panelu były liczone względem przekształconego rodzica. W rzeczywistej grze modal mógł więc wyjść poza ekran, mimo że test izolowanego komponentu przechodził.

## Zmiana

`armyMergePanel.ts` montuje modal jako element `document.documentElement`, obok `body`, a nie wewnątrz transformowanego drzewa gry. Margines viewportu, ograniczenie wysokości, przewijanie samego rosteru, stały nagłówek i CTA oraz jawny złoty suwak pozostają aktywne. Mechanika łączenia nie została zmieniona.

Rozszerzyłem test komponentu o wierne ustawienia `applyUiZoom()` oraz negatywną kontrolę: identyczny modal zamontowany pod skalowanym `body` musi naruszyć bezpieczny margines. Dodałem też test, który otwiera faktyczny plik `gra-robocza/Gra-ROBOCZA.html`, ustawia zapamiętane 150%, czeka na prawdziwą transformację `body` z bundla Roboczej, a następnie montuje bieżący komponent do tego dokumentu i testuje roster 88+1.

## Weryfikacja

- `node gra/tools/army-merge-panel-scroll-real-render-test.cjs` — **34/34 PASS**; viewport 600×413 CSS px / DPR 1.5, długa lista, kliknięcia CTA, widoczny suwak i kontrola negatywna dla `body`.
- `node gra/tools/army-merge-panel-production-mount-test.cjs` — **9/9 PASS** na faktycznej stronie Roboczej. Potwierdzono `body` z `matrix(1.5,0,0,1.5,0,0)`, 88 jednostek + przybywająca, marginesy min. 24 px, brak overflow dokumentu, widoczne oba CTA, przewinięcie do końca i klik merge/separate.
- `npm run typecheck -- --pretty false` w `gra/` — PASS.
- `git diff --check` — PASS.
- Zrzut z rzeczywistego dokumentu Roboczej: [`06-production-robocza-150-percent.png`](06-production-robocza-150-percent.png).

Test integracyjny wczytuje produkcyjny HTML Roboczej, ale wstrzykuje aktualny komponent z gałęzi operatora jako harness, aby bez interaktywnej rozgrywki wytworzyć kontrolowany stos 88 jednostek. Udowadnia montaż na prawdziwym dokumencie i zoomie produkcyjnego bundla; nie udaje, że testuje istniejącą wersję komponentu w wydanym bundlu. Pełna transakcja gry nie jest wykonywana.

Pliki zmienione w rundzie 3: `gra/src/ui/armyMergePanel.ts`, `gra/tools/army-merge-panel-scroll-real-render-test.cjs`, `gra/tools/army-merge-panel-production-mount-test.cjs`, ten raport i zrzut dowodowy. Brak merge, push i deploy. Commit operatora zostanie zapisany w historii gałęzi.
