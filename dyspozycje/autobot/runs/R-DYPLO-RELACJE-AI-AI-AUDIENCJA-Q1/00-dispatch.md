TEMAT:  R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel: „Wiesz, czego brakuje mi w dyplomacji? Gdy rozmawiam z inną
cywilizacją, nie widzę, z jakimi innymi cywilizacjami prowadzi wojnę lub jest
w sojuszu. To by się przydało. […] W przyszłości wprowadzimy jednostkę
szpiega, która będzie właśnie takie dane dostarczać. Dopiero wtedy będzie to
dostępne, ale na razie w fazie testowej udostępniamy dostęp do wszelkich
informacji."

Ten dispatch pokrywa WYŁĄCZNIE węższą część życzenia: wojny/sojusze (i handel
z traktatów, bo dane są tożsame). Szerszy „drill-down" do realnych szlaków
handlowych i innych zależności to ŚWIADOMIE OSOBNY, późniejszy temat (patrz
REJESTR, sekcja tego zgłoszenia) — NIE wchodzi w zakres tej rundy.

## RECON (wykonany, nie powtarzać)
Dane i UI już częściowo istnieją, w OSOBNYM miejscu niż to, o które prosi
właściciel:
- `gra/src/game/diplomacy-pair-summary.ts`: `warPartnerIdsForOwner(relations,
  ownerId, isVisiblePartner)` i `dealPartnerIdsForOwner(deals, ownerId,
  'sojusz'|'handel', isVisiblePartner)` — generyczne, silnikowe, przetestowane
  funkcje działające dla DOWOLNEGO `ownerId` (czytają globalne
  `diplomacyRelations`/`activeDeals`).
- `gra/src/main.ts:6099` `buildDiploPairSummaryData(ownerId)` — woła obie
  funkcje z `isVisiblePartner = (id) => id === 0 || (isActiveDiploOwner(id) &&
  getDiplomaticContacts().has(id))` (mgła wojny — partner niespotkany/
  wyeliminowany jest ukryty), zwraca `DiploPairSummaryData { wars, alliances,
  deals, … }` (typ w `gra/src/ui/diplomacyPanel.ts:381`).
- `gra/src/ui/diplomacyPanel.ts` `showDiploPairSummary()`/`renderPairSummary()`
  (~360-534) renderują TE dane jako pop-up „W stanie wojny z / W sojuszu z /
  Handluje z" — ALE tylko w kroku POŚREDNIM przed audiencją (kliknięcie
  cywilizacji na liście „Znane frakcje"), a przycisk „Zaproponuj spotkanie…"
  zamyka ten pop-up i otwiera właściwą audiencję
  (`gra/src/ui/diplomacyAudience.ts`), gdzie ten widok ZNIKA — to jest
  dokładnie luka, o której mówi właściciel („gdy rozmawiam z cywilizacją, nie
  widzę…").
- `diplomacyAudience.ts`: `DiplomacyAudienceState` (interfejs, linia 78) i
  `otherCardHtml(st, otherBon)` (~linia 1312) renderują prawą kartę
  („rozmówca") z sekcjami Atrybuty / Potencjał sojuszniczy / „Relacje z Tobą"
  / Dobra handlowe — BRAK sekcji „z kim jeszcze" wojna/sojusz/handel.
- `dealPartnerIdsForOwner` dziś obsługuje tylko `'sojusz'`/`'handel'` — brakuje
  kategorii paktu o nieagresji (`'nap'` czy jak nazwany w `ActiveDeal.typ`).

## GOAL
1. Dodaj do `DiplomacyAudienceState` nowe, opcjonalne pole niosące te same
   trzy listy partnerów co `DiploPairSummaryData` (wars/alliances/deals) DLA
   ROZMÓWCY (`otherOwnerId`), wypełniane w main.ts wywołaniem
   `buildDiploPairSummaryData(otherOwnerId)` (już istniejące, gotowe) przy
   budowaniu stanu audiencji.
2. W tej JEDNEJ, nowej ścieżce (dane dla audiencji, NIE pop-up przed
   audiencją) pomiń filtr `isVisiblePartner` — pokaż WSZYSTKIE wojny/sojusze/
   handel rozmówcy bez ograniczenia widoczności/mgły wojny (decyzja
   właściciela: „na razie w fazie testowej udostępniamy dostęp do wszelkich
   informacji" — docelowo ma to być bramkowane jednostką szpiega, na razie
   bez bramki). Najprostszy sposób: nowy, osobny wariant wywołania
   `buildDiploPairSummaryData` (np. dodatkowy opcjonalny parametr
   `revealAll: boolean` w main.ts, domyślnie `false`, używany WYŁĄCZNIE przy
   budowaniu stanu audiencji) — pop-up `showDiploPairSummary` (poza
   audiencją) MA ZOSTAĆ nietknięty, z mgłą wojny jak dotychczas.
3. W `otherCardHtml` (`diplomacyAudience.ts` ~1312) dodaj nową sekcję (wzorem
   istniejących sekcji tej karty, styl `da-sec-title` + lista wierszy —
   NIE trzeba kopiować CSS `dps-*` z `diplomacyPanel.ts`, użyj konwencji już
   obecnej w tym pliku) tytułowaną np. „Relacje z innymi" z trzema
   podsekcjami: W stanie wojny z / W sojuszu z / Handluje z — pusta lista =
   „Brak." (jak w istniejącym `renderPairSummarySection`).
4. Rozszerz `dealPartnerIdsForOwner` (`diplomacy-pair-summary.ts`) o trzecią
   kategorię paktu o nieagresji, jeśli w `ActiveDeal` istnieje odpowiadające
   pole `typ`/`rodzaj` — dodaj tę sekcję też w nowym widoku audiencji. Jeśli
   po realnym sprawdzeniu struktury `ActiveDeal` okaże się, że NAP nie jest
   reprezentowany jako `ActiveDeal` tylko inaczej (np. tylko przez
   `diplomacyRelations` status), pomiń ten punkt i udokumentuj dlaczego w
   raporcie — nie zgaduj kształtu danych.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy zrzut z headless Chromium: otwarcie audiencji z dowolną cywilizacją
   AI, która ma choć jedną wojnę/sojusz/umowę handlową z TRZECIĄ stroną (nie
   z graczem) — nowa sekcja na karcie rozmówcy pokazuje tę relację.
2. Ta sama relacja jest widoczna NIEZALEŻNIE OD tego, czy gracz nawiązał
   kontakt z tą trzecią stroną (dowód: scenariusz z partnerem, którego gracz
   NIGDY nie odkrył — pop-up `showDiploPairSummary` by go ukrył, nowa sekcja
   audiencji ma go pokazać).
3. Pop-up `showDiploPairSummary` (lista „Znane frakcje", PRZED audiencją)
   zachowuje się DOKŁADNIE jak dotychczas — nadal ukrywa niespotkanych/
   wyeliminowanych partnerów (zero regresu, dowód: istniejący test/manualna
   próba z tym samym scenariuszem z punktu 2 pokazuje różnicę między pop-upem
   a nową sekcją audiencji).
4. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy/rozszerzony test pokrywający punkty 1-3.

## ALLOWLISTA — nic poza tym
`gra/src/ui/diplomacyAudience.ts`, `gra/src/main.ts` (WYŁĄCZNIE miejsce
budowy `DiplomacyAudienceState` dla audiencji + nowy opcjonalny parametr
`buildDiploPairSummaryData`), `gra/src/game/diplomacy-pair-summary.ts`
(WYŁĄCZNIE rozszerzenie `dealPartnerIdsForOwner` o kategorię NAP, jeśli
zasadne — patrz GOAL pkt 4), nowy/rozszerzony plik testowy w `gra/tools/`.
Zakazane bezwzględnie: `gra/src/ui/diplomacyPanel.ts` (pop-up
`showDiploPairSummary`/`buildDiploPairSummaryData`'s DOMYŚLNE zachowanie mają
zostać NIETKNIĘTE — zero zmian widoczne dla tej ścieżki), realne szlaki
handlowe `TradeRoute[]`/`trade-routes.ts` (poza zakresem tej rundy — osobny,
przyszły temat), `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 2 za spełnione bez REALNEGO scenariusza z partnerem
poza mgłą wojny gracza (nie wystarczy scenariusz, w którym gracz akurat zna
wszystkich — trzeba jawnie skonstruować przypadek nieznanego trzeciego
gracza i pokazać, że mimo to się pojawia). Zakaz „naprawiania" tego przez
rozluźnienie `isVisiblePartner` w ISTNIEJĄCYM pop-upie `showDiploPairSummary`
zamiast dodania osobnej ścieżki — to zmieniłoby zachowanie poza zakresem
tematu i naruszyłoby kryterium 3.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla żywego testu w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
