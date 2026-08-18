# R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1

**Status:** 🟢 **KANON PROCESU — obowiązuje od 2026-08-18**
**Zakres:** raport właściciela o stanie pracy na bazie najnowszej ROBOCZEJ.
**Rodzaj zmiany:** docs-only; bez zmian w `gra/src`, `gra/data`, bundlach,
`dyspozycje/WERSJE.md` i bez deployu.

> **Historia nazwy:** od 2026-08-18 poprzedni kanon
> `R-RAPORT-7-KATEGORII-ABC-PLAYTESTY-Q1` (siedem kategorii, snapshot FALA 294
> `a0f804d7`) został rozszerzony do **dziesięciu kategorii** z osobnymi stanami
> przejściowymi Operator → Evaluator → finalna kontrola. Plik historyczny:
> commit przed tą zmianą; treść kanonu 7-kategorii pozostaje w historii gita.

To jest kanon raportu, a nie pytanie gameplayowe. Nie trafia do aktywnej listy
ABC w `PYTANIA-OTWARTE.md`.

## 1. Format raportu

Raport ma zawsze dokładnie **dziesięć** kategorii, w tej kolejności:

1. **Gotowe do integracji/deployu** — w tym już zdeployowane, z jawnym statusem.
2. **W trakcie — Operator.**
3. **Operator zakończony — czeka na Evaluatora.**
4. **W trakcie — Evaluator.**
5. **Evaluator zakończony — czeka na finalną kontrolę/integrację.**
6. **Czeka na Operatora — gotowe do dispatchu** — pełny kontrakt/ECHO/ABC
   istnieje, ale Operator jeszcze nie został uruchomiony.
7. **Zapomniane — do dispatchu** — brak kompletnego kontraktu albo brak śladu
   procesu; odróżnić od kategorii 6.
8. **Świadomie odłożone.**
9. **Otwarte ABC.**
10. **Playtesty.**

Każdy punkt ma format czteroelementowy:

**`ID — status — dowód — następny gate`**

- **ID** — pełny identyfikator tematu (`P-…`, `R-…`, `AI-…` itd.).
- **status** — jedno zdanie: gdzie temat jest w obiegu AutoBot (nie samo „w toku").
- **dowód** — konkretny artefakt: commit SHA, plik decyzji, wynik testu PASS/FAIL,
  wpis `WERSJE.md`/`KANAL-PRACA.md`, raport Operatora/Evaluatora (ścieżka lub cytat).
- **następny gate** — kto/co blokuje dalszy krok: Evaluator, finalna kontrola, deploy,
  odpowiedź właściciela, recon kontraktu itp.

Pusta kategoria otrzymuje `— (brak)`. Tematy bez wystarczającego dowodu **nie trafiają**
do kategorii 1–7 — wpisz je w sekcji **„Brak dowodu / nie zgaduję"** (patrz §4).

Nadrzędny obieg AutoBot: **Operator → Evaluator → finalna kontrola → integracja
→ deploy/push**. Raport Operatora nie kończy procesu; po jego otrzymaniu
Evaluator jest uruchamiany automatycznie, bez czekania na ponowne popychanie
właściciela.

## 2. Zakres raportu i źródła

### Zakres (co wchodzi, a co nie)

Raport obejmuje **wyłącznie**:

- **najnowszą ROBOCZĄ** — ostatni aktywny wpis w `dyspozycje/WERSJE.md` (md5, FALA,
  zakres tej publikacji);
- **aktywną kolejkę** — tematy z otwartym statusem w rejestrach, kanałach i
  dokumentach decyzji, które **nie są** domknięte deployem ani świadomym odłożeniem.

#### Statusy aktywnej kolejki (włącz do raportu)

| Status | Znaczenie w raporcie |
|--------|----------------------|
| **OTWARTE** | zarejestrowane, wymaga klasyfikacji do kat. 6–9 lub 2–5 |
| **W TRAKCIE** | dispatch Operatora lub Evaluatora bez domknięcia — kat. **2** lub **4** |
| **GOTOWE LOKALNIE** | raport/commit Operatora bez werdyktu Evaluatora — kat. **3** (ew. **WSTRZYMANY**) |
| **GOTOWE DO EVALUATORA** | Operator zakończył, czeka niezależny Evaluator — kat. **3** |
| **GOTOWE DO INTEGRACJI** | werdykt Evaluatora, brak finalnej kontroli/deployu — kat. **5** |

#### Wykluczenia z aktywnej kolejki (nie klasyfikuj ponownie)

| Status | Działanie |
|--------|-----------|
| **ZAMKNIĘTE** | historia w rejestrze; nie ABC, nie dispatch |
| **WDROŻONE** / **ZDEPLOYOWANE** | kat. **1** tylko jeśli w najnowszej ROBOCZEJ lub z otwartym gate’em |
| **SCALONE** | temat domknięty procesowo; nie kat. 6–7 |
| **ŚWIADOMIE ODŁOŻONE** | kat. **8** — wymaga cytatu/decyzji właściciela **przed** dispatch |

**Nie wchodzi do raportu:** pełna historia commitów, starsze FALE w `WERSJE.md`,
historyczna kolejka playtestów PT-*, zamknięte tematy bez wpływu na bieżącą pracę,
ani tematy już scalone do `main`/ROBOCZA bez otwartego gate’a. Historia pozostaje
w plikach źródłowych — raport ją **czyta**, ale **nie kopiuje** ani nie odtwarza
jako bieżącej kolejki.

### Kolejność weryfikacji (obowiązkowa)

Raport powstaje ze źródeł, **nie z pamięci** ani z samych powiadomień/worktree.
Czytaj w tej kolejności:

1. **`dyspozycje/WERSJE.md`** — najnowsza ROBOCZA (md5, FALA, zakres, wpis
   `Playtest — na co patrzeć`); punkt odniesienia „co jest już opublikowane";
2. **`dyspozycje/_handoff/KANAL-PRACA.md`** — ostatnie meldunki, `CZEKAM-NA:`,
   dispatch Operatora/Evaluatora, blokady między sesjami;
3. **`dyspozycje/REJESTR-PROSB-I-ZADAN.md`** — status próśb, commity, werdykty,
   wpisy SCALONE/WDROŻONE;
4. **`dyspozycje/PYTANIA-OTWARTE.md`** — pytania, statusy, cytaty, powody odłożenia;
5. **`docs/decyzje/<ID>.md`** — ECHO, litera/jawna decyzja, zakres, status zamknięcia;
6. **handoffy i audyty** — `dyspozycje/_handoff/*`, wpisy audytu bieżącej fali,
   `STAN-PRACY-HANDOFF.md` (kontekst, nie zamiennik dowodu);
7. **git / worktree** — `git log`, `git merge-base`, `git diff`, stan branchy
   worktree **wyłącznie jako weryfikacja** deklaracji z punktów 1–6; nigdy jako
   pierwsze ani jedyne źródło statusu.

`WERSJE.md` pozostaje jedynym rejestrem wersji. Raport go odczytuje, ale nie
kopiuje ani nie aktualizuje md5/stempli.

## 3. Reguły klasyfikacji

### 1. Gotowe do integracji/deployu

Wpis trafia tutaj, gdy istnieje konkretny artefakt do wpięcia lub publikacji
oraz dowód wykonania (commit, testy, handoff lub wpis ROBOCZEJ). Tematy już
opublikowane w najnowszej ROBOCZEJ zapisuje się z jawnym statusem
**ZDEPLOYOWANE** i md5/skrótem fali. „Gotowe lokalnie” bez werdyktu Evaluatora
nie trafia tutaj — patrz kategorie 3 lub 5.

### 2. W trakcie — Operator

Tylko temat z jawnym dispatch’em Operatora i bez dostarczonego raportu
wykonania. Sam katalog worktree, branch lub plik zmieniony w przeszłości nie
jest dowodem żywego procesu.

### 3. Operator zakończony — czeka na Evaluatora

Temat, dla którego Operator dostarczył raport/commit z zakresu, a niezależny
Evaluator nie zakończył jeszcze werdyktu. Wpisuj wyłącznie realny raport lub
commit Operatora — nie worktree. Podaj: czego brakuje do werdyktu i gdzie jest
dowód Operatora.

**Etykieta WSTRZYMANY:** gdy Operator zakończył, ale Evaluator jest **wstrzymany**
przez **blokadę zewnętrzną** (np. wspólna naprawa innego brancha, zależność
Design) — temat **pozostaje w kategorii 3**, nie w 8. Status musi zawierać słowo
**WSTRZYMANY** + dowód blokady (rejestr, `PYTANIA-OTWARTE.md`, `KANAL-PRACA.md`).
Kategoria **8** dotyczy odłożenia **przed** dispatch lub **bez** rozpoczętego
Operatora z jawną decyzją właściciela — nie zastępuje WSTRZYMANY po commicie
Operatora.

### 4. W trakcie — Evaluator

Temat z uruchomionym Evaluatorem i bez jeszcze odebranego werdyktu PASS/FAIL.
Worktree nie jest dowodem; wymagany ślad raportu lub wpisu kanału.

### 5. Evaluator zakończony — czeka na finalną kontrolę/integrację

Temat z werdyktem Evaluatora (PASS lub PASS-WITH-NOTES), ale bez finalnej
kontroli, scalenia do `main` lub deployu. Wpisuj wyłącznie realny werdykt
Evaluatora — nie worktree.

### 6. Czeka na Operatora — gotowe do dispatchu

Operator **nie został jeszcze uruchomiony** (brak dispatchu, raportu i commitu
Operatora dla tego zakresu). Wpis trafia tutaj tylko przy **minimalnym kontrakcie**
— **wszystkie** warunki (a)–(e) muszą być spełnione:

| Warunek | Wymaganie |
|---------|-----------|
| **(a)** | dokument ECHO z literą A/B/C **lub** jawna decyzja w `docs/decyzje/<ID>.md` |
| **(b)** | zakres wdrożenia: pliki, moduły lub funkcje do zmiany |
| **(c)** | kryteria akceptacji / testy lub bramki (np. harness, `tsc`, smoke) |
| **(d)** | **brak** commitu, diffu lub raportu Operatora dla tego zakresu |
| **(e)** | **brak** blokady zewnętrznej (Design, limit, kolejka właściciela → kat. **8**) |

**Sama litera A/B/C nie wystarcza** — bez (b) i (c) temat trafia do kategorii **7**
(recon kontraktu), nie do 6. Dla każdego wpisu podaj plik decyzji/rejestru jako dowód.

**Nie trafiają tutaj:** tematy świadomie odłożone (kategoria 8), otwarte ABC
bez odpowiedzi właściciela (kategoria 9), tematy z już dostarczonym raportem
lub commitem Operatora (kategorie 3–5), tematy z blokadą zewnętrzną poza
AutoBotem (kategoria 8), wpisy już wdrożone w `main`/ROBOCZA (kategoria 1).

**Test kategorii 6:** przed wpisem sprawdź w `REJESTR-PROSB-I-ZADAN.md` i
`docs/decyzje/<ID>.md`, czy **nie ma** żadnego commitu, raportu Operatora ani
werdyktu Evaluatora powiązanego z tym ID. Jeśli ślad istnieje — to nie kategoria 6.

### 7. Zapomniane — do dispatchu

Temat jest zarejestrowany, ale **nie** ma kompletnego kontraktu (brak ECHO,
niejasny zakres, brak zakresu testów) **albo** rejestracja bez śladu procesu
(żaden Operator, żaden Evaluator, brak commitu, brak pliku decyzji z literą
A/B/C). To kolejka do recon/dispatchu albo domknięcia kontraktu — nie ukryta
kategoria „niepilne”.

**Odróżnienie od kategorii 6:** kategoria 6 = **kompletny** kontrakt (ECHO +
zakres + bramki), **zero** uruchomionego Operatora. Kategoria 7 = brak
kompletnego kontraktu **albo** temat „zapomniany” mimo rejestracji (np. tylko
notatka bez ECHO, albo zgłoszenie bez śladu kto ma dispatchować).

### 8. Świadomie odłożone

Tylko wpis z **jawną decyzją właściciela** albo cytatem „później”, „do kolejki”,
„do odnowienia limitu”, „do kolejnego etapu” **zanim** uruchomiono Operatora —
albo gdy temat **świadomie czeka poza AutoBotem** (np. brief do Design, limit
sesji). **Nie** trafia tutaj Operator zakończony z wstrzymanym Evaluatorem —
to kategoria **3** z etykietą **WSTRZYMANY** i dowodem blokady. Nie wolno
dopisać tematu wyłącznie dlatego, że agent uznał go za niepilny.

### 9. Otwarte ABC — filtr po ECHO

Ta kategoria obejmuje **wyłącznie** pytania, na które właściciel nie
odpowiedział żadną literą ani inną jawną decyzją.

Przed pokazaniem każdego ID trzeba:

1. odszukać `docs/decyzje/<ID>.md` albo równoważny dokument ECHO;
2. sprawdzić, czy nie ma tam statusu zamkniętego, litery A/B/C, odpowiedzi
   łączonej (`A+C`) ani jawnego rozstrzygnięcia;
3. porównać wynik z `PYTANIA-OTWARTE.md` i rejestrem próśb.

Jeżeli właściciel odpowiedział A/B/C lub podjął jawną decyzję, pytanie znika
z aktywnego ABC i może być pokazane wyłącznie jako **ZAMKNIĘTE**,
**GOTOWE**, **W TOKU** albo w kategoriach 1–7 — z zachowaniem historii w
rejestrach i dokumentach.

### 10. Playtesty

Raport bierze **wyłącznie** najnowszą ROBOCZĄ pozycję zatytułowaną
`Playtest — na co patrzeć` w `dyspozycje/WERSJE.md`. Lista obejmuje tylko
zmiany tej fali i ich skutki.

Nie wolno do tej kategorii przenosić historycznej pełnej kolejki PT,
starszych wpisów `WERSJE.md`, tematów z `PYTANIA-OTWARTE.md` ani ogólnych
zaległości. Jeżeli najnowsza ROBOCZA nie ma takiej pozycji, wynik brzmi
`— (brak wpisu Playtest — na co patrzeć dla najnowszej ROBOCZEJ)`; nie wolno
uzupełniać go starszą falą.

### Dowody wymagane — Operator

Wpis w kategoriach **2, 3** (oraz jako składnik kategorii **1, 5**) wymaga **co
najmniej jednego** z poniższych — sam status tekstowy **nie wystarcza**:

| Dowód | Co musi być widoczne |
|-------|----------------------|
| **Dispatch** | jawny wpis w `KANAL-PRACA.md` lub handoffie: kto, kiedy, jakie ID, jaki zakres |
| **Commit / diff** | SHA na `main` lub branchu scalanym; `git show <SHA> --stat` potwierdza zakres |
| **Testy** | wynik PASS/FAIL/TIMEOUT z nazwą harnessu (np. `combat-test.cjs 6/6`) |
| **Raport Operatora** | plik lub wpis kanału z zakresem, listą plików, wynikiem testów |

**Nie są dowodem Operatora:** sam worktree, nazwa brancha, ukryte powiadomienie
systemu, plik zmieniony „kiedyś", ani wpis rejestru bez SHA/raportu.

### Dowody wymagane — Evaluator

Wpis w kategoriach **4, 5** (oraz jako warunek kategorii **1**) wymaga **osobnego**
raportu/werdyktu Evaluatora:

- werdykt jawny: **PASS**, **FAIL** lub **PASS-WITH-NOTES**;
- zakres oceny (pliki, ID, co sprawdzono);
- wynik testów Evaluatora (nie tylko powtórzenie testów Operatora).

**Brak raportu Evaluatora** → temat **nie trafia** do kategorii **5** ani **1**
(jako gotowe do integracji/deployu). Może trafić do kategorii **3** (Operator
skończony, czeka Evaluator) albo do **„Brak dowodu / nie zgaduję"** (§4 Faza E).

Worktree, branch i powiadomienie **nie zastępują** werdyktu Evaluatora.

### Macierz kategorii 1–7 (skrót decyzyjny)

| Kat. | Nazwa | Warunek wejścia | Typowy następny gate |
|------|-------|-----------------|----------------------|
| **1** | Gotowe do integracji/deployu | artefakt + dowód wykonania; przy deployu: werdykt Evaluatora + wpis ROBOCZEJ | deploy / już ZDEPLOYOWANE |
| **2** | W trakcie — Operator | potwierdzony dispatch, brak raportu zakończenia Operatora | raport Operatora |
| **3** | Operator zakończony — czeka Evaluator | raport/commit Operatora, brak werdyktu Evaluatora | dispatch/werdykt Evaluatora |
| **4** | W trakcie — Evaluator | potwierdzony dispatch Evaluatora, brak werdyktu | werdykt PASS/FAIL |
| **5** | Evaluator skończony — czeka finalna | werdykt Evaluatora (PASS/PASS-WITH-NOTES), brak finalnej kontroli/scalenia/deployu | finalna kontrola / integracja |
| **6** | Czeka na Operatora — gotowe do dispatchu | minimalny kontrakt **(a)–(e)**; **zero** dispatchu/commitu Operatora | dispatch Operatora |
| **7** | Zapomniane — do dispatchu | rejestracja bez kompletnego kontraktu **lub** brak śladu procesu | recon / domknięcie kontraktu |

**Rozróżnienie 6 vs 7:** kategoria **6** = kontrakt **kompletny** (ECHO + zakres +
bramki), Operator **nie** uruchomiony. Kategoria **7** = brak ECHO, niejasny zakres,
brak bramek **albo** temat „zawisł" mimo rejestracji (notatka bez procesu).

**Rozróżnienie 2 vs 3:** kategoria **2** = Operator **jeszcze pracuje** (brak
raportu końcowego). Kategoria **3** = Operator **dostarczył** raport/commit, Evaluator
jeszcze nie.

**Rozróżnienie 4 vs 5:** kategoria **4** = Evaluator **w toku**. Kategoria **5** =
Evaluator **zakończył** z werdyktem, czeka finalna kontrola/integracja.

## 4. Procedura przygotowania raportu — krok po kroku

Poniższa procedura jest obowiązkowa dla każdego agenta przygotowującego raport
na hasło `raport`. **Sam status w rejestrze lub worktree nie wystarcza** — każdy
wpis musi mieć dowód z §3.

### Faza A — Przygotowanie (przed klasyfikacją)

1. **`git pull --ff-only origin main`** (jeśli pracujesz w drzewie głównym) — raport
   musi odzwierciedlać aktualny stan repo.
2. Odczytaj **najnowszą ROBOCZĄ** z `WERSJE.md` — zapisz: FALA, md5, datę, zakres.
3. Przejrzyj **ostatnie wpisy** `KANAL-PRACA.md` (min. od ostatniej ROBOCZEJ) —
   szukaj dispatchy Operatora/Evaluatora i `CZEKAM-NA:`.
4. Zbierz listę **aktywnych ID** z `REJESTR-PROSB-I-ZADAN.md` i `PYTANIA-OTWARTE.md`
   — uwzględnij statusy **OTWARTE**, **W TRAKCIE**, **GOTOWE LOKALNIE**,
   **GOTOWE DO EVALUATORA**, **GOTOWE DO INTEGRACJI**; **wyklucz**
   **ZAMKNIĘTE**, **WDROŻONE**, **SCALONE**, **ZDEPLOYOWANE**,
   **ŚWIADOMIE ODŁOŻONE** (tabela w §2).
5. Dla każdego kandydata otwórz `docs/decyzje/<ID>.md` — sprawdź ECHO, literę,
   status zamknięcia.
6. Dopiero na końcu — **git/worktree:** `git log --oneline -20`, `git merge-base`,
   stan branchy worktree wymienionych w kanałach.

### Faza B — Klasyfikacja każdego ID

Dla każdego aktywnego ID przejdź drabinę (pierwsze trafienie wygrywa):

```
Czy wdrożone w najnowszej ROBOCZEJ / main z werdyktem Evaluatora?
  → TAK → kategoria 1 (status ZDEPLOYOWANE + md5)

Czy jest potwierdzony dispatch Evaluatora BEZ werdyktu?
  → TAK → kategoria 4

Czy jest werdykt Evaluatora (PASS/PASS-WITH-NOTES) BEZ finalnej kontroli/deployu?
  → TAK → kategoria 5

Czy jest raport/commit Operatora BEZ werdyktu Evaluatora?
  → TAK → kategoria 3 (jeśli Evaluator wstrzymany zewnętrznie: etykieta WSTRZYMANY + dowód blokady)

Czy jest potwierdzony dispatch Operatora BEZ raportu końcowego?
  → TAK → kategoria 2

Czy właściciel świadomie odłożył PRZED dispatch / bez rozpoczętego Operatora
  (cytat/decyzja „później"/„do kolejki"/blokada zewnętrzna bez commitu Operatora)?
  → TAK → kategoria 8

Czy brak odpowiedzi A/B/C (filtr ECHO — patrz Faza C)?
  → TAK → kategoria 9

Czy minimalny kontrakt (a)–(e) dla kat. 6 spełniony BEZ śladu Operatora?
  → TAK → kategoria 6

Czy rejestracja BEZ kompletnego kontraktu lub bez śladu procesu?
  → TAK → kategoria 7

Brak wystarczającego dowodu?
  → sekcja „Brak dowodu / nie zgaduję"
```

### Faza B2 — Re-bundle historycznego fixu

Gdy fix **już miał** Operatora i Evaluatora w przeszłości, a ponownie wchodzi do
FALI (np. re-bundle, konflikt scalania, ponowny deploy tego samego SHA):

- **nie udawaj** świeżego Operatora ani Evaluatora;
- wpisz: **stary commit SHA** + **wcześniejszy werdykt** (data/źródło) + fakt
  **ponownego wejścia do FALI** (nowa FALA/md5 w `WERSJE.md`);
- klasyfikuj wg **aktualnego** gate’a: jeśli tylko re-publish bez nowej pracy →
  kategoria **1** ze statusem **ZDEPLOYOWANE (re-bundle)**; jeśli nowa runda
  naprawy → kategoria **2–5** z nowymi dowodami.

### Faza B3 — Stare SHA, worktree i sprzeczne statusy

Gdy rejestr, kanał i git **nie zgadzają się**:

1. Sprawdź **ancestor:** `git merge-base --is-ancestor <stary-SHA> HEAD` — czy stary
   commit jest w historii bieżącego `main`.
2. Odczytaj **aktualny commit** dla plików tematu: `git log -1 --oneline -- <pliki>`.
3. **Nie kasuj** historii w rejestrze ani w dokumencie decyzji — dopisz **korektę**
   w raporcie: „rejestr mówi X, git/kanał pokazuje Y, przyjmuję Y bo …".
4. Worktree wymieniony w kanałach — sprawdź `git log -1` **w tym worktree**, nie
   zakładaj że branch = aktualna praca.

### Faza C — Filtr ABC (kategoria 9 i wpływ na kategorię 6)

**ECHO z literą A/B/C** lub jawna decyzja oznacza: temat **nie jest** otwartym ABC
(kategoria 9). **To nie oznacza automatycznie** gotowości do Operatora (kategoria 6).

Po ECHO sprawdź dodatkowo:

| Sytuacja | Gdzie trafia |
|----------|--------------|
| Już wdrożone w ROBOCZEJ/`main` | kategoria **1** |
| Dispatch Operatora bez raportu końcowego | kategoria **2** |
| Raport/commit Operatora; Evaluator aktywny lub oczekiwany | kategoria **3** |
| Raport/commit Operatora; Evaluator **wstrzymany** zewnętrznie | kategoria **3** — **WSTRZYMANY** + dowód blokady |
| Dispatch Evaluatora bez werdyktu | kategoria **4** |
| Werdykt Evaluatora bez finalnej kontroli/deployu | kategoria **5** |
| Świadome odłożenie właściciela **przed** dispatch / bez Operatora | kategoria **8** |
| Blokada zewnętrzna **przed** dispatch (Design, limit) | kategoria **8** |
| Minimalny kontrakt (a)–(e), zero Operatora | kategoria **6** |
| Brak kontraktu mimo rejestracji | kategoria **7** lub „brak dowodu" |

**Uwaga:** ECHO A/B/C **nie** implikuje kategorii 6 — wymagane (b) zakres i (c) bramki.
Operator zakończony + blokada zewnętrzna Evaluatora → **nie** kategoria 8.

### Faza D — Playtesty (kategoria 10)

Tylko wpis `Playtest — na co patrzeć` z **najnowszej** ROBOCZEJ w `WERSJE.md`.
Brak wpisu → `— (brak wpisu Playtest — na co patrzeć dla najnowszej ROBOCZEJ)`.

### Faza E — Sekcja „Brak dowodu / nie zgaduję"

Osobna sekcja **pod** dziesięcioma kategoriami (nie jako ukryta kategoria 11 w
środku listy). Tu trafiają ID, które:

- widnieją w rejestrze, ale brak commitu, raportu, dispatchu lub werdyktu;
- mają sprzeczne statusy nierozstrzygnięte po Fazie B3;
- wymagają recon zanim można je przypisać do 1–7.

Format wpisu: **`ID — co wiadomo — czego brakuje — co sprawdzić następnym krokiem`**.

**Zasada:** wolisz pustą kategorię i wpis tutaj niż zgadywanie statusu.

### Faza F — Kontrola przed wysłaniem (checklista)

Przed dostarczeniem raportu właścicielowi — **wszystkie punkty TAK**:

- [ ] Dokładnie **10 nagłówków** kategorii w kanonicznej kolejności.
- [ ] Puste kategorie mają `— (brak)`, nie są pominięte.
- [ ] Kategoria **1:** każdy wpis ZDEPLOYOWANE ma md5/FALA z `WERSJE.md`; wpisy
  „gotowe lokalnie" mają werdykt Evaluatora.
- [ ] Kategorie **2–5:** każdy wpis ma dowód zgodny z tabelą §3 (dispatch Operatora
  w kat. 2, dispatch Evaluatora w kat. 4, commit/werdykt w kat. 3/5) — nie worktree.
- [ ] Kategoria **6:** każdy wpis spełnia minimalny kontrakt **(a)–(e)**; **brak**
  commitu/raportu Operatora; sama litera A/B/C **nie** wystarczyła.
- [ ] **Kategoria 6 vs 7 (osobny test):** kat. 6 = pełny kontrakt (a)+(b)+(c) +
  zero procesu Operatora; kat. 7 = brak któregoś z (a)–(c) **albo** rejestracja bez
  śladu kto dispatchuje — nie mylić „zapisane A/B/C" z gotowością do dispatchu.
- [ ] Kategoria **9:** każde ID zweryfikowane w `docs/decyzje/<ID>.md` (filtr ECHO).
- [ ] Kategoria **10:** tylko najnowsza ROBOCZA; md5 zgodny z odczytem z `WERSJE.md`.
- [ ] Sekcja **„Brak dowodu / nie zgaduję"** obecna (nawet jeśli pusta).
- [ ] **Brak martwych linków** do plików (ścieżki istnieją w repo).
- [ ] **Typ raportu:** **tylko czat** (odpowiedź na `raport` bez edycji plików repo)
  → `git diff --check` **nie** jest wymagany; **zapis w pliku** (aktualizacja
  snapshotu, kanonu, rejestru) → **`git diff --check`** obowiązkowy przed commitem.
- [ ] Żaden wpis nie opiera się wyłącznie na „statusie w rejestrze" bez dowodu.
- [ ] Snapshot §5 **nie** skopiowany — wynik pochodzi ze **świeżego skanu** źródeł.

## 5. Snapshot referencyjny dla najnowszej ROBOCZEJ

> **Uwaga:** poniższy snapshot to **wzór formatu** (nagłówki, gęstość dowodu,
> etykiety ZDEPLOYOWANE/WSTRZYMANY) — **nie** treść do kopiowania w kolejnych
> raportach. Każde hasło `raport` wymaga **świeżego skanu** źródeł z §2 i §4;
> wynik może różnić się od tej listy po nowej ROBOCZEJ, dispatchu lub decyzji
> właściciela.

Baza przykładu: **FALA 295**, ROBOCZA `8589d294`, audyt
`dyspozycje/_handoff/KANAL-PRACA.md` (wpisy 09:59–10:19 UTC 2026-08-18) oraz
`dyspozycje/REJESTR-PROSB-I-ZADAN.md`.

### 1. Gotowe do integracji/deployu

- `P-AI-PANSTWA-MIASTA-REKRUTACJA-JAKO-BUDYNKI` — **ZDEPLOYOWANE FALA 295
  `8589d294`** — Evaluator PASS; dowód: `dyspozycje/WERSJE.md` FALA 295,
  `REJESTR-PROSB-I-ZADAN.md`.
- `P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA` — **ZDEPLOYOWANE FALA 295
  `8589d294`** — Evaluator PASS-WITH-NOTES; dowód: `WERSJE.md`, rejestr.
- `P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA` — **ZDEPLOYOWANE FALA 295
  `8589d294`** — commit `4fda539a`, Evaluator PASS-WITH-NOTES; dowód: rejestr.
- `P-BITWA-PODSUMOWANIE-NIGDY-NIE-WIDOCZNE` — **ZDEPLOYOWANE FALA 295
  `8589d294`** — fix `8f45ae6d`, test 16/16; dowód: rejestr, `WERSJE.md`.
- `P-BITWA-SCENA-REJESTRACJA-PRZED-WYJATKIEM` — **ZDEPLOYOWANE FALA 295
  `8589d294`** — commit `46efc847`; dowód: rejestr.
- `P-BITWA-ATAK-MIASTO-MGLA-BRAK-SPRAWDZENIA` — **ZDEPLOYOWANE FALA 295
  `8589d294`** — commit `8e90aa53`; dowód: rejestr.
- `P-CUD-WONDER-EARLY-RETURN-STALE-HIGHLIGHT` — **ZDEPLOYOWANE FALA 295
  `8589d294`** — commit `8e0e70e7`, test 8/8; dowód: rejestr.
- `P-JEDNOSTKI-KARTA-3D-INFO-Q1` — **ZDEPLOYOWANE FALA 295 `8589d294`** —
  Evaluator PASS-WITH-NOTES; dowód: `docs/decyzje/P-JEDNOSTKI-KARTA-3D-INFO-Q1.md`,
  rejestr, `WERSJE.md`.

### 2. W trakcie — Operator

- `— (brak)` — audyt FALI 295: brak potwierdzonego żywego dispatchu Operatora;
  worktree historyczne nie są dowodem procesu (`KANAL-PRACA.md` 10:00 UTC).

### 3. Operator zakończony — czeka na Evaluatora

- `P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1` — **Operator zakończony — Evaluator
  WSTRZYMANY**: implementacja lokalna bez deployu; runda 5 wstrzymana do
  wspólnej naprawy `fix-barb-city-v2` (`PYTANIA-OTWARTE.md`). Dowód Operatora:
  commit `85f70a91`, testy `0e720a70`/`e0548514`/`49f01e7d` —
  `docs/decyzje/P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1.md`, `REJESTR-PROSB-I-ZADAN.md`.

### 4. W trakcie — Evaluator

- `— (brak)` — brak potwierdzonego aktywnego Evaluatora gameplay; closeout
  dokumentacji AutoBot (10:19 UTC) nie dotyczy kodu gry.

### 5. Evaluator zakończony — czeka na finalną kontrolę/integrację

- `R-WIARYGODNOSC-S9-Q1` — faza tabeli liczb: Evaluator **PASS-WITH-NOTES**,
  commit Operatora `22df1b1` (`REJESTR-PROSB-I-ZADAN.md`); pełne strojenie JSON
  czeka OK właściciela przed kolejnym dispatch — **nie** kategoria 6 (ślad
  Operatora i Evaluatora już istnieje). Dowód:
  `docs/decyzje/R-WIARYGODNOSC-S9-TABELA-LICZB.md`,
  `docs/decyzje/R-WIARYGODNOSC-S9-Q1.md`.

### 6. Czeka na Operatora — gotowe do dispatchu

- `P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY` — ECHO **B**, pełny kontrakt i bramki
  zapisane; czeka Operator Workflow. Dowód:
  `docs/decyzje/P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY.md`.
- `P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-N2` — ECHO **C**, osobny kontrakt
  targeted overlay i zakres N2; czeka Operator Workflow. Dowód:
  `docs/decyzje/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-N2.md`.
  Wykluczone ze snapshotu: `AI-BALANS-STEP6-Q1` (**już wdrożone** — `dadcb48`,
  rejestr); `R-KAMIEN-RELIEF-FOLLOWUP-Q1` (**commit** `8593237` na branchu);
  `R-DESIGN-PANEL-MIASTA-V2-Q1` (**blokada zewnętrzna** Design — kategoria 8);
  `MAP-UX-CLUSTER-LABEL-Q1` (**commity** `9d33e8f`/`d3470ed`); `R-OBRONA-MIASTA-MP-Q1`
  (**SCALONE** runda 3); `R-WIARYGODNOSC-S9-Q1` (Operator+Evaluator — kategoria 5).

### 7. Zapomniane — do dispatchu

- `P-KOPALNIA-PODSWIETLENIE-KOSMETYKA` — noty N3/N5/N6 pozostają osobnymi
  zadaniami technicznymi bez kontraktu; N2 ma osobne ECHO i kategorię 6.
  Dowód: `PYTANIA-OTWARTE.md` (2026-08-17/18).

### 8. Świadomie odłożone

- `R-DESIGN-PANEL-MIASTA-V2-Q1` — ECHO **C**; brief gotowy, **czeka wklejenia
  do Design** (blokada zewnętrzna, nie dispatch Operatora). Dowód:
  `docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md`, `REJESTR-PROSB-I-ZADAN.md`.
- `R-USTROJE-RODZAJE-PRZYSZLOSC` — notatka na przyszły system ustrojów;
  dowód: `PYTANIA-OTWARTE.md` (2026-08-17).
- `R-SUROWCE-12-PROPOZYCJA-WZGORZA-GORY-Q1` — wstrzymane do odnowienia limitu;
  cytat właściciela w `PYTANIA-OTWARTE.md` (2026-08-17).
- `R-PLATFORMA-DESKTOP-ROADMAP-Q1` — roadmapa Tauri → pełny silnik; osobna
  sesja strategiczna; dowód: `docs/decyzje/R-PLATFORMA-DESKTOP-ROADMAP-Q1.md`.
- `P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1` — decyzja Macieja „Do kolejki”
  (2026-08-17); osobna kolejka wydajności; dowód: `PYTANIA-OTWARTE.md`.
- `P-BITWA-ATAK-DYSTANSOWY-TELEPORT-Q1` — zarejestrowane, świadomie odłożone
  do przeglądu tematów bitewnych; dowód: `PYTANIA-OTWARTE.md` (2026-08-16).

### 9. Otwarte ABC

- `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1` — ogólny prototyp karty odkrycia
  technologii; brak odpowiedzi właściciela A/B/C na wzorzec (osobno od wdrożonej
  karty Brązownictwa FALI 294). Dowód:
  `docs/decyzje/P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1.md`,
  `PYTANIA-OTWARTE.md`.

### 10. Playtesty

- `— (brak wpisu Playtest — na co patrzeć dla FALI 295)` — najnowsza ROBOCZA
  `8589d294` ma zakres i bramki, ale nie zawiera dedykowanej pozycji playtestowej;
  ostatni wpis playtestowy dotyczy FALI 291 (`WERSJE.md`).

### Brak dowodu / nie zgaduję

- `— (brak niezweryfikowanych statusów w snapshotcie; brakujące dowody nie są
  domyślane)`

## 6. Zasada utrzymania

Po każdej nowej ROBOCZEJ raport odczytuje aktualny wpis, ale nie zmienia
historii. Odpowiedzi właściciela pozostają w `PYTANIA-OTWARTE.md`,
`REJESTR-PROSB-I-ZADAN.md` i `docs/decyzje/`; z aktywnego ABC są usuwane
przez zmianę statusu, nigdy przez kasowanie historii.

**Snapshot §5** aktualizuje się wyłącznie przy zmianie kanonu lub audycie
referencyjnym — nie przy każdym raporcie czatowym. Raport na hasło `raport`
**nie** wymaga edycji §5; wystarczy odpowiedź w czacie ze świeżym skanem.

Przy aktualizacji snapshotu rozdzielaj stany przejściowe (kategorie 2–5) od
kolejki dispatchu (6–7) i od świadomych odłożeń (8). Worktree, branch i ukryte
powiadomienie nie zastępują raportu Operatora ani werdyktu Evaluatora.
