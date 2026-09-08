# R-HOTSEAT-ETAP6C-ECONOMY-Q1 — Final Control runda 2

**Metoda:** świeży `Read` main.ts:26495-26534 (`setOwnerPracaPool`/`playerPracaCell`),
main.ts:10415-10426 (alias), main.ts:30690-30879 (Klaster F pełny), `git diff --stat`
302b6a96 (10 plików, +929/-156, brak zmian poza allowlistą gra/), świeże `tsc --noEmit`
(0 błędów), świeże `node tools/hotseat-etap6c-economy-noop-test.cjs` (70/70 PASS), `git
status`/diff HEAD~10 w obu równoległych worktree (6e-render, 7-saveload) — diffy w
main.ts leżą w liniach ~1020-14700 (boot/render/save), zero nakładania z moim zakresem
(10415-10426, 26495-26534, 30690-30879).

## Werdykty per zarzut

**Zarzut 1 (Klaster F mieszanie danych) -> ODDAL.** Potwierdzone niezależnie: pętla
`for (const hOid of humanSeats.humanOwnerIds)` (30713-30879) przekazuje `hOid`
konsekwentnie do wszystkich akcesorów stanu wewnętrznego. Evaluator sam już oddalił
po weryfikacji — moja lektura się zgadza.

**Zarzut 2 (brak Chromium dla Klastra F/G) -> DO DECYZJI CZŁOWIEKA.** Nie jest to
defekt TEJ migracji (literały -> `isHuman`/pętla po fotelach), to brak pokrycia
konkretnego typu narzędzia dla warstwy DOM-bound/HUD-bound, jednoznacznie przyznany
przez Obronę bez prób pozorowania. Wybór terminu (osobna runda teraz vs. razem z
Etapem realnego 2. fotela) jest decyzją o priorytecie/harmonogramie, nie wytwór jej
nie rozstrzyga sam z siebie.

**Zarzut 3 (A6 tautologiczna) -> ODDAL.** Potwierdzone: test wykonuje realne wywołanie
`maxSafePoziomRacjiForCity` dwukrotnie z różnym `humanOwnerIds`, asercja różnicuje
stock-based (3) vs flow-based (2) dla tego samego miasta — nie `typeof`. Świeże
uruchomienie: 70/70, asercja obecna i zielona.

**Zarzut 4 (`setOwnerPracaPool` mieszanie `_lastPraca`, WYSOKA WAGA) -> DO DECYZJI
CZŁOWIEKA.** Własna weryfikacja main.ts:26511-26519 potwierdza dosłownie: `_lastPraca
= playerPracaPool` (zmienna modułu, aliasowana WYŁĄCZNIE dla `HUMAN_OWNER_PRIMARY`
przez `playerPracaCell`, 10419-10426) wykonuje się bezwarunkowo dla KAŻDEGO
`isHuman(ownerId)`. W Klastrze F linia 30877 `setOwnerPracaPool(hOid, playerPracaPool)`
(argument to LOKALNA zmienna zacieniająca, poprawnie przekazana jako `value`) wywołuje
ten akcesor dla każdego `hOid` w pętli spełniającego warunek na 30719 — nie tylko dla
`hOid===humanOwnerId`. Efekt: po iteracji przez fotel≠0 `_lastPraca` (czip HUD,
main.ts:17563, czytany wprost) zostaje nadpisany wartością odczytaną z modułowego
aliasu fotela 0, nie faktycznie zapisaną wartością tego fotela — realne mieszanie
danych HUD. **Klasyfikuję to jako DO DECYZJI CZŁOWIEKA, nie jako NAPRAW blokujący TĘ
integrację**, z dwóch niezależnych powodów: (a) dziś behawioralny no-op — jedyny
istniejący fotel to `HUMAN_OWNER_PRIMARY`, `humanOwnerIds` ma długość 1, warunek
`hOid===humanOwnerId` jest zawsze prawdziwy, więc obserwowalne zachowanie gry jest
identyczne przed i po; (b) defekt siedzi w akcesorze Etapu 3 (26511-26519),
NIEZMIENIONYM w tej rundzie i już współdzielonym przez Klaster A z rundy 1 —
naprawa poprawna wymaga decyzji architektonicznej (czy `setOwnerPracaPool` w ogóle
powinien pisać cache UI, czy powinien przyjąć parametr "czy to fotel aktywny", czy
`_lastPraca` powinien być tablicą per-fotel) wykraczającej poza zakres tej migracji
literałów i analogicznej do wzorca odłożeń Etapu 0/5 w tym projekcie. Zgadzam się z
rekomendacją Evaluatora: musi trafić do rejestru jako jawny, nieprzemilczany punkt
"do zrobienia PRZED włączeniem drugiego fotela produkcyjnie" (razem z zarzutem 2,
bo to ten sam brak pokrycia Chromium, który uniemożliwił wykrycie).

## Agregat

Zero werdyktów NAPRAW. Dwa DO DECYZJI CZŁOWIEKA (2, 4) -> wg reguły projektu agregat
tematu to DECISION_REQUIRED. Integracja SAMEJ migracji (32 miejsca + blok bankowania +
rebelia) nie jest blokowana: jest to bezpieczny, izolowany krok przygotowawczy,
dziś no-op, zgodnie z GOAL dispatchu — analogicznie do wzorca Etapu 0/5.

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6C-ECONOMY-Q1
GOAL: migracja 32 miejsc kategorii "ekonomia" na `isHuman(ownerId)`, blok bankowania
`runWorldEndTurn()`, decyzje `isPlayerOwner`/rebelia, dowód no-op.
TESTY: świeże `tsc --noEmit` 0 błędów; nowa bramka 70/70 PASS; `git diff --stat` vs
302b6a96 potwierdzony (10 plików, tylko allowlista); zero nakładania linii main.ts z
równoległymi worktree 6e-render/7-saveload (ich diffy: ~1020-14700; mój: 10415-10426,
26495-26534, 30690-30879).
BLOKADY: (1) `isPlayerOwner` call-site'y odłożone (z rundy 1, uzasadnione). (2)
auto-research/toasty epoki jednoosobowe (z rundy 1, jawne). (3) Zarzut 2 — brak
Chromium Klaster F/G, DO DECYZJI CZŁOWIEKA. (4) Zarzut 4 — `setOwnerPracaPool`
mieszanie `_lastPraca` przy 2. fotelu, DO DECYZJI CZŁOWIEKA, WYSOKA WAGA.
RUNDY: 2/5
WERDYKTY:
1 -> ODDAL (potwierdzone niezależną lekturą main.ts:30713-30879)
2 -> DO DECYZJI CZŁOWIEKA (brak Chromium F/G; nie defekt tej migracji, decyzja o
     terminie naprawy)
3 -> ODDAL (potwierdzone niezależną lekturą i uruchomieniem A6)
4 -> DO DECYZJI CZŁOWIEKA (mieszanie `_lastPraca` w akcesorze Etapu 3, potwierdzone
     dosłowną lekturą 26511-26519; no-op dziś, defekt architektoniczny nie mieszczący
     się w zakresie tej migracji, wymaga decyzji o terminie/podejściu naprawy)
WERDYKT KOŃCOWY: Zero zarzutów NAPRAW — migracja jest merytorycznie poprawna i
zweryfikowana niezależnie (tsc czysty, 70/70, referencje zielone, brak nakładania z
równoległymi tematami). Integracja TEJ migracji nie jest blokowana: to bezpieczny
krok przygotowawczy, dziś no-op. Agregat tematu to jednak DECISION_REQUIRED z powodu
dwóch jawnie odłożonych DO DECYZJI CZŁOWIEKA (2, 4) — oba dotyczą tej samej luki
(brak harnessu Chromium dla Klastra F/G) i muszą zostać zarejestrowane jako
jawny, oddzielny temat "do zrobienia PRZED włączeniem drugiego fotela produkcyjnie",
zanim temat zostanie uznany za w pełni zamknięty.
NASTĘPNY KROK: integracja orkiestratora tej migracji (READY_FOR_DEPLOY po decyzji
właściciela co do priorytetu/terminu zarzutów 2+4, które same w sobie NIE wstrzymują
integracji); rejestracja zarzutów 2+4 jako osobny temat w dyspozycje/PYTANIA-OTWARTE.md
lub odpowiednim rejestrze, z jawnym STATUS: OTWARTE.
DEPLOY/PUSH: NIE WYKONANO
