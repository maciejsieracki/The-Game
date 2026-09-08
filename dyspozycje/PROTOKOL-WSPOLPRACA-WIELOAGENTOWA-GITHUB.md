# PROTOKÓŁ: współpraca wieloagentowa przez GitHub (Orkiestrator + Workerzy)

**ID:** `R-PROC-WIELOAGENT-GITHUB-Q1` · **Status:** OBOWIĄZUJE · **Domena:** PROCESS
**Repozytorium:** `maciejsieracki/the-game` (branch główny: `main`)

**Dla kogo jest ten plik:** dla KAŻDEGO agenta/sesji AI innej niż Orkiestrator (patrz §1),
który ma pracować nad kodem tej gry z innej maszyny/kontenera/sesji chmurowej (np. agent
o nazwie roboczej „Hermes", albo dowolny kolejny). Jeśli zostałeś skierowany do tego pliku
poleceniem właściciela typu „przeczytaj ten plik i pracuj według niego" — przeczytaj go
**w całości, teraz, zanim zrobisz cokolwiek w tym repozytorium**. Ten dokument jest
samowystarczalny: nie musisz czytać reszty repo, żeby zacząć bezpiecznie pracować, ale
łamanie zasad tutaj opisanych jest traktowane tak samo poważnie, jakbyś złamał je po
przeczytaniu całej dokumentacji projektu.

---

## 0. Dlaczego ten dokument istnieje

Właściciel projektu prowadzi równolegle **więcej niż jednego agenta AI** nad tym samym
repozytorium, na różnych maszynach/kontenerach, bez współdzielonego systemu plików.
**Jedynym fizycznym punktem styku jest GitHub** (`origin` tego repozytorium). Żeby dwóch
niezależnych agentów nie nadpisało sobie nawzajem pracy na `main`, obowiązuje twardy
podział ról: **jedna, zawsze ta sama sesja jest Orkiestratorem/Integratorem i tylko ona
robi `git push` na `main`**. Każdy inny agent (Ty) jest **Workerem** — pracuje wyłącznie
na własnej gałęzi i przekazuje gotową pracę przez Pull Request, nigdy przez bezpośredni
push na `main`.

---

## 1. Role

| Rola | Kto | Co robi | Push na `main`? |
|---|---|---|---|
| **Orkiestrator/Integrator** | jedna, ustalona sesja Claude Code (ta, która prowadzi plan hot-seat i pisze ten dokument) | przyjmuje gotowe PR-y od Workerów, weryfikuje je niezależnie, scala do `main`, aktualizuje `WERSJE.md`/`REJESTR-PROSB-I-ZADAN.md`, robi deploy do `gra-robocza/` | **TAK — wyłącznie ona** |
| **Worker** (np. Hermes) | Ty, czytelniku tego pliku, i każdy kolejny agent w tej samej roli | diagnozuje/implementuje JEDEN temat na własnej gałęzi, dowodzi poprawności własnymi bramkami, otwiera Pull Request | **NIGDY** |

Jeśli nie jesteś pewien, czy jesteś Workerem — **jesteś Workerem**, chyba że właściciel
jawnie i pisemnie (w pliku albo w wiadomości, którą możesz zacytować) powiedział inaczej.

---

## 2. TWARDE ZASADY — nie do złamania niezależnie od okoliczności

1. **NIGDY nie pushujesz, nie mergujesz i nie robisz `rebase`/`force-push` na branchu `main`.**
   Nie ma wyjątku „tylko ta jedna mała poprawka" ani „branch był bardzo aktualny".
2. **Cała Twoja praca żyje na jednej gałęzi `hermes/<PEŁNE-ID>`** (patrz §4 — nazewnictwo),
   założonej ze **świeżo sfetchowanego** `origin/main`. Nie pracujesz bezpośrednio na `main`
   nawet lokalnie w swoim kontenerze.
3. **Nigdy nie edytujesz tych plików** (są własnością wyłącznie Orkiestratora, aktualizowane
   dopiero przy integracji/deployu — edycja przez Ciebie tworzy gwarantowany konflikt):
   - `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
   - `dyspozycje/WERSJE.md`
   - `dyspozycje/PYTANIA-OTWARTE.md`
   - `dyspozycje/_handoff/KANAL-PRACA.md`, `dyspozycje/_handoff/HANDOFF-AKTUALNY.md`
   - `gra-robocza/**` (w tym `ROBOCZA-MANIFEST.json`) — to jest deploy, robi go wyłącznie Orkiestrator
   - `playbook.json` (generowany z `playbook.md`, nigdy ręcznie)
   Twój własny raport zapisujesz WYŁĄCZNIE w nowym katalogu, który sam tworzysz:
   `dyspozycje/autobot/runs/<PEŁNE-ID>/` (patrz §6).
4. **Nigdy `npm run build` ani `npm run dev` w `gra/`** — skrypt `export-data` nadpisuje
   pliki JSON z danymi gry i je niszczy. Jedyny dozwolony build:
   `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir` (uruchamiany z
   katalogu `gra/`). Jedyna dozwolona kompilacja/typecheck:
   `node ./node_modules/typescript/bin/tsc --noEmit` (z `-p gra/tsconfig.json` albo z
   katalogu `gra/`). Uruchamianie gotowych bramek `node gra/tools/*-test.cjs` nie jest tym
   objęte — to normalne i wymagane.
5. **Nigdy `git add -A` ani `git add .`.** Dodajesz pliki po nazwie, jeden po drugim —
   dokładnie te z Twojej allowlisty tematu (§5).
6. **Zero sekretów, kluczy API, poświadczeń** w kodzie, komentarzach, plikach testowych,
   commitach — nawet jako przykład.
7. **Zmiana samego procesu (w tym tego pliku) nigdy nie jedzie razem ze zmianą w `gra/`.**
   To osobny temat, osobny PR.
8. **Balans gry (progi liczbowe, koszty, mnożniki, wymagania dyplomacji/zaufania, trudność)
   wymaga jawnej zgody właściciela PRZED implementacją**, nawet jeśli jesteś w 100% pewien
   diagnozy. Jeśli Twoje zadanie dotyka balansu, a właściciel nie dał jawnej decyzji A/B/C —
   **zatrzymaj się i zapytaj, zanim napiszesz kod.**
9. **Parytet gracz↔AI**: każda reguła/formuła/próg obowiązuje tak samo gracza i każdą
   cywilizację AI/państwo-miasto, chyba że właściciel jawnie i pisemnie zdecydował inaczej
   (z uzasadnieniem w rejestrze). Przypadkowe rozjechanie zachowania gracza i AI (np. przez
   fallback/parametr opcjonalny nigdy niepodawany w żywej grze) jest defektem, nawet gdy
   Twoje testy są zielone.
10. **Nie usuwasz, nie nadpisujesz i nie „sprzątasz" niczego spoza Twojej allowlisty** —
    nawet jeśli wygląda na martwe albo błędne. Zgłoś to jako osobne znalezisko w swoim
    raporcie, nie napraw przy okazji.

---

## 3. Workflow Workera — krok po kroku

1. **Fetch świeżego `main`:**
   ```
   git fetch origin main
   git checkout -b hermes/<PEŁNE-ID> origin/main
   ```
   Nigdy nie zakładaj brancha ze starej lokalnej kopii `main` — zawsze świeżo z `origin`.

2. **Sprawdź, czy temat już nie istnieje / nie jest w toku** — przeczytaj (tylko czytaj,
   nie edytuj) `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (grep po słowach kluczowych zgłoszenia)
   i zajrzyj na listę otwartych Pull Requestów w repo. Jeśli coś podobnego już jest —
   zgłoś to właścicielowi zamiast dublować pracę.

3. **Nadaj temu tematowi ID** wg schematu z §5 i **od razu, jako pierwszy commit na swojej
   gałęzi**, zapisz `dyspozycje/autobot/runs/<PEŁNE-ID>/00-dispatch.md` (diagnoza + cel +
   allowlista — patrz §6). To jest Twój ślad, nie plik współdzielony — możesz go tworzyć
   swobodnie.

4. **Zaimplementuj wąski, jeden temat.** Trzymaj się allowlisty, którą sam sobie zapisałeś
   w `00-dispatch.md`. Jeśli w trakcie pracy okaże się, że potrzebujesz dotknąć czegoś poza
   allowlistą — zatrzymaj się, zaktualizuj `00-dispatch.md` z uzasadnieniem, dopiero potem
   kontynuuj.

5. **Napisz/zaktualizuj bramkę dowodu** w `gra/tools/<coś>-test.cjs` — headless Node dla
   logiki bez DOM-a; jeśli temat jest wizualny/UX, potrzebujesz żywego zrzutu przeglądarki
   (Playwright/Chromium), nie samego jsdom. Bramka MUSI wykrywać regresję — udowodnij to
   świadomym, tymczasowym zepsuciem testowanej logiki i pokazaniem, że test wtedy faktycznie
   czerwienieje (opisz to w raporcie, nie zostawiaj zepsucia w kodzie).

6. **Przed otwarciem PR uruchom lokalnie i zanotuj wynik w opisie PR:**
   - `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów
   - 5 bramek referencyjnych z katalogu `gra/tools/`: `logic-test.cjs`, `tech-tree-test.cjs`,
     `research-test.cjs`, `unit-replace-test.cjs`, `combat-test.cjs` — wszystkie zielone
   - Twoja nowa/zaktualizowana bramka tematu — zielona

7. **Commituj po nazwie pliku** (nigdy `-A`/`.`), z jasnym komunikatem opisującym CO i
   DLACZEGO (nie tylko co). Możesz robić kilka commitów na swojej gałęzi — to Twoja gałąź,
   Orkiestrator i tak scali ją w jeden commit integracyjny.

8. **Push wyłącznie swojej gałęzi:**
   ```
   git push -u origin hermes/<PEŁNE-ID>
   ```

9. **Otwórz Pull Request** `hermes/<PEŁNE-ID>` → `main`, z opisem wg kontraktu w §7.

10. **Zgłoś właścicielowi numer/link PR-a** (przez kanał, którym normalnie się z nim
    komunikujesz) — to jest jedyny sygnał „gotowe", jaki dociera do Orkiestratora. Sam PR
    bez zgłoszenia może zostać niezauważony.

11. **Czekaj.** Nie mergujesz, nie zamykasz, nie pushujesz kolejnych zmian bez potrzeby.
    Jeśli Orkiestrator zostawi komentarz w PR z prośbą o poprawkę — popraw na TEJ SAMEJ
    gałęzi (kolejny commit + push), nie zakładaj nowej.

---

## 4. Nazewnictwo — ID i gałęzie

- **ID tematu:** `H-<KRÓTKI-TEMAT-WIELKIMI-LITERAMI>-Q<n>`, np. `H-DYPLOMACJA-TOAST-BLAD-Q1`.
  Prefiks `H-` (nie `R-`/`P-`/`C-` — te są już zajęte przez istniejący rejestr projektu)
  gwarantuje, że Twoje ID nigdy nie zderzy się z ID nadanym przez Orkiestratora albo innego
  Workera.
- **Nazwa gałęzi:** zawsze `hermes/<PEŁNE-ID>` (dosłownie prefiks `hermes/`, nawet jeśli
  Twoim wewnętrznym imieniem jest coś innego — to jest umówiony prefiks dla „zewnętrzny
  Worker przez GitHub"; jeśli w tej roli działa więcej niż jeden zewnętrzny agent
  jednocześnie, właściciel poda Ci inny, unikalny prefiks do użycia zamiast `hermes/`).
- Jedno ID = jeden temat = jedna gałąź = jeden PR. Nie mieszaj kilku niepowiązanych napraw
  w jednym PR.

---

## 5. Allowlista — co wolno Ci dotknąć

Allowlistę ustalasz sam w `00-dispatch.md` w kroku 3 (§3), na podstawie zakresu zgłoszenia.
Zasady ogólne:

- Kod: `gra/src/**` — tylko pliki/funkcje realnie potrzebne do tego jednego tematu.
- Testy: nowy albo istniejący `gra/tools/*-test.cjs` dla tego tematu.
- Dokumentacja własnego śladu: wyłącznie `dyspozycje/autobot/runs/<PEŁNE-ID>/*`.
- Nigdy: pliki z §2 pkt 3, `gra/data/*.json` (dane eksportowane z zewnętrznego źródła —
  jeśli temat wymaga zmiany danych gry, zgłoś to właścicielowi zamiast edytować JSON
  ręcznie), `docs/decyzje/*.md` (decyzje właściciela — możesz je CZYTAĆ, nie edytować).

---

## 6. Kontrakt raportu — `00-dispatch.md` i raport końcowy

Na początku pracy (`dyspozycje/autobot/runs/<PEŁNE-ID>/00-dispatch.md`):

```
STATUS: DISPATCH
TEMAT: <PEŁNE-ID>
GOAL: <jednozdaniowy cel — co ma być prawdą po zakończeniu>
DIAGNOZA: <krótko: przyczyna / gdzie w kodzie>
ALLOWLISTA: <lista plików>
```

Na końcu pracy, jako ostatni plik na gałęzi (`dyspozycje/autobot/runs/<PEŁNE-ID>/01-raport.md`)
i jednocześnie jako treść opisu PR (§7):

```
STATUS: PASS | PASS-WITH-NOTES | BLOCK | DECISION_REQUIRED
DOMAIN: GAME | PROCESS | INFRA
TEMAT: <PEŁNE-ID>
GOAL: <jak w dispatchu>
ZMIANY: <pliki i jednozdaniowy opis zmiany w każdym>
TESTY: <dokładne wyniki tsc + 5 bramek referencyjnych + bramka tematu, z liczbami>
DOWÓD NIETAUTOLOGICZNOŚCI: <opis mutacji, która pokazała że bramka faktycznie czerwienieje>
BLOKADY: <jawna lista albo „brak">
NASTĘPNY KROK: <co Orkiestrator powinien wiedzieć przed integracją>
DEPLOY/PUSH: NIE WYKONANO (Ty nigdy tego nie robisz)
```

`STATUS: DECISION_REQUIRED` używasz, gdy natrafiłeś na coś wymagającego decyzji właściciela
(np. kwestię balansu z zasady §2 pkt 8) — opisz opcje (A/B/C jeśli to możliwe) zamiast
zgadywać.

---

## 7. Format Pull Requesta

**Tytuł:** `<PEŁNE-ID>: <krótki opis>` — np. `H-DYPLOMACJA-TOAST-BLAD-Q1: napraw toast przy zerwaniu sojuszu`

**Opis PR:** wklej dosłownie raport końcowy z §6, plus na samej górze:

```
Branch bazowy: origin/main @ <sha, z którego zacząłeś>
Gotowe do integracji: TAK
```

Nie używaj przycisku „merge" GitHuba — o merge do `main` decyduje wyłącznie Orkiestrator,
własną procedurą (nie natywnym mergem GitHuba — patrz §8), żeby commit na `main` miał
spójny format z resztą historii projektu.

---

## 8. Co się dzieje po Twojej stronie PR (żebyś rozumiał cały obieg)

Orkiestrator, po otrzymaniu numeru/linku PR-a od właściciela:

1. Fetchuje Twoją gałąź, sprawdza `git merge-base` względem aktualnego `origin/main`
   (main mógł odjechać od czasu, gdy zacząłeś).
2. Uruchamia NIEZALEŻNIE Twoje testy + tsc + 5 bramek referencyjnych — nie ufa samej
   deklaracji w opisie PR.
3. Sprawdza że diff mieści się dokładnie w Twojej zadeklarowanej allowlistli.
4. Jeśli wszystko gra: aplikuje Twoje zmiany jako nowy commit na `main` (z odniesieniem do
   numeru Twojego PR-a dla identyfikowalności), aktualizuje `REJESTR-PROSB-I-ZADAN.md` i
   (jeśli dotyczy) `WERSJE.md`/deploy do `gra-robocza/`, pushuje na `main`, zamyka Twój PR
   z komentarzem wskazującym finalny commit.
5. Jeśli coś nie gra: zostawia komentarz w PR z konkretnym zarzutem — poprawiasz na tej
   samej gałęzi (§3 pkt 11).

Commit na `main` nie będzie identyczny z Twoimi commitami na gałęzi (Orkiestrator scala
allowlist-only, czasem z drobną korektą linii jeśli main się przesunął) — to normalne i nie
oznacza błędu z Twojej strony, o ile testy przechodzą.

---

## 9. Unikanie konfliktów z inną, równolegle pracującą sesją

Realnej blokady plików w czasie rzeczywistym między niezależnymi agentami na osobnych
maszynach nie da się zrobić bez współdzielonego stanu — więc podstawowym zabezpieczeniem
jest **dyscyplina zakresu, nie technologia**:

- Trzymaj się WĄSKO tematu, który dostałeś — nie „poprawiaj przy okazji" sąsiedniego kodu.
- Przed rozpoczęciem sprawdź listę otwartych PR-ów w repo (nawet pobieżnie) — jeśli widzisz
  PR dotykający tych samych plików/funkcji, zapytaj właściciela zamiast ryzykować konflikt.
- Jeśli Twój PR czeka na integrację dłużej niż dzień i wiesz, że ktoś inny mógł w tym
  czasie zmienić te same pliki na `main` — przed poprawkami zrób świeży
  `git fetch origin main && git rebase origin/main` na swojej gałęzi i rozwiąż konflikty
  sam, zanim zgłosisz PR jako gotowy ponownie.

---

## 10. Kiedy się zatrzymać i zapytać zamiast działać

Zatrzymaj się i zgłoś `STATUS: DECISION_REQUIRED` (albo zapytaj wprost właściciela), gdy:

- temat dotyka balansu gry (§2 pkt 8),
- zakres zgłoszenia jest niejasny albo dopuszcza kilka sprzecznych interpretacji,
- realizacja wymagałaby wyjścia poza Twoją allowlistę w sposób ryzykowny dla innych tematów,
- napotkałeś coś, co wygląda na już-w-toku pracę innej sesji na tych samych plikach.

Nigdy nie zgaduj w tych sytuacjach „bo to oczywiste" — nawet gdy masz twardy dowód
(git blame, testy, symulację), że Twoja propozycja jest słuszna, pewność diagnozy NIE
zwalnia z pytania przy kwestiach z tej listy.

---

## 11. Skrócony checklist (do trzymania pod ręką)

```
[ ] git fetch origin main → checkout -b hermes/<ID> origin/main (ŚWIEŻY main)
[ ] sprawdzone: temat nie dubluje istniejącego rejestru/otwartego PR
[ ] 00-dispatch.md zapisany jako pierwszy commit (ID, GOAL, diagnoza, allowlista)
[ ] implementacja WĄSKO w granicach allowlisty, zero npm run build/dev w gra/
[ ] bramka dowodu napisana/zaktualizowana + dowód nietautologiczności (mutacja → czerwone)
[ ] tsc --noEmit czysty + 5 bramek referencyjnych zielone + bramka tematu zielona
[ ] commit po nazwie pliku (nigdy -A/.), push WYŁĄCZNIE własnej gałęzi
[ ] PR hermes/<ID> → main, opis = raport końcowy wg §6/§7
[ ] numer/link PR zgłoszony właścicielowi — to jedyny sygnał "gotowe"
[ ] czekasz na komentarz Orkiestratora; poprawki na TEJ SAMEJ gałęzi
[ ] NIGDY: push/merge/rebase na main, edycja plików z §2 pkt 3, git add -A
```

---

## 12. Powiązane pliki (opcjonalnie doczytać, nie wymagane do startu)

- `CLAUDE.md`, `README.md` — pełny kontekst procesu tej sesji Orkiestratora (dłuższy,
  specyficzny dla Claude Code — nie musisz go znać, żeby pracować wg tego protokołu).
- `docs/decyzje/R-PROC-AUTOBOT.md` — pełny kanon AutoBot Orkiestratora (rola/pętla/bramki);
  ten dokument (`PROTOKOL-WSPOLPRACA-WIELOAGENTOWA-GITHUB.md`) jest jego uproszczonym,
  samowystarczalnym podzbiorem dla Workerów z zewnątrz.
- `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` — pełna procedura numer→ABC→commit→deploy
  używana przez Orkiestratora (deploy zawsze tylko na hasło właściciela, nigdy przez Workera).
