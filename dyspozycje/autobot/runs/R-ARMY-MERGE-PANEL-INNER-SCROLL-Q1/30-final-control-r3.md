# Final Control — R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1 — R3

Werdykt: **PASS-WITH-NOTES**, etap 8/11, dla kandydata `6ba71824725994997796019a16525dc5160099e2`.

## Niezależne readbacki

- `TMPDIR=/workspace/tmp-merge-panel-final node gra/tools/army-merge-panel-production-mount-test.cjs` — **9/9 PASS**. Test otwiera produkcyjny HTML Roboczej z body zoom 150%, montuje kandydacki komponent poza przekształconym body i sprawdza 88 oddziałów + 1 przybywający, marginesy ≥24 px, brak overflow strony, 89 wierszy, dostęp do końca listy, oba CTA i brak błędów JavaScript.
- `npm --prefix gra run typecheck` — PASS.
- Ponowny pełny real-render: **34/34 PASS**, w tym widoczny suwak, przewijanie do ostatniego wiersza, brak overflow i negatywny test montowania pod skalowanym body. Test źródłowy zapisuje zrzut do hardkodowanego `/tmp/army-merge-custom-scrollbar.png`; ponieważ `/tmp` jest pełny, użyłem chwilowej kopii harnessu zmieniającej wyłącznie tę ścieżkę na `path.join(TMPDIR, ...)`, uruchomionej jako `TMPDIR=/workspace/tmp-merge-panel-final node gra/tools/.army-merge-panel-scroll-final-control-temp.cjs`. Kopię usunąłem po przebiegu; źródłowy test i kod produktu pozostały nietknięte.
- Bezpośredni rerun oryginalnego real-render testu najpierw przerwał się przy zapisie zrzutu do hardkodowanego `/tmp/army-merge-custom-scrollbar.png`; środowiskowy tmpfs `/tmp` jest pełny. Po obejściu wyłącznie ścieżki zrzutu, wszystkie asercje real-render przeszły.

## Granica

Test produkcyjnego dokumentu wczytuje rzeczywisty bundle Roboczej dla zoomu, lecz wstrzykuje komponent kandydata do kontrolowanego rosteru. CTA są sprawdzane jako osiągalne callbacki fixture, nie pełna transakcja gry. Te granice są jawne i nie dotyczą wymaganego viewport/scroll zachowania.

Decyzja: gotowe do integracji ze wskazanymi uwagami. Merge, deploy i push nie wykonano.
