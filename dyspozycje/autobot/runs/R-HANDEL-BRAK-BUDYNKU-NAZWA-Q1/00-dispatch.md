TEMAT:  R-HANDEL-BRAK-BUDYNKU-NAZWA-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel, zrzut panelu „Handel — Szlaki handlowe": wiersze tras bez premii
budynkowej pokazują „5% — brak budynku". Właściciel: „Nie powinno być
napisane 'brak budynku na 5%', tylko konkretnie, jaki budynek brakuje – na
przykład brak targowiska."

## RECON (wykonany, nie powtarzać)
Tekst pochodzi z DWÓCH funkcji w `gra/src/ui/empireDetailPanel.ts`:
- `routeBonusSplitHtml()` (linia 816-828) — druga linia komórki DOCHÓD dla
  POJEDYNCZEJ trasy (zakładka Handel), linia 822: literał
  `5% — brak budynku`.
- `cityBonusSplitHtml()` (linia 840-859) — analogiczny wzorzec zsumowany PER
  MIASTO (zakładka Miasto, sekcja „Handel — szlaki per miasto"), linia 851,
  IDENTYCZNY literał, używany gdy `premia === 0`.

Obie funkcje MAJĄ już poprawny `tip` (atrybut `title`, widoczny na hover) —
np. „Premia 5% z tej trasy czeka na budynek handlowy (Targowisko / Port /
Port wielki) po obu stronach trasy…" — ale to tylko tooltip, nie widoczny
tekst.

Premia 5% odblokowuje się przez DOWOLNY z TRZECH budynków po OBU stronach
trasy: `TRADE_BUILDING_IDS = new Set(['targowisko','port','port_wielki'])`
(`gra/src/game/trade-routes.ts`, `tradeRouteLimitForCity()` ~490-504).
`TradeRoute.budynekOdblokowany` (`trade-routes.ts:96`) to zwykły `boolean` —
NIE niesie informacji KTÓRA strona i KTÓRY z trzech budynków konkretnie
brakuje. Ustalenie tego precyzyjnie (per strona, per brakujący budynek)
wymagałoby nowego pola w typie + nowej logiki w `main.ts`
(`buildEmpireTradeSnap`) czytającej `cityBuilt`/`empireBuiltIdsForOwner` dla
OBU miast trasy — realna, ale nietrywialna zmiana (nowe pole w
`empireDetailTypes.ts`, nowa logika w `main.ts`, zmiana w 2 miejscach
renderu).

Z `gra/data/buildings.json`: `targowisko` = „Targowisko (Rynek)", ZERO
wymagań terenowych (`wymagania: ""`, buduje się WSZĘDZIE) — jest to
JEDYNY z trzech kwalifikujących budynków budowalny w KAŻDYM mieście
(śródlądowym i nadmorskim); `port`/`port_wielki` wymagają wybrzeża/rzeki.
Właściciel we własnym przykładzie („brak targowiska") wskazał dokładnie ten,
uniwersalnie dostępny budynek.

Wzorzec „off"/„brak budynku" jest UŻYWANY WYŁĄCZNIE w tych dwóch funkcjach w
`empireDetailPanel.ts` — nie jest współdzielonym helperem z innymi systemami
(produkcja/nauka), więc naprawa jest w pełni lokalna do tego pliku.

## GOAL
Zmień WIDOCZNY tekst (nie tooltip — tooltip zostaje jak jest, już poprawnie
wymienia wszystkie trzy opcje) w OBU miejscach z generycznego „brak budynku"
na tekst wskazujący KONKRETNY, zawsze osiągalny budynek — „Targowisko" (bo
jest to jedyny z trzech kwalifikujących budynków budowalny w każdym mieście
bez wyjątku, więc wskazanie go jest zawsze trafną, wykonalną podpowiedzią,
niezależnie od tego czy dana trasa jest lądowa czy morska). Przykładowe
brzmienie (Operator dobiera dokładną redakcję, ma być zwięzłe i spójne
stylistycznie z resztą etykiet w tym panelu): „5% — brak: Targowisko" dla
`routeBonusSplitHtml()`, analogicznie w `cityBonusSplitHtml()` gdy
`premia === 0`. NIE zmieniaj treści atrybutu `tip`/`title` w żadnej z dwóch
funkcji — on już poprawnie wymienia wszystkie trzy opcje (Targowisko/Port/
Port wielki), to zostaje jako pełna informacja dla kogoś kto najedzie myszką.

**JAWNIE POZA ZAKRESEM tego tematu** (nie projektuj, nie dodawaj):
- Precyzyjne wskazanie KTÓRA strona trasy (Twoje miasto czy partnera)
  konkretnie nie ma budynku, ani dociąganie per-trasa/per-strona faktycznego
  stanu budynków przez `main.ts`/nowe pole w typie — to nietrywialna zmiana
  danych, świadomie odłożona; wystarczy nazwać UNIWERSALNIE trafną
  podpowiedź (Targowisko), nie precyzyjną diagnozę.
- Zmiana logiki `TRADE_BUILDING_IDS`/`tradeRouteLimitForCity` — nietknięte.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Realny zrzut z żywej przeglądarki: panel „Handel — Szlaki handlowe",
   trasa bez budynku — widoczny tekst zawiera słowo „Targowisko" (nie samo
   „brak budynku"). PRZED/PO.
2. To samo dla zakładki Miasto (sekcja „Handel — szlaki per miasto"), wiersz
   z `premia === 0` i `brakBudynku > 0` — analogicznie.
3. Tooltip (`title`) obu elementów NIEZMIENIONY co do treści (nadal wymienia
   Targowisko/Port/Port wielki) — dowód: diff pokazuje zmianę WYŁĄCZNIE w
   widocznym tekście `<span>...</span>`, nie w zmiennej `tip`.
4. Gałąź „budynek już jest" (`budynekOdblokowany===true` / `premia>0`) w obu
   funkcjach NIEZMIENIONA — zero regresu w treści/wyglądzie tej gałęzi.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.
   Jeśli istnieje test pokrywający dokładnie te stringi (sprawdź
   `gra/tools/` pod kątem `empireDetailPanel`/`handel`/`trade`), zaktualizuj
   go do nowego tekstu — nie zostawiaj czerwonego testu.

## ALLOWLISTA — nic poza tym
`gra/src/ui/empireDetailPanel.ts` (WYŁĄCZNIE funkcje `routeBonusSplitHtml`
i `cityBonusSplitHtml`, wyłącznie widoczny tekst w gałęzi „off"/brak
budynku), istniejący plik testowy pokrywający te stringi, jeśli istnieje
(do aktualizacji, nie do przepisania od zera). Zakazane bezwzględnie:
`gra/src/game/trade-routes.ts`, `gra/src/main.ts`, `gra/src/ui/empireDetailTypes.ts`,
`gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-HANDEL-BRAK-BUDYNKU-NAZWA-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryteriów 1-2 za spełnione na podstawie samego czytania kodu —
wymagany realny zrzut z żywej przeglądarki obu miejsc (zakładka Handel I
zakładka Miasto), nie tylko jednego z dwóch. Zakaz przypadkowej zmiany
treści atrybutu `tip`/`title` przy okazji — kryterium 3 wymaga dowodu że
został nietknięty.

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
