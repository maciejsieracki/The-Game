# R-SZCZESCIE-AUDYT-D-PROGI-I-BUNT-Q1 — 01-operator (runda 1)

Baza potwierdzona przed pracą: `git log -1` w worktree = `145da701` (dispatch węzła D),
rodzic `cff34055` (domknięcie węzła C) — zgodnie z IZOLACJA w `00-dispatch.md`.

## Wykonano

Nowa bramka `gra/tools/szczescie-audyt-d-progi-bunt-test.cjs` (NIE rozszerzenie
`szczescie-audyt-c-prawo-osiedla-test.cjs` — uzasadnienie w komentarzu nagłówkowym pliku:
inny zakres pomiaru, C mierzy WIELKOŚĆ spadku PorPct, D mierzy PRZEKRACZANIE GRANIC
`porPctBand`/`tierFromPorPct` i odporność `updateRevoltGrace`; dispatch C w ALLOWLIST wymaga
`szczescie-audyt-c-prawo-osiedla-test.cjs niemodyfikowany, jeśli węzeł D dodaje nową bramkę` —
cytat dosłowny z `00-dispatch.md:113-114`, zweryfikowany grepem). Esbuild + realne
`evaluateOrderFromBreakdown`/`porPctBand`/`tierFromPorPct`/`updateRevoltGrace`/`loadRevoltParams`
z `../src/game/society-breakdown.ts`, realne `data/society-params.json`. Zero zmian w
`society-breakdown.ts` i zero zmian w `society-params.json` — audyt nie znalazł problemu
wymagającego fixu (patrz niżej).

## Siatka i wyniki zmierzone (GOAL punkt 1, ten sam zakres co węzeł C)

3 trudności × 3 epoki × pop 1-6 × pełny zbiór potęgowy 6 flag administracji (64) ×
palacTier(4) × garnizon(3) × wojna(2) × udział kultury/religii(3×3) × luksus(3) ×
stolica-easy(2) — **4 478 976 komórek, 3 732 480 przejść pop→pop+1** zmierzonych (ten sam
rząd wielkości siatki co `szczescie-audyt-c-prawo-osiedla-test.cjs`).

- **(a) przeskok >1 pasma `porPctBand` naraz**: NIE znaleziono. Najgorszy zmierzony
  przeskok = **1 pasmo** (easy/era1/pop3→4, `bunt`(7,4%)→`bunt_skrajny`(4,8%)). Mimo że
  węzeł C zmierzył maksymalny surowy spadek PorPct do 20,0 p.p. (podłoga 16,5 p.p.), żadna
  kombinacja na pełnej siatce nie ląduje tak, by przeskoczyć całe 20-punktowe pasmo
  (`lad`/`spokoj`/`napiecie`/`niepokoj` mają szerokość 20 p.p.) — granica 20,0 jest zbyt
  blisko szerokości pasma, żeby faktycznie je przeskoczyć w zmierzonych warunkach.
- **(b) sprzeczny kierunek `tierFromPorPct` vs `porPctBand`**: **0 konfliktów** na całej
  siatce. Potwierdzone też czytaniem kodu: oba progi (90 i 30) są dziś identycznymi literałami
  w obu funkcjach (`society-breakdown.ts:914`/`917` vs `933`/`934`) — rozjazd, o którym mówi
  dispatch, jest dziś czysto teoretycznym ryzykiem przyszłej edycji, nie zmierzonym faktem.
- **(c) `updateRevoltGrace` a ostry skok**: symulacja tur na 4 typach trajektorii
  (stopniowy spadek, ostry jednorazowy skok z wysoka do głębokiego `bunt_skrajny`, ostry skok
  wprost z `lad`, cykl relaps/powrót) × 3 trudności (graceTurns/criticalPorPct realne z
  `society-params.json`: easy 4/6, normal 3/12, hard 2/14) + dodatkowo na REALNEJ trajektorii
  porPct dla pop 1-14 (scenariusz węzła C) na każdej trudności — **18/18 OK**. Rebelia
  (`shouldTriggerRebellion`) NIGDY nie uruchamia się przed pełnymi `graceTurns+1` turami
  ostrzeżenia, niezależnie od tego, czy wejście w `porPct < crit` jest stopniowe czy
  natychmiastowym skokiem o dowolnej głębokości — mechanizm patrzy wyłącznie na wartość
  logiczną `porPct < crit`, nie na wielkość skoku (`updateRevoltGrace`, `:1087-1129`).

**Wniosek: GOAL punkt 3 — (a)/(b)/(c) NIE potwierdzone jako problem.** Progi
`porPctBand`/`tierFromPorPct` i karencja `updateRevoltGrace` są dziś odporne na zmierzony w
węźle C skok PorPct przy +1 mieszkańcu. **PASS bez zmiany kodu/danych** (GOAL punkt 3, dispatch
`00-dispatch.md:87-90`, cytat dosłowny zweryfikowany grepem). Zero zmian w allowlistowanych
kluczach `society-params.json` — nie były potrzebne.

## Testy

- `npx tsc --noEmit` (wersja 5.9.3, `node_modules` symlinkowany z drzewa głównego, C-029) —
  **0 błędów**.
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test`
  33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone.
- Rodzina bramek Prawo/Porządek/Szczęście/Society/border (grep `tools/*prawo*`/`*szczescie*`/
  `*porzadek*`/`*order*`/`*society*`/`*border*`/`*territory*`/`*diplomacy*`, 16 plików):
  14/16 zielone. **2 czerwone, PRE-ISTNIEJĄCE, niezwiązane z tym tematem** —
  potwierdzone przez `git status --short`: worktree ma zero zmian w plikach śledzonych
  (jedyna zmiana to nowy, nieśledzony plik bramki D), więc czerwień istniała już w
  `145da701`/`cff34055` przed jakąkolwiek pracą tej rundy:
  - `border-march-wygasanie-test.cjs`: 22 pass / 4 fail (`onEventDismiss` / borderMarchEventLog)
  - `szczescie-przebudowa-skali-test.cjs`: 515 pass / 4 fail (parytet UI cityPanel == silnik)
  Żaden z tych dwóch plików nie dotyczy `porPctBand`/`tierFromPorPct`/`updateRevoltGrace` — poza
  zakresem tego tematu (C-025), nie naprawiano przy okazji.
- Własna bramka `szczescie-audyt-d-progi-bunt-test.cjs`: **18 OK, 0 FAIL** (czas ~7s).
- `szczescie-audyt-c-prawo-osiedla-test.cjs` pozostaje NIEMODYFIKOWANY i zielony: 15 OK, 0 FAIL.

## Allowlista / zmiany

- Dodano: `gra/tools/szczescie-audyt-d-progi-bunt-test.cjs` (nowy plik, zgodnie z ALLOWLISTA).
- `gra/data/society-params.json`: **bez zmian** (audyt nie znalazł problemu wymagającego fixu).
- `gra/src/game/society-breakdown.ts`: **nietknięty**, zgodnie z zakazem w ALLOWLISTA.

## Blokady

Brak blokad funkcjonalnych. Dwie pre-istniejące czerwone bramki (patrz TESTY) — INFRA/PROCESS,
nie GAME, nie dotyczą tego tematu, nie blokują zamknięcia węzła D.

STATUS: PASS
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-D-PROGI-I-BUNT-Q1
GOAL: zmierzyć odporność porPctBand/tierFromPorPct/updateRevoltGrace na skok PorPct przy +1
mieszkańcu (do 20,0pp, podłoga 16,5pp, zmierzone w węźle C) i naprawić jeśli problem realny.
ZMIANY/COMMIT: nowy plik gra/tools/szczescie-audyt-d-progi-bunt-test.cjs (nieskomitowany,
runda 1, gotowy do integracji); zero zmian w gra/data lub gra/src.
TESTY: tsc --noEmit 0 błędów; 5/5 bramek referencyjnych zielone; własna bramka 18/18 OK;
rodzina Prawo/Porządek/Szczęście/Society 14/16 zielone (2 czerwone pre-istniejące, poza
zakresem, potwierdzone git status).
BLOKADY: brak (funkcjonalnych); 2 pre-istniejące czerwone bramki niezwiązane z tematem.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5 effort high) weryfikuje niezależnie siatkę i wniosek PASS.
DEPLOY/PUSH: NIE WYKONANO
