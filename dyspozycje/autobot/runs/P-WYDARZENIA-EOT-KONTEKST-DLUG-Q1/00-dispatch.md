TEMAT:  P-WYDARZENIA-EOT-KONTEKST-DLUG-Q1
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

DECISION_REQUIRED #2 z tematu `R-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1`
(`dyspozycje/PYTANIA-OTWARTE.md` linia 55): kolejka `deferredEotHints`
(`gra/src/game/eot-event-defer.ts`) przenosi dziś WYŁĄCZNIE `{msg,
durationMs}`, gubiąc kontekst bytu (heks/miasto/właściciel) dla zdarzeń końca
tury, które mają realny cel docelowy (kapitulacja z głodu, rajd Ludów Morza
niszczący ulepszenie, dyplomacja AI→gracz) ale nie mogą dziś dostać skrótu
z powodu tej utraty. **ECHO właściciela 2026-09-12: rozszerz
`DeferredEotHint`.**

## GOAL — zakres CELOWO WĄSKI, to dług architektoniczny, nie pełny audyt

Rozszerzyć `DeferredEotHint` (`gra/src/game/eot-event-defer.ts:6-9`) o
opcjonalny kontekst bytu `{hex?: {q:number; r:number}; cityId?: number;
ownerId?: number}`, przeprowadzić go przez jedyne miejsce zapisu
(`showHintMessage()`, `gra/src/main.ts:13895-13899`) i przez
`deferredHintsToSidePanelEvents()` (ten sam plik, linia 140+) tak, żeby
przyszłe/istniejące zdarzenia końca tury MOGŁY nieść ten kontekst tym samym
mechanizmem. **NIE jest w zakresie**: budowa nowego UI „Szczegóły →"/kliku
dla tych kart (osobny, przyszły temat) ani migracja wszystkich ok. 285
miejsc wołających `showHintMessage()` w `main.ts` — to jest fundament pod
przyszłe tematy, nie pełne wdrożenie nawigacji.

## DOKŁADNE MIEJSCA

1. `gra/src/game/eot-event-defer.ts:6-9` — interfejs:
   ```ts
   export interface DeferredEotHint {
     msg: string;
     durationMs: number;
     hex?: { q: number; r: number };
     cityId?: number;
     ownerId?: number;
   }
   ```
2. `gra/src/main.ts:13895-13899` — sygnatura `showHintMessage`:
   ```ts
   function showHintMessage(msg: string, durationMs: number = 3000): void {
     if (shouldDeferEotEvents(endTurnInProgress)) {
       deferredEotHints.push({ msg, durationMs });
       return;
     }
   ```
   Rozszerz o opcjonalny 3. parametr `ctx?: { hex?: {q:number;r:number};
   cityId?: number; ownerId?: number }`, przekaż go do `.push({ msg,
   durationMs, ...ctx })`. Sygnatura pozostaje kompatybilna wstecz (parametr
   opcjonalny) — ok. 285 istniejących wywołań `showHintMessage(...)` w
   `main.ts` NIE wymaga żadnej zmiany.
3. `gra/src/game/eot-event-defer.ts` — `EotEventDraft` (linia 95-101) i
   `deferredHintsToSidePanelEvents()` (linia 140+): przenieś `hex`/`cityId`/
   `ownerId` z wejściowego `DeferredEotHint` przez `drafts`/`merged` do
   zwracanego `SidePanelEvent` (pole opcjonalne — sprawdź typ `SidePanelEvent`
   w `gra/src/ui/sidePanelHud.ts` i rozszerz go analogicznie, jeśli tam
   kontekstu jeszcze nie ma). Uwaga na scalanie duplikatów (`kind:'info'`,
   klucz = `subtitle`, linia 213): gdy dwa hinty o tym samym `subtitle` mają
   RÓŻNY kontekst (różne `cityId`/`hex`), zdecyduj i udokumentuj w raporcie,
   czy scalona karta zachowuje kontekst PIERWSZEGO wystąpienia (rekomendacja —
   prostsze, zgodne z istniejącą regułą „kolejność = pierwsze wystąpienie") —
   NIE komplikuj scalania próbą uśredniania/listowania wielu kontekstów.
4. Dwa konkretne, już nazwane w DECISION_REQUIRED przykłady do faktycznego
   wypełnienia kontekstu (dowód, że mechanizm działa end-to-end, nie tylko
   typ):
   - Kapitulacja głodowa, `main.ts` ok. linii 14404:
     `showHintMessage(capitulationMsg, captureOutcome ? 6000 : 5500);` —
     dodaj `{ cityId: city.id, ownerId: newOwner }` (zmienne już w scope).
   - Rajd Ludów Morza, `main.ts` ok. linii 34701:
     `showHintMessage(\`Rajd Ludów Morza — zniszczone ulepszenie:
     ${destroyed}!\`, 4500);` — dodaj `{ hex: { q: bcmd.toQ, r: bcmd.toR },
     ownerId: bu.ownerId }` (zmienne już w scope).
   Nie szukaj i nie migruj innych wywołań poza tymi dwoma — to celowy,
   minimalny dowód, reszta zostaje bez kontekstu (nadal poprawna, bo pole
   opcjonalne).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `DeferredEotHint` ma trzy nowe opcjonalne pola (`hex`, `cityId`,
   `ownerId`) — istniejący jedyny call site (`main.ts:13897`) i wszystkie
   inne wywołania `showHintMessage` bez 3. argumentu nadal kompilują się i
   działają identycznie jak dziś (zero regresu przy braku kontekstu).
2. `showHintMessage` przyjmuje opcjonalny 3. parametr kontekstu i przekazuje
   go do `deferredEotHints.push(...)`, gdy `shouldDeferEotEvents` jest
   prawdziwe.
3. `deferredHintsToSidePanelEvents()` przenosi kontekst z wejścia na wyjście
   (widoczne na zwróconym obiekcie, pole opcjonalne) — udokumentuj wybraną
   regułę dla scalania duplikatów o różnym kontekście.
4. Oba nazwane przykłady (kapitulacja głodowa, rajd Ludów Morza) faktycznie
   wywołują `showHintMessage` z wypełnionym kontekstem — zweryfikowane
   testem jednostkowym LUB żywą symulacją prowadzącą do obu zdarzeń.
5. Zero zmian w istniejącej logice scalania duplikatów/dedykowanego tytułu
   dyplomacji (`isAiAiTrade`/`isPlayerAiDiplomacy`/`DIPLOMACY_MSG_PREFIX`) —
   te ścieżki nie dostają i nie potrzebują nowego kontekstu w tej rundzie.
6. `tsc --noEmit` 0 błędów.
7. `gra/tools/eot-event-defer-test.cjs` rozszerzony o asercje kontekstu
   (co najmniej: hint z kontekstem zachowuje go na wyjściu; hint bez
   kontekstu wciąż działa jak dziś) — zielony. 5 bramek referencyjnych
   (logic-test, tech-tree-test, research-test, unit-replace-test,
   combat-test) bez regresu.

## DOWÓD

Wynik rozszerzonej bramki `eot-event-defer-test.cjs` (nie wymaga zrzutu
Chromium — to zmiana typu/danych, bez nowego UI w tej rundzie) + krótki log
pokazujący, że symulacja/test doprowadzająca do kapitulacji głodowej i/lub
rajdu Ludów Morza faktycznie tworzy wpis `deferredEotHints` z niepustym
kontekstem.

## Allowlista

- `gra/src/game/eot-event-defer.ts`
- `gra/src/main.ts` (WYŁĄCZNIE sygnatura `showHintMessage` linie 13895-13899
  + dwa nazwane call site'y — kapitulacja głodowa ok. 14404, rajd Ludów
  Morza ok. 34701; ŻADNYCH innych zmian w `main.ts`)
- `gra/src/ui/sidePanelHud.ts` (WYŁĄCZNIE rozszerzenie typu `SidePanelEvent`
  o te same trzy opcjonalne pola, jeśli jeszcze ich nie ma — bez nowej
  logiki renderowania/klikania)
- `gra/tools/eot-event-defer-test.cjs`

Zakazane: `gra/data/*.json`, nowe komponenty UI/przyciski „Szczegóły →" dla
tych kart (osobny przyszły temat), migracja innych wywołań
`showHintMessage`, pliki z sekretami, `docs/decyzje/*.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-wydarzenia-eot-kontekst-dlug`, gałąź
`autobot/P-WYDARZENIA-EOT-KONTEKST-DLUG-Q1`, baza `origin/main`. C-001:
zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie `node
./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo>
--emptyOutDir` oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 400 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
