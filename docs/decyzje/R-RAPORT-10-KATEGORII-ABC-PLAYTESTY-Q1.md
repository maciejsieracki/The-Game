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

Każdy punkt jest zwięzły: **ID — jedno zdanie statusu — dowód lub następna
czynność**. Pusta kategoria otrzymuje `— (brak)`.

Nadrzędny obieg AutoBot: **Operator → Evaluator → finalna kontrola → integracja
→ deploy/push**. Raport Operatora nie kończy procesu; po jego otrzymaniu
Evaluator jest uruchamiany automatycznie, bez czekania na ponowne popychanie
właściciela.

## 2. Źródła i kolejność weryfikacji

Raport powstaje ze źródeł, nie z pamięci ani z samych powiadomienia:

1. `dyspozycje/PYTANIA-OTWARTE.md` — pytania, statusy, cytaty i powody
   odłożenia;
2. `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — status próśb i zadań;
3. `docs/decyzje/<ID>.md` — ECHO, litera/jawna decyzja, zakres i status;
4. `dyspozycje/WERSJE.md` — najnowsza ROBOCZA, jej zawartość i jedyny wpis
   `Playtest — na co patrzeć`;
5. `dyspozycje/_handoff/KANAL-PRACA.md` — meldunki, `CZEKAM-NA` i stan
   przekazania;
6. właściwy handoff/audyt — synteza bieżącej fali i zastrzeżenia.

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

### 4. W trakcie — Evaluator

Temat z uruchomionym Evaluatorem i bez jeszcze odebranego werdyktu PASS/FAIL.
Worktree nie jest dowodem; wymagany ślad raportu lub wpisu kanału.

### 5. Evaluator zakończony — czeka na finalną kontrolę/integrację

Temat z werdyktem Evaluatora (PASS lub PASS-WITH-NOTES), ale bez finalnej
kontroli, scalenia do `main` lub deployu. Wpisuj wyłącznie realny werdykt
Evaluatora — nie worktree.

### 6. Czeka na Operatora — gotowe do dispatchu

Pełny kontrakt istnieje: ECHO z literą A/B/C lub równoważna jawna decyzja w
`docs/decyzje/<ID>.md`, zakres wdrożenia opisany, testy/bramki zdefiniowane —
ale Operator nie został jeszcze uruchomiony. Dla każdego wpisu podaj plik
decyzji/rejestru jako dowód.

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

Tylko wpis z jawnym powodem właściciela albo wcześniejszą decyzją „później”,
„do kolejnego etapu”, „do odnowienia limitu”, „do kolejki” itp. Nie wolno
dopisać tematu tutaj wyłącznie dlatego, że agent uznał go za niepilny.

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

## 4. Snapshot referencyjny dla najnowszej ROBOCZEJ

Baza: **FALA 295**, ROBOCZA `8589d294`, audyt
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
  wstrzymany** (nie aktywny): implementacja lokalna bez deployu; runda 5
  wstrzymana do wspólnej naprawy `fix-barb-city-v2` (`PYTANIA-OTWARTE.md`).
  Dowód Operatora: commit `85f70a91`, testy `0e720a70`/`e0548514`/`49f01e7d` —
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

- `— (brak)` — ponowny skan rejestrów (FALA 295): żaden ID nie spełnia
  jednocześnie pełnego ECHO/kontraktu **i** braku realnego Operatora/commitu.
  Wykluczone ze snapshotu: `AI-BALANS-STEP6-Q1` (**już wdrożone** — `dadcb48`,
  rejestr); `R-KAMIEN-RELIEF-FOLLOWUP-Q1` (**commit** `8593237` na branchu);
  `R-DESIGN-PANEL-MIASTA-V2-Q1` (**blokada zewnętrzna** Design — kategoria 8);
  `MAP-UX-CLUSTER-LABEL-Q1` (**commity** `9d33e8f`/`d3470ed`); `R-OBRONA-MIASTA-MP-Q1`
  (**SCALONE** runda 3); `R-WIARYGODNOSC-S9-Q1` (Operator+Evaluator — kategoria 5).

### 7. Zapomniane — do dispatchu

- `P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY` — rozpoznanie dostarczone, brak decyzji
  ABC o progach; wymaga recon/kontraktu przed dispatch. Dowód:
  `PYTANIA-OTWARTE.md` (sekcja 2026-08-13).
- `P-KOPALNIA-PODSWIETLENIE-KOSMETYKA` — noty N2/N3/N5/N6 z Evaluatora bez
  zakresu naprawy i bez dispatchu. Dowód: `PYTANIA-OTWARTE.md` (2026-08-17).

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

## 5. Zasada utrzymania

Po każdej nowej ROBOCZEJ raport odczytuje aktualny wpis, ale nie zmienia
historii. Odpowiedzi właściciela pozostają w `PYTANIA-OTWARTE.md`,
`REJESTR-PROSB-I-ZADAN.md` i `docs/decyzje/`; z aktywnego ABC są usuwane
przez zmianę statusu, nigdy przez kasowanie historii.

Przy aktualizacji snapshotu rozdzielaj stany przejściowe (kategorie 2–5) od
kolejki dispatchu (6–7) i od świadomych odłożeń (8). Worktree, branch i ukryte
powiadomienie nie zastępują raportu Operatora ani werdyktu Evaluatora.
