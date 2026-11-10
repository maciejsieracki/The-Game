# Operator R1 — diagnoza i allowlista

Status początkowy: czysty worktree `codex/peace-ten-turns`.

Diagnoza:

- `buildProposalEvalContext` w `gra/src/main.ts` jest wspólnym kontekstem dla preview i rozstrzygania propozycji; `evaluateProposal` w `gra/src/game/diplomacy-proposals.ts` obsługuje akcje `pokoj` oraz `rozejm`, więc guard w evaluatorze pokrywa wysłanie przez gracza, AI→gracz i zwykłe AI↔AI.
- Osobne obejścia automatyczne: żądanie i tick przymusowego pokoju AI↔AI (`diplomacy-ai-forced-peace.ts`, wywołanie w `main.ts`) oraz automatyczne oferty/pokój z wyczerpania (`war-weariness.ts`). Oba muszą zachować stan/liczniki i tylko odroczyć propozycję/rozstrzygnięcie.
- `main.ts` przechowuje `wojnaStartTura` w `DiploPairMeta`, którą save/load zachowuje jako część metadanych pary; bieżący kod lazily zakłada stempel przy pierwszym odczycie wojny. Semantyka: elapsed = `turn - wojnaStartTura`; 0–9 blok, 10 dozwolone. Pokój/rozejm usuwa stempel przy odczycie statusu pokoju; nowa wojna dostaje nowy stempel.
- `truceUntilTurn`/pending offers są odrębnym cyklem. Wygaśnięcie rozejmu przywraca stan wojny bez składania nowej propozycji i nie powinno być blokowane ani przestawiać startu nowej wojny.

Minimalna allowlista przed edycją:

- `gra/src/main.ts` — przekazanie wieku wojny do evaluator context, stamp lifecycle/save-load i gate obejść automatycznych, wyłącznie jeśli potrzebne.
- `gra/src/game/diplomacy-proposals.ts` — wspólny server-side gate dla `pokoj`/`rozejm`.
- `gra/src/game/diplomacy-ai-forced-peace.ts` i `gra/src/game/war-weariness.ts` — odroczenie automatycznej oferty/rozstrzygnięcia bez zamrażania zmęczenia ani zmiany późniejszej wyceny.
- Testy po stronie `gra/tools/` i dowody wyłącznie w tym runie.

Poza zakresem: UI, progi akceptacji po 10 turach, wartości zmęczenia wojną i inne parametry balansu.
