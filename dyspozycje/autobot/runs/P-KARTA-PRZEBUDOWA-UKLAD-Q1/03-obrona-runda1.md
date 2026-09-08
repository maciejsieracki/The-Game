STATUS: OBRONA
DOMAIN: GAME
TEMAT: P-KARTA-PRZEBUDOWA-UKLAD-Q1
GOAL: Wdrożyć zaakceptowany nowy układ (kolejność sekcji) kart budynków i jednostek w `gra/src/ui/entityCards/` — infrastruktura/renderer/adaptery, bez autorstwa nowej treści.

ODPOWIEDŹ NA ZARZUTY EVALUATORA (02-evaluator-runda1.md):

1. [KRYTYCZNY] Brak dosłownej etykiety "Rys historyczny" w DOM (`buildHistoriaEl` renderował
   wyłącznie separator + kursywę, bez nagłówka).
   PRZYJMUJĘ — zarzut trafny, potwierdzony niezależnie żywym Chromium przez Evaluatora
   (`fullTextContainsLabel: false`) i przeze mnie po ponownym odczycie `renderer.ts::buildHistoriaEl`
   (linie 462-471 sprzed poprawki): funkcja budowała wyłącznie `.entity-card-historia-sep` +
   `.entity-card-historia-text`, bez żadnego węzła nagłówkowego. `00-dispatch.md` §4 wymaga
   dosłownie DWUKROTNIE: "WŁASNA nazwana sekcja — NIE 'Historia'/'Historical note' bez etykiety,
   dosłownie nazwana 'Rys historyczny'" — to był niespełniony wymóg wiążącej specyfikacji.

   POPRAWKA (ta sama runda): dodałem w `buildHistoriaEl` nagłówek `<h3 class="entity-card-section-heading">`
   z `<span class="entity-card-section-heading-label">Rys historyczny</span>` — dokładnie ten sam
   wzorzec znaczników co `buildSectionEl` używa dla tytułów sekcji mechanicznych (`renderer.ts:287-290`),
   więc wizualnie spójny z resztą karty mimo że historia nie jest elementem tablicy `sections`.

   DOWÓD z wytworu:
   - Rozszerzony test `entity-card-historia-section-test.cjs`, nowa asercja `[3]`: "fixture: sekcja
     zawiera DOSŁOWNĄ etykietę 'Rys historyczny' w DOM" — szuka dokładnego tekstu w dowolnym potomku
     `.entity-card-historia` (`Array.from(historiaEl.querySelectorAll('*')).some(n =>
     n.textContent.trim() === 'Rys historyczny')`). Wynik: 36/0 (było 35/0 — nowa asercja PASS,
     zero regresji pozostałych).
   - Żywy render Chromium (tymczasowy skrypt esbuild+Playwright, ten sam bundling co test [6]):
     `buildEntityCardData('building','stolarnia',{})` → `{ hasHistoria: true, hasLabel: true }`;
     `buildEntityCardData('unit', unitToSlug('Wojownik'), {})` → `{ hasHistoria: true, hasLabel: true }`.
   - Zrzut ekranu żywej karty jednostki Wojownik z widocznym nagłówkiem "Rys historyczny" (pozycja 4,
     zaraz po sekcji Wymagania): `dowody/02b-karta-jednostki-wojownik-etykieta-fix.png`.

BEZ POZOSTAŁYCH ZARZUTÓW — Evaluator nie zgłosił innych niespełnień; jego raport wprost
potwierdza (kolejność sekcji, pozycja 4 dla wszystkich 4 zweryfikowanych kinds, brak diff
w technologyAdapter/improvementAdapter/wonderAdapter, brak regresji `statuses`/`unitInfoCard.ts`,
brak wymyślonej treści, `tsc --noEmit` czysty, identyczne liczby testów, allowlista zachowana).

ZMIANY TEJ RUNDY (poza allowlistą runda 1): `gra/src/ui/entityCards/renderer.ts` (nagłówek etykiety
w `buildHistoriaEl`), `gra/tools/entity-card-historia-section-test.cjs` (asercja etykiety),
`dyspozycje/autobot/runs/P-KARTA-PRZEBUDOWA-UKLAD-Q1/dowody/02b-*.png` (nowy dowód). Przy okazji
uruchomienia pełnego zestawu testów allowlisty `entity-card-diorama-real-render-test.cjs` nadpisał
zrzuty w `R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/` (temat spoza tej allowlisty) —
PRZYWRÓCONE `git checkout --` przed commitem, worktree czysty poza plikami z allowlisty.

NASTĘPNY KROK: Final Control (żywy zrzut wymagany, temat wizualny).
DEPLOY/PUSH: NIE WYKONANO
