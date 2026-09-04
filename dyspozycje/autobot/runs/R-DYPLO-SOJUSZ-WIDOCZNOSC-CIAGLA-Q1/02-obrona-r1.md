# 02 — OBRONA (runda 1)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1
ZMIANY/COMMIT: bez zmian wobec `01-operator.md` — ten zarzut jest proceduralny
(klasyfikacja statusu/eskalacji), nie techniczny; zero nowego kodu w tej rundzie.
TESTY: bez zmian wobec `01-operator.md` §3 (6 bramek referencyjnych zielone, 8
bramek regresji fog/AI/dyplomacja/sojusz zielone identycznie, `ai-test.cjs`
287/8-fail identyczne z `origin/main` — C-058, żywy dowód Playwright 23/23) —
Evaluator potwierdził to samo niezależnie, nie kwestionuje wyników.
BLOKADY: brak technicznej. Jedna pozycja `DO DECYZJI CZŁOWIEKA` (zarzut 1).
RUNDY: 1/5
NASTĘPNY KROK: ABC właściciela (patrz `NASTĘPNY KROK` w raporcie Evaluatora),
potem Final Control — bez zmian kodu, chyba że właściciel każe implementować
stronę AI (wtedy runda 2, ten sam worktree/gałąź).

---

OBRONA: 1 -> PRZYJMUJĘ (w części proceduralnej — klasyfikacja statusu i brak
eskalacji do właściciela) — dowód poniżej. ODRZUCAM wyłącznie dorozumiane
podważenie samej *technicznej* decyzji (implementować stronę gracza teraz,
stronę AI zostawić do decyzji) — tego Evaluator zresztą wprost nie zarzuca:
„Techniczna jakość zaimplementowanej (jednokierunkowej) części nie budzi
zastrzeżeń".

**Co było błędem.** `01-operator.md` §5 zamyka temat statusem `PASS` i explicite
odmawia `DECISION_REQUIRED`: „nie jest to DECISION_REQUIRED, bo dispatch sam
rozstrzyga priorytet przez GOAL 5 + klauzulę 'jeśli w ogóle' w allowliście —
ale właściciel może zdecydować inaczej w kolejnej rundzie" (`01-operator.md:180-183`).
To zdanie samo przyznaje niepewność („może zdecydować inaczej"), a mimo to
zamyka rundę statusem `PASS`, nie zostawiając formalnej ścieżki do decyzji
właściciela przed Final Control. To jest dokładnie błąd proceduralny, nie
merytoryczny.

**Dowód 1 — dispatch faktycznie nie rozstrzyga jednoznacznie, wbrew §5.**
`00-dispatch.md:38` (GOAL 1): „analogicznie odwrotnie, **jeśli w ogóle** model
gry rozróżnia 'co widzi AI'" — warunek, wg reconu Operatora samego (`01-operator.md:26-32`,
potwierdzone czytaniem `aiVisibleHexes`/`aiCityCaptureAllowed`), **zaszedł**:
model rozróżnia, i to aktywnie wpięty w decyzje (`ai-fog-test.cjs` W1 vs W2).
`00-dispatch.md:41-44` (GOAL 3), jedyny mechanizm, który miał zwolnić z
implementacji strony AI, jest jawnie **warunkowy** na „AI ma wewnętrznie pełną
wiedzę o mapie" — przesłanka **fałszywa**, potwierdzona przez samego Operatora.
Skoro warunek zwalniający nie zaszedł, GOAL 5 (`00-dispatch.md:47-49`) nie jest
bezwarunkowym zakazem implementacji strony AI, tylko warunkową instrukcją
weryfikacji: „jeśli GOAL 1 wymaga zmiany także w tym, co AI 'wie' [...]
zweryfikuj że to nie zmienia istniejących testów zachowania AI" — literalnie
zakłada możliwość implementacji z weryfikacją regresji, nie samą rezygnację.
Operator w §2 rozstrzygnął to napięcie jednostronnie na korzyść GOAL 5 —
poprawna, obroniona technicznie interpretacja, ale **jedna z dwóch możliwych
literalnych lektur tego samego tekstu**, nie jedyna.

**Dowód 2 — właściciel dostał ryzyko do wiadomości w innych słowach niż
Operator je teraz streszcza.** Rejestr (`dyspozycje/REJESTR-PROSB-I-ZADAN.md:4356`):
pytanie ABC brzmiało „dotyka logiki widoczności per-turę gracza ORAZ AI —
wymaga starannej weryfikacji braku regresji w decyzjach AI", odpowiedź
właściciela: **„Tak, działaj"**. Ta ECHO nie mówi „zrób wyłącznie stronę
gracza jeśli strona AI okaże się ryzykowna" — mówi „zweryfikuj starannie i
działaj", na temat opisany wcześniej (`:3894`, doprecyzowanie właściciela z
2026-09-02) wprost jako „gracz widzi bieżąco co widzi sojusznik AI **i
odwrotnie**" oraz w samym wpisie dyspozycji dispatchu (`:4378`): „Ciągła
**dwukierunkowa** widoczność WYŁĄCZNIE dla aktywnego sojuszu". Zawężenie do
jednokierunkowości w rundzie 1 jest więc realnym odejściem od tego, co
właściciel widział w chwili „Tak, działaj" — nie musi być błędem (GOAL 5 to
uzasadnia), ale **wymaga** potwierdzenia, nie domysłu Operatora o priorytecie.

**Dowód 3 — sam proces tego wymaga wprost, to nie opinia Evaluatora.**
`docs/decyzje/R-PROC-AUTOBOT.md:228-231` (C-054, §3c pkt 2, obowiązuje od
2026-08-29 — ten temat dispatchowany 2026-09-03, więc w pełni podlega): „Gdy
zarzut zależy wyłącznie od intencji, której wytwór sam nie rozstrzyga (świadoma
decyzja projektowa, o której Evaluator nie wiedział) — obrona wskazuje to
wprost i zostawia rozstrzygnięcie jako kandydata do `DO DECYZJI CZŁOWIEKA`,
zamiast na siłę dowodzić z materiału, którego tam nie ma." Dokładnie to jest
ten przypadek: „jednostronna decyzja Operatora, że dispatch sam rozstrzyga
priorytet" jest interpretacją (przyznaną jako niepewną w §5), nie faktem
rozstrzygniętym przez tekst dispatchu (Dowód 1) ani przez ECHO właściciela
(Dowód 2). `README.md:26` (C-054): „konflikt z wpływem na gameplay/UX wymaga
pełnego turnieju [ABC], nie skróconej ścieżki" — świadome zawężenie
dwukierunkowej funkcji do jednokierunkowej JEST wpływem na gameplay
(sojusznik AI nie zyskuje wglądu w widoczność gracza, mimo że właściciel
opisywał to jako część funkcji).

**Konkluzja obrony.** Przyjmuję zarzut w części klasyfikacji: `01-operator.md`
powinien był zamknąć rundę jako pozycję `DO DECYZJI CZŁOWIEKA` (agregat →
`DECISION_REQUIRED`), nie jako `PASS` z jednostronnym rozstrzygnięciem w §5.
Nie przyjmuję (bo nikt tego nie zarzuca wprost i dowody §3 tego nie podważają)
jakoby zaimplementowana część była wadliwa, niekompletna względem allowlisty,
albo niedostatecznie przetestowana — ta część zostaje bez zmian i jest gotowa
do integracji niezależnie od odpowiedzi właściciela na pytanie o stronę AI
(kryteria końca 1-2-3-5-6 dispatchu zaspokojone; kryterium 4 zależy od ECHO).

Pytanie do właściciela (do wpisania w `dyspozycje/PYTANIA-OTWARTE.md` przez
orkiestratora): **czy strona AI (sojusznik AI widzi na bieżąco widoczność
gracza, wpływając na `aiVisibleHexes`/`aiCityCaptureAllowed` i tym samym na
realne cele ataku/przejęcia miast AI-sojusznika) ma być zaimplementowana w
rundzie 2 tego tematu z weryfikacją regresji na `ai-fog-test.cjs`/`ai-test.cjs`,
czy właściciel świadomie ogranicza zakres do już zaimplementowanej strony
gracza?** Techniczne konsekwencje obu wariantów (Operator, do ABC):
- **Zostaw jednokierunkowo (potwierdź `01-operator.md`)**: zero dodatkowego
  kodu, temat gotowy do Final Control bez zmian.
- **Zaimplementuj też stronę AI**: dodatkowy hunk w main.ts w miejscach
  `aiVisibleHexes`/`aiCityCaptureAllowed` (linie wskazane w `01-operator.md:74-80`),
  realna zmiana zachowania AI sojuszniczego w stanie sojuszu (może zaatakować/
  przejąć cele dotąd poza jego zasięgiem widzenia) — wymaga rozszerzenia
  `ai-fog-test.cjs`/`ai-test.cjs` o scenariusz sojuszu i żywego dowodu
  Playwright analogicznego do §3c `01-operator.md`, ale z AI po stronie
  atakującej/przejmującej z rozszerzonym zasięgiem.

DEPLOY/PUSH: NIE WYKONANO
