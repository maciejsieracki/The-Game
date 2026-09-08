STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-KARTA-PRZEBUDOWA-UKLAD-Q1
GOAL: Wdrożyć zaakceptowany nowy układ (kolejność sekcji) kart budynków i jednostek w `gra/src/ui/entityCards/` — infrastruktura/renderer/adaptery, bez autorstwa nowej treści.

ZMIANY/COMMIT: Runda 1 wdrożyła nowy układ sekcji (commit `78108abc`). Po zarzucie 1 Evaluatora
(runda 1, KRYTYCZNY — brak dosłownej etykiety "Rys historyczny" w DOM) doprawiłem w TEJ SAMEJ
rundzie: `gra/src/ui/entityCards/renderer.ts::buildHistoriaEl` dostał nagłówek
`<h3 class="entity-card-section-heading"><span class="entity-card-section-heading-label">Rys
historyczny</span></h3>` — ten sam wzorzec znaczników co `buildSectionEl` dla sekcji mechanicznych
(spójność wizualna), wstawiony przed akapitem `.entity-card-historia-text`. Pozycja (indeks 2 w
`data.sections`, czyli pozycja 4 zaakceptowanego układu) bez zmian — zarzut dotyczył wyłącznie
braku etykiety, nie pozycji. Rozszerzyłem też `gra/tools/entity-card-historia-section-test.cjs`
o asercję `[3]` sprawdzającą dosłowny tekst "Rys historyczny" w DOM sekcji historii — luka, którą
Evaluator słusznie wskazał jako niepokrytą przez wcześniejszą wersję testu. Pełna odpowiedź na
zarzut z dowodami: `03-obrona-runda1.md`.

TESTY: `tsc --noEmit` 0 błędów (bez zmian vs runda 1). `entity-card-contract-test` 75/0 (bez
zmian). `entity-card-historia-section-test` 36/0 (było 35/0 — jedna NOWA asercja etykiety,
zero regresji pozostałych 35). `building-detail-card-entitycard-migration-test` 54/1,
`unit-detail-card-entitycard-migration-test` 38/2 — identyczne, pre-istniejące, poza zakresem
FAIL-e co w rundzie 1 (niedotknięte tą poprawką). Żywy dowód Chromium (esbuild+Playwright,
ten sam wzorzec bundlowania co test [6] w `entity-card-historia-section-test.cjs`): renderowane
karty `building/stolarnia` i `unit/wojownik` dają `{ hasHistoria: true, hasLabel: true }` —
etykieta "Rys historyczny" fizycznie obecna w DOM. Zrzut ekranu:
`dowody/02b-karta-jednostki-wojownik-etykieta-fix.png` (widoczny nagłówek "Rys historyczny"
zaraz pod sekcją Wymagania, przed Charakterystyką).

BLOKADY: brak — zarzut Evaluatora poprawiony w tej samej rundzie, dowód dołączony.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator — weryfikacja poprawki (etykieta "Rys historyczny" w DOM) niezależnym
żywym Chromium; przy braku dalszych zarzutów → Final Control.

DEPLOY/PUSH: NIE WYKONANO
