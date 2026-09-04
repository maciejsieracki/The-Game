TEMAT: R-CIVPEDIA-KARTY-SPOJNOSC-Q1-B
RUNDA: 1 (nie zużyta — STOP przed rundą wg reguły konfliktu kontraktu)
DATA: 2026-09-04

KONFLIKT (bez proponowanego rozwiązania, wyłącznie opis)

Dispatch (`00-dispatch.md`, RECON) zakłada, że karta jednostki otwierana z mapy jest
renderowana WYŁĄCZNIE przez własny, niezależny arkusz `UNIT_INFO_CARD_CSS` i że
`.unit-info-card{width:...}` jest żywą regułą stosowaną do faktycznie renderowanej
karty. Żywy test (Playwright/Chromium,
`gra/tools/unit-info-card-viewport-height-real-render-test.cjs`) pokazuje inaczej:

- `buildUnitInfoCard()` (wołane przez `showUnitInfoCardDialog()`) w normalnej ścieżce
  (bez wyjątku) zwraca kartę zbudowaną przez `buildUnitInfoCardViaEntityCard()`
  (`unitInfoCard.ts:68-96`), która woła `renderEntityCard()` z
  `entityCards/renderer.ts`. Element root ma `className = "entity-card entity-card-unit"`
  (potwierdzone: `card.className` w żywym DOM), NIE `"unit-info-card"`.
- Selektor `.unit-info-card` z `UNIT_INFO_CARD_CSS` (linia 334 przed zmianą) dotyczy
  WYŁĄCZNIE `_legacyBuildUnitInfoCard()` (fallback uruchamiany tylko przy rzuconym
  wyjątku ze ścieżki entityCards) — w normalnej ścieżce jest martwym CSS.
- Żywą regułą szerokości dla faktycznie renderowanej karty jest `.entity-card{width:
  min(434px,calc(100vw - 32px))}` w `entityCards/renderer.ts:563` — plik jawnie
  zakazany w allowliście tego węzła („własny węzeł -A").
- Pomiar żywy (Playwright, viewport 1280px, jednostka "Jeździec chiński", 3 wysokości
  700/900/1200px): `cardRect.width === 436` (nie 660) na wszystkich trzech —
  potwierdza że zmiana `.unit-info-card{width:660px}` (wykonana w rundzie 1) NIE ma
  żadnego efektu na faktycznie renderowaną kartę.

Sprzeczność: GOAL pkt 1 + kryterium końca 3 (szerokość referencyjna 660px zmierzona
`getBoundingClientRect()` na żywej karcie) wymaga zmiany reguły stosowanej do klasy
`.entity-card`/`.entity-card-unit`, a allowlista tego węzła dopuszcza WYŁĄCZNIE trzy
konkretne reguły (`.unit-info-card`/`.unit-info-card-dialog`/`.unit-info-card-backdrop`)
i wprost zakazuje zmiany `entityCards/renderer.ts`. Nie da się spełnić kryterium 3 bez
naruszenia allowlisty tego węzła.

CHARAKTER KONFLIKTU
Czysto inżynierski/scope — recon dispatchu nie uwzględnił migracji na entityCards
(widoczne w kodzie jako `unit-info-card-entitycard-migration-test.cjs`, już zielony,
świadczący że migracja jest zastanym stanem, nie regresją tego węzła). Brak wpływu na
balans/gameplay — pożądany efekt końcowy (660px, spójność z kartą technologii) jest już
uzgodniony w GOAL, sporny jest WYŁĄCZNIE plik/selektor do zmiany i podział pracy
względem węzła -A (który ma wyłączność na `entityCards/renderer.ts`). Kwalifikuje się
do ścieżki lekkiej (jedna propozycja do ABC), nie pełnego turnieju C-018.

CO JEST ZROBIONE I ZWERYFIKOWANE (nie dotyczy konfliktu, w pełni w allowliście)
GOAL pkt 2+3 (wysokość dialogu 80vh + bezpieczne centrowanie backdropu z fallbackiem
scrolla) — dokładnie ten mechanizm zgłoszony przez właściciela (karta "Taran" ucięta
bez scrolla) — zaimplementowane w `gra/src/ui/unitInfoCard.ts` (WYŁĄCZNIE trzy
dozwolone reguły) i zweryfikowane żywo na 700/900/1200px z bogatą jednostką: dialog
ma stałą wysokość niezależną od treści, ostatnia sekcja w pełni osiągalna scrollem,
zamknięcie (Esc/przycisk/klik w backdrop) bez regresji. Szczegóły w raporcie Operatora.

DECYZJA WYMAGANA OD WŁAŚCICIELA/ORKIESTRATORA
Jak rozwiązać kryterium szerokości 660px bez naruszenia podziału allowlist -A/-B:
(a) rozszerzyć allowlistę -B o nową regułę override `.entity-card-unit{width:...}`
    WEWNĄTRZ `unitInfoCard.ts` (wzorzec już istnieje w tym pliku dla medalionu 3D,
    linie 392-398 — scoped override bez dotykania `renderer.ts`), lub
(b) przenieść zmianę szerokości do węzła -A (`entityCards/renderer.ts`, współdzielony
    z kartą technologii/budynku), lub
(c) inna decyzja właściciela.
Nie proponuję rozwiązania — zgodnie z regułą decision-abc.md, to wyzwalacz ABC, nie
substytut decyzji.
