# 00-dispatch (rejestracja wstępna) — R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1

**Data:** 2026-08-21
**Zgłoszenie właściciela (2 zrzuty ekranu — panel imperium + panel indywidualnego miasta).**
**Status:** WSTĘPNA REJESTRACJA — trzy powiązane, ale odrębne wątki w tym samym obszarze UI.
Zgodnie z poleceniem właściciela: zapisać, nie implementować teraz — partia przez Agentic
Workflow. **Potwierdzone przez orkiestratora: żaden z trzech wątków nie pochodzi z integracji
sześciu tematów tej sesji (FALA 303) — `git diff` względem bazy potwierdza zero dotknięcia
`empireDetailPanel.ts` i `gra/src/game/cities.ts` przez tę sesję.** To stan odziedziczony
z FALI 301/302 (inna sesja), teraz dopiero zauważony.

## Wątek A — zdublowany/sprzeczny suwak w panelu „Praca Imperium"

**Zgłoszenie:** w widoku „PRACA IMPERIUM" widoczne są DWA suwaki naraz:
- górny: „PODZIAŁ PRACA: BUDYNKI / ULEPSZENIA" — „Ulepszenia terenu (0–50%) / Budynki
  (remainder 0–100%)"
- dolny: „LOKALNY PRZYROST MIASTA: BUDYNKI / PULA" — „Budynki (0–100%) / Pula Pracy
  (remainder 0–80%)"

Właściciel: górny suwak jest merytorycznie poprawny, ale ma złe nazewnictwo (ma być: „Budynki
0–100%, Ulepszenia 0–50%" — dziś opisany odwrotnie/niejasno). Dolny suwak/baner **ma zostać
usunięty** — to prawdopodobnie regres/duplikat sprzed tematu `R-PRACA-JEDEN-SUWAK-UI-Q1`
(zarejestrowany 2026-08-20, status w rejestrze: „ZDEPLOYOWANE, FALA 301" — cel tamtego tematu
był dokładnie usunięcie DRUGIEGO, zbędnego suwaka; ten drugi suwak najwyraźniej wrócił albo
nigdy nie zniknął w pełni).

**Do potwierdzenia przez recon:** czy oba suwaki sterują tym samym stanem (i wtedy są
prawdziwym duplikatem/konfliktem — można dla tych samych ustawień uzyskać różne, sprzeczne
wyniki, jak zauważył właściciel), czy renderują dwa RÓŻNE mechanizmy (globalny podział
budynki/ulepszenia vs lokalna automatyzacja miasta) opisane po prostu myląco jako to samo.

## Wątek B — nazewnictwo górnego suwaka

Zmienić etykiety na: „Budynki (0–100%)" / „Ulepszenia (0–50%)" — zgodnie z rzeczywistym
zakresem (ulepszenia terenu są ograniczone capem 50%, budynki to dopełnienie 100%-ulepszenia).

## Wątek C — cap miasta vs cywilizacji (WYMAGA DECYZJI ABC, nie jest oczywistym bugiem)

**Zgłoszenie (drugi zrzut, widok „Indywidualne" pojedynczego miasta):** miasto może ustawić
lokalny podział „Budynki / Pula Pracy (lokalnie)" na dowolną proporcję niezależną od ustawienia
cywilizacji — pokazane 70% budynki / 30% ulepszenia ORAZ odwrotnie 30%/70%, czyli ulepszenia
miasta mogą przekroczyć 50%, mimo że cywilizacja ma globalny cap.

**WAŻNE — to nie jest oczywisty bug, tylko odziedziczona, świadoma decyzja:** kod
(`gra/src/game/cities.ts`, `clampPracaWspolnyWorekPercent`/`MAX_PRACA_WSPOLNY_WOREK_PROCENT=50`)
oraz test referencyjny z wcześniej w tej sesji (`gra/tools/praca-limit-50-test.cjs`, scenariusz
5) wprost dokumentują, że override miasta („historyczny automat", `ulepszeniaOverride: true`)
**celowo** nie dziedziczy capu 50% nadrzędnego splitu — komentarz w teście: „to jest historyczny
budżet automatu, więc nie może dziedziczyć capu nadrzędnego splitu 50%". Innymi słowy: ktoś
wcześniej świadomie zdecydował, że miasto MOŻE przekroczyć 50% w trybie „Indywidualne".

Właściciel teraz mówi: „jeśli coś ustalimy dla całej cywilizacji, to w miastach nie powinno być
możliwe ustawienie dla ulepszeń więcej niż główne ustawienie dla całej cywilizacji" — to brzmi
jak **chęć ZMIANY** tej wcześniejszej decyzji, nie zgłoszenie bugu. Wymaga jawnego ABC
(turniej dwóch projektów per `R-PROC-AUTOBOT-ABC-TURNIEJ.md`, bo dotyka balansu/mechaniki gry),
NIE prostego dispatchu Operatora — inaczej ryzyko cichego nadpisania wcześniejszej,
udokumentowanej decyzji bez właściwego śladu.

## Wątek D — pula pracy nie akumuluje mimo 100% alokacji (możliwy regres `R-PRACA-PULA-NIEAKUMULUJE-Q1`)

**Zgłoszenie (trzeci zrzut):** przy suwaku ustawionym na 100% „Pula imperium" / 0% „Budynki",
„PULA IMPERIUM" pokazuje `9 +10` i od kilku tur stan jest „praktycznie zerowy, albo na
niewielkim plusie" — mimo że CAŁY przychód Pracy (+10/turę) powinien się odkładać. Właściciel:
„coś z mechanizmem naliczania i podziału pracy jest nie tak."

**Krytyczne — to prawdopodobny regres już zamkniętego tematu:** rejestr ma wpis
`R-PRACA-PULA-NIEAKUMULUJE-Q1` (2026-08-20) — dokładnie ten sam objaw („pula pozostaje na
niskim poziomie zamiast odkładać bieżący przyrost Pracy") — oznaczony w korekcie statusów
2026-08-21 jako **„ZDEPLOYOWANE, FALA 302 (potwierdzone przez właściciela jako 'Akumulacja
puli pracy zgodnie z decyzją B')"**. Jeśli właściciel widzi ten sam objaw TERAZ, po
potwierdzonym deployu — albo (a) naprawa nie działa w praktyce mimo zielonych testów w tamtym
temacie, albo (b) to inny mechanizm powodujący identyczny objaw (stąd uwaga właściciela o
„trzech mechanizmach": dwóch w mieście + jednym na poziomie Pracy globalnej — możliwe że jeden
z nich cicho zeruje/nadpisuje to, co powinno trafić do puli).

**NIE zakładać z góry które. Recon musi:**
1. Sprawdzić dokładny raport/testy `R-PRACA-PULA-NIEAKUMULUJE-Q1` (`dyspozycje/autobot/runs/
   R-PRACA-PULA-NIEAKUMULUJE-Q1/`) i FALI 302 — co dokładnie było testowane i czy pokrywa TEN
   scenariusz (100% do puli, wiele tur pod rząd, 1 miasto).
2. Odtworzyć scenariusz z zrzutu: 1 miasto, suwak globalny 100% pula/0% budynki, kilka tur —
   sprawdzić czy pula rzeczywiście rośnie o pełny przychód (+10/turę) czy zeruje się/prawie
   zeruje się gdzieś w łańcuchu (możliwe interakcje z Wątkiem A/C — inny suwak lokalny miasta
   albo override automatu mogący przechwytywać część przychodu poza oczekiwaniem gracza).
3. Ustalić, czy „Wątek A" (dwa suwaki, część opisana jako duplikat) i ten regres mają WSPÓLNĄ
   przyczynę (nadmiar nakładających się mechanizmów podziału Pracy) — jeśli tak, naprawić
   jednym spójnym fixem zamiast łatać objawy osobno.

## Wątek E — suwak „Podział Praca: budynki/ulepszenia" w panelu automatyzacji ulepszeń miasta,
## zakres 0–50% zamiast 0–100%

**Zgłoszenie (czwarty zrzut):** w panelu podglądu ulepszeń miasta (sekcja „AUTOMATYZACJA
ULEPSZEŃ TERENU", widoczna przy zakładaniu/ustawieniach miasta), kontrolka „Podział Praca:
budynki / ulepszenia" ma suwak ograniczony do 0–50% dla ulepszeń. Właściciel: to niepotrzebne
ograniczenie — powinno być możliwe rozdysponowanie nawet 100% budżetu automatycznego na
ulepszenia; suwak ma być zmieniony na zakres 0–100%.

**Etykieta w tym panelu explicite mówi:** „To nie jest globalny budżet automatu" — czyli
projektant/deweloper TEGO konkretnego wystąpienia już zakładał, że to coś innego niż globalny
cap 50% z `MAX_PRACA_WSPOLNY_WOREK_PROCENT` (Wątek A/C). **Krytyczne pytanie dla recon:** czy
ta kontrolka faktycznie czyta/zapisuje TĘ SAMĄ wartość co globalny suwak „Ulepszenia terenu
(0–50%)" z Wątku A (identyczne etykiety, more niż podejrzana zbieżność — możliwe że to ten sam
komponent/state wyrenderowany w dwóch miejscach), czy to naprawdę osobny, niezależny parametr
lokalny dla automatyzacji tego miasta. Jeśli to TEN SAM stan co Wątek A — zmiana zakresu tutaj
na 0–100% byłaby SPRZECZNA z capem 50% z `MAX_PRACA_WSPOLNY_WOREK_PROCENT` i wymagałaby tej
samej decyzji ABC co Wątek C, nie prostej zmiany UI. Jeśli to osobny parametr — zmiana zakresu
jest prostą, nieblokującą poprawką UI (podnieść limit suwaka z 50 na 100 w tym jednym miejscu).

## Proponowany plan (do wykonania w Agentic Workflow, NIE teraz)

1. Recon Operatora: dokładna lokalizacja obu suwaków w kodzie (`empireDetailPanel.ts` — plik
   już zidentyfikowany, dokładne linie do ustalenia), czy sterują tym samym stanem, historia
   `R-PRACA-JEDEN-SUWAK-UI-Q1` (dlaczego drugi suwak nie zniknął / wrócił).
2. Wątek A+B: naprawa Operatora — usunięcie dolnego suwaka (po potwierdzeniu, że to faktycznie
   duplikat/regres), poprawka nazewnictwa górnego. To NIE wymaga ABC — kosmetyka + regres.
3. Wątek C: **ABC do właściciela PRZED jakąkolwiek zmianą kodu** — czy cap 50% ma teraz
   obowiązywać też override miasta (zmiana zachowania udokumentowanego w
   `praca-limit-50-test.cjs`), czy zostaje jak jest (świadomy wyjątek dla „historycznego
   automatu"). Warianty do przygotowania: A) cap 50% egzekwowany też w mieście (zmiana
   zachowania + aktualizacja testu referencyjnego), B) zostaje bez zmian, tylko UI jaśniej
   komunikuje że to niezależny, historyczny wyjątek, C) inny próg dla miasta niż 50% cywilizacji
   (np. miasto może przekroczyć tylko o X p.p.).

## Allowlista

Wątek A+B: `gra/src/ui/empireDetailPanel.ts` (do potwierdzenia dokładnych linii przez recon).
Wątek C: zależny od decyzji ABC — potencjalnie `gra/src/game/cities.ts`,
`gra/tools/praca-limit-50-test.cjs`, `gra/src/ui/empireDetailPanel.ts`.

## Model / effort

Operator (recon + wątki A/B) → Sonnet 5, effort Medium. Wątek C wymaga ABC właściciela przed
dispatchem — nie zaczynać implementacji bez zapisanego ECHO.
