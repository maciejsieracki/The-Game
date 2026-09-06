# R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1
GOAL: raport z przejęcia miasta mówi prawdę (skarbiec przejęty ≠ pula pracy przepadła),
ma strukturę wierszy zamiast sklejonego zdania, i zostawia trwały wpis w panelu WYDARZENIA
we wszystkich trzech lejkach przejęcia.
MODEL+EFFORT: Opus 5, effort high (temat wizualny + logika trzech lejków, R-PROC-AUTOBOT §9 poz. 6b).
BAZA: a09218ec (potwierdzona `git log -1` przed pracą).

## ZMIANY/COMMIT

- `gra/src/main.ts` — BLOK CZYSTY (`buildCityCaptureReportRows` / `captureReportOneLine` /
  `captureReportShortLine`, markery `BLOK CZYSTY: POCZATEK/KONIEC`, zero odwołań do domknięcia);
  `recordCityCaptureEvent` + `cityCaptureEventDetails` + prefiks `capture-` + resolver skrótu i
  handler kliknięcia (wzorzec `techDoneEventLinkFor`, bo `game/side-panel-event-link.ts` jest poza
  allowlistą); GOAL 1 — komunikat stolicy podaje kwotę i nie twierdzi już, że skarbiec przepadł.
- `gra/src/ui/cityCaptureNotice.ts` — typ `CaptureReportRow`, `reportRowsHtml` (KAŻDA pozycja =
  własny `.civ-ccn-row` z rozłącznymi span-ami etykieta/wartość), `showCaptureReportNotice`.
- `gra/tools/miasto-zdobycie-raport-test.cjs` (NOWY) — 74 asercje.
- `dowody/01..04-*.png` — zrzuty z żywego Chromium.
- **`gra/src/game/capital-capture.ts` NIETKNIĘTY** — nowe pola wyniku nie były potrzebne, wszystkie
  liczby były już w `CapitalCaptureOutcome`. Ekonomia bez zmian (asercje 10a–10d).

## TESTY

- `tsc --noEmit` — 0 błędów.
- `miasto-zdobycie-raport-test.cjs` — **74/74**.
- Nietautologiczność: przywrócenie `'tech(y) przejęte'` w jednym miejscu → **7 FAIL**
  (2d, 2e, 3a, 3f, 4b, 4d, 6a); po cofnięciu 74/74.
- Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
- Rodzina capture/siege/elim (`ls | grep -Ei "capture|zdobyc|siege|oblez|elim|capital|stolic"`),
  zielone: capital-capture 86/86, elimination-toast-merge 54/54, ai-city-capture 14, oblezenie
  27/27, oblezenie-remis 271/271, oblezenie-siege-lifted 16/16, post-capture-law 25/25, siege-ai
  17/17, siege-defenders 12/12, map-siege 6/6, mapa-etykieta-stolicy 47/47, capital-sep 3/3 i
  36/36, _tmp-siege 11/11.
- Czerwone z PARYTETEM na czystej bazie a09218ec (NIE regres): `administracja-stolica` 52/1,
  `barb-city-capture-cluster` 92/1. Pliki `capture-*preview/compare` to narzędzia podglądu
  (wymagają argumentów/artefaktów), nie bramki.

## Zrzuty (obejrzane)

1. `01-modal-eliminacja.png` — ELIMINACJA!/Yan, podtytuł o wyeliminowaniu Chińczyków, sekcja
   BILANS ZDOBYCIA: siedem osobnych wierszy w dwóch kolumnach (Ludność +4, Budynki +3, Złoto ze
   skarbca +1234, Punkty nauki +16, Technologie +2, Moc +418 — zielone; Pula pracy „przepadła —
   nie przechodzi na zdobywcę" — czerwone). Brak „tech(y)", brak „Power", brak zer.
2. `02-modal-zwykle-zdobycie.png` — MIASTO ZDOBYTE/Biskupin, trzy wiersze: Ludność +3, Budynki +2,
   **Łup: brak**. Zero wymyślonej zdobyczy (ECHO 1).
3. `03-panel-wydarzenia-wpis.png` — trzy trwałe karty („Zdobyto miasto: Biskupin / Łup: brak",
   „ELIMINACJA: Chińczycy… / Złoto +1234 · Nauka +16 · Technologie +2 · Moc +418",
   „Utracono miasto: Gniezno" na czerwono), każda ze skrótem **„Raport zdobycia →"**.
4. `04-modal-raport-po-kliknieciu.png` — ten sam bilans otwarty PO turach z karty, jeden przycisk
   „Zamknij" (bez „Wejdź do miasta", bo miasto mogło zmienić właściciela).

## BLOKADY

1. **`gra/tools/eliminacja-lup-kwoty-test.cjs` — CZERWONY Z ZAŁOŻENIA, wymaga decyzji.**
   Bramka wycina z `main.ts` blok po literale
   `` `${skarbiecText}${naukaText} ${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.` ``
   i asercjonuje go DOSŁOWNIE (1a–1f, 3a, sekcja 2). To jest dokładnie ten tekst, którego usunięcia
   żąda GOAL 2 (E3/E4). Plik jest POZA allowlistą, więc go nie ruszałem. Na bazie zielony (24/24) →
   formalnie regres, merytorycznie bramka przeterminowana. Jej sens (konkretne kwoty złota/nauki
   zamiast ogólników) jest przejęty przez asercje 1b, 3c, 3f, 3g nowej bramki.
   **Potrzebna decyzja: dopisać `gra/tools/eliminacja-lup-kwoty-test.cjs` do allowlisty w rundzie 2
   (przepisanie asercji na nowy kształt) albo świadome wycofanie tej bramki.**
2. Brak innych. (Rodzina panelu wydarzeń — dotknąłem `getEventLink`/`onEventClick` — też zielona:
   `side-panel-event-link` 34/34, `eot-event-defer` 33/33, `important-event-cards` 10/10 + regression
   PASS, `sidepanel-event-przekierowania-real-render` 51/51, `sidepanel-event-header-wydarzenie-real-render`
   23/23, `sidepanel-blocking-card-cutoff-real-render` 47/47, `sidepanel-diplo-dismiss-real-render` 35/35.
   Trzy ostatnie robią pełny `vite build` — ok. 5 min każda, uruchamiać z osobnym budżetem czasu.)

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (rozstrzygnięcie blokady 1 przed werdyktem).
DEPLOY/PUSH: NIE WYKONANO
