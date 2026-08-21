# 19-dispatch-T4-migracja-jednostka-mapa — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 (T4 z T1–T10)

TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T4 „MIGRACJA-KARTA-JEDNOSTKI-MAPA"
Pełny plan: `05-architektura-plan.md` (sekcja 3, punkt 3 — **NAJWYŻSZE RYZYKO w całym planie**,
sekcja 7 punkt 1 — analiza mechanizmu 3D). Fundament T1+T1b w `main`. T3 (karta technologii)
zmigrowana i zdeployowana (FALA 307) — dowód że kontrakt/wzorzec migracji działa.

GOAL: `unitInfoCard.ts` (`buildUnitInfoCard`/`showUnitInfoCardDialog`) zaczyna budować treść
przez `unitAdapter.ts` i renderować przez wspólny `renderer.ts`, zamiast własnego DOM-buildera
— BEZ zmiany publicznej sygnatury, BEZ utraty 3D-podglądu jednostki.

## KRYTYCZNE — mechanizm 3D-podglądu (przeczytaj PRZED jakąkolwiek zmianą)

`unitInfoCard.ts:150-162` (stan przed T4) montuje podgląd 3D **imperatywnie, bezpośrednio po
`appendChild`** slotu w DOM: `mountUnitMiniPreview(previewEl, unit, ownerColor, fallbackMsg)`.
To NIE jest generyczny skan hooków z `main.ts` — jest to wywołanie w konkretnym miejscu cyklu
życia DOM. Kontrakt z T1 ma dokładnie na to wariant medalionu:
`{kind:'unit3d', mount: (slot: HTMLElement) => void}` (`types.ts`).

**Twarda zasada**: `renderer.ts` (już istniejący kod z T1, NIE zmieniaj go w tym kroku chyba
że okaże się że mount faktycznie następuje w złej kolejności) musi wywołać `medallion.mount(
slotEl)` DOPIERO PO faktycznym `appendChild` tego slotu do żywego DOM — jeśli wywołasz
wcześniej, Three.js dostaje odłączony element i podgląd milknie **bez błędu w konsoli**
(cichy fail, nie crash — szczególnie podstępne, testuj wizualnie/przez `run`, nie tylko przez
brak wyjątku). Zweryfikuj to jawnie w raporcie (np. przez log/asercję kolejności wywołań).

## Zasada nadrzędna (jak w T3)

Publiczne eksporty (`buildUnitInfoCard`, `showUnitInfoCardDialog`) **zachowują dotychczasowe
sygnatury**. Jedyny dzisiejszy wołający, `main.ts:18799` (klik na jednostce na mapie),
dostaje ZERO zmian.

## Zakres

- `gra/src/ui/entityCards/unitAdapter.ts` — wypełnić treścią (dziś szkielet z T1), czytając
  `units.json` dokładnie tak jak dziś czyta `unitInfoCard.ts` (statystyki, koszt, utrzymanie,
  **„Kontry"** — `unitInfoCard.ts:190`, pole które NIE istnieje w drugiej implementacji karty
  jednostki w `cityPanel.ts` — zachować, to jest część zakresu T4, nie T6).
- `gra/src/ui/unitInfoCard.ts` — wnętrze `showUnitInfoCardDialog`/`buildUnitInfoCard` woła
  adapter + `renderEntityCard` z medalionem `{kind:'unit3d', mount: ...}`. Sygnatura BEZ zmian.
- Zostaw starą implementację jako fallback pod prywatną nazwą, dopóki nie potwierdzisz
  parytetu (wzorem `_legacyShowTechDiscoveryNotice` z T3).

## Kryterium ukończenia

`main.ts:18799` bez zmian. **3D-podgląd faktycznie się montuje i renderuje** — zweryfikowane
NIE TYLKO brakiem błędu w konsoli (cichy fail nie rzuca wyjątku), ale realnym sprawdzeniem że
canvas/WebGL kontekst faktycznie zawiera geometrię (np. przez skill `run` z realnym klikiem
na jednostkę na mapie i zrzutem ekranu, albo test asercji na `renderer.domElement`/liczbie
trójkątów jeśli taki wzorzec już gdzieś istnieje w testach 3D tego repo — sprawdź
`unit-info-card-*-test.cjs` i podobne). Parytet wierszy udokumentowany (wszystkie pola z
dzisiejszej karty obecne w nowej, w tym „Kontry").

## Ograniczenia

- Zero zmian w `main.ts`, `cityPanel.ts`, `entityCards/types.ts`/`renderer.ts`/`registry.ts`/
  `slug.ts` — jeśli kontrakt czegoś nie obsługuje (mimo T1b), STATUS: BLOCK z konkretnym opisem.
- **Nie migruj jeszcze** `buildUnitDetailCard` w `cityPanel.ts` (druga implementacja karty
  jednostki, w panelu rekrutacji miasta) — to jest T6, osobny, kolejny temat. T4 dotyczy
  WYŁĄCZNIE karty jednostki na mapie.
- Zanotuj w raporcie znane, świadome różnice między T3 (temat pinowany testem, ale test nie
  testował aktywnej ścieżki — patrz `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`) i tym
  krokiem: jeśli istniejące testy `unit-info-card-*.cjs` mają ten sam problem (string-match
  na źródle zamiast realnego DOM), zgłoś to explicite, nie milcz.

## Branch

`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (świeży branch z `main` po integracji
T1+T1b+T3).
