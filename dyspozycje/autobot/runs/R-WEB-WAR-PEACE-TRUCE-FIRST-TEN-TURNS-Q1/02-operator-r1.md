# Operator R1 — wykonanie

Wprowadzono jeden próg `PEACE_PROPOSAL_MIN_WAR_TURNS = 10` w `gra/src/game/diplomacy-peace-proposal-timing.ts`. Wspólny evaluator blokuje propozycje pokoju, rozejmu i trybutu za pokój przy elapsed 0–9; od elapsed 10 dotychczasowa wycena i akceptacja biegną bez zmian.

`main.ts` zapisuje `wojnaStartTura` przy każdej zmianie statusu do wojny w centralnym `setDiploRelation`, a czyści ją przy wyjściu z wojny. Dzięki temu obejmuje zwykłe wojny, wymuszone wojny epoki i powrót do wojny po wygaśnięciu rozejmu. Metadane pary są już częścią save/load. Ręczne wysłanie, edycja/kontroferta oraz AI→gracz przechodzą guard przed dodaniem propozycji; evaluator zabezpiecza też rozstrzyganie starszych/oczekujących ofert.

Automatyczne AI↔AI nie omija progu: rejestracja nowej prośby jest wstrzymana, a wcześniej zapisane prośby czekają w kolejce do elapsed 10, po czym zachowują dotychczasowy timer i reguły ceny. Tick zmęczenia nadal aktualizuje szczyt zmęczenia w turach 0–9, lecz nie składa ani nie rozstrzyga automatycznej oferty.

Weryfikacja zakończona:

- `node tools/diplo-war-peace-gate-test.cjs` — 24 pass / 0 fail. Rzeczywisty evaluator sprawdzony dla pokoju, rozejmu i trybutu za pokój przy elapsed 0, 9 i 10; obejmuje oba kierunki, zwykłą/epokową wojnę, round-trip startu w save/load i restart nowego okna wojny.
- `node tools/ai-war-nearest-city-peace-2t-test.cjs` — 41 pass / 0 fail, 16/16 mutantów wykrytych. Stare oczekujące AI↔AI żądanie z zapisu czeka do elapsed 10 i wtedy może się rozstrzygnąć.
- `node tools/ai-war-weariness-peace-test.cjs` — 96 pass / 0 fail. Realny tick: elapsed 9 nie składa pokoju, lecz aktualizuje zmęczenie; elapsed 10 może sfinalizować pokój.
- `node tools/diplo-war-peace-main-guard-test.cjs` — 31 pass / 0 fail; obejmuje centralny stempel startu/końca i serializację par metadata.
- `npm run typecheck` — PASS (`tsc --noEmit`).

Browser/live UI test nie był uruchamiany. Kandydat pozostaje w osobnym worktree; bez push, merge ani deploy.
