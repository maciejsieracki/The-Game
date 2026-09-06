# P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1 — Evaluator, runda 1/5

MODEL+EFFORT: Opus 5, effort high · DATA: 2026-09-05 · IZOLACJA: `/home/user/wt-barbarzyncy`,
gałąź `autobot/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1`. Guard §2b: baza `022b82aa` = `HEAD~1`,
drzewo czyste przed pracą. Werdyktu nie wydaję — to Final Control.

## CO ZWERYFIKOWAŁEM WŁASNYM PRZEBIEGIEM

**Własny harness, geometria INNA niż Operatora** (plansza 44×14, miasta niewspółliniowe
`(4,2)/(13,11)/(22,4)/(29,12)`, bronione `(36,7)`, start `(2,12)`), BASE vs HEAD z osobnych
bundli (`git show 022b82aa:` do kopii poza repo). 12 kombinacji (2/3/4 niebronione ×
easy/normal/hard/pominięty), 300 tur:

- BASE: cykl o okresie 36 (2 miasta), 55 (3 miasta), `attack` NIGDY, min. dystans 22/16;
  easy i `difficulty` pominięty — parkowanie (okres 1), min. dystans 33.
- HEAD: `attack` w turze **50 / 53 / 58**, zero powtórzeń stanu, każde niebronione miasto
  odwiedzone **dokładnie raz**, 0 tur bezczynności — we wszystkich 12 kombinacjach.
- Bit-identyczność logów easy=normal=hard=pominięty: BASE **nie**, HEAD **tak** (md5 logów).
  Dowód strukturalny potwierdzony osobno: w ciele `decideBarbarianMoves` (linie kodu, bez
  komentarzy) `difficulty` pada **wyłącznie w sygnaturze**.

**Kryteria 5–7 (własne uruchomienia):** `tsc --noEmit` 0 błędów. Pięć referencyjnych:
logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
Rodzina barbarzyńców — **16** bramek (grep `barb|raid|oboz` po `tools/*test.cjs`):
12 zielonych (m.in. barb-city-behavior **177/0**, barbarians-test 213/0, krazenie 123/0),
4 czerwone. Czerwone zweryfikowane jako **pre-istniejące** podmianą `barbarians.ts` na wersję
bazową (kopia, przywrócenie byte-identyczne, `git diff --quiet`):
barb-camp-destruction 82/2, barb-city-capture-cluster 92/1, oboz-lowiecki-las 72/19,
oboz-lowiecki-las-znika-render 26/1 — te same liczby na bazie. Zero regresji.

**Kryterium 4:** własne odtworzenie liczb Operatora — podwójne cofnięcie naprawy daje
`barbarzyncy-krazenie` **74 faili**, `barb-city-behavior` **5 faili**. Zgadza się co do liczby.

**Zakres (§2b):** `git diff 022b82aa..HEAD --stat` = 5 plików: `barbarians.ts`,
`barbarzyncy-krazenie-test.cjs` (nowy), `barb-city-behavior-test.cjs`, dwa artefakty runu.
**Zero** zmian w `gra/src/game/ai.ts` i `gra/src/main.ts`. `gra/data/*.json` nietknięte.

**Trzy własne mutacje** (inne niż Operatora), każda cofnięta KOPIĄ, `git diff --quiet` po każdej:
M-E1 usunięcie `targets.push(...revisitTargets)` → **złapana** (krazenie 101/9, sekcja 6);
M-E2 `continue` → `break` → **NIEZŁAPANA** (110/0, 148/0, 213/0);
M-E3 usunięcie guarda `civCitiesBase.length > 0` → **NIEZŁAPANA** (110/0, 148/0, 213/0).

## ZARZUTY

**1. Dowód kryterium 1 nie pokrywa ścieżki produkcyjnej — `turn` pominięty.**
Miejsce: `gra/tools/barbarzyncy-krazenie-test.cjs`, funkcja `simulate` (sekcje 1–3) — wywołanie
`decideBarbarianMoves(..., difficulty)` **bez dziewiątego argumentu `turn`**; tak samo cała
tabela 4 osi. `gra/src/main.ts:32209–32212` przekazuje `turn`.
Dlaczego to ma znaczenie: `barbarians.ts:2160–2170` — `turnNum = turn ?? 0`, więc przy pominiętym
`turn` `orphanedAtTurn=0`, `orphanedChaseExpired` nigdy nie jest prawdą i jednostka osierocona ma
`chaseRadius=Infinity` przez wszystkie 300 tur. Produkcja tego stanu nie wytwarza —
`orphanedChaseTurnLimit=10`. Mój pomiar tego samego scenariusza z przekazanym `turn`:
HEAD `attackTurn=-1`, pozycja końcowa `15,3`, dystans do bronionego **37**, 289 komend bez zmiany
pozycji; BASE ta sama pozycja, 287 tur idle. Bez `turn` ten sam HEAD daje `attackTurn=50/51`.
Sondowałem dodatkowo ścieżkę obozową (obóz trwale raid-ready, garnizon `unitsPerCamp=2`) oraz
regime lokalny (bez obozu, miasta wewnątrz `aggroRadius`) — w **żadnej** konfiguracji
przekazującej `turn` nie odtworzyłem korzyści z naprawy. Dispatch, TRYB PIERWSZY: kryterium 1
żąda liczb z przebiegu; przebieg istnieje, ale w parametryzacji, której `main.ts` nie wywołuje.
Poprawka: dodać do sekcji 1–3 wariant z przekazanym `turn` (albo z obozem trwale raid-ready)
i nazwać produkcyjną konfigurację, w której naprawa działa.

**2. Fałszywe zdanie w komentarzu produkcyjnym (TRYB TRZECI, pkt 1 dispatchu).**
Miejsce: `gra/src/game/barbarians.ts:1947–1950` (PL) i bliźniaczy akapit EN. Treść: „TA runda NIE
zmienia tego rezimu ani na lepsze, ani na gorsze -- zweryfikowane wykonaniem: logi komend przed/po
sa BIT-IDENTYCZNE (sekcja 6 bramki barbarzyncy-krazenie-test.cjs mierzy to jawnie...)".
Trzy niezależne kontrprzykłady: (a) mój pomiar w tym reżimie (2 niebronione osiągalne + bronione
za barierą morza, jednostka raid-ready): BASE 251 realnych ruchów / 24 idle, HEAD 13 realnych
ruchów / 287 komend bez ruchu — logi nie są bit-identyczne; (b) **własna tabela Operatora**
`01-operator-runda1-tabela-4-osi.txt` oznacza te wiersze jako „nie" (np.
`3/1/NIEOS/raid/normal | KRAZENIE okres 45 [idle 13/300] -> stoi/bezczynna [idle 0/300] | nie`);
(c) sekcja 6 bramki **nie mierzy** bit-identyczności — nie ma referencji „przed", asercjonuje
wyłącznie `eq(idle, 0)`. Ten sam plik sam sobie przeczy: linie 2088–2092 mówią, że zamrożenie
w TYM SAMYM reżimie zniknęło (287–296/300 tur bezczynności → 0).

**3. `idle === 0` nie dowodzi, że jednostka działa — bezczynność zamieniona na komendę bez skutku.**
Miejsce: `gra/tools/barbarzyncy-krazenie-test.cjs` sekcja 6, jedyna asercja
`eq(idle, 0, "...jednostka raid-ready NIE jest zamrozona")`. Mój pomiar w tym reżimie: HEAD wydaje
**287/300** komend `move` na zablokowany heks już odwiedzonego miasta, pozycja niezmienna
(1 unikalna pozycja w ostatnich 60 turach); BASE w tym samym reżimie 251 realnych ruchów.
Jednostka jest unieruchomiona — asercja tego nie widzi, a raport ogłasza „Zamrożenia zniknęły".
To jest TRYB DRUGI dispatchu w reżimie, który werdykt rundy 6 kazał udokumentować.
Poprawka: asercja o realnej zmianie pozycji (liczba unikalnych pozycji w ogonie logu > 1),
nie o samej obecności komendy.

**4. Trzecia część naprawy (`break` → `continue`) bez żadnego pokrycia.**
Miejsce: `gra/src/game/barbarians.ts:2335`. Moja mutacja M-E2 (powrót do `break`, cofnięta kopią):
`barbarzyncy-krazenie` 110/0, `barb-city-behavior` 148/0, `barbarians-test` 213/0 — komplet
zielony. Przyczyna: we wszystkich scenariuszach bramek jednostka jest raid-ready, więc
`chaseRadius=Infinity` i warunek `cand.d > chaseRadius` nigdy nie zachodzi — oba segmenty listy są
nierozróżnialne. Komentarz przy tej linii twierdzi, że zmiana jest konieczna, bez pokrycia
pomiarem. Kryteria 3 i 4 dispatchu wymagają, by bramka przypinała naprawę, a mutacja czerwieniła.
Poprawka: scenariusz z jednostką NIE raid-ready, kandydatem zwykłym poza `chaseRadius`
i kandydatem „ostatniej deski" w zasięgu, plus dowód mutacyjny 9e.

**5. Guard `civCitiesBase.length > 0` bez pokrycia.**
Mutacja M-E3 (usunięcie guarda): wszystkie trzy bramki zielone. Komentarz (linie 1927–1929)
przypisuje mu efekt behawioralny („chroni przed resetowaniem w kolko"), którego żaden test nie
pokazuje. Waga niższa niż 2–4, ta sama klasa: twierdzenie bez pomiaru.

**6. Osłabienie istniejącej bramki — żywy dowód mutacyjny zamieniony na wymóg, by mutant przechodził.**
Miejsce: `gra/tools/barb-city-behavior-test.cjs` sekcja 13:
`expectSelfCheckFails(..., /FAIL:\s+6f/)` → `expectSelfCheckPasses(...)`. Skutek: gałąź produkcyjna
`unit.clearedCityIds = lastVisited !== undefined ? [lastVisited] : []` (`barbarians.ts:2010–2011`)
nie jest już odróżniana od `[]` przez żadną asercję w rodzinie barbarzyńców, a nowa asercja
**wymaga**, żeby mutant był zielony. Allowlista dla istniejących bramek brzmi „wyłącznie dodanie
asercji; zakaz usuwania i osłabiania" — ujawnienie w nocie N2 nie czyni tego zgodnym.
Dodatkowo gałąź `: []` jest martwa: reset odpala się wyłącznie przy
`filtered.length === 0 && civCitiesBase.length > 0`, co implikuje, że każde miasto cywilizacji jest
w `clearedSet`, więc `clearedSet` jest niepusty i `lastVisited` zawsze zdefiniowany.
Poprawka (wymaga decyzji Final Control): albo uprościć kod produkcyjny do `[]` i usunąć martwą
gałąź, albo zbudować scenariusz, w którym warianty realnie się różnią, i przywrócić zabijający
dowód mutacyjny.

**7. Rozjazdy liczbowe w samym raporcie.** Sekcja TESTY: „3 czerwone pre-istniejące"; sekcja
rodziny barbarzyńców wymienia i nazywa **cztery** (zgodnie z moim pomiarem — cztery).
Tamże „14 bramek" przy 16 wymienionych i zmierzonych.

## NIE ZARZUT — zapis do decyzji Final Control (nota N1 Operatora)

Odwrócenie asercji w sekcji 6d i przepięcie dowodu mutacyjnego sekcji 10
(`barb-city-behavior-test.cjs`) uznaję za **wymuszone i nieosłabiające**: plansza sekcji 6d to
dokładnie scenariusz ze zgłoszenia, a stare asercje (`resetIdx !== -1`, `arrivalCount >= 2`) żądają
krążenia, które wiążące ECHO każe usunąć — nie da się ich utrzymać zielonymi. Zamienniki są
ściślejsze (`eq(resetIdx,-1)`, `eq(n,1)` zamiast `>=2`) plus dwie dodane asercje behawioralne,
a dowód mutacyjny sekcji 10 zweryfikowałem jako żywy (moje pełne cofnięcie naprawy daje 5 faili
w tej bramce). To odstępstwo od litery allowlisty, które formalnie błogosławi Final Control —
nie defekt. Nota N3 (wpis bramki do §6 `R-PROC-AUTOBOT.md`) jest słuszna: `docs/decyzje/**` jest
poza allowlistą tematu, wpis należy do integracji.

## KONTRAKT

STATUS: FAIL
DOMAIN: GAME
TEMAT: P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1
GOAL: barbarzyńca przed wyborem celu podejmuje decyzję i ją realizuje; oscylacja bez dotarcia do
żadnego celu znika; jedna reguła na wszystkich poziomach trudności
ZMIANY/COMMIT: bez zmian w kodzie gry; ten raport w
`dyspozycje/autobot/runs/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1/02-evaluator-runda1.md`
TESTY: własna symulacja 300 tur na własnej geometrii, BASE vs HEAD, 12 kombinacji (objaw
odtworzony i naprawa potwierdzona przy `turn` pominiętym; przy `turn` przekazywanym jak w
`main.ts` — brak poprawy) · tsc 0 · 5 referencyjnych 213/19/33/13/6 · rodzina barbarzyńców 16
bramek, 4 czerwone potwierdzone jako pre-istniejące podmianą na bazę · 3 własne mutacje
(1 złapana, 2 niezłapane) · odtworzone liczby mutacji Operatora 74 i 5
BLOKADY: brak blokad technicznych; zarzut 6 dotyka granicy allowlisty i wymaga rozstrzygnięcia
Final Control
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / Final Control (Sonnet 5, effort high, osobny subagent)
DEPLOY/PUSH: NIE WYKONANO
