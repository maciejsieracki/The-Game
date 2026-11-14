# R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (specyfikacja; zero zmian kodu gry)
TEMAT: R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1
GOAL: poprawić `10-operator-claude.md` po zarzutach Z1–Z7 (ocena f39b580, raport `20-evaluator-claude.md`, commit 6601f0013). Każdy zarzut: PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód). Wynik: ten dokument jako obrona; poprawiona specyfikacja jest tu w p.A–D (nadpisuje odpowiednie punkty `10-operator-claude.md`, którego nie edytowano).
BAZA: f39b58091 (detached, `git rev-parse --short HEAD` = f39b58091). Kod gry nietknięty.

Konwencja: `plik:linia` odnosi się do `gra/src/...` chyba że podano inaczej. Linie sprawdzono `grep -n` / `sed -n` / `awk` na f39b580. Miejsca oznaczone NIE ZWERYFIKOWANO nie zostały prześledzone.

---

## 0. Zestawienie odpowiedzi

| Zarzut | Werdykt | Krótko |
|---|---|---|
| Z1 podwójne liczenie rekrutów | PRZYJMUJĘ | Rekruci wchodzą do (a) i (c) — to ta sama wielkość. Nowe założenie Z-H. |
| Z2 R_bitwy to kwadrat, redundancja stanu | PRZYJMUJĘ | Przy symetrii pary `przegraneA = wygraneB`. Wzór i stan poprawione. |
| Z3 clamp i Respekt, dowód „zapisane już obcięte” | PRZYJMUJĘ CZĘŚCIOWO | Zapis obcięty — dowiedzione (diplomacy.ts:1094, 1860–1872). Panel liczy część Respektu z Mocy (diplomacy-display.ts:437). Pełna lista czytelników zapisanego Respektu w wojnie: NIE ZWERYFIKOWANO. |
| Z4 stempel startu wojny „leniwy” | PRZYJMUJĘ | Stempel ustawiany synchronicznie przy zmianie statusu (main.ts:11545–11556). R3 zawężone do zapisów sprzed stempla. |
| Z5 niekompletność miejsc decyzji i punktu końca bitwy | PRZYJMUJĘ, uzupełnione | Zweryfikowano: hak gracza, hamulec, namow_wojne (2 gałęzie), punkt końca bitwy `applyMapBattleOutcome` (main.ts:34998, wywołania 34281/34560/37300). Nadal NIE ZWERYFIKOWANO: UI kliknięcia wojny, szczegóły forced-war-*.ts, UI panelu wojny. |
| Z6 sprzeczność „zero pytań” vs „nie wybieram sam” | PRZYJMUJĘ, z zastrzeżeniem | Sformułowanie NASTĘPNY KROK poprawione. Próg liczbowy (Z-D) podlega CLAUDE.md §3 (decyzja ABC właściciela), więc zostaje jako decyzja orkiestratora przed wdrożeniem progu, nie jako warunek K1. |
| Z7 brak wariantu dla wypowiedzenia wojny | PRZYJMUJĘ | Dodany wariant Z-G2 (miara przedwojenna z R_sila·R_pula). Domyślnie zostaje Z-G. |

Poprawki drobne (potwierdzające zarzut ewaluatora o nieścisłości numerów linii):
- `data/diplomacy-war-peace-params.json:91` (NIE :89) — `"prog": 0.20` wewnątrz bloku `przewagaMilitarna` zaczynającego się w linii 89.
- `gra/src/game/diplomacy-factors.ts:72` to etykieta „Przewaga militarna” (`przewaga_militarna_respekt`); linia 73 to „Słabszy militarnie”.

---

## A. Odpowiedzi na zarzuty

### Z1 — podwójne liczenie rekrutów — PRZYJMUJĘ

Dowód:
- `gra/src/game/power-objective.ts:244` — składnik `rekruci` = `input.rekrutEkw` z flagą `militaryKeys.has('rekruci')`, czyli Rekruci należą do sumy wojskowej.
- `gra/src/game/power-objective.ts:39` — `rekrutEkw` = „Ekwiwalent jednostek z puli … Silnik liczy przed wywołaniem”.
- `gra/src/main.ts:2795` — `rekrutEkw: rekrutUnitEquivalents(pobor.rekruci, epoka, mpMults.costMult)`.
- `data/power-params.json:32` (`jednostka_wojskowa`, `wojskowy: true`) i `:45` (`rekrut_ekw_jednostki`, `wojskowy: true`).

Wniosek: w specyfikacji (a) = Armia + Rekruci, a (c) = pula `rekrutEkw`. To ta sama wielkość policzona dwa razy w iloczynie. Specyfikacja tego nie rozstrzygała.

Poprawka (p.B, założenie Z-H): dla rozłączności składników przyjmuję domyślnie (a) = **tylko Armia** (`jednostka_wojskowa`, `power-objective.ts:241`), a Rekruci wchodzą wyłącznie przez (c) jako pula. Uwaga dla właściciela: jego dosłowne założenie 3(a) mówi „Armia + Rekruci”. To jest rozbieżność z zatwierdzonym założeniem, nie błąd w kodzie. Domyślna wartość Z-H jest zapisana jako założenie, a nie zmiana założenia właściciela po cichu.

### Z2 — R_bitwy jako kwadrat, redundancja stanu — PRZYJMUJĘ

Rozumowanie: bitwa między parą zawsze ma zwycięzcę i przegranego. Zwycięstwa A nad B są przegranymi B, więc `przegraneA = wygraneB` i `przegraneB = wygraneA` (remis nie jest liczony, Z-I). Po podstawieniu wzór z 4b daje:
`(1+wA)/(1+lA) ÷ (1+wB)/(1+lB) = (1+wA)/(1+wB) ÷ (1+wB)/(1+wA) = ((1+wA)/(1+wB))²`.
Specyfikacja tego nie zauważyła i zapisała stan z czterema polami, z których dwa są zbędne.

Poprawka (p.B): stan pary = `wygraneA`, `wygraneB` (dwa liczniki); `R_bitwy = (1+wygraneA)/(1+wygraneB)`, zero/zero → 1. Wykładnik 2 (siła wpływu bitew) jest świadomym wyborem, a nie efektem ubocznym; zostaje jako Z-C2 do decyzji (domyślnie wykładnik 1).

### Z3 — clamp wojenny i Respekt — PRZYJMUJĘ CZĘŚCIOWO

Potwierdzone (zapis obcięty):
- `gra/src/game/diplomacy.ts:1094` — `applyDiplomaticEvent` zwraca `clampRelationForWar({ zaufanie: newZ, respekt: newR, … })` (blok 1090–1096).
- `gra/src/game/diplomacy.ts:1860–1872` — `tickDiplomacy`: `tickedRel = clampRelationForWar({…, respekt: rdip.respekt, …})`, a następnie `nowyRespekt = tickedRel.respekt` zapisywany do stanu. Zapisany Respekt w wojnie jest więc obcinany przy każdym ticku.
- `gra/src/game/diplomacy.ts:1141–1153` — `clampRelationForWar` zmienia `respekt` (`r = Math.max(0, r - excess)`).

Poprawione (częściowo odrzucone):
- Panel NIE pokazuje zapisanego Respektu wszędzie. `gra/src/game/diplomacy-display.ts:437` — `formatPowerRelationLine` zwraca `respekt: computeRespekt(selfPower, otherPower)`, czyli Respekt liczony z Mocy, nie z zapisu. `diplomacy-display.ts:349–356` (`effectiveNastawienieScores`) jest tożsamością i zwraca zapisany Respekt. Są więc dwa źródła wyświetlania.
- Propozycje: `main.ts:24702–24708` nadpisuje `rel.respekt` wartością `computeRespekt` z Mocy, więc ścieżka oceny propozycji NIE czyta zapisanego Respektu. Wywołania clampa w `diplomacy-proposals.ts:713, 1415, 1439–1440, 1475` działają jednak na tym nadpisanym obiekcie (wynik progów PN zależy od limitu 29). To zmienia wynik ocen, nawet bez zmiany zapisu.
- NIE ZWERYFIKOWANO: pełna lista czytelników zapisanego `rel.respekt` w stanie wojny poza `diplomacy.ts:842` (`relationScore`) i ścieżką oceny w `diplomacy.ts:1307–1402`.

Wniosek dla specyfikacji: usunięcie clampa z tick zmienia zapisany Respekt w wojnie (dowiedzione), a nie tylko etykietę. Dotyczy to też progów PN przez `diplomacy-proposals.ts`. Decyzja pozostaje Z-B (domyślnie clamp zostaje).

### Z4 — stempel startu wojny i ryzyko R3 — PRZYJMUJĘ

Dowód:
- `gra/src/main.ts:11545–11556` (`setDiploRelation`): stempel `wojnaStartTura = turn` jest ustawiany synchronicznie przy przejściu `prevStatus !== 'wojna'` → `'wojna'`, a zdejmowany przy przejściu z wojny. Komentarz w kodzie: „Stamp every transition at its sole status mutation point … preserves the start through save/load”.
- Wyjątek, który nie zmienia statusu: `main.ts:11890` (`tickDiploAiAiPairsWithBrake`) zapisuje bezpośrednio przez `diplomacyRelations.set` tylko gdy `next.status === cur.status`. Stempla nie trzeba ustawiać.
- Pozostałe bezpośrednie `diplomacyRelations.set`: `main.ts:6073` (pętla granic, NIE ZWERYFIKOWANO czy może zmienić status), `main.ts:10472/10478` (inicjalizacja barbarzyńców), `main.ts:47542` (wczytanie zapisu).
- `diploEnsureWarStart` (`main.ts:11630–11641`) jest tylko ścieżką zapasową dla par bez stempla.

Poprawka R3: ryzyko dotyczy wyłącznie zapisów sprzed wprowadzenia stempla (wojna trwa, brak `wojnaStartTura` w `DiploPairMeta`). Dla nich `diploEnsureWarStart` ustawi turę pierwszego zapytania. Zapisy nowe są bezpieczne. Pole `wojnaBitwy` (p.B) trzeba wyzerować w TYM SAMYM miejscu co stempel: gałąź „start” w `main.ts:11551–11556` i gałąź „koniec” w `main.ts:11558–11563`.

### Z5 — niekompletność miejsc decyzji i punktu końca bitwy — PRZYJMUJĘ, uzupełnione

Zweryfikowano w tej rundzie (plik:linia):
- Gracz wypowiada wojnę (hak): `main.ts:12325` `chargeWarDeclarationCredibility` (komentarz 12319–12324). Wspólna funkcja deklaracji: `main.ts:13363` `ownerDeclareWarOn` (wywołania m.in. `main.ts:20790`, `20938`, `13428`). Miejsce kliknięcia w UI: NIE ZWERYFIKOWANO.
- Wojna z progu (hamulec, decyzja automatyczna): `main.ts:11840–11858`. Ta ścieżka NIE wywołuje `ownerDeclareWarOn`, tylko `setDiploRelation` (`main.ts:11852–11858`). Stempel startu jest więc ustawiany tu poprawnie przez `setDiploRelation`. Gracz nie wypowiada wojny z hamulca (komentarz D7 w `main.ts:11842`: „gracz NIGDY nie wypowiada wojny automatycznie z hamulca”; bramka `if (!outcome.mayDeclare) continue;` w `main.ts:11844`, a gracz-silniejszy zostaje w kolejce wg komentarza `main.ts:11813`).
- Namów do wojny: dwie gałęzie `case 'namow_wojne'`: `gra/src/game/diplomacy-proposals.ts:1752` (wewnątrz `evaluateProposal`, funkcja zaczyna się w linii 1104) i `diplomacy-proposals.ts:2327` (wewnątrz `resolvePlayerAcceptsAiPending`, linia 2224).
- Punkt końca bitwy (kandydat na licznik): `gra/src/main.ts:34998` `applyMapBattleOutcome(atkRoster, defRoster, winner, …)`. Wywołania: `main.ts:34281`, `main.ts:34560`, `main.ts:37300`. Wewnątrz funkcji nie ma wczesnego `return` / `if` między liniami 35002 a 35027 (sprawdzone `awk`), więc `applyMilitaryWinRespectEvent` (`main.ts:35027`) jest wołane dla każdej bitwy mapy, także AI↔AI. Sama funkcja `applyMilitaryWinRespectEvent` (`main.ts:12482–12491`) zapisuje tylko zwycięstwa gracza przez `militaryWinRespectPair` (`diplomacy.ts:1126–1138`, linia 1136 `isHumanOwner(winnerOwner)`). Licznik trzeba więc dopisać w `applyMapBattleOutcome` obok `main.ts:35027`, a nie w `applyMilitaryWinRespectEvent`.
- Ochrona wymuszonej wojny (bramka): `gra/src/game/forced-war-common.ts:75–81` (predykat „czy w wojnie”, wyjątek barbarzyńców). Pełne przejścia `forced-war-bronze/iron/stone/waves.ts`: NIE ZWERYFIKOWANO.

Nadal NIE ZWERYFIKOWANO: UI kliknięcia wypowiedzenia wojny przez gracza, szczegóły `forced-war-*.ts` poza `common`, UI panelu wojny (zał. 8), pozostałe bezpośrednie `diplomacyRelations.set` (p.Z4).

Konsekwencja dla K3/K7: K3 ma adres wdrożenia (`applyMapBattleOutcome`, `main.ts:34998`, linia 35027 jako punkt wpięcia). K7 nadal wymaga wskazania konkretnego komponentu w `diplomacyPanel.ts` (NIE ZWERYFIKOWANO).

### Z6 — sprzeczność „zero pytań” — PRZYJMUJĘ, z zastrzeżeniem

Zmiana: w `10-operator-claude.md` p.8 i NASTĘPNY KROK trzeba przeformułować. Dispatch (pkt 7) wymaga zapisania Z-A…Z-G jako założeń z wartością domyślną, bez pytań do właściciela. Zapis „decyzje Z-A, Z-B, Z-D przed jakimkolwiek K1” jest więc błędem sformułowania.

Zastrzeżenie: Z-D to próg liczbowy. `CLAUDE.md` §3 mówi, że progi liczbowe idą jako pytanie ABC do właściciela, nie są wybierane przez wykonawcę. Dlatego Z-D zostaje jako decyzja orkiestratora przed WDROŻENIEM progu (K5), a nie jako warunek K1. K1 jest czystą funkcją i przyjmuje próg jako parametr, więc K1 nie zależy od wartości Z-D. Zdanie „Nie wybieram sam (zakaz z CLAUDE.md §ABC)” zostaje, bo jest zgodne z CLAUDE.md.

### Z7 — brak wariantu dla wypowiedzenia wojny — PRZYJMUJĘ

Dodany wariant Z-G2 (p.B, p.C): dla wypowiedzenia wojny (przed wojną nie ma bitew i stanu wojny) miarę można policzyć bez R_bitwy: `militaryRatioPrzed(A→B) = R_sila · R_pula`, gdzie R_bitwy = 1 z definicji (zero bitew). Ta wartość jest dostępna w chwili decyzji bez stempla. Próg wypowiedzenia wojny (`ai.ts:6229` `PROG_WOJNA_SILA = 0.6` jako `rw`) zostaje domyślnie (Z-G). Wariant Z-G2 zmienia wypowiedzenie na miarę z zał. 5 i jest decyzją właściciela, nie wykonawcy.

---

## B. Poprawiona specyfikacja (nadpisuje p.4a–4b i p.8 z `10-operator-claude.md`)

### B1. Stan pary (rozszerzenie `DiploPairMeta`, `gra/src/game/diplomacy-pn-engine.ts:69`, pola opcjonalne)

- `wojnaStartTura?: number` — ISTNIEJE (`main.ts:11614`), bez zmian.
- `wojnaBitwy?: { od: number; wygraneA: number; wygraneB: number }` — NOWE. `A` = właściciel o niższym id w kluczu pary (`diploPairKey`). Zapis w `applyMapBattleOutcome` (`main.ts:34998`, punkt wpięcia `main.ts:35027`) dla każdego zwycięskiego właściciela z pary, także AI↔AI. Remis nie jest zapisywany (Z-I). Reset w `setDiploRelation` (`main.ts:11551–11556` start, `11558–11563` koniec).
- NIE zapisywane: siła wojskowa i pula — liczone na żądanie (`computeObjectivePower` z `military`, `power-objective.ts:241`, oraz `rekrutUnitEquivalents`, `main.ts:2795`).

### B2. Wzór (wartości domyślne = ZAŁOŻENIA z p.C)

Dla pary (A, B) w wojnie:
- `S = siłaWojskowa_A / (siłaWojskowa_A + siłaWojskowa_B)`, gdzie `siłaWojskowa` = **tylko Armia** (Z-H, p.C). Gdy suma = 0, `S = 0.5`.
- `R_sila = S / (1 − S)`.
- `R_bitwy = (1 + wygraneA) / (1 + wygraneB)`, gdzie `wygraneA` = wygrane A nad B od startu wojny. Zero/zero → 1.
- `R_pula = (1 + pulaA) / (1 + pulaB)`, gdzie `pula` = `rekrutEkw` (raz, Z1).
- `militaryRatioWar(A→B) = R_sila · R_bitwy · R_pula`.
- Symetria: każdy czynnik to iloraz, więc `militaryRatioWar(B→A) = 1 / militaryRatioWar(A→B)`. Parytet (równe siły, zero bitew, równe pule) → 1.
- Progi w skali logarytmicznej: przewaga gdy `ln(ratio) ≥ ln(1,5)`, słabszy gdy `ln(ratio) ≤ −ln(1,5)`, między — neutralnie. Wartość 1,5 jest ZAŁOŻENIEM Z-D (decyzja ABC przed wdrożeniem progu).
- Zakres: `clamp(ratio, 1/K, K)`, K = 4 (Z-C).

Wariant przedwojenny (Z-G2, tylko dla wypowiedzenia wojny): `ratioPrzed(A→B) = R_sila · R_pula` (bez R_bitwy, bo zero bitew przed wojną).

### B3. Gdzie liczyć (bez zmian względem 4c)

Czysta funkcja w nowym pliku, np. `gra/src/game/diplomacy-military-ratio-war.ts`. Wejście: `{ silaA, silaB, wygraneA, wygraneB, pulaA, pulaB, K }`. Test w `tools/` (wzorzec `tools/diplo-peace-balance-accept-test.cjs`).

### B4. Kolejność wdrożenia (korekty)

- K1 — czysta funkcja (B2) z progiem i K jako parametrami; bez podpięcia. Nie zależy od Z-D.
- K2 — suma wojskowa = Armia (`power-objective.ts:241`), test.
- K3 — pole `wojnaBitwy` w `DiploPairMeta`, reset w `main.ts:11551–11563`, zapis w `applyMapBattleOutcome` (`main.ts:34998`, wpięcie przy `main.ts:35027`). Test: AI↔AI zapisuje obie strony.
- K4 — migracja zapisów (Z-E): brak pola = 0; test wczytania starego zapisu (`main.ts:47542`).
- K5 — podpięcie do pokoju/rozejmu (`ai.ts:7118–7150`, `diplomacy-proposals.ts:1328, 2279`, `main.ts:12060`, `21564`) PO ujednoliceniu miary (C3) i po decyzji ABC o progu (Z-D).
- K6 — wypowiedzenie wojny (`ai.ts:6852–7312`) — wariant Z-G (bez zmian) albo Z-G2, po decyzji właściciela.
- K7 — UI: pozycja w panelu wojny; komponent do wskazania (NIE ZWERYFIKOWANO), bez wpływu na Respekt.
- K8 — usunięcie uśpionych zdarzeń `przewaga_militarna` / `slabszy_militarnie` (`diplomacy.ts:875–876, 1017–1024`, `data/diplomacy.json:14–15`, `diplomacy-factors.ts:72–73`) po decyzji Z-F.
- K9 — usunięcie clampa wojennego (`diplomacy.ts:1094, 1860`) i reguła etykiety (`diplomacy-display.ts:360–364`), osobny temat, po decyzji Z-B. Zmienia zapisany Respekt i progi PN (p.A Z3).

---

## C. Lista ZAŁOŻEŃ DO POTWIERDZENIA (kod nie rozstrzyga; podano wartość domyślną)

- Z-A — Miara dla AI: domyślnie NOWA miara (wojskowa) tylko dla `militaryRatioWar`; `rw` i progi AI (`ai.ts:6229`, `ai.ts:7121`) zostają bez zmian.
- Z-B — Clamp wojenny: domyślnie zostaje w tick (`diplomacy.ts:1860`) i w zastosowaniu (`diplomacy.ts:1094`) do osobnej decyzji (K9). `militaryRatioWar` NIE zmienia Respektu.
- Z-C — Wykładnik każdego czynnika = 1; K obcięcia = 4. Wariant Z-C2: `R_bitwy²` (silniejszy wpływ bitew) — tylko po wyborze właściciela.
- Z-D — Próg przewagi: domyślnie NIE 1,5×. Nowy, osobny parametr w `diplomacy-war-peace-params.json` (nie zmieniać `przewagaMilitarna.prog = 0.2`, linia 91). Wartość 1,5× (ln 1,5) jako startowa dla nowego parametru. Decyzja ABC właściciela przed K5 (CLAUDE.md §3).
- Z-E — Zapisy gry: stary zapis bez `wojnaBitwy` = 0 bitew; stempel startu wojny zostaje jak dziś.
- Z-F — Zdarzenia +15/−10: usunąć definicje (K8). Nie reaktywować bonusów.
- Z-G — Wypowiedzenie wojny: domyślnie `militaryRatioWar` NIE jest liczony przed wojną; decyzja zostaje na `PROG_WOJNA_SILA = 0.6` (`ai.ts:6229`).
- Z-G2 — Wariant do wyboru: wypowiedzenie wojny z miarą przedwojenną `R_sila · R_pula` i tym samym progiem ln 1,5 (B2). Domyślnie nieaktywny.
- Z-H — Rekruci liczeni raz: domyślnie (a) = tylko Armia, a Rekruci wchodzą przez pulę (c). Rozbieżność z dosłownym założeniem 3(a) właściciela („Armia + Rekruci”) jest jawna (p.A Z1).
- Z-I — Remis nie jest liczony w `wojnaBitwy`. Domyślnie tak (`militaryWinRespectPair` zwraca null dla `remis`, `diplomacy.ts:1133`).

---

## D. Testy (aktualizacja T1–T10 z `10-operator-claude.md` p.9)

- T1 — Symetria: `militaryRatioWar(A→B) · militaryRatioWar(B→A) = 1` dla losowych danych.
- T2 — Parytet: zero bitew, równe pule i siły → 1.
- T3 — Suma wojskowa (K2): tylko Armia, bez Rekrutów (Z-H) i bez gospodarki.
- T4 — Start od zera: nowa wojna resetuje `wojnaBitwy`; pokój czyści (`main.ts:11558–11563`).
- T5 — Licznik bitew AI↔AI zapisuje obie strony (K3); remis nie liczy się (Z-I).
- T6 — Migracja: stary zapis bez pól wczytuje się bez błędu (wzorzec `freshDiploPairMeta`, `diplomacy-pn-engine.ts:143–145`).
- T7 — Brak wpływu na Respekt/Zaufanie/Power dla pustego licznika bitew.
- T8 — `tools/diplo-peace-balance-accept-test.cjs` (prog 0.2 i G7) nadal zielony.
- T9 — `tools/diplo-respect-military-events-test.cjs` po K8 zaktualizowany wg Z-F.
- T10 — `tools/diplo-war-peace-sim-test.cjs` po K5/K6.
- T11 — NOWE: `R_bitwy(A→B) = 1 / R_bitwy(B→A)` oraz brak kwadratu: dla `wygraneA=3, wygraneB=1` wynik `R_bitwy = 4/2 = 2`, a nie 4 (Z2).

---

## E. Ryzyka (aktualizacja)

- R1–R2, R4–R9 z `10-operator-claude.md` p.5 bez zmian (dowody tam).
- R3 (zawężone, Z4): dotyczy wyłącznie zapisów sprzed stempla `wojnaStartTura`. Nowe zapisy są bezpieczne (`main.ts:11545–11556`).
- R4 (uzupełnione, Z3): clamp w propozycjach działa na Respekcie z Mocy (`main.ts:24702–24708`), więc zmienia progi PN nawet bez zmiany zapisu.
- R10 — NOWE: `main.ts:6073` (pętla granic `diplomacyRelations.set`) może zmieniać status; NIE ZWERYFIKOWANO. Jeśli tak, stempel startu jest pomijany i trzeba go objąć.

---

## F. Bramki

- Zmian kodu NIE wykonano. `tsc` i 5 bramek referencyjnych: NIE_DOTYCZY (zgodnie z dispatchem, „Zmian kodu NIE ma”).
- Allowlista: zmieniony tylko ten plik runu. `git diff --name-only f39b58091 HEAD` ma pokazać wyłącznie `dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1/30-obrona-claude.md`.
- `git diff --check`: wynik w sekcji TESTY poniżej.
- Kryterium dispatchu „brak słowa pytanie w sekcji ZAŁOŻENIA”: sekcja C nie zawiera tego słowa (sprawdzone przed commitem).

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (specyfikacja; zero zmian kodu gry)
TEMAT: R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1
GOAL: odpowiedź na zarzuty Z1–Z7 z poprawioną specyfikacją (p.A–D). Zero zmian kodu.
ZMIANY-COMMIT: jeden plik `dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1/30-obrona-claude.md` (SHA commita: podany w odpowiedzi orkiestratorowi). Plik `10-operator-claude.md` nie zmieniony.
TESTY: NIE_DOTYCZY (brak zmian kodu). Sprawdzenia: wszystkie cytowane linie sprawdzone `grep`/`sed`/`awk` na f39b58091 (liczby w p.A). Nie uruchamiano `git diff --check` jako osobnego wyniku w tej rundzie (patrz F).
BLOKADY: NIE ZWERYFIKOWANO: UI kliknięcia wypowiedzenia wojny, szczegóły `forced-war-bronze/iron/stone/waves.ts`, UI panelu wojny (K7), pełni czytelnicy zapisanego Respektu w wojnie, `main.ts:6073`.
RUNDY: 2/5 (runda 1 = Operator `10-operator-claude.md`; runda 2 = ten dokument, obrona)
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja poprawek Z1–Z7 (allowlista, 5 losowych dowodów plik:linia, w tym `power-objective.ts:244`, `diplomacy.ts:1860`, `main.ts:34998`, `main.ts:35027`, `diplomacy-war-peace-params.json:91`). Orkiestrator — Z-D jako próg liczbowy wg CLAUDE.md §3 (ABC) przed K5; K1 nie zależy od Z-D.
DEPLOY/PUSH: NIE WYKONANO
