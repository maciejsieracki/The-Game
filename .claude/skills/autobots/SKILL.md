---
name: autobots
description: >-
  Uniwersalny szkielet procesu AutoBot: routing ról Operator → Evaluator →
  Final Control → integracja → READY_FOR_DEPLOY → osobna bramka deploy/push,
  dyscyplina ABC/ECHO, GOAL + allowlista + izolacja + plan testów, zapis
  dispatchu przed dispatchem, granice nienaruszalne dziedziny, watchdog,
  kontrakt raportu, dyscyplina źródeł i zakresu, wzorzec promptu dla
  wykonawcy. Bez konkretów jednego projektu — używaj jako punkt startowy
  przy rozpoczęciu pracy, przejęciu tematu, dispatchu subagentów, kontroli
  statusu, przygotowaniu integracji lub zakładaniu procesu w nowym projekcie;
  konkretne wiązania (ścieżki, modele, bariery, liczby) trzymaj w
  towarzyszącym skillu specyficznym dla projektu.
---

# Autobots — uniwersalny szkielet procesu

Ten skill opisuje **metodologię** procesu AutoBot niezależnie od konkretnego
projektu: role, pętlę, dyscyplinę decyzyjną, granice, watchdog i kontrakt
raportu. Nie zawiera nazw plików, katalogów, modeli ani liczb żadnego
konkretnego repozytorium — ma być kopiowalny 1:1 do dowolnego projektu.

Wartości w nawiasach klamrowych (`{tak-wyglada-parametr}`) są **parametrami**
— rozstrzyga je konkretny projekt raz, przy uruchomieniu procesu, i zapisuje
w swoim skillu projektowym. Nie pytaj o nie przy każdym temacie.

Dla projektu Civ „The Game" wypełnieniem tego szkieletu jest
[`civ-autobot/SKILL.md`](../civ-autobot/SKILL.md) (Ścieżka B, aktywny proces),
[`civ-autobot-workflow/SKILL.md`](../civ-autobot-workflow/SKILL.md) (Ścieżka A,
dispatch przez Workflow z jawnym effort per rola) oraz
`docs/decyzje/R-PROC-AUTOBOT.md` (norma procesu, bramki, hasła).

---

## 0. Szybki start

```text
1. Przeczytaj ten dokument w całości. Jest długi, ale krótszy niż koszt błędu.
2. Przeczytaj pliki startowe projektu w kolejności, którą projekt ustalił
   ({kolejnosc-plikow-startowych}).
3. Sprawdź stan: co dziś jest aktywne, co leży w miejscu pracy w toku, i czy
   poprzedni wykonawca nie zostawił czegoś nierozliczonego.
4. Napisz meldunek startowy (§2.3) i CZEKAJ na potwierdzenie właściciela.
5. Nie zaczynaj wykonania przed potwierdzeniem ID, GOAL i allowlisty.
```

### Pięć rzeczy do wiedzy od razu

1. **Sprawdź, czy to, co masz zrobić, nie istnieje już pod spodem.** Jeśli praca
   odtwarza mechanizm, który gdzie indziej w projekcie już działa — zatrzymaj
   się i zapytaj, zanim zaczniesz (§13).
2. **Domyślna odmowa wszędzie** — uprawnienia, narzędzia, dane. Nigdy
   „wszystko wolno, chyba że".
3. **Decyzje otwarte i blokujące mają pierwszeństwo.** Sprawa nierozstrzygnięta
   przez właściciela nie zostaje rozstrzygnięta po cichu w trakcie wykonania.
4. **Orkiestracja wieloagentowa jest wyłączona**, dopóki właściciel nie włączy
   jej jawnie na daną sesję (§11).
5. **Granice nienaruszalne dziedziny (§7) oznaczają `FAIL`**, niezależnie od
   jakości reszty pracy.

### Trzy najczęstsze sposoby zepsucia projektu

| Sposób | Objaw | Zapobieganie |
|---|---|---|
| Rozjazd zakresu | temat rośnie w trakcie rundy | §13.3 — nowy pomysł to nowy temat |
| Fałszywe „gotowe" | raport `PASS` bez sprawdzonego dowodu | §1.2 — co nie jest dowodem |
| Cicha decyzja w wykonaniu | wybór produktowy zapadł bez rozmowy z właścicielem | §8.1 — ujawnij wybór wcześniej |

## 1. Zasada nadrzędna

Każdy temat ma: **pełne ID, jawny `GOAL`, mierzalne kryteria końca, allowlistę,
izolację i plan sprawdzenia.** Bez kompletu nie ma dispatchu.

### 1.1 `READY_FOR_DEPLOY` oznacza łącznie

- zmiana wyłącznie w zatwierdzonej allowliście;
- dowód wykonania ({dowod-wykonania}) przechodzi w całości;
- kryteria końca sprawdzone **faktycznie**, nie tylko deklaratywnie;
- żadna granica nienaruszalna dziedziny nienaruszona (§7);
- brak nowych wartości sekretów w zapisach projektu;
- rejestr tematów odzwierciedla stan faktyczny;
- zmiana **faktycznie włączona do stanu obowiązującego** przez orkiestratora.

**Deploy/push pozostaje osobną bramką** po `READY_FOR_DEPLOY`. Wymaga wyraźnego
polecenia właściciela i idzie **wyłącznie tam, gdzie on wskazał**. Operator,
Evaluator i Final Control nigdy nie wykonują tego kroku sami.

### 1.2 Co NIE jest dowodem zakończenia

Najczęstsze źródło fałszywego „gotowe":

| To nie jest dowód | Dlaczego |
|---|---|
| Raport `PASS` | opisuje pracę, nie jej skutek w stanie obowiązującym |
| Nazwa gałęzi / worktree | nazwa miejsca pracy nie jest stanem |
| Commit | zapis punktu kontrolnego, nie integracja |
| Widoczny status subagenta w UI narzędzia | narzędzie pokazuje przebieg, nie wynik |
| Deklaracja „zrobione" | deklaracja bez artefaktu jest niczym |
| Brak artefaktu | brak dowodu to nie jest dowód |

## 2. Start sesji

### 2.1 Kolejność czytania — obowiązkowa

Każdy projekt ustala własną, stałą kolejność plików startowych
({kolejnosc-plikow-startowych}) — raz, przy uruchomieniu procesu, nie przy
każdym temacie. Niezależnie od nazw plików, kolejność pokrywa te same funkcje:

| # | Funkcja pliku | Po co |
|---|---|---|
| 1 | punkt startowy projektu | mapa źródeł i norma procesu |
| 2 | rejestr tematów | co aktywne, co zablokowane |
| 3 | bieżący handoff | zdjęcie sytuacji, zastępowane w całości |
| 4 | pamięć procesu / dziennik błędów | czego już raz nie udało się zrobić dobrze |
| 5 | dziennik decyzji | decyzje, w tym **otwarte i blokujące** |
| 6 | rejestr scenariuszy / kryteriów | źródło planów sprawdzenia |
| 7 | specyfikacja bieżącego etapu | co dokładnie ma powstać teraz |

**Nie zaczynaj** od starego handoffu, płaskiego logu, samego czatu ani archiwum
procesu. Archiwum jest historią rozważań, nie routingiem.

### 2.2 Gdy zmieniasz sam proces

Przed dotknięciem plików samego procesu (definicje ról, punkt startowy, rejestry
procesu) przeczytaj tryb bezpiecznej zmiany procesu, jeśli projekt ma go
wydzielony. Te ścieżki mają ostrzejszy tryb: **błąd w wytworze wyłapie
Evaluator, błąd w definicji samego Evaluatora nie wyłapie nikt.**

**Zmiana procesu nigdy nie jedzie w allowliście tematu produktowego** — nawet
jednolinijkowa. To osobny temat w domenie procesowej.

### 2.3 Meldunek startowy

```text
Przeczytałem: <pliki startowe tego projektu, w ustalonej kolejności>.

Stan: <etap; tematy aktywne z pełnym ID i statusem>
Blokady: <lista, w tym decyzje otwarte>
Następna bramka: <co dokładnie>
Orkiestracja wieloagentowa: <wyłączona / włączona zgodą z dnia …>

Nie zaczynam zmian, dopóki nie potwierdzę ID, GOAL, allowlisty i decyzji
wymaganych od właściciela. Pracuję wyłącznie w bieżącym, czystym worktree.
```

## 3. Role

```text
Operator → Evaluator (zarzuty) → Operator (obrona) → Final Control (werdykt/zarzut)
→ integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push
```

**Od 2026-08-29: model zarzuty→obrona→sędzia** (§3.2, §3.2a, §3.3 niżej).
Wcześniejsze rundy zamknięte pod starym modelem (Evaluator = jeden werdykt
wprost, bez formalnej obrony) pozostają ważne — nie wymaga się ich powtórki;
nowy model obowiązuje dla każdego nowego dispatchu Evaluatora od tej daty.

### 3.1 Operator

Wykonuje **jeden** temat w izolacji, wyłącznie w allowliście.
**Nie ocenia własnej pracy, nie integruje, nie deployuje, nie pushuje.**
Kończy raportem terminalnym (§9). Gdy natrafi na decyzję produktową —
zatrzymuje się ze statusem `DECISION_REQUIRED`, nie rozstrzyga sam.

Gdy Evaluator zwróci ponumerowane zarzuty (§3.2), Operator wraca **w tej samej
roli** jako Obrona (§3.2a) — to nie jest nowa rola do osobnego kalibrowania
modelu, tylko drugie wywołanie tej samej.

### 3.2 Evaluator — niezależny adwokat diabła

**Nie zastępuje Operatora, nie integruje, nie publikuje, i nie wydaje
ostatecznego werdyktu** — werdykt per zarzut należy do Final Control (§3.3),
na podstawie zarzutu i odpowiedzi Obrony. Zadanie Evaluatora kończy się na
wykryciu i nazwaniu problemu, nie na jego rozstrzygnięciu.

Sprawdza dokładnie tę samą listę dziesięciu punktów co dotąd — zmienia się
wyłącznie **forma wyniku**. Każde niespełnienie punktu to osobny, ponumerowany
zarzut: numer, dokładne miejsce (plik+linia/sekcja/pozycja allowlisty), co
dokładnie nie zgadza się z którym punktem, i dlaczego ma znaczenie dla `GOAL`
albo granic nienaruszalnych. Zarzut bez wskazanego miejsca jest niekompletny.
Lista może być **pusta** — idzie od razu do Final Control jak dziś:

1. Czy diff mieści się w allowliście — co do pliku;
2. Czy nie narusza żadnej granicy nienaruszalnej dziedziny (§7);
3. Czy kryteria końca **faktycznie** przechodzą — nie czy raport tak twierdzi;
4. Czy temat dotyka obszaru wrażliwego dla tej dziedziny choćby pośrednio;
   jeśli tak — czy sprawdzenia właściwe dla tego obszaru przechodzą;
5. Czy w diffie nie ma wartości sekretów, także w przykładach i materiałach
   pomocniczych;
6. Czy nie ma usunięć, których `GOAL` nie wymagał;
7. Czy nie nakłada się z drugim aktywnym tematem;
8. Czy dowód wykonania jest zielony na **faktycznym** stanie pracy, sprawdzony
   niezależnie od Operatora — nie tylko zgodnie z raportem;
9. Czy `GOAL` w raporcie zgadza się z `GOAL` z zapisu dispatchu i czy kryteria
   końca w raporcie odpowiadają tym z dispatchu — **rozbieżność jest sygnałem
   utraty kontekstu przez Operatora**, niezależnie od wyniku;
10. Gdy temat był dzielony na węzły (§11.3.2) i choć jeden rodzi zarzuty —
    zarzuty przypisz **dokładnie do tego jednego** wadliwego węzła. Węzły bez
    zarzutów nie wracają razem z nim.

Brak zarzutów po przejściu wszystkich dziesięciu punktów zwykle znaczy zbyt
wąski zakres sprawdzenia, nie doskonałość wytworu.

### 3.2a Obrona — odpowiedź Operatora na zarzuty Evaluatora

Ten sam Operator (jedno wywołanie z pełnym kontekstem wytworu i listy zarzutów,
albo świeże wywołanie z tym samym dostępem — oba dopuszczalne). Odpowiada na
**każdy** zarzut z osobna, po numerze:

- **PRZYJMUJĘ** — zarzut trafny, wraca do poprawy w tej samej rundzie — albo
- **ODRZUCAM** — zarzut nietrafny —

w obu przypadkach z **dowodem z wytworu**: cytat, numer linii, fragment pliku,
wynik dowodu wykonania. Odpowiedź bez dowodu jest nieważna — samo zapewnienie
„to działa poprawnie" albo „to było zamierzone" nie jest obroną i Final Control
ma je traktować jak brak odpowiedzi. **Brak odpowiedzi na zarzut liczy się jak
PRZYJMUJĘ.**

Gdy zarzut zależy wyłącznie od intencji, której wytwór sam nie rozstrzyga (np.
świadoma decyzja projektowa, o której Evaluator nie wiedział) — obrona wskazuje
to wprost i zostawia rozstrzygnięcie Final Control jako kandydata do
`DO DECYZJI CZŁOWIEKA` (§3.3), zamiast na siłę dowodzić z materiału, którego
tam nie ma.

### 3.3 Final Control — orzeka per zarzut (sędzia)

Zawsze **osobny subagent** — nigdy ten sam wykonawca, nigdy główny/orkiestrujący
agent prowadzący rozmowę z właścicielem, nigdy Evaluator, który postawił
zarzuty. **Nie wystawia `READY_FOR_DEPLOY`.**

Dostaje zarzuty i odpowiedzi Obrony **ponumerowane i neutralnie, bez etykiet
wskazujących kto (jaka rola) co napisał** — orzeka na podstawie treści i
dowodu, nie autorytetu strony. Punktem odniesienia jest **wytwór w worktree,
sprawdzony bezpośrednio** — nie same raporty, które są deklaracją, nie
dowodem. Dla **każdego** zarzutu z listy Evaluatora jeden werdykt:

- **NAPRAW** — zarzut trafny, obrona nie obaliła go dowodem z wytworu; wskaż
  dokładnie co i gdzie poprawić — temat wraca do Operatora jak przy `FAIL`;
- **ODDAL** — obrona obaliła zarzut dowodem z wytworu; zarzut nie idzie dalej;
- **DO DECYZJI CZŁOWIEKA** — rozstrzygnięcie zależy od intencji, priorytetu
  albo czegoś, czego wytwór sam nie rozstrzyga — nie od tego, czy Final
  Control się „zgadza", tylko czy istnieje dowód rozstrzygający w którąkolwiek
  stronę. Brak takiego dowodu = domyślnie ten werdykt, nie zgadywanie na wyczucie.

**Agregat ustala STATUS:** choć jeden `NAPRAW` → `FAIL`; brak `NAPRAW`, choć
jeden `DO DECYZJI CZŁOWIEKA` → `DECISION_REQUIRED`; same `ODDAL` → `PASS`.
To zastępuje dawne pojedyncze „gotowość do integracji: TAK/NIE" — agregat JEST
odpowiedzią. Kontroluje przy tym kompletność śladu:

1. Czy istnieje zapis dispatchu i czy `GOAL` nie zmienił się po drodze;
2. Czy ID jest to samo we wszystkich rundach;
3. Czy **każdy** zarzut Evaluatora ma odpowiedź Obrony i werdykt — zarzut bez
   jednego z dwóch nie jest zamknięty;
4. Czy `PASS-WITH-NOTES`/`ODDAL` nie ukrywa uwagi dotyczącej GOAL, dowodu,
   zakresu, granic nienaruszalnych ani gotowości do integracji;
5. Czy licznik rund się zgadza i **nie został po cichu zresetowany** — runda
   Obrony NIE jest osobną rundą, tylko częścią tej samej rundy Operator→Evaluator;
6. Czy rejestr tematów odzwierciedla stan faktyczny;
7. Przy temacie dzielonym na węzły — **ustala, który węzeł był najsłabszy**
   (dostał choć jeden `NAPRAW` albo wymagał najwięcej rund) i przekazuje to
   orkiestratorowi do zapisu (§9.2).

**Ślad dla właściciela — jedna tabela.** Gdy Evaluator zwrócił choć jeden
zarzut, orkiestrator składa zarzuty+obronę+werdykt w jedną tabelę
`| # | Zarzut | Obrona | Werdykt | Status |` zamiast trzech osobnych raportów.
Pod tabelą rozwinięte wyłącznie pozycje `DO DECYZJI CZŁOWIEKA`. Numeracja
zarzutów jest stała przez wszystkie rundy tego samego tematu.

### 3.4 Orkiestrator

Prowadzi rozmowę z właścicielem (główny czat). Integruje **wyłącznie
zatwierdzoną allowlistę**, per plik, w razie potrzeby per hunk. Jako **jedyny**
wystawia `READY_FOR_DEPLOY` (§1.1) — i dopiero **po faktycznej integracji**,
nie po pozytywnym Final Control. Przed integracją sprawdza rzeczywisty stan:
co faktycznie leży w worktree, diff, wynik bramek, raporty, allowlistę.

### 3.5 Właściciel

Odpowiada na decyzje **wyłącznie w głównym czacie orkiestratora**. Subagenci
są kanałami technicznymi — nie prowadź z nimi osobnych rozstrzygnięć
produktowych i nie przyjmuj decyzji za właściciela.

## 4. Pętla tematu

```text
dispatch → Operator → Evaluator (zarzuty) → Operator (obrona) → Final Control (werdykt/zarzut) → integracja → READY_FOR_DEPLOY
                 ↑            │                    │                       │
                 └────────────┴────────────────────┴───────────────────────┘
      FAIL / BLOCK / TIMEOUT / INFRA / ZWIS / brak dowodu
```

Lista zarzutów **pusta** → Final Control od razu, jak dziś. Lista **niepusta**
→ runda Obrony (§3.2a), dopiero potem Final Control. Obrona nie zwiększa
licznika rund — to ta sama runda Operator→Evaluator.

### 4.1 Format ID

```text
{prefiks-identyfikatora-tematu}-<ETAP>-<NNN>-<slug>
```

Prefiks i zestaw etapów ({nazwy-etapow-projektu}) są parametrem projektu,
ustalonym raz przy starcie procesu. **To jest wzór domyślny szkieletu, nie
wymóg** — konkretny projekt może mieć własny i wtedy obowiązuje jego wersja
zapisana w wypełnieniu parametrów (np. Civ „The Game" nie ma jednego prefiksu
i używa ID opisowego z sufiksem `-Q<n>`). ID jest **niezmienne przez wszystkie
rundy** i nigdy nieużywane ponownie.

Pytanie decyzyjne dostaje pełne ID tematu plus numer: `<PEŁNE-ID>-Q2` —
**nigdy samo „Q2"**. Nie numeruj pytań tak, by kolidowały z wcześniejszymi.

### 4.2 Zapis dispatchu — przed dispatchem, nie po

Plik tworzony **zanim** ruszy Operator, w miejscu i wedle szablonu ustalonego
przez projekt ({miejsce-i-szablon-zapisu-zlecenia}).

Zapis niesie **trzy obowiązkowe składniki pętli**:

| Składnik | Co odpowiada |
|---|---|
| **Wyzwalacz** | dlaczego ten temat startuje **teraz** i kto tak zdecydował |
| **Zadanie** | co ma być prawdą po zakończeniu |
| **Kryterium** | binarne `PRAWDA`/`FAŁSZ` plus konkretne sprawdzenia (§6) |

Dopuszczalne wyzwalacze: decyzja właściciela (podaj ID ECHO), odblokowanie
zależności (podaj co się odblokowało), powrót po `FAIL` (podaj numer rundy),
przegląd okresowy, zdarzenie zewnętrzne. **„Bo była kolej" nie jest
wyzwalaczem** — jeśli nie umiesz go nazwać, temat prawdopodobnie nie powinien
jeszcze startować.

**Dispatch bez tego pliku jest naruszeniem procesu** — bez niego nie da się
później sprawdzić, czy `GOAL` nie przesunął się w trakcie.

### 4.3 Przebieg

1. Zapis dispatchu → Operator;
2. Terminalny raport Operatora → **natychmiast** zamknij przebieg i uruchom
   Evaluatora dla tego samego ID;
3. `PASS` uruchamia Final Control **bez czekania na dodatkową zgodę**;
4. Pozytywny Final Control → orkiestrator sprawdza faktyczny stan i integruje;
5. Dopiero po **faktycznej integracji** orkiestrator zapisuje `READY_FOR_DEPLOY`;
6. Każdy `FAIL`, `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS`, brak artefaktu lub błąd
   izolacji wraca do Operatora, potem Evaluatora i Final Control — z tym samym
   ID, w ramach limitu rund. Przy temacie dzielonym na węzły wraca **wyłącznie
   węzeł wskazany przez Evaluatora**; reszta tematu stoi nietknięta.

### 4.4 `PASS-WITH-NOTES`

**Nie kończy procesu**, jeśli uwagi dotyczą któregokolwiek z: kryterium `GOAL`,
dowodu wykonania, zakresu, granic nienaruszalnych albo gotowości do integracji.
Wtedy temat wraca do Operatora jak przy `FAIL`.

Kończy proces tylko wtedy, gdy uwagi są kosmetyczne **i zapisane jako osobny
temat** — nie zostawione w raporcie jako wolna uwaga.

### 4.5 Limit rund: {liczba-podejsc-przed-eskalacja}

Liczba jest parametrem projektu; ma być **jawnie spisana jako liczba**, nie jako
apel „nie w nieskończoność". Po wyczerpaniu limitu orkiestrator **zatrzymuje
temat i zgłasza właścicielowi**: co próbowano, co zawiodło, jakie są warianty.

**Cichy reset licznika jest naruszeniem procesu.** Licznik ma boleć — to jego
funkcja. Przenumerowanie tematu w celu wyzerowania licznika jest tym samym
naruszeniem. Runda 2 przy konkretnym, naprawialnym `FAIL` idzie **na tym samym
ID i tej samej gałęzi**, nie na nowej gałęzi od zera.

### 4.6 Manual resume

Wymaga jawnej decyzji właściciela i **zachowuje ID, licznik rund oraz ostatni
werdykt**. Wznowienie nie jest nowym tematem i nie zeruje historii.

### 4.7 Pauza

Jedyna normalna pauza to **oczekiwanie na decyzję właściciela**. Pauzuje
**wyłącznie temat, który jej wymaga** — pozostałe niezależne tematy pracują
dalej. Zatrzymywanie całej pracy z powodu jednego pytania jest błędem.

## 5. Allowlista, izolacja, testy

### 5.1 Allowlisty

Każdy temat dostaje jawnie wypisaną listę plików/katalogów dopuszczonych do
zmiany ({mapa-obszarow-dopuszczonych-zmian}) — nigdy dostęp do całego
repozytorium naraz.

**Nigdy w allowliście:** pliki z wartościami sekretów, dziennik decyzji
właściciela (zmienia go wyłącznie orkiestrator po ECHO), wewnętrzne katalogi
systemu kontroli wersji, konfiguracja środowiska rzeczywistego bez jawnej
zgody właściciela.

Zmiana elementu strukturalnego ({zmiana-elementu-strukturalnego} — formatu
zapisu stanu, schematu danych, migracji) jest zawsze **osobną pozycją**
w allowliście, bo bywa trudna albo niemożliwa do cofnięcia.

### 5.2 Izolacja

```text
{miejsce-pracy-roboczej}:  <wg wzoru nazwy tego projektu>
baza:                      gałąź wskazana przez właściciela —
                           nigdy domyślna nazwa bez potwierdzenia
```

Jeden temat = jeden worktree = jeden aktywny przebieg Operatora. Worktree
usuwany dopiero po integracji albo zamknięciu tematu, i dopiero po sprawdzeniu,
że jego praca jest już przodkiem gałęzi docelowej.

**Tematy dotykające tych samych plików idą sekwencyjnie, nie równolegle** —
inaczej integracja drugiego kasuje pracę pierwszego albo wymusza ręczny
rozjazd, którego nikt nie zaplanował.

### 5.3 Plan sprawdzenia

```text
1. dowód wykonania w całości            # cały zakres, nie tylko obszar tematu
2. dowód wykonania dla obszaru tematu   # obszar dotknięty tym tematem
3. kryteria końca sprawdzone ręcznie    # w realnym środowisku, nie w atrapie
4. przy obszarze wrażliwym dziedziny: sprawdzenia właściwe dla niego —
   obowiązkowo, bezwarunkowo
5. przy zmianie formatu trwałego stanu: pełny zestaw sprawdzeń zgodności
   wstecznej
```

**Dowód nietautologiczności:** test, który przechodzi także po celowym
zepsuciu źródła, niczego nie dowodzi. Przy sprawdzeniu, na którym opiera się
werdykt, zmutuj źródło i pokaż, że test faktycznie czerwienieje.

### 5.4 Rozpoznanie przed startem

Zanim zaczniesz: sprawdź stan pracy w toku i przeszukaj istniejący dorobek
projektu pod kątem pojęcia z `GOAL` — czy podobne rozwiązanie już nie powstało.
Plus lektura: rejestr tematów (kolizje i duplikaty), dziennik decyzji (czy
decyzja to przesądza), rejestr kryteriów (czy kryterium istnieje — jeśli nie,
dopisz je **przed** startem tematu).

### 5.5 Przed integracją

Przejrzyj diff **również pod kątem usunięć**, nakładania się z drugim aktywnym
tematem i regresji względem pracy równoległej. Usunięcie, którego `GOAL` nie
wymagał, jest sygnałem ostrzegawczym.

**Nigdy nie ufaj naiwnemu porównaniu z gałęzią bazową.** Gałąź bazowa przesuwa
się między dispatchem a integracją, zwłaszcza przy tematach równoległych —
ustal najpierw faktyczny punkt rozejścia (`merge-base`), a dopiero potem
czytaj diff i scalaj bez fast-forward.

## 6. Kryteria końca

Każdy temat ma jednozdaniowy `GOAL` i kryteria końca **wskazujące konkretne,
nazwane sprawdzenia** z rejestru kryteriów projektu.

**Kryterium bez nazwanego sprawdzenia jest niekompletne.** „Działa poprawnie"
nie jest kryterium; „bramka X zielona i scenariusz Y odtworzony ręcznie" jest.

## 7. Granice nienaruszalne tej dziedziny

**Zasada jest uniwersalna: każdy projekt ma własną, jawnie spisaną listę granic,
których nie wolno przekroczyć niezależnie od tego, jak dobra jest reszta pracy
— i skutek naruszenia którejkolwiek jest zawsze ten sam: natychmiastowy `FAIL`.**

Treść listy jest odwzorowaniem dziedziny. Ustala się ją odpowiedziami na trzy
pytania: czego nie wolno naruszyć nigdy, choćby reszta pracy była bez zarzutu;
co narzuca prawo albo umowa; które dane są wrażliwe i gdzie nie wolno ich
wynosić.

**Osłabienie, usunięcie albo dodanie wyjątku do którejkolwiek granicy wymaga
ECHO** — nie jest zmianą, którą Operator może wprowadzić w biegu.

Lista `{lista-twardych-barier}` żyje w skillu projektowym, nie tutaj. Punkty,
które w praktyce powtarzają się w każdym projekcie informatycznym:

- **Żadnych wartości sekretów w repozytorium.** Sekret w diffie = `FAIL`
  i rotacja klucza.
- **Świadomy wybór elementów do integracji: nigdy `git add -A` ani `git add .`**
  — integracja wyłącznie wedle allowlisty, per plik, w razie potrzeby per hunk.
- **Domyślna odmowa** — wykonanie dodające ścieżkę „wszystko wolno, chyba że"
  jest `FAIL`.
- **Zmiana procesu nie jedzie w allowliście tematu produktowego** (§2.2).
- **Deploy/push wyłącznie tam, gdzie wskazał właściciel.**

## 8. Decyzje — ABC/ECHO

### 8.1 Kiedy formalna decyzja jest obowiązkowa

**Decyzje dotyczące kosztu, danych, dostępu lub odwracalności trafiają do
dziennika decyzji, zanim powstanie realizująca je praca — nie po.** Dla drobnej
implementacji **w ramach** przyjętej decyzji ABC nie jest wymagane.

#### Kto rozstrzyga — właściciel czy orkiestrator

**Nie każda otwarta kwestia jest pytaniem do właściciela.**

| Rodzaj | Kto | Przykłady |
|---|---|---|
| Pieniądze, prawo, ludzie, ryzyko, zakres produktu | **Właściciel** — pytanie ABC | co gra ma robić, jak wygląda balans, co wchodzi w zakres, ile wolno wydać |
| Technika bez konsekwencji dla powyższych | **Orkiestrator** — decyduje i **informuje**, nie pyta | jak nazywamy worktree, w jakim formacie trzymamy artefakty, gdzie leżą kopie |

Pytanie techniczne postawione właścicielowi **nie jest ostrożnością — jest
przerzuceniem na niego decyzji, do której nie ma podstaw.** Kosztuje jego czas
i opóźnia pracę. Gdy technika ma konsekwencję dla zakresu, kosztu lub ryzyka —
pytaj o **konsekwencję**, nie o mechanizm.

#### Test zrozumiałości — przed wysłaniem pytania

Pytanie idzie do właściciela dopiero, gdy przechodzi **wszystkie trzy**:

1. Czy da się je przeczytać na głos osobie spoza projektu i dostać sensowną
   odpowiedź?
2. Czy w treści pytania **nie ma** numeru paragrafu, ścieżki pliku, nazwy
   narzędzia ani identyfikatora wewnętrznego? Te idą do odnośnika, nie do zdania.
3. Czy warianty różnią się **skutkiem**, a nie sposobem wykonania?

Kontrola formy (kompletność wariantów i argumentów) nie zastępuje tego testu —
pytanie może być formalnie kompletne i mimo to niezrozumiałe dla adresata.

### 8.2 Szablon pytania — wszystkie pola obowiązkowe

```text
PYTANIE: <PEŁNE-ID-TEMATU>-Q<n>
SYTUACJA:       <stan faktyczny>
CEL PYTANIA:    <co rozstrzygamy>
DLACZEGO TERAZ: <co blokuje, jeśli nie rozstrzygniemy>

WARIANT A: <opis>
  ZA:      1) …  2) …          ← minimum dwa
  PRZECIW: 1) …  2) …          ← minimum dwa
WARIANT B: <opis>   (ZA/PRZECIW jak wyżej)
WARIANT C: <opis>   (ZA/PRZECIW jak wyżej)

REKOMENDACJA: <litera + jedno zdanie>
KONSEKWENCJE IMPLEMENTACYJNE: <co trzeba napisać albo przepisać>
KONSEKWENCJE TESTOWE: <które sprawdzenia się zmieniają lub dochodzą>
```

Pytanie bez dwóch argumentów za i dwóch przeciw dla **każdego** wariantu jest
niekompletne — uzupełnij przed zadaniem.

### 8.3 ECHO

**Nie zamieniaj odpowiedzi „chyba", luźnej rozmowy ani rekomendacji agenta
w formalną decyzję.** Rekomendacja nie staje się decyzją przez brak sprzeciwu.

ECHO zapisuje się **dopiero po jednoznacznej odpowiedzi literą**, w rejestrze
ECHO projektu, w formacie `<PEŁNE-ID>-Q2 = B` z datą i autorem. Dopiero potem
kontynuuj ten sam ID.

## 9. Kontrakt raportu

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA | DECISION_REQUIRED | …
DOMAIN: <domeny raportu tego projektu>
TEMAT:  <pełne ID>
GOAL:   <jedno zdanie>
ZMIANY/COMMIT: <pozycje z allowlisty + SHA albo „brak zmian">
TESTY:  <wynik dowodu wykonania + nazwane sprawdzenia + wynik kontroli ręcznej>
BLOKADY: <lista albo „brak">
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: NIE WYKONANO
```

`DEPLOY/PUSH` domyślnie `NIE WYKONANO`. `WYKONANO` wpisuje wyłącznie
orkiestrator, po jawnym poleceniu właściciela i wyłącznie tam, gdzie on wskazał.

**Status nie zmienia się** na podstawie nazwy worktree, interfejsu narzędzia,
deklaracji agenta ani nieistniejącego raportu.

`DECISION_REQUIRED` jest **osobnym tokenem statusu**, nie odmianą `BLOCK`:
oznacza, że praca zatrzymała się na decyzji produktowej właściciela, a nie na
przeszkodzie technicznej. Nie zużywa rundy.

### 9.1 Zasada czystości — co wraca do orkiestratora

Raport terminalny niesie **destylat, nie surowe dane**: ścieżki i SHA zamiast
wklejonego diffu, wynik bramki zamiast pełnego logu, jedno zdanie cytatu
zamiast strony źródła. Surowe materiały zostają w worktree Operatora —
orkiestrator sięga po nie sam, jeśli musi zweryfikować, ale domyślnie pracuje
na destylacie z pól `ZMIANY/COMMIT` i `TESTY`.

**Limit twardy: {limit-objetosci-raportu}.** Zasada bez liczby jest apelem, nie
regułą. Przekroczenie to `PASS-WITH-NOTES`, nie `FAIL` — ale wraca do poprawy,
bo raport, którego nikt nie przeczyta w całości, nie pełni swojej funkcji.

### 9.2 Metryka przy dekompozycji

Gdy temat przeszedł przez podział na węzły (§11.3.2), **Final Control ustala**
przy zamknięciu, który węzeł był najsłabszy, a **orkiestrator zapisuje** to
jednym zdaniem w rejestrze tematów. Żaden węzeł bez `FAIL` → „brak, wszystkie
węzły `PASS` za pierwszym razem". Po kilku tematach widać, co się psuje
najczęściej.

## 10. Watchdog i pojemność

| Parametr | Wartość |
|---|---|
| Jeden temat | **jeden aktywny przebieg Operatora** |
| Brak ruchu → `ZWIS` | **{czas-do-uznania-zawieszenia}** |
| Aktywna pula tematów | **{liczba-tematow-rownoleglych}** |

**Obsadzanie slotów:** gdy istnieje niezablokowana praca, a slot jest wolny —
obsadź go. Zostawienie wolnego zasobu przez przeoczenie jest błędem tak samo
jak przeciążenie. Po raporcie terminalnym zwolnij slot i uruchom następny etap
natychmiast.

**Przy `ZWIS`:** sprawdź przebieg, stan worktree i artefakty **zamiast zgadywać**.
Nie anuluj i nie restartuj w ciemno — orkiestrator przejmuje temat.

**`INFRA` to osobna kategoria od `FAIL`.** Brak miejsca na dysku, niedostępne
narzędzie, błąd izolacji worktree — to nie jest wada pracy Operatora i nie
poprawia się jej ponownym dispatchem tego samego zlecenia. Sprzątanie zasobów
środowiska ma własną procedurę: najpierw zmierz stan (`df`), wypisz istniejące
przestrzenie robocze, a **przed usunięciem którejkolwiek sprawdź, czy jej praca
jest już przodkiem gałęzi docelowej**. Nigdy nie usuwaj przestrzeni oznaczonej
jako używana przez wciąż działający wątek.

## 11. Delegowanie pracy i orkiestracja wieloagentowa

### 11.1 Kto zleca, nie wykonuje sam

Osoba/agent, która prowadzi rozmowę z właścicielem, przygotowuje zlecenie
i integruje zatwierdzony wynik (§3.4), **nie wykonuje sama pracy merytorycznej
zlecenia**. Powód jest ten sam, co przy zakazie oceniania własnej pracy: kto
zleca i integruje, traci zewnętrzny punkt odniesienia, jeśli jest jednocześnie
wykonawcą. Zlecający sprawdzający sam siebie nie jest sprawdzeniem.

**Poniższe (§11.2, §11.3, §11.3.1) stosuje się, gdy wykonawcą jest program.**

### 11.2 Przydział modeli i poziomu wysiłku

Każda rola ma przypisany model i poziom wysiłku myślenia
({model-wykonawcy}, {model-sprawdzajacego}, {model-kontroli-koncowej},
{poziom-wysilku-mysleniowego}). Przydział, raz ustalony, **nie wymaga
potwierdzania przy każdym dispatchu.** Zmiana wymaga ECHO.

Projekt może mieć **wyjątki przedmiotowe** — klasy tematów, dla których
przydział jest inny, bo model bazowy udowodnił, że sobie z nimi nie radzi.
Wyjątek jest jawnie spisany, ma nazwane kryterium klasyfikacji, a orkiestrator
klasyfikuje każdy temat **w zapisie dispatchu**, nie w pamięci.

### 11.3 Zawsze przez to samo narzędzie zlecania — nigdy przez wywołanie ad hoc

Gdy zlecenie idzie do programu i projekt wymaga jawnego `effort` per rola,
musi przejść przez narzędzie orkiestracji, które pozwala przypisać do wywołania
**i model, i poziom wysiłku**. Zwykłe, doraźne wywołanie subagenta zwykle
przyjmuje wyłącznie model — dispatch z jego pominięciem oznacza, że przydział
z §11.2 nie został zastosowany.

Etapy narzędzia **odwzorowują role, nie zastępują ich** — nazwa etapu ma
odpowiadać roli, a etykieta wywołania ma zawierać rolę i temat.

Gdy narzędzie orkiestracji jest niedostępne albo właściciel nie dał na nie
zgody w tej sesji, projekt ma **drugą, w pełni poprawną ścieżkę**: różnicowanie
ról wyłącznie treścią promptu, bez parametru effort. Obie ścieżki żyją jako
osobne dokumenty, nie jako warunek w środku jednego pliku.

### 11.3.1 Dobierz szerokość fan-outu do faktycznego limitu

Ten limit ({limit-rownoleglosci-wywolan}) **nie jest odwzorowaniem dziedziny** —
wynika z zasobów maszyny, na której działa orkiestrator, nie z rodzaju pracy.

```bash
nproc        # limit = min(16, nproc - 2)
```

| Rdzenie | Rdzenie − 2 | Sufit | **Limit** |
|---|---|---|---|
| 4 | 2 | 16 | **2** |
| 8 | 6 | 16 | **6** |
| 16 | 14 | 16 | **14** |
| 18 i więcej | ≥16 | 16 | **16** |

**Limit nie zależy od obciążenia maszyny.** Rezerwa dwóch rdzeni jest odejmowana
z góry. Czekanie na „spokojniejszą porę" niczego nie zmienia — zmienia to
wyłącznie większy kontener.

**Reguła:** liczba równoległych wywołań w jednej fali powinna odpowiadać
limitowi. Gdy zadań jest więcej niż miejsc, **łącz je w grubsze paczki** zamiast
mnożyć cienkich agentów. Cztery paczki przy limicie dwóch kończą się szybciej
niż siedem drobnych — narzut wstępu do promptu i przełączania sumuje się.

Limit techniczny fan-outu i pula tematów z §10 to **dwie różne liczby o różnych
źródłach** (moc maszyny vs. pojemność przeglądu właściciela). Przy zmianie
którejkolwiek sprawdź, czy druga nadal ma sens.

### 11.3.2 Kiedy dzielić zadanie na węzły, a kiedy nie

Przed dispatchem odpowiedz na dwa pytania. Progi ({progi-podzialu-tematu-na-wezly})
są parametrem projektu:

| Pytanie |
|---|
| Czy temat ma co najmniej dwa niezależne obszary allowlisty, więcej nazwanych sprawdzeń niż próg projektu, albo więcej plików w allowliście niż próg projektu? |
| Czy przetworzenie w jednym ciągu grozi przepełnieniem kontekstu jednego wykonawcy? |

**Choć jedno „tak" i kroki nie są sekwencyjnie zależne** → podziel. Kroki
zależne (krok 2 potrzebuje wyniku kroku 1) **nie dzielą się**, niezależnie od
progów. Obie odpowiedzi „nie" → jeden wykonawca, bez podziału.

#### Najmniejszy skuteczny graf, nie największy możliwy

**Podział kosztuje.** Każdy dodatkowy węzeł powtarza wstęp i kontekst, wymaga
własnej koordynacji i własnego przekazania wyniku — więcej węzłów nie skraca
pracy proporcjonalnie do ich liczby. Dziel, gdy progi są przekroczone, nie
dlatego, że się da.

**ID węzła:** ID rodzica z sufiksem litery (`-a`, `-b`, `-c`). Węzeł nie dostaje
osobnego wpisu w rejestrze. **Licznik rund (§4.5) liczy się dla całego tematu**,
nie osobno dla węzła. Każdy węzeł ma **binarne kryterium sukcesu** obok
nazwanego sprawdzenia z §6.

#### Wzorzec podziału dla tematu, w którym wytworem jest kod

| Węzeł | Zakres | Reguła przeciw samooszukiwaniu |
|---|---|---|
| `-a` Logika | kod produkcyjny | zakaz wyciszania błędu bez ponownego rzucenia lub zalogowania; zakaz `TODO` w kodzie idącym do integracji |
| `-b` Testy | testy, pisane z rejestru kryteriów, **bez wglądu w implementację** | zakaz asercji „coś się zwróciło" jako jedynej; wymóg testu negatywnego tam, gdzie kryterium go przewiduje |
| `-c` Ryzyko/granice | granice nienaruszalne, sekrety, zgodność wsteczna | zakaz twierdzenia „sprawdzone" bez wskazania linii wykonującej sprawdzenie |

**Testy pisze inny węzeł niż kod.** Wykonawca, który napisał kod, pisze testy
sprawdzające to, co kod robi — a nie to, czego wymaga kryterium. Testy
przechodzą, wymaganie nie jest zrealizowane, wszystko świeci na zielono i nikt
tego nie łapie.

### 11.3.3 Co wykonawca dostaje w zleceniu — cztery pola, wszystkie obowiązkowe

| Pole | Co to jest |
|---|---|
| **Zadanie** | wąski zakres, jedno zdanie |
| **Reguła przeciw samooszukiwaniu** | konkretny sposób oszukania siebie, którego **zakazujemy** |
| **Binarne kryterium** | sprawdzalne `PRAWDA`/`FAŁSZ` |
| **Procedura naprawcza** | co dokładnie robi Evaluator przy `FAIL` — zapisane z góry, nie improwizowane |

Drugie pole jest tym, którego brakuje najczęściej. **Kryterium sukcesu sprawdza,
czy wynik jest kompletny. Reguła przeciw samooszukiwaniu zakazuje sposobu,
w jaki wykonawca uzna niedokończoną albo błędną pracę za gotową.** To dwie
różne rzeczy.

Reguły przeciw samooszukiwaniu **pochodzą z faktycznie zaobserwowanych błędów
tego projektu, nie z teorii.** Nie kopiuj cudzych przykładów: błąd popełniony
w innym projekcie rzadko trafia w to, co faktycznie zawodzi w tym.

### 11.4 Co zlecający robi sam

Wyjątki od §11.1, bo z definicji nie da się ich delegować:

- rozmowa z właścicielem i przyjmowanie decyzji;
- zapis ECHO i aktualizacja rejestrów procesu;
- przygotowanie dispatchu i allowlisty;
- integracja zatwierdzonej pracy i wystawienie `READY_FOR_DEPLOY`;
- deploy/push po jawnym poleceniu.

**Wszystko poza tą listą jest delegowane.**

### 11.5 Gdy zgoda na orkiestrację zostanie cofnięta

Właściciel może cofnąć zgodę jednym zdaniem w rozmowie. Wtedy jeden ciągły
wątek pracy pełni po kolei wszystkie role, różnicowane wyłącznie treścią
zlecenia, a §11.1 przestaje obowiązywać do odwołania.

## 12. Dyscyplina źródeł i korekt

### 12.1 Hierarchia źródeł

**Zanim fakt o zewnętrznym narzędziu, dostawcy albo przepisie trafi do dokumentu
decyzyjnego, sprawdź go w źródle wyższego rzędu, nie w plotce ani we własnym
skojarzeniu.**

| Rząd | Źródło | Status |
|---|---|---|
| 1 | oficjalna dokumentacja / faktyczny schemat narzędzia | **rozstrzygające** |
| 2 | repozytorium, zgłoszenia błędów, kod źródłowy | rozstrzygające dla stanu faktycznego |
| 3 | wpis producenta, notatka o wydaniu | wiarygodne, ale marketing |
| 4 | artykuł branżowy, podsumowanie | poszlaka — sprawdź w rzędzie 1 |
| 5 | materiał promocyjny | **nigdy jako podstawa decyzji** |

Fakt z rzędu 4 lub 5 zapisuj jawnie jako niepotwierdzony. To dotyczy także
własnej pamięci o narzędziu: **„wiem, że to narzędzie ma taki parametr" jest
rzędem 5, dopóki nie sprawdzisz schematu.**

### 12.2 Jak korygować własny błąd

1. **Popraw tam, gdzie mieszka ustalenie** — nie tylko w rozmowie. Dokument
   z nieprawdą przeżyje rozmowę.
2. **Zostaw ślad korekty**, nie ciche nadpisanie. Czytelnik musi wiedzieć, że
   wcześniejsza wersja mówiła inaczej.
3. **Nazwij skutek dla decyzji.** „To był błąd" bez „a to zmienia rekomendację
   o tyle" jest bezużyteczne.
4. **Nie rozwodź się.** Jedno zdanie o pomyłce, reszta o konsekwencji.

## 13. Dyscyplina zakresu

### 13.1 Nie gonimy parytetu

Budujemy pod listę wymagań właściciela, nie pod to, co robi cudze gotowe
rozwiązanie w tej samej przestrzeni. **Gonienie parytetu funkcja po funkcji
zamienia projekt krótki w projekt wielokrotnie dłuższy.** Funkcja
nierealizująca żadnego wymagania ani kryterium **nie wchodzi** — idzie do
dziennika decyzji jako rozważona i odrzucona.

### 13.2 Czego dany projekt świadomie nie robi

Każdy projekt ma spisaną wprost listę rzeczy, których świadomie nie robi, choć
mógłby — razem z krótkim uzasadnieniem. Bez niej granica projektu żyje wyłącznie
w pamięci jednej osoby i zaciera się przy każdej kolejnej prośbie „skoro już
przy tym jesteśmy". Lista rośnie, gdy pojawi się kolejna rzecz świadomie
rozważona i odrzucona (§13.1) — nigdy jako spis z góry wszystkiego, czego
teoretycznie projekt mógłby nie robić.

**Temat naruszający którykolwiek punkt tej listy wymaga pytania ABC, nie decyzji
Operatora.**

### 13.3 Rozjazd w trakcie tematu

Gdy pojawi się pomysł spoza `GOAL` — **zapisz go jako nowy temat w rejestrze
i wróć do swojego.** Nie poszerzaj allowlisty w biegu.

## 14. Ujawnianie wyborów zwykłym językiem

Gdy pojawi się wybór dotyczący danych, kosztu, prywatności, przenośności,
wdrożenia lub utrzymania — **nie podejmuj go po cichu w kodzie.** Przedstaw
właścicielowi: dwie lub trzy realne opcje zwykłym językiem, rekomendację
z jednym zdaniem uzasadnienia, oraz **co staje się łatwiejsze, a co trudniejsze
do zmiany później**. Ostatni punkt jest najważniejszy i najczęściej pomijany —
właściciel podejmuje decyzje o odwracalności, nie o składni.

### Rejestr języka w tekstach dla właściciela

| Zakaz | Zamiast tego |
|---|---|
| Nazwa narzędzia albo biblioteki w zdaniu głównym | co to daje projektowi |
| Numer paragrafu, ID tematu, ścieżka pliku w treści | odnośnik na końcu akapitu |
| Skrót bez rozwinięcia przy pierwszym użyciu | pełne określenie, skrót w nawiasie |
| „Zaimplementujemy", „skonfigurujemy" | co się zmieni w tym, co widać |

Sprawdzian: **usuń z tekstu wszystkie nazwy własne narzędzi. Jeśli zdanie
przestaje cokolwiek znaczyć — było napisane o mechanizmie, nie o skutku.**

To nie dotyczy dokumentacji technicznej ani tego skilla — te są dla agentów
i dla osoby technicznej, więc żargon jest tam właściwy.

## 15. Konwencje

### 15.1 Zapis punktu kontrolnego

Każdy commit niesie: krótki opis w pierwszym wierszu (`<obszar>: <co się
zmienia>`), w treści **co i dlaczego**, nie jak, język zgodny z ustaleniem
projektu, i **nigdy identyfikatora modelu ani nazwy narzędzia wykonawcy**
w zapisie trafiającym do historii repozytorium.

### 15.2 Miejsce docelowe deploy/push

Wyłącznie tam, gdzie wskazał właściciel (granica nienaruszalna, §7). **Nie
zakładaj domyślnej gałęzi.** Miejsce docelowe jest zapisane w punkcie startowym
projektu; jeśli go tam nie ma albo wygląda na nieaktualne — zapytaj, nie zgaduj.

### 15.3 Materiały źródłowe i notatki zamrożone

Materiały cudzego pochodzenia **nie są modyfikowane**. Notatki decyzyjne, raz
zapisane, są zamrożone — nie aktualizuj ich, gdy ustalenie się zmieni; zmienia
się dziennik decyzji i specyfikacja. Notatka pokazuje, co wiedziano wtedy,
i to jest jej wartość.

## 16. Wzorzec promptu dla subagenta

**Stosuje się, gdy wykonawcą jest program.** Pola odpowiadają matrycy z §11.3.3.

```text
KONTEKST PROJEKTU
Przeczytaj obowiązkowo, w kolejności ustalonej dla tego projektu:
<pliki startowe tego projektu>, <specyfikacja bieżącego zakresu>
<jedno zdanie: czym ten projekt jest, a czym świadomie nie jest>

TWOJA ROLA: Operator | Evaluator | Final Control
TEMAT:      <PEŁNE ID>[-<litera węzła>]
RUNDA:      <n>/<limit>

ZADANIE
<wąski zakres, jedno zdanie — co ma być prawdą po zakończeniu>

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
<konkretny sposób oszukania siebie, którego zakazujemy — patrz §11.3.3>

BINARNE KRYTERIUM SUKCESU
<sprawdzalne PRAWDA/FAŁSZ; twój wynik zostanie wobec niego zweryfikowany>
Dodatkowo: <nazwane sprawdzenia z rejestru kryteriów> muszą przechodzić.

ALLOWLISTA
<pozycje, per plik/katalog>
Zakazane bezwzględnie: pliki z wartościami sekretów, dziennik decyzji
właściciela, wewnętrzne katalogi systemu kontroli wersji.

IZOLACJA
<worktree i gałąź bazowa — jawnie, nie „od domyślnej">

PROCEDURA NAPRAWCZA PRZY FAIL
<co dokładnie robi Evaluator i co wraca do Operatora>

OGRANICZENIA WYJŚCIA
- maksymalnie {limit-objetosci-raportu} (§9.1)
- destylat, nie surowe dane: ścieżki i SHA zamiast diffu, wynik bramki
  zamiast pełnego logu
- nie edytujesz plików spoza allowlisty
- przy decyzji produktowej zatrzymujesz się ze statusem DECISION_REQUIRED

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
```

### 16.1 Czego w prompcie nie może zabraknąć

| Pole | Co się dzieje przy braku |
|---|---|
| Reguła przeciw samooszukiwaniu | wykonawca wypełni lukę domysłem i nie zauważy, że zgaduje |
| Binarne kryterium | Evaluator nie ma wobec czego orzekać, ocena robi się uznaniowa |
| Limit objętości | do syntezy trafiają surowe dane i zatruwają kontekst orkiestratora |
| Allowlista | zmiana wychodzi poza zakres tematu, integracja staje się ryzykowna |
| Kolejność czytania | agent zaczyna od przypadkowego pliku i buduje na nieaktualnym stanie |
| Izolacja z jawną bazą | agent pracuje na gałęzi o kilka fal wstecz i „gubi" cudzą pracę |

## 17. Rozpoznanie dziedziny — zanim zapytasz o liczby

Przy **uruchamianiu procesu w nowym projekcie** (nie przy każdym temacie) zadaj
właścicielowi te pytania — wszystkie naraz, w jednej wiadomości, zwykłym
językiem, zgodnie z testem zrozumiałości z §8.1. Odpowiedzi zapisuje się
dosłownie, tak jak padły.

| # | O co pytasz | Co z tego zapisujesz |
|---|---|---|
| 1 | Kto faktycznie wykonuje zlecenia — ludzie, programy, jedno i drugie? | rozstrzyga, czy pytanie §19.1 (model/effort) w ogóle ma zastosowanie |
| 2 | Ile trwa typowy krok pracy, zanim wykonawca da znać o postępie? | podstawa progu `ZWIS` (§10) |
| 3 | Co dokładnie ma powstać na koniec jednego zlecenia? | pojęcie „wytwór" |
| 4 | Co konkretnie sprawdzasz, żeby uznać pracę za zrobioną dobrze, a nie tylko wyglądającą na gotową? | pojęcie „dowód wykonania" — **najważniejsze pytanie całego zestawu** |
| 5 | Czy wynik sprawdza ktoś inny niż wykonawca, i jak to wygląda? | „sprawdzenie niezależne"; odpowiedź „nikt" nie zamyka pytania — jest brakiem do wypełnienia, nie ustaleniem |
| 6 | Co rozstrzyga spór o fakt: jaki dokument, jakie źródło? | hierarchia źródeł (§12.1) |
| 7 | Gdzie leży praca, dopóki jest szkicem, i po czym poznać, że zaczęła obowiązywać? | „miejsce pracy roboczej" i „wersja obowiązująca" |
| 8 | Czy da się cofnąć zmianę po tym, jak zacznie obowiązywać — jak i jak szybko? | „odwracalność" — ile ostrożności wymaga dany rodzaj zmiany |
| 9 | Czyja zgoda jest konieczna, zanim wynik wyjdzie na zewnątrz? | „osoba zatwierdzająca" |
| 10 | Czego nie wolno naruszyć nigdy, choćby reszta pracy była bez zarzutu? | lista granic nienaruszalnych (§7) |
| 11 | Co narzuca prawo albo umowa? | uzupełnienie §7 |
| 12 | Które dane są wrażliwe i gdzie nie wolno ich wynosić? | uzupełnienie §7 |
| 13 | Jakie są realne skutki błędu wykrytego po czasie i kto za nie odpowiada? | jak wysoko ustawić ostrożność przy niepewnych decyzjach |

Odpowiedź niepełna — „tak jakoś to sprawdzamy" bez wskazania, po czym poznać,
że coś jest sprawdzone — **nie jest odpowiedzią** i pytanie zostaje otwarte.

Proces nazywa **funkcję** pojęcia; jego **postać** ustalają odpowiedzi powyżej.
Wchodząc w nieznaną dziedzinę zadaj sobie: co jest tu wytworem, a co tylko
relacją o wytworze; czym sprawdzenie różni się od powtórzenia tej samej
czynności przez tę samą osobę; co jest nieodwracalne i kto ma prawo to naruszyć.

## 18. Kalibracja liczb

Zadawane **po** §17, wszystkie naraz. Właściciel odpowiada literą przy każdym
numerze. Odpowiedź „chyba B", „coś pomiędzy" nie jest decyzją.

| # | Parametr | O co pytasz |
|---|---|---|
| 1 | {model-wykonawcy}, {model-sprawdzajacego}, {model-kontroli-koncowej}, {poziom-wysilku-mysleniowego} | jeden tańszy model dla wszystkich ról / jeden najmocniejszy dla wszystkich / zróżnicowane: tańszy do wykonania, mocniejszy do sprawdzenia — pytanie dotyczy wprost kosztu każdego zlecenia |
| 2 | {liczba-podejsc-przed-eskalacja} | po ilu nieudanych podejściach temat wraca do właściciela zamiast być poprawiany dalej |
| 3 | {liczba-tematow-rownoleglych} | ile tematów może być w pracy naraz, zanim przegląd przestaje być rzetelny |
| 4 | {czas-do-uznania-zawieszenia} | po jakim czasie ciszy uznajemy wykonawcę za zawieszonego |
| 5 | {miejsce-pracy-roboczej}, {wzor-nazwy-przestrzeni-roboczej} | gdzie powstaje wersja robocza i dokąd trafia po zatwierdzeniu — **jedyne pytanie bez bezpiecznej wartości domyślnej**; bez odpowiedzi praca nie rusza |
| 6 | {jezyk-dokumentacji-i-procesu} | w jakim języku powstają zlecenia, raporty i zapisy decyzji |

Nazwy techniczne, pola danych, ścieżki i identyfikatory zostają **po angielsku,
bez znaków diakrytycznych**, niezależnie od wybranego języka dokumentacji — to
konwencja techniczna, nie wybór właściciela.

Wypełnioną tabelę parametrów zapisz w skillu projektowym **przed** pierwszym
tematem, nie po.

## 19. Dokumenty procesu — osiem funkcji

Każdy projekt potrzebuje dokumentów pełniących te osiem funkcji. Brak którejś
nie jest oszczędnością — jest dziurą, która ujawni się wtedy, gdy będzie
kosztować najwięcej. Nazwy i lokalizacje są parametrem projektu.

| # | Funkcja | Co się psuje, gdy jej brak |
|---|---|---|
| 1 | punkt wejścia i kolejność czytania | każdy buduje własny, inny obraz stanu sprawy |
| 2 | tryb bezpiecznej zmiany samego procesu | pierwsza niewygodna reguła znika po cichu przy pierwszym napiętym terminie |
| 3 | rejestr tematów ze stanem | tematy dublują się; zablokowany wygląda jak porzucony |
| 4 | zdjęcie bieżącej sytuacji (handoff) | każde przejęcie zaczyna się od odtwarzania kontekstu ze strzępów |
| 5 | dosłowny zapis decyzji właściciela (ECHO) | rekomendacja agenta z czasem zaczyna uchodzić za decyzję właściciela |
| 6 | dziennik wyborów trwałych z uzasadnieniem | wraca się co jakiś czas do drogi już świadomie odrzuconej |
| 7 | rejestr kryteriów / sytuacji do obsłużenia | „zrobione" staje się deklaracją bez odniesienia |
| 8 | zapis pojedynczego zlecenia sprzed startu wykonawcy | zakres staje się tym, co wykonawca akurat zrobił |

Kolejność zakładania: 1 → 2 → 3 → 6 → 7 → szablon 8 → 5 → 4. Plik pojedynczego
zlecenia powstaje **wyłącznie w chwili konkretnego dispatchu**, nigdy na zapas.

Każdy z ośmiu dokumentów ma jedno z trzech oznaczeń, rozstrzygające, kiedy ma
powstać: **OBOWIĄZKOWY** — istnieje z realną treścią od pierwszego dnia, bo bez
niego nic innego nie da się ani znaleźć, ani zlecić (funkcje 1, 2 oraz szablon
z funkcji 8); **ROSNĄCY** — zakładany na starcie jako pusty szkielet z nagłówkami,
wypełniany w miarę pracy (funkcje 3–7); **HISTORYCZNY** — powstaje wyłącznie jako
skutek konkretnej pracy, nigdy na zapas (pojedynczy zapis zlecenia z funkcji 8).

Pusty plik założony na zapas szkodzi z jednego powodu: tworzy złudzenie, że
struktura jest kompletna, podczas gdy nikt jej nie wypełnił treścią. Różnica między
„plik istnieje" a „informacja jest znana" znika z pola widzenia — a to właśnie ta
różnica ma być widoczna przez cały czas trwania projektu.

### Czego nie zakładać na starcie

- Plików zleceń na zapas — sugerują, że zadanie zamówiono, zanim je zamówiono.
- Kategorii sytuacji, których nikt jeszcze nie zaobserwował — fałszywa struktura
  jest gorsza niż jej brak, bo trzeba ją najpierw obalić.
- Wpisów „przykładowych" w rejestrach — bywają później czytane jako prawdziwe.
- Warstw procesu ponad te osiem funkcji, zanim brak którejś faktycznie zaboli.
- Treści bez pokrycia w rozmowie z właścicielem: czego nie ustalono, tego się
  nie wpisuje jako ustalone.

---

## Pochodzenie

Ten szkielet wywodzi się z uniwersalnego dokumentu procesu AutoBot
dostarczonego przez właściciela (2026-08-23), napisanego pierwotnie jako
domenowo-neutralny wzorzec z osobnym wypełnieniem dla innego, referencyjnego
projektu. Świadomie **pominięto** z oryginału: rozbudowane tabele odwzorowania
pojęć na dziedziny spoza wytwarzania oprogramowania (księgowość, kancelaria,
marketing, produkcja) oraz gotowe szkielety dokumentów wypełnione przykładami
z tamtych branż — dla projektu jednego właściciela pracującego nad grą wideo
z subagentami AI jako wykonawcami są balastem, nie treścią. Zachowano całą
warstwę zasad i parametrów.

Konkretne wiązania — ścieżki plików, modele, liczby, twarde bariery — dla
projektu Civ „The Game" są w [`civ-autobot/SKILL.md`](../civ-autobot/SKILL.md)
i `docs/decyzje/R-PROC-AUTOBOT.md`, nie tutaj.
