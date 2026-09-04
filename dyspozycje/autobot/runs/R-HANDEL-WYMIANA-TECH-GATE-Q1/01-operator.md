# R-HANDEL-WYMIANA-TECH-GATE-Q1 — 01-operator (runda 1)

MODEL+EFFORT: Sonnet 5, effort high.

## Weryfikacja reconu

Wszystkie fakty A–E dispatchu potwierdzone bezpośrednim odczytem: jedno
wywołanie `refreshTradeRoutes` (main.ts:13713, dziś :13724 po edycjach),
`unlockedTechSetForOwner`/`ownerResearchedTechs` istnieją i są gotowe do
użycia, `formAiAiTradeAgreementsIfEligible` pętla l.17665-17681 (dziś
+1 linia), `diplomacy-proposals.ts` 1491-1497/2080-2093 zgodne, brak
referencji logicznej do "Wymiana" poza tech.json. Zero rozbieżności.

## Implementacja (GOAL 1-4)

- `trade-routes.ts`: `TRADE_TECH='Wymiana'` (export), nowy param
  `hasTradeTech: (ownerId)=>boolean = () => true` (ostatni, wsteczna
  zgodność). Gating w 3 miejscach: stillValid (wewn./zewn.), fresh zewnętrzni,
  fresh wewnętrzni.
- `diplomacy-locks.ts`: `hasTradeTechSelf?`/`hasTradeTechOther?` (opcjonalne —
  patrz niżej), case '5' gate po `hasHandel`, przed `hasTradeConnection`/
  `relacjaGate`, note rozróżnia MY/ONI.
- `diplomacy-proposals.ts`: `ProposalEvalContext.hasTradeTechProposer/Responder?`
  gate w `evaluateProposal` case umowa_handlowa/umowa_szlakow;
  `resolvePlayerAcceptsAiPending` dostał `opts.hasTradeTech?`, ten sam gate.
- `main.ts`: `ownerHasTradeTech(ownerId)` (wzorzec `ownerHasSeafaring`, obok
  niej) → wstrzyknięty do: jedynego wywołania `refreshTradeRoutes`,
  `buildDiplomacyLockContextBase`, `formAiAiTradeAgreementsIfEligible` (nowy
  `continue`), `buildProposalEvalContext` (jedyny konstruktor ctx, pokrywa
  wszystkie 3 wywołania `evaluateProposal`), oraz 3 wywołania
  `resolvePlayerAcceptsAiPending`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU — dowód

**Trzy warstwy, osobno:**
(a) rdzeń tras — `handel-wymiana-tech-gate-test.cjs` K1-K7, żywo, esbuild.
(b) diplomacy-locks gracza — tamże K8, żywo, esbuild.
(c) `formAiAiTradeAgreementsIfEligible` — main.ts nie jest czystym modułem
    (DOM/THREE, jedna funkcja, nieeksportowana) → NIE testowalne żywo bez
    zmiany architektury poza allowlistą. Zweryfikowane STATYCZNIE: nowy
    `continue` (main.ts, w pętli l.17665+) ma identyczny kształt do sąsiednich
    `isAtWar`/`hasSzlakowTreaty` `continue` w tej samej pętli. Jawnie NIE
    uznaję tego za dowód równoważny (a)/(b) — ograniczenie testowe, nie luka
    logiki.

**Mutacja źródła (dowód nietautologiczności):** usunięto wszystkie 4 gate'y
w `trade-routes.ts`, uruchomiono test → **7 z 21 asercji FAIL** (K1-K2,
K4a-b, K5, K6a-b), przywrócono źródło (diff czysty, `tsc` zielone) → 21/21.

**Cicha furtka:** `grep -rn "refreshTradeRoutes(" gra/src/` poza
trade-routes.ts → **1 wywołanie** (main.ts), przekazuje `ownerHasTradeTech`
(realny predykat) jako 10. argument. Zero furtki.

**Domyślne `() => true`** stosowane też do NOWYCH opcjonalnych pól kontekstu
(`hasTradeTechSelf/Other`, `hasTradeTechProposer/Responder`) — konieczne, bo
te pola trafiły do interfejsów używanych przez fikstury `diplomacy-locks-
test.cjs` spoza allowlisty; pierwsza wersja (pola wymagane) zepsuła 3/88 tam
(regres wykryty i naprawiony przed commitem, patrz TESTY).

## TESTY

- `tsc --noEmit`: 0 błędów.
- `handel-wymiana-tech-gate-test.cjs`: **21/21** (min. 8 wymagane z GOAL 4,
  8 kryteriów pokryte, część kryteriów >1 asercją).
- 5 referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6.
- `trade-routes-limit-test.cjs` 76/76, `trade-routes-hud-filter-test.cjs`
  59/59 — bez regresu.
- `diplomacy-locks-test.cjs` 88/88 (regres 85/88 wykryty po pierwszej wersji
  z polami WYMAGANYMI, naprawiony zmianą na opcjonalne).
- 15 dodatkowych testów dyplomacji spoza allowlisty (proposal/negotiation/
  acceptance-points/counter-offer/fairness-gate/resource-cyclic/tech-trade
  x2/bilans x3/pakt-granica/oferta-blokowana/stol-pw-sum/incoming-own-gate/
  wiarygodnosc) — zielone, poza `diplomacy-negotiation-table-test.cjs`
  (57/58) — **pre-istniejące na czystej bazie** (potwierdzone `git stash`),
  nie regresja tego tematu.
- `grep -rn "'Wymiana'" gra/src/game/` → 1 trafienie, `trade-routes.ts:1132`
  (stała w module `game/`).

## ZMIANY

`gra/src/game/trade-routes.ts`, `gra/src/game/diplomacy-locks.ts`,
`gra/src/game/diplomacy-proposals.ts`, `gra/src/main.ts`,
`gra/tools/handel-wymiana-tech-gate-test.cjs` (nowy).

STATUS: PASS
