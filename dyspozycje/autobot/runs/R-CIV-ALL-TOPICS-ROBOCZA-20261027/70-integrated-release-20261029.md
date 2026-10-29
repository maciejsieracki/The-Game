# AutoBot — integracja wszystkich gotowych poprawek (2026-10-29)

## Zakres

Zintegrowano z aktualnego `origin/main` wyłącznie zatwierdzone poprawki gry poza osobno odłożonym testem wydajności dużego imperium oraz poza zablokowanym procesowym C-064:

- wybór bitwy Auto/Ręczna zawsze dostępny przed wejściem na pole bitwy; bez wodza/generała po wejściu w ręczną bitwę brak ręcznego sterowania jednostkami;
- formacje i zachowanie armii: linia ataku/obrony/szturmu, domyślne rozmieszczenie, bliskie skrzydła konnicy i rydwanów, szyk jednostek dystansowych i wspólny marsz;
- kampania AI z fizycznym wodzem: pięć pełnych tur zbiórki, atak od kolejnej tury, ponowne zbieranie po stracie wodza, wybór osiągalnego celu oraz wykorzystanie transportu morskiego po odblokowaniu;
- rekrutacja/akcje wodza, szybkie dołączenie, automarsz nowo rekrutowanych jednostek;
- kreator cywilizacji: zwijane parametry, przypięta nawigacja i usunięcie opcjonalnego ziarna mapy.

Pozostałe wcześniej wdrożone tematy (łączenie armii, skrolowanie panelu, tartak na wzgórzu, etapy rekrutacji i ikony łączenia/rozdzielania) nie zostały nadpisane.

## Walidacja dokładnego drzewa integracyjnego

- `npm run typecheck -- --pretty false`: PASS.
- `npm run build`: PASS, Vite 5.4.21, 917 modułów, pojedynczy plik HTML.
- test kampanii AI w Chromium: 68/68; pięć tur zbiórki i atak w szóstej, marsz morski, save/load, odtworzenie kampanii po stracie wodza.
- test kreatora/nawigacji w Chromium: 230/230.
- testy ukierunkowane: formacje bitewne, macierz armii mieszanej, placement, zbliżone skrzydła, rekrutacja i marsz do wodza, wybór Auto/Ręczna bez dowódcy, usunięcie ziarna mapy, oznaczenia i etykiety dowódcy — PASS (szczegóły w raportach tematów).
- `git diff --check`: PASS.
- build Robocza: MD5 `eab188a2df6c2399f8431d58167211bc`, SHA-256 `d0eba5e51a1d896f12171347e6c6e337263f8d599afa7eb24bd45e8441409e33`, `70028627` B; manifest, wiersze `bundles[]` i START wygenerowane i lokalnie zweryfikowane przez `verify-robocza-bundle.cjs`.

## Ograniczenia

- Test dużego imperium pozostaje odłożony na koniec zgodnie z dyspozycją właściciela; wydajność nie jest przez ten release uznana za naprawioną.
- C-064 (wymóg raportowania i przejść kart Kanban) pozostaje poza wydaniem, bo w tym środowisku nie ma natywnego konektora ani potwierdzenia przejść. Nie oznaczam tego tematu jako zakończonego.
- Walidacja walki obejmuje automatyzowalne scenariusze testowe; nie zastępuje długiego playtestu terenów i każdej kombinacji jednostek.

Status przed publikacją: gotowe do commit/push i odczytu zdalnego.
