# 11-dispatch-T3-migracja-technologia — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 (T3 z T1–T10)

TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T3 „MIGRACJA-KARTA-TECHNOLOGII"
Pełny plan: `dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/05-architektura-plan.md`
(sekcja 3, punkt 2 — uzasadnienie dlaczego technologia jest pierwszą migrowaną kartą).
Fundament (T1) już zintegrowany do `main`: `gra/src/ui/entityCards/**`.

GOAL T3: `techDiscoveryNotice.ts` (karta podglądu/odkrycia technologii) zaczyna budować swoją
treść przez `technologyAdapter.ts` (`buildEntityCardData`) i renderować przez wspólny
`renderer.ts` (`renderEntityCard`/`openEntityCard`), zamiast własnego, zduplikowanego
DOM-buildera — BEZ zmiany publicznego API ani zachowania widocznego dla gracza/wołających.

## Zasada nadrzędna (z planu §3)

Publiczne eksporty `techDiscoveryNotice.ts` (przede wszystkim `showTechDiscoveryNotice(...)`)
**zachowują dotychczasową sygnaturę**. Trzej dzisiejsi wołający —
`scienceHubHud.ts` (linie ~283-285, ~454-457, ~625-632) i `techTreeView.ts` (~939-944) —
dostają ZERO zmian. Zmienia się WYŁĄCZNIE wnętrze `showTechDiscoveryNotice`: buduje
`EntityCardData` przez `technologyAdapter.ts`, renderuje przez `renderEntityCard`
(tryb `dialog`, już w pełni zaimplementowany w T1).

## Świadome odstępstwa do zachowania (KRYTYCZNE — nie zgubić przy migracji)

`techDiscoveryNotice.ts:1-44` dokumentuje 5 jawnych odstępstw od pierwotnej makiety
(nagłówek pliku, PRZECZYTAJ PRZED PRACĄ):
1. Pominięty pasek „Efekt".
2. Filtrowanie `Uwagi` deweloperskich przez `isDevOnlyPlayerText()`/`playerFacingNote()` —
   **UWAGA**: ten sam filtr właśnie przechodzi naprawę w osobnym, równoległym temacie
   `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` (runda 2) — jeśli ten branch scali się do `main`
   przed T3, upewnij się że migrujesz na NAJNOWSZĄ wersję filtra (partial-strip, nie
   whole-string-reject), nie na starą.
3. Brak trybu „podgląd" w niektórych wywołaniach.
4. Celowy brak przycisku „Otwórz hub badań".
5. (piąte odstępstwo — przeczytaj plik, nie zgaduj z tego streszczenia).

Adapter `technologyAdapter.ts` (już istnieje jako szkielet z T1) MUSI reużyć
`playerFacingNote()`/`isDevOnlyPlayerText()` (import z `techDiscoveryNotice.ts` lub
wspólnego miejsca, NIE duplikować) dla treści `Uwagi` — inaczej te świadome decyzje
produktowe cicho znikają przy migracji.

## Zakres (allowlist)

- `gra/src/ui/entityCards/technologyAdapter.ts` — wypełnić treścią (dziś szkielet z T1),
  czytając z `tech.json` dokładnie te same pola co dziś czyta `techDiscoveryNotice.ts`
  (`buildBody`, linie ~338-444: Budynki, Jednostki, Ulepszenia terenu, Kolejne technologie,
  Zmiany ekonomiczne, „Co możesz teraz zrobić").
- `gra/src/ui/techDiscoveryNotice.ts` — wnętrze `showTechDiscoveryNotice` zaczyna wołać
  `technologyAdapter` + `renderEntityCard`/`openEntityCard`. Publiczna sygnatura
  `showTechDiscoveryNotice(...)` (parametry, w tym `kind:'preview'`/`onStartResearch`/
  `onOpenTree` z poprzedniej sesji „tryb podglądu") **bez zmian**.
- **Fallback bezpieczeństwa (plan §3)**: zostaw starą implementację budowy DOM pod prywatną
  nazwą (`_legacyBuildBody`/podobnie) osiągalną awaryjnie, dopóki Final Control tego kroku
  nie potwierdzi pełnego parytetu treści — nie usuwaj starego kodu w tym samym commicie
  co przełącznik na nowy.

## Kryterium ukończenia (z planu, tabela §6, wiersz T3)

3 dotychczasowi wołający (`scienceHubHud.ts` ×3 miejsca, `techTreeView.ts`) bez zmian w
swoim kodzie. Wizualny/treściowy diff dla technologii wczesnej/środkowej/późnej (0/1/wiele
odblokowań w każdej sekcji) — treść RÓWNOWAŻNA dzisiejszej (nie identyczny HTML, ale te same
informacje, ten sam zestaw sekcji, te same 5 odstępstw zachowane). Wszystkie istniejące
testy dotyczące karty odkrycia (`technology-discovery-card-visual-test.cjs` i inne
zawierające w nazwie „tech"/„discovery"/„science") nadal zielone.

## Ograniczenia

- Zero zmian w `scienceHubHud.ts`, `techTreeView.ts`, `cityPanel.ts` (T3 dotyczy WYŁĄCZNIE
  `techDiscoveryNotice.ts` + `technologyAdapter.ts`).
- Zero zmian w `gra/src/ui/entityCards/types.ts`/`renderer.ts`/`registry.ts`/`slug.ts` z T1
  — jeśli okaże się że kontrakt z T1 czegoś nie obsługuje, zatrzymaj się i zgłoś to jako
  BLOCK z konkretnym opisem brakującej funkcjonalności zamiast cicho rozszerzać fundament
  w tym samym kroku.
- Nie usuwaj starego kodu budowy DOM — zostaw jako fallback (patrz wyżej).

## Branch

`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (współdzielony branch tematu, T1 już
zintegrowany do `main` — zacznij od `main`, nie od starego stanu brancha sprzed integracji).
