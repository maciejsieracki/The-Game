# R-WEB-BATTLE-NEVERROUT-HOLD-FIGHT-Q1 — dispatch (decyzja właściciela C, 2026-11-12)

GAME. Baza: aeb52465e845d29acb5f7b628370789af399d673 (origin/main).

DECYZJA WŁAŚCICIELA (C): jednostki z cechą „walczy do śmierci” (neverRout, np. Wojownik z maczugą/Chaska) NIE uciekają po załamaniu morale armii. Reszta przegranej armii ucieka i jest gonina. Bitwa trwa, dopóki te jednostki nie zginą albo nie minie limit PURSUIT_MAX_ROUNDS (30 tur). Ucieczka ma być zawsze widoczna, nawet gdy nie ma czym dogonić; bitwa NIE może się kończyć od razu po załamaniu morale.

GOAL: po załamaniu morale armii: (a) jednostki zwykłe uciekają do swojej krawędzi (widoczna ucieczka), (b) jednostki neverRout zostają i walczą, (c) bitwa kończy się, gdy zostaną tylko neverRout martwe/uciekinierzy zeszli z pola albo minie limit 30 tur.

KRYTERIA KOŃCA (binarne):
1. Po załamaniu morale armii z neverRout: uciekinierzy zwykli są na polu w kolejnych turach i schodzą do krawędzi (log: „uciekl z pola bitwy” lub znika z pola).
2. neverRout nie zmienia stanu na routed; walczy dalej.
3. Bitwa nie kończy się w turze załamania, dopóki jest aktywny neverRout albo uciekinier na polu (test regresyjny).
4. Limit 30 tur zachowany.
5. tsc --noEmit zielone; bramki referencyjne zielone; dowód w realnej grze (Chromium).

ALLOWLISTA: gra/src/battle/battleScene.ts (_routWholeArmy, _checkEnd, _pursuitPending, _resolveRemainingRouted — tylko warunki dotyczące neverRout), nowy gra/tools/battle-neverrout-hold-test.cjs. ZAKAZ: wszystko poza allowlistą, gra/data/*.json, git add -A.

IZOLACJA: worktree na izolowanej gałęzi, baza aeb52465e845d29acb5f7b628370789af399d673.

ZAKAZ BEZWZGLĘDNY: npm run build / npm run dev w gra/. Dozwolone: tsc --noEmit; node tools/*-test.cjs.
