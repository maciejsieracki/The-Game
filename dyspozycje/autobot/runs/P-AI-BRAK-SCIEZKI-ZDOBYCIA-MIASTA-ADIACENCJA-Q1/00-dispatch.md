# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 — dispatch

TEMAT: `P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`
RUNDA: 1/5 · DATA: 2026-09-05 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.

## WYZWALACZ

Znalezisko Evaluatora (zweryfikowane porównaniem z baseline `9e96370a` — identyczne, więc
**nie jest to regres** cofnięcia ataku dystansowego):

Gałąź AI `gra/src/game/ai.ts:2517` (komentarz w kodzie: `// 4b: adjacent enemy city ->
move onto it (engine handles capture)`) emituje rozkaz `move` na heks obcego, niebronionego
miasta w adiacencji — ale **egzekutor w `main.ts` ZAWSZE odrzuca ten rozkaz** przez
`canUnitOccupyCityHex`, która blokuje bezwarunkowo każdy obcy heks miasta. Jednostka trafia
do `unitActed.add()` i **traci całą turę nic nie robiąc**.

Wszystkie dzisiejsze wywołania `tryAutoCaptureEmptyCityAt` prowadzą od **gracza (3×)**
i **barbarzyńców (1×)** — **zero od cywilizacji AI**. Duże AI nie ma więc ŻADNEJ działającej
ścieżki zdobycia miasta przez zwykłą adiacencję.

**Nie mylić z atakiem dystansowym** — to był inny mechanizm, świadomie cofnięty.

## ECHO WŁAŚCICIELA (2026-09-05) — WIĄŻĄCE

**„NAPRAWIĆ — AI ma zdobywać miasta jak gracz."**

To jest **wyrównanie parytetu, nie nowa funkcja**: gracz i barbarzyńcy mają tę ścieżkę
sprawną od dawna, cywilizacje major jej nie mają.

**Świadomie przyjęty skutek: AI zaczyna realnie odbierać miasta — sobie nawzajem i graczowi.**
Zgłoszenie tego jako „zbyt duża zmiana trudności" będzie błędem Evaluatora.

## GRANICA PROCESOWA — PRZECZYTAJ, ZANIM ZACZNIESZ

Ten sam problem próbowały naprawić rundy 3-4 tematu `P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE`
— **pod pomyłkowo zrozumianym zakresem**, przez ścieżkę ataku dystansowego zamiast zwykłej
adiacencji. Wynikła z tego czterorundowa saga i cofnięcie pracy. **Nie rozszerzaj zakresu
na atak dystansowy, na zdobywanie miast bronionych, ani na priorytety celów AI.**
Zakres to jedno zdanie: **rozkaz `move` AI na sąsiedni, niebroniony obcy heks miasta ma
skutkować przejęciem, tak jak u gracza.**

## GOAL

`tryAutoCaptureEmptyCityAt` (albo równoważna ścieżka) jest osiągalna dla ownera będącego
cywilizacją major, z tymi samymi warunkami co u gracza i barbarzyńców. Jednostka AI, która
wydała ten rozkaz, **nie traci tury bez efektu**.

## KRYTERIA KOŃCA (binarne)

1. **Reprodukcja PRZED naprawą:** scenariusz — jednostka AI major sąsiaduje z niebronionym
   obcym miastem. Pokaż, że rozkaz jest emitowany, odrzucany, a jednostka ląduje
   w `unitActed` bez efektu. **Podaj ślad, nie opis.**
2. **Po naprawie:** ta sama jednostka przejmuje miasto. Podaj stan przed i po
   (`cities[].ownerId`, pozycja jednostki, `unitActed`).
3. **Parytet trzech ścieżek:** gracz, barbarzyńcy i AI major przechodzą przez te same
   warunki przejęcia. Jeśli znajdziesz warunek, który dotyczy tylko jednej z nich —
   **wypisz go i uzasadnij**, czy jest zamierzony. Warunek niezamierzony i nieuzasadniony
   = defekt do naprawy w tej rundzie.
4. **Miasto BRONIONE nadal nie jest przejmowane rozkazem `move`** — asercja negatywna.
   To jest granica zakresu i musi być pilnowana testem, inaczej naprawa cicho urośnie.
5. Nowa bramka `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs` z asercjami 1-4.
6. Mutacja: cofnij naprawę — bramka czerwienieje, podaj liczbę faili. Cofnij przez KOPIĘ
   pliku, `git diff --quiet`.
7. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
8. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.
9. Rodzina AI i przejęć miast zielona — wyznacz grepem po `gra/tools/` (`ai-`, `capture`,
   `miasta`, `podboj`, `city`), wypisz listę i wynik każdej. **Szczególnie sprawdź
   bramki barbarzyńców i gracza** — dzielą z AI tę samą funkcję przejęcia i to one wyłapią
   przypadkowe rozluźnienie warunków.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — ROZLANIE ZAKRESU.** To jest udokumentowany, powtarzalny tryb błędu tego
konkretnego obszaru: cztery rundy poprzedniego tematu poszły w atak dystansowy zamiast
w adiacencję. Kryterium 4 (asercja negatywna na miasto bronione) istnieje właśnie po to.

**Tryb drugi — ROZLUŹNIENIE `canUnitOccupyCityHex` DLA WSZYSTKICH.** Najprostsza droga to
zdjąć bezwarunkową blokadę. To zepsułoby gracza i barbarzyńców, a bramki tego mogą nie
złapać od razu. Naprawa ma **dodać ścieżkę dla AI**, nie znieść regułę dla wszystkich.
Kryterium 9 wymaga uruchomienia bramek gracza i barbarzyńców właśnie z tego powodu.

**Tryb trzeci — NAPRAWA „NA PAPIERZE".** Zmiana, po której rozkaz przestaje być odrzucany,
ale jednostka i tak nie przejmuje miasta (bo brakuje drugiego kroku), przechodzi każdy test
sprawdzający „czy rozkaz nie został odrzucony". Kryterium 2 wymaga stanu `cities[].ownerId`
przed i po — czyli faktu przejęcia, nie faktu nieodrzucenia.

## ALLOWLISTA

- `gra/src/game/ai.ts` — okolice `:2517`
- `gra/src/game/city-hex-movement.ts`
- `gra/src/main.ts` — **wyłącznie** ścieżka egzekucji rozkazu `move` na heks miasta
  i wywołanie `tryAutoCaptureEmptyCityAt` dla ownera AI. Nic więcej w tym pliku.
  Jeśli naprawa wymaga zmian w innym miejscu `main.ts` — `DECISION_REQUIRED`.
- `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs` (NOWY)
- `dyspozycje/autobot/runs/P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1/` (raporty)

Zakazane bezwzględnie: `gra/src/game/barbarians.ts` (trzyma go temat
`P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1`, §2b), `gra/src/battle/**`, `gra/data/**`,
pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-ai-adiacencja`, gałąź
`autobot/P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Przy decyzji produktowej zatrzymujesz się ze statusem `DECISION_REQUIRED`.
Raport maksymalnie ok. 400 słów, destylat.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

## C-001 (bariera CHRONIONA)

Brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje JSON) —
dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir".
Jedyna dozwolona kompilacja to `node ./node_modules/typescript/bin/tsc --noEmit`; bramki
`node gra/tools/*-test.cjs` nie są nim objęte. `--outDir` poza drzewem repo, z UNIKALNYM
sufiksem (PID albo losowy).

## GUARD IZOLACJI (§2b, obowiązkowy przed pracą)

`git -C <worktree> log -1 --oneline` i `git -C <worktree> status --short`. Oczekiwana baza
i czyste drzewo. Rozbieżność → `BLOCK`, bez zapisu. Mutacje cofaj przez KOPIĘ pliku,
nigdy przez `git checkout`.

---

## RATYFIKACJA ORKIESTRATORA — runda 2 (2026-09-06, po Final Control `FAIL`)

Jeden `NAPRAW` i jedna pozycja do mojego rozstrzygnięcia. Obie poniżej.

### R2-F1 (`NAPRAW`) — wpięcie `unitIsCivilian` w `main.ts` nie jest pilnowane żadną asercją

Mutacja M3 Final Control **zostawia bramkę 84/84 zieloną**, po cichu wyłączając silnikową
barierę wprowadzoną naprawą zarzutu 1. Blok A5 pilnuje `canOccupyCityHex` i sąsiadów,
ale samego wpięcia — nie.

To jest ta sama klasa, którą łapiemy dziś w czterech tematach naraz: **bramka opisuje kod,
którego istnienia nie sprawdza**. Naprawa jest zielona, asercja jest zielona, a wyłączenie
naprawy niczego nie czerwieni.

**Dołóż asercję pilnującą wpięcia** i udowodnij ją **powtórzeniem mutacji M3** — bramka ma
teraz czerwienieć, z podaną liczbą faili. Bez tego przebiegu runda jest niedomknięta.
Liczba asercji rośnie, nie spada.

### R2-F2 (moje rozstrzygnięcie) — `gra/src/game/ai-city-capture-executor.ts` poza allowlistą

Final Control słusznie zauważył, że pliku **nie ma ani na allowliście, ani na liście
zakazanych**. Zmiana była minimalna i **wymuszona przez `tsc`**.

**Rozstrzygam: plik wchodzi do allowlisty, zmiana zostaje.** Powód: to jest plik utworzony
przez samą naprawę, a nie cudzy plik wciągnięty do zakresu; bez niego naprawa nie kompiluje
się. Allowlista rundy 1 była moja i była niepełna — **to mój błąd w dispatchu, nie
przekroczenie zakresu przez Operatora.** Operator postąpił prawidłowo, zgłaszając to zamiast
przemilczeć.

**Granica zostaje ostra:** ani jednej innej zmiany w tym pliku ponad to, co wymusza `tsc`.
W raporcie wypisz jego pełny diff — ma być tak mały, jak twierdzisz.

### Czego runda 2 NIE robi

Nie rusza zakresu z rundy 1 (przejęcie miasta niebronionego przez adiacencję).
Nie dotyka `barbarians.ts` — trzyma go temat barbarzyńców (§2b).
Nie rozszerza naprawy na miasta bronione — asercja negatywna z kryterium 4 zostaje.

### KRYTERIA KOŃCA rundy 2

1. Nowa asercja pilnująca wpięcia `unitIsCivilian`; mutacja M3 → **czerwona**, podaj liczbę faili.
2. Liczba asercji w bramce **nie mniejsza** niż 84.
3. Pełny diff `ai-city-capture-executor.ts` w raporcie, ograniczony do tego, co wymusza `tsc`.
4. Asercja negatywna „miasto BRONIONE nadal nie jest przejmowane rozkazem `move`" —
   nadal zielona i nadal nietautologiczna (pokaż mutacją).
5. `tsc --noEmit` zielony; pięć bramek referencyjnych zielonych.
6. Bramki gracza i barbarzyńców zielone — dzielą z AI tę samą funkcję przejęcia i to one
   wyłapią przypadkowe rozluźnienie warunków.

Mutacje cofaj przez KOPIĘ pliku, `git diff --quiet` po każdej.
