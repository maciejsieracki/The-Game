# R-WEB-UI-RESOURCE-ICONS-TECH-DISCOVERY-NOTICE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-ICONS-TECH-DISCOVERY-NOTICE-Q1
GOAL: okno odkrycia technologii (`gra/src/ui/techDiscoveryNotice.ts`) pokazuje surowce i plony jako chipy ikona+liczba (jak karty encji), bez gołych nazw surowców/plonów w sekcjach „Co możesz teraz zrobić”, odblokowań i efektów; teksty zachowują poprawną polszczyznę.
BAZA: origin/main `6ade0f0ec` (detached). Kod operatora: `57d1c7d3b` (commit „chipy surowcow w oknie odkrycia”). Commit raportu: patrz czubek gałęzi (sha w odpowiedzi).

## ZMIANY (allowlista)

- `gra/src/ui/techDiscoveryNotice.ts` — sekcja „Top 5 korzyści” (zdania z `tech-cards-top5.json`, dotąd zwykły `value`) przechodzi przez `yieldSentenceFields` (ta sama tokenizacja co wiersze „Co możesz teraz zrobić”). Tekst `value` zostaje jako rezerwa, `valueParts` niesie chipy.
- `gra/src/ui/entityCards/resourceRows.ts` — dopisek do `ALIASES` (wspólny helper chipów, bez zmiany sygnatur): `ceramike`, `cegle`, `gline`, `rude` (biernik/miejscownik surowców z opisów odkryć).
- `gra/tools/entity-card-chip-text.cjs` — dopisek do tabeli `FORMS` (dane testów kart): `ceramika/ceramiki/ceramike/ceramice`, `gline`, `rude`. Bez tej zmiany istniejące testy kart (`tech-cards-top5-test`, `entity-cards-yield-icons-test`) oblewały się na nowych chipach — to zmiana oczekiwań testu, nie logiki (do przeglądu przez Evaluatora).
- `gra/tools/tech-discovery-notice-resource-chips-test.cjs` — NOWY test (esbuild bundle + Chromium/Playwright, prawdziwe `showTechDiscoveryNotice` dla 32 technologii z `tech.json`).
- NIE zmieniano: `gra/src/data/*.json`, `main.ts`, `WERSJE.md`, `gra/src/ui/entityCards/technologyAdapter.ts`, renderera.

## TESTY (wyniki z surowego wyjścia)

- `npx tsc --noEmit` → exit 0 (bez wyjścia).
- `logic-test.cjs` → `LOGIC OK (213/213)`.
- `tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`.
- `research-test.cjs` → `ALL GREEN`.
- `unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `combat-test.cjs` → `All sanity checks passed.`
- NOWY `tech-discovery-notice-resource-chips-test.cjs` → `6 pass, 0 fail (technologii: 32, chipów łącznie: 348)`. Kryteria: [P] dane; [B] okno otwiera się dla każdej technologii, 0 błędów konsoli/pageerror; [A] zero gołych nazw surowców/plonów w widocznym tekście; [X] brak wstrzykniętych `script/iframe/onerror/onload` oraz `escapeHtmlText` zamienia znaczniki na encje.
- MUTACJA 1 (wyłączona tokenizacja top5 w `techDiscoveryNotice.ts`) → `FAIL: [A] zero gołych nazw…`, chipów 269 (zamiast 348). Test czerwienieje.
- MUTACJA 2 (usunięte dopiski `ALIASES`) → `FAIL: [A]`, chipów 338. Test czerwienieje.
- Przywrócono kod po mutacjach (przed commitem).
- Istniejące testy kart/okna, po zmianach: `tech-cards-top5-test` 595 pass / 0 fail (przed poprawką FORMS: 592/3 — spadek wynikał z tych zmian, naprawiony); `entity-cards-yield-icons-test` 27/0; `entity-cards-yield-icons-real-render-test` 186/0; `entity-cards-resource-icons-real-render-test` 199/0; `entity-card-contract-test` 75/0; `entity-cards-resource-icons-test` 26/0; `entity-card-historia-section-test` 36/0; `tech-discovery-card-click-test` 13 PASS/0; `tech-discovery-card-real-click-test` 12 PASS/0.
- `tech-discovery-badge-diorama-test` → `61 PASS, 2 FAIL` — obie porażki (B2 „Hutnictwo żelaza” przecięcie z elipsą gruntu; (c1) diorama 209px zamiast 190px) występują TAKŻE na bazie `6ade0f0ec` bez moich zmian (sprawdzone przez tymczasowe cofnięcie dwóch plików źródłowych i ich ponowne nałożenie). PRZED-ISTNIEJĄCE, nie z tego tematu.
- `git diff --check` → czysto.

## ZAŁOŻENIA (luki rozstrzygnięte w raporcie)

1. Oryginalny dispatch `00-dispatch.md` NIE istnieje w `origin/main` (`git show origin/main:…` → „does not exist”). Źródłem zakresu był DODATEK z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`00-dispatch-DODATEK-claude.md`), zgodnie z jego treścią.
2. Zakres „zero gołych nazw” = widoczny tekst okna z pominięciem: (a) chipów (nazwa w title/aria-label), (b) prozy „Rys historyczny” (poza sekcjami kart z plonami), (c) nazw własnych (technologie, budynki, ulepszenia terenu, jednostki, cuda, „Kamień Ha'amonga”, „Odlewnia/Kuźnia/Kopalnia … żelaza/brązu/złota”), (d) nazw epok (po „Epoka/epoce/epoki”, wielka litera w środku zdania — ta sama reguła co `eraGuard` w `resourceRows`), (e) ulepszeń wprowadzanych słowem „Postaw …” (np. „Postaw Trzodę”, „Postaw Lamy” — celowo tekst wg `eraGuard`), (f) etykiety „Koszt nauki”.
3. Chip bez kwoty (słowo-surowiec w zdaniu bez liczby) renderuje się jako sam symbol ikony (+ title/aria-label) — tak jak w `yieldSentenceFields`/kartach encji. Nie wprowadzano nowego wzorca.
4. Ścieżka zapasowa `_legacyShowTechDiscoveryNotice` (`buildBody`, uruchamiana WYŁĄCZNIE gdy ścieżka entityCards rzuci wyjątek) NIE została zmieniona i NIE jest objęta testem [A] — NIE_ZMIERZONO.
5. Test używa esbuild bundle + Chromium/Playwright (jak istniejące testy), a NIE Vite HTTP — odstępstwo od dispatchu, bo wszystkie sąsiednie testy kart tak działają.
6. Ikony w teście są stubem (pusty SVG z `data-icon`), więc w zrzucie chipy pokazują lukę zamiast ikony. Prawdziwe ikony brandu NIE zostały zweryfikowane w przeglądarce — NIE_ZMIERZONO.
7. XSS: test sprawdza brak wstrzykniętych elementów w oknie i działanie `escapeHtmlText`, ale NIE podstawia wrogich nazw do danych (dane są statyczne). Fixture z wrogimi nazwami NIE powstał — NIE_ZMIERZONO w pełnym zakresie.
8. Zrzuty: `/tmp/claude-0/screens-okno-odkrycia/okno-odkrycia-Garncarstwo.png` i `…-Rolnictwo.png` (zapisane poza scratchpadem; ścieżka z `SCREENS=`). Zrzut potwierdza układ i treść „Top 5”/„Co możesz teraz zrobić” z chipami-lukami.
9. Commit: dispatch mówi „zacommituj tylko ten plik raportu”. Kod musi mieć SHA do integracji, więc kod+test+helpery poszły w commicie `57d1c7d3b`, a ten raport w osobnym commicie. ZAŁOŻENIE do potwierdzenia przez orkiestratora.

## BLOKADY

Brak blokad wykonawczych. Otwarte do przeglądu przez Evaluatora (nie blokują):
- zmiana oczekiwań w `entity-card-chip-text.cjs` (FORMS) — dopisek danych testu, świadoma konsekwencja nowych chipów surowców w prozie kart;
- dopiski do `resourceRows.ts` zmieniają chipy także w innych kartach encji (zamierzone: „ikony wszędzie”), zweryfikowane istniejącymi testami kart;
- ścieżka zapasowa (pkt 4) i prawdziwe ikony (pkt 6) — NIE_ZMIERZONO.

## RUNDY

1/5 (Operator, Haiku 5.5).

## NASTĘPNY KROK

Evaluator (Sonnet): odtworzyć bramki z sekcji TESTY na commicie `57d1c7d3b` (w tym mutacje 1 i 2), przejrzeć dopiski `FORMS`/`ALIASES`, ocenić pkt 2 i 4 zakresu. Po PASS: Final Control, potem orkiestrator (integracja, `git merge-base --is-ancestor 57d1c7d3b <SHA integracji>`).

DEPLOY/PUSH: NIE WYKONANO
