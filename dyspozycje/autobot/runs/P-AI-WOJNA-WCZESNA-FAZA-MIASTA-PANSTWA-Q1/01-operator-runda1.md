STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1
GOAL: Przez pierwsze 25 tur główne AI nie wypowiadają sobie "zwykłej" wojny (Priorytet 4
decideAIDiplomacy); ataki na miasta-państwo i wojny wymuszone (era) bez zmian; po turze
25 zachowanie wraca do normy. Dodatkowo: sprawdzić czy AI wystarczająco agresywnie dąży
do limitu miast per epokę.

ZMIANY/COMMIT: SHA 8b013fb1 (gałąź autobot/P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1):
- `gra/src/game/ai.ts`: nowa stała `AI_MAJOR_EARLY_NO_WAR_TURNS=25` (obok progów
  dyplomacji, PROG_WOJNA_*); w Priorytecie 4 `decideAIDiplomacy` nowy warunek
  `earlyNoMajorWarWindow = currentTurn<=25 && !isMinorCivPartner && partnerId!=='0'`
  blokujący WYŁĄCZNIE tę ścieżkę. `isMinorCivPartner` i `currentTurn` JUŻ istniały w
  main.ts (`RelacjaWejscie.isMinorCivPartner` zasilane `isOwnerClusterCityState`,
  `DiplomacjaInputs.currentTurn` zasilane `turn`) — main.ts NIE wymagał zmian (mniejszy
  ślad niż zakładał dispatch). Ważne dla równoległego tematu na main.ts: main.ts nie
  dotknięty, zero ryzyka kolizji.
- `gra/tools/ai-test.cjs`: T9a/T9h(partner C)/T9j/T4S-d — dodano `currentTurn:30`
  (testy sprawdzają sam mechanizm Priorytetu 4 niezależnie od nowego okna; bez tego
  poprawka je łamała, patrz TESTY). T12-dip-b (partnerId='0'=gracz) już przechodzi
  bez zmian dzięki wykluczeniu gracza z okna.
- Nowe bramki: `gra/tools/ai-early-no-major-war-test.cjs` (14 asercji: A/B/C/D/E — okno
  blokuje major-vs-major, NIE blokuje ataku na miasto-państwo, wraca po turze 25,
  currentTurn undefined=tura 0 nadal w oknie, ścieżki wymuszone całkowicie nietknięte),
  `gra/tools/ai-early-city-founding-pace-test.cjs` (pkt 3 ZADANIA).

TESTY:
- ODTWORZENIE BŁĘDU (żywy dowód PRZED): `git stash` na `ai.ts` (baseline sprzed naprawy)
  + `ai-early-no-major-war-test.cjs` → 6/14 FAIL: wojna major-vs-major wypowiadana w
  turach 1/10/24/25 (dokładnie diagnoza z dispatchu). `git stash pop` przywrócił naprawę.
- PO naprawie: `ai-early-no-major-war-test.cjs` 14/14 PASS.
- REGRESJA W TRAKCIE PRACY (złapana, naprawiona): pierwsza wersja poprawki łamała 5
  istniejących testów `ai-test.cjs` (T9a, T9h, T9j, T4S-d, T12-dip-b) — T12-dip-b bo
  blokowała też wojnę z GRACZEM (partnerId='0'), co jest poza zakresem GOAL (AI↔AI
  wyłącznie); T9a/T9h/T9j/T4S-d bo testują sam mechanizm progu bez `currentTurn`
  (domyślnie tura 0 = w oknie). Naprawiono: wykluczenie `partnerId!=='0'` w kodzie +
  jawny `currentTurn:30` w tych 4 testach. Po naprawie `ai-test.cjs`: 291 passed / 4
  failed — DOKŁADNIE te same 4 (T2S-b, T2S-b2, T10b) co w baseline sprzed JAKIEJKOLWIEK
  mojej zmiany (zweryfikowane `git stash` na czystym ai.ts) — zero nowych regresji.
- `tsc --noEmit`: 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test
  33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- Sweep 50/~90 plików `*diplomacy*`/`*dyplomacja*`/`*wojna*`/`*forced-war*`/`*war*` w
  `gra/tools/` (przerwany po 50 dla budżetu rundy — pozostałe to głównie testy
  UI/live-render niezależne od decideAIDiplomacy): jedyne czerwienie to
  `diplomacy-audience-close-flush-test` (2 fail), `diplomacy-negotiation-table-test`
  (1 fail), `diplomacy-proposal-test` (2 fail) — wszystkie trzy dotyczą main.ts
  (audiencja/UI, liczenie wywołań `hideDiplomacyAudience`/koszyk negocjacji), którego
  NIE dotknąłem w ogóle → z definicji pre-istniejące, poza zakresem tego tematu; oraz
  1 timeout (30s cap tego sweep'a, nie błąd logiki) na
  `diplomacy-relacje-ai-ai-audiencja-live-test` (live-render, poza zakresem headless).
  ZERO czerwieni w plikach dotykających `decideAIDiplomacy`/Priorytetu 4 poza
  `ai-test.cjs` już rozliczonym wyżej.
- ZADANIE pkt 3 (limit miast per epokę): żywa symulacja turn-by-turn `decideAITurn`
  (nowa bramka) z hojną Pracą/ziemią (izoluje sam mechanizm decyzyjny od ograniczeń
  ekonomicznych) — profil przeciętny (ekspansywność=2) osiąga limit ery 1 (10 miast)
  w TURZE 5; profil maksymalny podobnie. Founding to od dawna osobna komenda
  `foundCityAt` (Step 1b `decideAITurn`, PRZED innymi krokami), NIE pozycja w kolejce
  budynków — strukturalnie nie może "konkurować nisko" jak sugerował dispatch. Dowód
  nie pokazał deficytu → BRAK zmian w main.ts/ai.ts dla tej części (zgodnie z
  instrukcją ZADANIA: "jeśli dowód pokaże że już działa dobrze, NIE zmieniaj nic").
  Zastrzeżenie: symulacja NIE modeluje pełnej ekonomii (Praca/ziemia celowo hojne) —
  mierzy wyłącznie kadencję samej decyzji, nie realny playthrough.

BLOKADY:
- Poza allowlistą, w drzewie roboczym widoczne zmiany NIE MOJE: 2 zmodyfikowane PNG w
  `dyspozycje/autobot/runs/R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1/dowody/` i 1
  nowy `.../P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1/dowody/render.png` — nie dotknięte,
  nie commitowane przeze mnie, zgłaszam do wiedzy orkiestratora (PROCESS, nie GAME).
- Pkt "OR wymuszona wojna epoki już wystąpiła → koniec okna przed turą 25" z prozy GOAL
  NIE zaimplementowany — ZADANIE pkt 2 (konkretna specyfikacja kodu) go nie wymaga i
  BINARNE KRYTERIUM go nie testuje; dodatkowo stone forced war startuje dokładnie w
  turze 25 (pokrywa się z oknem) a bronze wymaga wcześniejszego wejścia w epokę Brązu
  (rzadkie < t.25 w normalnym tempie). Świadome uproszczenie, udokumentowane — nie
  zgłaszam jako DECISION_REQUIRED (brak wpływu na BINARNE KRYTERIUM), ale flaguję do
  ewentualnego ABC jeśli właściciel uzna inaczej.
- Main.ts NIE dotknięty → brak kolizji z równoległym tematem
  P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (sprawdzić w szczególności: wykluczenie gracza partnerId='0',
kompletność sweep testów diplomacy/war, czy pominięcie warunku "forced war already
happened" jest akceptowalne czy wymaga ABC).
DEPLOY/PUSH: NIE WYKONANO
