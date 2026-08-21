# 06-dispatch-T1-kontrakt — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 (T1 z T1–T10)

TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T1 „KONTRAKT-KARTA-ENCJI"
Pełny plan architektury (PRZECZYTAJ W CAŁOŚCI przed pracą):
`dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/05-architektura-plan.md`

GOAL T1: zbudować FUNDAMENT wspólnego kontraktu karty encji — WYŁĄCZNIE nowe pliki, zero
edycji jakiejkolwiek istniejącej karty (`unitInfoCard.ts`, `cityPanel.ts`, `techDiscoveryNotice.ts`
zostają całkowicie nietknięte w tym kroku). Nic dzisiejszego jeszcze go nie woła — zero ryzyka
regresji.

## Zakres (plików do UTWORZENIA, nie edycji)

- `gra/src/ui/entityCards/types.ts` — typy `EntityKind`, `EntityCardData`, `EntityCardSection`,
  `EntityCardCtx` (patrz plan §1, dokładne kształty tam podane — trzymaj się ich literalnie,
  to nie jest miejsce na własną interpretację, plan już przeanalizował realny kod).
- `gra/src/ui/entityCards/slug.ts` — skonsolidowana funkcja `slugify()`. Plan (§2) wskazuje
  DWIE istniejące, niezależne implementacje: `slugify()` prywatne w `sciencePicker.ts:99`
  (NFD-strip) i `slugifyImprovementLabel()` w `game/research.ts:199` (jawna tabela
  PL_DIACRITICS). PRZED konsolidacją zweryfikuj że obie dają IDENTYCZNY wynik na wszystkich
  realnych polskich nazwach w `tech.json`/`terrain-improvements.json`/`units.json` (ą/ć/ę/ł/ń/
  ó/ś/ź/ż) — jeśli się różnią na którymkolwiek realnym wpisie, zatrzymaj się i zgłoś to jako
  BLOKADĘ w raporcie zamiast cicho wybierać jedną wersję (to realne ryzyko dryfu slugów opisane
  w planie, `research.ts` już na nich polega przy bramkowaniu budowy ulepszeń).
- `gra/src/ui/entityCards/registry.ts` — resolvery per-kind (`id → surowy wiersz`) wg planu §2:
  building z `buildings.json` (pole `id`), improvement z `terrain-improvements.json` (klucz
  obiektu), technology REUŻYWAJĄCY istniejący `TECH_MAP`/`techNameFromSlug` z `sciencePicker.ts`
  (NIE duplikować), unit — nowa `Map<slug, UnitDef>` budowana raz, analogiczny wzorzec do
  `TECH_MAP`.
- `gra/src/ui/entityCards/renderer.ts` — `renderEntityCard(data: EntityCardData): HTMLElement`,
  jeden DOM-builder dla wszystkich 4 kinds, plus `openEntityCard(kind, id, opts)` (sygnatura
  dokładnie jak w planie §1, tryby `dialog`/`inline`/`hover`). W tym kroku wystarczy że renderer
  obsługuje tryb `dialog` w pełni (kolejne tryby dochodzą w T5) — ale sygnatura `opts.mode` musi
  już istnieć w typach.
- Adaptery (`unitAdapter.ts`, `buildingAdapter.ts`, `technologyAdapter.ts`, `improvementAdapter.ts`)
  w tym kroku mogą być SZKIELETAMI (funkcja istnieje, zwraca poprawny typ, ale niekoniecznie
  kompletne dane) — pełne wypełnienie treścią następuje w T3–T7b, każdy adapter osobnym tematem.
  NIE przenoś jeszcze logiki z `unitInfoCard.ts`/`cityPanel.ts`/`techDiscoveryNotice.ts` — to
  jest właśnie zakres kolejnych tematów (T3+), nie tego.

## Kryterium ukończenia (z planu, tabela §6, wiersz T1)

Typy się kompilują (`tsc --noEmit` czysty); renderer ma fixture'y testowe (nowy plik
`gra/tools/entity-card-contract-test.cjs` lub podobny) dla wszystkich 4 kinds w trybie
`dialog` z przykładowymi danymi — **żadna istniejąca karta go jeszcze nie woła**. Zero zmian
w `unitInfoCard.ts`, `cityPanel.ts`, `techDiscoveryNotice.ts`, `scienceHubHud.ts`,
`techTreeView.ts` (T2 już zdeployowany osobno, nie dotykaj go ponownie).

## Ograniczenia krytyczne

- Zero edycji istniejących plików kart — to jest fundament, nie migracja. Migracja (T3+) to
  osobne, kolejne dispatch'e, dopiero PO tym że T1 przejdzie Final Control.
- Jeśli podczas weryfikacji slugów (patrz wyżej) znajdziesz realny dryf między dwoma
  algorytmami na prawdziwych danych — zatrzymaj się, zgłoś BLOKADĘ z konkretnymi przykładami
  rozbieżnych nazw, NIE wybieraj cicho jednej wersji.
- Napisz test kompilacyjny/fixture, nie tylko "kod się kompiluje" — Evaluator musi mieć czym
  zweryfikować że renderer faktycznie buduje sensowny DOM dla przykładowych danych 4 kinds.

## Branch

`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (współdzielony branch tematu, kontynuacja
po fazie 1/T2 już zdeployowanej w FALA 305).
