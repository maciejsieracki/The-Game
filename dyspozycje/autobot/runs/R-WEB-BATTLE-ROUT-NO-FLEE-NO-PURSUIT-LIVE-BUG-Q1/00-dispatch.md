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

## DODATEK 2026-11-12 — dowody właściciela i fakty z kodu (przed rundą 2)

Zgłoszenie właściciela: w jednej bitwie armia po utracie morale uciekła i była gonią; w innej bitwa zakończyła się zaraz po utracie morale, bez ucieczki. Właściciel nie wie, od czego to zależy. Hipoteza właściciela (konnica/rydwan jako warunek pościgu) NIE wynika wprost z kodu — do potwierdzenia lub obalenia dowodem.

Baza: origin/main zawiera pościg (FALA 653, commit 7f58632ed) i jest przodkiem ROBOCZEJ aeb52465e. Miejsca do zbadania w gra/src/battle/battleScene.ts:
- _checkEnd: po zalamaniu morale _routWholeArmy; koniec odraczany tylko gdy _pursuitPending = przegrany ma uciekinierów NA POLU ORAZ zwycięzca ma niezroutowaną żywą jednostkę ORAZ roundNo − _pursuitStartRound < PURSUIT_MAX_ROUNDS (30).
- forcedVerdict (PAT / szturm odparty / sufit tur) omija pościg.
- _fleeStep: uciekinier bez ruchu do krawędzi przez 2 tury (fleeStuck ≥ 2) jest USUWANY z pola. Jeśli wszyscy uciekinierzy zostaną tak usunięci lub zejdą w tej samej turze, _pursuitPending jest fałszem i bitwa kończy się od razu — to może być objaw „zaraz po utracie morale".
- neverRout: jednostki z tą flagą nie pękają; armia z takimi jednostkami może nie zostać zalamana albo zostawić niezroutowanych.
- _pursuitPending nie sprawdza klasy jednostki. Konnica/rydwan wpływa dopiero na _resolveRemainingRouted (zasięg dogonienia), czyli przy końcu bitwy.

Zadanie rundy 2: porównać przebieg dwóch bitew (ta sama konfiguracja: „kończy się od razu" vs „ucieka i goni") i wskazać, który z warunków powyżej rozstrzygnął. Dowód: log bitwy (linie „ZALAMUJE MORALE", „POSCIG", „uciekl z pola bitwy", „dogoniony") oraz liczba uciekinierów na polu w kolejnych turach. Bez dowodu nie zmieniaj reguł. Jeśli przyczyną jest usuwanie fleeStuck, zgłoś DECISION_REQUIRED (pytanie ABC do właściciela).
