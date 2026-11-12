# R-WEB-BATTLE-ROUT-NO-FLEE-NO-PURSUIT-LIVE-BUG-Q1 — dispatch (2026-11-12, zgłoszenie właściciela)

ZGŁOSZENIE WŁAŚCICIELA (dosłownie): „Mimo znaczącej przewagi wojska nie ucieka, po utracie morale wojsko nie uciekało, nikt go nie gonił, tylko po prostu bitwa się zakończyła po utracie morale.”
ZRZUT: panel po walce „Inkowie · Wojownik z maczugą (Chaska) · Obrońca · Wojska AI 1 · Po walce: 1 · HP 20 → 9/20 (−55%)” — jeden obrońca przy wyraźnie słabszej stronie, bitwa zakończona bez ucieczki i bez pościgu.

ZAMIAR (wiążący; ta sama GOAL co W21 R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1): po zalamaniu morale przegrana strona UCIEKA do swojej krawędzi; zwycięzca GOONI uciekinierów; bitwa trwa dopóki uciekinierzy nie zginą lub nie opuszczą planszy (sufit PURSUIT_MAX_ROUNDS = 30). Bitwa nie kończy się w chwili utraty morale.
Decyzja ABC z 2026-11-12 („pościg bez zmian”, FALA 653) jest tym samym kierunkiem; zachowanie z żywej gry NIE odpowiada jej.

HIPOTEZA DO SPRAWDZENIA (z kodu, gra/src/battle/battleScene.ts, wersja origin/main):
- `_checkEnd()` (ok. linia 10305–10400): po `brokenA/brokenD` wywołuje `_routWholeArmy` (uciekający dostają `_startRout`), ale następnie `_pursuitPending(aliveA, aliveD)` zwraca false, gdy zwycięzca nie ma aktywnych jednostek w zasięgu LUB gdy `brokenA` ustawia `aliveA=false` wprost; wtedy `_resolveRemainingRouted()` (ok. linia 10452) natychmiast rozstrzyga uciekinierów: „zginął w pościgu” albo „uciekł z pola bitwy” — BEZ symulowania ruchu i BEZ turn ucieczki.
- Skutek zgodny z objawem: bitwa kończy się w tej samej turze co utrata morale, uciekinierzy znikają z planszy jednym krokiem, nikt ich nie goni.
- Do sprawdzenia: czy `_pursuitPending` powinien odraczać koniec gdy przegrana strona ma uciekinierów na polu, niezależnie od `brokenX` (jak deklaruje komentarz nad funkcją); czy `_resolveRemainingRouted` powinno działać dopiero po PURSUIT_MAX_ROUNDS.

KRYTERIA KOŃCA (binarne):
K1. Test symulacyjny (headless): armia przegrana z morale < 25% i ≥1 uciekinierem na polu, zwycięzca z aktywną jednostką w zasięgu: bitwa NIE kończy się w turze zalamania; uciekinierzy wykonują ruch do krawędzi (zmiana pozycji w logu) co najmniej przez 1 turę; zwycięzca goni (ma ruch w stronę uciekinierów).
K2. Test regresji z mutacją: przywrócenie natychmiastowego `_resolveRemainingRouted` po zalamaniu → test CZERWIENIEJE.
K3. Po zakończeniu: każdy uciekinier w logu ma jedną z trzech dróg: zginął w pościgu (z turą), uciekł z planszy (z turą i krawędzią), albo sufit tury. Brak wpisu „uciekł” bez ruchu.
K4. Istniejące testy bitew zielone (battle-*, w tym battle-skip-equals-auto-resolve-test i battle-routed-*) albo jawnie zaktualizowane z uzasadnieniem w raporcie.
K5. Zrzut wizualny przed/po (Chromium, 1920×1080, deviceScaleFactor 2) pokazujący uciekinierów w ruchu.
K6. tsc --noEmit; bramki logic-test, tech-tree-test, research-test, unit-replace-test, combat-test.

ALLOWLISTA: gra/src/battle/battleScene.ts (sekcje _checkEnd, _pursuitPending, _resolveRemainingRouted, _fleeStep, _routWholeArmy — tylko te), gra/tools/battle-routed-*-test.cjs (istniejące) oraz nowy gra/tools/battle-rout-pursuit-live-test.cjs, dyspozycje/autobot/runs/R-WEB-BATTLE-ROUT-NO-FLEE-NO-PURSUIT-LIVE-BUG-Q1/**.
ZAKAZ: WERSJE.md, JSON balansu, rust-port, push, deploy, npm run build/dev.
BAZA: origin/main aeb52465e. MODEL: Operator HAIKU 5.5, round 1/5. Zmiana zachowania bitwy — jeśli wymaga nowego progu lub zmiany reguły (np. czas pościgu), DECISION_REQUIRED (ABC).
