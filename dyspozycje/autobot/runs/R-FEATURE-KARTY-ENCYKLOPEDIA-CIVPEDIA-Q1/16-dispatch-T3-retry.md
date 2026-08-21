# 16-dispatch-T3-retry — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 (T3, druga próba po T1b)

TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T3 „MIGRACJA-KARTA-TECHNOLOGII"
(druga próba — pierwsza zablokowała się na niekompletnym kontrakcie, patrz `12-operator-T3.md`;
kontrakt rozszerzony w T1b, zintegrowany do `main`, patrz `14-operator-T1b.md`/`15-final-control-T1b.md`).

Oryginalny pełny zakres nadal obowiązuje: `11-dispatch-T3-migracja-technologia.md`
(PRZECZYTAJ W CAŁOŚCI — zawiera zasadę nadrzędną o niezmienianiu publicznej sygnatury,
5 świadomych odstępstw produktowych do zachowania, i regułę fallbacku).

## Co się zmieniło od pierwszej próby

`gra/src/ui/entityCards/types.ts` i `renderer.ts` teraz obsługują (T1b, już w `main`):
- `EntityCardSection.collapsible`/`openDefault`/`highlighted` — akordeon realnie działa.
- `EntityCardRow.icon` (SVG per wiersz, wstawiane jako markup).
- `EntityCardRow.trailing` (tekst po prawej, osobny od `value`).
- `EntityCardRow.badge` (`{kind:'ok'|'warn'|'muted', label}` per wiersz).
- `EntityCardSection.previewLimit` + `EntityCardData.compactHeaderOnExpand` (paginacja
  „Pokaż pozostałe N" ze sprzężeniem do kompaktowego nagłówka karty).
- `EntityCardSection.layout: 'grid' | 'pills'` (pigułki z checkmarkiem dla Wymagań).

Te 6 luk z pierwszej próby (`12-operator-T3.md`, sekcja „Powód BLOCK") powinny być teraz
w pełni pokryte. Jeśli podczas mapowania `techDiscoveryNotice.ts` na `technologyAdapter.ts`
okaże się, że KTOŚ z tych 6 mechanizmów nadal nie wystarcza (np. kształt danych nie pasuje
1:1) — to jest dozwolone doprecyzować SPOSÓB UŻYCIA istniejących pól w adapterze, ale NIE
dodawać nowych pól do `types.ts`/`renderer.ts` bez ponownego zatrzymania się i zgłoszenia
(tym razem powinno być rzadkie, bo T1b projektowano dokładnie pod te 6 przypadków).

## Zakres (bez zmian od oryginalnego dispatchu)

- `gra/src/ui/entityCards/technologyAdapter.ts` — wypełnić treścią, czytając `tech.json`
  dokładnie jak dziś `techDiscoveryNotice.ts::buildBody` (linie ~338-444: Budynki, Jednostki,
  Ulepszenia terenu, Kolejne technologie, Zmiany ekonomiczne, „Co możesz teraz zrobić").
- `gra/src/ui/techDiscoveryNotice.ts` — wnętrze `showTechDiscoveryNotice` woła adapter +
  `renderEntityCard`/`openEntityCard`. Publiczna sygnatura BEZ zmian.
- Zostaw starą implementację jako fallback pod prywatną nazwą do czasu potwierdzenia
  parytetu przez Final Control tego kroku.

## Kryterium ukończenia

3 dotychczasowi wołający (`scienceHubHud.ts` ×3, `techTreeView.ts`) bez zmian.
`technology-discovery-card-visual-test.cjs` (48 asercji) zielony — TERAZ na aktywnej ścieżce
(nowej), nie tylko na fallbacku. Wszystkie 5 świadomych odstępstw z nagłówka
`techDiscoveryNotice.ts` zachowane i zweryfikowane jawnie w raporcie.

## Ograniczenia

Zero zmian w `scienceHubHud.ts`/`techTreeView.ts`/`cityPanel.ts`. Zero zmian w
`entityCards/types.ts`/`renderer.ts`/`registry.ts`/`slug.ts` — jeśli naprawdę czegoś brakuje,
BLOCK z konkretnym opisem, nie cicha rozbudowa.

## Branch

`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (świeżo utworzony z `main` po integracji
T1+T1b — zacznij stąd, nie od starego stanu brancha sprzed T1b).
